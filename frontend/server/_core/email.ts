import { config as loadEnv } from "dotenv";
import net from "net";
import path from "path";
import tls from "tls";

loadEnv({ path: path.resolve(process.cwd(), "../backend/.env"), override: false });

type MailInput = {
  to: string;
  subject: string;
  text: string;
};

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure: boolean;
};

export type MailResult =
  | { sent: true }
  | { sent: false; reason: "missing_config" | "smtp_error"; error?: string };

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || user;
  const port = Number(process.env.SMTP_PORT || "587");

  if (!host || !user || !pass || !from || Number.isNaN(port)) {
    return null;
  }

  return {
    host,
    port,
    user,
    pass,
    from,
    secure:
      process.env.SMTP_SECURE === "true" ||
      process.env.SMTP_SECURE === "1" ||
      port === 465,
  };
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64");
}

function escapeData(value: string) {
  return value.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
}

function createSmtpClient(socket: net.Socket | tls.TLSSocket) {
  let activeSocket = socket;
  let buffer = "";

  const readResponse = () =>
    new Promise<string>((resolve, reject) => {
      const onData = (chunk: Buffer) => {
        buffer += chunk.toString("utf8");
        const lines = buffer.split(/\r?\n/).filter(Boolean);
        const last = lines[lines.length - 1];

        if (last && /^\d{3} /.test(last)) {
          activeSocket.off("data", onData);
          activeSocket.off("error", onError);
          const response = buffer;
          buffer = "";
          resolve(response);
        }
      };

      const onError = (error: Error) => {
        activeSocket.off("data", onData);
        reject(error);
      };

      activeSocket.on("data", onData);
      activeSocket.once("error", onError);
    });

  const sendCommand = async (command: string, expected: number | number[]) => {
    const expectedCodes = Array.isArray(expected) ? expected : [expected];
    activeSocket.write(`${command}\r\n`);
    const response = await readResponse();
    const code = Number(response.slice(0, 3));
    if (!expectedCodes.includes(code)) {
      throw new Error(`SMTP command failed with ${code}`);
    }
    return response;
  };

  const upgradeToTls = async (host: string) => {
    activeSocket = tls.connect({
      socket: activeSocket,
      servername: host,
    });

    await new Promise<void>((resolve, reject) => {
      activeSocket.once("secureConnect", resolve);
      activeSocket.once("error", reject);
    });
    buffer = "";
  };

  const end = () => activeSocket.end();

  return { readResponse, sendCommand, upgradeToTls, end };
}

export async function sendMail(input: MailInput): Promise<MailResult> {
  const config = getSmtpConfig();
  if (!config) {
    return { sent: false, reason: "missing_config" };
  }

  const socket = config.secure
    ? tls.connect({ host: config.host, port: config.port, servername: config.host })
    : net.connect({ host: config.host, port: config.port });

  const smtp = createSmtpClient(socket);

  try {
    await new Promise<void>((resolve, reject) => {
      socket.once(config.secure ? "secureConnect" : "connect", resolve);
      socket.once("error", reject);
      socket.setTimeout(15000, () => reject(new Error("SMTP connection timed out")));
    });

    await smtp.readResponse();
    const ehlo = await smtp.sendCommand("EHLO pragati.local", 250);

    if (!config.secure && /STARTTLS/i.test(ehlo)) {
      await smtp.sendCommand("STARTTLS", 220);
      await smtp.upgradeToTls(config.host);
      await smtp.sendCommand("EHLO pragati.local", 250);
    }

    await smtp.sendCommand("AUTH LOGIN", 334);
    await smtp.sendCommand(encode(config.user), 334);
    await smtp.sendCommand(encode(config.pass), 235);
    await smtp.sendCommand(`MAIL FROM:<${config.from}>`, 250);
    await smtp.sendCommand(`RCPT TO:<${input.to}>`, [250, 251]);
    await smtp.sendCommand("DATA", 354);

    const message = [
      `From: PRAGATI <${config.from}>`,
      `To: ${input.to}`,
      `Subject: ${input.subject}`,
      `Date: ${new Date().toUTCString()}`,
      "MIME-Version: 1.0",
      'Content-Type: text/plain; charset="UTF-8"',
      "",
      escapeData(input.text),
      ".",
    ].join("\r\n");

    await smtp.sendCommand(message, 250);
    await smtp.sendCommand("QUIT", 221);
    smtp.end();
    return { sent: true };
  } catch (error) {
    smtp.end();
    return {
      sent: false,
      reason: "smtp_error",
      error: error instanceof Error ? error.message : "Unknown SMTP error",
    };
  }
}

import { config as loadEnv } from "dotenv";
import net from "net";
import path from "path";
import tls from "tls";

loadEnv({ path: path.resolve(process.cwd(), "../backend/.env"), override: false });

type MailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
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
  let pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || user;
  const port = Number(process.env.SMTP_PORT || "587");

  if (!host || !user || !pass || !from || Number.isNaN(port)) {
    return null;
  }

  pass = pass.replace(/^["']|["']$/g, "").trim();
  if (host.includes("gmail.com")) {
    pass = pass.replace(/\s+/g, "");
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
      throw new Error(`SMTP command failed with ${code}: ${response.trim()}`);
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
    console.warn("[SMTP Client] Missing or incomplete SMTP configuration:", {
      hasHost: !!process.env.SMTP_HOST,
      hasUser: !!process.env.SMTP_USER,
      hasPass: !!process.env.SMTP_PASS,
      port: process.env.SMTP_PORT,
    });
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
    const envelopeSender = config.host.includes("gmail.com") ? config.user : config.from;
    await smtp.sendCommand(`MAIL FROM:<${envelopeSender}>`, 250);
    await smtp.sendCommand(`RCPT TO:<${input.to}>`, [250, 251]);
    await smtp.sendCommand("DATA", 354);

    const boundary = `----=_Part_${Date.now()}`;
    const message = input.html
      ? [
          `From: PRAGATI Platform <${envelopeSender}>`,
          `Reply-To: ${config.from}`,
          `To: ${input.to}`,
          `Subject: ${input.subject}`,
          `Date: ${new Date().toUTCString()}`,
          "MIME-Version: 1.0",
          `Content-Type: multipart/alternative; boundary="${boundary}"`,
          "",
          `--${boundary}`,
          'Content-Type: text/plain; charset="UTF-8"',
          "",
          escapeData(input.text),
          "",
          `--${boundary}`,
          'Content-Type: text/html; charset="UTF-8"',
          "",
          escapeData(input.html),
          "",
          `--${boundary}--`,
          ".",
        ].join("\r\n")
      : [
          `From: PRAGATI Platform <${envelopeSender}>`,
          `Reply-To: ${config.from}`,
          `To: ${input.to}`,
          `Subject: ${input.subject}`,
          `Date: ${new Date().toUTCString()}`,
          "MIME-Version: 1.0",
          'Content-Type: text/plain; charset="UTF-8"',
          "",
          escapeData(input.text),
          ".",
        ].join("\r\n");

    const result = await smtp.sendCommand(message, 250);
    console.log(`[SMTP Client] Email successfully delivered to ${input.to}:`, result.trim());
    await smtp.sendCommand("QUIT", 221);
    smtp.end();
    return { sent: true };
  } catch (error) {
    console.error(`[SMTP Client Error] Failed to send email to ${input.to}:`, error);
    smtp.end();
    return {
      sent: false,
      reason: "smtp_error",
      error: error instanceof Error ? error.message : "Unknown SMTP error",
    };
  }
}

export interface WelcomeEmailParams {
  name: string;
  toEmail: string;
  role: "STUDENT" | "FACULTY";
  identifier: string;
  tempPassword: string;
  loginUrl?: string;
}

export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<MailResult> {
  const isDemo =
    params.toEmail.toLowerCase().endsWith("@northstar.edu") ||
    params.toEmail.toLowerCase().includes("demo");

  let recipient = params.toEmail;
  let subject = `Welcome to PRAGATI - Your Institutional Credentials`;

  if (isDemo) {
    const demoCatchAll = process.env.DEMO_NOTIFICATION_EMAIL;
    if (demoCatchAll) {
      recipient = demoCatchAll;
      subject = `[DEMO TEST] ${subject} (${params.toEmail})`;
      console.log(`[Demo Catch-All Intercepted]: ${params.toEmail} -> Rerouted to ${demoCatchAll}`);
    } else {
      console.log(`[Demo Mail Simulated (No DEMO_NOTIFICATION_EMAIL configured)]: ${subject} -> ${params.toEmail}`);
      return { sent: true };
    }
  }

  const idLabel = params.role === "STUDENT" ? "Enrollment Number (PRN)" : "Employee ID";
  const loginUrl = params.loginUrl || process.env.VITE_APP_URL || "http://localhost:3000/login";

  const text = `Hello ${params.name},

Welcome to PRAGATI (Platform for Real-time Assessment, Governance, Academic Tracking & Institutional Intelligence).

Your account has been officially approved and provisioned:
Role: ${params.role}
${idLabel}: ${params.identifier}
Login Email: ${params.toEmail}
Temporary Password: ${params.tempPassword}

Access Portal: ${loginUrl}

Security Notice:
Upon your first login, you will be required to change your temporary password.

Regards,
PRAGATI Institutional Governance Desk`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 700;">PRAGATI</h1>
        <p style="color: #64748b; margin: 4px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Student Intelligence & Institutional Governance</p>
      </div>
      <p style="color: #1e293b; font-size: 14px;">Hello <strong>${params.name}</strong>,</p>
      <p style="color: #475569; font-size: 14px; line-height: 1.5;">Your account has been officially approved and provisioned in the PRAGATI portal. Below are your temporary credentials for initial access:</p>
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px; font-size: 13px; color: #475569;"><strong>Role:</strong> <span style="color: #4f46e5; font-weight: 600;">${params.role}</span></p>
        <p style="margin: 0 0 8px; font-size: 13px; color: #475569;"><strong>${idLabel}:</strong> ${params.identifier}</p>
        <p style="margin: 0 0 8px; font-size: 13px; color: #475569;"><strong>Login Email:</strong> ${params.toEmail}</p>
        <p style="margin: 0; font-size: 13px; color: #475569;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 14px; color: #0f172a;">${params.tempPassword}</code></p>
      </div>

      <p style="color: #dc2626; font-size: 12px; margin: 16px 0;"><strong>Security Requirement:</strong> You will be required to change your temporary password upon first login before accessing your dashboard.</p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${loginUrl}" style="background: #4f46e5; color: #ffffff; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">Log in to PRAGATI Portal</a>
      </div>

      <p style="color: #94a3b8; font-size: 11px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">This is an automated institutional message. If you have questions, please contact your College Administrator.</p>
    </div>
  `;

  return sendMail({
    to: recipient,
    subject,
    text,
    html,
  });
}

export async function sendSuperAdminOtpEmail(toEmail: string, otp: string): Promise<MailResult> {
  const subject = "PRAGATI Super Admin two-factor verification code";
  const text = `Your PRAGATI Super Admin verification code is ${otp}.\n\nThis code expires in 10 minutes and can be used only once. If you did not request this code, secure your account immediately.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0;">
      <h2 style="margin: 0 0 12px; color: #0f172a;">Super Admin verification</h2>
      <p style="color: #475569;">Enter this one-time code to finish signing in to the PRAGATI governance portal:</p>
      <p style="font: 700 32px monospace; letter-spacing: 8px; color: #4f46e5; text-align: center;">${otp}</p>
      <p style="font-size: 12px; color: #64748b;">The code expires in 10 minutes and is limited to one use.</p>
    </div>
  `;

  return sendMail({ to: toEmail, subject, text, html });
}


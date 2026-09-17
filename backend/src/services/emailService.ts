import net from "net";
import tls from "tls";

export type EmailTemplate =
  | "ACCOUNT_WELCOME"
  | "FIRST_LOGIN_RESET"
  | "PASSWORD_RESET_OTP"
  | "TWO_FACTOR_OTP"
  | "EMAIL_CHANGE_VERIFY";

export interface SendInstitutionalEmailParams {
  toEmail: string;
  isDemoAccount?: boolean;
  subject: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
}

export interface EmailDispatchResult {
  status: "SENT" | "SIMULATED_SUCCESS" | "FAILED";
  recipient: string;
  subject: string;
  error?: string;
  intercepted?: boolean;
}

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure: boolean;
}

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

function encodeBase64(value: string) {
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
      throw new Error(`SMTP command failed with status ${code}: ${response.trim()}`);
    }
    return response;
  };

  const upgradeToTls = async (host: string) => {
    activeSocket = tls.connect({
      socket: activeSocket,
      servername: host,
    });

    await new Promise<void>((resolve, reject) => {
      activeSocket.once("secureConnect", () => resolve());
      activeSocket.once("error", reject);
    });
    buffer = "";
  };

  const end = () => activeSocket.end();

  return { readResponse, sendCommand, upgradeToTls, end };
}

// ============================================================================
// TEMPLATE RENDERER
// ============================================================================

export function renderEmailTemplate(
  template: EmailTemplate,
  data: Record<string, unknown>
): { subject: string; text: string; html: string } {
  switch (template) {
    case "ACCOUNT_WELCOME": {
      const name = String(data.name || "Student / Faculty");
      const tempPassword = String(data.tempPassword || "TempPass@123");
      const role = String(data.role || "STUDENT");
      const loginUrl = String(data.loginUrl || "https://pragati.edu/login");
      const idLabel = role === "STUDENT" ? "Enrollment Number (PRN)" : "Employee ID";
      const identifier = String(data.identifier || data.enrollmentNumber || data.employeeId || "Assigned on Portal");

      const subject = `Welcome to PRAGATI - Your Institutional Credentials`;
      const text = `Hello ${name},\n\nWelcome to PRAGATI (Platform for Real-time Assessment, Governance, Academic Tracking & Institutional intelligence).\n\nYour account has been hierarchically provisioned:\nRole: ${role}\n${idLabel}: ${identifier}\nTemporary Password: ${tempPassword}\n\nLogin Portal: ${loginUrl}\n\nUpon your first login, you will be required to change your temporary password.\n\nRegards,\nPRAGATI Institutional Administration`;

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #4f46e5; margin: 0; font-size: 24px;">PRAGATI</h1>
            <p style="color: #64748b; margin: 4px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Student Intelligence & Institutional Governance</p>
          </div>
          <p style="color: #1e293b; font-size: 14px;">Hello <strong>${name}</strong>,</p>
          <p style="color: #475569; font-size: 14px; line-height: 1.5;">Your account has been provisioned and verified by your institution. Below are your temporary credentials for initial access:</p>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #475569;"><strong>Role:</strong> <span style="color: #4f46e5;">${role}</span></p>
            <p style="margin: 0 0 8px; font-size: 13px; color: #475569;"><strong>${idLabel}:</strong> ${identifier}</p>
            <p style="margin: 0; font-size: 13px; color: #475569;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 14px; color: #0f172a;">${tempPassword}</code></p>
          </div>

          <p style="color: #dc2626; font-size: 12px; margin: 16px 0;"><strong>Security Requirement:</strong> You will be strictly required to set a new permanent password on your first login before accessing your dashboard.</p>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${loginUrl}" style="background: #4f46e5; color: #ffffff; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">Log in to PRAGATI Portal</a>
          </div>

          <p style="color: #94a3b8; font-size: 11px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">This is an automated institutional message. If you did not expect this communication, please contact your College Administrator.</p>
        </div>
      `;
      return { subject, text, html };
    }

    case "FIRST_LOGIN_RESET": {
      const name = String(data.name || "User");
      const timestamp = new Date().toLocaleString();
      const subject = `Security Notice: PRAGATI Password Updated`;
      const text = `Hello ${name},\n\nYour temporary PRAGATI password was successfully retired and your new permanent password has been set as of ${timestamp}.\n\nIf you did not perform this action, please contact your Platform Administrator immediately.\n\nRegards,\nPRAGATI Security Operations`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #10b981; margin: 0 0 12px;">Password Successfully Updated</h2>
          <p style="color: #475569; font-size: 14px;">Hello <strong>${name}</strong>,</p>
          <p style="color: #475569; font-size: 14px; line-height: 1.5;">Your initial temporary password has been successfully replaced with your permanent credentials on <strong>${timestamp}</strong>.</p>
          <p style="color: #475569; font-size: 14px;">Your account is now fully active with multi-tier access enabled.</p>
          <p style="color: #dc2626; font-size: 12px;">If you did not initiate this change, contact your college administration immediately.</p>
        </div>
      `;
      return { subject, text, html };
    }

    case "PASSWORD_RESET_OTP": {
      const otp = String(data.otp || "000000");
      const subject = `PRAGATI Password Reset Code: ${otp}`;
      const text = `Your one-time password reset verification code is: ${otp}\n\nThis code is valid for 10 minutes. If you did not request this, please ignore this email.`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #4f46e5; margin: 0 0 12px;">Password Reset Verification</h2>
          <p style="color: #475569; font-size: 14px;">Use the 6-digit one-time code below to complete your password reset:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #4f46e5; background: #e0e7ff; padding: 8px 16px; border-radius: 8px;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 12px;">This code expires in 10 minutes. Do not share this code with anyone.</p>
        </div>
      `;
      return { subject, text, html };
    }

    case "TWO_FACTOR_OTP": {
      const otp = String(data.otp || "000000");
      const subject = `Your PRAGATI Two-Factor Security Code: ${otp}`;
      const text = `Your 6-digit PRAGATI two-factor verification code is: ${otp}\n\nThis code expires in 10 minutes. Required to finalize authorization.`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #4f46e5; margin: 0 0 12px;">Two-Factor Authentication (2FA)</h2>
          <p style="color: #475569; font-size: 14px;">A sign-in request requires high-security verification. Enter this code into your portal:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #4f46e5; background: #e0e7ff; padding: 8px 16px; border-radius: 8px;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 12px;">Valid for 10 minutes. Never disclose this security code.</p>
        </div>
      `;
      return { subject, text, html };
    }

    case "EMAIL_CHANGE_VERIFY": {
      const code = String(data.code || "000000");
      const subject = `Verify Your New PRAGATI Institutional Email`;
      const text = `Please verify your new email address by entering verification code: ${code}`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #4f46e5; margin: 0 0 12px;">Email Verification</h2>
          <p style="color: #475569; font-size: 14px;">Verification code for updating your institutional email address:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #4f46e5; background: #e0e7ff; padding: 8px 16px; border-radius: 8px;">${code}</span>
          </div>
        </div>
      `;
      return { subject, text, html };
    }
  }
}

// ============================================================================
// MAIN DISPATCHER WITH DEMO CATCH-ALL & SIMULATION FALLBACK
// ============================================================================

export async function sendInstitutionalEmail(
  params: SendInstitutionalEmailParams
): Promise<EmailDispatchResult> {
  const isDemo =
    params.isDemoAccount ||
    params.toEmail.toLowerCase().endsWith("@northstar.edu") ||
    params.toEmail.toLowerCase().includes("demo");

  let targetRecipient = params.toEmail;
  let intercepted = false;

  // 1. Demo Catch-All Logic
  if (isDemo) {
    const demoCatchAll = process.env.DEMO_NOTIFICATION_EMAIL;
    if (demoCatchAll) {
      targetRecipient = demoCatchAll;
      intercepted = true;
      console.log(`[Demo Catch-All Intercepted]: ${params.toEmail} -> Rerouted to ${demoCatchAll}`);
    } else {
      console.log(`[Demo Mail Simulated (No DEMO_NOTIFICATION_EMAIL configured)]: ${params.subject} -> ${params.toEmail}`);
      return {
        status: "SIMULATED_SUCCESS",
        recipient: params.toEmail,
        subject: params.subject,
        intercepted: true,
      };
    }
  }

  const { subject, text, html } = renderEmailTemplate(params.template, params.data);
  const finalSubject = intercepted ? `[DEMO TEST] ${subject}` : subject;

  // 2. Check SMTP Config
  const config = getSmtpConfig();
  if (!config || process.env.NODE_ENV === "test") {
    // Graceful simulated dispatch for tests and environments without live SMTP keys
    console.log(`[SMTP Dispatch Simulated]: ${finalSubject} to ${targetRecipient}`);
    return {
      status: "SIMULATED_SUCCESS",
      recipient: targetRecipient,
      subject: finalSubject,
      intercepted,
    };
  }

  // 3. Live Socket / TLS Dispatch
  try {
    const socket = config.secure
      ? tls.connect({ host: config.host, port: config.port, servername: config.host })
      : net.connect({ host: config.host, port: config.port });

    const smtp = createSmtpClient(socket);

    await new Promise<void>((resolve, reject) => {
      socket.once(config.secure ? "secureConnect" : "connect", () => resolve());
      socket.once("error", reject);
      socket.setTimeout(12000, () => reject(new Error("SMTP connection timed out")));
    });

    await smtp.readResponse();
    const ehlo = await smtp.sendCommand("EHLO pragati.local", 250);

    if (!config.secure && /STARTTLS/i.test(ehlo)) {
      await smtp.sendCommand("STARTTLS", 220);
      await smtp.upgradeToTls(config.host);
      await smtp.sendCommand("EHLO pragati.local", 250);
    }

    await smtp.sendCommand("AUTH LOGIN", 334);
    await smtp.sendCommand(encodeBase64(config.user), 334);
    await smtp.sendCommand(encodeBase64(config.pass), 235);
    await smtp.sendCommand(`MAIL FROM:<${config.from}>`, 250);
    await smtp.sendCommand(`RCPT TO:<${targetRecipient}>`, [250, 251]);
    await smtp.sendCommand("DATA", 354);

    const boundary = `----=_Part_${Date.now()}`;
    const message = [
      `From: PRAGATI Platform <${config.from}>`,
      `To: ${targetRecipient}`,
      `Subject: ${finalSubject}`,
      `Date: ${new Date().toUTCString()}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "",
      escapeData(text),
      "",
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "",
      escapeData(html),
      "",
      `--${boundary}--`,
      ".",
    ].join("\r\n");

    await smtp.sendCommand(message, 250);
    await smtp.sendCommand("QUIT", 221);
    smtp.end();

    return {
      status: "SENT",
      recipient: targetRecipient,
      subject: finalSubject,
      intercepted,
    };
  } catch (error: any) {
    console.error(`[SMTP Error]: Failed to send to ${targetRecipient}:`, error?.message || error);
    return {
      status: "FAILED",
      recipient: targetRecipient,
      subject: finalSubject,
      error: error?.message || "Unknown SMTP error",
      intercepted,
    };
  }
}

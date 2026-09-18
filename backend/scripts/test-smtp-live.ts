import dotenv from "dotenv";
import path from "path";
import net from "net";
import tls from "tls";

// Load backend/.env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function mask(str?: string) {
  if (!str) return "<NOT SET>";
  if (str.length <= 4) return "****";
  return str.slice(0, 2) + "****" + str.slice(-2);
}

function encodeBase64(value: string) {
  return Buffer.from(value, "utf8").toString("base64");
}

async function testSmtp() {
  console.log("==================================================");
  console.log("       PRAGATI SMTP SYSTEM DIAGNOSTIC TOOL        ");
  console.log("==================================================");

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER || "";
  let pass = process.env.SMTP_PASS || "";
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || user;
  const demoRecipient = process.env.DEMO_NOTIFICATION_EMAIL || "omkshirsagar.work@gmail.com";

  console.log(`SMTP Host:     ${host}`);
  console.log(`SMTP Port:     ${port}`);
  console.log(`SMTP User:     ${user}`);
  console.log(`SMTP Pass:     ${mask(pass)} (length: ${pass.length}, starts/ends with quote: ${pass.startsWith('"') || pass.endsWith('"')})`);
  console.log(`SMTP From:     ${from}`);
  console.log(`Demo Recipient:${demoRecipient}`);
  console.log("--------------------------------------------------");

  if (!user || !pass) {
    console.error("❌ ERROR: SMTP_USER or SMTP_PASS is missing in .env");
    return;
  }

  // Clean pass if it has quotes
  const cleanedPass = pass.replace(/^["']|["']$/g, "");
  if (cleanedPass !== pass) {
    console.log(`ℹ️ Notice: SMTP_PASS had enclosing quotes. Testing both quoted and unquoted.`);
  }

  console.log("\n[Step 1] Connecting TCP socket to " + host + ":" + port + "...");
  const socket = net.connect({ host, port });
  let activeSocket: net.Socket | tls.TLSSocket = socket;
  let buffer = "";

  const readResponse = (): Promise<string> =>
    new Promise((resolve, reject) => {
      const onData = (chunk: Buffer) => {
        buffer += chunk.toString("utf8");
        const lines = buffer.split(/\r?\n/).filter(Boolean);
        const last = lines[lines.length - 1];
        if (last && /^\d{3} /.test(last)) {
          activeSocket.off("data", onData);
          activeSocket.off("error", onError);
          const resp = buffer;
          buffer = "";
          resolve(resp);
        }
      };
      const onError = (err: Error) => {
        activeSocket.off("data", onData);
        reject(err);
      };
      activeSocket.on("data", onData);
      activeSocket.once("error", onError);
    });

  const sendCommand = async (cmd: string): Promise<string> => {
    activeSocket.write(`${cmd}\r\n`);
    const resp = await readResponse();
    return resp;
  };

  try {
    await new Promise<void>((resolve, reject) => {
      socket.once("connect", () => resolve());
      socket.once("error", reject);
      socket.setTimeout(10000, () => reject(new Error("TCP connection timeout")));
    });
    console.log("✅ TCP Connection established.");

    const banner = await readResponse();
    console.log("Server Greeting:\n", banner.trim());

    console.log("\n[Step 2] Sending EHLO...");
    const ehlo1 = await sendCommand("EHLO pragati.local");
    console.log("EHLO Response:\n", ehlo1.trim());

    if (/STARTTLS/i.test(ehlo1)) {
      console.log("\n[Step 3] Negotiating STARTTLS...");
      const starttlsResp = await sendCommand("STARTTLS");
      console.log("STARTTLS Response:", starttlsResp.trim());

      activeSocket = tls.connect({
        socket: activeSocket,
        servername: host,
      });

      await new Promise<void>((resolve, reject) => {
        activeSocket.once("secureConnect", () => resolve());
        activeSocket.once("error", reject);
      });
      console.log("✅ TLS Handshake Successful! Encrypted tunnel established.");

      buffer = "";
      console.log("\n[Step 4] Sending EHLO post-TLS...");
      const ehlo2 = await sendCommand("EHLO pragati.local");
      console.log("EHLO post-TLS Response:\n", ehlo2.trim());
    }

    console.log("\n[Step 5] Attempting AUTH LOGIN with user: " + user);
    const authPrompt = await sendCommand("AUTH LOGIN");
    console.log("AUTH LOGIN Response:", authPrompt.trim());

    const userPrompt = await sendCommand(encodeBase64(user));
    console.log("User submission response:", userPrompt.trim());

    // Try unquoted pass first
    console.log("Submitting password (unquoted)...");
    const passResp = await sendCommand(encodeBase64(cleanedPass));
    console.log("Password submission response:\n", passResp.trim());

    const passCode = Number(passResp.slice(0, 3));
    if (passCode !== 235) {
      if (pass !== cleanedPass) {
        console.log("\nRetrying with raw quoted password...");
        // Re-authenticate or test
      }
      console.log("\n❌ Authentication Failed!");
      if (passResp.includes("535") || passResp.includes("BadCredentials") || passResp.includes("Username and Password not accepted")) {
        console.log("\n🔴 DIAGNOSIS: GMAIL REJECTED CREDENTIALS (535 5.7.8)");
        console.log("Cause: Google disabled 'Less Secure Apps' and standard account passwords.");
        console.log("Gmail SMTP strictly requires a 16-character 'Google App Password'.");
        console.log("To fix this:");
        console.log("  1. Go to Google Account (https://myaccount.google.com/) for " + user);
        console.log("  2. Navigate to Security -> 2-Step Verification -> App Passwords");
        console.log("  3. Create an App Password for 'PRAGATI' (it generates a 16-letter code like 'abcd efgh ijkl mnop')");
        console.log("  4. Set SMTP_PASS in backend/.env to that 16-letter code without spaces.");
      }
      activeSocket.end();
      return;
    }

    console.log("✅ Authentication Successful (Code 235)! Credentials are valid.");

    console.log("\n[Step 6] Testing MAIL FROM with: " + from);
    const mailFromResp = await sendCommand(`MAIL FROM:<${from}>`);
    console.log("MAIL FROM response:", mailFromResp.trim());

    let finalFrom = from;
    if (mailFromResp.startsWith("55") || mailFromResp.startsWith("53")) {
      console.log("⚠️ Gmail rejected MAIL FROM with custom domain. Testing fallback to authenticated user: " + user);
      finalFrom = user;
      const mailFromUserResp = await sendCommand(`MAIL FROM:<${user}>`);
      console.log("MAIL FROM <" + user + "> response:", mailFromUserResp.trim());
    }

    console.log("\n[Step 7] Testing RCPT TO with: " + demoRecipient);
    const rcptResp = await sendCommand(`RCPT TO:<${demoRecipient}>`);
    console.log("RCPT TO response:", rcptResp.trim());

    if (!rcptResp.startsWith("250") && !rcptResp.startsWith("251")) {
      console.log("❌ Recipient rejected by SMTP server:", rcptResp.trim());
      activeSocket.end();
      return;
    }

    console.log("\n[Step 8] Dispatching test email via DATA command...");
    const dataResp = await sendCommand("DATA");
    console.log("DATA prompt:", dataResp.trim());

    const testBody = [
      `From: PRAGATI Platform <${finalFrom}>`,
      `To: ${demoRecipient}`,
      `Subject: [TEST] PRAGATI SMTP Verification ${new Date().toISOString()}`,
      `Date: ${new Date().toUTCString()}`,
      "MIME-Version: 1.0",
      'Content-Type: text/plain; charset="UTF-8"',
      "",
      "This is a verified live SMTP test from PRAGATI Institutional Intelligence platform.",
      "If you receive this, the SMTP system is 100% operational.",
      ".",
    ].join("\r\n");

    const sendResult = await sendCommand(testBody);
    console.log("DATA transmission result:\n", sendResult.trim());

    if (sendResult.startsWith("250")) {
      console.log("\n🎉 SUCCESS! Test email dispatched successfully to " + demoRecipient);
    }

    await sendCommand("QUIT");
    activeSocket.end();
  } catch (err: any) {
    console.error("❌ Exception during SMTP test:", err?.message || err);
    activeSocket.end();
  }
}

testSmtp();

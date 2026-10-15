import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Parse Body
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  } else if (!body) {
    try {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      body = JSON.parse(Buffer.concat(chunks).toString("utf-8") || "{}");
    } catch {
      body = {};
    }
  }

  const {
    toEmail,
    subject = "AIFaGen Dashboard Report",
    htmlContent = "<p>Report Attached</p>",
    text,
    attachments = [],
    senderName = "AIFaGen Dashboard",
    toName,
  } = body || {};

  if (!toEmail) {
    return res.status(400).json({ error: "toEmail is required" });
  }

  const brevoApiKey =
    body.brevoApiKey ||
    body.apiKey ||
    process.env.BREVO_API_KEY ||
    process.env.VITE_BREVO_API_KEY ||
    "";
  const mailUsername =
    body.mailUsername ||
    process.env.MAIL_USERNAME ||
    process.env.VITE_MAIL_USERNAME ||
    "";
  const mailPassword =
    body.mailPassword ||
    process.env.MAIL_PASSWORD ||
    process.env.VITE_MAIL_PASSWORD ||
    "";
  const senderEmail =
    body.senderEmail ||
    process.env.BREVO_SENDER_EMAIL ||
    process.env.VITE_BREVO_SENDER_EMAIL ||
    mailUsername ||
    "support@aifagenlabs.com";

  let brevoApiError = null;

  // Attempt 1: Brevo REST API v3 (Preferred - No IP restrictions)
  if (brevoApiKey && !brevoApiKey.includes("your_")) {
    try {
      const validAttachments = (attachments || [])
        .map((att) => ({
          name: att.name || att.filename || "attachment",
          content: att.content || att.base64 || "",
        }))
        .filter(
          (att) =>
            att.content &&
            typeof att.content === "string" &&
            att.content.trim().length > 0
        );

      const payload = {
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [{ email: toEmail.trim(), name: toName || toEmail.trim() }],
        subject,
        htmlContent,
        ...(text ? { textContent: text } : {}),
        ...(validAttachments.length > 0
          ? { attachment: validAttachments }
          : {}),
      };

      const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (brevoResponse.ok) {
        const data = await brevoResponse.json().catch(() => ({}));
        return res.status(200).json({
          success: true,
          method: "brevo_api",
          messageId: data.messageId,
          toEmail,
        });
      }

      const errText = await brevoResponse.text().catch(() => "");
      brevoApiError = `Brevo REST API HTTP ${brevoResponse.status}: ${errText}`;
      console.warn("Brevo API error in Vercel function:", brevoApiError);
    } catch (apiErr) {
      brevoApiError = `Brevo API exception: ${apiErr.message}`;
      console.warn("Brevo API call failed in Vercel function, falling back to SMTP:", apiErr);
    }
  }

  // Attempt 2: SMTP Fallback via Nodemailer (may fail if Brevo account has IP restrictions)
  if (mailUsername && mailPassword && !mailPassword.includes("your_")) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,
        secure: false,
        auth: {
          user: mailUsername,
          pass: mailPassword,
        },
      });

      const validSmtpAttachments = (attachments || [])
        .map((a) => ({
          filename: a.name || a.filename || "attachment",
          content: Buffer.from(a.content || a.base64 || "", "base64"),
        }))
        .filter((a) => a.content && a.content.length > 0);

      const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail || mailUsername}>`,
        to: toEmail,
        subject,
        html: htmlContent,
        text,
        attachments: validSmtpAttachments,
      });

      return res.status(200).json({
        success: true,
        method: "brevo_smtp",
        messageId: info.messageId,
        toEmail,
      });
    } catch (smtpErr) {
      console.error("SMTP error in Vercel function:", smtpErr);
      const isIpErr =
        smtpErr.message &&
        (smtpErr.message.includes("525") ||
          smtpErr.message.includes("Unauthorized IP"));

      const errorMessage = isIpErr
        ? "Brevo SMTP relay blocked Vercel's dynamic server IP (525 Unauthorized IP address). Please set BREVO_API_KEY in your Vercel Project Settings > Environment Variables so emails send via Brevo REST API v3 (which has no IP restrictions)."
        : `SMTP dispatch failed: ${smtpErr.message}`;

      return res.status(500).json({
        success: false,
        error: errorMessage,
        brevoApiError: brevoApiError || undefined,
        smtpError: smtpErr.message,
      });
    }
  }

  return res.status(500).json({
    success: false,
    error:
      brevoApiError ||
      "No valid email credentials configured in Vercel environment. Please set BREVO_API_KEY in Vercel Project Settings > Environment Variables.",
  });
}

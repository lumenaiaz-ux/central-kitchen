const nodemailer = require("nodemailer");

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure = String(process.env.SMTP_SECURE || "true") === "true";
const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;
const fromEmail = process.env.FROM_EMAIL || smtpUser;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

async function sendEmail(to, subject, html, attachments = []) {
  try {
    if (!smtpUser || !smtpPass) {
      console.error(
        "SMTP email send error: missing credentials (set SMTP_USER and SMTP_PASS or GMAIL_USER and GMAIL_APP_PASSWORD)"
      );
      return false;
    }

    const mailOptions = {
      from: `"Central Kitchen" <${fromEmail}>`,
      to,
      subject,
      html,
    };

    if (attachments.length > 0) {
      mailOptions.attachments = attachments.map((file) => ({
        filename: file.filename,
        content: file.content,
      }));
    }

    const response = await transporter.sendMail(mailOptions);
    console.log("SMTP email sent:", response.messageId);

    return true;
  } catch (err) {
    console.error("SMTP email send error:", err.message);
    return false;
  }
}

module.exports = sendEmail;

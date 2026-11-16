const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) {
    throw new Error("Email is not configured");
  }

  const port = Number(process.env.EMAIL_PORT) || 587;
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.ethereal.email",
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

// Sends a plain-text email. Never logs credentials.
async function sendMail({ to, subject, text }) {
  const from = process.env.EMAIL_FROM || `Job Tracker <${process.env.EMAIL_USER}>`;
  const info = await getTransporter().sendMail({ from, to, subject, text });
  return {
    messageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl(info) || null,
  };
}

module.exports = { sendMail };
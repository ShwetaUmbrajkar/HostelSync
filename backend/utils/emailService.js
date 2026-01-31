const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
});

async function sendEmail(to, subject, text, html) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log(`[emailService] SMTP not configured. Skipping email to ${to}. Subject: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({ from: process.env.EMAIL_FROM || process.env.SMTP_USER, to, subject, text, html });
    console.log(`Email sent to ${to} — ${subject}`);
  } catch (err) {
    console.error('Failed to send email', err.message);
  }
}

module.exports = { sendEmail };

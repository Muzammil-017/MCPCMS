const nodemailer = require('nodemailer');

// Sends email through Gmail SMTP using EMAIL_USER / EMAIL_PASS.
// For local development without SMTP, set EMAIL_DEV_LOG=true to print emails to the server console instead.
const isDevLog = () => process.env.EMAIL_DEV_LOG === 'true';
const isConfigured = () => isDevLog() || Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const getTransport = () => {
  if (isDevLog()) return nodemailer.createTransport({ jsonTransport: true });
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
};

const sendMail = async ({ to, subject, html, text, replyTo }) => {
  if (!isConfigured()) throw new Error('Email is not configured on the server');
  const from = `"MCPCMS" <${process.env.EMAIL_USER || 'no-reply@mcpcms.local'}>`;
  const info = await getTransport().sendMail({ from, to, subject, html, text, replyTo });
  if (isDevLog()) console.log(`[EMAIL_DEV_LOG] To: ${to} | Subject: ${subject}\n${text || html}`);
  return info;
};

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

module.exports = { sendMail, isConfigured, escapeHtml };

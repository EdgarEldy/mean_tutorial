'use strict';
const nodemailer = require('nodemailer');
const { SMTP_HOST, SMTP_PORT, MAIL_FROM } = require('../../config/env');

// MailHog (or any dev SMTP catcher) accepts any connection with no auth and no TLS, so the
// transport is intentionally bare; a real provider would need auth/TLS options added here.
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
});

const sendMail = ({ to, subject, html }) => transporter.sendMail({ from: MAIL_FROM, to, subject, html });

module.exports = { sendMail };

'use strict';
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const { JWT_SECRET, JWT_EXPIRES_IN, ACTIVATION_TOKEN_TTL_HOURS, RESET_TOKEN_TTL_HOURS, FRONTEND_URL } = require('../../config/env');
const userRepository               = require('../../database/repositories/user.repository');
const roleRepository               = require('../../database/repositories/role.repository');
const blacklistedTokenRepository   = require('../../database/repositories/blacklisted-token.repository');
const activationTokenRepository    = require('../../database/repositories/activation-token.repository');
const passwordResetTokenRepository = require('../../database/repositories/password-reset-token.repository');
const { sendMail }                 = require('../../shared/utils/mailer');

const generateHexToken = () => crypto.randomBytes(32).toString('hex');

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);

// A mail delivery hiccup (SMTP down, etc.) must not turn an otherwise-successful registration
// or reset request into a 500 after the DB write already committed, since there's no resend
// endpoint to recover from that; it's logged instead so the flow degrades to "no email arrives"
// rather than "the request fails but the account/token still got created".
const trySendMail = async (options) => {
  try {
    await sendMail(options);
  } catch (err) {
    console.error('Failed to send email:', err.message);
  }
};

const register = async ({ first_name, last_name, email, password }) => {
  const existing = await userRepository.findByEmail(email);
  if (existing) { const err = new Error('Email already in use'); err.statusCode = 409; throw err; }

  const hashed = await bcrypt.hash(password, 12);
  const user = await userRepository.create({ first_name, last_name, email, password: hashed, enabled: false, account_locked: false });

  const defaultRole = await roleRepository.findByName('user');
  if (defaultRole) await userRepository.addRole(user, defaultRole.id);

  const token      = generateHexToken();
  const expires_at = new Date(Date.now() + (ACTIVATION_TOKEN_TTL_HOURS || 24) * 3600000);
  await activationTokenRepository.create({ user_id: user.id, token, created_at: new Date(), expires_at });

  const activationUrl = `${FRONTEND_URL}/auth/activate/${token}`;
  await trySendMail({
    to: email,
    subject: 'Activate your account',
    html: `<p>Hi ${escapeHtml(first_name)},</p><p>Click the link below to activate your account:</p><p><a href="${activationUrl}">${activationUrl}</a></p>`,
  });

  const { password: _pw, ...safeUser } = user.toJSON();
  return safeUser;
};

const activate = async (token) => {
  const record = await activationTokenRepository.findByToken(token);
  if (!record)             { const err = new Error('Invalid activation token');  err.statusCode = 400; throw err; }
  if (record.validated_at) { const err = new Error('Account already activated'); err.statusCode = 400; throw err; }
  if (record.expires_at && new Date() > record.expires_at) {
    const err = new Error('Activation token has expired'); err.statusCode = 400; throw err;
  }
  await userRepository.update(record.user_id, { enabled: true });
  await activationTokenRepository.update(record.id, { validated_at: new Date() });
};

const login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email);
  if (!user)               { const err = new Error('Invalid credentials');      err.statusCode = 401; throw err; }
  if (!user.enabled)       { const err = new Error('Account is not activated'); err.statusCode = 403; throw err; }
  if (user.account_locked) { const err = new Error('Account is locked');        err.statusCode = 403; throw err; }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) { const err = new Error('Invalid credentials'); err.statusCode = 401; throw err; }

  const jti   = crypto.randomUUID();
  const token = jwt.sign({ id: user.id, email: user.email, jti }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const { password: _pw, ...safeUser } = user.toJSON();
  return { token, user: safeUser };
};

const logout = async ({ token, tokenDecoded }) => {
  const expiresAt = tokenDecoded.exp ? new Date(tokenDecoded.exp * 1000) : null;
  await blacklistedTokenRepository.create({
    user_id: tokenDecoded.id, token, jti: tokenDecoded.jti,
    blacklisted_at: new Date(), created_at: new Date(), expires_at: expiresAt,
  });
};

const forgotPassword = async ({ email }) => {
  const user = await userRepository.findByEmail(email);
  if (!user) return;

  const token       = generateHexToken();
  const expiry_date = new Date(Date.now() + (RESET_TOKEN_TTL_HOURS || 1) * 3600000);
  await passwordResetTokenRepository.create({ user_id: user.id, token, type: 'password_reset', expiry_date });

  const resetUrl = `${FRONTEND_URL}/auth/reset-password/${token}`;
  await trySendMail({
    to: email,
    subject: 'Reset your password',
    html: `<p>Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
};

const resetPassword = async ({ token, password }) => {
  const record = await passwordResetTokenRepository.findByToken(token);
  if (!record)                          { const err = new Error('Invalid reset token');       err.statusCode = 400; throw err; }
  if (new Date() > record.expiry_date)  { const err = new Error('Reset token has expired');  err.statusCode = 400; throw err; }

  await userRepository.update(record.user_id, { password: await bcrypt.hash(password, 12) });
  await passwordResetTokenRepository.destroy(record.id);
};

module.exports = { register, activate, login, logout, forgotPassword, resetPassword };

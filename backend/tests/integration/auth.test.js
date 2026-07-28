'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const request   = require('supertest');
const jwt       = require('jsonwebtoken');
const app       = require('../../src/app');
const sequelize = require('../../src/config/database');
const { Role, BlacklistedToken } = require('../../src/database/models');
const { FRONTEND_URL } = require('../../src/config/env');

const MAILHOG_API = 'http://127.0.0.1:8025/api/v2/messages';
// MailHog's "delete all messages" endpoint only exists under the v1 API, unlike everything else.
const MAILHOG_DELETE_ALL_API = 'http://127.0.0.1:8025/api/v1/messages';

// MailHog's HTTP API returns the raw MIME body quoted-printable encoded; long lines (like our
// activation/reset URLs) get soft-wrapped with "=\r\n"/"=\n". Stripping those sequences joins the
// URL back into a single matchable string without needing a full quoted-printable decoder.
const stripSoftLineBreaks = (body) => body.replace(/=\r?\n/g, '');

const getMailHogMessages = async () => {
  const res = await fetch(MAILHOG_API);
  const json = await res.json();
  return json.items || [];
};

const clearMailHog = () => fetch(MAILHOG_DELETE_ALL_API, { method: 'DELETE' });

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await Role.create({ role_name: 'user' });
  await Role.create({ role_name: 'admin' });
});

afterAll(async () => { await sequelize.close(); });

const registeredEmail = 'alice.register@example.com';
const registeredPassword = 'password123';
let activationToken;
let jwtToken;
let resetToken;

describe('POST /api/v1/auth/register', () => {
  beforeEach(async () => { await clearMailHog(); });

  it('registers a new user and sends exactly one activation email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      first_name: 'Alice', last_name: 'Wonderland', email: registeredEmail, password: registeredPassword,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      first_name: 'Alice', last_name: 'Wonderland', email: registeredEmail, enabled: false, account_locked: false,
    });
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).not.toHaveProperty('password');
    expect(res.body.data).not.toHaveProperty('activationToken');

    const messages = await getMailHogMessages();
    expect(messages).toHaveLength(1);
    const msg = messages[0];
    expect(msg.Content.Headers.To[0]).toContain(registeredEmail);
    expect(msg.Content.Headers.Subject[0]).toMatch(/activate/i);

    const decodedBody = stripSoftLineBreaks(msg.Content.Body);
    const match = decodedBody.match(/\/auth\/activate\/([a-f0-9]+)/);
    expect(match).not.toBeNull();
    expect(decodedBody).toContain(`${FRONTEND_URL}/auth/activate/`);
    activationToken = match[1];
  });

  it('returns 409 and sends no additional email when registering the same email again', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      first_name: 'Alice', last_name: 'Wonderland', email: registeredEmail, password: registeredPassword,
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);

    const messages = await getMailHogMessages();
    expect(messages).toHaveLength(0);
  });

  it('returns 422 when required fields are missing', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ first_name: 'X' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 when the password is too short', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      first_name: 'Bob', last_name: 'Short', email: 'bob.short@example.com', password: 'short',
    });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/v1/auth/activate/:token', () => {
  it('activates the account with a valid token', async () => {
    const res = await request(app).get(`/api/v1/auth/activate/${activationToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 when the same token is used again (already activated)', async () => {
    const res = await request(app).get(`/api/v1/auth/activate/${activationToken}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for a bogus/unknown token', async () => {
    const res = await request(app).get('/api/v1/auth/activate/not-a-real-token');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/v1/auth/login', () => {
  const unactivatedEmail = 'bob.unactivated@example.com';

  beforeAll(async () => {
    await clearMailHog();
    await request(app).post('/api/v1/auth/register').send({
      first_name: 'Bob', last_name: 'NotActivated', email: unactivatedEmail, password: 'password123',
    });
  });

  it('returns 403 when the account has not been activated yet', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: unactivatedEmail, password: 'password123' });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for a wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: registeredEmail, password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 200 with a JWT and the seeded user role for the activated account', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: registeredEmail, password: registeredPassword });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(typeof res.body.data.token).toBe('string');
    expect(res.body.data.user).not.toHaveProperty('password');

    // This exercises the previously-broken userRepository.addRole() path end-to-end
    // (the join-table migrations were missing createdAt/updatedAt, which made every
    // registration throw); a non-empty 'user' role here proves that path now works.
    expect(Array.isArray(res.body.data.user.roles)).toBe(true);
    expect(res.body.data.user.roles.length).toBeGreaterThan(0);
    expect(res.body.data.user.roles.some((r) => r.role_name === 'user')).toBe(true);

    jwtToken = res.body.data.token;
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('returns 200 and blacklists the token', async () => {
    const res = await request(app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${jwtToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const decoded = jwt.decode(jwtToken);
    const row = await BlacklistedToken.findOne({ where: { jti: decoded.jti } });
    expect(row).not.toBeNull();
  });

  it('rejects a subsequent request using the now-blacklisted token', async () => {
    const res = await request(app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${jwtToken}`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/v1/auth/forgot-password', () => {
  beforeEach(async () => { await clearMailHog(); });

  it('returns 200 with the generic message and sends exactly one reset email for a known email', async () => {
    const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: registeredEmail });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'If this email exists, a reset link has been sent' });

    const messages = await getMailHogMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].Content.Headers.Subject[0]).toMatch(/reset/i);

    const decodedBody = stripSoftLineBreaks(messages[0].Content.Body);
    const match = decodedBody.match(/\/auth\/reset-password\/([a-f0-9]+)/);
    expect(match).not.toBeNull();
    expect(decodedBody).toContain(`${FRONTEND_URL}/auth/reset-password/`);
    resetToken = match[1];
  });

  // Regression test for the email-enumeration fix: the HTTP response must be byte-identical
  // whether or not the email exists; only the presence/absence of a sent email should differ.
  it('returns the identical 200 response for an unknown email, but sends no email', async () => {
    const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'ghost.nonexistent@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'If this email exists, a reset link has been sent' });

    const messages = await getMailHogMessages();
    expect(messages).toHaveLength(0);
  });

  it('returns 422 when the email is invalid', async () => {
    const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'not-an-email' });
    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/auth/reset-password', () => {
  it('returns 200 and resets the password using a valid token', async () => {
    const res = await request(app).post('/api/v1/auth/reset-password').send({ token: resetToken, password: 'newpassword456' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects login with the old password after the reset', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: registeredEmail, password: registeredPassword });
    expect(res.status).toBe(401);
  });

  it('allows login with the new password after the reset', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: registeredEmail, password: 'newpassword456' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
  });

  it('returns 400 for an already-consumed reset token', async () => {
    const res = await request(app).post('/api/v1/auth/reset-password').send({ token: resetToken, password: 'anotherpassword' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for a bogus reset token', async () => {
    const res = await request(app).post('/api/v1/auth/reset-password').send({ token: 'not-a-real-token', password: 'anotherpassword' });
    expect(res.status).toBe(400);
  });
});

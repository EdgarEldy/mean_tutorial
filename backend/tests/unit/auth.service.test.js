'use strict';
jest.mock('../../src/database/repositories/user.repository');
jest.mock('../../src/database/repositories/role.repository');
jest.mock('../../src/database/repositories/blacklisted-token.repository');
jest.mock('../../src/database/repositories/activation-token.repository');
jest.mock('../../src/database/repositories/password-reset-token.repository');
jest.mock('../../src/shared/utils/mailer');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { FRONTEND_URL } = require('../../src/config/env');

const userRepository               = require('../../src/database/repositories/user.repository');
const roleRepository               = require('../../src/database/repositories/role.repository');
const blacklistedTokenRepository   = require('../../src/database/repositories/blacklisted-token.repository');
const activationTokenRepository    = require('../../src/database/repositories/activation-token.repository');
const passwordResetTokenRepository = require('../../src/database/repositories/password-reset-token.repository');
const { sendMail }                 = require('../../src/shared/utils/mailer');

const authService = require('../../src/modules/auth/auth.service');

describe('authService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('throws 409 and sends no email when the email is already in use', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: 1, email: 'taken@example.com' });

      await expect(
        authService.register({ first_name: 'Ann', last_name: 'Lee', email: 'taken@example.com', password: 'password123' })
      ).rejects.toMatchObject({ message: 'Email already in use', statusCode: 409 });

      expect(sendMail).not.toHaveBeenCalled();
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('creates the user with a hashed password, assigns the default role, sends an activation email and returns the safe user', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed_pw');
      const createdUser = {
        id: 1,
        toJSON: () => ({
          id: 1, first_name: 'Ann', last_name: 'Lee', email: 'ann@example.com',
          password: 'hashed_pw', enabled: false, account_locked: false,
        }),
      };
      userRepository.create.mockResolvedValue(createdUser);
      roleRepository.findByName.mockResolvedValue({ id: 5, role_name: 'user' });
      activationTokenRepository.create.mockResolvedValue({ id: 10 });
      sendMail.mockResolvedValue();

      const result = await authService.register({ first_name: 'Ann', last_name: 'Lee', email: 'ann@example.com', password: 'password123' });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ first_name: 'Ann', last_name: 'Lee', email: 'ann@example.com', password: 'hashed_pw', enabled: false, account_locked: false })
      );
      expect(roleRepository.findByName).toHaveBeenCalledWith('user');
      expect(userRepository.addRole).toHaveBeenCalledWith(createdUser, 5);
      expect(activationTokenRepository.create).toHaveBeenCalledTimes(1);

      const activationTokenData = activationTokenRepository.create.mock.calls[0][0];
      expect(activationTokenData).toMatchObject({ user_id: 1 });
      expect(typeof activationTokenData.token).toBe('string');

      expect(sendMail).toHaveBeenCalledTimes(1);
      const mailArgs = sendMail.mock.calls[0][0];
      expect(mailArgs.to).toBe('ann@example.com');
      expect(mailArgs.subject).toMatch(/activate/i);
      expect(mailArgs.html).toContain(`${FRONTEND_URL}/auth/activate/${activationTokenData.token}`);

      expect(result).toEqual({ id: 1, first_name: 'Ann', last_name: 'Lee', email: 'ann@example.com', enabled: false, account_locked: false });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('activationToken');
    });

    it('does not assign a role when no default "user" role exists', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed_pw');
      userRepository.create.mockResolvedValue({
        id: 2,
        toJSON: () => ({ id: 2, first_name: 'Bo', last_name: 'Ng', email: 'bo@example.com', password: 'hashed_pw', enabled: false, account_locked: false }),
      });
      roleRepository.findByName.mockResolvedValue(null);
      activationTokenRepository.create.mockResolvedValue({ id: 11 });
      sendMail.mockResolvedValue();

      await authService.register({ first_name: 'Bo', last_name: 'Ng', email: 'bo@example.com', password: 'password123' });

      expect(roleRepository.findByName).toHaveBeenCalledWith('user');
      expect(userRepository.addRole).not.toHaveBeenCalled();
    });
  });

  describe('activate', () => {
    it('throws 400 for an invalid/unknown token', async () => {
      activationTokenRepository.findByToken.mockResolvedValue(null);
      await expect(authService.activate('bogus')).rejects.toMatchObject({
        message: 'Invalid activation token', statusCode: 400,
      });
    });

    it('throws 400 when the account is already activated', async () => {
      activationTokenRepository.findByToken.mockResolvedValue({ id: 1, user_id: 1, validated_at: new Date() });
      await expect(authService.activate('tok')).rejects.toMatchObject({
        message: 'Account already activated', statusCode: 400,
      });
    });

    it('throws 400 when the token has expired', async () => {
      activationTokenRepository.findByToken.mockResolvedValue({
        id: 1, user_id: 1, validated_at: null, expires_at: new Date(Date.now() - 1000),
      });
      await expect(authService.activate('tok')).rejects.toMatchObject({
        message: 'Activation token has expired', statusCode: 400,
      });
    });

    it('activates the user and marks the token as validated on success', async () => {
      activationTokenRepository.findByToken.mockResolvedValue({
        id: 1, user_id: 7, validated_at: null, expires_at: new Date(Date.now() + 3600000),
      });
      userRepository.update.mockResolvedValue([1]);
      activationTokenRepository.update.mockResolvedValue([1]);

      await authService.activate('tok');

      expect(userRepository.update).toHaveBeenCalledWith(7, { enabled: true });
      expect(activationTokenRepository.update).toHaveBeenCalledWith(1, { validated_at: expect.any(Date) });
    });
  });

  describe('login', () => {
    it('throws 401 when no user is found for the email', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      await expect(authService.login({ email: 'nope@example.com', password: 'x' })).rejects.toMatchObject({
        message: 'Invalid credentials', statusCode: 401,
      });
    });

    it('throws 403 when the account is not enabled', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: 1, enabled: false, account_locked: false, password: 'hashed' });
      await expect(authService.login({ email: 'a@example.com', password: 'x' })).rejects.toMatchObject({
        message: 'Account is not activated', statusCode: 403,
      });
    });

    it('throws 403 when the account is locked', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: 1, enabled: true, account_locked: true, password: 'hashed' });
      await expect(authService.login({ email: 'a@example.com', password: 'x' })).rejects.toMatchObject({
        message: 'Account is locked', statusCode: 403,
      });
    });

    it('throws 401 when the password does not match', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: 1, enabled: true, account_locked: false, password: 'hashed' });
      bcrypt.compare.mockResolvedValue(false);
      await expect(authService.login({ email: 'a@example.com', password: 'wrong' })).rejects.toMatchObject({
        message: 'Invalid credentials', statusCode: 401,
      });
    });

    it('returns a token and the safe user on success', async () => {
      const user = {
        id: 1, email: 'a@example.com', enabled: true, account_locked: false, password: 'hashed',
        toJSON() { return { id: 1, email: 'a@example.com', enabled: true, account_locked: false, password: 'hashed' }; },
      };
      userRepository.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('signed.jwt.token');

      const result = await authService.login({ email: 'a@example.com', password: 'correct' });

      expect(bcrypt.compare).toHaveBeenCalledWith('correct', 'hashed');
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, email: 'a@example.com', jti: expect.any(String) }),
        expect.any(String),
        expect.objectContaining({ expiresIn: expect.anything() })
      );
      expect(result).toEqual({
        token: 'signed.jwt.token',
        user: { id: 1, email: 'a@example.com', enabled: true, account_locked: false },
      });
      expect(result.user).not.toHaveProperty('password');
    });
  });

  describe('logout', () => {
    it('blacklists the current token', async () => {
      blacklistedTokenRepository.create.mockResolvedValue({ id: 1 });
      const tokenDecoded = { id: 3, jti: 'jti-123', exp: Math.floor(Date.now() / 1000) + 3600 };

      await authService.logout({ token: 'raw.jwt.token', tokenDecoded });

      expect(blacklistedTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 3, token: 'raw.jwt.token', jti: 'jti-123', expires_at: expect.any(Date),
        })
      );
    });
  });

  describe('forgotPassword', () => {
    it('does nothing and sends no email when the user does not exist (prevents email enumeration)', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const result = await authService.forgotPassword({ email: 'nobody@example.com' });

      expect(result).toBeUndefined();
      expect(passwordResetTokenRepository.create).not.toHaveBeenCalled();
      expect(sendMail).not.toHaveBeenCalled();
    });

    it('creates a reset token and sends a reset email when the user exists', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: 4, email: 'known@example.com' });
      passwordResetTokenRepository.create.mockResolvedValue({ id: 20 });
      sendMail.mockResolvedValue();

      await authService.forgotPassword({ email: 'known@example.com' });

      expect(passwordResetTokenRepository.create).toHaveBeenCalledTimes(1);
      const resetTokenData = passwordResetTokenRepository.create.mock.calls[0][0];
      expect(resetTokenData).toMatchObject({ user_id: 4, type: 'password_reset' });

      expect(sendMail).toHaveBeenCalledTimes(1);
      const mailArgs = sendMail.mock.calls[0][0];
      expect(mailArgs.to).toBe('known@example.com');
      expect(mailArgs.subject).toMatch(/reset/i);
      expect(mailArgs.html).toContain(`${FRONTEND_URL}/auth/reset-password/${resetTokenData.token}`);
    });
  });

  describe('resetPassword', () => {
    it('throws 400 for an invalid/unknown token', async () => {
      passwordResetTokenRepository.findByToken.mockResolvedValue(null);
      await expect(authService.resetPassword({ token: 'bogus', password: 'newpassword1' })).rejects.toMatchObject({
        message: 'Invalid reset token', statusCode: 400,
      });
    });

    it('throws 400 when the token has expired', async () => {
      passwordResetTokenRepository.findByToken.mockResolvedValue({ id: 1, user_id: 1, expiry_date: new Date(Date.now() - 1000) });
      await expect(authService.resetPassword({ token: 'tok', password: 'newpassword1' })).rejects.toMatchObject({
        message: 'Reset token has expired', statusCode: 400,
      });
    });

    it('hashes the new password, updates the user and destroys the reset token on success', async () => {
      passwordResetTokenRepository.findByToken.mockResolvedValue({ id: 9, user_id: 5, expiry_date: new Date(Date.now() + 3600000) });
      bcrypt.hash.mockResolvedValue('new_hashed_pw');
      userRepository.update.mockResolvedValue([1]);
      passwordResetTokenRepository.destroy.mockResolvedValue(1);

      await authService.resetPassword({ token: 'tok', password: 'newpassword1' });

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword1', 12);
      expect(userRepository.update).toHaveBeenCalledWith(5, { password: 'new_hashed_pw' });
      expect(passwordResetTokenRepository.destroy).toHaveBeenCalledWith(9);
    });
  });
});

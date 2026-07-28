module.exports = {
  NODE_ENV:    process.env.NODE_ENV    || 'development',
  PORT:        parseInt(process.env.PORT, 10) || 3001,
  DB_HOST:     process.env.DB_HOST     || '127.0.0.1',
  DB_PORT:     parseInt(process.env.DB_PORT, 10) || 3306,
  DB_USER:     process.env.DB_USER     || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME:     process.env.DB_NAME     || 'mean_db',
  DB_DIALECT:  process.env.DB_DIALECT  || 'mysql',
  JWT_SECRET:                 process.env.JWT_SECRET                || 'change_me_in_production',
  JWT_EXPIRES_IN:             process.env.JWT_EXPIRES_IN            || '7d',
  ACTIVATION_TOKEN_TTL_HOURS: parseInt(process.env.ACTIVATION_TOKEN_TTL_HOURS, 10) || 24,
  RESET_TOKEN_TTL_HOURS:      parseInt(process.env.RESET_TOKEN_TTL_HOURS, 10)      || 1,
  SMTP_HOST:   process.env.SMTP_HOST   || '127.0.0.1',
  SMTP_PORT:   parseInt(process.env.SMTP_PORT, 10) || 1025,
  MAIL_FROM:   process.env.MAIL_FROM   || 'no-reply@mean-tutorial.test',
  // Stripped of a trailing slash so URL-building call sites can safely do `${FRONTEND_URL}/path`
  // without risking a double slash if someone sets this with one in .env.
  FRONTEND_URL: (process.env.FRONTEND_URL || 'http://localhost:4200').replace(/\/+$/, ''),
};

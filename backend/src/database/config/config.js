// sequelize-cli runs outside the app bootstrap (no server.js, no env.js),
// so we read process.env directly here after loading .env manually.
// This is the intentional exception to the env.js centralization rule.
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT, 10) || 3306,
    dialect:  process.env.DB_DIALECT || 'mysql',
    logging:  false,
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ? `${process.env.DB_NAME}_test` : 'mean_db_test',
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT, 10) || 3306,
    dialect:  process.env.DB_DIALECT || 'mysql',
    logging:  false,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT, 10) || 3306,
    dialect:  process.env.DB_DIALECT || 'mysql',
    logging:  false,
  },
};

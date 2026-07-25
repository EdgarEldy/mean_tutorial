'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('blacklisted_tokens', {
      id:         { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      jti:        { type: Sequelize.STRING(255), allowNull: false, unique: true },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('blacklisted_tokens'); },
};

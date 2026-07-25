'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('activation_tokens', {
      id:         { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      token:      { type: Sequelize.STRING(255), allowNull: false, unique: true },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      used:       { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('activation_tokens'); },
};

'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id:         { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      email:      { type: Sequelize.STRING(255), allowNull: false, unique: true },
      password:   { type: Sequelize.STRING(255), allowNull: false },
      is_active:  { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt:  { type: Sequelize.DATE, allowNull: false },
      updatedAt:  { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('users'); },
};

'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('categories', {
      id:            { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      category_name: { type: Sequelize.STRING(255), allowNull: false },
      createdAt:     { type: Sequelize.DATE, allowNull: false },
      updatedAt:     { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('categories');
  },
};

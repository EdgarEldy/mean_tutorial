'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id:           { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      category_id:  {
        type: Sequelize.BIGINT, allowNull: false,
        references: { model: 'categories', key: 'id' },
        onDelete: 'RESTRICT', onUpdate: 'CASCADE',
      },
      product_name: { type: Sequelize.STRING(255), allowNull: false },
      unit_price:   { type: Sequelize.FLOAT, allowNull: false },
      createdAt:    { type: Sequelize.DATE, allowNull: false },
      updatedAt:    { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('products');
  },
};

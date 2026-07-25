'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id:          { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      customer_id: {
        type: Sequelize.BIGINT, allowNull: false,
        references: { model: 'customers', key: 'id' },
        onDelete: 'RESTRICT', onUpdate: 'CASCADE',
      },
      product_id:  {
        type: Sequelize.BIGINT, allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'RESTRICT', onUpdate: 'CASCADE',
      },
      quantity:    { type: Sequelize.INTEGER, allowNull: false },
      total:       { type: Sequelize.DOUBLE,  allowNull: false },
      createdAt:   { type: Sequelize.DATE, allowNull: false },
      updatedAt:   { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('orders');
  },
};

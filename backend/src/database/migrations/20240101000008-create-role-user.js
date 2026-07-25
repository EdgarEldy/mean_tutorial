'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('role_user', {
      role_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onDelete: 'RESTRICT',
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
    });
    await queryInterface.addConstraint('role_user', {
      fields: ['role_id', 'user_id'],
      type: 'primary key',
      name: 'role_user_pkey',
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('role_user'); },
};

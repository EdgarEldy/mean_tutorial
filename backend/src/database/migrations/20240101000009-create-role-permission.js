'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('role_permission', {
      role_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onDelete: 'RESTRICT',
      },
      permission_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'permissions', key: 'id' },
        onDelete: 'RESTRICT',
      },
    });
    await queryInterface.addConstraint('role_permission', {
      fields: ['role_id', 'permission_id'],
      type: 'primary key',
      name: 'role_permission_pkey',
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('role_permission'); },
};

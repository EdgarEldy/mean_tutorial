'use strict';
const resources = ['categories', 'products', 'customers', 'orders', 'users'];
const actions   = ['create', 'read', 'update', 'delete'];
module.exports = {
  async up(queryInterface) {
    const rows = [];
    for (const resource of resources) {
      for (const action of actions) {
        rows.push({ resource, action, createdAt: new Date(), updatedAt: new Date() });
      }
    }
    await queryInterface.bulkInsert('permissions', rows);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('permissions', null, {});
  },
};

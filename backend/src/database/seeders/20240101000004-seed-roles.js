'use strict';
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('roles', [
      { role_name: 'admin', createdAt: new Date(), updatedAt: new Date() },
      { role_name: 'user',  createdAt: new Date(), updatedAt: new Date() },
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', null, {});
  },
};

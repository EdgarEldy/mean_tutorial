'use strict';
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('customers', [
      { first_name: 'Alice', last_name: 'Smith', telephone: '555-0101', email: 'alice@example.com', address: '1 Main St', createdAt: new Date(), updatedAt: new Date() },
      { first_name: 'Bob',   last_name: 'Jones', telephone: '555-0102', email: 'bob@example.com',   address: '2 Oak Ave',  createdAt: new Date(), updatedAt: new Date() },
      { first_name: 'Carol', last_name: 'White', telephone: null,       email: null,                address: null,         createdAt: new Date(), updatedAt: new Date() },
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('customers', null, {});
  },
};

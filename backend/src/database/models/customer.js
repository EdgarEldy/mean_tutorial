'use strict';
const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class Customer extends Model {
    static associate(models) {
      Customer.hasMany(models.Order, { foreignKey: 'customer_id', as: 'orders' });
    }
  }
  Customer.init(
    {
      id:         { type: DataTypes.BIGINT,     primaryKey: true, autoIncrement: true },
      first_name: { type: DataTypes.STRING(255), allowNull: true },
      last_name:  { type: DataTypes.STRING(255), allowNull: true },
      telephone:  { type: DataTypes.STRING(50),  allowNull: true },
      email:      { type: DataTypes.STRING(255), allowNull: true },
      address:    { type: DataTypes.STRING(255), allowNull: true },
    },
    { sequelize, modelName: 'Customer', tableName: 'customers' }
  );
  return Customer;
};

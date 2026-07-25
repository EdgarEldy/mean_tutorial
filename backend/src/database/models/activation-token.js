'use strict';
const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class ActivationToken extends Model {
    static associate(models) {
      ActivationToken.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  ActivationToken.init(
    {
      id:         { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      token:      { type: DataTypes.STRING(255), allowNull: false, unique: true },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      used:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      user_id:    { type: DataTypes.BIGINT, allowNull: false },
    },
    { sequelize, modelName: 'ActivationToken', tableName: 'activation_tokens', timestamps: false }
  );
  return ActivationToken;
};

'use strict';
const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class PasswordResetToken extends Model {
    static associate(models) {
      PasswordResetToken.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  PasswordResetToken.init(
    {
      id:         { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      token:      { type: DataTypes.STRING(255), allowNull: false, unique: true },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      used:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      user_id:    { type: DataTypes.BIGINT, allowNull: false },
    },
    { sequelize, modelName: 'PasswordResetToken', tableName: 'password_reset_tokens', timestamps: false }
  );
  return PasswordResetToken;
};

'use strict';
const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      User.belongsToMany(models.Role,       { through: 'role_user',       foreignKey: 'user_id', as: 'roles' });
      User.hasMany(models.BlacklistedToken, { foreignKey: 'user_id', as: 'blacklistedTokens' });
      User.hasMany(models.ActivationToken,  { foreignKey: 'user_id', as: 'activationTokens' });
      User.hasMany(models.PasswordResetToken, { foreignKey: 'user_id', as: 'passwordResetTokens' });
    }
  }
  User.init(
    {
      id:        { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      email:     { type: DataTypes.STRING(255), allowNull: false, unique: true },
      password:  { type: DataTypes.STRING(255), allowNull: false },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { sequelize, modelName: 'User', tableName: 'users' }
  );
  return User;
};

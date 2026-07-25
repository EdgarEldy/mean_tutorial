'use strict';
const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class BlacklistedToken extends Model {
    static associate(models) {
      BlacklistedToken.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  BlacklistedToken.init(
    {
      id:         { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      jti:        { type: DataTypes.STRING(255), allowNull: false, unique: true },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      user_id:    { type: DataTypes.BIGINT, allowNull: false },
    },
    { sequelize, modelName: 'BlacklistedToken', tableName: 'blacklisted_tokens', timestamps: false }
  );
  return BlacklistedToken;
};

'use strict';
const { User, Role, Permission } = require('../models');

const roleInclude = {
  model: Role,
  as: 'roles',
  include: [{ model: Permission, as: 'permissions' }],
};

const findById    = (id)    => User.findByPk(id, { include: [roleInclude] });
const findByEmail = (email) => User.findOne({ where: { email }, include: [roleInclude] });
const create      = (data)  => User.create(data);
const update      = (id, data) => User.update(data, { where: { id } });
const addRole     = async (userId, roleId) => {
  const user = await User.findByPk(userId);
  return user.addRole(roleId);
};

module.exports = { findById, findByEmail, create, update, addRole };

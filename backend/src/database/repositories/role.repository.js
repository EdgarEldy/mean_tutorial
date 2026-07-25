'use strict';
const { Role, Permission } = require('../models');
const findAll  = ()     => Role.findAll({ include: [{ model: Permission, as: 'permissions' }] });
const findById = (id)   => Role.findByPk(id, { include: [{ model: Permission, as: 'permissions' }] });
const findByName = (role_name) => Role.findOne({ where: { role_name } });
module.exports = { findAll, findById, findByName };

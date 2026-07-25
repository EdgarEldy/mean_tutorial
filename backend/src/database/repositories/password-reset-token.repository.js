'use strict';
const { PasswordResetToken } = require('../models');
const create      = (data)  => PasswordResetToken.create(data);
const findByToken = (token) => PasswordResetToken.findOne({ where: { token } });
const markUsed    = (id)    => PasswordResetToken.update({ used: true }, { where: { id } });
module.exports    = { create, findByToken, markUsed };

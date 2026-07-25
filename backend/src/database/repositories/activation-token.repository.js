'use strict';
const { ActivationToken } = require('../models');
const create      = (data)  => ActivationToken.create(data);
const findByToken = (token) => ActivationToken.findOne({ where: { token } });
const markUsed    = (id)    => ActivationToken.update({ used: true }, { where: { id } });
module.exports    = { create, findByToken, markUsed };

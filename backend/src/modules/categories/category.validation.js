'use strict';
const { body } = require('express-validator');
const createCategory = [
  body('category_name').notEmpty().withMessage('category_name is required')
    .isLength({ max: 255 }),
];
const updateCategory = [
  body('category_name').optional().isLength({ max: 255 }),
];
module.exports = { createCategory, updateCategory };

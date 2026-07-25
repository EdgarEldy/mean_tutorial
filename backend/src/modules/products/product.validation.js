'use strict';
const { body } = require('express-validator');
const createProduct = [
  body('product_name').notEmpty().withMessage('product_name is required').isLength({ max: 255 }),
  body('unit_price').notEmpty().withMessage('unit_price is required').isFloat({ min: 0 }),
  body('category_id').notEmpty().withMessage('category_id is required').isInt({ min: 1 }),
];
const updateProduct = [
  body('product_name').optional().isLength({ max: 255 }),
  body('unit_price').optional().isFloat({ min: 0 }),
  body('category_id').optional().isInt({ min: 1 }),
];
module.exports = { createProduct, updateProduct };

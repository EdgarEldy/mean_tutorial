'use strict';
const { body } = require('express-validator');
const createOrder = [
  body('customer_id').notEmpty().withMessage('customer_id is required').isInt({ min: 1 }),
  body('product_id').notEmpty().withMessage('product_id is required').isInt({ min: 1 }),
  body('quantity').notEmpty().withMessage('quantity is required').isInt({ min: 1 }),
];
const updateOrder = [
  body('customer_id').optional().isInt({ min: 1 }),
  body('product_id').optional().isInt({ min: 1 }),
  body('quantity').optional().isInt({ min: 1 }),
];
module.exports = { createOrder, updateOrder };

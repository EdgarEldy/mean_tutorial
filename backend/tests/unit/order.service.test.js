'use strict';
const orderService      = require('../../src/modules/orders/order.service');
const orderRepository   = require('../../src/database/repositories/order.repository');
const productRepository = require('../../src/database/repositories/product.repository');
jest.mock('../../src/database/repositories/order.repository');
jest.mock('../../src/database/repositories/product.repository');

describe('orderService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getAllOrders', () => {
    it('returns all orders', async () => {
      const rows = [{ id: 1, quantity: 2, total: 1999.98 }];
      orderRepository.findAll.mockResolvedValue(rows);
      const result = await orderService.getAllOrders();
      expect(orderRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rows);
    });
  });

  describe('getOrderById', () => {
    it('returns the order when found', async () => {
      const row = { id: 1, quantity: 1, total: 999.99 };
      orderRepository.findById.mockResolvedValue(row);
      const result = await orderService.getOrderById(1);
      expect(result).toEqual(row);
    });
    it('throws 404 when not found', async () => {
      orderRepository.findById.mockResolvedValue(null);
      await expect(orderService.getOrderById(99)).rejects.toMatchObject({
        message: 'Order not found', statusCode: 404,
      });
    });
  });

  describe('createOrder', () => {
    it('computes total from quantity * unit_price', async () => {
      productRepository.findById.mockResolvedValue({ id: 1, unit_price: 999.99 });
      orderRepository.create.mockResolvedValue({ id: 1, quantity: 2, total: 1999.98 });
      const result = await orderService.createOrder({ customer_id: 1, product_id: 1, quantity: 2 });
      expect(orderRepository.create).toHaveBeenCalledWith({ customer_id: 1, product_id: 1, quantity: 2, total: 1999.98 });
      expect(result.total).toBe(1999.98);
    });
    it('throws 404 when product not found', async () => {
      productRepository.findById.mockResolvedValue(null);
      await expect(orderService.createOrder({ product_id: 99, quantity: 1 })).rejects.toMatchObject({
        message: 'Product not found', statusCode: 404,
      });
    });
  });

  describe('updateOrder', () => {
    it('recomputes total on update', async () => {
      const existingOrder = { id: 1, product_id: 1, quantity: 1, total: 999.99 };
      orderRepository.findById.mockResolvedValueOnce(existingOrder).mockResolvedValueOnce({ ...existingOrder, quantity: 3, total: 2999.97 });
      productRepository.findById.mockResolvedValue({ id: 1, unit_price: 999.99 });
      orderRepository.update.mockResolvedValue([1]);
      const result = await orderService.updateOrder(1, { quantity: 3 });
      expect(orderRepository.update).toHaveBeenCalledWith(1, { quantity: 3, total: 2999.9700000000003 });
      expect(result.total).toBe(2999.97);
    });
    it('throws 404 when order not found', async () => {
      orderRepository.findById.mockResolvedValue(null);
      await expect(orderService.updateOrder(99, {})).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('deleteOrder', () => {
    it('calls destroy when found', async () => {
      orderRepository.findById.mockResolvedValue({ id: 1 });
      orderRepository.destroy.mockResolvedValue(1);
      await orderService.deleteOrder(1);
      expect(orderRepository.destroy).toHaveBeenCalledWith(1);
    });
    it('throws 404 when not found', async () => {
      orderRepository.findById.mockResolvedValue(null);
      await expect(orderService.deleteOrder(99)).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});

'use strict';
const productService    = require('../../src/modules/products/product.service');
const productRepository = require('../../src/database/repositories/product.repository');
jest.mock('../../src/database/repositories/product.repository');

describe('productService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getAllProducts', () => {
    it('returns all products', async () => {
      const rows = [{ id: 1, product_name: 'Laptop', category: { id: 1, category_name: 'Electronics' } }];
      productRepository.findAll.mockResolvedValue(rows);
      const result = await productService.getAllProducts();
      expect(productRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rows);
    });
  });

  describe('getProductById', () => {
    it('returns the product when found', async () => {
      const row = { id: 1, product_name: 'Laptop' };
      productRepository.findById.mockResolvedValue(row);
      const result = await productService.getProductById(1);
      expect(result).toEqual(row);
    });
    it('throws 404 when not found', async () => {
      productRepository.findById.mockResolvedValue(null);
      await expect(productService.getProductById(99)).rejects.toMatchObject({
        message: 'Product not found', statusCode: 404,
      });
    });
  });

  describe('createProduct', () => {
    it('delegates to repository', async () => {
      const payload = { product_name: 'Laptop', unit_price: 999.99, category_id: 1 };
      const created = { id: 1, ...payload };
      productRepository.create.mockResolvedValue(created);
      const result = await productService.createProduct(payload);
      expect(productRepository.create).toHaveBeenCalledWith(payload);
      expect(result).toEqual(created);
    });
  });

  describe('updateProduct', () => {
    it('updates and returns refreshed row', async () => {
      const before = { id: 1, product_name: 'Old' };
      const after  = { id: 1, product_name: 'New' };
      productRepository.findById.mockResolvedValueOnce(before).mockResolvedValueOnce(after);
      productRepository.update.mockResolvedValue([1]);
      const result = await productService.updateProduct(1, { product_name: 'New' });
      expect(result).toEqual(after);
    });
    it('throws 404 when not found', async () => {
      productRepository.findById.mockResolvedValue(null);
      await expect(productService.updateProduct(99, {})).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('deleteProduct', () => {
    it('calls destroy when found', async () => {
      productRepository.findById.mockResolvedValue({ id: 1 });
      productRepository.destroy.mockResolvedValue(1);
      await productService.deleteProduct(1);
      expect(productRepository.destroy).toHaveBeenCalledWith(1);
    });
    it('throws 404 when not found', async () => {
      productRepository.findById.mockResolvedValue(null);
      await expect(productService.deleteProduct(99)).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});

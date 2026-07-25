'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const request   = require('supertest');
const app       = require('../../src/app');
const sequelize = require('../../src/config/database');

let categoryId;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  const catRes = await request(app).post('/api/v1/categories').send({ category_name: 'Electronics' });
  categoryId = catRes.body.data.id;
});
afterAll(async () => { await sequelize.close(); });

describe('GET /api/v1/products', () => {
  it('returns 200 with empty list', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('POST /api/v1/products', () => {
  it('creates a product', async () => {
    const res = await request(app).post('/api/v1/products').send({ product_name: 'Laptop', unit_price: 999.99, category_id: categoryId });
    expect(res.status).toBe(201);
    expect(res.body.data.product_name).toBe('Laptop');
  });
  it('returns 422 when product_name is missing', async () => {
    const res = await request(app).post('/api/v1/products').send({ unit_price: 9.99, category_id: categoryId });
    expect(res.status).toBe(422);
  });
  it('returns 422 when unit_price is missing', async () => {
    const res = await request(app).post('/api/v1/products').send({ product_name: 'X', category_id: categoryId });
    expect(res.status).toBe(422);
  });
});

describe('GET /api/v1/products/:id', () => {
  let id;
  beforeAll(async () => {
    const res = await request(app).post('/api/v1/products').send({ product_name: 'Smartphone', unit_price: 599.99, category_id: categoryId });
    id = res.body.data.id;
  });
  it('returns the product with nested category', async () => {
    const res = await request(app).get(`/api/v1/products/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.product_name).toBe('Smartphone');
    expect(res.body.data.category).toBeDefined();
  });
  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/v1/products/999999');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/v1/products/:id', () => {
  let id;
  beforeAll(async () => {
    const res = await request(app).post('/api/v1/products').send({ product_name: 'Old Name', unit_price: 10.00, category_id: categoryId });
    id = res.body.data.id;
  });
  it('updates and returns new data', async () => {
    const res = await request(app).put(`/api/v1/products/${id}`).send({ product_name: 'New Name' });
    expect(res.status).toBe(200);
    expect(res.body.data.product_name).toBe('New Name');
  });
});

describe('DELETE /api/v1/products/:id', () => {
  let id;
  beforeAll(async () => {
    const res = await request(app).post('/api/v1/products').send({ product_name: 'Temp', unit_price: 1.00, category_id: categoryId });
    id = res.body.data.id;
  });
  it('deletes and returns 200', async () => {
    const res = await request(app).delete(`/api/v1/products/${id}`);
    expect(res.status).toBe(200);
  });
  it('returns 404 after deletion', async () => {
    const res = await request(app).get(`/api/v1/products/${id}`);
    expect(res.status).toBe(404);
  });
});

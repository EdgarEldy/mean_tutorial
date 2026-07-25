'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const request   = require('supertest');
const app       = require('../../src/app');
const sequelize = require('../../src/config/database');

beforeAll(async () => { await sequelize.sync({ force: true }); });
afterAll(async  () => { await sequelize.close(); });

describe('GET /api/v1/categories', () => {
  it('returns 200 with empty list', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('POST /api/v1/categories', () => {
  it('creates a category', async () => {
    const res = await request(app).post('/api/v1/categories').send({ category_name: 'Electronics' });
    expect(res.status).toBe(201);
    expect(res.body.data.category_name).toBe('Electronics');
  });
  it('returns 422 when category_name is missing', async () => {
    const res = await request(app).post('/api/v1/categories').send({});
    expect(res.status).toBe(422);
  });
});

describe('GET /api/v1/categories/:id', () => {
  let id;
  beforeAll(async () => {
    const res = await request(app).post('/api/v1/categories').send({ category_name: 'Books' });
    id = res.body.data.id;
  });
  it('returns the category', async () => {
    const res = await request(app).get(`/api/v1/categories/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.category_name).toBe('Books');
  });
  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/v1/categories/999999');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/v1/categories/:id', () => {
  let id;
  beforeAll(async () => {
    const res = await request(app).post('/api/v1/categories').send({ category_name: 'Clothes' });
    id = res.body.data.id;
  });
  it('updates and returns new data', async () => {
    const res = await request(app).put(`/api/v1/categories/${id}`).send({ category_name: 'Clothing' });
    expect(res.status).toBe(200);
    expect(res.body.data.category_name).toBe('Clothing');
  });
});

describe('DELETE /api/v1/categories/:id', () => {
  let id;
  beforeAll(async () => {
    const res = await request(app).post('/api/v1/categories').send({ category_name: 'Temp' });
    id = res.body.data.id;
  });
  it('deletes and returns 200', async () => {
    const res = await request(app).delete(`/api/v1/categories/${id}`);
    expect(res.status).toBe(200);
  });
  it('returns 404 after deletion', async () => {
    const res = await request(app).get(`/api/v1/categories/${id}`);
    expect(res.status).toBe(404);
  });
});

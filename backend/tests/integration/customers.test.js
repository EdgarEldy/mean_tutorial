'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const request   = require('supertest');
const app       = require('../../src/app');
const sequelize = require('../../src/config/database');

beforeAll(async () => { await sequelize.sync({ force: true }); });
afterAll(async  () => { await sequelize.close(); });

describe('GET /api/v1/customers', () => {
  it('returns 200 with empty list', async () => {
    const res = await request(app).get('/api/v1/customers');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('POST /api/v1/customers', () => {
  it('creates a customer with all fields', async () => {
    const res = await request(app).post('/api/v1/customers').send({ first_name: 'Alice', last_name: 'Smith', email: 'alice@example.com' });
    expect(res.status).toBe(201);
    expect(res.body.data.first_name).toBe('Alice');
  });
  it('creates a customer with no fields (all nullable)', async () => {
    const res = await request(app).post('/api/v1/customers').send({});
    expect(res.status).toBe(201);
  });
  it('returns 422 when email format is invalid', async () => {
    const res = await request(app).post('/api/v1/customers').send({ email: 'not-an-email' });
    expect(res.status).toBe(422);
  });
});

describe('GET /api/v1/customers/:id', () => {
  let id;
  beforeAll(async () => {
    const res = await request(app).post('/api/v1/customers').send({ first_name: 'Bob', last_name: 'Jones' });
    id = res.body.data.id;
  });
  it('returns the customer', async () => {
    const res = await request(app).get(`/api/v1/customers/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.first_name).toBe('Bob');
  });
  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/v1/customers/999999');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/v1/customers/:id', () => {
  let id;
  beforeAll(async () => {
    const res = await request(app).post('/api/v1/customers').send({ first_name: 'Carol' });
    id = res.body.data.id;
  });
  it('updates and returns new data', async () => {
    const res = await request(app).put(`/api/v1/customers/${id}`).send({ first_name: 'Caroline' });
    expect(res.status).toBe(200);
    expect(res.body.data.first_name).toBe('Caroline');
  });
});

describe('DELETE /api/v1/customers/:id', () => {
  let id;
  beforeAll(async () => {
    const res = await request(app).post('/api/v1/customers').send({ first_name: 'Temp' });
    id = res.body.data.id;
  });
  it('deletes and returns 200', async () => {
    const res = await request(app).delete(`/api/v1/customers/${id}`);
    expect(res.status).toBe(200);
  });
  it('returns 404 after deletion', async () => {
    const res = await request(app).get(`/api/v1/customers/${id}`);
    expect(res.status).toBe(404);
  });
});

import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose from 'mongoose';
import request from 'supertest';

import app from '@src/app';
import { User } from '@src/models/user.model';

async function getAdminToken(): Promise<string> {
  await request(app).post('/api/admin/seed').expect(200);

  const response = await request(app)
    .post('/api/admin/login')
    .send({
      username: 'admin',
      password: 'admin@2026',
    })
    .expect(200);

  return response.body.data.token as string;
}

test('POST /api/admin/seed provisions the admin user and system config', async () => {
  const response = await request(app).post('/api/admin/seed').expect(200);

  assert.equal(response.body.success, true);
  assert.equal(response.body.data.adminSeeded, true);
  assert.equal(response.body.data.systemConfigSeeded, true);
});

test('POST /api/admin/login authenticates the seeded admin', async () => {
  await request(app).post('/api/admin/seed').expect(200);

  const response = await request(app)
    .post('/api/admin/login')
    .send({
      username: 'admin',
      password: 'admin@2026',
    })
    .expect(200);

  assert.equal(response.body.success, true);
  assert.equal(response.body.data.admin.username, 'admin');
  assert.equal(response.body.data.admin.role, 'admin');
  assert.ok(typeof response.body.data.token === 'string');
  assert.equal(response.body.data.token.split('.').length, 3);

  const admin = mongoose.connection.readyState === 1
    ? await User.findOne({ username: 'admin' }).lean().exec()
    : null;

  if (admin) {
    assert.match(admin.password, /^\$2[aby]\$\d{2}\$/);
  }
});

test('POST /api/admin/login rejects invalid credentials', async () => {
  const response = await request(app)
    .post('/api/admin/login')
    .send({
      username: 'admin',
      password: 'wrong-password',
    })
    .expect(401);

  assert.equal(response.body.success, false);
});

test('GET /api/admin/dashboard returns dashboard summary', async () => {
  const token = await getAdminToken();
  const response = await request(app)
    .get('/api/admin/dashboard')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.equal(response.body.success, true);
  assert.ok(response.body.data.adminSeeded === true || response.body.data.adminSeeded === false);
  assert.ok(typeof response.body.data.menuItemsCount === 'number');
  assert.ok(typeof response.body.data.ordersCount === 'number');
  assert.ok(typeof response.body.data.customersCount === 'number');
});

test('GET /api/admin/dashboard requires an admin token', async () => {
  const response = await request(app).get('/api/admin/dashboard').expect(401);

  assert.equal(response.body.success, false);
});

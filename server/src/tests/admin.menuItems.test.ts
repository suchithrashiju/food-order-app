import assert from 'node:assert/strict';
import test from 'node:test';

import request from 'supertest';

import app from '@src/app';

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

test('admin menu-items CRUD flow works', async () => {
  const token = await getAdminToken();

  const createResponse = await request(app)
    .post('/api/admin/menu-items')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Admin Menu Item',
      description: 'Created by admin',
      price: 9.99,
      category: 'Admin',
      isAvailable: true,
    })
    .expect(201);

  const id = createResponse.body.data.id;

  assert.equal(createResponse.body.data.createdBy, 'admin');

  const listResponse = await request(app)
    .get('/api/admin/menu-items')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  assert.ok(Array.isArray(listResponse.body.data));

  const updateResponse = await request(app)
    .patch(`/api/admin/menu-items/${id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Admin Menu Item Updated' })
    .expect(200);

  assert.equal(updateResponse.body.data.name, 'Admin Menu Item Updated');
  assert.equal(updateResponse.body.data.updatedBy, 'admin');

  const statusResponse = await request(app)
    .patch(`/api/admin/menu-items/${id}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({ isAvailable: false })
    .expect(200);

  assert.equal(statusResponse.body.data.isAvailable, false);

  const deleteResponse = await request(app)
    .delete(`/api/admin/menu-items/${id}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.equal(deleteResponse.body.data.isDeleted, true);
});

test('admin menu-items rejects invalid create payload', async () => {
  const token = await getAdminToken();

  const response = await request(app)
    .post('/api/admin/menu-items')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: '',
      description: 'bad',
      price: -1,
      category: '',
    })
    .expect(400);

  assert.equal(response.body.success, false);
});

test('admin menu-items requires an admin token', async () => {
  const response = await request(app)
    .post('/api/admin/menu-items')
    .send({
      name: 'No Auth Item',
      description: 'Should not be created',
      price: 5,
      category: 'Admin',
    })
    .expect(401);

  assert.equal(response.body.success, false);
});

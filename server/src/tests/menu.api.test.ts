import assert from 'node:assert/strict';
import test from 'node:test';

import request from 'supertest';

import app from '@src/app';

test('GET /api/menu returns a menu list', async () => {
  const response = await request(app).get('/api/menu').expect(200);

  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.data));
  assert.ok(response.body.data.length > 0);
});

test('public menu write routes are not exposed', async () => {
  await request(app)
    .post('/api/menu')
    .send({
      name: 'Test Burger',
      description: 'A test burger for validation',
      price: 11.5,
      category: 'Burgers',
      isAvailable: true,
    })
    .expect(404);

  await request(app).patch('/api/menu/example-id').send({ name: 'Updated Dish' }).expect(404);
  await request(app).delete('/api/menu/example-id').expect(404);
});

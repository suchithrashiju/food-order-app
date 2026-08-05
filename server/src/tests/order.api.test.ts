import assert from 'node:assert/strict';
import test from 'node:test';

import request from 'supertest';

import app from '@src/app';

process.env.ORDER_STATUS_SIMULATION = 'false';

const validOrderPayload = {
  items: [
    {
      menuItemId: 'menu-item-1',
      name: 'Classic Burger',
      price: 10,
      quantity: 2,
    },
  ],
  delivery: {
    name: 'Jane Customer',
    phone: '+91 98765 43210',
    address: '12 MG Road',
    city: 'Bengaluru',
    postalCode: '560001',
  },
};

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

async function placeOrder(
  overrides: Record<string, unknown> = {},
): Promise<{ id: string; orderReference: string }> {
  const response = await request(app)
    .post('/api/orders')
    .send({
      ...validOrderPayload,
      ...overrides,
      items: (overrides.items as typeof validOrderPayload.items) ?? validOrderPayload.items,
      delivery: {
        ...validOrderPayload.delivery,
        ...((overrides.delivery as Record<string, unknown>) ?? {}),
      },
    })
    .expect(201);

  return {
    id: response.body.data.id as string,
    orderReference: response.body.data.orderReference as string,
  };
}

test('POST /api/orders places an order and returns Order Received status', async () => {
  const response = await request(app).post('/api/orders').send(validOrderPayload).expect(201);

  assert.equal(response.body.success, true);
  assert.equal(response.body.data.status, 'Order Received');
  assert.match(response.body.data.orderReference, /^FO-\d{6}-[A-F0-9]{6}$/);
  assert.equal(response.body.data.items.length, 1);
  assert.equal(response.body.data.delivery.name, 'Jane Customer');
  assert.equal(response.body.data.subtotal, 20);
  assert.equal(response.body.data.deliveryFee, 2.99);
  assert.equal(response.body.data.tax, 1.6);
  assert.equal(response.body.data.total, 24.59);
  assert.ok(Array.isArray(response.body.data.statusHistory));
  assert.equal(response.body.data.statusHistory[0].status, 'Order Received');
});

test('POST /api/orders rejects empty items and invalid delivery details', async () => {
  const emptyItems = await request(app)
    .post('/api/orders')
    .send({
      ...validOrderPayload,
      items: [],
    })
    .expect(400);

  assert.equal(emptyItems.body.success, false);
  assert.equal(emptyItems.body.message, 'Validation failed');

  const badDelivery = await request(app)
    .post('/api/orders')
    .send({
      ...validOrderPayload,
      delivery: {
        name: 'A',
        phone: 'bad',
        address: 'x',
        city: '',
        postalCode: '1',
      },
    })
    .expect(400);

  assert.equal(badDelivery.body.success, false);
  assert.equal(badDelivery.body.message, 'Validation failed');
  assert.ok(Array.isArray(badDelivery.body.details));
  assert.ok(badDelivery.body.details.length > 0);
});

test('POST /api/orders rejects invalid quantity', async () => {
  const response = await request(app)
    .post('/api/orders')
    .send({
      ...validOrderPayload,
      items: [
        {
          menuItemId: 'menu-item-1',
          name: 'Classic Burger',
          price: 10,
          quantity: 0,
        },
      ],
    })
    .expect(400);

  assert.equal(response.body.success, false);
  assert.equal(response.body.message, 'Validation failed');
});

test('GET /api/orders/:id returns order by id and by reference', async () => {
  const placed = await placeOrder();

  const byId = await request(app).get(`/api/orders/${placed.id}`).expect(200);
  assert.equal(byId.body.data.id, placed.id);
  assert.equal(byId.body.data.orderReference, placed.orderReference);

  const byReference = await request(app)
    .get(`/api/orders/${placed.orderReference}`)
    .expect(200);
  assert.equal(byReference.body.data.id, placed.id);

  const missing = await request(app).get('/api/orders/does-not-exist').expect(404);
  assert.equal(missing.body.success, false);
  assert.match(missing.body.message, /not found/i);
});

test('PATCH /api/admin/orders/:id/status updates status through the lifecycle', async () => {
  const token = await getAdminToken();
  const placed = await placeOrder();

  const preparing = await request(app)
    .patch(`/api/admin/orders/${placed.id}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'Preparing', remarks: 'Kitchen started cooking' })
    .expect(200);

  assert.equal(preparing.body.data.status, 'Preparing');
  assert.ok(
    preparing.body.data.statusHistory.some(
      (entry: { status: string }) => entry.status === 'Preparing',
    ),
  );

  const outForDelivery = await request(app)
    .patch(`/api/admin/orders/${placed.id}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'Out for Delivery', remarks: 'Driver assigned' })
    .expect(200);

  assert.equal(outForDelivery.body.data.status, 'Out for Delivery');

  const delivered = await request(app)
    .patch(`/api/admin/orders/${placed.id}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'Delivered', remarks: 'Handed to customer' })
    .expect(200);

  assert.equal(delivered.body.data.status, 'Delivered');

  const customerView = await request(app).get(`/api/orders/${placed.orderReference}`).expect(200);
  assert.equal(customerView.body.data.status, 'Delivered');
});

test('PATCH /api/admin/orders/:id/status requires auth, remarks, and blocks invalid transitions', async () => {
  const token = await getAdminToken();
  const placed = await placeOrder();

  await request(app)
    .patch(`/api/admin/orders/${placed.id}/status`)
    .send({ status: 'Preparing', remarks: 'No auth' })
    .expect(401);

  const missingRemarks = await request(app)
    .patch(`/api/admin/orders/${placed.id}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'Preparing', remarks: '' })
    .expect(400);

  assert.match(missingRemarks.body.message, /remarks/i);

  await request(app)
    .patch(`/api/admin/orders/${placed.id}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'Delivered', remarks: 'Completed' })
    .expect(200);

  const afterDelivered = await request(app)
    .patch(`/api/admin/orders/${placed.id}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'Preparing', remarks: 'Should fail' })
    .expect(400);

  assert.match(afterDelivered.body.message, /delivered/i);
});

test('GET /api/admin/orders lists orders for authenticated admin', async () => {
  const token = await getAdminToken();
  await placeOrder({
    delivery: {
      ...validOrderPayload.delivery,
      name: 'List Test Customer',
    },
  });

  const response = await request(app)
    .get('/api/admin/orders')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.data));
  assert.ok(response.body.count >= 1);
});

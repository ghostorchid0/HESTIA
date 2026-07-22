const request = require('supertest');
const { app, dbReadyPromise } = require('../server');

let token;
let roomUuid;
let roomId;
let menuItemId;
let orderId;

beforeAll(async () => {
  await dbReadyPromise;
});

describe('Auth', () => {
  it('should login with default admin credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' })
      .expect(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.role).toBe('admin');
    token = res.body.token;
  });
});

describe('Public routes', () => {
  it('should return active menu items', async () => {
    const res = await request(app).get('/api/menu').expect(200);
    expect(res.body.length).toBeGreaterThan(0);
    menuItemId = res.body[0]._id;
  });

  it('should validate an active room', async () => {
    const rooms = await request(app)
      .get('/api/admin/rooms')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(rooms.body.length).toBeGreaterThan(0);
    roomUuid = rooms.body[0].uuid;
    roomId = rooms.body[0]._id;

    const res = await request(app).get(`/api/room/${roomUuid}`).expect(200);
    expect(res.body.valid).toBe(true);
  });
});

describe('Orders', () => {
  it('should create an order for a valid room', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        roomUuid,
        items: [{ menuItemId, quantity: 2, notes: 'No salt' }],
        notes: 'Test order',
      })
      .expect(201);
    expect(res.body.status).toBe('Received');
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.history.length).toBe(1);
    orderId = res.body._id;
  });

  it('should reject an order for an invalid room', async () => {
    await request(app)
      .post('/api/orders')
      .send({ roomUuid: 'invalid-uuid', items: [{ menuItemId, quantity: 1 }] })
      .expect(404);
  });

  it('should retrieve the order with room uuid', async () => {
    const res = await request(app)
      .get(`/api/orders/${orderId}?roomUuid=${roomUuid}`)
      .expect(200);
    expect(res.body._id).toBe(orderId);
  });
});

describe('Admin routes', () => {
  it('should update order status and append history', async () => {
    const res = await request(app)
      .patch(`/api/admin/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Preparing' })
      .expect(200);
    expect(res.body.status).toBe('Preparing');
    expect(res.body.history.length).toBe(2);
    expect(res.body.history[1].changedBy).toBe('admin');
  });

  it('should generate a QR code for a room', async () => {
    const res = await request(app)
      .get(`/api/admin/rooms/${roomId}/qr`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(res.body.url).toContain(`/room/${roomUuid}`);
  });
});

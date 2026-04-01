import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

async function getAuthCookies() {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Alice', email: 'alice@test.com', password: 'password123' });
  return res.headers['set-cookie'];
}

describe('GET /api/conversations', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/conversations');
    expect(res.status).toBe(401);
  });

  it('returns empty list for new user', async () => {
    const cookies = await getAuthCookies();
    const res = await request(app)
      .get('/api/conversations')
      .set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(res.body.conversations).toHaveLength(0);
  });
});

describe('POST /api/conversations', () => {
  it('creates a conversation', async () => {
    const cookies = await getAuthCookies();
    const res = await request(app)
      .post('/api/conversations')
      .set('Cookie', cookies)
      .send({ title: 'Test Chat' });
    expect(res.status).toBe(201);
    expect(res.body.conversation.title).toBe('Test Chat');
  });
});

describe('DELETE /api/conversations/:id', () => {
  it('deletes conversation and returns ok', async () => {
    const cookies = await getAuthCookies();
    const create = await request(app)
      .post('/api/conversations')
      .set('Cookie', cookies)
      .send({ title: 'To Delete' });

    const res = await request(app)
      .delete(`/api/conversations/${create.body.conversation._id}`)
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import app from '../src/app';

describe('API Security and Endpoints', () => {
  let server: http.Server;
  let baseUrl: string;

  before(async () => {
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address() as any;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('1. Returns 200 for public /health check', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);

    const data = await res.json() as any;
    assert.strictEqual(data.status, 'ok');
    assert.ok(data.timestamp);
  });

  it('2. Returns API version info at /api/v1', async () => {
    const res = await fetch(`${baseUrl}/api/v1`);
    assert.strictEqual(res.status, 200);

    const data = await res.json() as any;
    assert.strictEqual(data.name, 'CareerMatch AI API');
    assert.strictEqual(data.version, '1.0.0');
    assert.ok(Array.isArray(data.endpoints));
  });

  it('3. Sets security headers via Helmet', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.ok(res.headers.get('x-dns-prefetch-control') || res.headers.get('x-content-type-options'));
  });

  it('4. Returns 404 for non-existent endpoint with JSON error structure', async () => {
    const res = await fetch(`${baseUrl}/api/v1/non-existent-route`);
    assert.strictEqual(res.status, 404);

    const data = await res.json() as any;
    assert.strictEqual(data.success, false);
    assert.ok(data.error);
  });

  it('5. Protects /api/v1/profile against unauthenticated access', async () => {
    const res = await fetch(`${baseUrl}/api/v1/profile`);
    assert.strictEqual(res.status, 401);
    const data = await res.json() as any;
    assert.strictEqual(data.success, false);
    assert.ok(data.error);
  });

  it('6. Protects /api/v1/ai/status against unauthenticated access', async () => {
    const res = await fetch(`${baseUrl}/api/v1/ai/status`);
    assert.strictEqual(res.status, 401);
    const data = await res.json() as any;
    assert.strictEqual(data.success, false);
    assert.ok(data.error);
  });

  it('7. Enforces server-side authorization on /api/v1/admin/stats', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/stats`);
    assert.strictEqual(res.status, 401);
    const data = await res.json() as any;
    assert.strictEqual(data.success, false);
  });
});

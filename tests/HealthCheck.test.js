require('dotenv').config();
const request = require('supertest');
const app = require('../server');
const sequelize = require('../config/database');

jest.useFakeTimers();

beforeAll(async () => {
    await sequelize.sync();
});

afterAll(async () => {
    await sequelize.close();
});

describe('HealthCheck API', () => {
    it('should return 200 OK for GET /healthz', async () => {
        const res = await request(app).get('/healthz');
        expect(res.status).toBe(200);
        expect(res.headers['cache-control']).toContain('no-cache');
        expect(res.headers['pragma']).toBe('no-cache');
    });
    
    it('should return 405 for unsupported method POST /healthz', async () => {
        const res  = await request(app).post('/healthz');
        expect(res.status).toBe(405);
        expect(res.headers).toHaveProperty('cache-control');
        expect(res.headers['cache-control']).toContain('no-cache');
        expect(res.headers).toHaveProperty('pragma');
        expect(res.headers['pragma']).toBe('no-cache');
    });

    it('should return 405 for unsupported method PUT /healthz', async () => {
        const res  = await request(app).put('/healthz');
        expect(res.status).toBe(405);
        expect(res.headers).toHaveProperty('cache-control');
        expect(res.headers['cache-control']).toContain('no-cache');
        expect(res.headers).toHaveProperty('pragma');
        expect(res.headers['pragma']).toBe('no-cache');
    });

    it('should return 405 for unsupported method PATCH /healthz', async () => {
        const res  = await request(app).patch('/healthz');
        expect(res.status).toBe(405);
        expect(res.headers).toHaveProperty('cache-control');
        expect(res.headers['cache-control']).toContain('no-cache');
        expect(res.headers).toHaveProperty('pragma');
        expect(res.headers['pragma']).toBe('no-cache');
    });

    it('should return 405 for unsupported method DELETE /healthz', async () => {
        const res  = await request(app).delete('/healthz');
        expect(res.status).toBe(405);
        expect(res.headers).toHaveProperty('cache-control');
        expect(res.headers['cache-control']).toContain('no-cache');
        expect(res.headers).toHaveProperty('pragma');
        expect(res.headers['pragma']).toBe('no-cache');
    });

    it('should return 400 Bad Request if request has an empty body', async () => {
        const res = await request(app).get('/healthz').send({});
        expect(res.status).toBe(400);
    });

    it('should return 400 Bad Request if request has a non-empty body', async () => {
        const res = await request(app).get('/healthz').send({ key: "value" });
        expect(res.status).toBe(400);
    });
    
    it('should return 400 Bad Request if request has query parameters', async () => {
        const res = await request(app).get('/healthz?test=value');
        expect(res.status).toBe(400);
    });

    it('should return 503 if database is down', async () => {
        await sequelize.close();
        const res = await request(app).get('/healthz');
        expect(res.status).toBe(503);

    });
});
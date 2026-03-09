import { describe, it, expect, vi } from 'vitest'; 
const request = require('supertest');
const axios = require('axios');
const { app } = require('../gateway-service');

vi.mock('axios');

describe('Gateway Service', () => {
  it('should respond with status 200 for /health endpoint', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.service).toBe('gateway');
  });
});
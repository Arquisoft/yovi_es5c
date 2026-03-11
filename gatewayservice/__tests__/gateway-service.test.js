import { describe, it, expect, vi, afterEach } from 'vitest'; 
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

describe('Gateway Service - Login Routing', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should route POST /login to the user service', async () => {
        // Inicializamos el mock aquí dentro para no necesitar beforeEach
        axios.post = vi.fn();
        
        // Simulamos la respuesta correcta del microservicio de usuarios
        const mockResponse = { data: { token: 'fake-jwt-token', username: 'testuser' } };
        axios.post.mockResolvedValueOnce(mockResponse);

        const res = await request(app)
            .post('/login')
            .send({ username: 'testuser', password: 'password123' });

        expect(res.status).toBe(200);
        expect(res.body.token).toBe('fake-jwt-token');
        
        // Verificamos que el gateway usó axios para llamar al microservicio correcto
        expect(axios.post).toHaveBeenCalledTimes(1);
        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/login'), 
            { username: 'testuser', password: 'password123' }
        );
    });

    it('should forward errors from the user service', async () => {
        // Inicializamos el mock aquí dentro también
        axios.post = vi.fn();

        // Simulamos un error 401 desde el microservicio
        axios.post.mockRejectedValueOnce({
            response: { status: 401, data: { error: 'Invalid credentials' } }
        });

        const res = await request(app)
            .post('/login')
            .send({ username: 'testuser', password: 'wrongpassword' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid credentials');
    });
});
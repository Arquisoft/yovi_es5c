import { describe, it, expect, vi, afterEach, afterAll } from 'vitest'; 
const request = require('supertest');
const axios = require('axios');
const { app, server, parseYenPosition, resolvePublicBotConfig } = require('../gateway-service');

vi.mock('axios');

afterAll(() => {
  if (server) {
    server.close();
  }
});

describe('Gateway Service', () => {
  it('should respond with status 200 for /health endpoint', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.service).toBe('gateway');
  });

  it('should serve Swagger UI for the public API docs', async () => {
    const response = await request(app).get('/api-docs/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Swagger UI');
  });
});

describe('Gateway Service - Login Routing', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should route POST /login to the user service', async () => {
        axios.post = vi.fn();
        
        const mockResponse = { data: { token: 'fake-jwt-token', username: 'testuser' } };
        axios.post.mockResolvedValueOnce(mockResponse);

        const res = await request(app)
            .post('/login')
            .send({ username: 'testuser', password: 'password123' });

        expect(res.status).toBe(200);
        expect(res.body.token).toBe('fake-jwt-token');
        
        expect(axios.post).toHaveBeenCalledTimes(1);
        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/login'), 
            { username: 'testuser', password: 'password123' }
        );
    });

    it('should forward errors from the user service', async () => {
        axios.post = vi.fn();

        axios.post.mockRejectedValueOnce({
            response: { status: 401, data: { error: 'Invalid credentials' } }
        });

        const res = await request(app)
            .post('/login')
            .send({ username: 'testuser', password: 'wrongpassword' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid credentials');
    });

    it('should route GET /user/:username to the user service', async () => {
        axios.get = vi.fn();
        axios.get.mockResolvedValueOnce({
            data: {
                username: 'testuser',
                name: 'Test',
                surname: 'User',
                email: 'test@uniovi.es'
            }
        });

        // Simulamos que el frontend envía la cabecera
        const res = await request(app)
            .get('/user/testuser')
            .set('Authorization', 'Bearer fake-token-123');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            username: 'testuser',
            name: 'Test',
            surname: 'User',
            email: 'test@uniovi.es'
        });
        expect(axios.get).toHaveBeenCalledTimes(1);
        // Ahora esperamos que axios reciba también los headers configurados
        expect(axios.get).toHaveBeenCalledWith(
            expect.stringContaining('/user/testuser'),
            { headers: { Authorization: 'Bearer fake-token-123' } }
        );
    });

    it('should route PUT /user/:username to the user service', async () => {
        axios.put = vi.fn();
        axios.put.mockResolvedValueOnce({
            data: {
                username: 'testuser',
                name: 'Mario',
                surname: 'Trelles',
                email: 'mario@uniovi.es'
            }
        });

        const payload = {
            name: 'Mario',
            surname: 'Trelles',
            email: 'mario@uniovi.es'
        };

        // Simulamos que el frontend envía la cabecera
        const res = await request(app)
            .put('/user/testuser')
            .set('Authorization', 'Bearer fake-token-123')
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            username: 'testuser',
            name: 'Mario',
            surname: 'Trelles',
            email: 'mario@uniovi.es'
        });
        expect(axios.put).toHaveBeenCalledTimes(1);
        // Ahora esperamos que axios reciba los datos Y los headers
        expect(axios.put).toHaveBeenCalledWith(
            expect.stringContaining('/user/testuser'),
            payload,
            { headers: { Authorization: 'Bearer fake-token-123' } }
        );
    });

    it('should route POST /game/finish to the user service', async () => {
        axios.post = vi.fn();
        const mockResponse = { data: { success: true } };
        axios.post.mockResolvedValueOnce(mockResponse);

        const gameData = {
            userId: 'testuser',
            rival: 'bot',
            level: 'Medium',
            duration: 120,
            result: 'won'
        };

        const res = await request(app)
            .post('/game/finish')
            .set('Authorization', 'Bearer fake-token-123')
            .send(gameData);

        expect(res.status).toBe(201);
        expect(res.body).toEqual({ success: true });

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/game/finish'),
            gameData,
            { headers: { Authorization: 'Bearer fake-token-123' } }
        );
    });
});

describe('Gateway Service - Bot play API', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should resolve public bot defaults for tournament play', () => {
        expect(resolvePublicBotConfig()).toEqual({
            bot_id: 'alpha_bot',
            registry_bot_id: 'alpha_bot',
        });
    });

    it('should parse a valid YEN query payload', () => {
        expect(parseYenPosition('{"size":3,"turn":0,"players":["B","R"],"layout":"./../..."}')).toEqual({
            position: {
                size: 3,
                turn: 0,
                players: ['B', 'R'],
                layout: './../...'
            }
        });
    });

    it('should route GET /play to the Rust play endpoint with defaults', async () => {
        axios.get = vi.fn();
        const mockResponse = {
            data: {
                coords: { x: 1, y: 1, z: 0 }
            }
        };
        axios.get.mockResolvedValueOnce(mockResponse);

        const position = '{"size":3,"turn":0,"players":["B","R"],"layout":"./../..."}';

        const res = await request(app)
            .get('/play')
            .query({ position });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ coords: { x: 1, y: 1, z: 0 } });
        expect(axios.get).toHaveBeenCalledWith(
            expect.stringContaining('/v1/ybot/play'),
            expect.objectContaining({
                params: {
                    position,
                    bot_id: 'alpha_bot',
                }
            })
        );
    });

    it('should route GET /play with an explicit public bot', async () => {
        axios.get = vi.fn();
        axios.get.mockResolvedValueOnce({
            data: { coords: { x: 0, y: 2, z: 0 } }
        });

        const position = '{"size":3,"turn":0,"players":["B","R"],"layout":"./../..."}';

        const res = await request(app)
            .get('/play')
            .query({ position, bot_id: 'smart_bot' });

        expect(res.status).toBe(200);
        expect(axios.get).toHaveBeenCalledWith(
            expect.stringContaining('/v1/ybot/play'),
            expect.objectContaining({
                params: {
                    position,
                    bot_id: 'smart_bot',
                }
            })
        );
    });

    it('should reject GET /play when YEN position is missing', async () => {
        const res = await request(app)
            .get('/play')
            .query({ bot_id: 'alpha_bot' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('YEN position is required');
    });

    it('should reject GET /play when YEN position is not valid JSON', async () => {
        const res = await request(app)
            .get('/play')
            .query({ position: 'not-json' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('YEN position must be valid JSON');
    });

    it('should reject GET /play with an unknown public bot', async () => {
        const res = await request(app)
            .get('/play')
            .query({
                position: '{"size":3,"turn":0,"players":["B","R"],"layout":"./../..."}',
                bot_id: 'random_bot'
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Unknown bot_id');
    });

    it('should forward backend errors from GET /play', async () => {
        axios.get = vi.fn();
        axios.get.mockRejectedValueOnce({
            response: { status: 400, data: { message: 'Invalid YEN format' } }
        });

        const res = await request(app)
            .get('/play')
            .query({
                position: '{"size":3,"turn":0,"players":["B","R"],"layout":"invalid"}'
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid YEN format');
    });

    it('should reject incomplete YEN payloads', async () => {
        expect(parseYenPosition('{"size":3,"turn":0}')).toEqual({
            error: 'YEN position is required'
        });
    });

    describe('POST /game/abandon', () => {
    it('debe reenviar la petición de abandono modificada y devolver 201 si tiene éxito', async () => {
      const mockBackendResponse = { message: 'Partida abandonada guardada' };
      axios.post.mockResolvedValueOnce({ data: mockBackendResponse, status: 201 });

      const abandonPayload = {
        userId: 'testuser',
        rival: 'random_bot',
        level: 'Medium',
        duration: 15
      };

      const response = await request(app)
        .post('/game/abandon')
        .send(abandonPayload);

      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual(mockBackendResponse);
      
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/game/finish'), 
        {
          userId: 'testuser',
          rival: 'random_bot',
          level: 'Medium',
          duration: 15,
          result: 'lost'
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
    });

    it('debe manejar errores si el microservicio de juegos/usuarios falla al abandonar', async () => {
      axios.post.mockRejectedValueOnce(new Error('Backend error'));

      const abandonPayload = {
        userId: 'testuser',
        rival: 'random_bot',
        level: 'Medium',
        duration: 15
      };

      const response = await request(app)
        .post('/game/abandon')
        .send(abandonPayload);

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});
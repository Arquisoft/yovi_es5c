import { describe, it, expect, vi, afterEach } from 'vitest'; 
const request = require('supertest');
const axios = require('axios');
const { app, resolvePublicBotConfig } = require('../gateway-service');

vi.mock('axios');

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

        const res = await request(app).get('/user/testuser');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            username: 'testuser',
            name: 'Test',
            surname: 'User',
            email: 'test@uniovi.es'
        });
        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(axios.get).toHaveBeenCalledWith(
            expect.stringContaining('/user/testuser')
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

        const res = await request(app).put('/user/testuser').send(payload);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            username: 'testuser',
            name: 'Mario',
            surname: 'Trelles',
            email: 'mario@uniovi.es'
        });
        expect(axios.put).toHaveBeenCalledTimes(1);
        expect(axios.put).toHaveBeenCalledWith(
            expect.stringContaining('/user/testuser'),
            payload
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
            .send(gameData);

        expect(res.status).toBe(201);
        expect(res.body).toEqual({ success: true });
        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/game/finish'),
            gameData
        );
    });
});

describe('Gateway Service - Bot play API', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should resolve public bot defaults for tournament play', () => {
        expect(resolvePublicBotConfig()).toEqual({
            bot_id: 'center_bot',
            difficulty: 'Hard',
            registry_bot_id: 'center_bot',
        });
    });

    it('should route POST /play to the Rust play endpoint with defaults', async () => {
        axios.post = vi.fn();
        const mockResponse = {
            data: {
                size: 3,
                turn: 1,
                players: ['B', 'R'],
                layout: 'B/../...'
            }
        };
        axios.post.mockResolvedValueOnce(mockResponse);

        const position = {
            size: 3,
            turn: 0,
            players: ['B', 'R'],
            layout: './../...'
        };

        const res = await request(app)
            .post('/play')
            .send({ position });

        expect(res.status).toBe(200);
        expect(res.body.turn).toBe(1);
        expect(res.body.layout).toBe('B/../...');
        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/v1/ybot/play'),
            {
                position,
                bot_id: 'center_bot',
                difficulty: 'Hard',
            }
        );
    });

    it('should reject POST /play when position is missing', async () => {
        const res = await request(app)
            .post('/play')
            .send({ bot_id: 'center_bot' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('position is required');
    });

    it('should reject POST /play with unknown difficulty', async () => {
        const res = await request(app)
            .post('/play')
            .send({
                position: {
                    size: 3,
                    turn: 0,
                    players: ['B', 'R'],
                    layout: './../...'
                },
                difficulty: 'Impossible'
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Unknown difficulty');
    });

    it('should forward backend errors from POST /play', async () => {
        axios.post = vi.fn();
        axios.post.mockRejectedValueOnce({
            response: { status: 400, data: { message: 'Invalid YEN format' } }
        });

        const res = await request(app)
            .post('/play')
            .send({
                position: {
                    size: 3,
                    turn: 0,
                    players: ['B', 'R'],
                    layout: 'invalid'
                }
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid YEN format');
    });
});

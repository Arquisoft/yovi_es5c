import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

import User from '../model/user-model.js'
const bcrypt = require('bcrypt');

let mongoServer
let app

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()

  const mongoUri = mongoServer.getUri()
  process.env.MONGODB_URI = mongoUri

  app = require('../users-service') 
})

afterAll(async () => {
  await mongoose.connection.close()
  await mongoServer.stop()
})

afterEach(async () => {
  vi.restoreAllMocks()
  const User = require('../model/user-model')
  await User.deleteMany({})
})


describe('User Service', () => {
  it('should add a new user on POST /user', async () => {
    const newUser = {
      username: 'testuser',
      name: 'testname',
      surname: 'testsurname',
      email: 'test@uniovi.es',
      password: 'Admin123##',
    };

    const response = await request(app).post('/user').send(newUser);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'testuser');
    expect(response.body).toHaveProperty('name', 'testname');
    expect(response.body).toHaveProperty('surname', 'testsurname');
    expect(response.body).toHaveProperty('email', 'test@uniovi.es');

    // Check if the user is inserted into the database
    const userInDb = await User.findOne({ username: 'testuser' });

    // Assert that the user exists in the database
    expect(userInDb).not.toBeNull();
    expect(userInDb.username).toBe('testuser');

    // Assert that the password is encrypted
    const isPasswordValid = await bcrypt.compare('Admin123##', userInDb.password);
    expect(isPasswordValid).toBe(true);
  });

  it('should not add a user if username already exists', async () => {
    const existingUser = {
        username: 'testuser',
        name: 'testnameExisting',
        surname: 'testsurname',
        email: 'test@uniovi.es',
        password: 'Admin123##',
    };

    // First attempt: user is created successfully
    await request(app).post('/user').send(existingUser);

    // Second attempt: same username, should fail
    const response = await request(app).post('/user').send(existingUser);

    // Check that the status code is 400 
    expect(response.status).toBe(400);

    // Check that an error message is received in the "error" field
    expect(response.body).toHaveProperty('error'); 

    // Check that the error message indicates the username already exists
    expect(response.body.error).toBe('Invalid username');

  });

  it('should return error if username is less than 4 characters long', async () => {
    const newUser = {
        username: 'tes',
        name: 'testname',
        surname: 'testsurname',
        email: 'test@uniovi.es',
        password: 'Admin123##',
    };

    // Send the request to create the user
    const response = await request(app).post('/user').send(newUser);

    // Check that the status code is 400 (or whatever your backend uses for validation errors)
    expect(response.status).toBe(400);

    // Check that the error message is returned in the "error" field
    expect(response.body).toHaveProperty('error');

    // Check that the error message is specific to the username
    expect(response.body.error).toBe('The username must be at least 4 characters long');
  });

  it('should return error if password is less than 8 characters long', async () => {
    const newUser = {
        username: 'testuser',
        name: 'testname',
        surname: 'testsurname',
        email: 'test@uniovi.es',
        password: 'Admin1',
    };

    const response = await request(app).post('/user').send(newUser);

    // Check that the status code is 400 (error)
    expect(response.status).toBe(400);

    // Check that the error message is returned in the "error" field
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('The password must be at least 8 characters long');
  });

  it('should return error if password does not contain numeric character', async () => {
    const newUser = {
        username: 'testuser',
        name: 'testname',
        surname: 'testsurname',
        email: 'test@uniovi.es',
        password: 'Admin####',
    };

    const response = await request(app).post('/user').send(newUser);

    // Check that the status code is 400 (error)
    expect(response.status).toBe(400);

    // Check that the error message is returned in the "error" field
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('The password must contain at least one numeric character');
  });

  it('The password must contain at least one uppercase letter', async () => {
    const newUser = {
        username: 'testuser',
        name: 'testname',
        surname: 'testsurname',
        email: 'test@uniovi.es',
        password: 'admin123##',
    };

    const response = await request(app).post('/user').send(newUser);

    // Check that the status code is 400 (error)
    expect(response.status).toBe(400);

    // Check that the error message is returned in the "error" field
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('The password must contain at least one uppercase letter');
  });

  it('The name cannot be empty or contain only spaces', async () => {
    const newUser = {
        username: 'testuser',
        name: '',
        surname: 'testsurname',
        email: 'test@uniovi.es',
        password: 'Admin123##',
    };

    const response = await request(app).post('/user').send(newUser);

    // Check that the status code is 400 (error)
    expect(response.status).toBe(400);

    // Check that the error message is returned in the "error" field
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('The name cannot be empty or contain only spaces');
  });

  it('The surname cannot be empty or contain only spaces', async () => {
    const newUser = {
        username: 'testuser',
        name: 'testname',
        surname: '',
        email: 'test@uniovi.es',
        password: 'Admin123##',
    };

    const response = await request(app).post('/user').send(newUser);

    // Check that the status code is 400 (error)
    expect(response.status).toBe(400);

    // Check that the error message is returned in the "error" field
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('The surname cannot be empty or contain only spaces');
  });

})

describe('POST /login', () => {
    afterEach(async () => {
        vi.restoreAllMocks()
        const User = mongoose.model('User')
        await User.deleteMany({}) // Limpiamos la BD después de cada test
    })

    it('successfully logs in a registered user', async () => {
        const username = 'LoginUser'
        const password = 'TestPassword123'

        // 1. Primero creamos el usuario (simulando que ya existe en BD)
        await request(app)
            .post('/createuser')
            .send({ username, password }) // Asumiendo que createuser acepta password
            .set('Accept', 'application/json')

        // 2. Intentamos hacer login
        const loginRes = await request(app)
            .post('/login')
            .send({ username, password })
            .set('Accept', 'application/json')

        expect(loginRes.status).toBe(200)
        expect(loginRes.body).toHaveProperty('token') // O la propiedad que devuelvas (ej. message, user)
        expect(loginRes.body.username).toBe(username)
    })

    it('fails to log in with incorrect password', async () => {
        const username = 'LoginUser'
        
        await request(app)
            .post('/createuser')
            .send({ username, password: 'CorrectPassword' })
            .set('Accept', 'application/json')

        const loginRes = await request(app)
            .post('/login')
            .send({ username, password: 'WrongPassword' })
            .set('Accept', 'application/json')

        expect(loginRes.status).toBe(401) // O 400 dependiendo de tu implementación
        expect(loginRes.body).toHaveProperty('error')
    })
})

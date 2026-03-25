import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, vi } from 'vitest'
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

  it('The email cannot be empty or contain only spaces', async () => {
    const newUser = {
        username: 'testuser',
        name: 'testname',
        surname: 'testsurname',
        email: '   ', // Email vacío o con espacios
        password: 'Admin123##',
    };

    const response = await request(app).post('/user').send(newUser);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('The email cannot be empty or contain only spaces');
  });

  it('should logout a user on POST /logout', async () => {
    const user = new User({
      username: 'testuser',
      name: 'test',
      surname: 'user',
      email: 'test@uniovi.es',
      password: 'hashedpassword',
    });

    await user.save();

    const response = await request(app)
      .post('/logout')
      .send({ username: 'testuser' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      'message',
      'User testuser logged out'
    );

    const userInDb = await User.findOne({ username: 'testuser' });

    expect(userInDb).not.toBeNull();
    expect(userInDb.lastLogoutAt).not.toBeNull();
});

describe('Login endpoints', () => {
    beforeEach(async () => {
      // Creamos un usuario válido antes de probar el login
      const hashedPassword = await bcrypt.hash('Admin123##', 10);
      const user = new User({
        username: 'logintest',
        name: 'test',
        surname: 'user',
        email: 'login@uniovi.es',
        password: hashedPassword,
      });
      await user.save();
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app).post('/login').send({
        username: 'logintest',
        password: 'Admin123##'
      });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should fail if username or password is missing', async () => {
      const response = await request(app).post('/login').send({
        username: 'logintest'
        // password is missing
      });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username and password are required.');
    });

    it('should fail if user does not exist', async () => {
      const response = await request(app).post('/login').send({
        username: 'doesnotexist',
        password: 'Admin123##'
      });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Incorrect username or password');
    });

    it('should fail if password is incorrect', async () => {
      const response = await request(app).post('/login').send({
        username: 'logintest',
        password: 'WrongPassword123##'
      });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Incorrect username or password');
    });
  });

})



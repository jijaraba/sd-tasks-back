const request = require('supertest');
const express = require('express');
const cors = require('cors');
const authRoutes = require('../routes/auth');
const { 
  setupTestDatabase, 
  cleanupTestDatabase, 
  closeDatabaseConnection,
  createTestUser,
  generateTestToken,
  createAuthHeader
} = require('./helpers');
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication Endpoints', () => {
  
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await closeDatabaseConnection();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/auth/register', () => {
    
    test('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'securepassword123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('name', userData.name);
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('should not register user with duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'securepassword123'
      };

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Smith',
          email: 'john.doe@example.com', // Same email
          password: 'differentpassword456'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('email');
    });

    test('should not register user with missing required fields', async () => {
      const incompleteData = {
        name: 'John Doe'
        // Missing email and password
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('should not register user with invalid email format', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email-format',
        password: 'securepassword123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('should not register user with short password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: '123' // Too short
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

  });

  describe('POST /api/auth/login', () => {
    
    beforeEach(async () => {
      // Create a test user for login tests
      await createTestUser({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    });

    test('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('email', loginData.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    test('should not login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid email or password');
    });

    test('should not login with invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid email or password');
    });

    test('should not login with missing credentials', async () => {
      const loginData = {
        email: 'test@example.com'
        // Missing password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

  });

  describe('POST /api/auth/logout', () => {
    
    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Logout successful');
    });

  });

  describe('GET /api/auth/profile', () => {
    
    let testUser;
    let authToken;

    beforeEach(async () => {
      testUser = await createTestUser({
        name: 'Profile Test User',
        email: 'profile@example.com',
        password: 'password123'
      });
      authToken = generateTestToken(testUser);
    });

    test('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set(createAuthHeader(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('id', testUser.id);
      expect(response.body.data.user).toHaveProperty('name', testUser.name);
      expect(response.body.data.user).toHaveProperty('email', testUser.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    test('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Access denied. No token provided.');
    });

    test('should not get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set(createAuthHeader('invalid-token'))
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid token.');
    });

  });

  describe('GET /api/auth/verify', () => {
    
    let testUser;
    let authToken;

    beforeEach(async () => {
      testUser = await createTestUser({
        name: 'Verify Test User',
        email: 'verify@example.com',
        password: 'password123'
      });
      authToken = generateTestToken(testUser);
    });

    test('should verify valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set(createAuthHeader(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Token is valid');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('id', testUser.id);
    });

    test('should not verify without token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Access denied. No token provided.');
    });

    test('should not verify invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set(createAuthHeader('invalid-token'))
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid token.');
    });

    test('should not verify expired token', async () => {
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { id: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/auth/verify')
        .set(createAuthHeader(expiredToken))
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid token.');
    });

  });

  describe('Edge Cases and Security', () => {
    
    test('should handle malformed JSON in register', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send('{"malformed": json}')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle SQL injection attempts in email', async () => {
      const userData = {
        name: 'Hacker',
        email: "'; DROP TABLE users; --",
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle very long input strings', async () => {
      const userData = {
        name: 'A'.repeat(1000), // Very long name
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

  });

});
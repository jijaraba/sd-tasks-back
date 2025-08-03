const request = require('supertest');
const { 
  setupTestDatabase, 
  cleanupTestDatabase, 
  closeDatabaseConnection,
  createTestUser,
  generateTestToken,
  createAuthHeader
} = require('./helpers');
const express = require('express');
const cors = require('cors');
const authRoutes = require('../routes/auth');
const taskRoutes = require('../routes/tasks');
const app = express();
app.use(cors());
app.use(express.json());
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

describe('Integration Tests', () => {
  
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

  describe('Server Health', () => {
    
    test('should respond to health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });

  });

  describe('Complete User Workflow', () => {
    
    test('should complete full user registration, login, and task management workflow', async () => {
      // Step 1: Register a new user
      const userData = {
        name: 'Integration Test User',
        email: 'integration@example.com',
        password: 'securepassword123'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('success', true);
      expect(registerResponse.body.data).toHaveProperty('token');
      const token = registerResponse.body.data.token;

      // Step 2: Verify token works
      const verifyResponse = await request(app)
        .get('/api/auth/verify')
        .set(createAuthHeader(token))
        .expect(200);

      expect(verifyResponse.body).toHaveProperty('success', true);

      // Step 3: Get user profile
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set(createAuthHeader(token))
        .expect(200);

      expect(profileResponse.body.data.user).toHaveProperty('email', userData.email);

      // Step 4: Create tasks
      const task1Data = {
        title: 'First Integration Task',
        description: 'This is the first task in the integration test',
        priority: 'high',
        status: 'pending'
      };

      const createTask1Response = await request(app)
        .post('/api/tasks')
        .set(createAuthHeader(token))
        .send(task1Data)
        .expect(201);

      expect(createTask1Response.body).toHaveProperty('success', true);
      const task1Id = createTask1Response.body.data.task.id;

      const task2Data = {
        title: 'Second Integration Task',
        description: 'This is the second task in the integration test',
        priority: 'medium',
        status: 'in_progress'
      };

      const createTask2Response = await request(app)
        .post('/api/tasks')
        .set(createAuthHeader(token))
        .send(task2Data)
        .expect(201);

      expect(createTask2Response.body).toHaveProperty('success', true);
      const task2Id = createTask2Response.body.data.task.id;

      // Step 5: Get all tasks
      const getTasksResponse = await request(app)
        .get('/api/tasks')
        .set(createAuthHeader(token))
        .expect(200);

      expect(getTasksResponse.body.data.tasks).toHaveLength(2);
      expect(getTasksResponse.body.data.total).toBe(2);

      // Step 6: Get task statistics
      const statsResponse = await request(app)
        .get('/api/tasks/stats')
        .set(createAuthHeader(token))
        .expect(200);

      expect(statsResponse.body.data.stats).toMatchObject({
        total: 2,
        pending: 1,
        in_progress: 1,
        completed: 0,
        cancelled: 0
      });

      // Step 7: Update task status
      const updateStatusResponse = await request(app)
        .patch(`/api/tasks/${task1Id}/status`)
        .set(createAuthHeader(token))
        .send({ status: 'completed' })
        .expect(200);

      expect(updateStatusResponse.body.data.task).toHaveProperty('status', 'completed');
      expect(updateStatusResponse.body.data.task).toHaveProperty('completedAt');

      // Step 8: Update task details
      const updateTaskResponse = await request(app)
        .put(`/api/tasks/${task2Id}`)
        .set(createAuthHeader(token))
        .send({
          title: 'Updated Second Task',
          description: 'Updated description',
          priority: 'low',
          status: 'completed'
        })
        .expect(200);

      expect(updateTaskResponse.body.data.task).toHaveProperty('title', 'Updated Second Task');
      expect(updateTaskResponse.body.data.task).toHaveProperty('priority', 'low');

      // Step 9: Get updated statistics
      const updatedStatsResponse = await request(app)
        .get('/api/tasks/stats')
        .set(createAuthHeader(token))
        .expect(200);

      expect(updatedStatsResponse.body.data.stats).toMatchObject({
        total: 2,
        pending: 0,
        in_progress: 0,
        completed: 2,
        cancelled: 0
      });

      // Step 10: Filter tasks by status
      const completedTasksResponse = await request(app)
        .get('/api/tasks?status=completed')
        .set(createAuthHeader(token))
        .expect(200);

      expect(completedTasksResponse.body.data.tasks).toHaveLength(2);
      expect(completedTasksResponse.body.data.tasks.every(task => task.status === 'completed')).toBe(true);

      // Step 11: Delete a task
      const deleteTaskResponse = await request(app)
        .delete(`/api/tasks/${task1Id}`)
        .set(createAuthHeader(token))
        .expect(200);

      expect(deleteTaskResponse.body).toHaveProperty('success', true);

      // Step 12: Verify task is deleted
      const finalTasksResponse = await request(app)
        .get('/api/tasks')
        .set(createAuthHeader(token))
        .expect(200);

      expect(finalTasksResponse.body.data.tasks).toHaveLength(1);
      expect(finalTasksResponse.body.data.total).toBe(1);

      // Step 13: Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(logoutResponse.body).toHaveProperty('success', true);

      // Step 14: Login again with same credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('success', true);
      expect(loginResponse.body.data).toHaveProperty('token');
      expect(loginResponse.body.data.user).toHaveProperty('email', userData.email);
    });

  });

  describe('Multi-User Isolation', () => {
    
    test('should properly isolate data between different users', async () => {
      // Create first user
      const user1Data = {
        name: 'User One',
        email: 'user1@example.com',
        password: 'password123'
      };

      const user1RegisterResponse = await request(app)
        .post('/api/auth/register')
        .send(user1Data)
        .expect(201);

      const user1Token = user1RegisterResponse.body.data.token;

      // Create second user
      const user2Data = {
        name: 'User Two',
        email: 'user2@example.com',
        password: 'password123'
      };

      const user2RegisterResponse = await request(app)
        .post('/api/auth/register')
        .send(user2Data)
        .expect(201);

      const user2Token = user2RegisterResponse.body.data.token;

      // User 1 creates tasks
      await request(app)
        .post('/api/tasks')
        .set(createAuthHeader(user1Token))
        .send({
          title: 'User 1 Task 1',
          description: 'Private task for user 1'
        })
        .expect(201);

      await request(app)
        .post('/api/tasks')
        .set(createAuthHeader(user1Token))
        .send({
          title: 'User 1 Task 2',
          description: 'Another private task for user 1'
        })
        .expect(201);

      // User 2 creates tasks
      await request(app)
        .post('/api/tasks')
        .set(createAuthHeader(user2Token))
        .send({
          title: 'User 2 Task 1',
          description: 'Private task for user 2'
        })
        .expect(201);

      // Verify User 1 only sees their tasks
      const user1TasksResponse = await request(app)
        .get('/api/tasks')
        .set(createAuthHeader(user1Token))
        .expect(200);

      expect(user1TasksResponse.body.data.tasks).toHaveLength(2);
      expect(user1TasksResponse.body.data.tasks.every(task => 
        task.title.includes('User 1')
      )).toBe(true);

      // Verify User 2 only sees their tasks
      const user2TasksResponse = await request(app)
        .get('/api/tasks')
        .set(createAuthHeader(user2Token))
        .expect(200);

      expect(user2TasksResponse.body.data.tasks).toHaveLength(1);
      expect(user2TasksResponse.body.data.tasks[0].title).toBe('User 2 Task 1');

      // Verify User 1 stats only include their tasks
      const user1StatsResponse = await request(app)
        .get('/api/tasks/stats')
        .set(createAuthHeader(user1Token))
        .expect(200);

      expect(user1StatsResponse.body.data.stats.total).toBe(2);

      // Verify User 2 stats only include their tasks
      const user2StatsResponse = await request(app)
        .get('/api/tasks/stats')
        .set(createAuthHeader(user2Token))
        .expect(200);

      expect(user2StatsResponse.body.data.stats.total).toBe(1);
    });

  });

  describe('Error Handling', () => {
    
    test('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);
    });

    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"malformed": json}')
        .expect(400);
    });

    test('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send('plain text data')
        .expect(400);
    });

  });

  describe('Security Tests', () => {
    
    test('should prevent unauthorized access to protected routes', async () => {
      const protectedRoutes = [
        { method: 'get', path: '/api/auth/profile' },
        { method: 'get', path: '/api/auth/verify' },
        { method: 'get', path: '/api/tasks' },
        { method: 'post', path: '/api/tasks' },
        { method: 'get', path: '/api/tasks/stats' }
      ];

      for (const route of protectedRoutes) {
        const response = await request(app)
          [route.method](route.path)
          .expect(401);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body.error).toContain('Access denied');
      }
    });

    test('should validate JWT token format', async () => {
      const invalidTokens = [
        'invalid-token',
        'Bearer invalid-token',
        '',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'
      ];

      for (const token of invalidTokens) {
        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${token}`)
          .expect(403);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body.error).toContain('Invalid token');
      }
    });

    test('should handle CORS properly', async () => {
      const response = await request(app)
        .options('/api/auth/register')
        .set('Origin', 'http://localhost:3000')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

  });

});
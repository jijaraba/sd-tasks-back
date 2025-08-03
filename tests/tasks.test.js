const request = require('supertest');
const express = require('express');
const cors = require('cors');
const authMiddleware = require('../middleware/auth');
const taskRoutes = require('../routes/tasks');
const { 
  setupTestDatabase, 
  cleanupTestDatabase, 
  closeDatabaseConnection,
  createTestUser,
  createTestTask,
  createTestTasks,
  generateTestToken,
  createAuthHeader,
  sampleData
} = require('./helpers');
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/tasks', taskRoutes);

describe('Task CRUD Endpoints', () => {
  
  let testUser;
  let authToken;
  let otherUser;
  let otherUserToken;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await closeDatabaseConnection();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
    
    // Create test users
    testUser = await createTestUser({
      name: 'Task Test User',
      email: 'taskuser@example.com',
      password: 'password123'
    });
    authToken = generateTestToken(testUser);

    otherUser = await createTestUser({
      name: 'Other User',
      email: 'otheruser@example.com',
      password: 'password123'
    });
    otherUserToken = generateTestToken(otherUser);
  });

  describe('GET /api/tasks', () => {
    
    beforeEach(async () => {
      // Create test tasks for the user
      await createTestTasks(testUser.id, 5);
      // Create tasks for other user (should not be visible)
      await createTestTasks(otherUser.id, 3);
    });

    test('should get all tasks for authenticated user', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set(createAuthHeader(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('tasks');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data.tasks).toHaveLength(5); // Only user's tasks
      expect(response.body.data.total).toBe(5);
      
      // Verify all tasks belong to the authenticated user
      response.body.data.tasks.forEach(task => {
        expect(task).toHaveProperty('userId', testUser.id);
      });
    });

    test('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/tasks?status=pending')
        .set(createAuthHeader(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.tasks.every(task => task.status === 'pending')).toBe(true);
    });

    test('should filter tasks by priority', async () => {
      const response = await request(app)
        .get('/api/tasks?priority=high')
        .set(createAuthHeader(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.tasks.every(task => task.priority === 'high')).toBe(true);
    });

    test('should search tasks by title', async () => {
      await createTestTask(testUser.id, {
        title: 'Unique Search Task',
        description: 'This task has a unique title'
      });

      const response = await request(app)
        .get('/api/tasks?search=Unique')
        .set(createAuthHeader(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.tasks.length).toBeGreaterThan(0);
      expect(response.body.data.tasks.some(task => 
        task.title.includes('Unique')
      )).toBe(true);
    });

    test('should limit and paginate tasks', async () => {
      const response = await request(app)
        .get('/api/tasks?limit=2&offset=1')
        .set(createAuthHeader(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.tasks).toHaveLength(2);
    });

    test('should not get tasks without authentication', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Access denied. No token provided.');
    });

  });

  describe('GET /api/tasks/stats', () => {
    
    beforeEach(async () => {
      // Create tasks with different statuses for stats
      await createTestTask(testUser.id, { status: 'pending' });
      await createTestTask(testUser.id, { status: 'pending' });
      await createTestTask(testUser.id, { status: 'in_progress' });
      await createTestTask(testUser.id, { status: 'completed' });
      await createTestTask(testUser.id, { status: 'completed' });
      await createTestTask(testUser.id, { status: 'completed' });
    });

    test('should get task statistics for authenticated user', async () => {
      const response = await request(app)
        .get('/api/tasks/stats')
        .set(createAuthHeader(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
      
      const stats = response.body.data.stats;
      expect(stats).toHaveProperty('total', 6);
      expect(stats).toHaveProperty('pending', 2);
      expect(stats).toHaveProperty('in_progress', 1);
      expect(stats).toHaveProperty('completed', 3);
      expect(stats).toHaveProperty('cancelled', 0);
    });

    test('should not get stats without authentication', async () => {
      const response = await request(app)
        .get('/api/tasks/stats')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

  });

  describe('GET /api/tasks/:id', () => {
    
    let testTask;

    beforeEach(async () => {
      testTask = await createTestTask(testUser.id, {
        title: 'Specific Task',
        description: 'This is a specific task for testing'
      });
    });

    test('should get specific task by ID', async () => {
      const response = await request(app)
        .get(`/api/tasks/${testTask.id}`)
        .set(createAuthHeader(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('task');
      expect(response.body.data.task).toHaveProperty('id', testTask.id);
      expect(response.body.data.task).toHaveProperty('title', testTask.title);
      expect(response.body.data.task).toHaveProperty('userId', testUser.id);
    });

    test('should not get task that does not exist', async () => {
      const response = await request(app)
        .get('/api/tasks/99999')
        .set(createAuthHeader(authToken))
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Task not found');
    });

    test('should not get task belonging to other user', async () => {
      const otherUserTask = await createTestTask(otherUser.id, {
        title: 'Other User Task'
      });

      const response = await request(app)
        .get(`/api/tasks/${otherUserTask.id}`)
        .set(createAuthHeader(authToken))
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Task not found');
    });

  });

  describe('POST /api/tasks', () => {
    
    test('should create a new task successfully', async () => {
      const taskData = {
        title: 'New Test Task',
        description: 'This is a new task created for testing',
        priority: 'high',
        status: 'pending',
        dueDate: '2024-12-31T23:59:59.999Z'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set(createAuthHeader(authToken))
        .send(taskData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Task created successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('task');
      
      const createdTask = response.body.data.task;
      expect(createdTask).toHaveProperty('id');
      expect(createdTask).toHaveProperty('title', taskData.title);
      expect(createdTask).toHaveProperty('description', taskData.description);
      expect(createdTask).toHaveProperty('priority', taskData.priority);
      expect(createdTask).toHaveProperty('status', taskData.status);
      expect(createdTask).toHaveProperty('userId', testUser.id);
    });

    test('should create task with minimal required data', async () => {
      const taskData = {
        title: 'Minimal Task'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set(createAuthHeader(authToken))
        .send(taskData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.task).toHaveProperty('title', taskData.title);
      expect(response.body.data.task).toHaveProperty('status', 'pending'); // Default status
      expect(response.body.data.task).toHaveProperty('priority', 'medium'); // Default priority
    });

    test('should not create task without title', async () => {
      const taskData = {
        description: 'Task without title'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set(createAuthHeader(authToken))
        .send(taskData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('should not create task with invalid status', async () => {
      const taskData = {
        title: 'Task with invalid status',
        status: 'invalid_status'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set(createAuthHeader(authToken))
        .send(taskData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('should not create task with invalid priority', async () => {
      const taskData = {
        title: 'Task with invalid priority',
        priority: 'invalid_priority'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set(createAuthHeader(authToken))
        .send(taskData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

  });

  describe('PUT /api/tasks/:id', () => {
    
    let testTask;

    beforeEach(async () => {
      testTask = await createTestTask(testUser.id, {
        title: 'Original Task',
        description: 'Original description',
        priority: 'low',
        status: 'pending'
      });
    });

    test('should update task successfully', async () => {
      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated description',
        priority: 'high',
        status: 'in_progress',
        dueDate: '2024-12-31T23:59:59.999Z'
      };

      const response = await request(app)
        .put(`/api/tasks/${testTask.id}`)
        .set(createAuthHeader(authToken))
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Task updated successfully');
      expect(response.body.data.task).toHaveProperty('title', updateData.title);
      expect(response.body.data.task).toHaveProperty('description', updateData.description);
      expect(response.body.data.task).toHaveProperty('priority', updateData.priority);
      expect(response.body.data.task).toHaveProperty('status', updateData.status);
    });

    test('should not update task that does not exist', async () => {
      const updateData = {
        title: 'Updated Title'
      };

      const response = await request(app)
        .put('/api/tasks/99999')
        .set(createAuthHeader(authToken))
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Task not found');
    });

    test('should not update task belonging to other user', async () => {
      const otherUserTask = await createTestTask(otherUser.id, {
        title: 'Other User Task'
      });

      const updateData = {
        title: 'Hacked Title'
      };

      const response = await request(app)
        .put(`/api/tasks/${otherUserTask.id}`)
        .set(createAuthHeader(authToken))
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

  });

  describe('PATCH /api/tasks/:id/status', () => {
    
    let testTask;

    beforeEach(async () => {
      testTask = await createTestTask(testUser.id, {
        title: 'Status Update Task',
        status: 'pending'
      });
    });

    test('should update task status successfully', async () => {
      const statusData = {
        status: 'completed'
      };

      const response = await request(app)
        .patch(`/api/tasks/${testTask.id}/status`)
        .set(createAuthHeader(authToken))
        .send(statusData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Task status updated successfully');
      expect(response.body.data.task).toHaveProperty('status', 'completed');
      expect(response.body.data.task).toHaveProperty('completedAt');
    });

    test('should set completedAt when status changes to completed', async () => {
      const statusData = {
        status: 'completed'
      };

      const response = await request(app)
        .patch(`/api/tasks/${testTask.id}/status`)
        .set(createAuthHeader(authToken))
        .send(statusData)
        .expect(200);

      expect(response.body.data.task).toHaveProperty('completedAt');
      expect(new Date(response.body.data.task.completedAt)).toBeInstanceOf(Date);
    });

    test('should clear completedAt when status changes from completed', async () => {
      // First mark as completed
      await request(app)
        .patch(`/api/tasks/${testTask.id}/status`)
        .set(createAuthHeader(authToken))
        .send({ status: 'completed' });

      // Then change to in_progress
      const response = await request(app)
        .patch(`/api/tasks/${testTask.id}/status`)
        .set(createAuthHeader(authToken))
        .send({ status: 'in_progress' })
        .expect(200);

      expect(response.body.data.task).toHaveProperty('status', 'in_progress');
      expect(response.body.data.task.completedAt).toBeNull();
    });

    test('should not update with invalid status', async () => {
      const statusData = {
        status: 'invalid_status'
      };

      const response = await request(app)
        .patch(`/api/tasks/${testTask.id}/status`)
        .set(createAuthHeader(authToken))
        .send(statusData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

  });

  describe('DELETE /api/tasks/:id', () => {
    
    let testTask;

    beforeEach(async () => {
      testTask = await createTestTask(testUser.id, {
        title: 'Task to Delete'
      });
    });

    test('should delete task successfully', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${testTask.id}`)
        .set(createAuthHeader(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Task deleted successfully');

      // Verify task is actually deleted
      const getResponse = await request(app)
        .get(`/api/tasks/${testTask.id}`)
        .set(createAuthHeader(authToken))
        .expect(404);
    });

    test('should not delete task that does not exist', async () => {
      const response = await request(app)
        .delete('/api/tasks/99999')
        .set(createAuthHeader(authToken))
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Task not found');
    });

    test('should not delete task belonging to other user', async () => {
      const otherUserTask = await createTestTask(otherUser.id, {
        title: 'Other User Task'
      });

      const response = await request(app)
        .delete(`/api/tasks/${otherUserTask.id}`)
        .set(createAuthHeader(authToken))
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

  });

  describe('Authentication and Authorization', () => {
    
    test('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/api/tasks' },
        { method: 'get', path: '/api/tasks/stats' },
        { method: 'get', path: '/api/tasks/1' },
        { method: 'post', path: '/api/tasks' },
        { method: 'put', path: '/api/tasks/1' },
        { method: 'patch', path: '/api/tasks/1/status' },
        { method: 'delete', path: '/api/tasks/1' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          [endpoint.method](endpoint.path)
          .send({})
          .expect(401);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error', 'Access denied. No token provided.');
      }
    });

    test('should reject invalid tokens for all endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/api/tasks' },
        { method: 'post', path: '/api/tasks', body: { title: 'Test' } }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          [endpoint.method](endpoint.path)
          .set(createAuthHeader('invalid-token'))
          .send(endpoint.body || {})
          .expect(403);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error', 'Invalid token.');
      }
    });

  });

  describe('Edge Cases and Error Handling', () => {
    
    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set(createAuthHeader(authToken))
        .send('{"malformed": json}')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle very long task titles', async () => {
      const taskData = {
        title: 'A'.repeat(1000) // Very long title
      };

      const response = await request(app)
        .post('/api/tasks')
        .set(createAuthHeader(authToken))
        .send(taskData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle SQL injection attempts', async () => {
      const taskData = {
        title: "'; DROP TABLE tasks; --",
        description: "SELECT * FROM users;"
      };

      const response = await request(app)
        .post('/api/tasks')
        .set(createAuthHeader(authToken))
        .send(taskData)
        .expect(201); // Should create safely without SQL injection

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.task.title).toBe(taskData.title); // Title should be stored as-is
    });

  });

});
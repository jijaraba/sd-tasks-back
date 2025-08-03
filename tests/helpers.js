

const { sequelize } = require('../config/database');
const User = require('../models/User');
const Task = require('../models/Task');
const bcrypt = require('bcryptjs');

async function setupTestDatabase() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // Force recreate tables for each test run
    console.log('Test database setup completed');
  } catch (error) {
    console.error('Test database setup failed:', error);
    throw error;
  }
}

async function cleanupTestDatabase() {
  try {
    await Task.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    console.log('Test database cleanup completed');
  } catch (error) {
    console.error('Test database cleanup failed:', error);
  }
}

async function closeDatabaseConnection() {
  try {
    await sequelize.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

async function createTestUser(userData = {}) {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  };

  const user = { ...defaultUser, ...userData };
  return await User.create(user);
}

async function createTestUsers(count = 3) {
  const users = [];
  for (let i = 1; i <= count; i++) {
    const user = await createTestUser({
      name: `Test User ${i}`,
      email: `testuser${i}@example.com`,
      password: 'password123'
    });
    users.push(user);
  }
  return users;
}

async function createTestTask(userId, taskData = {}) {
  const defaultTask = {
    title: 'Test Task',
    description: 'This is a test task description',
    status: 'pending',
    priority: 'medium',
    userId: userId
  };

  const task = { ...defaultTask, ...taskData };
  return await Task.create(task);
}

async function createTestTasks(userId, count = 5) {
  const tasks = [];
  const statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
  const priorities = ['low', 'medium', 'high'];

  for (let i = 1; i <= count; i++) {
    const task = await createTestTask(userId, {
      title: `Test Task ${i}`,
      description: `Description for test task ${i}`,
      status: statuses[i % statuses.length],
      priority: priorities[i % priorities.length],
      dueDate: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)) // i days from now
    });
    tasks.push(task);
  }
  return tasks;
}

function generateTestToken(user) {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email 
    },
    process.env.JWT_SECRET || 'test-jwt-secret',
    { expiresIn: '1h' }
  );
}

function createAuthHeader(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

const sampleData = {
  users: [
    {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'securepassword123'
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      password: 'anotherpassword456'
    },
    {
      name: 'Alice Johnson',
      email: 'alice.johnson@example.com',
      password: 'yetanotherpass789'
    }
  ],

  tasks: [
    {
      title: 'Complete project documentation',
      description: 'Write comprehensive documentation for the project',
      status: 'pending',
      priority: 'high',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    },
    {
      title: 'Review code changes',
      description: 'Review and approve pending pull requests',
      status: 'in_progress',
      priority: 'medium',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    },
    {
      title: 'Update dependencies',
      description: 'Update all npm dependencies to latest versions',
      status: 'pending',
      priority: 'low',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
    },
    {
      title: 'Fix bug in user authentication',
      description: 'Resolve issue with JWT token validation',
      status: 'completed',
      priority: 'high',
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    }
  ]
};

module.exports = {
  setupTestDatabase,
  cleanupTestDatabase,
  closeDatabaseConnection,
  createTestUser,
  createTestUsers,
  createTestTask,
  createTestTasks,
  generateTestToken,
  createAuthHeader,
  sampleData
};
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const User = require('../models/User');
const Task = require('../models/Task');
const { 
  setupTestDatabase, 
  cleanupTestDatabase, 
  closeDatabaseConnection,
  createTestUser,
  createTestTask
} = require('./helpers');

describe('Utilities and Middleware Tests', () => {
  
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

  describe('Authentication Middleware', () => {
    
    test('should authenticate valid token', async () => {
      const testUser = await createTestUser();
      const token = jwt.sign(
        { id: testUser.id, email: testUser.email },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const req = {
        header: jest.fn().mockReturnValue(`Bearer ${token}`)
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(testUser.id);
      expect(req.user.email).toBe(testUser.email);
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject missing token', async () => {
      const req = {
        header: jest.fn().mockReturnValue(null)
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied. No token provided.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject invalid token format', async () => {
      const req = {
        header: jest.fn().mockReturnValue('InvalidTokenFormat')
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject malformed JWT', async () => {
      const req = {
        header: jest.fn().mockReturnValue('Bearer invalid.jwt.token')
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject expired token', async () => {
      const testUser = await createTestUser();
      const expiredToken = jwt.sign(
        { id: testUser.id, email: testUser.email },
        JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const req = {
        header: jest.fn().mockReturnValue(`Bearer ${expiredToken}`)
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token.'
      });
      expect(next).not.toHaveBeenCalled();
    });

  });

  describe('User Model', () => {
    
    test('should hash password before saving', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'plainTextPassword'
      };

      const user = await User.create(userData);

      expect(user.password).not.toBe(userData.password);
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
      expect(user.password.length).toBeGreaterThan(50);
    });

    test('should compare passwords correctly', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'mySecretPassword'
      };

      const user = await User.create(userData);

      // Test correct password
      const isValidCorrect = await user.comparePassword('mySecretPassword');
      expect(isValidCorrect).toBe(true);

      // Test incorrect password
      const isValidIncorrect = await user.comparePassword('wrongPassword');
      expect(isValidIncorrect).toBe(false);
    });

    test('should not include password in JSON output', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      const user = await User.create(userData);
      const userJSON = user.toJSON();

      expect(userJSON).toHaveProperty('id');
      expect(userJSON).toHaveProperty('name', userData.name);
      expect(userJSON).toHaveProperty('email', userData.email);
      expect(userJSON).not.toHaveProperty('password');
    });

    test('should validate email format', async () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user..name@domain.com'
      ];

      for (const email of invalidEmails) {
        await expect(User.create({
          name: 'Test User',
          email: email,
          password: 'password123'
        })).rejects.toThrow();
      }
    });

    test('should enforce unique email constraint', async () => {
      const userData = {
        name: 'Test User',
        email: 'unique@example.com',
        password: 'password123'
      };

      // Create first user
      await User.create(userData);

      // Try to create second user with same email
      await expect(User.create({
        name: 'Another User',
        email: 'unique@example.com',
        password: 'differentPassword'
      })).rejects.toThrow();
    });

  });

  describe('Task Model', () => {
    
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser();
    });

    test('should set default values correctly', async () => {
      const taskData = {
        title: 'Simple Task',
        userId: testUser.id
      };

      const task = await Task.create(taskData);

      expect(task.status).toBe('pending');
      expect(task.priority).toBe('medium');
      expect(task.completedAt).toBeNull();
    });

    test('should validate status enum', async () => {
      const invalidStatuses = ['invalid', 'unknown', 'maybe'];

      for (const status of invalidStatuses) {
        await expect(Task.create({
          title: 'Test Task',
          status: status,
          userId: testUser.id
        })).rejects.toThrow();
      }
    });

    test('should validate priority enum', async () => {
      const invalidPriorities = ['critical', 'normal', 'urgent'];

      for (const priority of invalidPriorities) {
        await expect(Task.create({
          title: 'Test Task',
          priority: priority,
          userId: testUser.id
        })).rejects.toThrow();
      }
    });

    test('should allow valid status values', async () => {
      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];

      for (const status of validStatuses) {
        const task = await Task.create({
          title: `Task with ${status} status`,
          status: status,
          userId: testUser.id
        });

        expect(task.status).toBe(status);
      }
    });

    test('should allow valid priority values', async () => {
      const validPriorities = ['low', 'medium', 'high'];

      for (const priority of validPriorities) {
        const task = await Task.create({
          title: `Task with ${priority} priority`,
          priority: priority,
          userId: testUser.id
        });

        expect(task.priority).toBe(priority);
      }
    });

    test('should set completedAt when status changes to completed', async () => {
      const task = await createTestTask(testUser.id, {
        status: 'pending'
      });

      expect(task.completedAt).toBeNull();

      // Update to completed
      await task.update({ status: 'completed' });
      await task.reload();

      expect(task.completedAt).not.toBeNull();
      expect(task.completedAt).toBeInstanceOf(Date);
    });

    test('should clear completedAt when status changes from completed', async () => {
      const task = await createTestTask(testUser.id, {
        status: 'completed'
      });

      expect(task.completedAt).not.toBeNull();

      // Update to pending
      await task.update({ status: 'pending' });
      await task.reload();

      expect(task.completedAt).toBeNull();
    });

    test('should establish user association correctly', async () => {
      const task = await createTestTask(testUser.id);

      // Test association
      const taskWithUser = await Task.findByPk(task.id, {
        include: [{ model: User, as: 'user' }]
      });

      expect(taskWithUser.user).toBeDefined();
      expect(taskWithUser.user.id).toBe(testUser.id);
      expect(taskWithUser.user.email).toBe(testUser.email);
    });

    test('should require title field', async () => {
      await expect(Task.create({
        description: 'Task without title',
        userId: testUser.id
      })).rejects.toThrow();
    });

    test('should require userId field', async () => {
      await expect(Task.create({
        title: 'Task without user'
      })).rejects.toThrow();
    });

  });

  describe('Password Hashing Utilities', () => {
    
    test('should generate different hashes for same password', async () => {
      const password = 'samePassword';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);

      expect(hash1).not.toBe(hash2);
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });

    test('should handle special characters in passwords', async () => {
      const specialPasswords = [
        'pássw@rd123!',
        '密码123',
        'пароль456',
        'P@$$w0rd!@#$%^&*()',
        'emoji😀password🎉'
      ];

      for (const password of specialPasswords) {
        const hash = await bcrypt.hash(password, 10);
        expect(await bcrypt.compare(password, hash)).toBe(true);
      }
    });

  });

  describe('JWT Token Utilities', () => {
    
    test('should generate valid JWT tokens', async () => {
      const payload = {
        id: 123,
        email: 'test@example.com'
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
      const decoded = jwt.verify(token, JWT_SECRET);

      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    test('should handle token expiration', async () => {
      const payload = {
        id: 123,
        email: 'test@example.com'
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '0s' });

      // Wait a moment to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(() => {
        jwt.verify(token, JWT_SECRET);
      }).toThrow('jwt expired');
    });

    test('should reject tokens with wrong secret', async () => {
      const payload = {
        id: 123,
        email: 'test@example.com'
      };

      const token = jwt.sign(payload, 'wrong-secret', { expiresIn: '1h' });

      expect(() => {
        jwt.verify(token, JWT_SECRET);
      }).toThrow('invalid signature');
    });

  });

  describe('Database Connection', () => {
    
    test('should be connected to test database', async () => {
      const { sequelize } = require('../config/database');
      
      // Test database connection
      await expect(sequelize.authenticate()).resolves.not.toThrow();
      
      // Verify we're using the test database
      const [results] = await sequelize.query("SELECT current_database()");
      expect(results[0].current_database).toContain('test');
    });

  });

});
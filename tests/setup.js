require('dotenv').config({ path: '.env.test' });
process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT || '3001';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://sd_tasks_user:sd_tasks_password@localhost:5432/sd_tasks_test_db';
jest.setTimeout(30000);
global.testConfig = {
  serverPort: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,
  databaseUrl: process.env.DATABASE_URL
};
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: console.error // Keep error for debugging
  };
}
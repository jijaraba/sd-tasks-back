# SD Tasks Backend - Test Suite

This document describes the comprehensive test suite for the SD Tasks Backend API.

## Test Coverage

The test suite covers all API endpoints and core functionality:

### 🔐 Authentication Tests (`auth.test.js`)
- **POST /api/auth/register**
  - ✅ User registration with valid data
  - ✅ Duplicate email validation
  - ✅ Required field validation
  - ✅ Email format validation
  - ✅ Password length validation
  - ✅ SQL injection protection

- **POST /api/auth/login**
  - ✅ Login with valid credentials
  - ✅ Invalid email/password handling
  - ✅ Missing credentials validation

- **POST /api/auth/logout**
  - ✅ Successful logout

- **GET /api/auth/profile**
  - ✅ Profile retrieval with valid token
  - ✅ Unauthorized access prevention
  - ✅ Invalid token handling

- **GET /api/auth/verify**
  - ✅ Token validation
  - ✅ Expired token handling
  - ✅ Malformed token rejection

### 📋 Task Management Tests (`tasks.test.js`)
- **GET /api/tasks**
  - ✅ Get all user tasks
  - ✅ Filter by status
  - ✅ Filter by priority
  - ✅ Search by title/description
  - ✅ Pagination support
  - ✅ User isolation

- **GET /api/tasks/stats**
  - ✅ Task statistics calculation
  - ✅ Status breakdown

- **GET /api/tasks/:id**
  - ✅ Get specific task
  - ✅ Task not found handling
  - ✅ Cross-user access prevention

- **POST /api/tasks**
  - ✅ Create task with full data
  - ✅ Create with minimal data
  - ✅ Title requirement validation
  - ✅ Status/priority validation

- **PUT /api/tasks/:id**
  - ✅ Update task details
  - ✅ Task not found handling
  - ✅ Cross-user access prevention

- **PATCH /api/tasks/:id/status**
  - ✅ Status updates
  - ✅ Automatic completedAt handling
  - ✅ Invalid status rejection

- **DELETE /api/tasks/:id**
  - ✅ Task deletion
  - ✅ Task not found handling
  - ✅ Cross-user access prevention

### 🔧 Utilities & Middleware Tests (`utils.test.js`)
- **Authentication Middleware**
  - ✅ Valid token processing
  - ✅ Missing token handling
  - ✅ Invalid token rejection
  - ✅ Expired token handling

- **User Model**
  - ✅ Password hashing
  - ✅ Password comparison
  - ✅ JSON serialization (password exclusion)
  - ✅ Email validation
  - ✅ Unique constraints

- **Task Model**
  - ✅ Default values
  - ✅ Enum validations
  - ✅ Required fields
  - ✅ Status change hooks
  - ✅ User associations

- **Security**
  - ✅ Password hashing utilities
  - ✅ JWT token generation/validation
  - ✅ Database connection tests

### 🔗 Integration Tests (`integration.test.js`)
- **Complete Workflows**
  - ✅ Full user registration → login → task management flow
  - ✅ Multi-user data isolation
  - ✅ Server health checks
  
- **Security Tests**
  - ✅ Unauthorized access prevention
  - ✅ JWT validation
  - ✅ CORS handling
  
- **Error Handling**
  - ✅ 404 for non-existent routes
  - ✅ Malformed JSON handling
  - ✅ Content-Type validation

## Test Database Setup

### Prerequisites
1. **PostgreSQL** must be running
2. **Test database** should be created:
   ```sql
   CREATE DATABASE sd_tasks_test_db;
   CREATE USER sd_tasks_user WITH PASSWORD 'sd_tasks_password';
   GRANT ALL PRIVILEGES ON DATABASE sd_tasks_test_db TO sd_tasks_user;
   ```

### Environment Configuration
The tests use a separate `.env.test` file:
```env
NODE_ENV=test
PORT=3001
JWT_SECRET=test-jwt-secret-very-long-key-for-testing-purposes-only
DATABASE_URL=postgresql://sd_tasks_user:sd_tasks_password@localhost:5432/sd_tasks_test_db
```

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test Files
```bash
# Authentication tests only
npx jest auth.test.js

# Task tests only
npx jest tasks.test.js

# Integration tests only
npx jest integration.test.js

# Utilities tests only
npx jest utils.test.js
```

### Run Tests with Different Verbosity
```bash
# Verbose output
npx jest --verbose

# Silent mode
npx jest --silent

# Show only failures
npx jest --verbose=false
```

## Test Structure

### Test Organization
```
tests/
├── setup.js           # Jest configuration and globals
├── helpers.js         # Test utilities and helper functions
├── auth.test.js       # Authentication endpoint tests
├── tasks.test.js      # Task CRUD endpoint tests
├── integration.test.js # End-to-end workflow tests
└── utils.test.js      # Utilities and middleware tests
```

### Helper Functions
The `helpers.js` file provides utilities for:
- Database setup and cleanup
- Test user/task creation
- JWT token generation
- Sample data generation

### Test Isolation
- Each test file runs independently
- Database is cleaned between tests
- Users and tasks are isolated per test
- No shared state between tests

## Test Coverage Goals

The test suite aims for:
- **90%+ line coverage** across all source files
- **100% endpoint coverage** for all API routes
- **Edge case testing** for error conditions
- **Security testing** for authentication and authorization
- **Integration testing** for complete workflows

## Performance Considerations

- Tests use a **separate test database** to avoid conflicts
- **Database transactions** are used for fast cleanup
- **Parallel test execution** is disabled for database tests
- **Timeouts** are configured for database operations (30s)

## Security Testing

The test suite includes specific security tests for:
- **SQL injection attempts** 
- **JWT token validation**
- **Cross-user data access**
- **Input sanitization**
- **Authentication bypass attempts**

## Continuous Integration

These tests are designed to run in CI/CD environments:
- **Database setup** is automated
- **Environment variables** are configurable
- **Exit codes** properly indicate success/failure
- **Test reports** can be generated in various formats

## Debugging Tests

### Common Issues
1. **Database connection errors**: Ensure PostgreSQL is running and test DB exists
2. **Port conflicts**: Make sure test port 3001 is available
3. **JWT secret mismatch**: Verify `.env.test` file is configured correctly
4. **Permission errors**: Check database user permissions

### Debug Commands
```bash
# Run single test with full output
npx jest auth.test.js --verbose --no-cache

# Debug specific test
npx jest --testNamePattern="should register a new user"

# Show test execution time
npx jest --verbose --detectOpenHandles
```

## Writing New Tests

### Test Template
```javascript
describe('Feature Name', () => {
  beforeEach(async () => {
    await cleanupTestDatabase();
    // Setup test data
  });

  test('should do something successfully', async () => {
    // Arrange
    const testData = { /* test data */ };
    
    // Act
    const response = await request(app)
      .post('/api/endpoint')
      .send(testData);
    
    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });
});
```

### Best Practices
- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Test both success and failure cases
- Clean up test data between tests
- Use helper functions for common setup
- Test edge cases and boundary conditions
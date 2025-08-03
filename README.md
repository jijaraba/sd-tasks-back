# SD Tasks Backend

A TypeScript Node.js Express backend API for the SD Tasks application with JWT authentication and PostgreSQL database.

## Features

- **TypeScript** for type safety and better development experience
- Express.js server with CORS support
- JWT-based authentication system
- PostgreSQL database with Sequelize ORM
- Complete CRUD operations for tasks
- Task filtering and search capabilities
- Task statistics and analytics
- Password hashing with bcrypt
- Protected routes with middleware
- Docker Compose setup with multi-stage builds
- Environment variable configuration
- Health check endpoint
- Error handling middleware
- Development mode with ts-node and hot reload

## Quick Start with Docker

The easiest way to run the application is using Docker Compose:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Manual Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```bash
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production
DATABASE_URL=postgresql://sd_tasks_user:sd_tasks_password@localhost:5432/sd_tasks_db
```

3. Start PostgreSQL database (if not using Docker):
```bash
# Install PostgreSQL locally or use Docker
docker run -d \
  --name postgres \
  -e POSTGRES_DB=sd_tasks_db \
  -e POSTGRES_USER=sd_tasks_user \
  -e POSTGRES_PASSWORD=sd_tasks_password \
  -p 5432:5432 \
  postgres:15-alpine
```

## Usage

### Development
Start the server in development mode with auto-reload:
```bash
npm run dev
```

### Production
Start the server in production mode:
```bash
npm start
```

### Docker Development
```bash
# Start services
docker-compose up -d

# View backend logs
docker-compose logs -f backend

# Restart backend only
docker-compose restart backend

# Access PostgreSQL
docker-compose exec postgres psql -U sd_tasks_user -d sd_tasks_db
```

## API Endpoints

### Public Endpoints
- `GET /` - Welcome message
- `GET /health` - Health check endpoint

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user (requires token)
- `GET /api/auth/profile` - Get user profile (requires token)
- `GET /api/auth/verify` - Verify token (requires token)

### Task Endpoints (All require authentication)

#### GET /api/tasks - Get all tasks
```bash
curl -X GET http://localhost:3000/api/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Query Parameters:**
- `status` - Filter by status (pending, in_progress, completed, cancelled)
- `priority` - Filter by priority (low, medium, high)
- `search` - Search in title and description

**Example:**
```bash
curl -X GET "http://localhost:3000/api/tasks?status=completed&priority=high" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### GET /api/tasks/stats - Get task statistics
```bash
curl -X GET http://localhost:3000/api/tasks/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### GET /api/tasks/:id - Get specific task
```bash
curl -X GET http://localhost:3000/api/tasks/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### POST /api/tasks - Create new task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive documentation",
    "priority": "high",
    "status": "pending",
    "dueDate": "2025-08-10T00:00:00.000Z"
  }'
```

#### PUT /api/tasks/:id - Update task
```bash
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Updated task title",
    "description": "Updated description",
    "status": "in_progress",
    "priority": "medium"
  }'
```

#### PATCH /api/tasks/:id/status - Update task status
```bash
curl -X PATCH http://localhost:3000/api/tasks/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"status": "completed"}'
```

#### DELETE /api/tasks/:id - Delete task
```bash
curl -X DELETE http://localhost:3000/api/tasks/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Authentication

### Register a new user
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Access protected routes
```bash
curl -X GET http://localhost:3000/api/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get user profile
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Task Model

### Task Fields
- `id` - Unique identifier (auto-generated)
- `title` - Task title (required, max 255 characters)
- `description` - Task description (optional)
- `status` - Task status (pending, in_progress, completed, cancelled)
- `priority` - Task priority (low, medium, high)
- `dueDate` - Due date (optional)
- `completedAt` - Completion date (auto-set when status becomes completed)
- `userId` - User who owns the task
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Task Status Values
- `pending` - Task is waiting to be started
- `in_progress` - Task is currently being worked on
- `completed` - Task has been finished
- `cancelled` - Task has been cancelled

### Task Priority Values
- `low` - Low priority task
- `medium` - Medium priority task (default)
- `high` - High priority task

## Database

The application uses PostgreSQL with the following configuration:

- **Database**: `sd_tasks_db`
- **User**: `sd_tasks_user`
- **Password**: `sd_tasks_password`
- **Port**: `5432`

### Database Schema

The application automatically creates the following tables:

- `users` - User accounts with email, password, and name
- `tasks` - Task records with title, description, status, priority, and user relationship

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)
- `JWT_SECRET` - Secret key for JWT tokens
- `DATABASE_URL` - PostgreSQL connection string

## TypeScript Development

This project is built with TypeScript for enhanced type safety and development experience.

### Available Scripts

```bash
npm run build         # Compile TypeScript to JavaScript in dist/ folder
npm run dev           # Run development server with ts-node
npm run dev:watch     # Run with automatic restart on file changes
npm start            # Run the compiled JavaScript in production
npm run clean        # Remove dist/ folder
npm test             # Run tests with Jest and ts-jest
```

### TypeScript Configuration

- **tsconfig.json**: TypeScript compiler configuration
- **Source files**: All source code is in TypeScript (.ts files)
- **Build output**: Compiled JavaScript goes to `dist/` folder
- **Type definitions**: Comprehensive interfaces for models, requests, and responses

## Project Structure

```
sd-tasks-back/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── .env                  # Environment variables
├── .gitignore            # Git ignore rules
├── .dockerignore         # Docker ignore rules
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose setup
├── README.md             # This file
├── config/
│   └── database.js       # Database configuration
├── middleware/
│   └── auth.js           # JWT authentication middleware
├── models/
│   ├── User.js           # User database model
│   └── Task.js           # Task database model
├── routes/
│   ├── auth.js           # Authentication routes
│   └── tasks.js          # Task CRUD routes
└── utils/
    ├── users.js          # User management utilities
    └── tasks.js          # Task management utilities
```

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Protected route middleware
- Error handling for invalid tokens
- CORS support for cross-origin requests
- Database connection security
- User-specific task access (users can only access their own tasks)

## Development

The server will run on `http://localhost:3000` by default. You can change the port by setting the `PORT` environment variable.

### Testing the API

1. Start the services: `docker-compose up -d`
2. Register a new user or login with existing credentials
3. Use the JWT token in the Authorization header for protected routes
4. Test task CRUD operations

### Database Management

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U sd_tasks_user -d sd_tasks_db

# View tables
\dt

# View users
SELECT * FROM users;

# View tasks
SELECT * FROM tasks;

# View tasks with user information
SELECT t.*, u.name as user_name 
FROM tasks t 
JOIN users u ON t."userId" = u.id;
``` 
import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { connectDB } from './config/database';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';

dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// CORS configuration for production and development
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        // Production frontend domains
        'https://your-frontend-domain.com',
        // Development and testing
        'http://localhost:8100', 
        'http://localhost:5173',
        'http://10.0.2.2:8100',
        // Capacitor mobile apps
        'https://localhost',
        'http://localhost',
        'capacitor://localhost',
        'ionic://localhost'
      ]
    : [
        // Development origins
        'http://localhost:8100', 
        'http://localhost:5173', 
        'http://10.0.2.2:8100',
        // Capacitor mobile apps (all environments)
        'https://localhost',
        'http://localhost', 
        'capacitor://localhost',
        'ionic://localhost'
      ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response): void => {
  res.json({ message: 'Welcome to SD Tasks Backend API' });
});

app.get('/health', (req: Request, res: Response): void => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.use((req: Request, res: Response): void => {
  res.status(404).json({ error: 'Route not found' });
});

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    
    app.listen(PORT, (): void => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Auth endpoints: http://localhost:${PORT}/api/auth`);
      console.log(`Task endpoints: http://localhost:${PORT}/api/tasks`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
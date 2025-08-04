import { Sequelize } from 'sequelize';

// Support both DATABASE_URL (single URL) and individual environment variables
const DATABASE_URL: string = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER || 'sd_tasks_user'}:${process.env.DB_PASSWORD || 'sd_tasks_password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'sd_tasks_db'}`;

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    // Enable SSL for production (Render), disable for local development
    ssl: process.env.NODE_ENV === 'production' ? { require: true, rejectUnauthorized: false } : false
  }
});

const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

export { sequelize, connectDB };
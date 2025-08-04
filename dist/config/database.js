"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
// Support both DATABASE_URL (single URL) and individual environment variables
const DATABASE_URL = process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER || 'sd_tasks_user'}:${process.env.DB_PASSWORD || 'sd_tasks_password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'sd_tasks_db'}`;
const sequelize = new sequelize_1.Sequelize(DATABASE_URL, {
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
exports.sequelize = sequelize;
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        await sequelize.sync({ alter: true });
        console.log('Database models synchronized.');
    }
    catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
//# sourceMappingURL=database.js.map
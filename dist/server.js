"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const auth_1 = __importDefault(require("./routes/auth"));
const tasks_1 = __importDefault(require("./routes/tasks"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3000', 10);
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
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to SD Tasks Backend API' });
});
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.use('/api/auth', auth_1.default);
app.use('/api/tasks', tasks_1.default);
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
const startServer = async () => {
    try {
        await (0, database_1.connectDB)();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/health`);
            console.log(`Auth endpoints: http://localhost:${PORT}/api/auth`);
            console.log(`Task endpoints: http://localhost:${PORT}/api/tasks`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map
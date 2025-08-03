"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const users_1 = require("../utils/users");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) {
            res.status(400).json({ error: 'Email, password, and name are required' });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters long' });
            return;
        }
        const user = await (0, users_1.createUser)(email, password, name);
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, auth_1.JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            message: 'User registered successfully',
            user: { id: user.id, email: user.email, name: user.name },
            token
        });
    }
    catch (error) {
        if (error.message === 'User already exists') {
            res.status(409).json({ error: 'User already exists' });
            return;
        }
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        const user = await (0, users_1.findUserByEmail)(email);
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, auth_1.JWT_SECRET, { expiresIn: '24h' });
        res.json({
            message: 'Login successful',
            user: { id: user.id, email: user.email, name: user.name },
            token
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
router.post('/logout', auth_1.authenticateToken, (req, res) => {
    res.json({ message: 'Logout successful' });
});
router.get('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const user = await (0, users_1.findUserById)(req.user.userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({
            user: { id: user.id, email: user.email, name: user.name }
        });
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Failed to get user profile' });
    }
});
router.get('/verify', auth_1.authenticateToken, (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    res.json({
        message: 'Token is valid',
        user: { userId: req.user.userId, email: req.user.email }
    });
});
exports.default = router;
//# sourceMappingURL=auth.js.map
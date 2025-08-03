"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const tasks_1 = require("../utils/tasks");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
router.get('/', async (req, res) => {
    try {
        const authenticatedReq = req;
        const query = req.query;
        const filters = {
            status: query.status,
            priority: query.priority,
            search: query.search
        };
        if (!authenticatedReq.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const tasks = await (0, tasks_1.getAllTasks)(authenticatedReq.user.userId, filters);
        res.json({ tasks });
    }
    catch (error) {
        console.error('Error getting tasks:', error);
        res.status(500).json({ error: 'Failed to get tasks' });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const authenticatedReq = req;
        if (!authenticatedReq.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const stats = await (0, tasks_1.getTaskStats)(authenticatedReq.user.userId);
        res.json({ stats });
    }
    catch (error) {
        console.error('Error getting task stats:', error);
        res.status(500).json({ error: 'Failed to get task statistics' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const authenticatedReq = req;
        const taskId = parseInt(req.params.id);
        if (isNaN(taskId)) {
            res.status(400).json({ error: 'Invalid task ID' });
            return;
        }
        if (!authenticatedReq.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const task = await (0, tasks_1.getTaskById)(taskId, authenticatedReq.user.userId);
        if (!task) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        res.json({ task });
    }
    catch (error) {
        console.error('Error getting task:', error);
        res.status(500).json({ error: 'Failed to get task' });
    }
});
router.post('/', async (req, res) => {
    try {
        const { title, description, status, priority, dueDate } = req.body;
        if (!title || title.trim().length === 0) {
            res.status(400).json({ error: 'Title is required' });
            return;
        }
        if (title.length > 255) {
            res.status(400).json({ error: 'Title must be less than 255 characters' });
            return;
        }
        const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
        if (status && !validStatuses.includes(status)) {
            res.status(400).json({ error: 'Invalid status value' });
            return;
        }
        const validPriorities = ['low', 'medium', 'high'];
        if (priority && !validPriorities.includes(priority)) {
            res.status(400).json({ error: 'Invalid priority value' });
            return;
        }
        let parsedDueDate = undefined;
        if (dueDate) {
            parsedDueDate = new Date(dueDate);
            if (isNaN(parsedDueDate.getTime())) {
                res.status(400).json({ error: 'Invalid due date format' });
                return;
            }
        }
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const taskData = {
            title: title.trim(),
            description: description ? description.trim() : undefined,
            status: status || 'pending',
            priority: priority || 'medium',
            dueDate: parsedDueDate
        };
        const task = await (0, tasks_1.createTask)(taskData, req.user.userId);
        res.status(201).json({
            message: 'Task created successfully',
            task
        });
    }
    catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        if (isNaN(taskId)) {
            res.status(400).json({ error: 'Invalid task ID' });
            return;
        }
        const { title, description, status, priority, dueDate } = req.body;
        if (title !== undefined && (title.trim().length === 0 || title.length > 255)) {
            res.status(400).json({ error: 'Title must be between 1 and 255 characters' });
            return;
        }
        const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
        if (status && !validStatuses.includes(status)) {
            res.status(400).json({ error: 'Invalid status value' });
            return;
        }
        const validPriorities = ['low', 'medium', 'high'];
        if (priority && !validPriorities.includes(priority)) {
            res.status(400).json({ error: 'Invalid priority value' });
            return;
        }
        let parsedDueDate = undefined;
        if (dueDate !== undefined) {
            if (dueDate === null) {
                parsedDueDate = null;
            }
            else {
                parsedDueDate = new Date(dueDate);
                if (isNaN(parsedDueDate.getTime())) {
                    res.status(400).json({ error: 'Invalid due date format' });
                    return;
                }
            }
        }
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const updateData = {};
        if (title !== undefined)
            updateData.title = title.trim();
        if (description !== undefined)
            updateData.description = description ? description.trim() : null;
        if (status !== undefined)
            updateData.status = status;
        if (priority !== undefined)
            updateData.priority = priority;
        if (dueDate !== undefined)
            updateData.dueDate = parsedDueDate;
        const task = await (0, tasks_1.updateTask)(taskId, updateData, req.user.userId);
        res.json({
            message: 'Task updated successfully',
            task
        });
    }
    catch (error) {
        if (error.message === 'Task not found') {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});
router.patch('/:id/status', async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        if (isNaN(taskId)) {
            res.status(400).json({ error: 'Invalid task ID' });
            return;
        }
        const { status } = req.body;
        const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            res.status(400).json({ error: 'Valid status is required' });
            return;
        }
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const task = await (0, tasks_1.updateTask)(taskId, { status }, req.user.userId);
        res.json({
            message: 'Task status updated successfully',
            task
        });
    }
    catch (error) {
        if (error.message === 'Task not found') {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        console.error('Error updating task status:', error);
        res.status(500).json({ error: 'Failed to update task status' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const authenticatedReq = req;
        const taskId = parseInt(req.params.id);
        if (isNaN(taskId)) {
            res.status(400).json({ error: 'Invalid task ID' });
            return;
        }
        if (!authenticatedReq.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const result = await (0, tasks_1.deleteTask)(taskId, authenticatedReq.user.userId);
        res.json(result);
    }
    catch (error) {
        if (error.message === 'Task not found') {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});
exports.default = router;
//# sourceMappingURL=tasks.js.map
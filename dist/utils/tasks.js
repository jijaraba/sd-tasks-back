"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskStats = exports.deleteTask = exports.updateTask = exports.getTaskById = exports.getAllTasks = exports.createTask = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const Task_1 = __importDefault(require("../models/Task"));
const User_1 = __importDefault(require("../models/User"));
const createTask = async (taskData, userId) => {
    try {
        const task = await Task_1.default.create({
            ...taskData,
            userId
        });
        const createdTask = await Task_1.default.findByPk(task.id, {
            include: [{ model: User_1.default, as: 'user', attributes: ['id', 'email', 'name'] }]
        });
        if (!createdTask) {
            throw new Error('Task creation failed');
        }
        return createdTask;
    }
    catch (error) {
        console.error('Error creating task:', error);
        throw error;
    }
};
exports.createTask = createTask;
const getAllTasks = async (userId, filters = {}) => {
    try {
        const whereClause = { userId };
        if (filters.status) {
            whereClause.status = filters.status;
        }
        if (filters.priority) {
            whereClause.priority = filters.priority;
        }
        if (filters.search) {
            whereClause[sequelize_1.Op.or] = [
                { title: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { description: { [sequelize_1.Op.iLike]: `%${filters.search}%` } }
            ];
        }
        const tasks = await Task_1.default.findAll({
            where: whereClause,
            include: [{ model: User_1.default, as: 'user', attributes: ['id', 'email', 'name'] }],
            order: [['createdAt', 'DESC']]
        });
        return tasks;
    }
    catch (error) {
        console.error('Error getting tasks:', error);
        throw error;
    }
};
exports.getAllTasks = getAllTasks;
const getTaskById = async (taskId, userId) => {
    try {
        const task = await Task_1.default.findOne({
            where: { id: taskId, userId },
            include: [{ model: User_1.default, as: 'user', attributes: ['id', 'email', 'name'] }]
        });
        return task;
    }
    catch (error) {
        console.error('Error getting task by id:', error);
        throw error;
    }
};
exports.getTaskById = getTaskById;
const updateTask = async (taskId, updateData, userId) => {
    try {
        const task = await Task_1.default.findOne({
            where: { id: taskId, userId }
        });
        if (!task) {
            throw new Error('Task not found');
        }
        await task.update(updateData);
        const updatedTask = await Task_1.default.findByPk(taskId, {
            include: [{ model: User_1.default, as: 'user', attributes: ['id', 'email', 'name'] }]
        });
        if (!updatedTask) {
            throw new Error('Task update failed');
        }
        return updatedTask;
    }
    catch (error) {
        console.error('Error updating task:', error);
        throw error;
    }
};
exports.updateTask = updateTask;
const deleteTask = async (taskId, userId) => {
    try {
        const task = await Task_1.default.findOne({
            where: { id: taskId, userId }
        });
        if (!task) {
            throw new Error('Task not found');
        }
        await task.destroy();
        return { message: 'Task deleted successfully' };
    }
    catch (error) {
        console.error('Error deleting task:', error);
        throw error;
    }
};
exports.deleteTask = deleteTask;
const getTaskStats = async (userId) => {
    try {
        const stats = await Task_1.default.findAll({
            where: { userId },
            attributes: [
                'status',
                [database_1.sequelize.fn('COUNT', database_1.sequelize.col('id')), 'count']
            ],
            group: ['status'],
            raw: true
        });
        const totalTasks = await Task_1.default.count({ where: { userId } });
        const completedTasks = await Task_1.default.count({
            where: { userId, status: 'completed' }
        });
        return {
            total: totalTasks,
            completed: completedTasks,
            pending: totalTasks - completedTasks,
            byStatus: stats
        };
    }
    catch (error) {
        console.error('Error getting task stats:', error);
        throw error;
    }
};
exports.getTaskStats = getTaskStats;
//# sourceMappingURL=tasks.js.map
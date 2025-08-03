import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import Task, { TaskInstance, TaskStatus, TaskPriority } from '../models/Task';
import User from '../models/User';

interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
}

interface TaskCreateData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
}

interface TaskUpdateData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  completedAt?: Date;
}

interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  byStatus: Array<{
    status: TaskStatus;
    count: number;
  }>;
}

export const createTask = async (taskData: TaskCreateData, userId: number): Promise<TaskInstance> => {
  try {
    const task = await Task.create({
      ...taskData,
      userId
    });
    
    const createdTask = await Task.findByPk(task.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'name'] }]
    });
    
    if (!createdTask) {
      throw new Error('Task creation failed');
    }
    
    return createdTask;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const getAllTasks = async (userId: number, filters: TaskFilters = {}): Promise<TaskInstance[]> => {
  try {
    const whereClause: any = { userId };
    
    if (filters.status) {
      whereClause.status = filters.status;
    }
    
    if (filters.priority) {
      whereClause.priority = filters.priority;
    }
    
    if (filters.search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${filters.search}%` } },
        { description: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }

    const tasks = await Task.findAll({
      where: whereClause,
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'name'] }],
      order: [['createdAt', 'DESC']]
    });
    
    return tasks;
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw error;
  }
};

export const getTaskById = async (taskId: number, userId: number): Promise<TaskInstance | null> => {
  try {
    const task = await Task.findOne({
      where: { id: taskId, userId },
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'name'] }]
    });
    
    return task;
  } catch (error) {
    console.error('Error getting task by id:', error);
    throw error;
  }
};

export const updateTask = async (taskId: number, updateData: TaskUpdateData, userId: number): Promise<TaskInstance> => {
  try {
    const task = await Task.findOne({
      where: { id: taskId, userId }
    });
    
    if (!task) {
      throw new Error('Task not found');
    }
    
    await task.update(updateData);
    
    const updatedTask = await Task.findByPk(taskId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'name'] }]
    });
    
    if (!updatedTask) {
      throw new Error('Task update failed');
    }
    
    return updatedTask;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (taskId: number, userId: number): Promise<{ message: string }> => {
  try {
    const task = await Task.findOne({
      where: { id: taskId, userId }
    });
    
    if (!task) {
      throw new Error('Task not found');
    }
    
    await task.destroy();
    return { message: 'Task deleted successfully' };
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

export const getTaskStats = async (userId: number): Promise<TaskStats> => {
  try {
    const stats = await Task.findAll({
      where: { userId },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    }) as unknown as Array<{ status: TaskStatus; count: number }>;
    
    const totalTasks = await Task.count({ where: { userId } });
    const completedTasks = await Task.count({ 
      where: { userId, status: 'completed' } 
    });
    
    return {
      total: totalTasks,
      completed: completedTasks,
      pending: totalTasks - completedTasks,
      byStatus: stats
    };
  } catch (error) {
    console.error('Error getting task stats:', error);
    throw error;
  }
};
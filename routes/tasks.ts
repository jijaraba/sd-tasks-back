import express, { Request, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskStats
} from '../utils/tasks';
import { TaskStatus, TaskPriority } from '../models/Task';

const router = express.Router();

router.use(authenticateToken);

interface TaskFiltersQuery {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
}

interface CreateTaskRequest extends AuthenticatedRequest {
  body: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string | Date;
  };
}

interface UpdateTaskRequest extends AuthenticatedRequest {
  body: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string | Date | null;
  };
  params: {
    id: string;
  };
}

interface StatusUpdateRequest extends AuthenticatedRequest {
  body: {
    status: TaskStatus;
  };
  params: {
    id: string;
  };
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const query = req.query as TaskFiltersQuery;
    
    const filters = {
      status: query.status,
      priority: query.priority,
      search: query.search
    };
    
    if (!authenticatedReq.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    const tasks = await getAllTasks(authenticatedReq.user.userId, filters);
    res.json({ tasks });
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    
    if (!authenticatedReq.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    const stats = await getTaskStats(authenticatedReq.user.userId);
    res.json({ stats });
  } catch (error) {
    console.error('Error getting task stats:', error);
    res.status(500).json({ error: 'Failed to get task statistics' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const taskId = parseInt(req.params.id);
    
    if (isNaN(taskId)) {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }
    
    if (!authenticatedReq.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    const task = await getTaskById(taskId, authenticatedReq.user.userId);
    
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    res.json({ task });
  } catch (error) {
    console.error('Error getting task:', error);
    res.status(500).json({ error: 'Failed to get task' });
  }
});

router.post('/', async (req: CreateTaskRequest, res: Response): Promise<void> => {
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
    
    const validStatuses: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status value' });
      return;
    }
    
    const validPriorities: TaskPriority[] = ['low', 'medium', 'high'];
    if (priority && !validPriorities.includes(priority)) {
      res.status(400).json({ error: 'Invalid priority value' });
      return;
    }
    
    let parsedDueDate: Date | undefined = undefined;
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
      status: status || 'pending' as TaskStatus,
      priority: priority || 'medium' as TaskPriority,
      dueDate: parsedDueDate
    };
    
    const task = await createTask(taskData, req.user.userId);
    res.status(201).json({ 
      message: 'Task created successfully',
      task 
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.put('/:id', async (req: UpdateTaskRequest, res: Response): Promise<void> => {
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
    
    const validStatuses: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status value' });
      return;
    }
    
    const validPriorities: TaskPriority[] = ['low', 'medium', 'high'];
    if (priority && !validPriorities.includes(priority)) {
      res.status(400).json({ error: 'Invalid priority value' });
      return;
    }
    
    let parsedDueDate: Date | null | undefined = undefined;
    if (dueDate !== undefined) {
      if (dueDate === null) {
        parsedDueDate = null;
      } else {
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
    
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = parsedDueDate;
    
    const task = await updateTask(taskId, updateData, req.user.userId);
    res.json({ 
      message: 'Task updated successfully',
      task 
    });
  } catch (error: any) {
    if (error.message === 'Task not found') {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.patch('/:id/status', async (req: StatusUpdateRequest, res: Response): Promise<void> => {
  try {
    const taskId = parseInt(req.params.id);
    
    if (isNaN(taskId)) {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }
    
    const { status } = req.body;
    
    const validStatuses: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: 'Valid status is required' });
      return;
    }
    
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    const task = await updateTask(taskId, { status }, req.user.userId);
    res.json({ 
      message: 'Task status updated successfully',
      task 
    });
  } catch (error: any) {
    if (error.message === 'Task not found') {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const taskId = parseInt(req.params.id);
    
    if (isNaN(taskId)) {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }
    
    if (!authenticatedReq.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    const result = await deleteTask(taskId, authenticatedReq.user.userId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Task not found') {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
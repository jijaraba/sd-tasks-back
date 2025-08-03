import { TaskInstance, TaskStatus, TaskPriority } from '../models/Task';
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
export declare const createTask: (taskData: TaskCreateData, userId: number) => Promise<TaskInstance>;
export declare const getAllTasks: (userId: number, filters?: TaskFilters) => Promise<TaskInstance[]>;
export declare const getTaskById: (taskId: number, userId: number) => Promise<TaskInstance | null>;
export declare const updateTask: (taskId: number, updateData: TaskUpdateData, userId: number) => Promise<TaskInstance>;
export declare const deleteTask: (taskId: number, userId: number) => Promise<{
    message: string;
}>;
export declare const getTaskStats: (userId: number) => Promise<TaskStats>;
export {};
//# sourceMappingURL=tasks.d.ts.map
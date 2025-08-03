import { Model, Optional } from 'sequelize';
import { UserInstance } from './User';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';
interface TaskAttributes {
    id: number;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: Date;
    completedAt?: Date;
    userId: number;
    createdAt?: Date;
    updatedAt?: Date;
}
interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'status' | 'priority' | 'description' | 'dueDate' | 'completedAt' | 'createdAt' | 'updatedAt'> {
}
export interface TaskInstance extends Model<TaskAttributes, TaskCreationAttributes>, TaskAttributes {
    user?: UserInstance;
}
declare const Task: import("sequelize").ModelCtor<TaskInstance>;
export default Task;
//# sourceMappingURL=Task.d.ts.map
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import User, { UserInstance } from './User';

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

interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'status' | 'priority' | 'description' | 'dueDate' | 'completedAt' | 'createdAt' | 'updatedAt'> {}

export interface TaskInstance extends Model<TaskAttributes, TaskCreationAttributes>, TaskAttributes {
  user?: UserInstance;
}

const Task = sequelize.define<TaskInstance>('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium',
    allowNull: false
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  }
}, {
  tableName: 'tasks',
  timestamps: true,
  hooks: {
    beforeUpdate: (task: TaskInstance): void => {
      if (task.changed('status') && task.status === 'completed' && !task.completedAt) {
        task.completedAt = new Date();
      }
      if (task.changed('status') && task.status !== 'completed' && task.completedAt) {
        task.completedAt = undefined;
      }
    }
  }
});

Task.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Task, { foreignKey: 'userId', as: 'tasks' });

export default Task;
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const User_1 = __importDefault(require("./User"));
const Task = database_1.sequelize.define('Task', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [1, 255]
        }
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false
    },
    priority: {
        type: sequelize_1.DataTypes.ENUM('low', 'medium', 'high'),
        defaultValue: 'medium',
        allowNull: false
    },
    dueDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true
    },
    completedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User_1.default,
            key: 'id'
        }
    }
}, {
    tableName: 'tasks',
    timestamps: true,
    hooks: {
        beforeUpdate: (task) => {
            if (task.changed('status') && task.status === 'completed' && !task.completedAt) {
                task.completedAt = new Date();
            }
            if (task.changed('status') && task.status !== 'completed' && task.completedAt) {
                task.completedAt = undefined;
            }
        }
    }
});
Task.belongsTo(User_1.default, { foreignKey: 'userId', as: 'user' });
User_1.default.hasMany(Task, { foreignKey: 'userId', as: 'tasks' });
exports.default = Task;
//# sourceMappingURL=Task.js.map
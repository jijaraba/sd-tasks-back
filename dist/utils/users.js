"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPassword = exports.createUser = exports.findUserById = exports.findUserByEmail = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
const findUserByEmail = async (email) => {
    try {
        return await User_1.default.findOne({ where: { email } });
    }
    catch (error) {
        console.error('Error finding user by email:', error);
        throw error;
    }
};
exports.findUserByEmail = findUserByEmail;
const findUserById = async (id) => {
    try {
        return await User_1.default.findByPk(id);
    }
    catch (error) {
        console.error('Error finding user by id:', error);
        throw error;
    }
};
exports.findUserById = findUserById;
const createUser = async (email, password, name) => {
    try {
        const existingUser = await (0, exports.findUserByEmail)(email);
        if (existingUser) {
            throw new Error('User already exists');
        }
        const newUser = await User_1.default.create({
            email,
            password,
            name
        });
        return newUser.toJSON();
    }
    catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};
exports.createUser = createUser;
const verifyPassword = async (password, hashedPassword) => {
    return await bcryptjs_1.default.compare(password, hashedPassword);
};
exports.verifyPassword = verifyPassword;
//# sourceMappingURL=users.js.map
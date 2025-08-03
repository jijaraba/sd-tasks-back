import bcrypt from 'bcryptjs';
import User, { UserInstance } from '../models/User';

interface UserAttributes {
  id: number;
  email: string;
  password: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const findUserByEmail = async (email: string): Promise<UserInstance | null> => {
  try {
    return await User.findOne({ where: { email } });
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
};

export const findUserById = async (id: number): Promise<UserInstance | null> => {
  try {
    return await User.findByPk(id);
  } catch (error) {
    console.error('Error finding user by id:', error);
    throw error;
  }
};

export const createUser = async (email: string, password: string, name: string): Promise<Omit<UserAttributes, 'password'>> => {
  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const newUser = await User.create({
      email,
      password,
      name
    });

    return newUser.toJSON();
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};
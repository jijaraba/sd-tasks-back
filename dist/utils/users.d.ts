import { UserInstance } from '../models/User';
interface UserAttributes {
    id: number;
    email: string;
    password: string;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const findUserByEmail: (email: string) => Promise<UserInstance | null>;
export declare const findUserById: (id: number) => Promise<UserInstance | null>;
export declare const createUser: (email: string, password: string, name: string) => Promise<Omit<UserAttributes, "password">>;
export declare const verifyPassword: (password: string, hashedPassword: string) => Promise<boolean>;
export {};
//# sourceMappingURL=users.d.ts.map
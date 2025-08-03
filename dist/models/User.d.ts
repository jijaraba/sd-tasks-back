import { Model, Optional } from 'sequelize';
interface UserAttributes {
    id: number;
    email: string;
    password: string;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
}
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
export interface UserInstance extends Model<UserAttributes, UserCreationAttributes>, UserAttributes {
    comparePassword(candidatePassword: string): Promise<boolean>;
    toJSON(): Omit<UserAttributes, 'password'>;
}
declare const User: import("sequelize").ModelCtor<UserInstance>;
export default User;
//# sourceMappingURL=User.d.ts.map
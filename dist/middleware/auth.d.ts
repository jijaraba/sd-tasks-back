import { Request, Response, NextFunction } from 'express';
export declare const JWT_SECRET: string;
export interface JWTPayload {
    userId: number;
    email: string;
    iat?: number;
    exp?: number;
}
export interface AuthenticatedRequest extends Request {
    user?: JWTPayload;
}
export declare const authenticateToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map
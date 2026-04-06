import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';
import { AuthenticationError } from '../errors/AppError';


declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticateToken(jwtSecret: string, required: boolean = true) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      if (required) {
        next(new AuthenticationError('No token provided'));
      } else {
        next();
      }
      return;
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      req.user = decoded;
      next();
    } catch {
      if (required) {
        next(new AuthenticationError('Invalid or expired token'));
      } else {
        next();
      }
    }
  };
}

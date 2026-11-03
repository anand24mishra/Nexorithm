import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../types";
import { AuthenticationError } from "../errors/AppError";

declare global {
  // Express request augmentation uses the library namespace.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticateToken(jwtSecret: string, required: boolean = true) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      if (required) {
        next(new AuthenticationError("No token provided"));
      } else {
        next();
      }
      return;
    }

    try {
      const decoded = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
      if (
        typeof decoded === "string" ||
        typeof decoded.userId !== "string" ||
        !/^[a-f0-9]{24}$/.test(decoded.userId) ||
        typeof decoded.username !== "string" ||
        !["user", "admin"].includes(decoded.role) ||
        typeof decoded.exp !== "number"
      )
        throw new Error("Invalid token payload");
      req.user = decoded as JwtPayload;
      next();
    } catch {
      if (required) {
        next(new AuthenticationError("Invalid or expired token"));
      } else {
        next();
      }
    }
  };
}

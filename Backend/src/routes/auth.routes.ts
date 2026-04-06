import { Router } from 'express';
import { AuthService } from '../services/auth.service';
import { Request, Response, NextFunction } from 'express';

export function createAuthRoutes(authService: AuthService): Router {
  const router = Router();

  router.post(
    '/register',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { username, email, password } = req.body as {
          username?: string;
          email?: string;
          password?: string;
        };

        if (!username || !email || !password) {
          res.status(400).json({
            error: 'username, email, and password are required',
          });
          return;
        }

        const result = await authService.register(username, email, password);
        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/login',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email, password } = req.body as {
          email?: string;
          password?: string;
        };

        if (!email || !password) {
          res.status(400).json({ error: 'email and password are required' });
          return;
        }

        const result = await authService.login(email, password);
        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/auth0-login',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email, name, auth0Id } = req.body as {
          email?: string;
          name?: string;
          auth0Id?: string;
        };

        if (!email || !auth0Id) {
          res.status(400).json({ error: 'email and auth0Id are required' });
          return;
        }

        const result = await authService.auth0Login(email, name || '', auth0Id);
        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

import { Router } from "express";
import { z } from "zod";
import { AuthService } from "../services/auth.service";
import { Request, Response, NextFunction } from "express";

export function createAuthRoutes(authService: AuthService): Router {
  const router = Router();

  // ─── Local Registration ────────────────────────────────────────────────────
  router.post(
    "/register",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { username, email, password } = z
          .object({
            username: z
              .string()
              .min(2)
              .max(40)
              .regex(/^[a-zA-Z0-9_]+$/),
            email: z
              .string()
              .email()
              .max(254)
              .transform((s) => s.toLowerCase()),
            password: z.string().min(8).max(72),
          })
          .parse(req.body);

        if (!username || !email || !password) {
          res.status(400).json({
            error: "username, email, and password are required",
          });
          return;
        }

        const result = await authService.register(username, email, password);
        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  // ─── Local Login ───────────────────────────────────────────────────────────
  router.post(
    "/login",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email, password } = z
          .object({
            email: z
              .string()
              .email()
              .max(254)
              .transform((s) => s.toLowerCase()),
            password: z.string().min(1).max(72),
          })
          .parse(req.body);

        if (!email || !password) {
          res.status(400).json({ error: "email and password are required" });
          return;
        }

        const result = await authService.login(email, password);
        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  // ─── Google OAuth Login ────────────────────────────────────────────────────
  // Receives the Google ID token from the frontend, verifies it, and returns
  // our app's JWT + user object.
  router.post(
    "/google-login",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { credential } = z
          .object({ credential: z.string().min(1).max(8192) })
          .parse(req.body);

        if (!credential) {
          res
            .status(400)
            .json({ error: "Google credential token is required" });
          return;
        }

        const result = await authService.googleLogin(credential);
        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}

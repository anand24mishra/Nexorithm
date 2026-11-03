import { Router, RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import { SubmissionController } from "../controllers/submit.controller";
export function createSubmissionRoutes(
  controller: SubmissionController,
  auth: RequestHandler,
): Router {
  const router = Router();
  router.use(auth);
  router.post(
    "/",
    rateLimit({
      windowMs: 60000,
      limit: 10,
      keyGenerator: (req) => req.user!.userId,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Too many requests" },
    }),
    controller.submit,
  );
  router.get("/", controller.getSubmissions);
  router.get("/problem/:problemId", controller.getSubmissionsByProblem);
  router.get("/:id", controller.getSubmission);
  return router;
}

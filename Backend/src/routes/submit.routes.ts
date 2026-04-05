import { Router } from 'express';
import { SubmissionController } from '../controllers/submit.controller';

export function createSubmissionRoutes(
  controller: SubmissionController,
  authMiddleware: any
): Router {
  const router = Router();

  router.use(authMiddleware);

  router.post('/', controller.submit);
  router.get('/', controller.getSubmissions);
  router.get('/problem/:problemId', controller.getSubmissionsByProblem);

  return router;
}
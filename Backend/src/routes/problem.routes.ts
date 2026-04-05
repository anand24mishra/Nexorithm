import { Router } from 'express';
import { ProblemController } from '../controllers/problem.controller';

export function createProblemRoutes(controller: ProblemController): Router {
  const router = Router();

  router.post('/seed', controller.seedProblems);
  router.get('/daily-challenge', controller.getDailyChallenge);
  router.get('/:slug', controller.getProblemBySlug);
  router.get('/', controller.getProblems);

  return router;
}

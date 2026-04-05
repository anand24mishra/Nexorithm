import { Request, Response, NextFunction } from 'express';
import { ProblemService } from '../services/problem.service';
import { ProblemListParams, Difficulty } from '../types';

export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  getProblems = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const params: ProblemListParams = {
        page: Number(req.query['page']) || 1,
        limit: Number(req.query['limit']) || 20,
        difficulty: req.query['difficulty'] as Difficulty | undefined,
        search: req.query['search'] as string | undefined,
        tags: req.query['tags']
          ? (req.query['tags'] as string).split(',')
          : undefined,
      };

      const result = await this.problemService.getProblems(params);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getProblemBySlug = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const slug = Array.isArray(req.params['slug']) 
        ? req.params['slug'][0] 
        : req.params['slug'];
      const problem = await this.problemService.getProblemBySlug(slug as string);

      if (!problem) {
        res.status(404).json({ error: `Problem "${slug}" not found` });
        return;
      }

      // Filter out hidden test cases for the response
      const visibleProblem = {
        ...problem,
        testCases: problem.testCases.filter((tc) => !tc.isHidden),
      };

      res.status(200).json(visibleProblem);
    } catch (error) {
      next(error);
    }
  };

  getDailyChallenge = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const problem = await this.problemService.getDailyChallenge();
      if (!problem) {
        res.status(404).json({ error: 'No daily challenge available' });
        return;
      }
      res.status(200).json(problem);
    } catch (error) {
      next(error);
    }
  };

  seedProblems = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const limit = Number(req.body['limit']) || 100;
      const result = await this.problemService.seedProblems(limit);
      res.status(200).json({ message: 'Seed successful', result });
    } catch (error) {
      next(error);
    }
  };
}

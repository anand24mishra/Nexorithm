import { Request, Response, NextFunction } from 'express';
import { SubmissionService } from '../services/submission.service';
import { Language, SubmissionRequest } from '../types';

export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  submit = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { code, language, problemId } = req.body as {
        code?: string;
        language?: string;
        problemId?: string;
      };

      const request: SubmissionRequest = {
        code: code ?? '',
        language: (language ?? '') as Language,
        problemId: problemId ?? '',
      };

      
      const userId =
        (req as Request & { user?: { userId: string } }).user?.userId ??
        'anonymous';

      const result = await this.submissionService.submitCode(request, userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getSubmissions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId =
        (req as Request & { user?: { userId: string } }).user?.userId ??
        'anonymous';
        
      const submissions = await this.submissionService.getSubmissionsByUser(userId);
      res.status(200).json(submissions);
    } catch (error) {
      next(error);
    }
  };

  getSubmissionsByProblem = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const problemId = Array.isArray(req.params['problemId']) 
        ? req.params['problemId'][0] 
        : req.params['problemId'];
      const userId =
        (req as Request & { user?: { userId: string } }).user?.userId ??
        'anonymous';

      const submissions = await this.submissionService.getSubmissionsByUserAndProblem(userId, problemId);
      res.status(200).json(submissions);
    } catch (error) {
      next(error);
    }
  };
}

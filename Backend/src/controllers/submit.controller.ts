import { Request, Response, NextFunction } from "express";
import { SubmissionService } from "../services/submission.service";
export class SubmissionController {
  constructor(private readonly service: SubmissionService) {}
  submit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res
        .status(202)
        .json(
          await this.service.submitCode(
            req.body,
            req.user!.userId,
            res.locals.requestId,
          ),
        );
    } catch (e) {
      next(e);
    }
  };
  getSubmission = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(
        await this.service.getSubmission(
          String(req.params.id),
          req.user!.userId,
        ),
      );
    } catch (e) {
      next(e);
    }
  };
  getSubmissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.list(req.user!.userId, req.query));
    } catch (e) {
      next(e);
    }
  };
  getSubmissionsByProblem = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      res.json(
        await this.service.list(
          req.user!.userId,
          req.query,
          String(req.params.problemId),
        ),
      );
    } catch (e) {
      next(e);
    }
  };
}

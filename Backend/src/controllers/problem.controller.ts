import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ProblemService } from "../services/problem.service";
import { ProblemListParams, Difficulty } from "../types";

export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  getProblems = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const params: ProblemListParams = {
        page: Number(req.query["page"]) || 1,
        limit: Number(req.query["limit"]) || 20,
        difficulty: req.query["difficulty"] as Difficulty | undefined,
        search: req.query["search"] as string | undefined,
        tags: req.query["tags"]
          ? (req.query["tags"] as string).split(",")
          : undefined,
      };

      z.object({
        page: z.number().int().min(1).max(10000),
        limit: z.number().int().min(1).max(100),
        search: z.string().max(100).optional(),
        tags: z.array(z.string().max(40)).max(10).optional(),
        difficulty: z.nativeEnum(Difficulty).optional(),
      }).parse(params);
      const result = await this.problemService.getProblems(params);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getProblemBySlug = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const slug = Array.isArray(req.params["slug"])
        ? req.params["slug"][0]
        : req.params["slug"];
      const problem = await this.problemService.getProblemBySlug(
        slug as string,
      );

      if (!problem) {
        res.status(404).json({ error: `Problem "${slug}" not found` });
        return;
      }

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
    next: NextFunction,
  ): Promise<void> => {
    try {
      const problem = await this.problemService.getDailyChallenge();
      if (!problem) {
        res.status(404).json({ error: "No daily challenge available" });
        return;
      }
      res.status(200).json({
        ...problem,
        testCases: problem.testCases.filter((tc) => !tc.isHidden),
      });
    } catch (error) {
      next(error);
    }
  };

  seedProblems = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const limit = z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .parse(req.body["limit"] ?? 100);
      const result = await this.problemService.seedProblems(limit);
      res.status(200).json({ message: "Seed successful", result });
    } catch (error) {
      next(error);
    }
  };
}

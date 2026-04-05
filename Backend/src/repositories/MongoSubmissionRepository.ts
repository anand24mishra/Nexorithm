import { ISubmissionRepository, CreateSubmissionData } from '../interfaces/ISubmissionRepository';
import { Submission } from '../types';
import { SubmissionModel } from '../models/Submission.model';

export class MongoSubmissionRepository implements ISubmissionRepository {
  async create(data: CreateSubmissionData): Promise<Submission> {
    const doc = await SubmissionModel.create({
      ...data,
      submittedAt: new Date(),
    });

    return {
      id: String(doc._id),
      userId: String(data.userId),
      problemId: data.problemId,
      language: data.language,
      code: data.code,
      verdict: data.verdict,
      passedTestCases: data.passedTestCases,
      totalTestCases: data.totalTestCases,
      executionTimeMs: data.executionTimeMs,
      submittedAt: doc.submittedAt as Date,
    };
  }

  async findByUser(userId: string): Promise<Submission[]> {
    const docs = await SubmissionModel.find({ userId }).sort({ submittedAt: -1 }).lean();
    return docs.map((d) => ({
      id: String(d._id),
      userId: String(d.userId),
      problemId: String(d.problemId),
      language: d.language as Submission['language'],
      code: String(d.code),
      verdict: d.verdict as Submission['verdict'],
      passedTestCases: Number(d.passedTestCases),
      totalTestCases: Number(d.totalTestCases),
      executionTimeMs: Number(d.executionTimeMs),
      submittedAt: d.submittedAt as Date,
    }));
  }

  async findByUserAndProblem(userId: string, problemId: string): Promise<Submission[]> {
    const docs = await SubmissionModel.find({ userId, problemId }).sort({ submittedAt: -1 }).lean();
    return docs.map((d) => ({
      id: String(d._id),
      userId: String(d.userId),
      problemId: String(d.problemId),
      language: d.language as Submission['language'],
      code: String(d.code),
      verdict: d.verdict as Submission['verdict'],
      passedTestCases: Number(d.passedTestCases),
      totalTestCases: Number(d.totalTestCases),
      executionTimeMs: Number(d.executionTimeMs),
      submittedAt: d.submittedAt as Date,
    }));
  }

  async findById(id: string): Promise<Submission | null> {
    const d = await SubmissionModel.findById(id).lean();
    if (!d) return null;
    return {
      id: String(d._id),
      userId: String(d.userId),
      problemId: String(d.problemId),
      language: d.language as Submission['language'],
      code: String(d.code),
      verdict: d.verdict as Submission['verdict'],
      passedTestCases: Number(d.passedTestCases),
      totalTestCases: Number(d.totalTestCases),
      executionTimeMs: Number(d.executionTimeMs),
      submittedAt: d.submittedAt as Date,
    };
  }
}

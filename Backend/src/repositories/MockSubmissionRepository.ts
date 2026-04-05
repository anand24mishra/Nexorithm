import { ISubmissionRepository, CreateSubmissionData } from '../interfaces/ISubmissionRepository';
import { Submission } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class MockSubmissionRepository implements ISubmissionRepository {
  private submissions: Submission[] = [];

  async create(data: CreateSubmissionData): Promise<Submission> {
    const submission: Submission = {
      id: uuidv4(),
      ...data,
      submittedAt: new Date(),
    };
    this.submissions.push(submission);
    return submission;
  }

  async findByUser(userId: string): Promise<Submission[]> {
    return this.submissions.filter((s) => s.userId === userId).sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }

  async findByUserAndProblem(userId: string, problemId: string): Promise<Submission[]> {
    return this.submissions
      .filter((s) => s.userId === userId && s.problemId === problemId)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }

  async findById(id: string): Promise<Submission | null> {
    return this.submissions.find((s) => s.id === id) ?? null;
  }
}

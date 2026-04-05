import { NexorithmProblem, ProblemListItem, ProblemListParams } from '../types';

export interface IProblemRepository {
  findAll(params: ProblemListParams): Promise<{ problems: ProblemListItem[]; total: number }>;
  findBySlug(slug: string): Promise<NexorithmProblem | null>;
  findById(id: string): Promise<NexorithmProblem | null>;
  upsert(problem: NexorithmProblem): Promise<void>;
}

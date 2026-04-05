import { IProblemRepository } from '../interfaces/IProblemRepository';
import {
  NexorithmProblem,
  ProblemListItem,
  ProblemListParams,
  Difficulty,
} from '../types';
import { seedProblems } from '../data/seedProblems';

export class MockProblemRepository implements IProblemRepository {
  private problems: NexorithmProblem[] = [...seedProblems];

  async findAll(
    params: ProblemListParams
  ): Promise<{ problems: ProblemListItem[]; total: number }> {
    let filtered = [...this.problems];

    // Filter by difficulty
    if (params.difficulty) {
      filtered = filtered.filter(
        (p) => p.difficulty === params.difficulty
      );
    }

    // Filter by tags
    if (params.tags && params.tags.length > 0) {
      filtered = filtered.filter((p) =>
        params.tags!.some((tag) =>
          p.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
        )
      );
    }

    // Search by title
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchLower) ||
          p.slug.toLowerCase().includes(searchLower)
      );
    }

    // Sort by ID ascending numerically
    filtered = filtered.sort((a, b) => parseInt(a.id) - parseInt(b.id));

    const total = filtered.length;
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    const problems: ProblemListItem[] = paginated.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      difficulty: p.difficulty,
      tags: p.tags,
      acRate: p.acRate,
    }));

    return { problems, total };
  }

  async findBySlug(slug: string): Promise<NexorithmProblem | null> {
    return this.problems.find((p) => p.slug === slug) ?? null;
  }

  async findById(id: string): Promise<NexorithmProblem | null> {
    return this.problems.find((p) => p.id === id) ?? null;
  }

  async upsert(problem: NexorithmProblem): Promise<void> {
    const idx = this.problems.findIndex((p) => p.slug === problem.slug);
    if (idx >= 0) {
      this.problems[idx] = problem;
    } else {
      this.problems.push(problem);
    }
  }
}

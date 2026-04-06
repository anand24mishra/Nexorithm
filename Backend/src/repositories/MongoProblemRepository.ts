import { IProblemRepository } from '../interfaces/IProblemRepository';
import { NexorithmProblem, ProblemListItem, ProblemListParams } from '../types';
import { ProblemModel } from '../models/Problem.model';

export class MongoProblemRepository implements IProblemRepository {
  async findAll(
    params: ProblemListParams
  ): Promise<{ problems: ProblemListItem[]; total: number }> {
    const filter: Record<string, unknown> = {};

    if (params.difficulty) {
      filter['difficulty'] = params.difficulty;
    }

    if (params.tags && params.tags.length > 0) {
      filter['tags'] = { $in: params.tags.map((t) => new RegExp(t, 'i')) };
    }

    if (params.search) {
      filter['$or'] = [
        { title: { $regex: params.search, $options: 'i' } },
        { slug: { $regex: params.search, $options: 'i' } },
      ];
    }

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      ProblemModel.find(filter)
        .select('id slug title difficulty tags acRate')
        .skip(skip)
        .limit(limit)
        .lean(),
      ProblemModel.countDocuments(filter),
    ]);

    const problems: ProblemListItem[] = docs.map((d) => ({
      id: String(d.id),
      slug: String(d.slug),
      title: String(d.title),
      difficulty: d.difficulty as ProblemListItem['difficulty'],
      tags: d.tags as string[],
      acRate: Number(d.acRate ?? 0),
    }));

    return { problems, total };
  }

  async findBySlug(slug: string): Promise<NexorithmProblem | null> {
    const doc = await ProblemModel.findOne({ slug }).lean();
    if (!doc) return null;
    return this.docToProblem(doc);
  }

  async findById(id: string): Promise<NexorithmProblem | null> {
    const doc = await ProblemModel.findOne({ id }).lean();
    if (!doc) return null;
    return this.docToProblem(doc);
  }

  async upsert(problem: NexorithmProblem): Promise<void> {
    await ProblemModel.findOneAndUpdate(
      { slug: problem.slug },
      { $set: problem },
      { upsert: true, new: true }
    );
  }

  private docToProblem(doc: Record<string, unknown>): NexorithmProblem {
    const starterCode = (doc['starterCode'] as Record<string, string>) ?? {};
    const testCases = (doc['testCases'] as Array<Record<string, unknown>>) ?? [];

    return {
      id: String(doc['id'] ?? ''),
      slug: String(doc['slug'] ?? ''),
      title: String(doc['title'] ?? ''),
      difficulty: doc['difficulty'] as NexorithmProblem['difficulty'],
      content: String(doc['content'] ?? ''),
      tags: (doc['tags'] as string[]) ?? [],
      starterCode: {
        javascript: String(starterCode['javascript'] ?? '// Write your solution here\n'),
        python: String(starterCode['python'] ?? '# Write your solution here\n'),
      },
      testCases: testCases.map((tc) => ({
        input: String(tc['input'] ?? ''),
        expectedOutput: String(tc['expectedOutput'] ?? ''),
        isHidden: Boolean(tc['isHidden']),
      })),
      sampleInput: String(doc['sampleInput'] ?? ''),
      sampleOutput: String(doc['sampleOutput'] ?? ''),
      hints: (doc['hints'] as string[]) ?? [],
      acRate: Number(doc['acRate'] ?? 0),
    };
  }
}

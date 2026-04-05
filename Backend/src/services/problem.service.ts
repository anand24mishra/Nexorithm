import { IProblemRepository } from '../interfaces/IProblemRepository';
import { IExternalProblemApi } from '../interfaces/IExternalProblemApi';
import {
  NexorithmProblem,
  ProblemListItem,
  ProblemListParams,
  ProblemListResponse,
  Difficulty,
} from '../types';

export class ProblemService {
  constructor(
    private readonly repo: IProblemRepository,
    private readonly externalApi: IExternalProblemApi
  ) {}

  async getProblems(params: ProblemListParams): Promise<ProblemListResponse> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const { problems, total } = await this.repo.findAll(params);

    return {
      problems,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProblemBySlug(slug: string): Promise<NexorithmProblem | null> {
    // 1. Check local repo first
    const cached = await this.repo.findBySlug(slug);
    if (cached) return cached;

    // 2. Try Tier 1 (Vercel proxy)
    try {
      const raw = await this.externalApi.fetchFromVercel(slug);
      const mapped = this.mapVercelToProblem(raw);
      if (mapped) {
        await this.repo.upsert(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn(`Tier 1 (Vercel) failed for "${slug}":`, err);
    }

    // 3. Fallback to Tier 2 (LeetCode GraphQL)
    try {
      const raw = await this.externalApi.fetchFromGraphQL(slug);
      const mapped = this.mapGraphQLToProblem(raw);
      if (mapped) {
        await this.repo.upsert(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn(`Tier 2 (GraphQL) failed for "${slug}":`, err);
    }

    return null;
  }

  async getProblemById(id: string): Promise<NexorithmProblem | null> {
    return this.repo.findById(id);
  }

  async getDailyChallenge(): Promise<NexorithmProblem | null> {
    try {
      const raw = await this.externalApi.fetchDailyChallenge();
      const dailyData = raw as Record<string, unknown>;
      const slug =
        (dailyData['titleSlug'] as string) ??
        (dailyData['title_slug'] as string);
      if (slug) {
        return this.getProblemBySlug(slug);
      }
    } catch (err) {
      console.warn('Daily challenge fetch failed:', err);
    }

    // Fallback: return first seed problem
    const { problems } = await this.repo.findAll({ page: 1, limit: 1 });
    if (problems.length > 0) {
      return this.repo.findBySlug(problems[0].slug);
    }
    return null;
  }

  async seedProblems(limit: number = 100): Promise<{ count: number; slugs: string[] }> {
    try {
      // 1. Fetch bulk problem list
      let slugsToFetch: string[] = [];
      const listRaw = await this.externalApi.fetchProblemList({ page: 1, limit });
      
      // Vercel returns an Array of { title_slug: string } directly in some endpoints
      if (Array.isArray(listRaw)) {
        slugsToFetch = listRaw.map(item => item.title_slug || item.titleSlug).filter(Boolean) as string[];
      } else {
        const listData = listRaw as { problemsetQuestionList?: Array<{ titleSlug?: string, title_slug?: string }> };
        if (Array.isArray(listData.problemsetQuestionList)) {
          slugsToFetch = listData.problemsetQuestionList.map(item => item.titleSlug || item.title_slug).filter(Boolean) as string[];
        }
      }
      
      if (slugsToFetch.length === 0) {
         console.warn('No slugs found to seed.');
         return { count: 0, slugs: [] };
      }

      console.log(`Starting bulk seed for ${slugsToFetch.length} problems...`);
      let count = 0;
      const seededSlugs: string[] = [];

      // 2. Iterate and cache them sequentially (to avoid rate limits, though Vercel is fast, GraphQL isn't)
      for (const slug of slugsToFetch) {
        try {
          const cached = await this.repo.findBySlug(slug);
          if (!cached) {
            console.log(`Seeding problem: ${slug}`);
            await this.getProblemBySlug(slug);
            count++;
            seededSlugs.push(slug);
            // Throttle slightly
            await new Promise((res) => setTimeout(res, 300));
          } else {
            seededSlugs.push(slug);
          }
        } catch (e) {
          console.error(`Failed to seed ${slug}:`, e);
        }
      }
      return { count, slugs: seededSlugs };
    } catch (error) {
      console.error('Failed bulk seed:', error);
      throw error;
    }
  }

  // ─── Mappers ──────────────────────────────────────────────────────

  private mapVercelToProblem(raw: unknown): NexorithmProblem | null {
    if (!raw || typeof raw !== 'object') return null;
    const data = raw as Record<string, unknown>;

    const slug =
      (data['titleSlug'] as string) ?? (data['title_slug'] as string) ?? '';
    const title = (data['title'] as string) ?? '';
    if (!slug || !title) return null;

    const diffStr = ((data['difficulty'] as string) ?? 'Easy').toLowerCase();
    const difficulty = Object.values(Difficulty).includes(diffStr as Difficulty)
      ? (diffStr as Difficulty)
      : Difficulty.EASY;

    const content = (data['content'] as string) ?? `<p>${title}</p>`;

    // Extract tags
    const topicTags = (data['topicTags'] as Array<{ name: string }>) ?? [];
    const tags = topicTags.map((t) => t.name);

    // Extract starter code from codeSnippets
    const codeSnippets =
      (data['codeSnippets'] as Array<{
        lang: string;
        langSlug: string;
        code: string;
      }>) ?? [];

    const jsSnippet = codeSnippets.find(
      (s) => s.langSlug === 'javascript'
    );
    const pySnippet = codeSnippets.find(
      (s) => s.langSlug === 'python3' || s.langSlug === 'python'
    );

    const starterCode = {
      javascript: jsSnippet?.code ?? '// Write your solution here\n',
      python: pySnippet?.code ?? '# Write your solution here\n',
    };

    const hints = (data['hints'] as string[]) ?? [];
    const sampleTestCase = (data['sampleTestCase'] as string) ?? '';

    const questionId =
      (data['questionFrontendId'] as string) ??
      (data['questionId'] as string) ??
      (data['frontend_id'] as string) ??
      (data['id'] as string) ??
      '';

    return {
      id: questionId,
      slug,
      title,
      difficulty,
      content,
      tags,
      starterCode,
      testCases: [],
      sampleInput: sampleTestCase,
      sampleOutput: '',
      hints,
      acRate: Number(data['acRate'] ?? 0),
    };
  }

  private mapGraphQLToProblem(raw: unknown): NexorithmProblem | null {
    if (!raw || typeof raw !== 'object') return null;
    const data = raw as Record<string, unknown>;

    const slug = (data['titleSlug'] as string) ?? '';
    const title = (data['title'] as string) ?? '';
    if (!slug || !title) return null;

    const diffStr = ((data['difficulty'] as string) ?? 'Easy').toLowerCase();
    const difficulty = Object.values(Difficulty).includes(diffStr as Difficulty)
      ? (diffStr as Difficulty)
      : Difficulty.EASY;

    const content = (data['content'] as string) ?? `<p>${title}</p>`;

    const topicTags = (data['topicTags'] as Array<{ name: string }>) ?? [];
    const tags = topicTags.map((t) => t.name);

    const codeSnippets =
      (data['codeSnippets'] as Array<{
        lang: string;
        langSlug: string;
        code: string;
      }>) ?? [];

    const jsSnippet = codeSnippets.find(
      (s) => s.langSlug === 'javascript'
    );
    const pySnippet = codeSnippets.find(
      (s) => s.langSlug === 'python3' || s.langSlug === 'python'
    );

    const starterCode = {
      javascript: jsSnippet?.code ?? '// Write your solution here\n',
      python: pySnippet?.code ?? '# Write your solution here\n',
    };

    const hints = (data['hints'] as string[]) ?? [];
    const sampleTestCase = (data['sampleTestCase'] as string) ?? '';
    const questionId =
      (data['questionFrontendId'] as string) ??
      (data['questionId'] as string) ??
      '';

    return {
      id: questionId,
      slug,
      title,
      difficulty,
      content,
      tags,
      starterCode,
      testCases: [],
      sampleInput: sampleTestCase,
      sampleOutput: '',
      hints,
      acRate: 0,
    };
  }
}

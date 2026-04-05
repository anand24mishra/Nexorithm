import { IExternalProblemApi } from '../../interfaces/IExternalProblemApi';
import { ProblemListParams } from '../../types';

const VERCEL_BASE_URL = 'https://leetcode-api-pied.vercel.app';
const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';

export class LeetCodeApiClient implements IExternalProblemApi {
  

  async fetchFromVercel(slug: string): Promise<unknown> {
    const res = await fetch(`${VERCEL_BASE_URL}/problem/${slug}`);
    if (!res.ok) {
      throw new Error(`Vercel API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async fetchProblemList(params: ProblemListParams): Promise<unknown> {
    const limit = params.limit ?? 20;
    const skip = ((params.page ?? 1) - 1) * limit;
    let url = `${VERCEL_BASE_URL}/problems?limit=${limit}&skip=${skip}`;
    if (params.difficulty) {
      const diffMap: Record<string, string> = {
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard',
      };
      url += `&difficulty=${diffMap[params.difficulty] ?? params.difficulty}`;
    }
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Vercel API error: ${res.status}`);
    }
    return res.json();
  }

  async fetchDailyChallenge(): Promise<unknown> {
    const res = await fetch(`${VERCEL_BASE_URL}/daily`);
    if (!res.ok) {
      throw new Error(`Vercel API error: ${res.status}`);
    }
    return res.json();
  }

  

  async fetchFromGraphQL(slug: string): Promise<unknown> {
    const query = `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          questionFrontendId
          title
          titleSlug
          content
          difficulty
          topicTags { name slug }
          codeSnippets { lang langSlug code }
          stats
          hints
          sampleTestCase
        }
      }
    `;

    const res = await fetch(LEETCODE_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Referer: 'https://leetcode.com',
      },
      body: JSON.stringify({
        query,
        variables: { titleSlug: slug },
      }),
    });

    if (!res.ok) {
      throw new Error(`LeetCode GraphQL error: ${res.status}`);
    }

    const json = (await res.json()) as { data?: { question?: unknown } };
    if (!json.data?.question) {
      throw new Error('Problem not found via GraphQL');
    }
    return json.data.question;
  }
}

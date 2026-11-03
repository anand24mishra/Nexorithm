import { API_BASE } from './authApi';
import type { NexorithmProblem, ProblemListResponse } from '../types';

export const problemApi = {
  async getAll(
    page = 1,
    limit = 20,
    difficulty?: string,
    search?: string,
    tags?: string,
  ): Promise<ProblemListResponse> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (difficulty) params.set('difficulty', difficulty);
    if (search) params.set('search', search);
    if (tags) params.set('tags', tags);
    const res = await fetch(`${API_BASE}/problems?${params}`);
    if (!res.ok) throw new Error(`Failed to fetch problems: ${res.status}`);
    return (await res.json()) as ProblemListResponse;
  },

  async getBySlug(slug: string): Promise<NexorithmProblem> {
    const res = await fetch(`${API_BASE}/problems/${slug}`);
    if (!res.ok) throw new Error(`Failed to fetch problem: ${res.status}`);
    return (await res.json()) as NexorithmProblem;
  },

  async getDaily(): Promise<NexorithmProblem> {
    const res = await fetch(`${API_BASE}/problems/daily`);
    if (!res.ok) throw new Error(`Failed to fetch daily challenge: ${res.status}`);
    return (await res.json()) as NexorithmProblem;
  },
};

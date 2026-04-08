import { API_BASE } from './authApi';

export const problemApi = {
  async getAll(
    page = 1,
    limit = 20,
    difficulty?: string,
    search?: string
  ): Promise<Response> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (difficulty) params.set('difficulty', difficulty);
    if (search) params.set('search', search);
    const res = await fetch(`${API_BASE}/problems?${params}`);
    if (!res.ok) throw new Error(`Failed to fetch problems: ${res.status}`);
    return res.json();
  },

  async getBySlug(slug: string): Promise<Response> {
    const res = await fetch(`${API_BASE}/problems/${slug}`);
    if (!res.ok) throw new Error(`Failed to fetch problem: ${res.status}`);
    return res.json();
  },

  async getDaily(): Promise<Response> {
    const res = await fetch(`${API_BASE}/problems/daily`);
    if (!res.ok) throw new Error(`Failed to fetch daily challenge: ${res.status}`);
    return res.json();
  },
};

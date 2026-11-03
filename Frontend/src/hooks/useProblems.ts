import { useState, useEffect } from 'react';
import type { ProblemListResponse } from '../types';
import { problemApi } from '../api/problemApi';

export function useProblems(page = 1, difficulty?: string, search?: string, limit = 20, tags?: string) {
  const [data, setData] = useState<ProblemListResponse>({ problems: [], total: 0, page: 1, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => { if (!cancelled) { setLoading(true); setError(null); } });
    problemApi.getAll(page, Math.min(limit, 100), difficulty, search, tags)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, difficulty, search, limit, tags]);

  return { ...data, loading, error };
}

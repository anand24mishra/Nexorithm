import { useState, useEffect } from 'react';
import type { ProblemListItem } from '../types';
import { problemApi } from '../api/problemApi';

interface ProblemListResult {
  problems: ProblemListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export function useProblems(page = 1, difficulty?: string, search?: string, limit = 20) {
  const [data, setData] = useState<ProblemListResult>({ problems: [], total: 0, page: 1, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    problemApi.getAll(page, limit, difficulty, search)
      .then((res) => setData(res as unknown as ProblemListResult))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, difficulty, search, limit]);

  return { ...data, loading, error };
}

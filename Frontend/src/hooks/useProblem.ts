import { useState, useEffect } from 'react';
import type { NexorithmProblem } from '../types';
import { problemApi } from '../api/problemApi';

export function useProblem(slug: string) {
  const [problem, setProblem] = useState<NexorithmProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    problemApi.getBySlug(slug)
      .then((data) => setProblem(data as unknown as NexorithmProblem))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  return { problem, loading, error };
}

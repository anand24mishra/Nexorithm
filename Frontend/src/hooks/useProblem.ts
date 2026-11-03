import { useState, useEffect } from 'react';
import type { NexorithmProblem } from '../types';
import { problemApi } from '../api/problemApi';

export function useProblem(slug: string) {
  const [problem, setProblem] = useState<NexorithmProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    void Promise.resolve().then(() => { if (!cancelled) { setLoading(true); setError(null); } });
    problemApi.getBySlug(slug)
      .then((data) => { if (!cancelled) setProblem(data as unknown as NexorithmProblem); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  return { problem, loading, error };
}

import { useState, useEffect, useCallback } from 'react';
import { submissionHistoryApi } from '../api/submissionHistoryApi';
import type { Submission } from '../types';

export function useSubmissionHistory(problemId?: string) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = problemId
        ? await submissionHistoryApi.getSubmissionsByProblem(problemId)
        : await submissionHistoryApi.getSubmissions();
      setSubmissions(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  }, [problemId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return { submissions, isLoading, error, refresh: fetchSubmissions };
}

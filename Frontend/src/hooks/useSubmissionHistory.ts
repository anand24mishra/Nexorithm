import { useState, useEffect, useCallback } from 'react';
import { submissionHistoryApi } from '../api/submissionHistoryApi';
import type { Submission } from '../types';
export function useSubmissionHistory(problemId?: string) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1), [totalPages, setTotalPages] = useState(0), [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(v => v + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    void submissionHistoryApi.getPage(page, problemId, controller.signal).then(data => {
      if (!controller.signal.aborted) { setSubmissions(data.submissions); setTotalPages(data.totalPages); setError(null); }
    }).catch(err => { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Could not load history'); })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    window.addEventListener('submission-updated', refresh);
    return () => { controller.abort(); window.removeEventListener('submission-updated', refresh); };
  }, [page, problemId, revision, refresh]);
  return { submissions, isLoading, error, refresh, page, totalPages, setPage };
}

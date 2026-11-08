import { useCallback, useEffect, useState } from "react";
import { analyticsApi, type AnalyticsReport } from "../api/analyticsApi";

export function useAnalytics(problemId?: string, enabled = true) {
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      setReport(await analyticsApi.get(problemId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analytics could not be loaded. Try again.");
    } finally {
      setLoading(false);
    }
  }, [enabled, problemId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onUpdate = () => {
      void load();
    };
    window.addEventListener("submission-updated", onUpdate);
    return () => window.removeEventListener("submission-updated", onUpdate);
  }, [load]);

  return { report, loading, error, reload: load };
}

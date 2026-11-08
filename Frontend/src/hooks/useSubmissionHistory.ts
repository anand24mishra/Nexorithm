import { useCallback, useEffect, useState } from "react";
import { submissionHistoryApi } from "../api/submissionHistoryApi";
import type { Submission } from "../types";

export function verdictLabel(submission: {
  verdict?: string | null;
  status?: string | null;
}): string {
  if (typeof submission.verdict === "string" && submission.verdict.trim()) {
    return submission.verdict;
  }
  switch (submission.status) {
    case "queued":
      return "Queued";
    case "running":
      return "Running";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return "No verdict";
  }
}

export function verdictTone(label: string): "accepted" | "neutral" | "failure" {
  if (label.trim().toLowerCase() === "accepted") return "accepted";
  if (
    label === "Queued" ||
    label === "Running" ||
    label === "Completed" ||
    label === "No verdict"
  ) {
    return "neutral";
  }
  return "failure";
}

export function formatRuntimeMs(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return `${value} ms`;
}

export function useSubmissionHistory(problemId?: string, enabled = true) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [revision, setRevision] = useState(0);
  const [problemKey, setProblemKey] = useState(problemId);
  const [loadingPage, setLoadingPage] = useState(page);
  const [enabledKey, setEnabledKey] = useState(enabled);

  if (problemId !== problemKey) {
    setProblemKey(problemId);
    setPage(1);
    setLoadingPage(1);
    setSubmissions([]);
    setTotal(0);
    setTotalPages(0);
    setError(null);
    setIsLoading(enabled);
  } else if (page !== loadingPage) {
    setLoadingPage(page);
    if (enabled) setIsLoading(true);
  }

  if (enabled !== enabledKey) {
    setEnabledKey(enabled);
    if (enabled) setIsLoading(true);
  }

  const refresh = useCallback(() => {
    setRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    void submissionHistoryApi
      .getPage(page, problemId, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        const rows = Array.isArray(data?.submissions) ? data.submissions : [];
        setSubmissions(rows);
        setTotal(typeof data?.total === "number" ? data.total : rows.length);
        setTotalPages(
          typeof data?.totalPages === "number" ? data.totalPages : 0,
        );
        setError(null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setSubmissions([]);
        setTotal(0);
        setTotalPages(0);
        setError(
          err instanceof Error ? err.message : "Could not load history",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    const onUpdate = () => {
      setIsLoading(true);
      refresh();
    };
    window.addEventListener("submission-updated", onUpdate);
    return () => {
      controller.abort();
      window.removeEventListener("submission-updated", onUpdate);
    };
  }, [page, problemId, revision, refresh, enabled]);

  return {
    submissions,
    total,
    isLoading,
    error,
    refresh,
    page,
    totalPages,
    setPage,
  };
}

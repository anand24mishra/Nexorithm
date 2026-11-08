import { useCallback, useEffect, useState } from "react";
import { fetchWithAuth } from "../api/authApi";

export function useSubmissionActivity(enabled: boolean) {
  const [timestamps, setTimestamps] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!enabled) {
      setTimestamps([]);
      return;
    }
    const response = await fetchWithAuth("/submissions/activity");
    if (!response.ok) {
      setTimestamps([]);
      return;
    }
    const body = (await response.json()) as { timestamps?: unknown };
    setTimestamps(
      Array.isArray(body.timestamps)
        ? body.timestamps.filter((value): value is string => typeof value === "string")
        : [],
    );
  }, [enabled]);

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

  return timestamps;
}

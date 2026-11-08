import { useEffect, useState } from "react";
import { fetchWithAuth } from "../api/authApi";

export function useSubmissionActivity(enabled: boolean) {
  const [timestamps, setTimestamps] = useState<string[]>([]);
  const [trackedEnabled, setTrackedEnabled] = useState(enabled);
  const [revision, setRevision] = useState(0);

  if (enabled !== trackedEnabled) {
    setTrackedEnabled(enabled);
    if (!enabled) setTimestamps([]);
  }

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void fetchWithAuth("/submissions/activity", { signal: controller.signal })
      .then(async (response) => {
        if (controller.signal.aborted) return;
        if (!response.ok) {
          setTimestamps([]);
          return;
        }
        const body = (await response.json()) as { timestamps?: unknown };
        if (controller.signal.aborted) return;
        setTimestamps(
          Array.isArray(body.timestamps)
            ? body.timestamps.filter((value): value is string => typeof value === "string")
            : [],
        );
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setTimestamps([]);
      });
    return () => controller.abort();
  }, [enabled, revision]);

  useEffect(() => {
    if (!enabled) return;
    const onUpdate = () => {
      setRevision((value) => value + 1);
    };
    window.addEventListener("submission-updated", onUpdate);
    return () => window.removeEventListener("submission-updated", onUpdate);
  }, [enabled]);

  return timestamps;
}

import { useCallback, useEffect, useRef } from "react";
import { useWorkspace } from "../context/workspaceState";
import { submissionApi } from "../api/submissionApi";
import { pollSubmission } from "./pollSubmission";
import { Verdict } from "../types";
export function useSubmission() {
  const { state, dispatch, activeSubmission: active } = useWorkspace();
  const pending = useRef<{ id: string; submit: boolean } | null>(null);
  useEffect(
    () => () => {
      active.current?.abort();
      active.current = null;
      pending.current = null;
    },
    [state.problemId, active],
  );
  const perform = useCallback(
    async (submit: boolean, resume = false) => {
      if (active.current || !state.problemId) return;
      if (
        !resume &&
        (!state.code.trim() ||
          new TextEncoder().encode(state.code).length > 65536)
      ) {
        dispatch({
          type: submit ? "SUBMIT_ERROR" : "RUN_ERROR",
          payload: "Enter a solution of at most 64 KB.",
        });
        return;
      }
      const controller = new AbortController();
      active.current = controller;
      dispatch({ type: submit ? "SUBMIT_START" : "RUN_START" });
      try {
        dispatch({
          type: "SUBMISSION_STATUS",
          payload: "Validating submission…",
        });
        const id =
          resume && pending.current
            ? pending.current.id
            : (
                await submissionApi.submit(
                  state.code,
                  state.language,
                  state.problemId,
                  AbortSignal.any([
                    controller.signal,
                    AbortSignal.timeout(10000),
                  ]),
                )
              ).submissionId;
        pending.current = { id, submit };
        dispatch({
          type: "SUBMISSION_STATUS",
          payload: "Queued — waiting for a judge…",
        });
        const row = await pollSubmission(
          id,
          (id, signal) =>
            submissionApi.get(
              id,
              AbortSignal.any([signal, AbortSignal.timeout(10000)]),
            ),
          controller.signal,
          (payload) => dispatch({ type: "SUBMISSION_STATUS", payload }),
        );
        const result = row.result ?? {
          verdict: row.verdict ?? Verdict.SYSTEM_ERROR,
          passedCount: row.passedTestCases,
          totalCount: row.totalTestCases,
          stdout: "",
          stderr: "",
          results: [],
          executionTimeMs: row.executionTimeMs,
        };
        dispatch({
          type: submit ? "SUBMIT_SUCCESS" : "RUN_SUCCESS",
          payload: { ...result, queueWaitMs: row.queueWaitMs },
        });
        pending.current = null;
        window.dispatchEvent(new Event("submission-updated"));
      } catch (error) {
        if (!controller.signal.aborted)
          dispatch({
            type: submit ? "SUBMIT_ERROR" : "RUN_ERROR",
            payload:
              error instanceof Error
                ? error.message
                : "Submission failed. Check your connection and try again.",
          });
      } finally {
        if (active.current === controller) active.current = null;
      }
    },
    [state.code, state.language, state.problemId, dispatch, active],
  );
  const retryStatus = useCallback(() => {
    if (pending.current) void perform(pending.current.submit, true);
  }, [perform]);
  useEffect(() => {
    window.addEventListener("retry-submission-status", retryStatus);
    return () =>
      window.removeEventListener("retry-submission-status", retryStatus);
  }, [retryStatus]);
  return {
    runCode: () => perform(false),
    submitCode: () => perform(true),
    retryStatus,
    canRetryStatus: !!pending.current,
    isRunning: state.isRunning,
    isSubmitting: state.isSubmitting,
  };
}

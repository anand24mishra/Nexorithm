import { useCallback, useEffect, useRef } from "react";
import { useWorkspace } from "../context/workspaceState";
import { useAuth } from "../context/authState";
import { submissionApi } from "../api/submissionApi";
import { pollSubmission } from "./pollSubmission";
import { Verdict } from "../types";

const SIGN_IN = "Sign in to submit your code.";

export function useSubmission() {
  const { state, dispatch, activeSubmission: active } = useWorkspace();
  const { isAuthenticated } = useAuth();
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
        const ack =
          resume && pending.current
            ? { mode: "queued" as const, submissionId: pending.current.id }
            : await submissionApi.submit(
                state.code,
                state.language,
                state.problemId,
                AbortSignal.any([
                  controller.signal,
                  AbortSignal.timeout(10000),
                ]),
              );
        if (ack.mode === "result") {
          dispatch({
            type: submit ? "SUBMIT_SUCCESS" : "RUN_SUCCESS",
            payload: ack.result,
          });
          pending.current = null;
          window.dispatchEvent(new Event("submission-updated"));
          return;
        }
        const id = ack.submissionId;
        if (!id) {
          throw new Error(
            isAuthenticated
              ? "Submission response did not include an id."
              : SIGN_IN,
          );
        }
        pending.current = { id, submit };
        dispatch({
          type: "SUBMISSION_STATUS",
          payload: "Queued — waiting for a judge…",
        });
        const row = await pollSubmission(
          id,
          (submissionId, signal) =>
            submissionApi.get(
              submissionId,
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
          payload: {
            ...result,
            results: result.results ?? [],
            queueWaitMs: row.queueWaitMs,
          },
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
    [
      state.code,
      state.language,
      state.problemId,
      dispatch,
      active,
      isAuthenticated,
    ],
  );
  const retryStatus = useCallback(() => {
    if (pending.current) void perform(pending.current.submit, true);
  }, [perform]);
  useEffect(() => {
    const onRun = () => {
      void perform(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        void perform(false);
      }
    };
    window.addEventListener("retry-submission-status", retryStatus);
    window.addEventListener("nx-run-code", onRun);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("retry-submission-status", retryStatus);
      window.removeEventListener("nx-run-code", onRun);
      window.removeEventListener("keydown", onKey);
    };
  }, [retryStatus, perform]);
  return {
    runCode: () => perform(false),
    submitCode: () => perform(true),
    retryStatus,
    canRetryStatus: !!pending.current,
    isRunning: state.isRunning,
    isSubmitting: state.isSubmitting,
  };
}

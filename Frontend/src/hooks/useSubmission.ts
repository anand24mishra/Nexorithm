import { useCallback } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { submissionApi } from '../api/submissionApi';

export function useSubmission() {
  const { state, dispatch } = useWorkspace();

  const runCode = useCallback(async () => {
    if (state.isRunning || !state.problemId) return;
    dispatch({ type: 'RUN_START' });
    try {
      const result = await submissionApi.submit(state.code, state.language, state.problemId);
      dispatch({ type: 'RUN_SUCCESS', payload: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Submission failed';
      dispatch({ type: 'RUN_ERROR', payload: message });
    }
  }, [state.code, state.language, state.problemId, state.isRunning, dispatch]);

  return { runCode, isRunning: state.isRunning };
}

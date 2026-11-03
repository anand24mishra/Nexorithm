import { useWorkspace } from '../../context/workspaceState';
export function SubmissionStatus() {
  const { state } = useWorkspace();
  if (!state.consoleOutput) return null;
  return <div role="status" aria-live="polite" style={{ padding: '12px 16px', overflowWrap: 'anywhere', color: 'var(--text-secondary)' }}>
    {state.consoleOutput}
    {!state.isRunning && !state.isSubmitting && !state.consoleOutput.startsWith('Sign in') && <button type="button" onClick={() => window.dispatchEvent(new Event('retry-submission-status'))} style={{ marginInlineStart: 12 }}>Retry status</button>}
  </div>;
}

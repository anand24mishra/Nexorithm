import { useWorkspace } from '../../context/workspaceState';

interface Props {
  canRetry?: boolean;
}

export function SubmissionStatus({ canRetry = false }: Props) {
  const { state } = useWorkspace();
  if (!state.consoleOutput) return null;
  const signIn = state.consoleOutput.startsWith('Sign in');
  const showRetry = canRetry && !signIn && !state.isRunning && !state.isSubmitting;
  return (
    <div role="status" aria-live="polite" className="px-4 py-3 text-sm text-on-surface-variant" style={{ overflowWrap: 'anywhere' }}>
      <p>{state.consoleOutput}</p>
      {showRetry && (
        <button
          type="button"
          className="mt-2 min-h-11 px-3 text-sm font-semibold text-primary-container"
          onClick={() => window.dispatchEvent(new Event('retry-submission-status'))}
        >
          Retry status
        </button>
      )}
    </div>
  );
}

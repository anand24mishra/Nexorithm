import { useWorkspace } from '../../context/WorkspaceContext';
import { VerdictBadge } from '../common/VerdictBadge';

export function ConsolePanel() {
  const { state, dispatch } = useWorkspace();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
      {/* Tabs */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--border-primary)',
        background: 'var(--bg-tertiary)', minHeight: '36px',
      }}>
        <button
          onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'testcase' })}
          style={{
            padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
            color: state.activeTab === 'testcase' ? 'var(--accent-blue)' : 'var(--text-secondary)',
            borderBottom: state.activeTab === 'testcase' ? '2px solid var(--accent-blue)' : '2px solid transparent',
            fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-sans)',
          }}
        >
          Test Cases
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'result' })}
          style={{
            padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
            color: state.activeTab === 'result' ? 'var(--accent-blue)' : 'var(--text-secondary)',
            borderBottom: state.activeTab === 'result' ? '2px solid var(--accent-blue)' : '2px solid transparent',
            fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-sans)',
          }}
        >
          Result {state.lastResult && '●'}
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
        {state.activeTab === 'result' ? (
          <ResultView />
        ) : (
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            <p style={{ marginBottom: '8px' }}>Run your code to see test results here.</p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Press <kbd style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Ctrl+Enter</kbd> to run
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultView() {
  const { state } = useWorkspace();

  if (state.isRunning) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 0' }}>
        <span className="spinner" />
        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Running your code...</span>
      </div>
    );
  }

  if (state.consoleOutput && !state.lastResult) {
    return (
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent-red)' }}>
        {state.consoleOutput}
      </div>
    );
  }

  if (!state.lastResult) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
        No results yet. Run your code first.
      </div>
    );
  }

  const { lastResult } = state;

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <VerdictBadge verdict={lastResult.verdict} />
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {lastResult.passedCount}/{lastResult.totalCount} test cases passed
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {lastResult.executionTimeMs}ms
        </span>
      </div>

      {lastResult.results.map((tc, i) => (
        <div key={i} style={{
          padding: '10px 12px', marginBottom: '8px',
          background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
          borderLeft: `3px solid ${tc.passed ? 'var(--accent-green)' : 'var(--accent-red)'}`,
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: tc.passed ? 'var(--accent-green)' : 'var(--accent-red)', marginBottom: '6px' }}>
            Test Case {i + 1}: {tc.passed ? 'Passed ✓' : 'Failed ✗'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '2px', fontFamily: 'var(--font-sans)' }}>Expected</div>
              <div style={{ color: 'var(--text-primary)' }}>{tc.expectedOutput}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '2px', fontFamily: 'var(--font-sans)' }}>Output</div>
              <div style={{ color: tc.passed ? 'var(--text-primary)' : 'var(--accent-red)' }}>{tc.actualOutput || '(empty)'}</div>
            </div>
          </div>
          {tc.stderr && (
            <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>
              {tc.stderr}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

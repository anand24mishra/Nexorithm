import { useSubmissionHistory } from '../../hooks/useSubmissionHistory';
import { VerdictBadge } from '../common/VerdictBadge';
import type { Submission } from '../../types';

interface Props {
  problemId?: string;
  onSelectSubmission?: (code: string) => void;
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleString();
}

export function SubmissionHistory({ problemId, onSelectSubmission }: Props) {
  const { submissions, isLoading, error } = useSubmissionHistory(problemId);

  if (isLoading) {
    return (
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
        <span className="spinner" /> Loading submissions...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px', color: 'var(--accent-red)', background: 'rgba(248,81,73,0.1)', borderRadius: 'var(--radius-md)' }}>
        {error}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
        <div style={{ fontSize: '14px' }}>No submissions yet for this problem.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {submissions.map((sub: Submission) => (
        <div
          key={sub.id}
          style={{
            background: 'var(--bg-tertiary)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-primary)',
            cursor: onSelectSubmission ? 'pointer' : 'default',
            transition: 'border-color 0.15s, background 0.15s',
          }}
          onClick={() => onSelectSubmission?.(sub.code)}
          onMouseEnter={(e) => {
            if (onSelectSubmission) {
              e.currentTarget.style.borderColor = 'var(--accent-blue)';
              e.currentTarget.style.background = 'var(--bg-active)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-primary)';
            e.currentTarget.style.background = 'var(--bg-tertiary)';
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <VerdictBadge verdict={sub.verdict} />
            <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
              {formatDate(sub.submittedAt)}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>
              <span style={{ color: 'var(--text-muted)' }}>Lang: </span>
              <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{sub.language}</span>
            </span>
            {sub.verdict === 'Accepted' ? (
              <span style={{ color: 'var(--accent-green)' }}>⏱ {sub.executionTimeMs}ms</span>
            ) : (
              <span>{sub.passedTestCases}/{sub.totalTestCases} passed</span>
            )}
          </div>
          {onSelectSubmission && (
            <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--accent-blue)', opacity: 0.8 }}>
              Click to load this code →
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

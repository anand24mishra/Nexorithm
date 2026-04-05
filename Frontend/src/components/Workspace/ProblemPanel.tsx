import { useState, useCallback } from 'react';
import DOMPurify from 'dompurify';
import type { NexorithmProblem } from '../../types';
import { Difficulty } from '../../types';
import { SubmissionHistory } from '../SubmissionHistory/SubmissionHistory';
import { useWorkspace } from '../../context/WorkspaceContext';

interface Props {
  problem: NexorithmProblem;
}

const diffBadge: Record<string, string> = {
  [Difficulty.EASY]: 'badge badge-easy',
  [Difficulty.MEDIUM]: 'badge badge-medium',
  [Difficulty.HARD]: 'badge badge-hard',
};

type Tab = 'description' | 'submissions';

export function ProblemPanel({ problem }: Props) {
  const sanitized = DOMPurify.sanitize(problem.content);
  const [activeTab, setActiveTab] = useState<Tab>('description');
  const { dispatch } = useWorkspace();

  const handleLoadSubmission = useCallback((code: string) => {
    dispatch({ type: 'SET_CODE', payload: code });
  }, [dispatch]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
      {/* Tab Bar */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--border-primary)',
        background: 'var(--bg-tertiary)', padding: '0 16px', flexShrink: 0,
      }}>
        {(['description', 'submissions'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? 'var(--accent-blue)' : 'var(--text-muted)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--accent-blue)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              fontFamily: 'var(--font-sans)',
              textTransform: 'capitalize',
              marginBottom: '-1px',
            }}
          >
            {tab === 'submissions' ? '📋 Submissions' : '📄 Description'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {activeTab === 'description' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600 }}>
                {problem.id}.
              </span>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {problem.title}
              </h1>
              <span className={diffBadge[problem.difficulty] || 'badge'}>
                {problem.difficulty}
              </span>
            </div>

            {problem.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {problem.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            )}

            {problem.acRate > 0 && (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Acceptance Rate: {problem.acRate.toFixed(1)}%
              </div>
            )}

            <div
              className="problem-content"
              dangerouslySetInnerHTML={{ __html: sanitized }}
            />

            {problem.hints.length > 0 && (
              <details style={{ marginTop: '20px' }}>
                <summary style={{ cursor: 'pointer', color: 'var(--accent-blue)', fontSize: '14px', fontWeight: 600 }}>
                  💡 Hints ({problem.hints.length})
                </summary>
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  {problem.hints.map((hint, i) => (
                    <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '4px' }}>
                      {hint}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}

        {activeTab === 'submissions' && (
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Click any submission to load its code into the editor.
            </div>
            <SubmissionHistory
              problemId={problem.id}
              onSelectSubmission={handleLoadSubmission}
            />
          </div>
        )}
      </div>
    </div>
  );
}

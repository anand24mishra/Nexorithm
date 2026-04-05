import { useState, useCallback } from 'react';
import DOMPurify from 'dompurify';
import type { NexorithmProblem } from '../../types';
import { SubmissionHistory } from '../SubmissionHistory/SubmissionHistory';
import { useWorkspace } from '../../context/WorkspaceContext';

interface Props {
  problem: NexorithmProblem;
  activeTab?: string;
}

const diffConfig: Record<string, { bg: string; text: string; label: string }> = {
  easy:   { bg: 'bg-on-secondary', text: 'text-secondary', label: 'Easy' },
  medium: { bg: 'bg-yellow-900/50', text: 'text-yellow-400', label: 'Medium' },
  hard:   { bg: 'bg-error-container/50', text: 'text-error', label: 'Hard' },
};

export function NxProblemPanel({ problem, activeTab }: Props) {
  const sanitized = DOMPurify.sanitize(problem.content);
  const [hintsOpen, setHintsOpen] = useState(false);
  const { dispatch } = useWorkspace();
  const diff = diffConfig[problem.difficulty] || diffConfig['easy'];

  const handleLoadSubmission = useCallback((code: string) => {
    dispatch({ type: 'SET_CODE', payload: code });
  }, [dispatch]);

  const isSubmissions = activeTab === 'submissions';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Panel Header */}
      <div className="h-10 px-4 flex items-center border-b border-outline-variant/10 bg-surface flex-shrink-0">
        <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface">
          {isSubmissions ? 'Submissions' : 'Description'}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* ── Description Tab ── */}
        {!isSubmissions && (
          <>
            {/* Title + difficulty */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl font-bold text-on-surface leading-tight">
                  {problem.id}. {problem.title}
                </h1>
                <span className={`px-3 py-1 rounded-full ${diff.bg} ${diff.text} text-[10px] font-bold uppercase tracking-widest flex-shrink-0`}>
                  {diff.label}
                </span>
              </div>

              {/* Tags */}
              {problem.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {problem.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant text-[10px] font-medium border border-outline-variant/20">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Problem Content */}
            <div
              className="problem-content"
              dangerouslySetInnerHTML={{ __html: sanitized }}
            />

            {/* Acceptance Rate */}
            {problem.acRate > 0 && (
              <div className="text-[11px] text-on-surface-variant/60 flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Acceptance Rate: <span className="text-secondary font-semibold">{problem.acRate.toFixed(1)}%</span>
              </div>
            )}

            {/* Hints */}
            {problem.hints.length > 0 && (
              <div className="border border-outline-variant/20 rounded-lg overflow-hidden">
                <button
                  onClick={() => setHintsOpen((o) => !o)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-surface hover:bg-surface-container transition-colors"
                >
                  <span className="text-xs font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                    Hints ({problem.hints.length})
                  </span>
                  <span className="material-symbols-outlined text-on-surface-variant text-[16px]">
                    {hintsOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {hintsOpen && (
                  <div className="px-4 py-3 space-y-2 bg-surface-container-lowest border-t border-outline-variant/10">
                    {problem.hints.map((hint, i) => (
                      <div key={i} className="flex gap-2 text-xs text-on-surface-variant">
                        <span className="text-primary font-bold flex-shrink-0">{i + 1}.</span>
                        <span>{hint}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Submissions Tab ── */}
        {isSubmissions && (
          <div>
            <p className="text-xs text-on-surface-variant/60 mb-4">
              Click any submission to load its code into the editor.
            </p>
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

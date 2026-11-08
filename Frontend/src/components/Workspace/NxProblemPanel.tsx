import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import type { NexorithmProblem } from '../../types';
import { SubmissionHistory } from '../SubmissionHistory/SubmissionHistory';
import { useWorkspace } from '../../context/workspaceState';
import { EditorialArticle } from './EditorialArticle';
import { fetchOfficialSolution, type EditorialBlock } from './officialSolution';

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
  const isEditorial = activeTab === 'editorial';
  const showArticle = isEditorial;
  const requestedKey = showArticle ? problem.slug : null;
  const [seenArticleKey, setSeenArticleKey] = useState<string | null>(null);
  const [article, setArticle] = useState<{
    key: string;
    blocks: EditorialBlock[];
    error: string | null;
  } | null>(null);
  if (requestedKey !== seenArticleKey) {
    setSeenArticleKey(requestedKey);
    setArticle(null);
  }

  useEffect(() => {
    if (!requestedKey) return;
    const controller = new AbortController();
    const key = requestedKey;
    fetchOfficialSolution(key, controller.signal)
      .then((blocks) => {
        if (controller.signal.aborted) return;
        setArticle({ key, blocks, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setArticle({
          key,
          blocks: [],
          error: error instanceof Error ? error.message : 'Editorial is unavailable right now.',
        });
      });
    return () => controller.abort();
  }, [requestedKey]);

  const articleReady = article !== null && article.key === requestedKey;
  const articleLoading = requestedKey !== null && !articleReady;
  const articleError = articleReady ? article.error : null;
  const articleBlocks = articleReady ? article.blocks : [];

  const panelTitle = isSubmissions ? 'Submissions' : isEditorial ? 'Editorial' : 'Description';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {}
      <div className="h-10 px-4 flex items-center border-b border-outline-variant/10 bg-surface flex-shrink-0">
        <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface">
          {panelTitle}
        </span>
      </div>

      {}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {}
        {showArticle && (
          <div>
            {articleLoading && (
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <span className="spinner" /> Loading editorial…
              </div>
            )}
            {articleError && <p className="text-sm text-error">{articleError}</p>}
            {!articleLoading && !articleError && articleBlocks.length > 0 && (
              <EditorialArticle blocks={articleBlocks} />
            )}
            {!articleLoading && articleReady && !articleError && articleBlocks.length === 0 && (
              <p className="text-sm text-on-surface-variant">
                No editorial is available for this problem.
              </p>
            )}
          </div>
        )}

        {!isSubmissions && !showArticle && (
          <>
            {}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl font-bold text-on-surface leading-tight">
                  {problem.id}. {problem.title}
                </h1>
                <span className={`px-3 py-1 rounded-full ${diff.bg} ${diff.text} text-[10px] font-bold uppercase tracking-widest flex-shrink-0`}>
                  {diff.label}
                </span>
              </div>

              {}
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

            {}
            <div
              className="problem-content"
              dangerouslySetInnerHTML={{ __html: sanitized }}
            />

            {}
            {problem.acRate > 0 && (
              <div className="text-[11px] text-on-surface-variant/60 flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Acceptance Rate: <span className="text-secondary font-semibold">{problem.acRate.toFixed(1)}%</span>
              </div>
            )}

            {}
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

        {}
        {isSubmissions && (
          <div className="space-y-3">
            <p className="text-xs text-on-surface-variant">
              Click any submission to load its code into the editor.
            </p>
            <Link
              to={`/problem/${problem.slug}/analytics`}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-container"
            >
              View analytics
            </Link>
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

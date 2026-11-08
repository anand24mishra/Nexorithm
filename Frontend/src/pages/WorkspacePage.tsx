import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useProblem } from '../hooks/useProblem';
import { useProblems } from '../hooks/useProblems';
import { WorkspaceProvider } from '../context/WorkspaceContext';
import { useWorkspace } from '../context/workspaceState';
import { NxProblemPanel } from '../components/Workspace/NxProblemPanel';
import { NxEditorPanel } from '../components/Workspace/NxEditorPanel';
import { NxTestPanel } from '../components/Workspace/NxTestPanel';
import { useSubmission } from '../hooks/useSubmission';
import { Language } from '../types';

type SideTab = 'problem' | 'submissions' | 'editorial';
type Pane = 'description' | 'code' | 'results';

function isLanguage(value: unknown): value is Language {
  return value === Language.JAVASCRIPT || value === Language.PYTHON;
}

function WorkspaceShell() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const shellRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<Language>(Language.JAVASCRIPT);
  const problemIdRef = useRef('');
  const { problem, loading, error } = useProblem(slug ?? '');
  const { problems } = useProblems(1, undefined, undefined, 100);
  const [sideTab, setSideTab] = useState<SideTab>('problem');
  const [pane, setPane] = useState<Pane>('code');
  const { state, dispatch } = useWorkspace();
  const workspaceBusy = state.isRunning || state.isSubmitting;
  const [seenWorkspaceBusy, setSeenWorkspaceBusy] = useState(false);
  if (workspaceBusy !== seenWorkspaceBusy) {
    setSeenWorkspaceBusy(workspaceBusy);
    if (workspaceBusy) setPane('results');
  }
  const { runCode, submitCode, isRunning, isSubmitting, canRetryStatus } = useSubmission();
  const [browserFullscreen, setBrowserFullscreen] = useState(false);
  const [acceptedNote, setAcceptedNote] = useState(false);
  const prevResult = useRef<string | null>(null);
  const skipDraftReset = useRef(false);
  const returnTo = `${location.pathname}${location.search}`;

  const goToLogin = useCallback(() => {
    navigate('/login', { state: { from: returnTo } });
  }, [navigate, returnTo]);

  useEffect(() => {
    if (!problem) return;
    const restoredState = location.state as { code?: unknown; language?: unknown } | null;
    const restoredCode = restoredState?.code;
    const restoredLanguage = isLanguage(restoredState?.language) ? restoredState.language : null;
    const lang = restoredLanguage ?? state.language;
    const starterCode = lang === Language.PYTHON
      ? problem.starterCode.python
      : problem.starterCode.javascript;
    const savedDraft = localStorage.getItem(`nexorithm-draft-${problem.id}-${lang}`);
    const restoring = typeof restoredCode === 'string' && state.problemId !== problem.id;
    if (!restoring && skipDraftReset.current) {
      skipDraftReset.current = false;
      return;
    }
    const code = restoring ? restoredCode : (savedDraft ?? starterCode);
    if (restoring) skipDraftReset.current = true;
    if (restoredLanguage && restoredLanguage !== state.language) {
      dispatch({ type: 'SET_LANGUAGE', payload: restoredLanguage });
    }
    if (state.problemId !== problem.id) {
      dispatch({ type: 'SET_PROBLEM', payload: { problemId: problem.id, code } });
    } else {
      dispatch({ type: 'SET_CODE', payload: code });
    }
  }, [dispatch, location.state, problem, state.language, state.problemId]);

  useEffect(() => {
    if (!state.problemId || !state.code) return;
    const languageChanged = languageRef.current !== state.language;
    const problemChanged = problemIdRef.current !== state.problemId;
    languageRef.current = state.language;
    problemIdRef.current = state.problemId;
    if (languageChanged && !problemChanged) return;
    localStorage.setItem(`nexorithm-draft-${state.problemId}-${state.language}`, state.code);
  }, [state.code, state.problemId, state.language]);

  useEffect(() => {
    if (
      state.lastResult?.isSubmit &&
      state.lastResult?.verdict === 'Accepted' &&
      prevResult.current !== JSON.stringify(state.lastResult)
    ) {
      prevResult.current = JSON.stringify(state.lastResult);
      const start = setTimeout(() => setAcceptedNote(true), 0);
      const hide = setTimeout(() => setAcceptedNote(false), 6000);
      return () => {
        clearTimeout(start);
        clearTimeout(hide);
      };
    }
  }, [state.lastResult]);

  const goToPrev = useCallback(() => {
    if (!problem || !problems.length) return;
    const idx = problems.findIndex((p) => p.slug === problem.slug);
    if (idx > 0) navigate(`/problem/${problems[idx - 1].slug}`);
  }, [problem, problems, navigate]);

  const goToNext = useCallback(() => {
    if (!problem || !problems.length) return;
    const idx = problems.findIndex((p) => p.slug === problem.slug);
    if (idx >= 0 && idx < problems.length - 1) navigate(`/problem/${problems[idx + 1].slug}`);
  }, [problem, problems, navigate]);

  useEffect(() => {
    const sync = () => setBrowserFullscreen(document.fullscreenElement === shellRef.current);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const shell = shellRef.current;
    if (!shell) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void shell.requestFullscreen().catch(() => dispatch({ type: 'TOGGLE_FULLSCREEN' }));
  }, [dispatch]);

  const sideNav: { id: SideTab; icon: string; label: string }[] = [
    { id: 'problem', icon: 'description', label: 'Problem' },
    { id: 'submissions', icon: 'history', label: 'Submits' },
    { id: 'editorial', icon: 'menu_book', label: 'Editorial' },
  ];

  const paneClass = (id: Pane) =>
    `${pane === id ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:flex`;

  const needsSignIn = state.consoleOutput.startsWith('Sign in');

  return (
    <div ref={shellRef} className={`flex h-screen min-w-0 flex-col overflow-hidden bg-background font-body text-on-surface ${state.isFullscreen ? 'fixed inset-0 z-[80]' : ''}`}>
      <header className="relative z-50 flex flex-shrink-0 flex-col border-b border-outline-variant bg-surface-container-low">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2">
          <button type="button" onClick={() => navigate('/')} className="min-h-11 text-base font-semibold tracking-tight text-on-surface">
            Nexorithm
          </button>
          <button type="button" onClick={() => navigate('/')} className="min-h-11 px-2 text-sm text-on-surface-variant">
            Problems
          </button>
          <div className="flex items-center">
            <button type="button" onClick={goToPrev} className="inline-flex min-h-11 min-w-11 items-center justify-center text-on-surface-variant" aria-label="Previous problem">
              <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
            </button>
            <button type="button" onClick={goToNext} className="inline-flex min-h-11 min-w-11 items-center justify-center text-on-surface-variant" aria-label="Next problem">
              <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
            </button>
          </div>
          <div className="ml-auto flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={runCode}
              disabled={isRunning || isSubmitting || !problem}
              className="inline-flex min-h-11 flex-shrink-0 items-center border border-primary-container px-3 text-sm font-semibold text-primary-container disabled:opacity-40"
            >
              {isRunning ? 'Running…' : 'Run'}
            </button>
            <button
              type="button"
              onClick={submitCode}
              disabled={isRunning || isSubmitting || !problem}
              className="inline-flex min-h-11 flex-shrink-0 items-center bg-primary-container px-3 text-sm font-semibold text-on-primary disabled:opacity-40"
            >
              {isSubmitting ? 'Submitting…' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="hidden min-h-11 min-w-11 items-center justify-center text-on-surface-variant sm:inline-flex"
              aria-label={browserFullscreen || state.isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              aria-pressed={browserFullscreen || state.isFullscreen}
            >
              <span className="material-symbols-outlined" aria-hidden="true">{browserFullscreen || state.isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
            </button>
          </div>
        </div>
        <div className="flex border-t border-outline-variant lg:hidden" role="tablist" aria-label="Workspace panes">
          {([
            ['description', 'Description'],
            ['code', 'Code'],
            ['results', 'Results'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={pane === id}
              className={`min-h-11 flex-1 text-sm ${pane === id ? 'text-on-surface' : 'text-on-surface-variant'}`}
              onClick={() => setPane(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {needsSignIn && (
        <div className="flex flex-shrink-0 flex-wrap items-center gap-3 border-b border-outline-variant bg-surface-container px-3 py-2" role="status">
          <p className="text-sm text-on-surface">Sign in to run or submit. Your draft stays in this browser.</p>
          <button type="button" onClick={goToLogin} className="min-h-11 bg-primary-container px-3 text-sm font-semibold text-on-primary">
            Sign in to run
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden w-14 flex-shrink-0 flex-col border-r border-outline-variant bg-background py-2 lg:flex">
          <nav className="flex flex-col" aria-label="Problem sections">
            {sideNav.map(({ id, icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSideTab(id)}
                aria-current={sideTab === id ? 'page' : undefined}
                className={`flex min-h-11 flex-col items-center justify-center text-[10px] ${sideTab === id ? 'bg-surface-container-low text-primary-container' : 'text-on-surface-variant'}`}
              >
                <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '20px' }}>{icon}</span>
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-12 lg:gap-px lg:bg-surface-container-lowest">
          <section className={`${paneClass('description')} bg-surface-container-low lg:col-span-4`}>
            <div className="flex flex-shrink-0 border-b border-outline-variant lg:hidden">
              {sideNav.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`min-h-11 flex-1 text-sm ${sideTab === id ? 'text-on-surface' : 'text-on-surface-variant'}`}
                  onClick={() => setSideTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            {loading && (
              <div className="flex flex-1 items-center justify-center gap-3 text-on-surface-variant">
                <span className="spinner" />
                <span className="text-sm">Loading problem…</span>
              </div>
            )}
            {error && (
              <div className="flex flex-1 items-center justify-center p-6">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}
            {problem && <NxProblemPanel problem={problem} activeTab={sideTab} />}
          </section>

          <section className={`${paneClass('code')} bg-surface-container-high lg:col-span-5`}>
            {problem && <NxEditorPanel problem={problem} codePaneVisible={pane === 'code'} />}
          </section>

          <section className={`${paneClass('results')} bg-surface-container-low lg:col-span-3`}>
            <NxTestPanel
              sampleInput={problem?.sampleInput}
              sampleOutput={problem?.sampleOutput}
              canRetry={canRetryStatus}
            />
          </section>
        </main>
      </div>

      {acceptedNote && state.lastResult?.verdict === 'Accepted' && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-[70] max-w-xs border border-outline-variant bg-surface-container-high p-4" role="status">
          <p className="text-sm font-semibold text-on-surface">Accepted</p>
          <p className="mt-1 font-mono text-xs text-on-surface-variant">
            {state.lastResult.passedCount}/{state.lastResult.totalCount} passed · {state.lastResult.executionTimeMs} ms
          </p>
        </div>
      )}
    </div>
  );
}

export function WorkspacePage() {
  return (
    <WorkspaceProvider>
      <WorkspaceShell />
    </WorkspaceProvider>
  );
}

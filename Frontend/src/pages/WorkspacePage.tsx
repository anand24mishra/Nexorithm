import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProblem } from '../hooks/useProblem';
import { useProblems } from '../hooks/useProblems';
import { WorkspaceProvider, useWorkspace } from '../context/WorkspaceContext';
import { NxProblemPanel } from '../components/Workspace/NxProblemPanel';
import { NxEditorPanel } from '../components/Workspace/NxEditorPanel';
import { NxTestPanel } from '../components/Workspace/NxTestPanel';
import { useSubmission } from '../hooks/useSubmission';
import { useAuth } from '../context/AuthContext';
import { Language } from '../types';
import Confetti from 'react-confetti';

type SideTab = 'problem' | 'submissions' | 'editorial' | 'solutions';

function WorkspaceShell() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { problem, loading, error } = useProblem(slug ?? '');
  const { problems } = useProblems(1, undefined, undefined, 5000);
  const [sideTab, setSideTab] = useState<SideTab>('problem');
  const { state, dispatch } = useWorkspace();
  const { runCode, submitCode, isRunning, isSubmitting } = useSubmission();
  const { isAuthenticated, username, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevResult = useRef<string | null>(null);

  
  useEffect(() => {
    if (!problem) return;
    const lang = state.language;
    const starterCode = lang === Language.PYTHON
      ? problem.starterCode.python
      : problem.starterCode.javascript;
    const savedDraft = localStorage.getItem(`nexorithm-draft-${problem.id}-${lang}`);
    dispatch({ type: 'SET_PROBLEM', payload: { problemId: problem.id, code: savedDraft ?? starterCode } });
  
  }, [problem?.id]);

  useEffect(() => {
    if (
      state.lastResult?.isSubmit &&
      state.lastResult?.verdict === 'Accepted' &&
      prevResult.current !== JSON.stringify(state.lastResult)
    ) {
      prevResult.current = JSON.stringify(state.lastResult);
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 6000);
      return () => clearTimeout(t);
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

  const sideNav: { id: SideTab; icon: string; label: string }[] = [
    { id: 'problem', icon: 'description', label: 'Problem' },
    { id: 'submissions', icon: 'history', label: 'Submits' },
    { id: 'editorial', icon: 'menu_book', label: 'Editorial' },
    { id: 'solutions', icon: 'lightbulb', label: 'Solutions' },
  ];

  return (
    <div className="bg-background text-on-surface font-body overflow-hidden h-screen flex flex-col">
      {showConfetti && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={600} gravity={0.22} />
        </div>
      )}

      {}
      <header className="flex justify-between items-center w-full px-4 h-12 bg-surface-container-low border-none shadow-none z-50 flex-shrink-0">
        <div className="flex items-center gap-5">
          <button onClick={() => navigate('/')} className="text-lg font-bold text-on-surface tracking-tighter hover:text-primary transition-colors">
            Nexorithm
          </button>
          <nav className="flex items-center gap-1">
            <button
              onClick={() => navigate('/')}
              className="px-3 h-12 flex items-center text-on-surface font-semibold border-b-2 border-primary-container text-sm tracking-wide transition-colors"
            >
              Problems
            </button>
            <div className="flex items-center ml-2 bg-surface-container rounded-lg p-0.5">
              <button onClick={goToPrev} className="p-1.5 text-on-surface-variant opacity-70 hover:bg-surface-container-high hover:text-on-surface rounded transition-all" title="Previous problem">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant px-1 font-medium">Prev</span>
              <div className="w-px h-3 bg-outline-variant/20 mx-1" />
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant px-1 font-medium">Next</span>
              <button onClick={goToNext} className="p-1.5 text-on-surface-variant opacity-70 hover:bg-surface-container-high hover:text-on-surface rounded transition-all" title="Next problem">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runCode}
            disabled={isRunning || isSubmitting || !problem}
            className="px-4 py-1.5 rounded-lg border border-primary-container text-primary-container font-semibold text-xs hover:bg-primary-container/10 active:scale-95 transition-all disabled:opacity-40"
          >
            {isRunning ? <span className="flex items-center gap-1.5"><span className="spinner" /> Running…</span> : '▶  Run'}
          </button>
          <button
            onClick={submitCode}
            disabled={isRunning || isSubmitting || !problem}
            className="px-4 py-1.5 rounded-lg bg-primary-container text-on-primary-container font-bold text-xs hover:bg-primary-fixed-dim active:scale-[0.97] transition-all disabled:opacity-40"
          >
            {isSubmitting ? <span className="flex items-center gap-1.5"><span className="spinner" /> Submitting…</span> : '✓  Submit'}
          </button>
          <div className="flex items-center gap-1 ml-1 relative">
            <button className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded transition-all" title="Settings">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button
              className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded transition-all"
              title="Toggle fullscreen"
            >
              <span className="material-symbols-outlined">fullscreen</span>
            </button>
            {isAuthenticated ? (
              <div className="relative ml-1">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold shadow-sm hover:opacity-90 transition-opacity"
                >
                  {username?.[0]?.toUpperCase() || 'U'}
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface-container-high rounded-xl border border-outline-variant/20 shadow-xl py-1 z-50">
                    <div className="px-4 py-2 border-b border-outline-variant/10">
                      <p className="text-sm font-bold text-on-surface truncate">{username}</p>
                    </div>
                    <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-error hover:bg-surface-container-highest transition-colors flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">logout</span>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2 ml-2 items-center">
                <button onClick={() => navigate('/login')} className="px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors">Sign In</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {}
        <aside className="flex flex-col items-center py-3 space-y-4 bg-background w-14 flex-shrink-0 border-r border-outline-variant/10">
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>terminal</span>
          </div>
          <nav className="flex flex-col items-center w-full gap-0">
            {sideNav.map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => {
                  if (id === 'submissions' && problem) {
                    navigate(`/problem/${problem.slug}/analytics`);
                  } else {
                    setSideTab(id);
                  }
                }}
                className={`w-full py-3.5 flex flex-col items-center gap-0.5 transition-all group ${sideTab === id
                    ? 'text-primary-container border-r-2 border-primary-container bg-surface-container-low'
                    : 'text-on-surface-variant opacity-50 hover:bg-surface-container-high hover:opacity-100 border-r-2 border-transparent'
                  }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: sideTab === id ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
                <span className="text-[7px] uppercase tracking-tighter font-medium">{label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-auto pb-2">
            <button className="w-9 h-9 rounded-lg bg-surface-container-highest/30 flex items-center justify-center text-primary hover:bg-surface-container-highest transition-colors">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>workspace_premium</span>
            </button>
          </div>
        </aside>

        {}
        <main className="flex-1 grid grid-cols-12 gap-px bg-surface-container-lowest overflow-hidden">
          {}
          <section className="col-span-4 bg-surface-container-low flex flex-col overflow-hidden">
            {loading && (
              <div className="flex-1 flex items-center justify-center gap-3 text-on-surface-variant">
                <span className="spinner" style={{ width: 20, height: 20 }} />
                <span className="text-sm">Loading…</span>
              </div>
            )}
            {error && (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="text-3xl mb-3">⚠️</div>
                  <div className="text-error text-sm">{error}</div>
                </div>
              </div>
            )}
            {problem && <NxProblemPanel problem={problem} activeTab={sideTab} />}
          </section>

          {}
          <section className="col-span-5 bg-surface-container-high flex flex-col overflow-hidden">
            {problem && <NxEditorPanel problem={problem} />}
          </section>

          {}
          <section className="col-span-3 bg-surface-container-low flex flex-col overflow-hidden">
            <NxTestPanel />
          </section>
        </main>
      </div>

      {}
      {state.lastResult?.isSubmit && state.lastResult?.verdict === 'Accepted' && (
        <div className="fixed bottom-6 right-6 z-[100] bg-surface-container-highest/90 backdrop-blur-xl border border-outline-variant/20 rounded-xl p-4 shadow-2xl flex items-center gap-4 max-w-xs animate-fade-in">
          <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary flex-shrink-0">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">Solution Accepted!</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {state.lastResult.passedCount}/{state.lastResult.totalCount} test cases passed · {state.lastResult.executionTimeMs}ms
            </p>
          </div>
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

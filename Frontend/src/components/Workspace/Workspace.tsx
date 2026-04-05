import { useEffect, useState, useRef, useCallback } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { ProblemPanel } from './ProblemPanel';
import { EditorPanel } from './EditorPanel';
import { ConsolePanel } from './ConsolePanel';
import { Language } from '../../types';
import type { NexorithmProblem } from '../../types';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import Confetti from 'react-confetti';

interface Props {
  problem: NexorithmProblem;
}

export function Workspace({ problem }: Props) {
  const { state, dispatch } = useWorkspace();
  const [leftWidth, setLeftWidth] = useState(38);
  const [bottomHeight, setBottomHeight] = useState(35);
  const [showConfetti, setShowConfetti] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingH = useRef(false);
  const isDraggingV = useRef(false);
  const prevResultId = useRef<string | null>(null);

  useKeyboardShortcuts();

  // Load problem — restore draft or use starter code. Only re-run when problem changes.
  useEffect(() => {
    const lang = state.language;
    const starterCode = lang === Language.JAVASCRIPT
      ? problem.starterCode.javascript
      : problem.starterCode.python;
    const savedDraft = localStorage.getItem(`nexorithm-draft-${problem.id}-${lang}`);
    dispatch({ type: 'SET_PROBLEM', payload: { problemId: problem.id, code: savedDraft ?? starterCode } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem.id]);

  // When language switches, load draft or starter for the new language
  useEffect(() => {
    if (!state.problemId || state.problemId !== problem.id) return;
    const lang = state.language;
    const starterCode = lang === Language.JAVASCRIPT
      ? problem.starterCode.javascript
      : problem.starterCode.python;
    const savedDraft = localStorage.getItem(`nexorithm-draft-${problem.id}-${lang}`);
    dispatch({ type: 'SET_CODE', payload: savedDraft ?? starterCode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.language]);

  // Auto-save draft on code change
  useEffect(() => {
    if (state.problemId && state.code) {
      localStorage.setItem(`nexorithm-draft-${state.problemId}-${state.language}`, state.code);
    }
  }, [state.code, state.problemId, state.language]);

  // Confetti on Accepted — only trigger once per new result
  useEffect(() => {
    if (
      state.lastResult &&
      state.lastResult.verdict === 'Accepted' &&
      prevResultId.current !== JSON.stringify(state.lastResult)
    ) {
      prevResultId.current = JSON.stringify(state.lastResult);
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 5500);
      return () => clearTimeout(t);
    }
  }, [state.lastResult]);

  const startDragH = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingH.current = true;
    const onMove = (ev: MouseEvent) => {
      if (!isDraggingH.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftWidth(Math.max(20, Math.min(65, pct)));
    };
    const onUp = () => {
      isDraggingH.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  const startDragV = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingV.current = true;
    const rightEl = containerRef.current?.querySelector('.workspace-right') as HTMLDivElement | null;
    const onMove = (ev: MouseEvent) => {
      if (!isDraggingV.current || !rightEl) return;
      const rect = rightEl.getBoundingClientRect();
      const pct = ((rect.bottom - ev.clientY) / rect.height) * 100;
      setBottomHeight(Math.max(15, Math.min(60, pct)));
    };
    const onUp = () => {
      isDraggingV.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  if (state.isFullscreen) {
    return (
      <div style={{ width: '100%', height: '100%' }}>
        <EditorPanel problem={problem} />
      </div>
    );
  }

  return (
    <>
      {showConfetti && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, pointerEvents: 'none' }}>
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={600}
            gravity={0.25}
          />
        </div>
      )}

      <div ref={containerRef} style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
        {/* Left Panel — Problem */}
        <div style={{ width: `${leftWidth}%`, height: '100%', overflow: 'hidden', borderRight: '1px solid var(--border-primary)' }}>
          <ProblemPanel problem={problem} />
        </div>

        {/* Horizontal Divider */}
        <div
          onMouseDown={startDragH}
          style={{ width: '4px', cursor: 'col-resize', background: 'var(--border-primary)', flexShrink: 0, transition: 'background 0.15s' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-blue)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--border-primary)')}
        />

        {/* Right Panel — Editor + Console */}
        <div className="workspace-right" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <EditorPanel problem={problem} />
          </div>

          {/* Vertical Divider */}
          <div
            onMouseDown={startDragV}
            style={{ height: '4px', cursor: 'row-resize', background: 'var(--border-primary)', flexShrink: 0, transition: 'background 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-blue)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--border-primary)')}
          />

          <div style={{ height: `${bottomHeight}%`, overflow: 'hidden', flexShrink: 0 }}>
            <ConsolePanel />
          </div>
        </div>
      </div>
    </>
  );
}

import { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { VerdictBadge } from '../common/VerdictBadge';

type ConsoleTab = 'testcase' | 'result';
type CaseTab = 'case1' | 'case2' | 'custom';

const CASE_LABELS: CaseTab[] = ['case1', 'case2', 'custom'];

export function NxTestPanel() {
  const { state, dispatch } = useWorkspace();
  const [consoleTab, setConsoleTab] = useState<ConsoleTab>('testcase');
  const [caseTab, setCaseTab] = useState<CaseTab>('case1');
  const [consoleOpen, setConsoleOpen] = useState(true);

  // Sync to result tab after run
  const activeConsoleTab = state.lastResult ? 'result' : consoleTab;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header Tabs */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-outline-variant/10 bg-surface flex-shrink-0">
        <div className="flex items-center gap-4">
          {(['testcase', 'result'] as ConsoleTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setConsoleTab(tab)}
              className={`text-[11px] font-bold uppercase tracking-widest h-10 border-b-2 transition-colors ${
                activeConsoleTab === tab
                  ? 'text-on-surface border-primary-container'
                  : 'text-on-surface-variant/50 border-transparent hover:text-on-surface-variant'
              }`}
            >
              {tab === 'testcase' ? 'Test Case' : (
                <span className="flex items-center gap-1.5">
                  Result
                  {state.lastResult && (
                    <span className={`w-1.5 h-1.5 rounded-full ${state.lastResult.verdict === 'Accepted' ? 'bg-secondary' : 'bg-error'}`} />
                  )}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* ── Test Case Tab ── */}
        {activeConsoleTab === 'testcase' && (
          <div className="flex-1 overflow-y-auto">
            {/* Case sub-tabs */}
            <div className="flex items-center gap-2 px-4 pt-4 pb-2">
              {CASE_LABELS.map((c, i) => (
                <button
                  key={c}
                  onClick={() => setCaseTab(c)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                    caseTab === c
                      ? 'bg-surface-container-highest text-on-surface border-outline-variant/30'
                      : 'bg-surface-container-highest/40 text-on-surface-variant/60 border-outline-variant/10 hover:bg-surface-container-highest/70'
                  }`}
                >
                  {c === 'custom' ? 'Custom' : `Case ${i + 1}`}
                </button>
              ))}
            </div>
            <div className="px-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant/60">nums</label>
                <div className="bg-surface-container-lowest p-3 rounded border border-outline-variant/10 font-mono text-sm text-on-surface">
                  {caseTab === 'case1' ? '[2, 7, 11, 15]' : caseTab === 'case2' ? '[3, 2, 4]' : (
                    <input className="bg-transparent outline-none w-full" placeholder="[2, 7, 11, 15]" defaultValue="[2, 7, 11, 15]" />
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant/60">target</label>
                <div className="bg-surface-container-lowest p-3 rounded border border-outline-variant/10 font-mono text-sm text-on-surface">
                  {caseTab === 'case1' ? '9' : caseTab === 'case2' ? '6' : (
                    <input className="bg-transparent outline-none w-full" placeholder="9" defaultValue="9" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Result Tab ── */}
        {activeConsoleTab === 'result' && (
          <div className="flex-1 overflow-y-auto">
            {state.isRunning && (
              <div className="flex items-center gap-3 p-6 text-on-surface-variant text-sm">
                <span className="spinner" />
                Running your code…
              </div>
            )}
            {!state.isRunning && !state.lastResult && (
              <div className="p-6 text-on-surface-variant/50 text-sm text-center">
                <div className="text-3xl mb-3">🖥️</div>
                Run your code to see results here.
              </div>
            )}
            {!state.isRunning && state.lastResult && (
              <div className="p-4 space-y-4">
                {/* Verdict summary */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-2 w-2 rounded-full ${state.lastResult.verdict === 'Accepted' ? 'bg-secondary' : 'bg-error'}`}
                    />
                    <VerdictBadge verdict={state.lastResult.verdict} />
                  </div>
                  <span className="text-[10px] text-on-surface-variant/50">
                    {state.lastResult.passedCount}/{state.lastResult.totalCount} passed
                  </span>
                </div>

                {/* Stats grid */}
                {state.lastResult.verdict === 'Accepted' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/10">
                      <p className="text-[9px] uppercase font-bold text-on-surface-variant/40 mb-1">Runtime</p>
                      <p className="text-sm font-mono text-on-surface">{state.lastResult.executionTimeMs} ms</p>
                    </div>
                    <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/10">
                      <p className="text-[9px] uppercase font-bold text-on-surface-variant/40 mb-1">Test Cases</p>
                      <p className="text-sm font-mono text-secondary">{state.lastResult.passedCount}/{state.lastResult.totalCount}</p>
                    </div>
                  </div>
                )}

                {/* Per-test results */}
                <div className="space-y-2">
                  {state.lastResult.results.map((tc, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border-l-2 bg-surface-container-lowest ${
                        tc.passed ? 'border-secondary' : 'border-error'
                      }`}
                    >
                      <div className={`text-xs font-semibold mb-2 flex items-center gap-1.5 ${tc.passed ? 'text-secondary' : 'text-error'}`}>
                        <span className="material-symbols-outlined text-[14px]">{tc.passed ? 'check_circle' : 'cancel'}</span>
                        Test Case {i + 1}: {tc.passed ? 'Passed' : 'Failed'}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div>
                          <div className="text-on-surface-variant/50 mb-1 font-sans text-[10px] uppercase">Expected</div>
                          <div className="text-on-surface">{tc.expectedOutput}</div>
                        </div>
                        <div>
                          <div className="text-on-surface-variant/50 mb-1 font-sans text-[10px] uppercase">Output</div>
                          <div className={tc.passed ? 'text-on-surface' : 'text-error'}>{tc.actualOutput || '(empty)'}</div>
                        </div>
                      </div>
                      {tc.stderr && (
                        <div className="mt-2 text-[11px] font-mono text-error/80 border-t border-error/10 pt-2">
                          {tc.stderr}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Output */}
                {state.lastResult.stdout && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant/60">Output</label>
                    <div className="bg-surface-container-lowest p-3 rounded border border-outline-variant/10 font-mono text-xs text-secondary-fixed">
                      {state.lastResult.stdout}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Console Footer */}
      <div className="h-10 px-4 flex items-center justify-between border-t border-outline-variant/10 bg-surface flex-shrink-0">
        <button
          onClick={() => setConsoleOpen((v) => !v)}
          className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors group"
        >
          <span className={`material-symbols-outlined text-[18px] transition-transform ${consoleOpen ? '' : 'rotate-180'}`}>
            keyboard_arrow_up
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Console</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'testcase' })}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
            title="Terminal"
          >
            <span className="material-symbols-outlined text-[18px]">terminal</span>
          </button>
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">bug_report</span>
        </div>
      </div>
    </div>
  );
}

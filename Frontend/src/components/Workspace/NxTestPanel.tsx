import { SubmissionStatus } from './SubmissionStatus';
import { useEffect, useState } from 'react';
import { useWorkspace } from '../../context/workspaceState';
import { VerdictBadge } from '../common/VerdictBadge';

type ConsoleTab = 'testcase' | 'result';

interface Props {
  sampleInput?: string;
  sampleOutput?: string;
  canRetry?: boolean;
}

export function NxTestPanel({ sampleInput = '', sampleOutput = '', canRetry = false }: Props) {
  const { state } = useWorkspace();
  const [consoleTab, setConsoleTab] = useState<ConsoleTab>('testcase');

  useEffect(() => {
    if (state.isRunning || state.isSubmitting) setConsoleTab('result');
  }, [state.isRunning, state.isSubmitting]);

  useEffect(() => {
    if (state.consoleOutput) setConsoleTab('result');
  }, [state.consoleOutput]);

  const results = state.lastResult?.results ?? [];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex h-10 flex-shrink-0 items-center justify-between border-b border-outline-variant/10 bg-surface px-4">
        <div className="flex items-center gap-4">
          {(['testcase', 'result'] as ConsoleTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setConsoleTab(tab)}
              className={`h-10 border-b-2 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                consoleTab === tab
                  ? 'border-primary-container text-on-surface'
                  : 'border-transparent text-on-surface-variant/50 hover:text-on-surface-variant'
              }`}
            >
              {tab === 'testcase' ? 'Test Case' : (
                <span className="flex items-center gap-1.5">
                  Result
                  {state.lastResult && (
                    <span className={`h-1.5 w-1.5 rounded-full ${state.lastResult.verdict === 'Accepted' ? 'bg-secondary' : 'bg-error'}`} />
                  )}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {consoleTab === 'testcase' && (
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4 px-4 pt-4">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60">Sample input</p>
                <pre className="whitespace-pre-wrap rounded border border-outline-variant/10 bg-surface-container-lowest p-3 font-mono text-sm text-on-surface">{sampleInput || 'No sample input for this problem.'}</pre>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60">Sample output</p>
                <pre className="whitespace-pre-wrap rounded border border-outline-variant/10 bg-surface-container-lowest p-3 font-mono text-sm text-on-surface">{sampleOutput || 'No sample output for this problem.'}</pre>
              </div>
            </div>
          </div>
        )}

        {consoleTab === 'result' && (
          <div className="flex-1 overflow-y-auto">
            <SubmissionStatus canRetry={canRetry} />
            {!state.isRunning && !state.isSubmitting && !state.lastResult && !state.consoleOutput && (
              <p className="p-6 text-center text-sm text-on-surface-variant">
                Run your code to see results here.
              </p>
            )}
            {!state.isRunning && !state.isSubmitting && state.lastResult && (
              <div className="space-y-4 p-4">
                <div className="flex items-center justify-between gap-3">
                  <VerdictBadge verdict={state.lastResult.verdict} />
                  <span className="text-[10px] text-on-surface-variant">
                    {state.lastResult.passedCount}/{state.lastResult.totalCount} passed
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-3">
                    <p className="mb-1 text-[9px] font-bold uppercase text-on-surface-variant">Runtime</p>
                    <p className="font-mono text-sm text-on-surface">{state.lastResult.executionTimeMs} ms</p>
                  </div>
                  <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-3">
                    <p className="mb-1 text-[9px] font-bold uppercase text-on-surface-variant">Test cases</p>
                    <p className="font-mono text-sm text-on-surface">{state.lastResult.passedCount}/{state.lastResult.totalCount}</p>
                  </div>
                </div>

                {state.lastResult.stderr && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Standard error</p>
                    <pre className="whitespace-pre-wrap rounded border border-outline-variant/20 bg-surface-container-lowest p-3 font-mono text-xs text-error">{state.lastResult.stderr}</pre>
                  </div>
                )}

                {results.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">
                    The judge did not return per-case output. Hidden tests stay hidden.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {results.map((tc, i) => (
                      <div key={i} className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-3">
                        <div className={`mb-2 flex items-center gap-1.5 text-xs font-semibold ${tc.passed ? 'text-secondary' : 'text-error'}`}>
                          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">{tc.passed ? 'check_circle' : 'cancel'}</span>
                          Test Case {i + 1}: {tc.passed ? 'Passed' : 'Failed'}
                        </div>
                        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                          <div>
                            <div className="mb-1 font-sans text-[10px] uppercase text-on-surface-variant/50">Expected</div>
                            <div className="text-on-surface">{tc.expectedOutput}</div>
                          </div>
                          <div>
                            <div className="mb-1 font-sans text-[10px] uppercase text-on-surface-variant/50">Output</div>
                            <div className={tc.passed ? 'text-on-surface' : 'text-error'}>{tc.actualOutput || '(empty)'}</div>
                          </div>
                        </div>
                        {tc.stderr && (
                          <div className="mt-2 border-t border-outline-variant/20 pt-2 font-mono text-[11px] text-error">
                            {tc.stderr}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {state.lastResult.stdout && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Output</p>
                    <pre className="whitespace-pre-wrap rounded border border-outline-variant/20 bg-surface-container-lowest p-3 font-mono text-xs text-on-surface">
                      {state.lastResult.stdout}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

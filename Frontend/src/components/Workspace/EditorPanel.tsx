import { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useSubmission } from '../../hooks/useSubmission';
import { LanguageSelector } from './LanguageSelector';
import { Modal } from '../common/Modal';
import { Language } from '../../types';
import type { NexorithmProblem } from '../../types';

interface Props {
  problem: NexorithmProblem;
}

export function EditorPanel({ problem }: Props) {
  const { state, dispatch } = useWorkspace();
  const { runCode, isRunning } = useSubmission();
  const [showResetModal, setShowResetModal] = useState(false);

  const handleEditorMount: OnMount = (editor, monaco) => {
    monaco.editor.defineTheme('nexorithm-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#c9d1d9',
        'editor.lineHighlightBackground': '#161b2233',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#58a6ff',
        'editorLineNumber.foreground': '#484f58',
        'editorLineNumber.activeForeground': '#c9d1d9',
        'scrollbar.shadow': '#00000000',
      },
    });
    monaco.editor.setTheme('nexorithm-dark');

    editor.addAction({
      id: 'run-code',
      label: 'Run Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => { runCode(); },
    });
  };

  const handleLanguageChange = useCallback((lang: Language) => {
    dispatch({ type: 'SET_LANGUAGE', payload: lang });
  }, [dispatch]);

  const handleReset = () => {
    const starterCode = state.language === Language.JAVASCRIPT
      ? problem.starterCode.javascript
      : problem.starterCode.python;
    
    localStorage.removeItem(`nexorithm-draft-${problem.id}-${state.language}`);
    dispatch({ type: 'RESET_CODE', payload: starterCode });
    setShowResetModal(false);
  };

  const monacoLanguage = state.language === Language.PYTHON ? 'python' : 'javascript';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 12px', borderBottom: '1px solid var(--border-primary)',
        background: 'var(--bg-secondary)', minHeight: '44px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LanguageSelector onLanguageChange={handleLanguageChange} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => dispatch({ type: 'SET_FONT_SIZE', payload: state.fontSize - 1 })}
            title="Decrease font size"
          >A-</button>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '22px', textAlign: 'center' }}>
            {state.fontSize}
          </span>
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => dispatch({ type: 'SET_FONT_SIZE', payload: state.fontSize + 1 })}
            title="Increase font size"
          >A+</button>

          <div style={{ width: '1px', height: '20px', background: 'var(--border-primary)', margin: '0 4px' }} />

          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowResetModal(true)}
            title="Reset to starter code"
          >
            ↺ Reset
          </button>
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => dispatch({ type: 'TOGGLE_FULLSCREEN' })}
            title="Toggle fullscreen"
          >
            {state.isFullscreen ? '⊡' : '⊞'}
          </button>
        </div>
      </div>

      {}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          language={monacoLanguage}
          value={state.code}
          onChange={(v) => dispatch({ type: 'SET_CODE', payload: v ?? '' })}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            fontSize: state.fontSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            suggestOnTriggerCharacters: true,
            tabSize: state.language === Language.PYTHON ? 4 : 2,
            wordWrap: 'off',
            automaticLayout: true,
            bracketPairColorization: { enabled: true },
            formatOnPaste: true,
            quickSuggestions: true,
            parameterHints: { enabled: true },
            padding: { top: 12 },
            scrollbar: { vertical: 'auto', horizontal: 'auto' },
          }}
        />
      </div>

      {}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderTop: '1px solid var(--border-primary)',
        background: 'var(--bg-secondary)', flexShrink: 0,
      }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          ⌘+Enter to Run
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost" onClick={runCode} disabled={isRunning}>
            {isRunning ? <><span className="spinner" /> Running...</> : '▶ Run'}
          </button>
          <button className="btn btn-success" onClick={runCode} disabled={isRunning}>
            {isRunning ? <><span className="spinner" /> Submitting...</> : '✓ Submit'}
          </button>
        </div>
      </div>

      <Modal
        isOpen={showResetModal}
        title="Reset Code"
        message="Reset to the default starter code? Your current code will be lost."
        onConfirm={handleReset}
        onCancel={() => setShowResetModal(false)}
      />
    </div>
  );
}

import { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Language } from '../../types';
import type { NexorithmProblem } from '../../types';
import { Modal } from '../common/Modal';

const LANGUAGES = [
  { value: Language.JAVASCRIPT, label: 'JavaScript' },
  { value: Language.PYTHON,     label: 'Python'     },
];

interface Props { problem: NexorithmProblem; }

export function NxEditorPanel({ problem }: Props) {
  const { state, dispatch } = useWorkspace();
  const [showReset, setShowReset] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);

  const handleMount: OnMount = (editor, monaco) => {
    monaco.editor.defineTheme('nx-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment',  foreground: '6a9955', fontStyle: 'italic' },
        { token: 'keyword',  foreground: 'c586c0' },
        { token: 'string',   foreground: 'ce9178' },
        { token: 'number',   foreground: 'b5cea8' },
        { token: 'type',     foreground: '4ec9b0' },
        { token: 'function', foreground: 'dcdcaa' },
        { token: 'variable', foreground: '9cdcfe' },
        { token: 'operator', foreground: 'd4d4d4' },
      ],
      colors: {
        'editor.background':              '#131313',
        'editor.foreground':              '#e5e2e1',
        'editor.lineHighlightBackground': '#20201F',
        'editor.selectionBackground':     '#264f78',
        'editorCursor.foreground':        '#ffa116',
        'editorLineNumber.foreground':    '#454545',
        'editorLineNumber.activeForeground': '#d9c3ad',
        'scrollbar.shadow':               '#00000000',
        'editorWidget.background':        '#20201f',
        'editorSuggestWidget.background': '#20201f',
        'editorSuggestWidget.border':     '#544434',
        'editorSuggestWidget.selectedBackground': '#353535',
      },
    });
    monaco.editor.setTheme('nx-dark');
    editor.addAction({
      id: 'nx-run',
      label: 'Run / Submit',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {  },
    });
  };

  const handleReset = useCallback(() => {
    const starter = state.language === Language.JAVASCRIPT
      ? problem.starterCode.javascript
      : problem.starterCode.python;
    localStorage.removeItem(`nexorithm-draft-${problem.id}-${state.language}`);
    dispatch({ type: 'RESET_CODE', payload: starter });
    setShowReset(false);
  }, [state.language, problem, dispatch]);

  const currentLang = LANGUAGES.find((l) => l.value === state.language);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {}
      <div className="h-10 px-3 flex items-center justify-between border-b border-outline-variant/10 bg-surface flex-shrink-0">
        {}
        <div className="relative">
          <button
            onClick={() => setShowLangPicker((v) => !v)}
            className="flex items-center gap-1.5 bg-surface-container-lowest px-2.5 py-1 rounded border border-outline-variant/15 text-xs font-bold text-primary hover:border-primary-container/50 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">code</span>
            {currentLang?.label}
            <span className="material-symbols-outlined text-[14px]">expand_more</span>
          </button>
          {showLangPicker && (
            <div className="absolute top-full left-0 mt-1 bg-surface-container border border-outline-variant/20 rounded-lg shadow-2xl z-50 min-w-[140px] overflow-hidden">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => {
                    dispatch({ type: 'SET_LANGUAGE', payload: lang.value });
                    setShowLangPicker(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors ${
                    state.language === lang.value
                      ? 'bg-primary-container/20 text-primary-container'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-on-surface-variant/40 font-mono hidden sm:block">Auto-save: ON</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => dispatch({ type: 'SET_FONT_SIZE', payload: state.fontSize - 1 })}
              className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-all text-[11px] font-bold"
              title="Decrease font size"
            >A-</button>
            <span className="text-[10px] text-on-surface-variant/50 min-w-[20px] text-center">{state.fontSize}</span>
            <button
              onClick={() => dispatch({ type: 'SET_FONT_SIZE', payload: state.fontSize + 1 })}
              className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-all text-[11px] font-bold"
              title="Increase font size"
            >A+</button>
          </div>
          <div className="w-px h-4 bg-outline-variant/20" />
          <button
            onClick={() => setShowReset(true)}
            className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-all"
            title="Reset code"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </div>

      {}
      <div className="flex-1 overflow-hidden">
        <Editor
          language={state.language === Language.PYTHON ? 'python' : 'javascript'}
          value={state.code}
          onChange={(v) => dispatch({ type: 'SET_CODE', payload: v ?? '' })}
          onMount={handleMount}
          theme="vs-dark"
          options={{
            fontSize: state.fontSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            minimap: { enabled: true, scale: 1 },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            suggestOnTriggerCharacters: true,
            tabSize: state.language === Language.PYTHON ? 4 : 2,
            wordWrap: 'off',
            automaticLayout: true,
            bracketPairColorization: { enabled: true },
            formatOnPaste: true,
            quickSuggestions: true,
            parameterHints: { enabled: true },
            padding: { top: 14, bottom: 14 },
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            renderWhitespace: 'selection',
          }}
        />
      </div>

      {}
      <div className="h-8 px-4 flex items-center justify-between bg-surface border-t border-outline-variant/10 flex-shrink-0">
        <div className="flex items-center gap-4 text-[10px] text-on-surface-variant/50 font-mono">
          <span>{currentLang?.label}</span>
          <span>Size: {state.fontSize}px</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-on-surface-variant/40">
          <span className="material-symbols-outlined text-[14px]">keyboard</span>
          <span>Ctrl+Enter to Run</span>
        </div>
      </div>

      <Modal
        isOpen={showReset}
        title="Reset Code"
        message="Reset to the starter code? Your current code will be deleted."
        onConfirm={handleReset}
        onCancel={() => setShowReset(false)}
      />
    </div>
  );
}

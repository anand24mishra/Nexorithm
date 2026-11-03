import { useReducer, useRef } from 'react';
import type { ReactNode } from 'react';
import { WorkspaceContext } from './workspaceState';
import type { WorkspaceState, WorkspaceAction } from '../types';
import { Language } from '../types';

const initialState: WorkspaceState = {
  code: '// Write your solution here\n',
  language: Language.JAVASCRIPT,
  problemId: '',
  isRunning: false,
  isSubmitting: false,
  lastResult: null,
  consoleOutput: '',
  activeTab: 'testcase',
  fontSize: 14,
  isFullscreen: false,
};

function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'SUBMISSION_STATUS':
      return { ...state, consoleOutput: action.payload };
    case 'SET_CODE':
      return { ...state, code: action.payload };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'SET_PROBLEM':
      return { ...state, problemId: action.payload.problemId, code: action.payload.code, lastResult: null, consoleOutput: '', isRunning: false, isSubmitting: false };
    case 'RUN_START':
      return { ...state, isRunning: true, isSubmitting: false, lastResult: null, consoleOutput: 'Running...', activeTab: 'result' };
    case 'RUN_SUCCESS':
      return { ...state, isRunning: false, lastResult: action.payload, consoleOutput: '', activeTab: 'result' };
    case 'RUN_ERROR':
      return { ...state, isRunning: false, consoleOutput: action.payload, activeTab: 'result' };
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true, isRunning: false, lastResult: null, consoleOutput: 'Submitting...', activeTab: 'result' };
    case 'SUBMIT_SUCCESS':
      return { ...state, isSubmitting: false, lastResult: { ...action.payload, isSubmit: true }, consoleOutput: '', activeTab: 'result' };
    case 'SUBMIT_ERROR':
      return { ...state, isSubmitting: false, consoleOutput: action.payload, activeTab: 'result' };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_FONT_SIZE':
      return { ...state, fontSize: Math.max(10, Math.min(24, action.payload)) };
    case 'TOGGLE_FULLSCREEN':
      return { ...state, isFullscreen: !state.isFullscreen };
    case 'RESET_CODE':
      return { ...state, code: action.payload, lastResult: null, consoleOutput: '', isRunning: false, isSubmitting: false };
    default:
      return state;
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const activeSubmission = useRef<AbortController | null>(null);
  const [state, dispatch] = useReducer(workspaceReducer, initialState);
  return (
    <WorkspaceContext.Provider value={{ state, dispatch, activeSubmission }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

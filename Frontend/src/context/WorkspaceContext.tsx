import { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
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
    case 'SET_CODE':
      return { ...state, code: action.payload };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'SET_PROBLEM':
      return { ...state, problemId: action.payload.problemId, code: action.payload.code, lastResult: null, consoleOutput: '' };
    case 'RUN_START':
      return { ...state, isRunning: true, lastResult: null, consoleOutput: 'Running...', activeTab: 'result' };
    case 'RUN_SUCCESS':
      return { ...state, isRunning: false, lastResult: action.payload, consoleOutput: '', activeTab: 'result' };
    case 'RUN_ERROR':
      return { ...state, isRunning: false, consoleOutput: action.payload, activeTab: 'result' };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_FONT_SIZE':
      return { ...state, fontSize: Math.max(10, Math.min(24, action.payload)) };
    case 'TOGGLE_FULLSCREEN':
      return { ...state, isFullscreen: !state.isFullscreen };
    case 'RESET_CODE':
      return { ...state, code: action.payload, lastResult: null, consoleOutput: '' };
    default:
      return state;
  }
}

interface WorkspaceContextType {
  state: WorkspaceState;
  dispatch: React.Dispatch<WorkspaceAction>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

// Export as separate named functions to satisfy Vite HMR fast-refresh rules
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workspaceReducer, initialState);
  return (
    <WorkspaceContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextType {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}

import { createContext, useContext } from 'react';
import type { WorkspaceState, WorkspaceAction } from '../types';
export interface WorkspaceContextType {
  activeSubmission: { current: AbortController | null };
  state: WorkspaceState;
  dispatch: React.Dispatch<WorkspaceAction>;
}

export const WorkspaceContext = createContext<WorkspaceContextType | null>(null);


export function useWorkspace(): WorkspaceContextType {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}

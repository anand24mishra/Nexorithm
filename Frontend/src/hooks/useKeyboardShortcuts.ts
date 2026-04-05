import { useEffect } from 'react';
import { useSubmission } from './useSubmission';

export function useKeyboardShortcuts() {
  const { runCode } = useSubmission();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runCode();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [runCode]);
}

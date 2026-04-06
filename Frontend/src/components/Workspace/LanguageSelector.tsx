import { Language } from '../../types';
import { useWorkspace } from '../../context/WorkspaceContext';

export function LanguageSelector({ onLanguageChange }: { onLanguageChange?: (lang: Language) => void }) {
  const { state, dispatch } = useWorkspace();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value as Language;
    dispatch({ type: 'SET_LANGUAGE', payload: lang });
    onLanguageChange?.(lang);
  };

  return (
    <select
      value={state.language}
      onChange={handleChange}
      style={{
        background: 'var(--bg-tertiary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-md)',
        padding: '4px 8px',
        fontSize: '13px',
        fontFamily: 'var(--font-sans)',
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      <option value={Language.JAVASCRIPT}>JavaScript</option>
      <option value={Language.PYTHON}>Python</option>
    </select>
  );
}

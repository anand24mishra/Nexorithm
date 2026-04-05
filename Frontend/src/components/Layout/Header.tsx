import { Link } from 'react-router-dom';

interface Props {
  problemTitle?: string;
}

export function Header({ problemTitle }: Props) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', height: '48px', minHeight: '48px',
      background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: 'var(--radius-md)',
            background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: '#fff',
          }}>N</div>
          <span style={{
            fontSize: '16px', fontWeight: 700,
            background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Nexorithm</span>
        </Link>

        {problemTitle && (
          <>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>|</span>
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
              {problemTitle}
            </span>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link to="/" className="btn btn-ghost btn-sm">
          ← Problems
        </Link>
      </div>
    </header>
  );
}

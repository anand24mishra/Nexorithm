import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import "../../styles/auth.css";

type Props = {
  title: string;
  lead: string;
  error: string;
  google: ReactNode;
  footer: ReactNode;
  children: ReactNode;
};

export function AuthScreen({ title, lead, error, google, footer, children }: Props) {
  return (
    <div className="auth-root">
      <aside className="auth-brand">
        <Link to="/" className="auth-logo" aria-label="Nexorithm home">
          <span className="auth-logo-mark">N</span>
          <span>Nexorithm</span>
        </Link>
        <div className="auth-brand-copy">
          <h1>Practice algorithms, one problem at a time.</h1>
          <p>
            Write JavaScript or Python in the browser. Submissions are queued,
            judged in a separate worker, and stored with your account.
          </p>
        </div>
        <p className="auth-brand-note">JavaScript · Python · Monaco</p>
      </aside>
      <main className="auth-panel">
        <div className="auth-panel-inner">
          <h2>{title}</h2>
          <p className="auth-lead">{lead}</p>
          {error ? (
            <div className="auth-error" role="alert">
              {error}
            </div>
          ) : null}
          {google}
          <div className="auth-divider">or</div>
          {children}
          <p className="auth-switch">{footer}</p>
        </div>
      </main>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import { AuthScreen } from "../components/Auth/AuthScreen";
import { GoogleSignIn } from "../components/Auth/GoogleSignIn";
import { useAuth } from "../context/authState";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const describedBy = error ? "auth-form-error" : undefined;

  const handleGoogle = async (credential: string) => {
    setError("");
    setLoading(true);
    try {
      await googleLogin(credential);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      login(res.token, res.user.username);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      title="Sign in"
      lead="Use the Google account you authorized for this site, or your email and password."
      error={error}
      google={<GoogleSignIn text="signin_with" disabled={loading} onCredential={handleGoogle} />}
      footer={
        <>
          New here? <Link to="/signup">Create an account</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <label htmlFor="login-email">
            <span>Email</span>
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
          />
        </div>
        <div className="auth-field">
          <label htmlFor="login-password">
            <span>Password</span>
          </label>
          <div className="auth-password">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-pressed={showPassword}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthScreen>
  );
}

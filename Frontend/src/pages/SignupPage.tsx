import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import { AuthScreen } from "../components/Auth/AuthScreen";
import { GoogleSignIn } from "../components/Auth/GoogleSignIn";
import { useAuth } from "../context/authState";

export function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleGoogle = async (credential: string) => {
    setError("");
    setLoading(true);
    try {
      await googleLogin(credential);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.register(username, email, password);
      login(res.token, res.user.username);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      title="Create an account"
      lead="Google creates the account from your verified email. Email sign-up asks for a username."
      error={error}
      google={<GoogleSignIn text="signup_with" disabled={loading} onCredential={handleGoogle} />}
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <label htmlFor="signup-username">
            <span>Username</span>
          </label>
          <input
            id="signup-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="letters, numbers, underscore"
            autoComplete="username"
            minLength={2}
            maxLength={40}
            pattern="[A-Za-z0-9_]{2,40}"
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error ? "signup-username-hint auth-form-error" : "signup-username-hint"
            }
          />
          <p id="signup-username-hint" className="auth-hint">
            Letters, numbers, and underscores, 2–40 characters.
          </p>
        </div>
        <div className="auth-field">
          <label htmlFor="signup-email">
            <span>Email</span>
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "auth-form-error" : undefined}
          />
        </div>
        <div className="auth-field">
          <label htmlFor="signup-password">
            <span>Password</span>
          </label>
          <div className="auth-password">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={
                error ? "signup-password-hint auth-form-error" : "signup-password-hint"
              }
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
          <p id="signup-password-hint" className="auth-hint">
            8–72 characters.
          </p>
        </div>
        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthScreen>
  );
}

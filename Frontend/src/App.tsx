import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
  useNavigationType,
} from "react-router-dom";
import { Component, lazy, Suspense, useLayoutEffect, useRef } from "react";
import type { ReactElement, ReactNode } from "react";
import { getAuthToken } from "./api/authApi";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/authState";
import { isSessionExit, clearSessionExit } from "./lib/sessionHistory";

const HomePage = lazy(() =>
  import("./pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const Dashboard = lazy(() =>
  import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const WorkspacePage = lazy(() =>
  import("./pages/WorkspacePage").then((m) => ({ default: m.WorkspacePage })),
);
const AnalyticsPage = lazy(() =>
  import("./pages/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })),
);
const GlobalSubmissionsPage = lazy(() =>
  import("./pages/GlobalSubmissionsPage").then((m) => ({
    default: m.GlobalSubmissionsPage,
  })),
);
const GlobalAnalyticsPage = lazy(() =>
  import("./pages/GlobalAnalyticsPage").then((m) => ({
    default: m.GlobalAnalyticsPage,
  })),
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const SignupPage = lazy(() =>
  import("./pages/SignupPage").then((m) => ({ default: m.SignupPage })),
);

function RouteFallback() {
  return (
    <div className="min-h-screen bg-background text-on-background font-body p-8 flex items-center justify-center">
      <span className="spinner" />
    </div>
  );
}

class RouteErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="min-h-screen bg-background text-on-background font-body p-8 flex flex-col items-center justify-center gap-4">
          <p>This page failed to load.</p>
          <button
            type="button"
            className="underline"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/** True after the first paint, so the initial URL can still send people to login. */
let historyReady = false;

function ArmHistoryGuard() {
  const location = useLocation();
  useLayoutEffect(() => {
    historyReady = true;
    if (location.pathname === "/") clearSessionExit();
  }, [location.pathname]);
  return null;
}

function ReplaceNavigate({
  to,
  state,
}: {
  to: string;
  state?: { from: string };
}) {
  const navigate = useNavigate();
  const sent = useRef(false);

  useLayoutEffect(() => {
    if (sent.current) return;
    sent.current = true;
    navigate(to, { replace: true, state });
  }, [navigate, state, to]);

  return <RouteFallback />;
}

function RequireAuth({ children }: { children: ReactElement }) {
  const { isAuthenticated, isReady } = useAuth();
  const location = useLocation();
  const navigationType = useNavigationType();
  if (!isReady) {
    return <RouteFallback />;
  }
  // Token is written before React state commits, so a just-finished login
  // still counts as a session and is not bounced off the dashboard.
  const hasSession = isAuthenticated || Boolean(getAuthToken());
  if (!hasSession) {
    const from = `${location.pathname}${location.search}`;
    const toPublic = isSessionExit() || (historyReady && navigationType === "POP");
    if (toPublic) {
      return <ReplaceNavigate key="public" to="/" />;
    }
    return <ReplaceNavigate key="login" to="/login" state={{ from }} />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <RouteErrorBoundary>
          <ArmHistoryGuard />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/problem/:slug"
            element={
              <RequireAuth>
                <WorkspacePage />
              </RequireAuth>
            }
          />
          <Route
            path="/problem/:slug/analytics"
            element={
              <RequireAuth>
                <AnalyticsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/submissions"
            element={
              <RequireAuth>
                <GlobalSubmissionsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/analytics"
            element={
              <RequireAuth>
                <GlobalAnalyticsPage />
              </RequireAuth>
            }
          />
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
      </AuthProvider>
    </Router>
  );
}

export default App;

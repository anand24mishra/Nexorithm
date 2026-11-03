import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Component, lazy, Suspense } from "react";
import type { ReactElement, ReactNode } from "react";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/authState";

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

function RequireAuth({ children }: { children: ReactElement }) {
  const { isAuthenticated, isReady } = useAuth();
  if (!isReady) {
    return (
      <div className="min-h-screen bg-background text-on-background font-body p-8 flex items-center justify-center">
        <span className="spinner" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <RouteErrorBoundary>
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
          <Route path="/problem/:slug" element={<WorkspacePage />} />
          <Route path="/problem/:slug/analytics" element={<AnalyticsPage />} />
          <Route path="/submissions" element={<GlobalSubmissionsPage />} />
          <Route path="/analytics" element={<GlobalAnalyticsPage />} />
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
      </AuthProvider>
    </Router>
  );
}

export default App;

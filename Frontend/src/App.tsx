import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import type { ReactElement } from "react";
import { HomePage } from "./pages/HomePage";
import { Dashboard } from "./pages/Dashboard";
import { WorkspacePage } from "./pages/WorkspacePage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { GlobalSubmissionsPage } from "./pages/GlobalSubmissionsPage";
import { GlobalAnalyticsPage } from "./pages/GlobalAnalyticsPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";

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
      </AuthProvider>
    </Router>
  );
}

export default App;

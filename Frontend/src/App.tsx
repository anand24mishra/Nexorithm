import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { WorkspacePage } from './pages/WorkspacePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { GlobalSubmissionsPage } from './pages/GlobalSubmissionsPage';
import { GlobalAnalyticsPage } from './pages/GlobalAnalyticsPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
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

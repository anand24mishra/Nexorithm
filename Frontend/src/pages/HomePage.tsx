import { ProblemList } from '../components/ProblemList/ProblemList';
import { LandingPage } from './LandingPage';
import { useAuth } from '../context/AuthContext';

export function HomePage() {
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background text-on-background font-body p-8 flex items-center justify-center">
        <span className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <ProblemList />;
}

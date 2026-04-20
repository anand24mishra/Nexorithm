import { useCallback, useEffect, useState } from "react";
import { dashboardApi, type DashboardData } from "../api/dashboard";
import { useAuth } from "../context/AuthContext";

export function useDashboard() {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const next = await dashboardApi.getDashboardData();
      setData(next);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, refresh: load };
}

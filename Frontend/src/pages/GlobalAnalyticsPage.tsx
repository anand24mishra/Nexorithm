import { AppShell } from "../components/Layout/AppShell";
import { AnalyticsReport } from "../components/Analytics/AnalyticsReport";
import { useAnalytics } from "../hooks/useAnalytics";

export function GlobalAnalyticsPage() {
  const { report, loading, error, reload } = useAnalytics();

  return (
    <AppShell title="Analytics">
      <div className="min-w-0 px-4 py-6 sm:px-8">
        <AnalyticsReport
          report={report}
          loading={loading}
          error={error}
          onRetry={() => void reload()}
          heading="Analytics"
          lede="Every figure comes from your saved submissions. Acceptance is accepted runs divided by all runs. This is your record, not a public leaderboard."
        />
      </div>
    </AppShell>
  );
}

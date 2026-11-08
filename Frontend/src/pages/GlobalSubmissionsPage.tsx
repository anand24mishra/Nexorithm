import { AppShell } from "../components/Layout/AppShell";
import { SubmissionHistory } from "../components/SubmissionHistory/SubmissionHistory";

export function GlobalSubmissionsPage() {
  return (
    <AppShell title="Submissions">
      <div className="min-w-0 px-4 py-6 sm:px-8">
        <h1 className="text-2xl font-semibold text-on-surface">Submissions</h1>
        <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
          Runs saved on your account.
        </p>
        <div className="mt-6 min-w-0">
          <SubmissionHistory />
        </div>
      </div>
    </AppShell>
  );
}

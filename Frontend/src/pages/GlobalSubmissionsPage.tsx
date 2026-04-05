import { SubmissionHistory } from '../components/SubmissionHistory/SubmissionHistory';

export function GlobalSubmissionsPage() {
  return (
    <div className="min-h-screen bg-background text-on-background font-body p-8">
      <div className="max-w-[800px] mx-auto bg-surface-container-low rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Global Submissions</h1>
        <SubmissionHistory />
      </div>
    </div>
  );
}

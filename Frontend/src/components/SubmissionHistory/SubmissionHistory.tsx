import { useState } from "react";
import {
  formatRuntimeMs,
  useSubmissionHistory,
  verdictLabel,
  verdictTone,
} from "../../hooks/useSubmissionHistory";
import type { Submission } from "../../types";

interface Props {
  problemId?: string;
  onSelectSubmission?: (code: string) => void;
}

const controlClass =
  "inline-flex min-h-11 items-center justify-center border border-outline-variant bg-surface-container px-3 text-sm text-on-surface hover:bg-surface-container-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container disabled:opacity-40";

function formatDate(value: string | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function toneClass(label: string): string {
  const tone = verdictTone(label);
  if (tone === "accepted") return "text-secondary";
  if (tone === "failure") return "text-error";
  return "text-on-surface-variant";
}

function SubmissionRow({
  submission,
  showProblem,
  onSelectSubmission,
  open,
  onToggleCode,
}: {
  submission: Submission;
  showProblem: boolean;
  onSelectSubmission?: (code: string) => void;
  open: boolean;
  onToggleCode: () => void;
}) {
  const label = verdictLabel(submission);
  const runtime = formatRuntimeMs(submission.executionTimeMs);
  const hasTests =
    typeof submission.passedTestCases === "number" &&
    typeof submission.totalTestCases === "number";
  const hasCode = typeof submission.code === "string";
  const body = (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <span className={`font-mono text-sm ${toneClass(label)}`}>{label}</span>
        <span className="font-mono text-xs text-outline">
          {formatDate(submission.submittedAt)}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-on-surface-variant">
        {showProblem && submission.problemId ? (
          <span className="font-mono text-xs text-outline">
            {submission.problemId}
          </span>
        ) : null}
        {submission.language ? (
          <span className="capitalize">{submission.language}</span>
        ) : null}
        <span className="font-mono">{runtime ?? "—"}</span>
        {hasTests ? (
          <span className="font-mono">
            {submission.passedTestCases}/{submission.totalTestCases} passed
          </span>
        ) : null}
      </div>
      {onSelectSubmission && hasCode ? (
        <span className="mt-2 block text-xs text-on-surface-variant">
          Click to load this code
        </span>
      ) : null}
    </>
  );

  return (
    <div className="min-w-0 border border-outline-variant bg-surface-container px-4 py-3">
      {onSelectSubmission ? (
        <button
          type="button"
          className="w-full min-h-11 bg-transparent text-left"
          onClick={() => {
            if (hasCode) onSelectSubmission(submission.code);
          }}
        >
          {body}
        </button>
      ) : (
        body
      )}
      {!onSelectSubmission && hasCode ? (
        <div className="mt-3">
          <button
            type="button"
            className={controlClass}
            aria-expanded={open}
            onClick={onToggleCode}
          >
            Review code
          </button>
          {open ? (
            <pre className="mt-3 max-w-full overflow-x-auto bg-surface-container-high p-3 font-mono text-xs text-on-surface">
              {submission.code}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function SubmissionHistory({ problemId, onSelectSubmission }: Props) {
  const { submissions, isLoading, error, page, totalPages, setPage, refresh } =
    useSubmissionHistory(problemId);
  const [openId, setOpenId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <p className="min-w-0 text-sm text-on-surface-variant">
        Loading submissions…
      </p>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="min-w-0 border border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface"
      >
        <p>{error}</p>
        <button type="button" className={`${controlClass} mt-3`} onClick={refresh}>
          Retry
        </button>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <p className="min-w-0 py-6 text-sm text-on-surface-variant">
        {problemId
          ? "No submissions for this problem yet."
          : "No submissions yet."}
      </p>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {totalPages > 1 ? (
        <nav aria-label="Submission pages" className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={controlClass}
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span className="font-mono text-sm text-on-surface-variant">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className={controlClass}
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </nav>
      ) : null}
      {submissions.map((submission) => (
        <SubmissionRow
          key={submission.id}
          submission={submission}
          showProblem={!problemId}
          onSelectSubmission={onSelectSubmission}
          open={openId === submission.id}
          onToggleCode={() =>
            setOpenId((current) =>
              current === submission.id ? null : submission.id,
            )
          }
        />
      ))}
    </div>
  );
}

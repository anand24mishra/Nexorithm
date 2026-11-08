import { Link, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/Layout/AppShell";
import { AnalyticsReport } from "../components/Analytics/AnalyticsReport";
import { useAnalytics } from "../hooks/useAnalytics";
import { useProblem } from "../hooks/useProblem";
import {
  useSubmissionHistory,
  verdictLabel,
  verdictTone,
} from "../hooks/useSubmissionHistory";

function formatWhen(value: string | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function languageName(language: string): string {
  if (language === "javascript") return "JavaScript";
  if (language === "python") return "Python";
  return language;
}

function toneClass(label: string): string {
  const tone = verdictTone(label);
  if (tone === "accepted") return "ax-accepted";
  if (tone === "failure") return "ax-failed";
  return "";
}

export function AnalyticsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { problem, loading: problemLoading, error: problemError } = useProblem(slug || "");
  const current = problem && slug && problem.slug === slug ? problem : null;
  const ready = Boolean(current?.id);
  const { report, loading, error, reload } = useAnalytics(current?.id, ready);
  const {
    submissions,
    isLoading: historyLoading,
    error: historyError,
    page,
    totalPages,
    setPage,
  } = useSubmissionHistory(current?.id, ready);

  let body;
  if (!slug) {
    body = (
      <div className="ax">
        <h1>Problem not found</h1>
        <p className="ax-lede">That problem is not in this database.</p>
        <div className="ax-actions">
          <Link className="ax-link" to="/">
            Browse problems
          </Link>
        </div>
      </div>
    );
  } else if (problemLoading || (problem && problem.slug !== slug && !problemError)) {
    body = (
      <div className="ax-status">
        <span className="spinner" />
      </div>
    );
  } else if (problemError || !current) {
    body = (
      <div className="ax" role="alert">
        <h1>Problem not found</h1>
        <p className="ax-lede">{problemError || "That problem is not in this database."}</p>
        <div className="ax-actions">
          <Link className="ax-link" to="/">
            Browse problems
          </Link>
        </div>
      </div>
    );
  } else {
    const difficulty = current.difficulty
      ? current.difficulty.charAt(0).toUpperCase() + current.difficulty.slice(1)
      : "Problem";
    body = (
      <AnalyticsReport
        report={report}
        loading={loading}
        error={error}
        onRetry={() => void reload()}
        heading={current.title}
        lede={`${difficulty}. Rates and runtimes count every submission you have made for this problem, not only the page below.`}
        editorHref={`/problem/${current.slug}`}
        showProblems={false}
        showRecent={false}
      >
        {report == null || report.submissions > 0 ? (
          <section>
            <h2>Your attempts</h2>
            {historyError ? (
              <p className="ax-note" role="alert">
                {historyError}
              </p>
            ) : null}
            <div className="ax-table-wrap">
              <table className="ax-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Verdict</th>
                    <th>Language</th>
                    <th>Runtime</th>
                    <th>Tests</th>
                    <th>Code</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLoading ? (
                    <tr>
                      <td colSpan={6}>Loading attempts…</td>
                    </tr>
                  ) : submissions.length === 0 ? (
                    <tr>
                      <td colSpan={6}>No attempts for this problem yet.</td>
                    </tr>
                  ) : (
                    submissions.map((submission) => {
                      const label = verdictLabel(submission);
                      const hasCode = typeof submission.code === "string";
                      const runtime =
                        typeof submission.executionTimeMs === "number" &&
                        Number.isFinite(submission.executionTimeMs)
                          ? `${submission.executionTimeMs} ms`
                          : "—";
                      return (
                        <tr key={submission.id}>
                          <td>{formatWhen(submission.submittedAt)}</td>
                          <td className={toneClass(label)}>{label}</td>
                          <td>{languageName(submission.language || "") || "—"}</td>
                          <td>{runtime}</td>
                          <td>
                            {typeof submission.passedTestCases === "number" &&
                            typeof submission.totalTestCases === "number" &&
                            submission.totalTestCases > 0
                              ? `${submission.passedTestCases}/${submission.totalTestCases}`
                              : "—"}
                          </td>
                          <td>
                            {hasCode ? (
                              <button
                                type="button"
                                className="ax-retry"
                                onClick={() =>
                                  navigate(`/problem/${current.slug}`, {
                                    state: {
                                      code: submission.code,
                                      ...(typeof submission.language === "string"
                                        ? { language: submission.language }
                                        : {}),
                                    },
                                  })
                                }
                              >
                                Open in editor
                              </button>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 ? (
              <nav aria-label="Attempt pages" className="ax-actions">
                <button
                  type="button"
                  className="ax-retry"
                  disabled={page <= 1 || historyLoading}
                  onClick={() => setPage(Math.max(1, page - 1))}
                >
                  Previous
                </button>
                <span className="ax-note">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className="ax-retry"
                  disabled={page >= totalPages || historyLoading}
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                >
                  Next
                </button>
              </nav>
            ) : null}
          </section>
        ) : null}
      </AnalyticsReport>
    );
  }

  return (
    <AppShell title={current?.title ?? "Analytics"}>
      <div className="min-w-0 px-4 py-6 sm:px-8">{body}</div>
    </AppShell>
  );
}

import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import type { AnalyticsReport as Report } from "../../api/analyticsApi";
import {
  activityLabel,
  buildActivityDays,
} from "../Activity/activityGrid";
import "../../styles/analytics.css";

const VERDICT_COLOR: Record<string, string> = {
  Accepted: "#5edf81",
  "Wrong Answer": "#ffb4ab",
  "Time Limit Exceeded": "#ffa116",
  "Runtime Error": "#ffc3be",
  "Memory Limit Exceeded": "#ffc3be",
  "Compile Error": "#d9c3ad",
  Queued: "#ffc78b",
  Running: "#ffc78b",
};

function verdictColor(label: string): string {
  return VERDICT_COLOR[label] ?? "#a18d7a";
}

function languageName(language: string): string {
  if (language === "javascript") return "JavaScript";
  if (language === "python") return "Python";
  return language;
}

function formatMs(value: number | null): string {
  return value == null ? "—" : `${value} ms`;
}

function formatWhen(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function dayLevel(count: number): string {
  if (count >= 6) return "3";
  if (count >= 3) return "2";
  if (count >= 1) return "1";
  return "0";
}

type Props = {
  report: Report | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  heading: string;
  lede: string;
  editorHref?: string;
  showProblems?: boolean;
  showRecent?: boolean;
  children?: ReactNode;
};

export function AnalyticsReport({
  report,
  loading,
  error,
  onRetry,
  heading,
  lede,
  editorHref,
  showProblems = true,
  showRecent = true,
  children,
}: Props) {
  const location = useLocation();
  const days = buildActivityDays(report?.timestamps ?? [], 35);
  const dayTotal = days.reduce((sum, day) => sum + day.count, 0);

  return (
    <div className="ax">
      <main className="ax-main">
        <div className="ax-wrap">
          <header>
            <h1>{heading}</h1>
            <p className="ax-lede">{lede}</p>
            {editorHref ? (
              <div className="ax-actions">
                <Link className="ax-link" to={editorHref}>
                  Open editor
                </Link>
              </div>
            ) : null}
          </header>

          {loading && !report ? (
            <div className="ax-status">
              <span className="spinner" />
            </div>
          ) : null}

          {error ? (
            <div className="ax-error" role="alert">
              <h2>Analytics did not load</h2>
              <p>{error}</p>
              <div className="ax-actions">
                <button type="button" className="ax-retry" onClick={onRetry}>
                  Try again
                </button>
                {error.startsWith("Sign in") ? (
                  <Link
                    className="ax-link"
                    to="/login"
                    state={{ from: `${location.pathname}${location.search}` }}
                  >
                    Sign in
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}

          {report && report.submissions === 0 ? (
            <div className="ax-empty">
              <h2>No submissions yet</h2>
              <p>
                Submit a solution from a problem. The judge stores the verdict,
                language, and runtime here.
              </p>
              <div className="ax-actions">
                <Link className="ax-link" to="/">
                  Browse problems
                </Link>
              </div>
            </div>
          ) : null}

          {report && report.submissions > 0 ? (
            <>
              <section className="ax-panel" aria-label="Verdicts">
                <div>
                  <h2>Verdicts</h2>
                  <div
                    className="ax-bar"
                    role="img"
                    aria-label={`${report.accepted} accepted of ${report.submissions} submissions`}
                  >
                    {report.verdicts.map((item) => (
                      <span
                        key={item.label}
                        style={{
                          width: `${(item.count / report.submissions) * 100}%`,
                          background: verdictColor(item.label),
                        }}
                        title={`${item.label}: ${item.count}`}
                      />
                    ))}
                  </div>
                  <ul className="ax-legend">
                    {report.verdicts.map((item) => (
                      <li key={item.label}>
                        <span
                          className="ax-swatch"
                          style={{ background: verdictColor(item.label) }}
                        />
                        <span>{item.label}</span>
                        <b>{item.count}</b>
                        <span>
                          {Math.round((item.count / report.submissions) * 100)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <dl className="ax-ledger">
                  <div>
                    <dt>Submissions</dt>
                    <dd>{report.submissions}</dd>
                  </div>
                  <div>
                    <dt>Accepted</dt>
                    <dd>{report.accepted}</dd>
                  </div>
                  <div>
                    <dt>Acceptance</dt>
                    <dd>{report.acceptanceRate}%</dd>
                  </div>
                  <div>
                    <dt>{showProblems ? "Problems solved" : "Best accepted runtime"}</dt>
                    <dd>{showProblems ? report.solved : formatMs(report.fastestMs)}</dd>
                  </div>
                  <div>
                    <dt>Median accepted runtime</dt>
                    <dd>{formatMs(report.medianMs)}</dd>
                  </div>
                  <div>
                    <dt>Slowest accepted runtime</dt>
                    <dd>{formatMs(report.slowestMs)}</dd>
                  </div>
                </dl>
              </section>

              <section className="ax-split">
                <div>
                  <h2>Languages</h2>
                  <ul className="ax-meter">
                    {report.languages.map((item) => (
                      <li key={item.language}>
                        <span>{languageName(item.language)}</span>
                        <span className="track" aria-hidden="true">
                          <span style={{ width: `${(item.count / report.submissions) * 100}%` }} />
                        </span>
                        <b>
                          {item.count}
                          <span className="ax-muted"> · {item.accepted} accepted</span>
                        </b>
                      </li>
                    ))}
                  </ul>
                </div>
                {showProblems ? (
                  <div>
                    <h2>Solved by difficulty</h2>
                    <ul className="ax-meter">
                      {(["easy", "medium", "hard"] as const).map((level) => {
                        const count = report.difficulty[level];
                        const width = report.solved ? (count / report.solved) * 100 : 0;
                        return (
                          <li key={level}>
                            <span style={{ textTransform: "capitalize" }}>{level}</span>
                            <span className="track" aria-hidden="true">
                              <span style={{ width: `${width}%` }} />
                            </span>
                            <b>{count}</b>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <div>
                    <h2>Last 35 days</h2>
                    <div className="ax-days">
                      {days.map((day) => (
                        <span
                          key={day.date}
                          data-level={dayLevel(day.count)}
                          title={activityLabel(day)}
                          role="img"
                          aria-label={activityLabel(day)}
                        />
                      ))}
                    </div>
                    <p className="ax-note">
                      {dayTotal} submission{dayTotal === 1 ? "" : "s"} in this window.
                    </p>
                  </div>
                )}
              </section>

              {showProblems ? (
                <section>
                  <h2>Last 35 days</h2>
                  <div className="ax-days">
                    {days.map((day) => (
                      <span
                        key={day.date}
                        data-level={dayLevel(day.count)}
                        title={activityLabel(day)}
                        role="img"
                        aria-label={activityLabel(day)}
                      />
                    ))}
                  </div>
                  <p className="ax-note">
                    {dayTotal} submission{dayTotal === 1 ? "" : "s"} in this window. Each square is one local day.
                  </p>
                </section>
              ) : null}

              {showProblems && report.problems.length > 0 ? (
                <section>
                  <h2>Problems</h2>
                  <div className="ax-table-wrap">
                    <table className="ax-table">
                      <thead>
                        <tr>
                          <th>Problem</th>
                          <th>Attempts</th>
                          <th>Accepted</th>
                          <th>Best runtime</th>
                          <th>Last verdict</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.problems.map((problem) => (
                          <tr key={problem.problemId}>
                            <td>
                              {problem.slug ? (
                                <Link to={`/problem/${problem.slug}/analytics`}>{problem.title}</Link>
                              ) : (
                                problem.title
                              )}
                            </td>
                            <td>{problem.attempts}</td>
                            <td>{problem.accepted}</td>
                            <td>{formatMs(problem.bestMs)}</td>
                            <td className={problem.lastVerdict === "Accepted" ? "ax-accepted" : "ax-failed"}>
                              {problem.lastVerdict ?? "Pending"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : null}

              {showRecent && report.recent.length > 0 ? (
                <section>
                  <h2>Latest submissions</h2>
                  <div className="ax-table-wrap">
                    <table className="ax-table">
                      <thead>
                        <tr>
                          <th>When</th>
                          {showProblems ? <th>Problem</th> : null}
                          <th>Verdict</th>
                          <th>Language</th>
                          <th>Runtime</th>
                          <th>Tests</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.recent.map((row) => (
                          <tr key={row.id}>
                            <td>{formatWhen(row.submittedAt)}</td>
                            {showProblems ? (
                              <td>
                                {row.slug ? <Link to={`/problem/${row.slug}`}>{row.title}</Link> : row.title}
                              </td>
                            ) : null}
                            <td className={row.verdict === "Accepted" ? "ax-accepted" : "ax-failed"}>
                              {row.verdict ?? row.status}
                            </td>
                            <td>{languageName(row.language)}</td>
                            <td>{row.executionTimeMs > 0 ? `${row.executionTimeMs} ms` : "—"}</td>
                            <td>
                              {row.totalTestCases > 0
                                ? `${row.passedTestCases}/${row.totalTestCases}`
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : null}
            </>
          ) : null}

          {children}
        </div>
      </main>
    </div>
  );
}

import { Link } from "react-router-dom";
import { AppShell } from "../components/Layout/AppShell";
import { StatCard, SubmissionItem, RecommendationCard } from "../components/Dashboard";
import { useDashboard } from "../hooks/useDashboard";
import { useAuth } from "../context/authState";
import {
  activityLabel,
  activityTotal,
  buildActivityWeeks,
  formatActivityDate,
  type ActivityCell,
} from "../components/Activity/activityGrid";

function activityLevelClass(count: number, future: boolean): string {
  if (future) return "bg-surface-container";
  if (count >= 7) return "bg-secondary";
  if (count >= 4) return "bg-secondary/80";
  if (count >= 2) return "bg-secondary/60";
  if (count >= 1) return "bg-secondary/40";
  return "bg-surface-container-high";
}

function cellName(cell: ActivityCell): string {
  if (cell.future) return `${formatActivityDate(cell.date)}: upcoming`;
  return activityLabel(cell);
}

export function Dashboard() {
  const { username } = useAuth();
  const { data, isLoading, error, refresh } = useDashboard();

  const stats = data?.stats;
  const activityWeeks = buildActivityWeeks(data?.activityTimestamps ?? []);
  const activityCount = activityTotal(activityWeeks.flat());
  const recentSubmissions = data?.recentSubmissions ?? [];
  const recommendations = data?.recommendations ?? [];

  return (
    <AppShell title="Dashboard">
      <div className="mx-auto min-w-0 max-w-[1400px] space-y-10 px-4 py-8 lg:px-8">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">Dashboard</h1>
          <p className="mt-3 break-words text-base text-on-surface">
            {username ? <span>{username}. </span> : null}
            {data && stats ? (
              <>
                <span className="font-mono">{stats.solved}</span>
                {" solved of "}
                <span className="font-mono">{stats.totalProblems}</span>
                {" problems."}
              </>
            ) : isLoading ? (
              "Loading solved totals."
            ) : (
              "Solved totals are unavailable."
            )}
          </p>
        </div>

        {isLoading && !data ? (
          <p className="text-sm text-on-surface-variant">Loading dashboard.</p>
        ) : null}

        {error ? (
          <div className="flex min-w-0 flex-col gap-3 border border-outline-variant bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 text-sm text-error">{error}</p>
            <button
              type="button"
              onClick={refresh}
              className="min-h-11 shrink-0 border border-outline-variant px-3 text-sm text-on-surface"
            >
              Retry
            </button>
          </div>
        ) : null}

        {data && stats ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Problems solved" value={stats.solved}>
                <dl className="space-y-2 text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-secondary">Easy</dt>
                    <dd className="font-mono text-on-surface">{stats.easy}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-primary-container">Medium</dt>
                    <dd className="font-mono text-on-surface">{stats.medium}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-error">Hard</dt>
                    <dd className="font-mono text-on-surface">{stats.hard}</dd>
                  </div>
                </dl>
              </StatCard>
              <StatCard
                title="Problems stored"
                value={stats.totalProblems}
                subtitle="Problems in this catalog."
              />
              <StatCard title="Acceptance rate" value={`${stats.acceptance}%`} />
              <StatCard title="Current streak" value={stats.streak} subtitle="Days" />
            </div>

            <section className="min-w-0 border border-outline-variant bg-surface-container-low p-4 sm:p-6">
              <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg text-on-surface">Submission activity</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    <span className="font-mono text-on-surface">{activityCount}</span>
                    {activityCount === 1 ? " submission" : " submissions"} in the last 52 weeks
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                  <span>Less</span>
                  <span className="h-3 w-3 bg-surface-container-high" />
                  <span className="h-3 w-3 bg-secondary/40" />
                  <span className="h-3 w-3 bg-secondary/60" />
                  <span className="h-3 w-3 bg-secondary" />
                  <span>More</span>
                </div>
              </div>
              <div className="min-w-0 overflow-x-auto">
                <div className="flex gap-2 py-2">
                  <div className="flex flex-col gap-1 pt-4 text-[9px] leading-3 text-on-surface-variant">
                    {["", "Mon", "", "Wed", "", "Fri", ""].map((label, index) => (
                      <span key={index} className="h-3">
                        {label}
                      </span>
                    ))}
                  </div>
                  <div>
                    <div className="flex h-4 gap-1">
                      {activityWeeks.map((week, weekIdx) => {
                        const month = new Date(
                          Number(week[0].date.slice(0, 4)),
                          Number(week[0].date.slice(5, 7)) - 1,
                          1,
                        ).toLocaleDateString(undefined, { month: "short" });
                        const previous = activityWeeks[weekIdx - 1];
                        const showMonth =
                          !previous || previous[0].date.slice(0, 7) !== week[0].date.slice(0, 7);
                        return (
                          <span key={week[0].date} className="w-3 text-[9px] leading-3 text-on-surface-variant">
                            {showMonth ? month : ""}
                          </span>
                        );
                      })}
                    </div>
                    <div className="flex gap-1">
                      {activityWeeks.map((week) => (
                        <div key={week[0].date} className="flex flex-col gap-1">
                          {week.map((cell) => {
                            const label = cellName(cell);
                            return (
                              <div
                                key={cell.date}
                                role="img"
                                className={`h-3 w-3 ${activityLevelClass(cell.count, cell.future)}`}
                                title={label}
                                aria-label={label}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <section className="min-w-0 border border-outline-variant bg-surface-container-low p-4 sm:p-6 lg:col-span-2">
                <div className="mb-4 flex min-w-0 flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg text-on-surface">Recent submissions</h2>
                  <Link
                    to="/submissions"
                    className="inline-flex min-h-11 items-center text-sm text-primary-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
                  >
                    View all
                  </Link>
                </div>
                {recentSubmissions.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No recent submissions yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentSubmissions.map((submission) => (
                      <SubmissionItem
                        key={submission.id}
                        title={submission.title}
                        status={submission.status}
                        timestamp={submission.timestamp}
                        language={submission.language}
                        slug={submission.slug}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="min-w-0 border border-outline-variant bg-surface-container-low p-4 sm:p-6">
                <h2 className="mb-4 text-lg text-on-surface">Recommendations</h2>
                {recommendations.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No recommendations yet.</p>
                ) : (
                  <div className="space-y-4">
                    {recommendations.map((problem) => (
                      <RecommendationCard
                        key={problem.id}
                        title={problem.title}
                        difficulty={problem.difficulty}
                        tags={problem.tags}
                        acceptance={problem.acceptance}
                        slug={problem.slug}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

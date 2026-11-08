import { useEffect, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { useProblems } from "../../hooks/useProblems";
import { useSubmissionHistory } from "../../hooks/useSubmissionHistory";
import { useSubmissionActivity } from "../../hooks/useSubmissionActivity";
import { useAuth } from "../../context/authState";
import {
  activityLabel,
  activityTotal,
  buildActivityDays,
} from "../Activity/activityGrid";
import { AppShell } from "../Layout/AppShell";
import { pageWindow } from "./pageWindow";

const TAG_OPTIONS = [
  "Array",
  "Binary Search",
  "Bit Manipulation",
  "Dynamic Programming",
  "Hash Table",
  "Linked List",
  "Math",
  "Matrix",
  "Recursion",
  "Stack",
  "String",
  "Tree",
  "Two Pointers",
];

const PAGE_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 250;

function mergeKnownTags(
  current: string[],
  problems: readonly { tags?: readonly string[] | null }[],
  selectedTag: string,
): string[] {
  const next = new Set(current);
  for (const problem of problems) {
    for (const problemTag of problem.tags ?? []) next.add(problemTag);
  }
  if (selectedTag) next.add(selectedTag);
  const sorted = [...next].sort((a, b) => a.localeCompare(b));
  if (
    sorted.length === current.length &&
    sorted.every((item, index) => item === current[index])
  ) {
    return current;
  }
  return sorted;
}

function showingRange(page: number, limit: number, count: number, total: number): string {
  if (count === 0 || total === 0) return `Showing 0 of ${total} problems`;
  const start = (page - 1) * limit + 1;
  const end = start + count - 1;
  return `Showing ${start}–${end} of ${total} problems`;
}

function difficultyPresentation(value: string): { label: string; className: string } {
  const key = value.toLowerCase();
  if (key === "easy") return { label: "Easy", className: "text-secondary" };
  if (key === "medium") return { label: "Medium", className: "text-primary-container" };
  if (key === "hard") return { label: "Hard", className: "text-error" };
  return { label: value, className: "text-on-surface-variant" };
}

function dayLevelClass(count: number): string {
  if (count >= 6) return "bg-secondary";
  if (count >= 3) return "bg-secondary/60";
  if (count >= 1) return "bg-secondary/30";
  return "bg-surface-container-high";
}

export function ProblemList() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [tag, setTag] = useState("");
  const [knownTags, setKnownTags] = useState(TAG_OPTIONS);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (search === debouncedSearch) return;
    const id = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [search, debouncedSearch]);

  const { problems, total, totalPages, loading, error } = useProblems(
    page,
    difficulty || undefined,
    debouncedSearch || undefined,
    PAGE_LIMIT,
    tag || undefined,
  );
  const {
    submissions: submissionData,
    isLoading: historyLoading,
    error: historyError,
  } = useSubmissionHistory();
  const submissions = Array.isArray(submissionData) ? submissionData : [];
  const { isAuthenticated } = useAuth();
  const activityTimestamps = useSubmissionActivity(isAuthenticated);
  const activityDays = buildActivityDays(activityTimestamps, 35);
  const activityCount = activityTotal(activityDays);
  const [seenProblems, setSeenProblems] = useState<typeof problems | null>(null);
  const [seenTag, setSeenTag] = useState<string | null>(null);
  if (seenProblems !== problems || seenTag !== tag) {
    setSeenProblems(problems);
    setSeenTag(tag);
    setKnownTags((current) => mergeKnownTags(current, problems, tag));
  }

  const solvedIds = new Set(
    submissions.filter((submission) => submission.verdict === "Accepted").map((submission) => submission.problemId),
  );
  const solvedInRecent = solvedIds.size;
  const appliedFilters = Boolean(debouncedSearch || difficulty || tag);
  const filtersActive = appliedFilters || Boolean(search);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const handleDifficultyChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setDifficulty(event.target.value);
    setPage(1);
  };

  const handleTagChange = (value: string) => {
    setTag(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setDifficulty("");
    setTag("");
    setPage(1);
  };

  const solveStatus = (problemId: string) => {
    if (historyLoading || historyError) return "unknown";
    const subs = submissions.filter((submission) => submission.problemId === problemId);
    if (subs.some((submission) => submission.verdict === "Accepted")) return "solved";
    if (subs.length > 0) return "attempted";
    return "unknown";
  };

  const pageNumbers = pageWindow(page, totalPages);

  return (
    <AppShell title="Problems">
      <div className="mx-auto flex min-w-0 max-w-[1400px] flex-col gap-10 px-4 py-8 lg:flex-row lg:px-8">
        <div className="min-w-0 flex-1 space-y-6">
          <div className="grid grid-cols-1 gap-4 bg-surface-container-low p-4 sm:grid-cols-2">
            <div className="min-w-0 sm:col-span-2">
              <label htmlFor="problem-search" className="mb-2 block text-sm text-on-surface">
                Search
              </label>
              <input
                id="problem-search"
                type="text"
                value={search}
                onChange={handleSearchChange}
                className="min-h-11 w-full min-w-0 border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
                placeholder="Title or number"
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="problem-difficulty" className="mb-2 block text-sm text-on-surface">
                Difficulty
              </label>
              <select
                id="problem-difficulty"
                value={difficulty}
                onChange={handleDifficultyChange}
                className="min-h-11 w-full min-w-0 border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
              >
                <option value="">All difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="min-w-0">
              <label htmlFor="problem-tag" className="mb-2 block text-sm text-on-surface">
                Tag
              </label>
              <select
                id="problem-tag"
                value={tag}
                onChange={(event) => handleTagChange(event.target.value)}
                className="min-h-11 w-full min-w-0 border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
              >
                <option value="">All tags</option>
                {knownTags.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            {filtersActive ? (
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="min-h-11 border border-outline-variant px-3 text-sm text-on-surface"
                >
                  Clear filters
                </button>
              </div>
            ) : null}
          </div>

          <div className="min-w-0 bg-surface-container-low">
            {loading ? (
              <p className="px-4 py-16 text-sm text-on-surface-variant">Loading problems.</p>
            ) : error ? (
              <p className="px-4 py-16 text-sm text-error">Failed to load problems.</p>
            ) : problems.length === 0 ? (
              <div className="space-y-4 px-4 py-16">
                <p className="text-sm text-on-surface">
                  {filtersActive
                    ? "No problems match these filters."
                    : "The catalog is empty."}
                </p>
                {filtersActive ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="min-h-11 border border-outline-variant px-3 text-sm text-on-surface"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            ) : (
              <ul className="divide-y divide-outline-variant">
                {problems.map((problem) => {
                  const difficultyStyle = difficultyPresentation(problem.difficulty ?? "");
                  const status = solveStatus(problem.id);
                  const acceptance =
                    problem.acRate > 0 ? problem.acRate.toFixed(1) : "0";
                  const title = `${problem.id}. ${problem.title}`;
                  return (
                    <li key={problem.id} className="min-w-0 px-4 py-4">
                      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                            {status === "solved" ? (
                              <span className="font-mono text-xs text-secondary">Solved</span>
                            ) : status === "attempted" ? (
                              <span className="font-mono text-xs text-primary-container">Attempted</span>
                            ) : null}
                            {problem.slug ? (
                              <Link
                                to={`/problem/${problem.slug}`}
                                className="inline-block min-h-11 min-w-0 break-words py-2 text-sm font-medium text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
                              >
                                {title}
                              </Link>
                            ) : (
                              <span className="inline-block min-w-0 break-words py-2 text-sm font-medium text-on-surface">
                                {title}
                              </span>
                            )}
                          </div>
                          {(problem.tags ?? []).length > 0 ? (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {(problem.tags ?? []).slice(0, 3).map((problemTag) => (
                                <button
                                  key={problemTag}
                                  type="button"
                                  aria-label={`Filter by ${problemTag}`}
                                  aria-pressed={tag === problemTag}
                                  onClick={() => handleTagChange(problemTag)}
                                  className={`min-h-11 px-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container ${tag === problemTag ? "text-primary-container" : "text-on-surface-variant"}`}
                                >
                                  {problemTag}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-4 text-sm">
                          <span className="font-mono text-on-surface-variant">
                            <span className="sr-only">Acceptance </span>
                            {acceptance}%
                          </span>
                          <span className={difficultyStyle.className}>{difficultyStyle.label}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {!loading && !error ? (
              <div className="flex min-w-0 flex-col gap-4 border-t border-outline-variant px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-on-surface-variant">
                  {showingRange(page, PAGE_LIMIT, problems.length, total)}
                </p>
                {totalPages > 1 ? (
                  <nav aria-label="Problem pages" className="flex min-w-0 flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="min-h-11 px-3 text-sm text-on-surface disabled:text-on-surface-variant"
                    >
                      Previous
                    </button>
                    {pageNumbers.map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        aria-current={page === pageNumber ? "page" : undefined}
                        aria-label={`Page ${pageNumber}`}
                        onClick={() => setPage(pageNumber)}
                        className={`min-h-11 min-w-11 font-mono text-sm ${page === pageNumber ? "bg-surface-container-high text-on-surface" : "text-on-surface-variant"}`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                      className="min-h-11 px-3 text-sm text-on-surface disabled:text-on-surface-variant"
                    >
                      Next
                    </button>
                  </nav>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <aside className="w-full min-w-0 space-y-6 lg:w-80">
          <section className="space-y-3 border border-outline-variant bg-surface-container-low p-5">
            <h2 className="text-base text-on-surface">Solved in recent submissions</h2>
            {historyLoading ? (
              <p className="text-sm text-on-surface-variant">Loading recent submissions.</p>
            ) : historyError ? (
              <p className="text-sm text-error">Could not load recent submissions.</p>
            ) : (
              <>
                <p className="font-mono text-3xl text-on-surface">{solvedInRecent}</p>
                <p className="text-sm text-on-surface-variant">
                  Distinct accepted problems in the latest history page. This is not a share of the catalog.
                </p>
              </>
            )}
          </section>

          <section className="space-y-4 border border-outline-variant bg-surface-container-low p-5">
            <h2 className="text-base text-on-surface">Daily activity</h2>
            <div className="flex min-w-0 flex-wrap gap-1">
              {activityDays.map((day) => (
                <div
                  key={day.date}
                  role="img"
                  className={`h-3 w-3 ${dayLevelClass(day.count)}`}
                  title={activityLabel(day)}
                  aria-label={activityLabel(day)}
                />
              ))}
            </div>
            <p className="text-sm text-on-surface-variant">
              <span className="font-mono text-on-surface">{activityCount}</span>
              {activityCount === 1 ? " submission" : " submissions"} in the last 35 days
            </p>
          </section>

          <section className="border border-outline-variant bg-surface-container-low p-5">
            <h2 className="text-base text-on-surface">No paid plan</h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              There is no premium tier, contest, or company-question pack in this app.
            </p>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

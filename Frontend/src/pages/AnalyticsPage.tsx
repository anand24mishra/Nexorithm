import { useParams, Link, useNavigate } from "react-router-dom";
import { useProblem } from "../hooks/useProblem";
import { useSubmissionHistory } from "../hooks/useSubmissionHistory";

const verdictConfig: Record<
  string,
  { icon: string; cls: string; label: string }
> = {
  Accepted: { icon: "check_circle", cls: "text-secondary", label: "Accepted" },
  "Wrong Answer": { icon: "cancel", cls: "text-error", label: "Wrong Answer" },
  "Time Limit Exceeded": {
    icon: "timer_off",
    cls: "text-tertiary-container",
    label: "Time Limit Exceeded",
  },
  "Memory Limit Exceeded": {
    icon: "memory",
    cls: "text-tertiary-container",
    label: "Memory Limit Exceeded",
  },
  "Runtime Error": {
    icon: "bug_report",
    cls: "text-error",
    label: "Runtime Error",
  },
  "Compile Error": {
    icon: "code_off",
    cls: "text-outline-variant",
    label: "Compile Error",
  },
  Queued: { icon: "schedule", cls: "text-primary", label: "Queued" },
  Running: { icon: "progress_activity", cls: "text-primary", label: "Running" },
  "System Error": { icon: "warning", cls: "text-error", label: "System Error" },
};

function getTimeAgo(dateInput: string | Date) {
  const diff = Date.now() - new Date(dateInput).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

export function AnalyticsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { problem, loading } = useProblem(slug || "");
  const {
    submissions,
    isLoading: subLoading,
    page: currentPage,
    totalPages,
    setPage: setCurrentPage,
  } = useSubmissionHistory(problem?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span className="spinner text-primary text-4xl" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-on-surface-variant font-body">
        Problem not found.
      </div>
    );
  }

  const currentSubmissions = Array.isArray(submissions) ? submissions : [];
  const acceptedSubs = currentSubmissions.filter((s) => s.verdict === "Accepted");
  const successRate =
    currentSubmissions.length > 0
      ? Math.round((acceptedSubs.length / currentSubmissions.length) * 100)
      : 0;

  const recentActivity = currentSubmissions.slice(0, 10).reverse();
  const bars: string[] = recentActivity.map((s) => {
    return s.verdict === "Accepted"
      ? "bg-primary-container h-[80%]"
      : "bg-surface-container-highest h-[40%]";
  });

  while (bars.length < 10) {
    bars.unshift("bg-surface-container-highest h-[10%]");
  }

  return (
    <div className="bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container font-body min-h-screen flex flex-col">
      {}
      <nav className="bg-[#1C1B1B] text-[#ffa116] font-['Inter'] font-medium text-sm tracking-tight border-none shadow-none flex justify-between items-center w-full px-4 md:px-6 h-14 max-w-full mx-auto fixed top-0 z-50">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="text-xl font-black text-[#E5E2E1] tracking-tighter hover:text-primary transition-colors"
          >
            Nexorithm
          </Link>
          <div className="hidden md:flex gap-6 items-center">
            <Link
              to="/"
              className="text-[#ffa116] border-b-2 border-[#ffa116] pb-1"
            >
              Problems
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button type="button" disabled title="Notifications are not available" className="p-2 text-[#D9C3AD] rounded opacity-40 cursor-not-allowed">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button type="button" disabled title="Editor settings are available in a problem workspace" className="p-2 text-[#D9C3AD] rounded opacity-40 cursor-not-allowed">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <span
            className="w-8 h-8 rounded-lg ml-2 border border-outline-variant/20 inline-flex items-center justify-center text-xs font-bold text-[#E5E2E1]"
            aria-hidden="true"
          >
            N
          </span>
        </div>
      </nav>

      {}
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] hidden md:flex flex-col py-4 bg-[#1C1B1B] w-64 border-none transition-all duration-150 ease-in-out">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-surface-container-highest rounded flex items-center justify-center">
            <span
              className="material-symbols-outlined text-primary text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              terminal
            </span>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant opacity-70">
              Your submissions
            </p>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2 text-[#D9C3AD] opacity-70 hover:bg-[#2A2A2A] hover:opacity-100 rounded-lg group transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">
              list_alt
            </span>
            <span className="font-['Inter'] text-xs font-semibold uppercase tracking-widest">
              Problem Set
            </span>
          </Link>
          <Link
            to="/submissions"
            className="flex items-center gap-3 px-4 py-2 text-[#D9C3AD] opacity-70 hover:bg-[#2A2A2A] hover:opacity-100 rounded-lg group transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">
              history
            </span>
            <span className="font-['Inter'] text-xs font-semibold uppercase tracking-widest">
              Submissions
            </span>
          </Link>
          <span className="flex items-center gap-3 px-4 py-2 text-[#ffa116] bg-[#2A2A2A] rounded-lg ring-1 ring-[#ffa116]/40">
            <span className="material-symbols-outlined text-[20px]">
              analytics
            </span>
            <span className="font-['Inter'] text-xs font-semibold uppercase tracking-widest">
              This problem
            </span>
          </span>
        </nav>
      </aside>

      {}
      <main className="ml-0 md:ml-64 mt-14 p-4 md:p-6 min-w-0 max-w-full min-h-[calc(100vh-3.5rem)] flex flex-col gap-6">
        {}
        <div className="grid grid-cols-12 gap-4">
          {}
          <div className="col-span-12 lg:col-span-8 bg-surface-container-low p-6 rounded-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-label-sm uppercase tracking-widest text-on-surface-variant font-semibold text-[10px]">
                  Problem {problem.id}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-on-primary text-primary rounded-full uppercase">
                  {problem.difficulty}
                </span>
              </div>
              <h1 className="text-2xl font-black text-on-surface tracking-tight mb-2">
                {problem.title}
              </h1>
              <p className="text-on-surface-variant text-sm max-w-2xl">
                Submission history and performance analytics for your solution
                attempts.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => navigate(`/problem/${problem.slug}`)}
                className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:opacity-90 transition-all"
              >
                <span className="material-symbols-outlined text-sm">code</span>
                Return to Editor
              </button>
              <button className="border border-outline-variant/20 hover:bg-surface-container-high px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider text-on-surface-variant transition-all">
                Details
              </button>
            </div>
          </div>

          {}
          <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-4">
            <div className="bg-surface-container-low p-4 rounded-lg flex flex-col justify-center items-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                Total Attempts
              </span>
              <span className="text-3xl font-black text-on-surface font-mono">
                {currentSubmissions.length}
              </span>
            </div>
            <div className="bg-surface-container-low p-4 rounded-lg flex flex-col justify-center items-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                Success Rate
              </span>
              <span className="text-3xl font-black text-secondary font-mono">
                {successRate}%
              </span>
            </div>
            <div className="col-span-2 bg-surface-container-low p-4 rounded-lg flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4">
                Recent Activity (Last 10 Tries)
              </span>
              <div className="flex items-end justify-between h-16 gap-1 px-2">
                {bars.map((barCls, index) => (
                  <div
                    key={index}
                    className={`flex-1 rounded-t-sm ${barCls}`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="bg-surface-container-low rounded-lg overflow-hidden min-w-0 max-w-full flex flex-col flex-1">
          <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-widest text-on-surface-variant">
              Submission Records
            </h3>
            <div className="flex gap-2">
              <button className="p-1.5 hover:bg-surface-container-high rounded text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-lg">
                  filter_list
                </span>
              </button>
              <button className="p-1.5 hover:bg-surface-container-high rounded text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-lg">
                  download
                </span>
              </button>
            </div>
          </div>

          {}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-surface-container/50">
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Verdict
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Language
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Runtime
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Memory
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Date
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {subLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-on-surface-variant"
                    >
                      <span className="spinner"></span>
                    </td>
                  </tr>
                ) : currentSubmissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-on-surface-variant"
                    >
                      No submissions for this problem yet.
                    </td>
                  </tr>
                ) : (
                  currentSubmissions.map((sub) => {
                    const displayVerdict =
                      sub.verdict ||
                      (sub.status === "running" ? "Running" : "Queued");
                    const vd =
                      verdictConfig[displayVerdict] ||
                      verdictConfig["System Error"];
                    return (
                      <tr
                        key={sub.id}
                        className="hover:bg-surface-container-high transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`material-symbols-outlined ${vd.cls} text-base`}
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              {vd.icon}
                            </span>
                            <span
                              className={`font-mono text-sm ${vd.cls} font-bold`}
                            >
                              {vd.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-on-surface capitalize">
                          {sub.language}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-on-surface-variant">
                          {sub.executionTimeMs > 0
                            ? `${sub.executionTimeMs} ms`
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-on-surface-variant">
                          N/A
                        </td>
                        <td className="px-6 py-4 text-sm text-on-surface-variant">
                          {getTimeAgo(sub.submittedAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() =>
                              navigate(`/problem/${problem.slug}`, {
                                state: { code: sub.code },
                              })
                            }
                            className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline transition-all"
                          >
                            View Code
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {}
          <div className="mt-auto px-6 py-4 border-t border-outline-variant/10 flex items-center justify-between">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
              Showing {currentSubmissions.length} submissions · page{" "}
              {currentPage} of {Math.max(1, totalPages)}
            </span>
            {totalPages > 1 && (
              <div className="flex gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container-high text-on-surface-variant disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">
                    chevron_left
                  </span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pg) => (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                        currentPage === pg
                          ? "bg-surface-container-high text-primary font-bold"
                          : "hover:bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {pg}
                    </button>
                  ),
                )}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container-high text-on-surface-variant disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">
                    chevron_right
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

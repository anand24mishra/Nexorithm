import { useState } from "react";
import { Flame, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  TopBar,
  StatCard,
  SubmissionItem,
  RecommendationCard,
} from "../components/Dashboard";
import { useDashboard } from "../hooks/useDashboard";
import { useAuth } from "../context/AuthContext";

export function Dashboard() {
  const navigate = useNavigate();
  const { username } = useAuth();
  const { data, isLoading, error, refresh } = useDashboard();
  const [activeNav, setActiveNav] = useState("dashboard");

  const stats = data?.stats;
  const activityData = data?.activityData || [];
  const recentSubmissions = data?.recentSubmissions || [];
  const recommendations = data?.recommendations || [];

  const onNavChange = (id: string) => {
    setActiveNav(id);
    if (id === "dashboard") navigate("/dashboard");
    if (id === "problems") navigate("/");
    if (id === "profile") navigate("/submissions");
  };

  return (
    <div className="min-h-screen bg-background text-[#E5E2E1] font-body">
      <TopBar />
      <Sidebar activeNav={activeNav} onNavChange={onNavChange} />

      <main className="pt-14 min-h-screen lg:ml-64">
        <div className="max-w-[1400px] mx-auto p-8 space-y-8">
          {/* Welcome Section */}
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Welcome back, {username || "Coder"}
            </h1>
            <p className="text-[#D9C3AD] opacity-70">
              Your cognitive flow is peaking. Ready to tackle today's
              algorithmic challenges?
            </p>
          </div>

          {isLoading && (
            <div className="rounded-xl border border-[#2A2A2A] bg-[#1C1B1B] p-5 text-sm text-[#D9C3AD]">
              Loading dashboard insights...
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-700/40 bg-red-900/20 p-5 text-sm text-red-200 flex items-center justify-between gap-4">
              <span>{error}</span>
              <button
                onClick={refresh}
                className="rounded-md bg-[#ffa116] px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90"
              >
                Retry
              </button>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Problems Solved */}
            <StatCard title="Problems Solved" value={stats?.solved ?? 0}>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-400">Easy</span>
                  <span className="font-semibold">{stats?.easy ?? 0}</span>
                </div>
                <div className="h-1 bg-[#2A2A2A] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{
                      width: `${stats?.solved ? (stats.easy / stats.solved) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-orange-400">Medium</span>
                  <span className="font-semibold">{stats?.medium ?? 0}</span>
                </div>
                <div className="h-1 bg-[#2A2A2A] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500"
                    style={{
                      width: `${stats?.solved ? (stats.medium / stats.solved) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-400">Hard</span>
                  <span className="font-semibold">{stats?.hard ?? 0}</span>
                </div>
                <div className="h-1 bg-[#2A2A2A] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{
                      width: `${stats?.solved ? (stats.hard / stats.solved) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </StatCard>

            {/* Global Rank */}
            <div className="bg-[#1C1B1B] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#ffa116]/40 transition-all flex flex-col items-center justify-center text-center">
              <span className="text-sm font-semibold text-[#D9C3AD] opacity-70 uppercase tracking-wider mb-4">
                Global Rank
              </span>
              <div className="text-5xl font-bold text-[#ffa116] mb-2">
                #{stats?.globalRank ?? 0}
              </div>
              <div className="flex items-center gap-1 text-emerald-400 text-sm">
                <TrendingUp size={16} />
                <span>Top {stats?.percentile ?? 0}% Worldwide</span>
              </div>
            </div>

            {/* Acceptance Rate */}
            <StatCard
              title="Acceptance Rate"
              value={`${stats?.acceptance ?? 0}%`}
            >
              <div className="relative h-24 flex items-center justify-center">
                <svg className="w-20 h-20" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-[#2A2A2A]"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={`${((stats?.acceptance ?? 0) / 100) * 282.7} 282.7`}
                    strokeLinecap="round"
                    className="text-[#ffa116] transform -rotate-90"
                    style={{ transformOrigin: "50% 50%" }}
                  />
                </svg>
              </div>
            </StatCard>

            {/* Current Streak */}
            <div className="bg-[#1C1B1B] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#ffa116]/40 transition-all flex flex-col items-center justify-center text-center">
              <Flame className="w-8 h-8 text-[#ffa116] mb-3" />
              <span className="text-sm font-semibold text-[#D9C3AD] opacity-70 uppercase tracking-wider mb-4">
                Current Streak
              </span>
              <div className="text-5xl font-bold text-[#ffa116]">
                {stats?.streak ?? 0}
              </div>
              <div className="text-xs text-[#D9C3AD] opacity-60 mt-2">Days</div>
            </div>
          </div>

          {/* Activity Heatmap Section */}
          <div className="bg-[#1C1B1B] border border-[#2A2A2A] rounded-xl p-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold">Submission Activity</h2>
              <p className="text-sm text-[#D9C3AD] opacity-60">Last 52 weeks</p>
            </div>
            <div className="overflow-x-auto">
              <div className="flex gap-1 py-4">
                {activityData.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-1">
                    {week.map((active, dayIdx) => (
                      <div
                        key={dayIdx}
                        className={`w-3 h-3 rounded-sm transition-all hover:scale-150 cursor-pointer ${
                          active === 4
                            ? "bg-[#ffa116]"
                            : active === 3
                              ? "bg-[#ffa116]/90"
                              : active === 2
                                ? "bg-[#ffa116]/70"
                                : active === 1
                                  ? "bg-[#ffa116]/40"
                                  : "bg-[#2A2A2A] hover:opacity-90"
                        }`}
                        title={
                          active > 0
                            ? `${active} submissions`
                            : "No submissions"
                        }
                      ></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Submissions */}
            <div className="col-span-2 bg-[#1C1B1B] border border-[#2A2A2A] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Recent Submissions</h2>
                <a
                  href="#"
                  className="text-[#ffa116] hover:opacity-90 text-sm font-semibold uppercase tracking-wider"
                >
                  View All
                </a>
              </div>
              <div className="space-y-3">
                {recentSubmissions.map((submission) => (
                  <SubmissionItem
                    key={submission.id}
                    title={submission.title}
                    status={submission.status}
                    timestamp={submission.timestamp}
                    language={submission.language}
                  />
                ))}
              </div>
            </div>

            {/* Curated for You */}
            <div className="bg-[#1C1B1B] border border-[#2A2A2A] rounded-xl p-6">
              <h2 className="text-lg font-bold mb-6">Curated for You</h2>
              <div className="space-y-4">
                {recommendations.map((problem) => (
                  <RecommendationCard
                    key={problem.id}
                    title={problem.title}
                    difficulty={problem.difficulty}
                    tags={problem.tags}
                    acceptance={problem.acceptance}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

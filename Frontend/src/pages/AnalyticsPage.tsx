import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProblem } from '../hooks/useProblem';
import { useSubmissionHistory } from '../hooks/useSubmissionHistory';

const verdictConfig: Record<string, { icon: string; cls: string; label: string }> = {
  Accepted: { icon: 'check_circle', cls: 'text-secondary', label: 'Accepted' },
  'Wrong Answer': { icon: 'cancel', cls: 'text-error', label: 'Wrong Answer' },
  'Time Limit Exceeded': { icon: 'timer_off', cls: 'text-tertiary-container', label: 'Time Limit Exceeded' },
  'Memory Limit Exceeded': { icon: 'memory', cls: 'text-tertiary-container', label: 'Memory Limit Exceeded' },
  'Runtime Error': { icon: 'bug_report', cls: 'text-error', label: 'Runtime Error' },
  'Compile Error': { icon: 'code_off', cls: 'text-outline-variant', label: 'Compile Error' },
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
  const { problem, loading } = useProblem(slug || '');
  const { submissions, isLoading: subLoading } = useSubmissionHistory(problem?.id);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 5;

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

  const acceptedSubs = submissions.filter(s => s.verdict === 'Accepted');
  const successRate = submissions.length > 0 ? Math.round((acceptedSubs.length / submissions.length) * 100) : 0;
  
  // For bar chart representation (simulated based on recent tries)
  const recentActivity = submissions.slice(0, 10).reverse();
  const bars: string[] = recentActivity.map(s => {
    return s.verdict === 'Accepted' ? 'bg-primary-container h-[80%]' : 'bg-surface-container-highest h-[40%]';
  });
  // fill the rest with blank if < 10
  while (bars.length < 10) {
    bars.unshift('bg-surface-container-highest h-[10%]');
  }

  const totalPages = Math.ceil(submissions.length / limit) || 1;
  const currentSubmissions = submissions.slice((currentPage - 1) * limit, currentPage * limit);

  return (
    <div className="bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container font-body min-h-screen flex flex-col">
      {/* TopNavBar */}
      <nav className="bg-[#1C1B1B] text-[#ffa116] font-['Inter'] font-medium text-sm tracking-tight border-none shadow-none flex justify-between items-center w-full px-6 h-14 max-w-full mx-auto fixed top-0 z-50">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-black text-[#E5E2E1] tracking-tighter hover:text-primary transition-colors">Nexorithm</Link>
          <div className="hidden md:flex gap-6 items-center">
            <Link to="/" className="text-[#ffa116] border-b-2 border-[#ffa116] pb-1">Problems</Link>
            <a className="text-[#D9C3AD] hover:text-[#E5E2E1] transition-colors duration-200" href="#">Contest</a>
            <a className="text-[#D9C3AD] hover:text-[#E5E2E1] transition-colors duration-200" href="#">Discuss</a>
            <a className="text-[#D9C3AD] hover:text-[#E5E2E1] transition-colors duration-200" href="#">Interview</a>
            <a className="text-[#D9C3AD] hover:text-[#E5E2E1] transition-colors duration-200" href="#">Store</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-[#D9C3AD] hover:bg-[#2A2A2A] rounded transition-colors duration-200">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 text-[#D9C3AD] hover:bg-[#2A2A2A] rounded transition-colors duration-200">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <img alt="User profile avatar" className="w-8 h-8 rounded-lg object-cover ml-2 border border-outline-variant/20" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCm-GKBDslNP20R-vXzuv_m5l5vHyFQ-7slVKVxreFKq4-G5pY9FWy_UJiApqW8YkReXDf0FrBE6tLPFExIk2eLtMGdp5J27yHPhsBfDdhE1nzLtIzlLr23osLKuuxmFwuRE4hcuvTl-q_UwFmh59q-QIpqjztRG9glqIwfntUCxgrLdyF4a304-8qGq-5_jSUfDQV21vcp-sGNdViY-V9Ozy0VkEFAtMh_bmLUk1891KL13bKzivJU5mCuZMrqGI_O07UOZ2CDW5Qv"/>
        </div>
      </nav>

      {/* SideNavBar */}
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] flex flex-col py-4 bg-[#1C1B1B] w-64 border-none transition-all duration-150 ease-in-out">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-surface-container-highest rounded flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant opacity-70">Logic Engine</p>
            <p className="text-[10px] font-mono text-primary opacity-60">v2.4.0</p>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-4 py-2 text-[#D9C3AD] opacity-70 hover:bg-[#2A2A2A] hover:opacity-100 rounded-lg group transition-all">
            <span className="material-symbols-outlined text-[20px]">list_alt</span>
            <span className="font-['Inter'] text-xs font-semibold uppercase tracking-widest">Problem Set</span>
          </Link>
          <a className="flex items-center gap-3 px-4 py-2 text-[#ffa116] bg-[#2A2A2A] rounded-r-lg border-l-4 border-[#ffa116] group transition-all" href="#">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
            <span className="font-['Inter'] text-xs font-semibold uppercase tracking-widest">Submissions</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-2 text-[#D9C3AD] opacity-70 hover:bg-[#2A2A2A] hover:opacity-100 rounded-lg group transition-all" href="#">
            <span className="material-symbols-outlined text-[20px]">analytics</span>
            <span className="font-['Inter'] text-xs font-semibold uppercase tracking-widest">Analytics</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-2 text-[#D9C3AD] opacity-70 hover:bg-[#2A2A2A] hover:opacity-100 rounded-lg group transition-all" href="#">
            <span className="material-symbols-outlined text-[20px]">star</span>
            <span className="font-['Inter'] text-xs font-semibold uppercase tracking-widest">Favorites</span>
          </a>
        </nav>
        <div className="px-3 mt-auto space-y-1">
          <a className="flex items-center gap-3 px-4 py-2 text-[#D9C3AD] opacity-70 hover:bg-[#2A2A2A] hover:opacity-100 rounded-lg group transition-all" href="#">
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
            <span className="font-['Inter'] text-xs font-semibold uppercase tracking-widest">Support</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-2 text-[#D9C3AD] opacity-70 hover:bg-[#2A2A2A] hover:opacity-100 rounded-lg group transition-all" href="#">
            <span className="material-symbols-outlined text-[20px]">description</span>
            <span className="font-['Inter'] text-xs font-semibold uppercase tracking-widest">Documentation</span>
          </a>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="ml-64 mt-14 p-6 min-h-[calc(100vh-3.5rem)] flex flex-col gap-6">
        {/* Header & Summary Section (Bento Style) */}
        <div className="grid grid-cols-12 gap-4">
          {/* Problem Title Header */}
          <div className="col-span-12 lg:col-span-8 bg-surface-container-low p-6 rounded-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-label-sm uppercase tracking-widest text-on-surface-variant font-semibold text-[10px]">Problem {problem.id}</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-on-primary text-primary rounded-full uppercase">{problem.difficulty}</span>
              </div>
              <h1 className="text-2xl font-black text-on-surface tracking-tight mb-2">{problem.title}</h1>
              <p className="text-on-surface-variant text-sm max-w-2xl">Submission history and performance analytics for your solution attempts.</p>
            </div>
            <div className="mt-6 flex gap-4">
              <button onClick={() => navigate(`/problem/${problem.slug}`)} className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:opacity-90 transition-all">
                <span className="material-symbols-outlined text-sm">code</span>
                Return to Editor
              </button>
              <button className="border border-outline-variant/20 hover:bg-surface-container-high px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider text-on-surface-variant transition-all">
                Details
              </button>
            </div>
          </div>
          
          {/* Stats Summary */}
          <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-4">
            <div className="bg-surface-container-low p-4 rounded-lg flex flex-col justify-center items-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Total Attempts</span>
              <span className="text-3xl font-black text-on-surface font-mono">{submissions.length}</span>
            </div>
            <div className="bg-surface-container-low p-4 rounded-lg flex flex-col justify-center items-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Success Rate</span>
              <span className="text-3xl font-black text-secondary font-mono">{successRate}%</span>
            </div>
            <div className="col-span-2 bg-surface-container-low p-4 rounded-lg flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4">Recent Activity (Last 10 Tries)</span>
              <div className="flex items-end justify-between h-16 gap-1 px-2">
                {bars.map((barCls, index) => (
                  <div key={index} className={`flex-1 rounded-t-sm ${barCls}`}></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submissions Table Area */}
        <div className="bg-surface-container-low rounded-lg overflow-hidden flex flex-col flex-1">
          <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-widest text-on-surface-variant">Submission Records</h3>
            <div className="flex gap-2">
              <button className="p-1.5 hover:bg-surface-container-high rounded text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-lg">filter_list</span>
              </button>
              <button className="p-1.5 hover:bg-surface-container-high rounded text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-lg">download</span>
              </button>
            </div>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-surface-container/50">
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Verdict</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Language</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Runtime</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Memory</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Date</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {subLoading ? (
                  <tr><td colSpan={6} className="py-10 text-center text-on-surface-variant"><span className="spinner"></span></td></tr>
                ) : currentSubmissions.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-on-surface-variant">No submissions for this problem yet.</td></tr>
                ) : (
                  currentSubmissions.map((sub) => {
                    const vd = verdictConfig[sub.verdict] || verdictConfig['Compile Error'];
                    return (
                      <tr key={sub.id} className="hover:bg-surface-container-high transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`material-symbols-outlined ${vd.cls} text-base`} style={{ fontVariationSettings: "'FILL' 1" }}>
                              {vd.icon}
                            </span>
                            <span className={`font-mono text-sm ${vd.cls} font-bold`}>{vd.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-on-surface capitalize">{sub.language}</td>
                        <td className="px-6 py-4 text-sm font-mono text-on-surface-variant">{sub.executionTimeMs > 0 ? `${sub.executionTimeMs} ms` : 'N/A'}</td>
                        <td className="px-6 py-4 text-sm font-mono text-on-surface-variant">12.4 MB</td>
                        <td className="px-6 py-4 text-sm text-on-surface-variant">{getTimeAgo(sub.submittedAt)}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => navigate(`/problem/${problem.slug}`, { state: { code: sub.code }})} className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline transition-all">
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
          
          {/* Table Footer / Pagination */}
          <div className="mt-auto px-6 py-4 border-t border-outline-variant/10 flex items-center justify-between">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
              Showing {currentSubmissions.length} of {submissions.length} submissions
            </span>
            {totalPages > 1 && (
              <div className="flex gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container-high text-on-surface-variant disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                      currentPage === pg ? 'bg-surface-container-high text-primary font-bold' : 'hover:bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container-high text-on-surface-variant disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

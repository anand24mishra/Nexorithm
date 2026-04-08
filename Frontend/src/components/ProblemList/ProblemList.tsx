import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProblems } from '../../hooks/useProblems';
import { useSubmissionHistory } from '../../hooks/useSubmissionHistory';
import { useAuth } from '../../context/AuthContext';

const diffConfig: Record<string, { cls: string; label: string; iconBg: string }> = {
  easy:   { cls: 'bg-on-secondary text-secondary', label: 'Easy', iconBg: 'bg-secondary' },
  medium: { cls: 'bg-on-primary text-primary', label: 'Medium', iconBg: 'bg-primary' },
  hard:   { cls: 'bg-on-tertiary text-tertiary', label: 'Hard', iconBg: 'bg-tertiary' },
};

export function ProblemList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [tag, setTag] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { problems, total, totalPages, loading, error } = useProblems(page, difficulty || undefined, search || undefined, limit);
  const { submissions } = useSubmissionHistory();
  const { isAuthenticated, username, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);


  const solvedIds = new Set(submissions.filter(s => s.verdict === 'Accepted').map(s => s.problemId));
  const totalSolved = solvedIds.size;
  
  
  const percentSolved = total > 0 ? (totalSolved / total) * 100 : 0;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDifficulty(e.target.value);
    setPage(1);
  };

  const solveStatus = (problemId: string) => {
    const subs = submissions.filter(s => s.problemId === problemId);
    if (subs.some(s => s.verdict === 'Accepted')) return 'solved';
    if (subs.length > 0) return 'attempted';
    return 'unsolved';
  };

  
  const heatmapData = Array.from({ length: 35 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (34 - i));
    const dtString = d.toISOString().split('T')[0];
    
    
    const dtSubmissions = submissions.filter(s => {
      if (!s.submittedAt) return false;
      const t = new Date(s.submittedAt);
      return !isNaN(t.getTime()) && t.toISOString().split('T')[0] === dtString;
    });

    const count = dtSubmissions.length;
    let opacityClass = 'bg-secondary/10';
    if (count > 0 && count <= 2) opacityClass = 'bg-secondary/30';
    if (count > 2 && count <= 5) opacityClass = 'bg-secondary/60';
    if (count > 5) opacityClass = 'bg-secondary/90';

    return { date: dtString, count, opacityClass };
  });

  return (
    <div className="min-h-screen bg-background text-on-background font-body selection:bg-primary-container selection:text-on-primary-container flex flex-col">
      {}
      <header className="bg-[#1C1B1B] border-none fixed top-0 w-full z-50">
        <div className="flex justify-between items-center w-full px-6 h-14 max-w-full mx-auto">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-black text-[#E5E2E1] tracking-tighter hover:text-primary transition-colors">Nexorithm</Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="font-['Inter'] font-medium text-sm tracking-tight text-[#ffa116] border-b-2 border-[#ffa116] pb-1">Problems</Link>
              <a className="font-['Inter'] font-medium text-sm tracking-tight text-[#D9C3AD] hover:text-[#E5E2E1] transition-colors duration-200" href="#">Contest</a>
              <a className="font-['Inter'] font-medium text-sm tracking-tight text-[#D9C3AD] hover:text-[#E5E2E1] transition-colors duration-200" href="#">Discuss</a>
              <a className="font-['Inter'] font-medium text-sm tracking-tight text-[#D9C3AD] hover:text-[#E5E2E1] transition-colors duration-200" href="#">Interview</a>
              <a className="font-['Inter'] font-medium text-sm tracking-tight text-[#D9C3AD] hover:text-[#E5E2E1] transition-colors duration-200" href="#">Store</a>
            </nav>
          </div>
          <div className="flex items-center gap-4 relative">
            <button className="text-[#D9C3AD] hover:bg-[#2A2A2A] p-2 rounded-lg transition-colors duration-200">
              <span className="material-symbols-outlined icon-settings">notifications</span>
            </button>
            <button className="text-[#D9C3AD] hover:bg-[#2A2A2A] p-2 rounded-lg transition-colors duration-200">
              <span className="material-symbols-outlined icon-settings">settings</span>
            </button>
            {isAuthenticated ? (
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="h-8 w-8 rounded-full bg-primary-container overflow-hidden border border-outline-variant/20 ml-2 flex items-center justify-center text-on-primary-container font-bold shadow-sm"
                >
                  {username?.[0]?.toUpperCase() || 'U'}
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface-container-high rounded-xl border border-outline-variant/20 shadow-xl py-1 z-50">
                    <div className="px-4 py-2 border-b border-outline-variant/10">
                      <p className="text-sm font-bold text-on-surface truncate">{username}</p>
                    </div>
                    <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-error hover:bg-surface-container-highest transition-colors flex items-center gap-2">
                       <span className="material-symbols-outlined text-[16px]">logout</span>
                       Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2 ml-2">
                <Link to="/login" className="px-4 py-1.5 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors">Sign In</Link>
                <Link to="/signup" className="px-4 py-1.5 text-sm font-bold text-on-primary-container bg-primary-container rounded-lg hover:bg-primary-fixed-dim transition-colors">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {}
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-64 bg-[#1C1B1B] flex-col py-4 hidden lg:flex border-none">
        <div className="flex-1 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-6 py-3 font-['Inter'] text-xs font-semibold uppercase tracking-widest text-[#ffa116] bg-[#2A2A2A] rounded-r-lg border-l-4 border-[#ffa116] transition-all duration-150 ease-in-out">
            <span className="material-symbols-outlined">list_alt</span>
            Problem Set
          </Link>
          <Link to="/submissions" className="flex items-center gap-3 px-6 py-3 font-['Inter'] text-xs font-semibold uppercase tracking-widest text-[#D9C3AD] opacity-70 hover:bg-[#2A2A2A] hover:opacity-100 transition-all duration-150 ease-in-out">
            <span className="material-symbols-outlined">history</span>
            Submissions
          </Link>
          <Link to="/analytics" className="flex items-center gap-3 px-6 py-3 font-['Inter'] text-xs font-semibold uppercase tracking-widest text-[#D9C3AD] opacity-70 hover:bg-[#2A2A2A] hover:opacity-100 transition-all duration-150 ease-in-out">
            <span className="material-symbols-outlined">analytics</span>
            Analytics
          </Link>
          <a className="flex items-center gap-3 px-6 py-3 font-['Inter'] text-xs font-semibold uppercase tracking-widest text-[#D9C3AD] opacity-70 hover:bg-[#2A2A2A] hover:opacity-100 transition-all duration-150 ease-in-out" href="#">
            <span className="material-symbols-outlined">star</span>
            Favorites
          </a>
        </div>
        <div className="border-t border-outline-variant/10 pt-4 space-y-1">
          <a className="flex items-center gap-3 px-6 py-3 font-['Inter'] text-xs font-semibold uppercase tracking-widest text-[#D9C3AD] opacity-70 hover:bg-[#2A2A2A] hover:opacity-100 transition-all duration-150 ease-in-out" href="#">
            <span className="material-symbols-outlined">help_outline</span>
            Support
          </a>
          <a className="flex items-center gap-3 px-6 py-3 font-['Inter'] text-xs font-semibold uppercase tracking-widest text-[#D9C3AD] opacity-70 hover:bg-[#2A2A2A] hover:opacity-100 transition-all duration-150 ease-in-out" href="#">
            <span className="material-symbols-outlined">description</span>
            Documentation
          </a>
        </div>
      </aside>

      {}
      <main className="lg:ml-64 pt-14 min-h-screen">
        <div className="max-w-[1400px] mx-auto p-8 flex flex-col xl:flex-row gap-8">
          
          {}
          <div className="flex-1 space-y-6 flex flex-col min-h-0">
            {}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-surface-container-low p-4 rounded-lg flex-shrink-0">
              <div className="md:col-span-2 relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">search</span>
                <input 
                  type="text" 
                  value={search}
                  onChange={handleSearchChange}
                  className="w-full bg-surface-container-lowest border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/50 outline-none text-on-surface" 
                  placeholder="Search problems..."
                />
              </div>
              <div className="relative">
                <select 
                  value={difficulty}
                  onChange={handleDifficultyChange}
                  className="w-full bg-surface-container-lowest border-none rounded-lg py-2 pl-4 pr-10 text-sm focus:ring-1 focus:ring-primary appearance-none text-on-surface-variant outline-none"
                >
                  <option value="">Difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-sm">expand_more</span>
              </div>
              <div className="relative">
                <select 
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full bg-surface-container-lowest border-none rounded-lg py-2 pl-4 pr-10 text-sm focus:ring-1 focus:ring-primary appearance-none text-on-surface-variant outline-none"
                >
                  <option value="">Tags</option>
                  <option value="Array">Array</option>
                  <option value="String">String</option>
                  <option value="Hash Table">Hash Table</option>
                  <option value="Dynamic Programming">Dynamic Programming</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-sm">expand_more</span>
              </div>
            </div>

            {}
            <div className="bg-surface-container-low rounded-lg overflow-hidden flex flex-col flex-1">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-surface-container-high/50 border-b border-outline-variant/10">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-16">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Title</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-24">Acceptance</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-24">Difficulty</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/5">
                    {loading ? (
                      <tr><td colSpan={5} className="py-20 text-center"><span className="spinner text-primary text-2xl"></span></td></tr>
                    ) : error ? (
                      <tr><td colSpan={5} className="py-20 text-center text-error">Failed to load problems.</td></tr>
                    ) : problems.length === 0 ? (
                      <tr><td colSpan={5} className="py-20 text-center text-on-surface-variant">No problems found.</td></tr>
                    ) : (
                      problems.map((p) => {
                        const dConf = diffConfig[p.difficulty?.toLowerCase()] || diffConfig['easy'];
                        const status = solveStatus(p.id);

                        return (
                          <tr key={p.id} onClick={() => navigate(`/problem/${p.slug}`)} className="hover:bg-surface-container-high/30 transition-colors group cursor-pointer">
                            <td className="px-6 py-4">
                              {status === 'solved' ? (
                                <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                              ) : status === 'attempted' ? (
                                <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 0" }}>incomplete_circle</span>
                              ) : (
                                <span className="material-symbols-outlined text-on-surface-variant/20 text-sm" style={{ fontVariationSettings: "'FILL' 0" }}>circle</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold group-hover:text-primary transition-colors">{p.id}. {p.title}</span>
                                <span className="text-[10px] text-on-surface-variant/60 flex gap-2 overflow-hidden max-w-sm mt-0.5">
                                  {p.tags.slice(0, 3).map(t => (
                                    <span key={t} className="hover:text-primary transition-colors truncate">#{t}</span>
                                  ))}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{p.acRate > 0 ? p.acRate.toFixed(1) : '0'}%</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${dConf.cls}`}>{dConf.label}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-sm transition-colors">play_arrow</button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {}
              <div className="mt-auto px-6 py-4 flex items-center justify-between border-t border-outline-variant/10 bg-surface-container-low">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold flex-shrink-0">
                  Showing {problems.length} of {total} problems
                </span>
                
                {totalPages > 1 && (
                  <div className="flex gap-1 overflow-x-auto no-scrollbar">
                    <button 
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded hover:bg-surface-container-high text-on-surface-variant transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    {}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pgNum = page;
                      if (page <= 3) {
                         pgNum = i + 1;
                      } else if (page >= totalPages - 2) {
                         pgNum = totalPages - 4 + i;
                         if (pgNum < 1) pgNum = i + 1;
                      } else {
                         pgNum = page - 2 + i;
                      }
                      
                      return (
                        <button 
                          key={pgNum}
                          onClick={() => setPage(pgNum)}
                          className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded transition-colors text-xs font-semibold ${page === pgNum ? 'bg-surface-container-high text-primary font-bold' : 'hover:bg-surface-container-high text-on-surface-variant'}`}
                        >
                          {pgNum}
                        </button>
                      );
                    })}
                    {totalPages > 5 && page < totalPages - 2 && (
                      <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-on-surface-variant text-xs">...</span>
                    )}
                    <button 
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                      className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded hover:bg-surface-container-high text-on-surface-variant transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {}
          <aside className="w-full xl:w-80 space-y-6 flex-shrink-0">
            {}
            <div className="bg-surface-container-low rounded-lg p-6 space-y-6 border border-outline-variant/10">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Session Statistics</h3>
              <div className="space-y-4">
                <div className="bg-surface-container-lowest p-4 rounded-lg">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">Solved Problems</span>
                    <span className="text-xl font-black text-primary">{totalSolved}<span className="text-xs text-on-surface-variant font-normal">/{total > 0 ? total : 2400}</span></span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${percentSolved}%` }}></div>
                  </div>
                </div>
                
                {}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-surface-container-lowest p-3 rounded-lg text-center">
                    <span className="block text-[10px] text-secondary font-bold">EASY</span>
                    <span className="text-lg font-bold">{Math.floor(totalSolved * 0.50)}</span>
                  </div>
                  <div className="bg-surface-container-lowest p-3 rounded-lg text-center">
                    <span className="block text-[10px] text-primary font-bold">MED</span>
                    <span className="text-lg font-bold">{Math.floor(totalSolved * 0.35)}</span>
                  </div>
                  <div className="bg-surface-container-lowest p-3 rounded-lg text-center">
                    <span className="block text-[10px] text-tertiary font-bold">HARD</span>
                    <span className="text-lg font-bold">{totalSolved - Math.floor(totalSolved * 0.50) - Math.floor(totalSolved * 0.35)}</span>
                  </div>
                </div>
              </div>
            </div>

            {}
            <div className="bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/10 rounded-lg p-6 relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Daily Activity</h3>
                <div className="flex flex-wrap gap-1">
                  {heatmapData.map((d, i) => (
                    <div 
                      key={i} 
                      className={`w-3 h-3 rounded-[2px] ${d.opacityClass} transition-colors hover:ring-1 hover:ring-primary`}
                      title={`${d.date}: ${d.count} submissions`}
                    ></div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-medium pt-2 border-t border-outline-variant/10">
                  <span>Last 30 Days</span>
                  <span className="text-secondary">+12.4% vs prev.</span>
                </div>
              </div>
            </div>

            {}
            <div className="relative rounded-lg overflow-hidden group border border-outline-variant/10">
              <img className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" data-alt="abstract tech circuitry pattern" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxJiuV50OpAMWPZuEnTxsKfSCLEjDtEWoZzQ1T99H8IEt7j09VLA17ZchdphYuXHPsXMCCw1o7-DddfrxkFWHRgrIrbUYAgWE19w53r2bD76M60phzN8Tc889pv1doergV1U64B8NM-1BpUR-WiGChx_LY_NVACYo9ZgCpgcbrG-vw6YInWBLWftp-V8jZpBr5N7_e98xBMuUZ-CmYItg6gqEpI0ugyt-N42y76-7VguOCQZQqldwEnPLozG820hS7a32lyZXFOZkU"/>
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/60 to-transparent p-6 flex flex-col justify-end">
                <h4 className="text-lg font-black text-on-surface tracking-tight mb-1">Upgrade Pro</h4>
                <p className="text-xs text-on-surface-variant mb-4 leading-relaxed line-clamp-2">Access premium solutions, company-specific questions, and mock interview prep.</p>
                <button className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed font-bold text-[10px] rounded-lg uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all">Get Started</button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  activeNav: string;
  onNavChange: (id: string) => void;
}

export function Sidebar({ activeNav, onNavChange }: SidebarProps) {
  const { isAuthenticated } = useAuth();

  return (
    <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-64 bg-[#1C1B1B] flex-col py-4 hidden lg:flex border-none">
      <div className="flex-1 space-y-1">
        {isAuthenticated && (
          <Link
            to="/dashboard"
            onClick={() => onNavChange("dashboard")}
            className={
              activeNav === "dashboard"
                ? "flex items-center gap-3 px-6 py-3 font-'Inter' text-xs font-semibold uppercase tracking-widest text-[#ffa116] bg-[#2A2A2A] rounded-r-lg border-l-4 border-[#ffa116] transition-all duration-150 ease-in-out"
                : "flex items-center gap-3 px-6 py-3 font-'Inter' text-xs font-semibold uppercase tracking-widest text-[#D9C3AD] opacity-70 hover:bg-[#2A2A2A] hover:opacity-100 transition-all duration-150 ease-in-out"
            }
          >
            <span className="material-symbols-outlined">dashboard</span>
            Dashboard
          </Link>
        )}

        <Link
          to="/"
          onClick={() => onNavChange("problems")}
          className={
            activeNav === "problems"
              ? "flex items-center gap-3 px-6 py-3 font-'Inter' text-xs font-semibold uppercase tracking-widest text-[#ffa116] bg-[#2A2A2A] rounded-r-lg border-l-4 border-[#ffa116] transition-all duration-150 ease-in-out"
              : "flex items-center gap-3 px-6 py-3 font-'Inter' text-xs font-semibold uppercase tracking-widest text-[#D9C3AD] opacity-70 hover:bg-[#2A2A2A] hover:opacity-100 transition-all duration-150 ease-in-out"
          }
        >
          <span className="material-symbols-outlined">list_alt</span>
          Problem Set
        </Link>

        <Link
          to="/submissions"
          onClick={() => onNavChange("submissions")}
          className={
            activeNav === "submissions"
              ? "flex items-center gap-3 px-6 py-3 font-'Inter' text-xs font-semibold uppercase tracking-widest text-[#ffa116] bg-[#2A2A2A] rounded-r-lg border-l-4 border-[#ffa116] transition-all duration-150 ease-in-out"
              : "flex items-center gap-3 px-6 py-3 font-'Inter' text-xs font-semibold uppercase tracking-widest text-[#D9C3AD] opacity-70 hover:bg-[#2A2A2A] hover:opacity-100 transition-all duration-150 ease-in-out"
          }
        >
          <span className="material-symbols-outlined">history</span>
          Submissions
        </Link>

        <Link
          to="/analytics"
          onClick={() => onNavChange("analytics")}
          className={
            activeNav === "analytics"
              ? "flex items-center gap-3 px-6 py-3 font-'Inter' text-xs font-semibold uppercase tracking-widest text-[#ffa116] bg-[#2A2A2A] rounded-r-lg border-l-4 border-[#ffa116] transition-all duration-150 ease-in-out"
              : "flex items-center gap-3 px-6 py-3 font-'Inter' text-xs font-semibold uppercase tracking-widest text-[#D9C3AD] opacity-70 hover:bg-[#2A2A2A] hover:opacity-100 transition-all duration-150 ease-in-out"
          }
        >
          <span className="material-symbols-outlined">analytics</span>
          Analytics
        </Link>

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNavChange("favorites");
          }}
          className={
            activeNav === "favorites"
              ? "flex items-center gap-3 px-6 py-3 font-'Inter' text-xs font-semibold uppercase tracking-widest text-[#ffa116] bg-[#2A2A2A] rounded-r-lg border-l-4 border-[#ffa116] transition-all duration-150 ease-in-out"
              : "flex items-center gap-3 px-6 py-3 font-'Inter' text-xs font-semibold uppercase tracking-widest text-[#D9C3AD] opacity-70 hover:bg-[#2A2A2A] hover:opacity-100 transition-all duration-150 ease-in-out"
          }
        >
          <span className="material-symbols-outlined">star</span>
          Favorites
        </a>
      </div>

      <div className="border-t border-outline-variant/10 pt-4 space-y-1">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNavChange("support");
          }}
          className="flex items-center gap-3 px-6 py-3 font-['Inter'] text-xs font-semibold uppercase tracking-widest text-[#D9C3AD] opacity-70 hover:bg-[#2A2A2A] hover:opacity-100 transition-all duration-150 ease-in-out"
        >
          <span className="material-symbols-outlined">help_outline</span>
          Support
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNavChange("documentation");
          }}
          className="flex items-center gap-3 px-6 py-3 font-['Inter'] text-xs font-semibold uppercase tracking-widest text-[#D9C3AD] opacity-70 hover:bg-[#2A2A2A] hover:opacity-100 transition-all duration-150 ease-in-out"
        >
          <span className="material-symbols-outlined">description</span>
          Documentation
        </a>
      </div>
    </aside>
  );
}

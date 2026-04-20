import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function TopBar() {
  const { isAuthenticated, username, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="bg-[#1C1B1B] border-none fixed top-0 w-full z-50">
      <div className="flex justify-between items-center w-full px-6 h-14 max-w-full mx-auto">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="text-xl font-black text-[#E5E2E1] tracking-tighter hover:text-primary transition-colors"
          >
            Nexorithm
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="font-['Inter'] font-medium text-sm tracking-tight text-[#D9C3AD] hover:text-[#E5E2E1] transition-colors duration-200"
            >
              Problems
            </Link>
            <a
              className="font-['Inter'] font-medium text-sm tracking-tight text-[#D9C3AD] hover:text-[#E5E2E1] transition-colors duration-200"
              href="#"
            >
              Contest
            </a>
            <a
              className="font-['Inter'] font-medium text-sm tracking-tight text-[#D9C3AD] hover:text-[#E5E2E1] transition-colors duration-200"
              href="#"
            >
              Discuss
            </a>
            <a
              className="font-['Inter'] font-medium text-sm tracking-tight text-[#D9C3AD] hover:text-[#E5E2E1] transition-colors duration-200"
              href="#"
            >
              Interview
            </a>
            <a
              className="font-['Inter'] font-medium text-sm tracking-tight text-[#D9C3AD] hover:text-[#E5E2E1] transition-colors duration-200"
              href="#"
            >
              Store
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-4 relative">
          <button className="text-[#D9C3AD] hover:bg-[#2A2A2A] p-2 rounded-lg transition-colors duration-200">
            <span className="material-symbols-outlined icon-settings">
              notifications
            </span>
          </button>
          <button className="text-[#D9C3AD] hover:bg-[#2A2A2A] p-2 rounded-lg transition-colors duration-200">
            <span className="material-symbols-outlined icon-settings">
              settings
            </span>
          </button>
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu((v) => !v)}
                className="h-8 w-8 rounded-full bg-primary-container overflow-hidden border border-outline-variant/20 ml-2 flex items-center justify-center text-on-primary-container font-bold shadow-sm"
              >
                {username?.[0]?.toUpperCase() || "U"}
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-surface-container-high rounded-xl border border-outline-variant/20 shadow-xl py-1 z-50">
                  <div className="px-4 py-2 border-b border-outline-variant/10">
                    <p className="text-sm font-bold text-on-surface truncate">
                      {username}
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-error hover:bg-surface-container-highest transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      logout
                    </span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2 ml-2">
              <Link
                to="/login"
                className="px-4 py-1.5 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-4 py-1.5 text-sm font-bold text-on-primary-container bg-primary-container rounded-lg hover:bg-primary-fixed-dim transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

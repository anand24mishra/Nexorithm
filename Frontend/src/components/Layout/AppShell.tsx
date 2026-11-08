import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/authState";

const LINKS = [
  { to: "/", label: "Problems", end: true },
  { to: "/dashboard", label: "Dashboard", end: false },
  { to: "/submissions", label: "Submissions", end: false },
  { to: "/analytics", label: "Analytics", end: false },
] as const;

function navClass(isActive: boolean) {
  return [
    "flex min-h-11 items-center px-3 text-sm rounded-sm",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container",
    isActive
      ? "bg-surface-container-high text-on-surface font-semibold"
      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
  ].join(" ");
}

export function AppShell({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  const { isAuthenticated, username, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const drawerId = useId();
  const drawerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const root = drawerRef.current;
    const previously = document.activeElement as HTMLElement | null;
    const focusable = () =>
      root
        ? [
            ...root.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
          ]
        : [];
    focusable()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !root) return;
      const nodes = focusable();
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      (previously ?? menuButtonRef.current)?.focus();
    };
  }, [open]);

  const links = (
    <nav aria-label="Application" className="flex flex-col gap-1">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) => navClass(isActive)}
          onClick={() => setOpen(false)}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );

  const account = isAuthenticated ? (
    <div className="mt-auto border-t border-outline-variant pt-4">
      <p className="truncate px-3 text-sm text-on-surface">{username}</p>
      <button
        type="button"
        className="mt-2 min-h-11 w-full px-3 text-left text-sm text-on-surface-variant hover:text-on-surface"
        onClick={() => {
          logout();
          setOpen(false);
        }}
      >
        Logout
      </button>
    </div>
  ) : (
    <div className="mt-auto flex flex-col gap-1 border-t border-outline-variant pt-4">
      <NavLink to="/login" className={navClass(false)} onClick={() => setOpen(false)}>
        Sign in
      </NavLink>
      <NavLink to="/signup" className={navClass(false)} onClick={() => setOpen(false)}>
        Create account
      </NavLink>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-on-surface font-body">
      <a
        href="#app-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[80] focus:bg-surface-container-high focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-outline-variant bg-surface-container-low px-3 lg:hidden">
        <button
          ref={menuButtonRef}
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center border border-outline-variant text-sm"
          aria-expanded={open}
          aria-controls={drawerId}
          onClick={() => setOpen(true)}
        >
          Menu
        </button>
        <NavLink to="/" className="truncate text-base font-semibold tracking-tight">
          Nexorithm
        </NavLink>
        {title ? (
          <p className="ml-auto truncate font-mono text-xs text-on-surface-variant">{title}</p>
        ) : null}
      </header>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside
            ref={drawerRef}
            id={drawerId}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="relative flex h-full w-72 max-w-[85vw] flex-col bg-surface-container-low p-4"
          >
            <div className="mb-6 flex items-center justify-between">
              <p className="text-base font-semibold tracking-tight">Nexorithm</p>
              <button
                type="button"
                className="min-h-11 px-3 text-sm text-on-surface-variant"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            {links}
            {account}
          </aside>
        </div>
      ) : null}
      <div className="lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
        <aside className="hidden min-h-screen flex-col border-r border-outline-variant bg-surface-container-low p-4 lg:flex">
          <NavLink to="/" className="mb-8 block px-3 text-lg font-semibold tracking-tight">
            Nexorithm
          </NavLink>
          {links}
          {account}
        </aside>
        <main id="app-main" className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

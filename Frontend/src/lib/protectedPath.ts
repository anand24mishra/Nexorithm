/** Routes that require a session. The public landing page is `/`. */
export function isProtectedPath(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    pathname === "/submissions" ||
    pathname === "/analytics" ||
    pathname.startsWith("/problem/")
  );
}

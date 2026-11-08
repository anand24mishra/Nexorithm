/** ASCII C0 controls, U+0000 through U+001F. DEL (U+007F) is intentionally allowed. */
function hasAsciiControlChar(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    if (value.charCodeAt(index) <= 0x1f) return true;
  }
  return false;
}

/** Internal return paths only. Rejects protocol-relative and off-site targets. */
export function safeInternalPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return null;
  }
  if (path.includes("\\") || path.includes("://") || hasAsciiControlChar(path)) {
    return null;
  }
  const pathname = path.split(/[?#]/)[0] ?? "";
  if (pathname === "/login" || pathname === "/signup") return null;
  return path;
}

export function readReturnPath(state: unknown, fallback = "/dashboard"): string {
  if (!state || typeof state !== "object") return fallback;
  return safeInternalPath((state as { from?: unknown }).from) ?? fallback;
}

export function pageWindow(page: number, totalPages: number): number[] {
  if (!Number.isFinite(totalPages) || totalPages < 1) return [];
  const pages = Math.floor(totalPages);
  const size = Math.min(5, pages);
  const current = Math.min(Math.max(Math.floor(page) || 1, 1), pages);
  let start = 1;
  if (size < pages) {
    start = current - Math.floor(size / 2);
    if (start < 1) start = 1;
    const maxStart = pages - size + 1;
    if (start > maxStart) start = maxStart;
  }
  return Array.from({ length: size }, (_, index) => start + index);
}

export interface ActivityCell {
  date: string;
  count: number;
  future: boolean;
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfLocalDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function countByLocalDay(timestamps: Array<string | Date>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const stamp of timestamps) {
    const date = stamp instanceof Date ? stamp : new Date(stamp);
    if (Number.isNaN(date.getTime())) continue;
    const key = localDateKey(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function buildActivityDays(
  timestamps: Array<string | Date>,
  days: number,
  now = new Date(),
): ActivityCell[] {
  const counts = countByLocalDay(timestamps);
  const today = startOfLocalDay(now);
  return Array.from({ length: days }, (_, index) => {
    const cell = new Date(today);
    cell.setDate(today.getDate() - (days - 1 - index));
    const date = localDateKey(cell);
    return { date, count: counts.get(date) ?? 0, future: false };
  });
}

export function buildActivityWeeks(
  timestamps: Array<string | Date>,
  weeks = 52,
  now = new Date(),
): ActivityCell[][] {
  const counts = countByLocalDay(timestamps);
  const today = startOfLocalDay(now);
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() - (weeks - 1) * 7);

  return Array.from({ length: weeks }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const cell = new Date(start);
      cell.setDate(start.getDate() + weekIndex * 7 + dayIndex);
      const date = localDateKey(cell);
      const future = cell.getTime() > today.getTime();
      return { date, count: future ? 0 : (counts.get(date) ?? 0), future };
    }),
  );
}

export function formatActivityDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function activityLabel(cell: ActivityCell): string {
  if (cell.future) return "";
  const when = formatActivityDate(cell.date);
  if (cell.count === 0) return `${when}: no submissions`;
  return `${when}: ${cell.count} submission${cell.count === 1 ? "" : "s"}`;
}

export function activityTotal(cells: ActivityCell[]): number {
  return cells.reduce((sum, cell) => sum + cell.count, 0);
}

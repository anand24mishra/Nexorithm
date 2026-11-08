import { describe, expect, it } from "vitest";
import {
  activityLabel,
  buildActivityDays,
  buildActivityWeeks,
  localDateKey,
} from "../src/components/Activity/activityGrid";

describe("submission activity grid", () => {
  it("counts a submission on the local calendar day", () => {
    const now = new Date(2026, 10, 3, 15, 0, 0);
    const earlyMorning = new Date(2026, 10, 3, 0, 30, 0);
    const days = buildActivityDays([earlyMorning], 3, now);
    expect(days.map((day) => day.date)).toEqual([
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
    ]);
    expect(days[2].count).toBe(1);
    expect(localDateKey(earlyMorning)).toBe("2026-11-03");
    expect(activityLabel(days[2])).toContain("1 submission");
  });

  it("leaves days after today empty and aligns weeks to Sunday", () => {
    const wednesday = new Date(2026, 10, 4, 12, 0, 0);
    const weeks = buildActivityWeeks([wednesday], 1, wednesday);
    expect(weeks).toHaveLength(1);
    expect(weeks[0][0].date).toBe("2026-11-01");
    expect(weeks[0][3].count).toBe(1);
    expect(weeks[0][4].future).toBe(true);
    expect(weeks[0][4].count).toBe(0);
  });
});

import { getTodayWorkOccurrences, nextFirst } from "../src/utils/workDashboard";
import { createWorkItem } from "../src/utils/workSchedule";

const local = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min).getTime();

const shift = (id: string, startMinutes: number, endMinutes: number, startDateKey: string) =>
  createWorkItem(
    {
      name: id,
      description: "",
      calendarColor: "#3366ff",
      startMinutes,
      endMinutes,
      startDateKey,
      repeat: { kind: "none" },
      end: { kind: "never" },
    },
    id,
    local(2026, 11, 1),
  );

describe("getTodayWorkOccurrences", () => {
  it("lists today's shifts and ignores other days", () => {
    const items = [shift("a", 9 * 60, 17 * 60, "2026-11-03"), shift("b", 9 * 60, 17 * 60, "2026-11-04"), shift("c", 9 * 60, 17 * 60, "2026-11-02")];
    expect(getTodayWorkOccurrences(items, local(2026, 11, 3, 8)).map((o) => o.itemId)).toEqual(["a"]);
  });

  it("keeps yesterday's night shift that runs past midnight until it is confirmed", () => {
    const night = shift("night", 22 * 60, 6 * 60, "2026-11-02");
    expect(getTodayWorkOccurrences([night], local(2026, 11, 3, 2)).map((o) => o.itemId)).toEqual(["night"]);
    const done = { ...night, completedDateKeys: ["2026-11-02"] };
    expect(getTodayWorkOccurrences([done], local(2026, 11, 3, 8))).toEqual([]);
  });

  it("drops yesterday's day shift", () => {
    expect(getTodayWorkOccurrences([shift("old", 9 * 60, 17 * 60, "2026-11-02")], local(2026, 11, 3, 8))).toEqual([]);
  });
});

describe("nextFirst", () => {
  it("moves the running shift ahead of an earlier finished one", () => {
    const items = [shift("early", 6 * 60, 8 * 60, "2026-11-03"), shift("now", 9 * 60, 17 * 60, "2026-11-03")];
    const list = getTodayWorkOccurrences(items, local(2026, 11, 3, 10));
    expect(nextFirst(list, local(2026, 11, 3, 10)).map((o) => o.itemId)).toEqual(["now", "early"]);
  });
});

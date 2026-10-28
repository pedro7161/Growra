import { WorkItem } from "../src/types";
import {
  canCompleteOccurrence,
  createWorkItem,
  dateKeyToStart,
  deleteOccurrence,
  editOccurrence,
  getNextOccurrence,
  getOccurrencesBetween,
  getRunningOccurrence,
  toDateKey,
} from "../src/utils/workSchedule";

// jest.config.js runs in Europe/Lisbon; DST changes on 2026-03-29 and 2026-10-25.
const local = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min).getTime();
const HOUR = 60 * 60 * 1000;

type Fields = Parameters<typeof createWorkItem>[0];

const item = (overrides: Partial<Fields> = {}, id = "w1"): WorkItem =>
  createWorkItem(
    {
      name: "Shift",
      description: "",
      calendarColor: "#3366ff",
      startMinutes: 9 * 60,
      endMinutes: 17 * 60,
      startDateKey: "2026-11-02",
      repeat: { kind: "days", interval: 1 },
      end: { kind: "never" },
      ...overrides,
    },
    id,
    local(2026, 11, 1),
  );

const keys = (items: WorkItem[], from: string, to: string) =>
  getOccurrencesBetween(items, from, to).map((o) => o.dateKey);

const ids = (prefix: string) => {
  let n = 0;
  return () => `${prefix}${++n}`;
};

describe("date keys", () => {
  it("round-trips a local date key", () => {
    expect(toDateKey(local(2026, 11, 2, 23, 59))).toBe("2026-11-02");
    expect(dateKeyToStart("2026-10-25")).toBe(local(2026, 10, 25));
    expect(toDateKey(dateKeyToStart("2026-03-29"))).toBe("2026-03-29");
  });
});

describe("repeat rules", () => {
  it("every 4 days from 2026-11-02 occurs on 02, 06, 10", () => {
    const w = item({ repeat: { kind: "days", interval: 4 } });
    expect(keys([w], "2026-11-01", "2026-11-13")).toEqual(["2026-11-02", "2026-11-06", "2026-11-10"]);
  });

  it("weekly Mon+Thu every 2 weeks", () => {
    const w = item({ repeat: { kind: "weeks", interval: 2, weekdays: [4, 1] } });
    expect(keys([w], "2026-11-01", "2026-11-22")).toEqual([
      "2026-11-02",
      "2026-11-05",
      "2026-11-16",
      "2026-11-19",
    ]);
  });

  it("weekly ignores chosen weekdays before the start date", () => {
    // Starts on a Thursday; the Monday of that week is before the start.
    const w = item({ startDateKey: "2026-11-05", repeat: { kind: "weeks", interval: 1, weekdays: [1, 4] } });
    expect(keys([w], "2026-11-01", "2026-11-13")).toEqual(["2026-11-05", "2026-11-09", "2026-11-12"]);
  });

  it("monthly on the 31st skips months without a 31st", () => {
    const w = item({ startDateKey: "2026-10-31", repeat: { kind: "months", interval: 1 } });
    expect(keys([w], "2026-10-01", "2027-04-01")).toEqual([
      "2026-10-31",
      "2026-12-31",
      "2027-01-31",
      "2027-03-31",
    ]);
  });

  it("a one-off item occurs only on its start date", () => {
    const w = item({ repeat: { kind: "none" } });
    expect(keys([w], "2026-10-01", "2027-01-01")).toEqual(["2026-11-02"]);
  });

  it("count 3 stops after three, skips included", () => {
    const w = item({ end: { kind: "count", count: 3 } });
    const skipped = deleteOccurrence([w], "w1", "2026-11-03", "one");
    expect(keys(skipped, "2026-11-01", "2026-12-01")).toEqual(["2026-11-02", "2026-11-04"]);
  });

  it("stops after the until date, inclusive", () => {
    const w = item({ end: { kind: "until", dateKey: "2026-11-04" } });
    expect(keys([w], "2026-11-01", "2026-12-01")).toEqual(["2026-11-02", "2026-11-03", "2026-11-04"]);
  });

  it("only returns occurrences inside the window", () => {
    const w = item({ end: { kind: "count", count: 10 } });
    expect(keys([w], "2026-11-05", "2026-11-07")).toEqual(["2026-11-05", "2026-11-06"]);
  });

  it("sorts occurrences of several items by start", () => {
    const early = item({ startMinutes: 6 * 60, endMinutes: 8 * 60 }, "early");
    const late = item({ startMinutes: 10 * 60, endMinutes: 12 * 60 }, "late");
    expect(getOccurrencesBetween([late, early], "2026-11-02", "2026-11-04").map((o) => o.itemId)).toEqual([
      "early",
      "late",
      "early",
      "late",
    ]);
  });
});

describe("occurrence times", () => {
  it("night shift 22:00-06:00 ends the next morning", () => {
    const w = item({ startMinutes: 22 * 60, endMinutes: 6 * 60, repeat: { kind: "none" } });
    const [o] = getOccurrencesBetween([w], "2026-11-02", "2026-11-03");
    expect(o.dateKey).toBe("2026-11-02");
    expect(o.start).toBe(local(2026, 11, 2, 22));
    expect(o.end).toBe(local(2026, 11, 3, 6));
    expect(o.end - o.start).toBe(8 * HOUR);
  });

  it("keeps 09:00 local across the 2026-10-25 DST change", () => {
    const w = item({ startDateKey: "2026-10-24" });
    const occurrences = getOccurrencesBetween([w], "2026-10-24", "2026-10-27");
    expect(occurrences.map((o) => o.dateKey)).toEqual(["2026-10-24", "2026-10-25", "2026-10-26"]);
    for (const o of occurrences) {
      const start = new Date(o.start);
      expect([start.getHours(), start.getMinutes()]).toEqual([9, 0]);
      expect(new Date(o.end).getHours()).toBe(17);
      expect(toDateKey(o.start)).toBe(o.dateKey);
    }
  });

  it("marks completed occurrences", () => {
    const w = { ...item(), completedDateKeys: ["2026-11-03"] };
    expect(getOccurrencesBetween([w], "2026-11-02", "2026-11-05").map((o) => o.completed)).toEqual([
      false,
      true,
      false,
    ]);
  });
});

describe("editing and deleting", () => {
  it("only this one changes a single date", () => {
    const w = item();
    const edited = editOccurrence([w], "w1", "2026-11-03", { name: "Cover", startMinutes: 13 * 60 }, "one", ids("n"));
    expect(edited).toHaveLength(1);
    const occurrences = getOccurrencesBetween(edited, "2026-11-02", "2026-11-05");
    expect(occurrences.map((o) => o.name)).toEqual(["Shift", "Cover", "Shift"]);
    expect(occurrences[1].start).toBe(local(2026, 11, 3, 13));
    expect(occurrences[1].end).toBe(local(2026, 11, 3, 17));
    expect(w.exceptions).toEqual({}); // input untouched
  });

  it("this and following splits the series", () => {
    const w = editOccurrence([item()], "w1", "2026-11-03", { name: "Early" }, "one", ids("x"));
    const split = editOccurrence(w, "w1", "2026-11-05", { name: "Late", startMinutes: 14 * 60, endMinutes: 22 * 60 }, "following", ids("n"));
    expect(split).toHaveLength(2);
    const [old, next] = split;
    expect(old.id).toBe("w1");
    expect(old.end).toEqual({ kind: "until", dateKey: "2026-11-04" });
    expect(old.exceptions["2026-11-03"]).toEqual({ kind: "change", name: "Early" });
    expect(next.id).toBe("n1");
    expect(next.startDateKey).toBe("2026-11-05");
    expect(next.name).toBe("Late");
    expect(next.exceptions).toEqual({});
    expect(next.repeat).toEqual({ kind: "days", interval: 1 });
    const names = getOccurrencesBetween(split, "2026-11-02", "2026-11-08").map((o) => `${o.dateKey} ${o.name}`);
    expect(names).toEqual([
      "2026-11-02 Shift",
      "2026-11-03 Early",
      "2026-11-04 Shift",
      "2026-11-05 Late",
      "2026-11-06 Late",
      "2026-11-07 Late",
    ]);
  });

  it("this and following moves later exceptions and completions to the new item", () => {
    const w = { ...item(), completedDateKeys: ["2026-11-02", "2026-11-06"], exceptions: { "2026-11-07": { kind: "skip" as const } } };
    const [old, next] = editOccurrence([w], "w1", "2026-11-05", { name: "Late" }, "following", ids("n"));
    expect(old.completedDateKeys).toEqual(["2026-11-02"]);
    expect(old.exceptions).toEqual({});
    expect(next.completedDateKeys).toEqual(["2026-11-06"]);
    expect(next.exceptions).toEqual({ "2026-11-07": { kind: "skip" } });
  });

  it("this and following overrides an earlier change on that date but keeps its other fields", () => {
    const w = editOccurrence([item()], "w1", "2026-11-05", { name: "Cover", startMinutes: 13 * 60 }, "one", ids("x"));
    const [, next] = editOccurrence(w, "w1", "2026-11-05", { name: "Late" }, "following", ids("n"));
    expect(next.exceptions).toEqual({ "2026-11-05": { kind: "change", startMinutes: 13 * 60 } });
    expect(getOccurrencesBetween([next], "2026-11-05", "2026-11-06")[0].name).toBe("Late");
  });

  it("this and following on a count item keeps the remaining count", () => {
    const w = item({ end: { kind: "count", count: 5 } });
    const [old, next] = editOccurrence([w], "w1", "2026-11-04", { name: "Late" }, "following", ids("n"));
    expect(old.end).toEqual({ kind: "until", dateKey: "2026-11-03" });
    expect(next.end).toEqual({ kind: "count", count: 3 });
    expect(keys([old, next], "2026-11-01", "2026-12-01")).toEqual([
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
    ]);
  });

  it("counts skipped occurrences before the split toward the used count", () => {
    const w = deleteOccurrence([item({ end: { kind: "count", count: 5 } })], "w1", "2026-11-03", "one");
    const [, next] = editOccurrence(w, "w1", "2026-11-04", { name: "Late" }, "following", ids("n"));
    expect(next.end).toEqual({ kind: "count", count: 3 });
  });

  it("this and following from the first date replaces the item", () => {
    const split = editOccurrence([item()], "w1", "2026-11-02", { name: "Late" }, "following", ids("n"));
    expect(split.map((w) => w.id)).toEqual(["n1"]);
    expect(split[0].name).toBe("Late");
    expect(split[0].startDateKey).toBe("2026-11-02");
  });

  it("leaves other items alone", () => {
    const other = item({}, "other");
    const result = editOccurrence([item(), other], "w1", "2026-11-04", { name: "Late" }, "following", ids("n"));
    expect(result.map((w) => w.id)).toEqual(["w1", "n1", "other"]);
    expect(result[2]).toBe(other);
  });

  it("delete this one skips that date", () => {
    const result = deleteOccurrence([item()], "w1", "2026-11-03", "one");
    expect(keys(result, "2026-11-02", "2026-11-05")).toEqual(["2026-11-02", "2026-11-04"]);
  });

  it("delete this and following ends the series the day before", () => {
    const result = deleteOccurrence([item()], "w1", "2026-11-04", "following");
    expect(result[0].end).toEqual({ kind: "until", dateKey: "2026-11-03" });
    expect(keys(result, "2026-11-01", "2026-12-01")).toEqual(["2026-11-02", "2026-11-03"]);
  });

  it("delete this and following from the first date removes the item", () => {
    expect(deleteOccurrence([item()], "w1", "2026-11-02", "following")).toEqual([]);
  });

  it("deleting a one-off item removes it", () => {
    expect(deleteOccurrence([item({ repeat: { kind: "none" } })], "w1", "2026-11-02", "one")).toEqual([]);
  });
});

describe("now-based lookups", () => {
  const night = item({ startMinutes: 22 * 60, endMinutes: 6 * 60 });

  it("can complete from start until the end of the next day", () => {
    const [o] = getOccurrencesBetween([night], "2026-11-02", "2026-11-03");
    expect(canCompleteOccurrence(o, local(2026, 11, 2, 21, 59))).toBe(false);
    expect(canCompleteOccurrence(o, local(2026, 11, 2, 22))).toBe(true);
    expect(canCompleteOccurrence(o, local(2026, 11, 3, 7))).toBe(true);
    expect(canCompleteOccurrence(o, local(2026, 11, 3, 23, 59))).toBe(true);
    expect(canCompleteOccurrence(o, local(2026, 11, 4, 0))).toBe(false);
    expect(canCompleteOccurrence({ ...o, completed: true }, local(2026, 11, 3, 7))).toBe(false);
  });

  it("finds the running night shift that started yesterday", () => {
    const running = getRunningOccurrence([night], local(2026, 11, 3, 2));
    expect(running?.dateKey).toBe("2026-11-02");
    expect(getRunningOccurrence([night], local(2026, 11, 3, 12))).toBeNull();
  });

  it("next occurrence is the first not completed whose end is still ahead", () => {
    const w = { ...night, completedDateKeys: ["2026-11-03"] };
    expect(getNextOccurrence([w], local(2026, 11, 3, 2))?.dateKey).toBe("2026-11-02");
    expect(getNextOccurrence([w], local(2026, 11, 3, 12))?.dateKey).toBe("2026-11-04");
    expect(getNextOccurrence([item({ repeat: { kind: "none" } })], local(2026, 11, 3))).toBeNull();
    expect(getNextOccurrence([], local(2026, 11, 3))).toBeNull();
  });

  it("next occurrence finds a far-off one-off item", () => {
    const w = item({ startDateKey: "2027-06-01", repeat: { kind: "none" } });
    expect(getNextOccurrence([w], local(2026, 11, 3))?.dateKey).toBe("2027-06-01");
  });
});

import {
  addDaysToKey,
  changesSeriesRule,
  draftFromItem,
  draftToFields,
  editWorkItems,
  newWorkDraft,
  occurrenceChange,
  parseClock,
  saveWorkItem,
  weekStartKey,
} from "../src/utils/workForm";
import { createWorkItem, editOccurrence, getOccurrencesBetween } from "../src/utils/workSchedule";

const local = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min).getTime();

describe("parseClock", () => {
  it("reads common ways of writing a time", () => {
    expect(parseClock("07:00")).toBe(420);
    expect(parseClock("7")).toBe(420);
    expect(parseClock("0730")).toBe(450);
    expect(parseClock(" 22.15 ")).toBe(1335);
  });

  it("rejects times that are not on the clock", () => {
    expect(parseClock("24:00")).toBeNull();
    expect(parseClock("7:60")).toBeNull();
    expect(parseClock("seven")).toBeNull();
    expect(parseClock("")).toBeNull();
  });
});

describe("week helpers", () => {
  it("starts the week on Monday", () => {
    expect(weekStartKey("2026-11-02")).toBe("2026-11-02"); // Monday
    expect(weekStartKey("2026-11-08")).toBe("2026-11-02"); // Sunday
    expect(weekStartKey("2026-10-28")).toBe("2026-10-26");
  });

  it("steps across the daylight-saving change by calendar day", () => {
    expect(addDaysToKey("2026-10-24", 1)).toBe("2026-10-25");
    expect(addDaysToKey("2026-10-25", 1)).toBe("2026-10-26");
    expect(addDaysToKey("2026-11-01", -7)).toBe("2026-10-25");
  });
});

describe("work drafts", () => {
  it("turns a Morning shift every 4 days into fields", () => {
    const draft = { ...newWorkDraft("2026-11-02"), name: " Morning shift ", startText: "07:00", endText: "15:00", repeatChoice: "xdays" as const, intervalText: "4" };
    expect(draftToFields(draft)).toEqual({
      fields: expect.objectContaining({
        name: "Morning shift",
        startMinutes: 420,
        endMinutes: 900,
        startDateKey: "2026-11-02",
        repeat: { kind: "days", interval: 4 },
        end: { kind: "never" },
      }),
    });
  });

  it("builds weekly rules with the chosen weekdays and end rules", () => {
    const draft = { ...newWorkDraft("2026-11-02"), name: "Gym", repeatChoice: "weekly" as const, weekdays: [4, 1], endChoice: "count" as const, countText: "6" };
    const result = draftToFields(draft);
    expect(result).toEqual({ fields: expect.objectContaining({ repeat: { kind: "weeks", interval: 1, weekdays: [1, 4] }, end: { kind: "count", count: 6 } }) });
  });

  it("ignores the end rule for a one-off", () => {
    const draft = { ...newWorkDraft("2026-11-02"), name: "Meeting", endChoice: "count" as const, countText: "x" };
    expect(draftToFields(draft)).toEqual({ fields: expect.objectContaining({ repeat: { kind: "none" }, end: { kind: "never" } }) });
  });

  it("names the first problem", () => {
    const base = { ...newWorkDraft("2026-11-02"), name: "Shift" };
    expect(draftToFields({ ...base, name: "  " })).toEqual({ error: "workFormNameMissing" });
    expect(draftToFields({ ...base, endText: "25:00" })).toEqual({ error: "workFormTimeInvalid" });
    expect(draftToFields({ ...base, repeatChoice: "xweeks", intervalText: "0" })).toEqual({ error: "workFormNumberInvalid" });
    expect(draftToFields({ ...base, repeatChoice: "daily", endChoice: "until", untilDateKey: "2026-11-01" })).toEqual({ error: "workFormUntilInvalid" });
  });

  it("round-trips an item, taking the date's own changes from its occurrence", () => {
    const item = {
      ...createWorkItem(
        { name: "Night", description: "", calendarColor: "#2d6ea8", startMinutes: 22 * 60, endMinutes: 6 * 60, startDateKey: "2026-11-02", repeat: { kind: "weeks", interval: 2, weekdays: [4, 1] }, end: { kind: "until", dateKey: "2026-12-31" } },
        "w1",
        local(2026, 11, 1),
      ),
      exceptions: { "2026-11-05": { kind: "change" as const, startMinutes: 23 * 60 } },
    };
    const occurrence = getOccurrencesBetween([item], "2026-11-05", "2026-11-06")[0];
    const draft = draftFromItem(item, occurrence);
    expect(draft).toMatchObject({ startText: "23:00", endText: "06:00", repeatChoice: "xweeks", intervalText: "2", endChoice: "until", untilDateKey: "2026-12-31" });
    const result = draftToFields(draftFromItem(item));
    if (!("fields" in result)) throw new Error("expected fields");
    expect(changesSeriesRule(item, result.fields)).toBe(false);
    expect(changesSeriesRule(item, { ...result.fields, calendarColor: "#c05a2f" })).toBe(true);
    expect(changesSeriesRule(item, { ...result.fields, end: { kind: "never" } })).toBe(true);
  });
});

describe("only this one, then this and all following", () => {
  it("a date whose time was changed still takes a later rename of the series", () => {
    const daily = createWorkItem(
      { name: "Shift", description: "", calendarColor: "#2d6ea8", startMinutes: 9 * 60, endMinutes: 17 * 60, startDateKey: "2026-11-02", repeat: { kind: "days", interval: 1 }, end: { kind: "never" } },
      "w1",
      local(2026, 11, 1),
    );
    const on = (items: typeof daily[], key: string) => getOccurrencesBetween(items, key, addDaysToKey(key, 1))[0];

    // Only this one: 5 Nov starts at 10:00; nothing else typed differently.
    const nov5 = on([daily], "2026-11-05");
    const fifth = draftToFields({ ...draftFromItem(daily, nov5), startText: "10:00" });
    if (!("fields" in fifth)) throw new Error("expected fields");
    const change = occurrenceChange(nov5, fifth.fields);
    expect(change).toEqual({ startMinutes: 600 });
    const afterOne = editOccurrence([daily], "w1", "2026-11-05", change, "one", () => "unused");

    // This and all following from 3 Nov: renamed.
    const ids = ["w2"];
    const afterFollowing = editOccurrence(afterOne, "w1", "2026-11-03", { name: "Ward 3" }, "following", () => ids.shift()!);
    const renamed = on(afterFollowing, "2026-11-05");
    expect(renamed.name).toBe("Ward 3");
    expect(new Date(renamed.start).getHours()).toBe(10);
  });

  it("a weekly repeat with no weekday chosen keeps the first day's weekday", () => {
    const result = draftToFields({ ...newWorkDraft("2026-11-04"), name: "Gym", repeatChoice: "weekly", weekdays: [] });
    expect(result).toEqual({ fields: expect.objectContaining({ repeat: { kind: "weeks", interval: 1, weekdays: [3] } }) });
  });
});

describe("editing a holder's items", () => {
  const fields = {
    name: "Swim",
    description: "",
    calendarColor: "#2d6ea8",
    startMinutes: 7 * 60,
    endMinutes: 8 * 60,
    startDateKey: "2026-11-02",
    repeat: { kind: "days" as const, interval: 1 },
    end: { kind: "never" as const },
  };
  const daily = createWorkItem(fields, "w1", local(2026, 11, 1));

  it("adds a new item and replaces one with the same id", () => {
    const other = { ...daily, id: "w2" };
    expect(saveWorkItem([daily], other).map((item) => item.id)).toEqual(["w1", "w2"]);
    const renamed = saveWorkItem([daily, other], { ...daily, name: "Pool" });
    expect(renamed.map((item) => [item.id, item.name])).toEqual([["w1", "Pool"], ["w2", "Swim"]]);
  });

  it("only this one writes just the change on that date", () => {
    const edited = editWorkItems([daily], "w1", "2026-11-05", { ...fields, startMinutes: 9 * 60 }, "one", () => "unused");
    expect(edited).toHaveLength(1);
    expect(edited![0].exceptions["2026-11-05"]).toEqual({ kind: "change", startMinutes: 540 });
  });

  it("returns null when only this one changed nothing, or the item is gone", () => {
    expect(editWorkItems([daily], "w1", "2026-11-05", fields, "one", () => "unused")).toBeNull();
    expect(editWorkItems([daily], "missing", "2026-11-05", fields, "following", () => "w2")).toBeNull();
  });

  it("this and all following continues in a new series that takes the new colour", () => {
    const edited = editWorkItems([daily], "w1", "2026-11-05", { ...fields, calendarColor: "#e07a5f" }, "following", () => "w2");
    const continued = edited!.find((item) => item.id === "w2");
    expect(continued).toEqual(expect.objectContaining({ calendarColor: "#e07a5f", startDateKey: "2026-11-05" }));
  });
});

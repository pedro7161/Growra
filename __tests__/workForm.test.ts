import {
  addDaysToKey,
  changesSeriesRule,
  draftFromItem,
  draftToFields,
  newWorkDraft,
  parseClock,
  weekStartKey,
} from "../src/utils/workForm";
import { createWorkItem, getOccurrencesBetween } from "../src/utils/workSchedule";

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

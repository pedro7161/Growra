import {
  MAX_TASK_MINUTES,
  durationToInput,
  formatTaskDuration,
  parseTaskDuration,
} from "../src/utils/taskDuration";

const units = { seconds: "s", minutes: "min", hours: "h" };

describe("parseTaskDuration", () => {
  it("converts number + unit to minutes", () => {
    expect(parseTaskDuration("45", "minutes")).toBe(45);
    expect(parseTaskDuration("2", "hours")).toBe(120);
    expect(parseTaskDuration("90", "seconds")).toBe(1.5);
    expect(parseTaskDuration("1.5", "hours")).toBe(90);
    expect(parseTaskDuration("1,5", "hours")).toBe(90);
  });

  it("rejects empty, zero, negative and non-numbers", () => {
    for (const bad of ["", "  ", "0", "-5", "abc", "1e", "NaN", "Infinity"]) {
      expect(parseTaskDuration(bad, "minutes")).toBeNull();
    }
  });

  it("clamps to 24 hours", () => {
    expect(parseTaskDuration("100", "hours")).toBe(MAX_TASK_MINUTES);
    expect(parseTaskDuration("999999", "seconds")).toBe(MAX_TASK_MINUTES);
    expect(MAX_TASK_MINUTES).toBe(1440);
  });
});

describe("formatTaskDuration", () => {
  it("keeps the existing minute and hour formats", () => {
    expect(formatTaskDuration(45, units)).toBe("45 min");
    expect(formatTaskDuration(60, units)).toBe("1 h");
    expect(formatTaskDuration(90, units)).toBe("1 h 30 min");
  });

  it("shows seconds", () => {
    expect(formatTaskDuration(0.75, units)).toBe("45 s");
    expect(formatTaskDuration(1.5, units)).toBe("1 min 30 s");
    expect(formatTaskDuration(61 / 60, units)).toBe("1 min 1 s");
  });
});

describe("durationToInput", () => {
  it("picks the best unit", () => {
    expect(durationToInput(0.75)).toEqual({ value: "45", unit: "seconds" });
    expect(durationToInput(45)).toEqual({ value: "45", unit: "minutes" });
    expect(durationToInput(120)).toEqual({ value: "2", unit: "hours" });
    expect(durationToInput(90)).toEqual({ value: "90", unit: "minutes" });
    expect(durationToInput(1.5)).toEqual({ value: "90", unit: "seconds" });
    expect(durationToInput(2.5)).toEqual({ value: "150", unit: "seconds" });
  });

  it("is empty for none", () => {
    expect(durationToInput(null)).toEqual({ value: "", unit: "minutes" });
    expect(durationToInput(undefined)).toEqual({ value: "", unit: "minutes" });
  });
});

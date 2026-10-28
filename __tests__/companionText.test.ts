import { getAppCopy } from "../src/constants/appCopy";
import { companionDescription, companionLine, getShiftStage, shiftEncouragement } from "../src/utils/companionText";
import type { WorkOccurrence } from "../src/types";
import { getPetTemplates } from "../src/utils/gameplay";

describe("companion descriptions", () => {
  it("has a Portuguese description for every companion", () => {
    const pt = getAppCopy("pt");
    const templates = getPetTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(12);
    for (const template of templates) {
      expect(pt.companionBios[template.id]).toBeTruthy();
      expect(companionDescription(pt, template)).not.toBe(template.description);
    }
  });

  it("keeps the English original in English", () => {
    const en = getAppCopy("en");
    for (const template of getPetTemplates()) {
      expect(companionDescription(en, template)).toBe(template.description);
    }
  });
});

describe("seasonal companion lines", () => {
  const en = getAppCopy("en");
  const at = (month: number, day: number) => new Date(2026, month - 1, day, 12).getTime();

  it("greets the player on the holiday itself", () => {
    expect(companionLine(en, "happy", "Moss", at(10, 31))).toBe("Moss says: Happy Halloween! 🎃");
    expect(companionLine(en, "hello", "Moss", at(12, 24))).toContain("Merry Christmas Eve");
    expect(companionLine(en, "glowing", "Moss", at(12, 25))).toContain("Merry Christmas!");
    expect(companionLine(en, "hello", "Moss", new Date(2027, 0, 1, 12).getTime())).toContain("Happy New Year");
  });

  it("uses the season's mood lines during the season, and keeps a sleeping companion asleep", () => {
    expect(companionLine(en, "glowing", "Moss", at(10, 20))).toContain("jack-o'-lantern");
    expect(companionLine(en, "sleepy", "Moss", at(12, 25))).toContain("napping by the fire");
    expect(companionLine(en, "happy", "Moss", at(6, 1))).toBe("Moss is happy with today.");
  });

  it("has every seasonal line in Portuguese too", () => {
    const pt = getAppCopy("pt");
    for (const season of ["halloween", "christmas"] as const) {
      for (const mood of ["hello", "happy", "glowing", "sleepy"] as const) {
        expect(pt.companionSeasonMood[season][mood]).toContain("{name}");
        expect(pt.companionSeasonMood[season][mood]).not.toBe(en.companionSeasonMood[season][mood]);
      }
    }
    for (const holiday of ["halloween", "christmasEve", "christmas", "newYear"] as const) {
      expect(pt.companionHolidayGreeting[holiday]).toContain("{name}");
    }
  });
});

describe("shift encouragement", () => {
  const H = 60 * 60 * 1000;
  const shift = (hours: number): WorkOccurrence => ({
    itemId: "w", dateKey: "2026-10-28", start: 1_000_000_000_000, end: 1_000_000_000_000 + hours * H,
    name: "Shift", description: "", calendarColor: "#000", completed: false,
  });

  it("finds the stage of an 8 hour shift", () => {
    const o = shift(8);
    expect(getShiftStage(o, o.start + 0.5 * H)).toBe("start");
    expect(getShiftStage(o, o.start + 4 * H)).toBe("middle");
    expect(getShiftStage(o, o.start + 7.5 * H)).toBe("last-hour");
  });

  it("lets the last hour win in short shifts", () => {
    const two = shift(2);
    expect(getShiftStage(two, two.start + 0.5 * H)).toBe("start");
    expect(getShiftStage(two, two.start + 1.5 * H)).toBe("last-hour");
    const one = shift(1);
    expect(getShiftStage(one, one.start)).toBe("last-hour");
  });

  it("names the pet and has own Portuguese lines for every stage", () => {
    const en = getAppCopy("en");
    const pt = getAppCopy("pt");
    for (const stage of ["start", "middle", "last-hour"] as const) {
      const key = stage === "start" ? "shiftLinesStart" : stage === "middle" ? "shiftLinesMiddle" : "shiftLinesLastHour";
      expect(pt[key].length).toBeGreaterThanOrEqual(3);
      expect(en[key].length).toBeGreaterThanOrEqual(3);
      pt[key].forEach((line, i) => {
        expect(line.trim()).not.toBe("");
        expect(line).not.toBe(en[key][i]);
      });
      for (let slot = 0; slot < 8; slot++) {
        const now = slot * 15 * 60 * 1000;
        expect(shiftEncouragement(en, stage, "Moss", now)).not.toContain("{name}");
        expect(shiftEncouragement(pt, stage, "Moss", now)).not.toContain("{name}");
      }
    }
    const names = [0, 1, 2, 3].map((n) => shiftEncouragement(en, "middle", "Moss", n * 15 * 60 * 1000));
    expect(names.some((l) => l.includes("Moss"))).toBe(true);
    expect(shiftEncouragement(en, "middle", "Moss", 5)).toBe(shiftEncouragement(en, "middle", "Moss", 5));
  });
});

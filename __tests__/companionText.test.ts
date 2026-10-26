import { getAppCopy } from "../src/constants/appCopy";
import { companionDescription, companionLine } from "../src/utils/companionText";
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

import { getAppCopy } from "../src/constants/appCopy";
import { companionDescription } from "../src/utils/companionText";
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

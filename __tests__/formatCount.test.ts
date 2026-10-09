import { formatCount } from "../src/utils/formatCount";

describe("formatCount", () => {
  it("groups digits so big counts stay readable", () => {
    expect(formatCount(1234567, "en-US")).toBe("1,234,567");
    expect(formatCount(1234567, "pt-PT").replace(/\s/g, " ")).toBe("1 234 567");
  });

  it("leaves small numbers alone and drops fractions", () => {
    expect(formatCount(36, "en-US")).toBe("36");
    expect(formatCount(999.6, "en-US")).toBe("1,000");
  });
});

import { categorySuggestions, matchExistingCategory } from "../src/utils/categorySuggestions";

describe("categorySuggestions", () => {
  it("lists the most used categories first and merges case-only duplicates", () => {
    expect(categorySuggestions(["home", "Work", "work", "work", "study", "home", " "])).toEqual(["work", "home", "study"]);
  });

  it("keeps at most the limit", () => {
    expect(categorySuggestions(["a", "b", "c"], 2)).toHaveLength(2);
  });
});

describe("matchExistingCategory", () => {
  it("reuses the existing spelling for the same letters", () => {
    expect(matchExistingCategory("  Work ", ["work", "home"])).toBe("work");
  });

  it("keeps a new category as typed, trimmed", () => {
    expect(matchExistingCategory(" Gym ", ["work"])).toBe("Gym");
  });
});

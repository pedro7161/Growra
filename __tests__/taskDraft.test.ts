import { customTaskDraftProblem } from "../src/utils/taskDraft";

describe("custom task draft", () => {
  it("saves a task with a name but no category (category is optional)", () => {
    expect(customTaskDraftProblem({ name: "Buy milk", category: "" })).toBeNull();
    expect(customTaskDraftProblem({ name: "Buy milk", category: "   " })).toBeNull();
  });

  it("saves a task with both a name and a category", () => {
    expect(customTaskDraftProblem({ name: "Buy milk", category: "home" })).toBeNull();
  });

  it("still refuses a task without a name, with or without a category", () => {
    expect(customTaskDraftProblem({ name: "", category: "" })).toBe("name-missing");
    expect(customTaskDraftProblem({ name: "   ", category: "" })).toBe("name-missing");
    expect(customTaskDraftProblem({ name: "", category: "home" })).toBe("name-missing");
  });
});

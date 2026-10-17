import { CustomTaskTemplate } from "../src/types";
import { categorySuggestions, matchExistingCategory } from "../src/utils/categorySuggestions";
import { getCustomTaskTemplateGroups } from "../src/utils/customTaskTemplates";
import { taskCategoryLabel } from "../src/utils/taskLabels";

function template(name: string, category: string): CustomTaskTemplate {
  return { id: name, name, description: "", category, createdAt: 0 };
}

describe("custom task template groups", () => {
  it("groups templates by category", () => {
    const groups = getCustomTaskTemplateGroups([
      template("Buy milk", "home"),
      template("Pay rent", "finance"),
      template("Hoover", "home"),
    ]);

    expect(groups.map((group) => group.category)).toEqual(["home", "finance"]);
    expect(groups[0].tasks.map((task) => task.name)).toEqual(["Buy milk", "Hoover"]);
  });

  // #47: a template saved with no category keys its group on "", which printed an empty
  // header row. The group header shows the translated uncategorised label instead.
  // #47: the category chips in AddTaskModal and TaskDetailsModal are both built from the
  // saved templates' categories. A template saved without one must not produce an empty
  // chip - which would also render as "selected" while the field is blank.
  it("offers no chip for a template saved without a category", () => {
    const templates = [template("Buy milk", ""), template("Pay rent", "finance")];
    const chips = categorySuggestions(
      templates.map((item) => item.category),
      Number.MAX_SAFE_INTEGER,
    );

    // The blank is gone, so no empty chip - and the real category survives, so it can
    // still be shown as selected.
    expect(chips).toEqual(["finance"]);
    expect(chips).not.toContain("");
  });

  // The chip list keeps one spelling per category, so the task details modal resolves the
  // task's own category to that spelling before deciding which chip is selected. Comparing
  // raw would leave a task filed under "Work" with no chip highlighted at all.
  it("highlights the surviving chip for a task whose category differs only in case", () => {
    const templates = [template("Report", "Work"), template("Email", "Work"), template("Tidy", "work")];
    const chips = categorySuggestions(
      templates.map((item) => item.category),
      Number.MAX_SAFE_INTEGER,
    );

    expect(chips).toEqual(["Work"]);
    expect(matchExistingCategory("work", chips)).toBe("Work");
    expect(matchExistingCategory("Work", chips)).toBe("Work");
    // A task with no category still highlights nothing.
    expect(chips).not.toContain(matchExistingCategory("", chips));
  });

  // The task details modal has never capped its chips: truncating them could hide the
  // category the task being edited is actually using.
  it("keeps every category a player has, past the default suggestion limit", () => {
    const templates = Array.from({ length: 12 }, (_unused, index) =>
      template(`Task ${index}`, `category-${index}`),
    );
    const chips = categorySuggestions(
      templates.map((item) => item.category),
      Number.MAX_SAFE_INTEGER,
    );

    expect(chips).toHaveLength(12);
    expect(chips).toContain("category-11");
  });

  it("shows the uncategorised label for a template saved without a category", () => {
    const [group] = getCustomTaskTemplateGroups([template("Buy milk", "")]);

    expect(group.category).toBe("");
    expect(taskCategoryLabel("en", group.category)).toBe("Uncategorised");
    expect(taskCategoryLabel("pt", group.category)).toBe("Sem categoria");
  });
});

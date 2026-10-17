import { CustomTaskTemplate } from "../src/types";
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
  it("shows the uncategorised label for a template saved without a category", () => {
    const [group] = getCustomTaskTemplateGroups([template("Buy milk", "")]);

    expect(group.category).toBe("");
    expect(taskCategoryLabel("en", group.category)).toBe("Uncategorised");
    expect(taskCategoryLabel("pt", group.category)).toBe("Sem categoria");
  });
});

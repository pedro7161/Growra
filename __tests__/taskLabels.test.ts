import { getAppCopy } from "../src/constants/appCopy";
import { TaskFrequency, TaskStatus } from "../src/types";
import { taskCategoryLabel, taskFrequencyLabel, taskStatusLabel } from "../src/utils/taskLabels";

describe("task labels", () => {
  it("translates the frequency instead of showing the raw value", () => {
    const pt = getAppCopy("pt");
    expect(taskFrequencyLabel(pt, TaskFrequency.ONCE)).toBe("Uma vez");
    expect(taskFrequencyLabel(pt, TaskFrequency.DAILY)).toBe("Diária");
    expect(taskFrequencyLabel(pt, TaskFrequency.WEEKLY)).toBe("Semanal");
    expect(taskFrequencyLabel(getAppCopy("en"), TaskFrequency.DAILY)).toBe("Daily");
  });

  it("translates the task status", () => {
    const pt = getAppCopy("pt");
    expect(taskStatusLabel(pt, TaskStatus.PENDING)).toBe("Pendente");
    expect(taskStatusLabel(pt, TaskStatus.COMPLETED)).toBe("Concluída");
    expect(taskStatusLabel(getAppCopy("en"), TaskStatus.COMPLETED)).toBe("Completed");
  });

  // #47: category is optional, so a task can have none. It shows a translated
  // "uncategorised" label instead of an empty gap.
  it("shows a translated uncategorised label when a task has no category", () => {
    expect(taskCategoryLabel("en", "")).toBe(getAppCopy("en").taskCategoryNone);
    expect(taskCategoryLabel("pt", "")).toBe(getAppCopy("pt").taskCategoryNone);
    expect(taskCategoryLabel("en", "   ")).toBe(getAppCopy("en").taskCategoryNone);
    expect(getAppCopy("en").taskCategoryNone).toBe("No category");
    expect(getAppCopy("pt").taskCategoryNone).toBe("Sem categoria");
  });

  it("still shows a real category as it is", () => {
    expect(taskCategoryLabel("en", "home")).toBe("home");
    expect(taskCategoryLabel("pt", "health")).toBe("saúde");
  });

  it("has a timer label in every language", () => {
    expect(getAppCopy("en").timerLabel).toBe("Timer");
    expect(getAppCopy("pt").timerLabel).toBe("Temporizador");
  });
});

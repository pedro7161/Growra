import { getAppCopy } from "../src/constants/appCopy";
import { TaskFrequency, TaskStatus } from "../src/types";
import { taskFrequencyLabel, taskStatusLabel } from "../src/utils/taskLabels";

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

  it("has a timer label in every language", () => {
    expect(getAppCopy("en").timerLabel).toBe("Timer");
    expect(getAppCopy("pt").timerLabel).toBe("Temporizador");
  });
});

import { getAppCopy } from "../constants/appCopy";
import { AppLanguage, TaskFrequency, TaskStatus } from "../types";

type AppCopy = ReturnType<typeof getAppCopy>;

/** The translated frequency shown on a task ("Daily" / "Diária"), never the raw enum value. */
export function taskFrequencyLabel(copy: AppCopy, frequency: TaskFrequency): string {
  if (frequency === TaskFrequency.DAILY) return copy.addTaskDaily;
  if (frequency === TaskFrequency.WEEKLY) return copy.addTaskWeekly;
  return copy.addTaskOnce;
}

export function taskStatusLabel(copy: AppCopy, status: TaskStatus): string {
  return status === TaskStatus.COMPLETED ? copy.taskStatusCompleted : copy.taskStatusPending;
}

/** Portuguese names for the built-in task categories (the ones ready-made tasks use). */
const CATEGORY_PT: Record<string, string> = {
  finance: "finanças",
  fitness: "exercício",
  focus: "foco",
  health: "saúde",
  home: "casa",
  mindset: "mente",
  social: "social",
  study: "estudo",
};

/**
 * A task's category as shown: built-in categories are translated, the player's own stay as
 * typed, and a task saved without a category shows the translated "no category" label.
 */
export function taskCategoryLabel(language: AppLanguage, category: string): string {
  const name = category.trim();
  if (!name) return getAppCopy(language).taskCategoryNone;
  if (language !== "pt") return name;
  return CATEGORY_PT[name.toLowerCase()] ?? name;
}

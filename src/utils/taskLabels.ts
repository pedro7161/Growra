import { getAppCopy } from "../constants/appCopy";
import { TaskFrequency, TaskStatus } from "../types";

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

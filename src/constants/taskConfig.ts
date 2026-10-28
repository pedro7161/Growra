import { TaskPriority } from "../types";

export const DEFAULT_TASK_CALENDAR_COLOR = "#1f7a73";

export const taskCalendarColors = [
  "#1f7a73",
  "#2d6ea8",
  "#c05a2f",
  "#8f5bd6",
  "#d35454",
  "#2ca58d",
  "#d48a1d",
  "#556b2f",
];

export const taskPriorityOptions: TaskPriority[] = [
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
];

/** Task lengths offered by the form chips, in minutes. */
export const taskDurationOptions: number[] = [15, 30, 45, 60, 120, 240, 480];

/** "45 min" / "1 h" / "1 h 30 min" for a task length. */
export function formatTaskDuration(
  minutes: number,
  units: { minutes: string; hours: string },
): string {
  if (minutes < 60) return `${minutes} ${units.minutes}`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0
    ? `${hours} ${units.hours}`
    : `${hours} ${units.hours} ${rest} ${units.minutes}`;
}

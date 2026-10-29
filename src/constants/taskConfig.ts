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

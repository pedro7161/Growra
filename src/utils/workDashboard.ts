import { Group, Task, TaskPriority, WorkOccurrence, WorkItem } from "../types";
import { getTodayTasks } from "./taskSchedule";
import { addDaysToKey } from "./workForm";
import { getOccurrencesBetween, toDateKey, dateKeyToStart } from "./workSchedule";

/** Shifts that start today, plus a shift from yesterday that runs past midnight and is not confirmed yet. */
export function getTodayWorkOccurrences(items: WorkItem[], now: number): WorkOccurrence[] {
  const todayKey = toDateKey(now);
  const todayStart = dateKeyToStart(todayKey);
  const yesterdayKey = addDaysToKey(todayKey, -1);
  const tomorrowKey = addDaysToKey(todayKey, 1);
  return getOccurrencesBetween(items, yesterdayKey, tomorrowKey).filter(
    (o) => o.dateKey === todayKey || (!o.completed && o.end > todayStart),
  );
}

/** Puts the shift to work on next (running now, else the next to start) first; the rest keep their order. */
export function nextFirst(occurrences: WorkOccurrence[], now: number): WorkOccurrence[] {
  const next = occurrences.find((o) => !o.completed && o.end > now);
  return next ? [next, ...occurrences.filter((o) => o !== next)] : occurrences;
}

const PRIORITY_RANK: Record<TaskPriority, number> = {
  [TaskPriority.HIGH]: 0,
  [TaskPriority.MEDIUM]: 1,
  [TaskPriority.LOW]: 2,
};

/** Moves the next task to do (highest priority, then name) to the front; the rest keep their order. */
export function nextTaskFirst(tasks: Task[]): Task[] {
  if (tasks.length < 2) return tasks;
  const next = tasks.reduce((best, task) =>
    (PRIORITY_RANK[task.priority] - PRIORITY_RANK[best.priority] || task.name.localeCompare(best.name)) < 0 ? task : best,
  );
  return [next, ...tasks.filter((task) => task !== next)];
}

export type GroupNextItem = { kind: "task"; task: Task } | { kind: "occurrence"; occurrence: WorkOccurrence };

/** The one item a group shows on the dashboard, or null when it has nothing left today. */
export function groupNextItem(group: Group, now: number): GroupNextItem | null {
  if (group.kind === "list") {
    const task = nextTaskFirst(getTodayTasks(group.tasks, now))[0];
    return task ? { kind: "task", task } : null;
  }
  const open = getTodayWorkOccurrences(group.workItems, now).filter((o) => !o.completed);
  const occurrence = nextFirst(open, now)[0];
  return occurrence ? { kind: "occurrence", occurrence } : null;
}

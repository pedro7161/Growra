import { Task } from "../types";

/** Identifier of a task timer's "time's up" notification. */
export const timerNotificationId = (taskId: string) => `timer-${taskId}`;
export const DAILY_REMINDER_ID = "daily-reminder";

export interface ScheduledTimerNotification {
  id: string;
  /** When it fires (ms since epoch). */
  fireAt: number;
}

export interface TimerNotificationPlan {
  cancel: string[];
  schedule: { id: string; taskId: string; taskName: string; fireAt: number }[];
}

/** Fire times within this window count as the same (the timer's own clock drifts by a few ms). */
const SAME_TIME_MS = 1500;

/**
 * Which timer notifications to cancel and schedule so that exactly the running timers have one,
 * firing when they end (#38). Pure, so every path (start, pause, reset, finish, complete, delete,
 * import) is covered by running it after each save.
 */
export function planTimerNotifications(
  tasks: readonly Task[],
  scheduled: readonly ScheduledTimerNotification[],
  now: number,
): TimerNotificationPlan {
  const wanted = new Map<string, { taskId: string; taskName: string; fireAt: number }>();
  for (const task of tasks) {
    const { timer } = task;
    if (!timer.enabled || timer.state !== "running") continue;
    const fireAt = timer.startedAt + timer.remainingMs;
    if (fireAt <= now) continue;
    wanted.set(timerNotificationId(task.id), { taskId: task.id, taskName: task.name, fireAt });
  }

  const cancel: string[] = [];
  const kept = new Set<string>();
  for (const notification of scheduled) {
    const want = wanted.get(notification.id);
    if (want && Math.abs(want.fireAt - notification.fireAt) <= SAME_TIME_MS) {
      kept.add(notification.id);
    } else {
      cancel.push(notification.id);
    }
  }

  const schedule = [...wanted.entries()]
    .filter(([id]) => !kept.has(id))
    .map(([id, want]) => ({ id, ...want }));
  return { cancel, schedule };
}

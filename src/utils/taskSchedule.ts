import { GameState, Task, TaskFrequency, TaskStatus } from "../types";
import { resetTaskTimer } from "./taskTimer";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function getStartOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

// Calendar arithmetic, not millisecond arithmetic: days are 23h or 25h long across a
// daylight-saving change, so "+ 24h" would land on the wrong day.
export function addDaysToStartOfDay(timestamp: number, days: number): number {
  const date = new Date(getStartOfDay(timestamp));
  date.setDate(date.getDate() + days);
  return date.getTime();
}

export function getStartOfNextDay(timestamp: number): number {
  return addDaysToStartOfDay(timestamp, 1);
}

export function getStartOfNextWeek(timestamp: number): number {
  return addDaysToStartOfDay(timestamp, 7);
}

// Whole calendar days between two timestamps. Rounds because a DST day is 23h or 25h.
export function getCalendarDayDifference(previousTimestamp: number, nextTimestamp: number): number {
  return Math.round((getStartOfDay(nextTimestamp) - getStartOfDay(previousTimestamp)) / DAY_IN_MS);
}

export function getNextAvailableDate(task: Task, completedAt: number): number {
  if (task.frequency === TaskFrequency.DAILY) {
    return getStartOfNextDay(completedAt);
  }

  if (task.frequency === TaskFrequency.WEEKLY) {
    return getStartOfNextWeek(completedAt);
  }

  return completedAt;
}

export function isTaskAvailable(task: Task, now: number): boolean {
  return task.status === TaskStatus.PENDING && task.dueDate <= now;
}

export function getTodayTasks(tasks: Task[], now: number): Task[] {
  return tasks.filter((task) => isTaskAvailable(task, now));
}

export function syncTask(task: Task, now: number): Task {
  if (task.status === TaskStatus.PENDING) {
    return task;
  }

  if (task.frequency === TaskFrequency.ONCE) {
    return task;
  }

  if (task.dueDate > now) {
    return task;
  }

  const resetTimer = resetTaskTimer(task);

  return {
    ...resetTimer,
    status: TaskStatus.PENDING,
  };
}

export function syncRecurringTasks(gameState: GameState, now: number = Date.now()): GameState {
  let hasChanges = false;

  const tasks = gameState.tasks.map((task) => {
    const syncedTask = syncTask(task, now);

    if (syncedTask !== task) {
      hasChanges = true;
    }

    return syncedTask;
  });

  if (!hasChanges) {
    return gameState;
  }

  return {
    ...gameState,
    tasks,
    lastPlayedAt: now,
  };
}

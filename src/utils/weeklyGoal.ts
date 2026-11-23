import { DayRecord } from "../types";
import { addDaysToStartOfDay, getStartOfDay } from "./taskSchedule";

/** Goals stay modest: 1 to 50 tasks a week. 0 means no goal (the default). */
export const WEEKLY_GOAL_MIN = 1;
export const WEEKLY_GOAL_MAX = 50;
export const WEEKLY_GOAL_DEFAULT = 5;

/** Reads a stored goal; anything that is not a whole number in range means "no goal". */
export function normalizeWeeklyGoal(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= WEEKLY_GOAL_MIN && value <= WEEKLY_GOAL_MAX
    ? value
    : 0;
}

/** Steps a goal up or down inside the allowed range. */
export function stepWeeklyGoal(goal: number, delta: number): number {
  return Math.min(WEEKLY_GOAL_MAX, Math.max(WEEKLY_GOAL_MIN, goal + delta));
}

/** Local midnight of the Monday that starts the week containing `now` (same Monday-first weeks as the calendar). */
export function getWeekStart(now: number): number {
  const today = getStartOfDay(now);
  return addDaysToStartOfDay(today, -((new Date(today).getDay() + 6) % 7));
}

export interface WeeklyGoalProgress {
  /** Start of this local week (Monday). */
  weekStart: number;
  goal: number;
  done: number;
  met: boolean;
  /** Tasks left to reach the goal, never negative. */
  remaining: number;
}

/**
 * Progress for the current local week, summed from the saved `days` records only (the same
 * records the weekly summary and the history calendar read), so nothing is counted twice and
 * nothing extra is stored. Week edges are local midnights, so daylight-saving days and
 * changes of time zone only move which records fall in the week. Missing a goal changes nothing.
 */
export function getWeeklyGoalProgress(days: DayRecord[], goal: number, now: number): WeeklyGoalProgress {
  const weekStart = getWeekStart(now);
  const nextWeek = addDaysToStartOfDay(weekStart, 7);
  const done = days.reduce((sum, record) => {
    const day = getStartOfDay(record.date);
    return day >= weekStart && day < nextWeek ? sum + record.done : sum;
  }, 0);
  return { weekStart, goal, done, met: goal > 0 && done >= goal, remaining: Math.max(0, goal - done) };
}

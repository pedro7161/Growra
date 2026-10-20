import { GameState } from "../types";
import { getActiveDayRecords } from "./journey";
import { getCalendarDayDifference } from "./taskSchedule";

/** Days away (by calendar) before the dashboard welcomes the player back (#53). */
export const RETURN_AWAY_DAYS = 2;
/** Active days before the one-time backup card appears (#54): about a week of real use. */
export const BACKUP_NUDGE_ACTIVE_DAYS = 7;
const RECAP_DAYS = 7;

export interface ReturnRecap {
  awayDays: number;
  /** Active days the recap covers (up to 7). */
  days: number;
  done: number;
  focus: number;
}

/**
 * What the player did on their last active days, shown when they come back after 2+ days away.
 * Purely descriptive (#53): it reports what happened, never what to do next, and has no streak
 * language. Null when they weren't away long enough, or have no history to show.
 */
export function getReturnRecap(state: GameState, lastSeenAt: number, now: number): ReturnRecap | null {
  if (!lastSeenAt) return null;
  const awayDays = getCalendarDayDifference(lastSeenAt, now);
  if (awayDays < RETURN_AWAY_DAYS) return null;
  const recent = getActiveDayRecords(state.days).slice(-RECAP_DAYS);
  if (recent.length === 0) return null;
  return {
    awayDays,
    days: recent.length,
    done: recent.reduce((sum, day) => sum + day.done, 0),
    focus: recent.reduce((sum, day) => sum + day.timersFinished, 0),
  };
}

/** The backup card shows once, after about a week of use, and never again (#54). */
export function shouldShowBackupNudge(state: GameState): boolean {
  return !state.backupNudgeShown && getActiveDayRecords(state.days).length >= BACKUP_NUDGE_ACTIVE_DAYS;
}

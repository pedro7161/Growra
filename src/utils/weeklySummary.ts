import { DayRecord } from "../types";
import { addDaysToStartOfDay, getStartOfDay } from "./taskSchedule";

/** The summary covers today and the six local calendar days before it (#76). */
export const SUMMARY_DAYS = 7;

export interface SummaryDay {
  /** Start of this local calendar day. */
  date: number;
  done: number;
  /** False for days before Growra started tracking; those are left out, never counted as empty. */
  tracked: boolean;
}

export interface WeeklySummary {
  /** Oldest day first, always SUMMARY_DAYS entries. */
  days: SummaryDay[];
  totalDone: number;
  recurringDone: number;
  focusSessions: number;
  /** Tracked days with at least one task done. */
  activeDays: number;
  /** Days in the window that Growra was already tracking. */
  trackedDays: number;
  /** Nothing done on any tracked day. */
  empty: boolean;
}

/**
 * Looks back over the last 7 calendar days using only what is already saved in `days`
 * (one record per day something was done). Day edges are local midnights, so a 23h or 25h
 * daylight-saving day is still one day. Days before tracking began (the save's creation or
 * its earliest record, whichever is older) are marked untracked instead of counted as zero.
 * Purely descriptive: no streak, no goal, no comparison.
 */
export function getWeeklySummary(days: DayRecord[], createdAt: number, now: number): WeeklySummary {
  const today = getStartOfDay(now);
  const starts = [
    ...(createdAt > 0 ? [getStartOfDay(createdAt)] : []),
    ...days.map((record) => getStartOfDay(record.date)),
  ];
  const trackingStart = starts.length > 0 ? Math.min(...starts) : today;

  const window: SummaryDay[] = [];
  let recurringDone = 0;
  let focusSessions = 0;
  for (let offset = SUMMARY_DAYS - 1; offset >= 0; offset--) {
    const date = addDaysToStartOfDay(today, -offset);
    const records = days.filter((record) => getStartOfDay(record.date) === date);
    const done = records.reduce((sum, record) => sum + record.done, 0);
    recurringDone += records.reduce((sum, record) => sum + record.recurringDone, 0);
    focusSessions += records.reduce((sum, record) => sum + record.timersFinished, 0);
    window.push({ date, done, tracked: date >= trackingStart });
  }

  const totalDone = window.reduce((sum, day) => sum + day.done, 0);
  return {
    days: window,
    totalDone,
    recurringDone,
    focusSessions,
    activeDays: window.filter((day) => day.tracked && day.done > 0).length,
    trackedDays: window.filter((day) => day.tracked).length,
    empty: totalDone === 0,
  };
}

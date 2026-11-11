import { DayRecord } from "../types";
import { getStartOfDay } from "./taskSchedule";

/**
 * Read-only look at the saved `days` records for the history calendar (#79).
 * Day edges are local midnights, so month/year rollover and 23h/25h daylight-saving days
 * stay one day each. Nothing is reconstructed: a day Growra was not yet tracking is "untracked",
 * which is different from a tracked day with nothing done ("none").
 */

export type HistoryDayStatus = "future" | "untracked" | "none" | "done";

export interface HistoryDay {
  /** Start of this local calendar day. */
  date: number;
  status: HistoryDayStatus;
  done: number;
  recurringDone: number;
  timersFinished: number;
  /** Saved completions, oldest first. The list is capped when saved, so it can be shorter than `done`. */
  completions: { name: string; at: number }[];
  /** True when more tasks were done than the saved list names. */
  truncated: boolean;
}

export interface MonthHistory {
  year: number;
  /** 0-11. */
  month: number;
  days: HistoryDay[];
  /** Index (0 = Monday) of the weekday the month starts on, for building a grid. */
  mondayOffset: number;
}

export type HistoryIndex = Map<number, DayRecord[]>;

/** Groups records by local day once, so each lookup afterwards is O(1) however long the history. */
export function indexDays(days: DayRecord[]): HistoryIndex {
  const index: HistoryIndex = new Map();
  for (const record of days) {
    const key = getStartOfDay(record.date);
    const list = index.get(key);
    if (list) list.push(record);
    else index.set(key, [record]);
  }
  return index;
}

/** The first local day Growra can speak for: the save's creation or its earliest record, whichever is older. */
export function getTrackingStart(index: HistoryIndex, createdAt: number, now: number): number {
  let start = createdAt > 0 ? getStartOfDay(createdAt) : Infinity;
  for (const key of index.keys()) if (key < start) start = key;
  return start === Infinity ? getStartOfDay(now) : start;
}

export function getHistoryDay(index: HistoryIndex, dayStart: number, createdAt: number, now: number): HistoryDay {
  const date = getStartOfDay(dayStart);
  const records = index.get(date) ?? [];
  const done = records.reduce((sum, record) => sum + record.done, 0);
  const completions = records
    .flatMap((record) => record.completions)
    .sort((a, b) => a.at - b.at);
  let status: HistoryDayStatus;
  if (date > getStartOfDay(now)) status = "future";
  else if (date < getTrackingStart(index, createdAt, now)) status = "untracked";
  else status = done > 0 ? "done" : "none";
  return {
    date,
    status,
    done,
    recurringDone: records.reduce((sum, record) => sum + record.recurringDone, 0),
    timersFinished: records.reduce((sum, record) => sum + record.timersFinished, 0),
    completions,
    truncated: done > completions.length,
  };
}

export function getMonthHistory(
  index: HistoryIndex,
  year: number,
  month: number,
  createdAt: number,
  now: number
): MonthHistory {
  // Normalise through Date so month -1 / 12 roll the year over.
  const first = new Date(year, month, 1);
  const length = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const trackingStart = getTrackingStart(index, createdAt, now);
  const today = getStartOfDay(now);
  const days: HistoryDay[] = [];
  for (let day = 1; day <= length; day++) {
    const date = new Date(first.getFullYear(), first.getMonth(), day).getTime();
    days.push(
      date > today || date < trackingStart
        ? emptyDay(date, date > today ? "future" : "untracked")
        : getHistoryDay(index, date, createdAt, now)
    );
  }
  return { year: first.getFullYear(), month: first.getMonth(), days, mondayOffset: (first.getDay() + 6) % 7 };
}

function emptyDay(date: number, status: HistoryDayStatus): HistoryDay {
  return { date, status, done: 0, recurringDone: 0, timersFinished: 0, completions: [], truncated: false };
}

/** Moves a month by `delta`, rolling the year over in both directions. */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const moved = new Date(year, month + delta, 1);
  return { year: moved.getFullYear(), month: moved.getMonth() };
}

/** Months the history view may show: from the tracking start's month to the current month. */
export function getMonthBounds(
  index: HistoryIndex,
  createdAt: number,
  now: number
): { first: { year: number; month: number }; last: { year: number; month: number } } {
  const start = new Date(getTrackingStart(index, createdAt, now));
  const today = new Date(now);
  return {
    first: { year: start.getFullYear(), month: start.getMonth() },
    last: { year: today.getFullYear(), month: today.getMonth() },
  };
}


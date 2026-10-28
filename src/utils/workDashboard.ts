import { WorkOccurrence, WorkItem } from "../types";
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

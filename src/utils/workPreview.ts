import { getAppCopy } from "../constants/appCopy";
import { AppSettings, WorkItem } from "../types";
import { getOccurrencesBetween, getRunningOccurrence, toDateKey } from "./workSchedule";

const pad = (n: number) => String(n).padStart(2, "0");

/** "07:00" in local time. */
export const formatClock = (ts: number) => `${pad(new Date(ts).getHours())}:${pad(new Date(ts).getMinutes())}`;

/**
 * One-line summary for the Work card on the Tasks chooser: the running shift, else the next of today's shifts
 * that hasn't ended, else a note that today's shifts are over (or that there were none), or a prompt to set up.
 */
export function buildWorkPreview(items: WorkItem[], now: number, settings: AppSettings): string {
  const copy = getAppCopy(settings.language);
  if (items.length === 0) return copy.tasksChooseWorkSetup;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const today = getOccurrencesBetween(items, toDateKey(now), toDateKey(tomorrow.getTime()));
  const shift = getRunningOccurrence(items, now) ?? today.find((o) => !o.completed && o.end > now);
  if (shift) return `${copy.tasksChooseWorkShift} ${formatClock(shift.start)}–${formatClock(shift.end)}`;
  return today.length > 0 ? copy.tasksChooseWorkNoMore : copy.tasksChooseWorkNone;
}

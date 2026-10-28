import { getAppCopy } from "../constants/appCopy";
import type { WorkOccurrence } from "../types";
import type { CompanionMood } from "./companions";
import { currentSeason, holidayOn } from "./seasons";

type AppCopy = ReturnType<typeof getAppCopy>;

/** A companion's description in the app's language, falling back to the English original. */
export function companionDescription(copy: AppCopy, template: { id: string; description: string }): string {
  return copy.companionBios[template.id] ?? template.description;
}

/**
 * The companion's line on the dashboard: a holiday greeting on the day itself (unless it is
 * asleep), a seasonal mood line during Halloween and Christmas, the plain mood line otherwise.
 */
export function companionLine(copy: AppCopy, mood: CompanionMood, name: string, now: number = Date.now()): string {
  const holiday = holidayOn(now);
  const season = currentSeason(now);
  const line =
    holiday && mood !== "sleepy"
      ? copy.companionHolidayGreeting[holiday]
      : season
        ? copy.companionSeasonMood[season][mood]
        : copy.companionMood[mood];
  return line.replace("{name}", name);
}

export type ShiftStage = "start" | "middle" | "last-hour";

const HOUR_MS = 60 * 60 * 1000;
const SHIFT_LINE_ROTATION_MS = 15 * 60 * 1000;

/**
 * Where a running shift is: its first hour, its final hour, or between. The final hour wins, so a
 * shift of 2 hours or less is "start" until its last hour begins and "last-hour" from then on.
 */
export function getShiftStage(o: WorkOccurrence, now: number): ShiftStage {
  if (o.end - now <= HOUR_MS) return "last-hour";
  if (now - o.start < HOUR_MS) return "start";
  return "middle";
}

/** The companion's encouragement for a shift stage; the line changes every 15 minutes. */
export function shiftEncouragement(copy: AppCopy, stage: ShiftStage, petName: string, now: number): string {
  const lines =
    stage === "start" ? copy.shiftLinesStart : stage === "last-hour" ? copy.shiftLinesLastHour : copy.shiftLinesMiddle;
  const slot = Math.floor(now / SHIFT_LINE_ROTATION_MS);
  return lines[slot % lines.length].replace("{name}", petName);
}

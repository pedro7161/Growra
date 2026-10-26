import { getAppCopy } from "../constants/appCopy";
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

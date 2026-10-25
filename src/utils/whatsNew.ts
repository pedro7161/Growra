import { getReleaseNotes, ChangelogEntry } from "../constants/changelog";
import { AppLanguage } from "../types";

/**
 * The notes to show on this launch (#64): the installed version's, on every launch until the
 * player ticks "don't show again" for that version; the next version with notes shows again.
 * Players still in the tutorial skip them.
 */
export function whatsNewToShow(
  whatsNewHiddenFor: string,
  appVersion: string,
  tutorialCompleted: boolean,
  language: AppLanguage,
): ChangelogEntry | null {
  if (whatsNewHiddenFor === appVersion || !tutorialCompleted) return null;
  return getReleaseNotes(language, appVersion) ?? null;
}

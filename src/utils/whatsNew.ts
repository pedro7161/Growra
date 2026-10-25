import { getReleaseNotes, ChangelogEntry } from "../constants/changelog";
import { AppLanguage } from "../types";

/**
 * The notes to show on this launch (#64): only after an update (a fresh install starts with
 * lastSeenVersion set to its own version), only once per version, and only if the version has
 * notes. Players still in the tutorial skip them.
 */
export function whatsNewToShow(
  lastSeenVersion: string,
  appVersion: string,
  tutorialCompleted: boolean,
  language: AppLanguage,
): ChangelogEntry | null {
  if (lastSeenVersion === appVersion || !tutorialCompleted) return null;
  return getReleaseNotes(language, appVersion) ?? null;
}

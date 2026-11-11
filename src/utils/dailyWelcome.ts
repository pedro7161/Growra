import { GameState } from "../types";

/**
 * Coins in the daily welcome (#75). Kept at or below the smallest flat daily coin perk (2, a
 * companion's first-of-day bonus) so it is a greeting, not an income source.
 */
export const DAILY_WELCOME_COINS = 2;

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** The local calendar day as YYYY-MM-DD (the device's timezone at that moment). */
export function localDayKey(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${String(date.getFullYear()).padStart(4, "0")}-${month}-${day}`;
}

/** A stored claim day, or "" when it is missing or not a YYYY-MM-DD string (old or damaged saves). */
export function normalizeWelcomeClaimedDay(value: unknown): string {
  return typeof value === "string" && DAY_KEY.test(value) ? value : "";
}

/**
 * The whole payout rule. Pays only when `today` is a later day than the last claim:
 * - never claimed ("") -> pays;
 * - same day -> no (restart, second open, double tap);
 * - clock went back (today is before the last claim) -> no;
 * - clock went forward -> yes, once, because the claim then moves to that day.
 * Day keys are zero-padded ISO dates, so string comparison is chronological.
 * Limit: with no server, a phone set far forward and claimed makes real days after it unclaimable
 * until the real date catches up. Nothing else is lost.
 */
export function isWelcomeClaimable(lastClaimedDay: string, today: string): boolean {
  if (!DAY_KEY.test(today)) return false;
  return lastClaimedDay === "" || today > lastClaimedDay;
}

/** Whether the welcome card should be offered now. */
export function canClaimDailyWelcome(state: GameState, now: number): boolean {
  return (
    state.settings.dailyWelcome &&
    state.tutorialCompleted &&
    isWelcomeClaimable(state.welcomeClaimedDay, localDayKey(now))
  );
}

/** Pays the welcome once for the local day of `now`; the same state back when nothing is owed. */
export function claimDailyWelcome(state: GameState, now: number): { state: GameState; coins: number } {
  if (!canClaimDailyWelcome(state, now)) return { state, coins: 0 };
  return {
    coins: DAILY_WELCOME_COINS,
    state: { ...state, coins: state.coins + DAILY_WELCOME_COINS, welcomeClaimedDay: localDayKey(now) },
  };
}

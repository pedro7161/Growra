/**
 * Halloween and Christmas (same windows as SHARDMARCH), on the phone's local date: the companion
 * hats, the event companions Gloam and Holly, and the seasonal app icon (shipped with an update).
 */
export type Season = "halloween" | "christmas";

interface SeasonDay {
  month: number; // 1-12
  day: number;
}

const SEASON_WINDOWS: Record<Season, { start: SeasonDay; end: SeasonDay }> = {
  halloween: { start: { month: 10, day: 1 }, end: { month: 11, day: 2 } },
  christmas: { start: { month: 12, day: 1 }, end: { month: 1, day: 6 } },
};

/** One-off extra days: Halloween 2026 ran a week longer to make up for a late release. */
const EXTRA_DAYS: { season: Season; from: number; until: number }[] = [
  { season: "halloween", from: new Date(2026, 10, 3).getTime(), until: new Date(2026, 10, 10).getTime() },
];

export function isSeason(season: Season, now: number = Date.now()): boolean {
  const date = new Date(now);
  const today = (date.getMonth() + 1) * 100 + date.getDate();
  const { start, end } = SEASON_WINDOWS[season];
  const from = start.month * 100 + start.day;
  const to = end.month * 100 + end.day;
  const inWindow = from <= to ? today >= from && today <= to : today >= from || today <= to;
  return inWindow || EXTRA_DAYS.some((extra) => extra.season === season && now >= extra.from && now < extra.until);
}

export function currentSeason(now: number = Date.now()): Season | null {
  return (Object.keys(SEASON_WINDOWS) as Season[]).find((season) => isSeason(season, now)) ?? null;
}

/** "halloween-2026": the running season and the year it began in (Christmas runs into January), or null. */
export function seasonKey(now: number = Date.now()): string | null {
  const season = currentSeason(now);
  if (!season) return null;
  const date = new Date(now);
  const year = season === "christmas" && date.getMonth() === 0 ? date.getFullYear() - 1 : date.getFullYear();
  return `${season}-${year}`;
}

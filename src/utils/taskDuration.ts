export type DurationUnit = "seconds" | "minutes" | "hours";

export const MAX_TASK_MINUTES = 24 * 60;

const MINUTES_PER_UNIT: Record<DurationUnit, number> = {
  seconds: 1 / 60,
  minutes: 1,
  hours: 60,
};

/** Typed number + unit -> minutes (fractional for seconds), clamped to 24 h; null when empty/invalid/zero. */
export function parseTaskDuration(text: string, unit: DurationUnit): number | null {
  const cleaned = text.trim().replace(",", ".");
  if (!/^\d*\.?\d+$|^\d+\.$/.test(cleaned)) return null;
  const amount = Number(cleaned);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const minutes = amount * MINUTES_PER_UNIT[unit];
  return Math.min(Math.round(minutes * 6000) / 6000, MAX_TASK_MINUTES);
}

/** Show an existing length in the most natural unit: whole hours, whole minutes, else seconds. */
export function durationToInput(minutes: number | null | undefined): { value: string; unit: DurationUnit } {
  if (!minutes || minutes <= 0) return { value: "", unit: "minutes" };
  const seconds = Math.round(minutes * 60);
  if (seconds % 3600 === 0) return { value: String(seconds / 3600), unit: "hours" };
  if (seconds % 60 === 0) return { value: String(seconds / 60), unit: "minutes" };
  return { value: String(seconds), unit: "seconds" };
}

/** "45 s" / "1 min 30 s" / "45 min" / "1 h" / "1 h 30 min" for a task length. */
export function formatTaskDuration(
  minutes: number,
  units: { seconds: string; minutes: string; hours: string },
): string {
  const total = Math.max(0, Math.round(minutes * 60));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h} ${units.hours}`);
  if (m) parts.push(`${m} ${units.minutes}`);
  if (s) parts.push(`${s} ${units.seconds}`);
  return parts.length ? parts.join(" ") : `0 ${units.minutes}`;
}

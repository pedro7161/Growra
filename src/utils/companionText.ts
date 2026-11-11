import { getAppCopy } from "../constants/appCopy";
import { TaskStatus, type GameState, type WorkOccurrence } from "../types";
import { BIG_DAY_TASKS, withToday, type CompanionMood } from "./companions";
import { currentSeason, holidayOn } from "./seasons";
import { getStartOfDay } from "./taskSchedule";

type AppCopy = ReturnType<typeof getAppCopy>;

/** A companion's description in the app's language, falling back to the English original. */
export function companionDescription(copy: AppCopy, template: { id: string; description: string }): string {
  return copy.companionBios[template.id] ?? template.description;
}

const HOUR_MS = 60 * 60 * 1000;

/** A small stable hash, so a text choice depends only on its inputs (never on Math.random or stored state). */
export function textSeed(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return hash;
}

/** Whole local calendar days since 1970 for `timestamp`; steps by exactly 1 each local day (DST-safe). */
function localDayNumber(timestamp: number): number {
  const date = new Date(timestamp);
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / (24 * HOUR_MS));
}

/**
 * The companion's line on the dashboard: a holiday greeting on the day itself (unless it is
 * asleep), a seasonal mood line during Halloween and Christmas, otherwise a plain mood line.
 * The plain line is one of a few per mood, picked from the local day and the companion's name:
 * it changes from day to day, stays put within a day and across restarts, and needs no save data.
 * `varied` false (reactions switched off) always gives the first, original line.
 */
export function companionLine(
  copy: AppCopy,
  mood: CompanionMood,
  name: string,
  now: number = Date.now(),
  varied: boolean = true,
): string {
  const holiday = holidayOn(now);
  const season = currentSeason(now);
  const line =
    holiday && mood !== "sleepy"
      ? copy.companionHolidayGreeting[holiday]
      : season
        ? copy.companionSeasonMood[season][mood]
        : plainMoodLine(copy, mood, name, now, varied);
  return line.replace("{name}", name);
}

function plainMoodLine(copy: AppCopy, mood: CompanionMood, name: string, now: number, varied: boolean): string {
  const pool = varied ? [copy.companionMood[mood], ...copy.companionMoodMore[mood]] : [copy.companionMood[mood]];
  // Round-robin by day from a per-companion offset: every line gets its turn, never twice in a row.
  return pool[(textSeed(`${name}|${mood}`) + localDayNumber(now)) % pool.length];
}

export type ShiftStage = "start" | "middle" | "last-hour";

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

/** What a tick is: a plain task, the last one due today (rest), a big day, or a finished shift. */
export type PraiseKind = "task" | "shift" | "rest" | "big-day";

/**
 * Which praise suits the task just ticked off. `state` is the state after the tick. A big day
 * (exactly BIG_DAY_TASKS done today) wins over rest; rest is "something done today and nothing
 * left due", the same test as the glowing mood. Otherwise a plain task line.
 */
export function praiseKindForTick(state: GameState, now: number): PraiseKind {
  const done = withToday(state.usage, now).todayDone;
  if (done === BIG_DAY_TASKS) return "big-day";
  const today = getStartOfDay(now);
  const dueLeft = state.tasks.some((task) => task.status === TaskStatus.PENDING && getStartOfDay(task.dueDate) <= today);
  return done > 0 && !dueLeft ? "rest" : "task";
}

/**
 * The companion's praise for a completed task or shift. Never the same line twice in a row
 * (`previous` is the last line shown); `random` is injectable so tests are deterministic.
 */
export function pickPraiseLine(
  copy: AppCopy,
  kind: PraiseKind,
  name: string,
  previous: string | null = null,
  random: () => number = Math.random,
): string {
  const source =
    kind === "shift"
      ? copy.praiseShiftLines
      : kind === "rest"
        ? copy.praiseRestLines
        : kind === "big-day"
          ? copy.praiseBigDayLines
          : copy.praiseLines;
  const lines = source.map((line) => line.replace("{name}", name));
  const options = lines.filter((line) => line !== previous);
  const pool = options.length > 0 ? options : lines;
  return pool[Math.min(Math.floor(random() * pool.length), pool.length - 1)];
}

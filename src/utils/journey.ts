import { DayRecord, Decoration, GameState, Task } from "../types";
import { getCalendarDayDifference, getStartOfDay } from "./taskSchedule";
import { generateId } from "./idUtils";
import type { CompletionFacts } from "./companions";

/**
 * The Journey (Documents/GAME_REDESIGN.md §5): every active day adds a tile to a road; every
 * 7 tiles there is a camp, every 4 camps a new region. Everything is derived from `days`, so
 * there is no separate map progress to go out of sync.
 */

export const TILES_PER_CAMP = 7;
export const CAMPS_PER_REGION = 4;
export const TILES_PER_REGION = TILES_PER_CAMP * CAMPS_PER_REGION;
export const SPOTS_PER_CAMP = 3;
/** Every Nth finished timer task, the active companion brings back a find (§4.3 focus buddy). */
export const TIMERS_PER_FIND = 3;
const MAX_CRYSTALS = 3;
const BIG_DAY_TASKS = 5;
const MAX_LOGGED_COMPLETIONS = 30;

export interface Region {
  id: string;
  name: string;
  color: string;
  borderColor: string;
}

export const REGIONS: Region[] = [
  { id: "sunlit-coast", name: "Sunlit Coast", color: "#d69363", borderColor: "#b76d39" },
  { id: "mossway-grove", name: "Mossway Grove", color: "#7fae6b", borderColor: "#557f45" },
  { id: "amber-dunes", name: "Amber Dunes", color: "#d9b25f", borderColor: "#a8843a" },
  { id: "cloudbreak-ridge", name: "Cloudbreak Ridge", color: "#8fb3d9", borderColor: "#5f86b0" },
  { id: "moonpool-marsh", name: "Moonpool Marsh", color: "#7f86c9", borderColor: "#5a5f9e" },
  { id: "glasswind-expanse", name: "Glasswind Expanse", color: "#79c2c0", borderColor: "#4b9391" },
  { id: "cinder-hollow", name: "Cinder Hollow", color: "#cf7a63", borderColor: "#a2503b" },
  { id: "skyheart-summit", name: "Skyheart Summit", color: "#b48fd6", borderColor: "#8563aa" },
];

export type TileFeature =
  | "lantern"
  | "flowers"
  | "crystal"
  | "stone"
  | "flag"
  | "signpost"
  | "tree";

export const TILE_FEATURE_ICONS: Record<TileFeature, string> = {
  lantern: "🏮",
  flowers: "🌸",
  crystal: "💎",
  stone: "🪨",
  flag: "🚩",
  signpost: "🪧",
  tree: "🌳",
};

export interface DecorationType {
  id: string;
  icon: string;
  /** Coins; 0 means it can only be found during focus sessions. */
  price: number;
  /** Only from rewarded "explore" finds, never from focus timers. */
  exploreOnly?: boolean;
}

export const DECORATION_TYPES: DecorationType[] = [
  { id: "flower-pot", icon: "🪴", price: 40 },
  { id: "mushroom-ring", icon: "🍄", price: 60 },
  { id: "paper-lantern", icon: "🏮", price: 60 },
  { id: "pennant", icon: "🎏", price: 80 },
  { id: "wind-chime", icon: "🎐", price: 90 },
  { id: "snowman", icon: "⛄", price: 100 },
  { id: "crystal-cluster", icon: "🔮", price: 120 },
  { id: "tent", icon: "⛺", price: 150 },
  { id: "star-lamp", icon: "🌟", price: 200 },
  { id: "shell", icon: "🐚", price: 0 },
  { id: "feather", icon: "🪶", price: 0 },
  { id: "clover", icon: "🍀", price: 0 },
  { id: "acorn", icon: "🌰", price: 0 },
  { id: "comet-shard", icon: "☄️", price: 0, exploreOnly: true },
  { id: "moonstone", icon: "🌙", price: 0, exploreOnly: true },
  { id: "rainbow-ribbon", icon: "🌈", price: 0, exploreOnly: true },
  { id: "firefly-jar", icon: "🫙", price: 0, exploreOnly: true },
];

const FIND_POOL = DECORATION_TYPES.filter((type) => type.price === 0 && !type.exploreOnly);

export function getDecorationType(typeId: string): DecorationType | undefined {
  return DECORATION_TYPES.find((type) => type.id === typeId);
}

export function createDayRecord(date: number): DayRecord {
  return {
    date: getStartOfDay(date),
    done: 0,
    recurringDone: 0,
    customDone: 0,
    highPriorityDone: 0,
    timersFinished: 0,
    scheduledAhead: 0,
    completions: [],
  };
}

/** Applies `update` to the record for the day of `now`, creating it if needed. */
function updateDay(days: DayRecord[], now: number, update: (day: DayRecord) => DayRecord): DayRecord[] {
  const date = getStartOfDay(now);
  const existing = days.find((day) => day.date === date);
  if (existing) {
    return days.map((day) => (day === existing ? update(day) : day));
  }
  return [...days, update(createDayRecord(date))].sort((left, right) => left.date - right.date);
}

export function recordDayCompletion(
  days: DayRecord[],
  task: Task,
  facts: CompletionFacts,
  now: number,
): DayRecord[] {
  return updateDay(days, now, (day) => ({
    ...day,
    done: day.done + 1,
    recurringDone: day.recurringDone + (facts.recurring ? 1 : 0),
    customDone: day.customDone + (facts.custom ? 1 : 0),
    highPriorityDone: day.highPriorityDone + (facts.highPriority ? 1 : 0),
    timersFinished: day.timersFinished + (facts.timer ? 1 : 0),
    completions:
      day.completions.length < MAX_LOGGED_COMPLETIONS
        ? [...day.completions, { name: task.name, at: now }]
        : day.completions,
  }));
}

/** A task created or moved to a later day marks today's tile with a signpost. */
export function recordDayScheduledAhead(days: DayRecord[], dueDate: number, now: number): DayRecord[] {
  if (getCalendarDayDifference(now, dueDate) < 1) {
    return days;
  }
  return updateDay(days, now, (day) => ({ ...day, scheduledAhead: day.scheduledAhead + 1 }));
}

export function getTileFeatures(day: DayRecord): TileFeature[] {
  const features: TileFeature[] = ["lantern"];
  if (day.recurringDone > 0) features.push("flowers");
  for (let index = 0; index < Math.min(day.timersFinished, MAX_CRYSTALS); index += 1) {
    features.push("crystal");
  }
  if (day.customDone > 0) features.push("stone");
  if (day.highPriorityDone > 0) features.push("flag");
  if (day.scheduledAhead > 0) features.push("signpost");
  if (day.done >= BIG_DAY_TASKS) features.push("tree");
  return features;
}

export interface RoadPosition {
  tiles: number;
  regionIndex: number; // 0-7 within the current season
  season: number; // 1-based; after Skyheart Summit the valley starts again
  campsReached: number;
  tilesToNextCamp: number;
  tilesToNextRegion: number;
}

export function getActiveDayRecords(days: DayRecord[]): DayRecord[] {
  return days.filter((day) => day.done > 0).sort((left, right) => left.date - right.date);
}

export function getRegionForTile(tileIndex: number): { regionIndex: number; season: number } {
  const regionNumber = Math.floor(tileIndex / TILES_PER_REGION);
  return {
    regionIndex: regionNumber % REGIONS.length,
    season: Math.floor(regionNumber / REGIONS.length) + 1,
  };
}

export function getRoadPosition(days: DayRecord[]): RoadPosition {
  const tiles = getActiveDayRecords(days).length;
  // The companion stands on the last tile; before any tile it waits at the start.
  const { regionIndex, season } = getRegionForTile(Math.max(tiles - 1, 0));
  const intoCamp = tiles % TILES_PER_CAMP;
  const intoRegion = tiles % TILES_PER_REGION;
  return {
    tiles,
    regionIndex,
    season,
    campsReached: Math.floor(tiles / TILES_PER_CAMP),
    tilesToNextCamp: TILES_PER_CAMP - intoCamp,
    tilesToNextRegion: TILES_PER_REGION - intoRegion,
  };
}

export interface LookBack {
  done: number;
  busiestDay: number; // start of day
  topTaskName: string; // "" when nothing repeated
  topTaskCount: number;
}

/** The camp's "this week" card, from the 7 tiles that lead up to camp `campIndex` (0-based). */
export function getCampLookBack(days: DayRecord[], campIndex: number): LookBack | null {
  const week = getActiveDayRecords(days).slice(
    campIndex * TILES_PER_CAMP,
    (campIndex + 1) * TILES_PER_CAMP,
  );
  if (week.length < TILES_PER_CAMP) {
    return null;
  }

  const busiest = week.reduce((best, day) => (day.done > best.done ? day : best), week[0]);
  const counts = new Map<string, number>();
  week.forEach((day) =>
    day.completions.forEach((completion) =>
      counts.set(completion.name, (counts.get(completion.name) ?? 0) + 1),
    ),
  );
  let topTaskName = "";
  let topTaskCount = 1;
  counts.forEach((count, name) => {
    if (count > topTaskCount) {
      topTaskName = name;
      topTaskCount = count;
    }
  });

  return {
    done: week.reduce((total, day) => total + day.done, 0),
    busiestDay: busiest.date,
    topTaskName,
    topTaskCount: topTaskName ? topTaskCount : 0,
  };
}

/** Decorations: bought with coins or found, then placed on camp spots (§5.4). */
export function buyDecoration(gameState: GameState, typeId: string): GameState {
  const type = getDecorationType(typeId);
  if (!type || type.price <= 0 || gameState.coins < type.price) {
    return gameState;
  }

  return {
    ...gameState,
    coins: gameState.coins - type.price,
    decorations: [...gameState.decorations, { id: generateId(), typeId, camp: -1, spot: -1 }],
    lastPlayedAt: Date.now(),
  };
}

export function isPlaced(decoration: Decoration): boolean {
  return decoration.camp >= 0;
}

/** Puts a decoration on a reached camp's spot; whatever was there goes back to the bag. */
export function placeDecoration(
  gameState: GameState,
  decorationId: string,
  camp: number,
  spot: number,
): GameState {
  const { campsReached } = getRoadPosition(gameState.days);
  if (
    camp < 0 ||
    camp >= campsReached ||
    spot < 0 ||
    spot >= SPOTS_PER_CAMP ||
    !gameState.decorations.some((decoration) => decoration.id === decorationId)
  ) {
    return gameState;
  }

  return {
    ...gameState,
    decorations: gameState.decorations.map((decoration) => {
      if (decoration.id === decorationId) {
        return { ...decoration, camp, spot };
      }
      if (decoration.camp === camp && decoration.spot === spot) {
        return { ...decoration, camp: -1, spot: -1 };
      }
      return decoration;
    }),
    lastPlayedAt: Date.now(),
  };
}

export function removeDecoration(gameState: GameState, decorationId: string): GameState {
  return {
    ...gameState,
    decorations: gameState.decorations.map((decoration) =>
      decoration.id === decorationId ? { ...decoration, camp: -1, spot: -1 } : decoration,
    ),
    lastPlayedAt: Date.now(),
  };
}

/**
 * Focus buddy: when a finished timer brings the total to a multiple of TIMERS_PER_FIND, the
 * active companion brings back the next find. Deterministic, so it can't be re-rolled.
 */
export function getFocusFind(timersFinishedTotal: number): DecorationType | null {
  if (timersFinishedTotal <= 0 || timersFinishedTotal % TIMERS_PER_FIND !== 0) {
    return null;
  }
  return FIND_POOL[(timersFinishedTotal / TIMERS_PER_FIND - 1) % FIND_POOL.length];
}

/** Rebuilds day records from task history for saves made before the Journey existed. */
export function buildDaysFromTasks(tasks: Task[]): DayRecord[] {
  return tasks
    .filter((task) => task.completedAt)
    .sort((left, right) => (left.completedAt as number) - (right.completedAt as number))
    .reduce<DayRecord[]>((days, task) => {
      const at = task.completedAt as number;
      return updateDay(days, at, (day) => ({
        ...day,
        done: day.done + 1,
        completions:
          day.completions.length < MAX_LOGGED_COMPLETIONS
            ? [...day.completions, { name: task.name, at }]
            : day.completions,
      }));
    }, []);
}

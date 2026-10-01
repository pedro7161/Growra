import { DecorationType, DECORATION_TYPES } from "./journey";
import { getStartOfDay } from "./taskSchedule";
import { generateId } from "./idUtils";
import { ExploreState, GameState } from "../types";

/** Spec §2: two rewarded finds a day, with or without Plus. */
export const EXPLORE_FINDS_PER_DAY = 2;

/** Every found-only decoration: the focus finds plus the explore-only ones. */
export const EXPLORE_POOL: DecorationType[] = DECORATION_TYPES.filter((type) => type.price === 0);

export function getExploreLeft(explore: ExploreState, now: number): number {
  if (explore.day !== getStartOfDay(now)) return EXPLORE_FINDS_PER_DAY;
  return Math.max(0, EXPLORE_FINDS_PER_DAY - explore.count);
}

/** Adds one random find to the bag. `random` is in [0, 1) so tests can pick the find. */
export function grantExploreFind(
  state: GameState,
  now: number,
  random: number,
): { state: GameState; find: DecorationType | null } {
  if (getExploreLeft(state.explore, now) === 0) return { state, find: null };
  const day = getStartOfDay(now);
  const count = state.explore.day === day ? state.explore.count + 1 : 1;
  const find = EXPLORE_POOL[Math.min(EXPLORE_POOL.length - 1, Math.floor(random * EXPLORE_POOL.length))];
  return {
    find,
    state: {
      ...state,
      explore: { day, count },
      decorations: [...state.decorations, { id: generateId(), typeId: find.id, camp: -1, spot: -1 }],
      lastPlayedAt: now,
    },
  };
}

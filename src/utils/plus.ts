import { AppThemeId, GameState } from "../types";

/** Themes that need Growra Plus (spec §1, perks). */
export const PLUS_THEME_IDS: readonly AppThemeId[] = ["dusk", "blossom", "forest"];

/** Free users see look-back cards for this many most recent camps. */
export const FREE_LOOKBACK_CAMPS = 4;

export function isPlusTheme(themeId: AppThemeId): boolean {
  return PLUS_THEME_IDS.includes(themeId);
}

export function isThemeAllowed(themeId: AppThemeId, isPlus: boolean): boolean {
  return isPlus || !isPlusTheme(themeId);
}

/** The theme to actually use: a Plus theme without Plus falls back to Mint. */
export function resolveTheme(themeId: AppThemeId, isPlus: boolean): AppThemeId {
  return isThemeAllowed(themeId, isPlus) ? themeId : "mint";
}

/**
 * The state as screens should draw it: the theme they read is the one actually in use, so a Plus
 * theme saved without Plus doesn't leak into child screens while the app frame shows Mint (#43).
 */
export function withResolvedTheme(state: GameState): GameState {
  const theme = resolveTheme(state.settings.theme, state.plus.owned);
  return theme === state.settings.theme ? state : { ...state, settings: { ...state.settings, theme } };
}

/** Camp indexes run 0..campsReached-1; free users see only the last FREE_LOOKBACK_CAMPS. */
export function isLookBackVisible(campIndex: number, campsReached: number, isPlus: boolean): boolean {
  return isPlus || campIndex >= campsReached - FREE_LOOKBACK_CAMPS;
}

import {
  FREE_LOOKBACK_CAMPS,
  PLUS_THEME_IDS,
  isLookBackVisible,
  isThemeAllowed,
  resolveTheme,
} from '../src/utils/plus';
import { appThemes } from '../src/constants/appTheme';

describe('plus themes', () => {
  it('has three Plus themes that all exist', () => {
    expect(PLUS_THEME_IDS).toEqual(['dusk', 'blossom', 'forest']);
    PLUS_THEME_IDS.forEach((id) => expect(appThemes[id]).toBeDefined());
  });

  it('allows free themes for everyone and Plus themes only with Plus', () => {
    expect(isThemeAllowed('ocean', false)).toBe(true);
    expect(isThemeAllowed('dusk', false)).toBe(false);
    expect(isThemeAllowed('dusk', true)).toBe(true);
  });

  it('falls back to mint when a Plus theme is no longer allowed', () => {
    expect(resolveTheme('blossom', false)).toBe('mint');
    expect(resolveTheme('blossom', true)).toBe('blossom');
    expect(resolveTheme('sunset', false)).toBe('sunset');
  });
});

describe('journey look-back gate', () => {
  it('shows every card when there are 4 camps or fewer', () => {
    for (let camp = 0; camp < 4; camp += 1) {
      expect(isLookBackVisible(camp, 4, false)).toBe(true);
    }
    expect(isLookBackVisible(0, 0, false)).toBe(true);
  });

  it('shows only the last 4 camps to free users', () => {
    expect(FREE_LOOKBACK_CAMPS).toBe(4);
    expect(isLookBackVisible(0, 5, false)).toBe(false);
    expect(isLookBackVisible(1, 5, false)).toBe(true);
    expect(isLookBackVisible(15, 20, false)).toBe(false);
    expect(isLookBackVisible(16, 20, false)).toBe(true);
  });

  it('shows everything with Plus', () => {
    expect(isLookBackVisible(0, 20, true)).toBe(true);
  });
});

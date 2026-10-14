import { appDarkThemes, appThemes, getAppTheme, resolveDarkAppearance, setDarkAppearance } from '../src/constants/appTheme';

describe('dark appearance', () => {
  afterEach(() => setDarkAppearance(false));

  it('follows the phone only when set to system', () => {
    expect(resolveDarkAppearance('system', 'dark')).toBe(true);
    expect(resolveDarkAppearance('system', 'light')).toBe(false);
    expect(resolveDarkAppearance('system', null)).toBe(false);
    expect(resolveDarkAppearance('dark', 'light')).toBe(true);
    expect(resolveDarkAppearance('light', 'dark')).toBe(false);
  });

  it('returns the dark palette of the same theme when dark is active', () => {
    setDarkAppearance(true);
    expect(getAppTheme('ocean')).toBe(appDarkThemes.ocean);
    expect(getAppTheme('ocean').id).toBe('ocean');
    setDarkAppearance(false);
    expect(getAppTheme('ocean')).toBe(appThemes.ocean);
  });

  it('has a dark palette for every theme with every color set', () => {
    for (const id of Object.keys(appThemes) as (keyof typeof appThemes)[]) {
      const dark = appDarkThemes[id];
      for (const [key, value] of Object.entries(dark)) expect(value).toBeTruthy();
      expect(dark.background).not.toBe(appThemes[id].background);
    }
  });
});

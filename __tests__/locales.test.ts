import { getAppCopy } from '../src/constants/appCopy';
import { getChangelog, getReleaseNotes } from '../src/constants/changelog';
import { APP_LANGUAGES, LANGUAGE_LOCALES, LANGUAGE_NAMES, isAppLanguage, resolveLanguage } from '../src/constants/languages';
import { predefinedTasks } from '../src/constants/predefinedTasks';
import { REGIONS } from '../src/utils/journey';
import { appThemes } from '../src/constants/appTheme';
import { AppLanguage } from '../src/types';

const ADDED: AppLanguage[] = APP_LANGUAGES.filter((language) => language !== 'en' && language !== 'pt');

/** Every leaf as "path → string", walking objects and arrays. */
function leaves(value: unknown, path = '', found: Map<string, string> = new Map()): Map<string, string> {
  if (typeof value === 'string') found.set(path, value);
  else if (Array.isArray(value)) value.forEach((item, index) => leaves(item, `${path}[${index}]`, found));
  else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) leaves(child, path ? `${path}.${key}` : key, found);
  }
  return found;
}

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
}

describe('languages', () => {
  it('names and dates every language', () => {
    for (const language of APP_LANGUAGES) {
      expect(LANGUAGE_NAMES[language]).toBeTruthy();
      expect(LANGUAGE_LOCALES[language]).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
    }
  });

  it('resolves device tags to a shipped language', () => {
    expect(resolveLanguage('pt-BR')).toBe('pt');
    expect(resolveLanguage('zh_Hans_CN')).toBe('zh');
    expect(resolveLanguage('JA-jp')).toBe('ja');
    expect(resolveLanguage('nl-NL')).toBeNull();
    expect(resolveLanguage(undefined)).toBeNull();
    expect(isAppLanguage('ko')).toBe(true);
    expect(isAppLanguage('xx')).toBe(false);
  });
});

describe.each(ADDED)('%s copy', (language) => {
  const english = leaves({ ...getAppCopy('en'), companionBios: getAppCopy('pt').companionBios });
  const translated = leaves(getAppCopy(language));

  it('has every English string, with the same placeholders', () => {
    for (const [path, text] of english) {
      if (path.startsWith('categoryNames') || path.startsWith('predefinedTasks') || path.startsWith('regionNames') || path.startsWith('themeNames')) continue;
      expect([path, translated.has(path)]).toEqual([path, true]);
      expect([path, placeholders(translated.get(path) ?? '')]).toEqual([path, placeholders(text)]);
    }
  });

  it('is not left in English', () => {
    const copy = getAppCopy(language);
    expect(copy.navTasks).not.toBe(getAppCopy('en').navTasks);
    expect(copy.settingsLanguage).not.toBe(getAppCopy('en').settingsLanguage);
  });

  it('translates the ready-made tasks, regions, themes and categories', () => {
    const copy = getAppCopy(language);
    for (const task of predefinedTasks) expect([task.id, copy.predefinedTasks[task.id]?.name]).toEqual([task.id, expect.any(String)]);
    for (const region of REGIONS) expect([region.id, copy.regionNames[region.id]]).toEqual([region.id, expect.any(String)]);
    for (const themeId of Object.keys(appThemes)) expect([themeId, copy.themeNames[themeId as keyof typeof appThemes]]).toEqual([themeId, expect.any(String)]);
    for (const category of new Set(predefinedTasks.map((task) => task.category))) {
      expect([category, copy.categoryNames[category]]).toEqual([category, expect.any(String)]);
    }
  });

  it('translates the newest release notes and keeps the older ones in English', () => {
    const englishLog = getChangelog('en');
    const log = getChangelog(language);
    expect(log).toHaveLength(englishLog.length);
    expect(log.map((entry) => entry.version)).toEqual(englishLog.map((entry) => entry.version));
    expect(getReleaseNotes(language, '1.11.0')?.items).toHaveLength(getReleaseNotes('en', '1.11.0')!.items.length);
    expect(getReleaseNotes(language, '1.10.0')?.items).toHaveLength(getReleaseNotes('en', '1.10.0')!.items.length);
  });
});

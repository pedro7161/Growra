import { REGIONS, regionName } from '../src/utils/journey';
import { taskCategoryLabel } from '../src/utils/taskLabels';
import { predefinedTasks } from '../src/constants/predefinedTasks';
import { getAppCopy } from '../src/constants/appCopy';

/**
 * Words that are only ever the unaccented misspelling of a real Portuguese word, so a hit is
 * always a bug. Correctly-spelled lookalikes are deliberately absent: "esta" (this) and "aqui"
 * are valid, and only "está" (is) would be wrong here - no word list can tell those apart.
 */
const UNACCENTED_MISSPELLINGS = [
  'comeca',
  'reutilizavel',
  'nao',
  'sao',
  'tambem',
  'voce',
  'opcao',
  'acao',
  'disponivel',
  'codigo',
  'titulo',
  'parabens',
];

function collectStrings(value: unknown, found: string[] = []): string[] {
  if (typeof value === 'string') found.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, found));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectStrings(item, found));
  return found;
}

describe('Portuguese labels', () => {
  it('translates the built-in task categories and leaves custom ones as typed', () => {
    for (const category of new Set(predefinedTasks.map((task) => task.category))) {
      expect(taskCategoryLabel('pt', category)).toBeTruthy();
    }
    expect(taskCategoryLabel('pt', 'health')).toBe('saúde');
    expect(taskCategoryLabel('pt', 'Health')).toBe('saúde');
    expect(taskCategoryLabel('pt', 'my stuff')).toBe('my stuff');
    expect(taskCategoryLabel('en', 'health')).toBe('health');
  });

  it('spells player-facing Portuguese text with its accents', () => {
    const offenders = collectStrings(getAppCopy('pt')).filter((text) =>
      UNACCENTED_MISSPELLINGS.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(text)),
    );
    expect(offenders).toEqual([]);
  });

  it('has a Portuguese name for every Journey region', () => {
    for (const region of REGIONS) {
      expect(regionName(region, 'pt')).not.toBe(region.name);
      expect(regionName(region, 'en')).toBe(region.name);
    }
  });
});

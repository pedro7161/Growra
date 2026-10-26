import { getReleaseNotes } from '../src/constants/changelog';
import { APP_VERSION } from '../src/constants/appVersion';
import { createInitialGameState } from '../src/utils/initialState';
import { whatsNewToShow } from '../src/utils/whatsNew';

describe("What's New (#64)", () => {
  it("shows this version's notes until the player hides them for this version", () => {
    const notes = whatsNewToShow('', '1.9.0', true, 'en');
    expect(notes?.version).toBe('1.9.0');
    expect(notes?.fixes?.length).toBeGreaterThan(0);
    expect(whatsNewToShow('1.8.6', '1.9.0', true, 'pt')?.dateLabel).toContain('1.9.0');
    expect(whatsNewToShow('1.9.0', '1.9.0', true, 'en')).toBeNull();
  });

  it('a fresh install sees them too, once the tutorial is done', () => {
    const fresh = createInitialGameState();
    expect(whatsNewToShow(fresh.whatsNewHiddenFor, '1.9.0', false, 'en')).toBeNull();
    expect(whatsNewToShow(fresh.whatsNewHiddenFor, '1.9.0', true, 'en')?.version).toBe('1.9.0');
  });

  it('a version without notes shows nothing', () => {
    expect(whatsNewToShow('', '0.0.1', true, 'en')).toBeNull();
  });

  it('every version with notes has them in both languages, with the same number of lines', () => {
    for (const version of ['1.9.0', APP_VERSION]) {
      const en = getReleaseNotes('en', version);
      const pt = getReleaseNotes('pt', version);
      expect(pt?.items.length).toBe(en?.items.length);
      expect(pt?.fixes?.length).toBe(en?.fixes?.length);
    }
  });
});

import { getReleaseNotes } from '../src/constants/changelog';
import { APP_VERSION } from '../src/constants/appVersion';
import { createInitialGameState } from '../src/utils/initialState';
import { whatsNewToShow } from '../src/utils/whatsNew';

describe("What's New after an update (#64)", () => {
  it('shows the notes once after an update from an older version', () => {
    const notes = whatsNewToShow('1.8.6', '1.9.0', true, 'en');
    expect(notes?.version).toBe('1.9.0');
    expect(notes?.fixes?.length).toBeGreaterThan(0);
  });

  it('shows them to saves from before the popup existed', () => {
    expect(whatsNewToShow('', '1.9.0', true, 'pt')?.dateLabel).toContain('1.9.0');
  });

  it('skips the version already seen, players in the tutorial and versions without notes', () => {
    expect(whatsNewToShow('1.9.0', '1.9.0', true, 'en')).toBeNull();
    expect(whatsNewToShow('1.8.6', '1.9.0', false, 'en')).toBeNull();
    expect(whatsNewToShow('1.8.6', '0.0.1', true, 'en')).toBeNull();
  });

  it('a fresh install has nothing new to show', () => {
    const fresh = createInitialGameState();
    expect(fresh.lastSeenVersion).toBe(APP_VERSION);
    expect(whatsNewToShow(fresh.lastSeenVersion, APP_VERSION, true, 'en')).toBeNull();
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

import { applyPlusOwnership } from '../src/hooks/usePlusController';
import { createInitialGameState } from '../src/utils/initialState';

describe('applyPlusOwnership', () => {
  it('sets owned and the check time', () => {
    const next = applyPlusOwnership(createInitialGameState(), true, 123);
    expect(next.plus).toEqual({ owned: true, lastCheckedAt: 123 });
  });

  it('falls back to mint when Plus is lost while a Plus theme is selected', () => {
    const base = createInitialGameState();
    const withDusk = { ...base, plus: { owned: true, lastCheckedAt: 1 }, settings: { ...base.settings, theme: 'dusk' as const } };
    const next = applyPlusOwnership(withDusk, false, 2);
    expect(next.plus.owned).toBe(false);
    expect(next.settings.theme).toBe('mint');
  });

  it('keeps a free theme untouched', () => {
    const base = createInitialGameState();
    const withOcean = { ...base, settings: { ...base.settings, theme: 'ocean' as const } };
    expect(applyPlusOwnership(withOcean, false, 2).settings.theme).toBe('ocean');
  });
});

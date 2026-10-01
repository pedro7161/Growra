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

import { keepPlusOnImport, nextPrice } from '../src/hooks/usePlusController';

describe('keepPlusOnImport', () => {
  it("keeps a paying user's Plus when importing an older backup", () => {
    const current = { ...createInitialGameState(), plus: { owned: true, lastCheckedAt: 9 } };
    const imported = createInitialGameState();
    expect(keepPlusOnImport(imported, current).plus).toEqual({ owned: true, lastCheckedAt: 9 });
  });

  it("doesn't grant Plus from a backup made on a Plus device", () => {
    const current = createInitialGameState();
    const imported = {
      ...createInitialGameState(),
      plus: { owned: true, lastCheckedAt: 3 },
      settings: { ...createInitialGameState().settings, theme: 'forest' as const },
    };
    const next = keepPlusOnImport(imported, current);
    expect(next.plus.owned).toBe(false);
    expect(next.settings.theme).toBe('mint');
  });
});

describe('nextPrice', () => {
  it('fetches the price again when it is still missing', async () => {
    let calls = 0;
    const service = { getPrice: async () => { calls += 1; return '€0.99'; } };
    expect(await nextPrice(null, service)).toBe('€0.99');
    expect(calls).toBe(1);
  });

  it('keeps a known price without calling the store', async () => {
    let calls = 0;
    const service = { getPrice: async () => { calls += 1; return '€1.99'; } };
    expect(await nextPrice('€0.99', service)).toBe('€0.99');
    expect(calls).toBe(0);
  });
});

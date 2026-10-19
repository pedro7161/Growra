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

import { createPlusOwnershipGate, keepPlusOnImport, nextPrice } from '../src/hooks/usePlusController';
import { GameState } from '../src/types';

describe('createPlusOwnershipGate', () => {
  it("keeps Play's answer when it arrives before the save has loaded", () => {
    // The race: the controller restores on start while loadGame() is still reading the file.
    let loaded: GameState | null = null;
    const gate = createPlusOwnershipGate(() => loaded);

    expect(gate.answer(true, 10)).toBeNull(); // nothing to persist yet: there is no state

    loaded = createInitialGameState();
    expect(gate.adopt(loaded, 20).plus).toEqual({ owned: true, lastCheckedAt: 20 });
  });

  it('applies an answer that arrives after the save has loaded', () => {
    let loaded: GameState | null = createInitialGameState();
    const gate = createPlusOwnershipGate(() => loaded);

    const next = gate.answer(true, 10);
    expect(next?.plus).toEqual({ owned: true, lastCheckedAt: 10 });

    // Nothing was left pending, so a later load keeps what it loaded.
    loaded = next!;
    expect(gate.adopt(loaded, 20)).toBe(loaded);
  });

  it('does not lose a refund that arrives before the load either', () => {
    let loaded: GameState | null = null;
    const gate = createPlusOwnershipGate(() => loaded);

    expect(gate.answer(false, 10)).toBeNull();

    const owning = { ...createInitialGameState(), plus: { owned: true, lastCheckedAt: 1 } };
    expect(gate.adopt(owning, 20).plus).toEqual({ owned: false, lastCheckedAt: 20 });
  });

  it('leaves the loaded save alone when Play never answered', () => {
    const gate = createPlusOwnershipGate(() => null);
    const loaded = createInitialGameState();
    expect(gate.adopt(loaded, 20)).toBe(loaded);
  });

  it('uses an early answer once, not on every later load', () => {
    let loaded: GameState | null = null;
    const gate = createPlusOwnershipGate(() => loaded);
    gate.answer(true, 10);

    const adopted = gate.adopt(createInitialGameState(), 20);
    loaded = adopted;
    expect(adopted.plus.owned).toBe(true);
    // A second load (a re-read, an import) must not re-apply the consumed answer.
    const reloaded = createInitialGameState();
    expect(gate.adopt(reloaded, 30)).toBe(reloaded);
  });

  it('writes nothing when the answer already matches the loaded save', () => {
    const owning = { ...createInitialGameState(), plus: { owned: true, lastCheckedAt: 1 } };
    const gate = createPlusOwnershipGate(() => owning);
    expect(gate.answer(true, 10)).toBeNull();
  });

  it('keeps the last answer when Play answers twice before the load', () => {
    let loaded: GameState | null = null;
    const gate = createPlusOwnershipGate(() => loaded);
    gate.answer(true, 10);
    gate.answer(false, 11);

    loaded = createInitialGameState();
    expect(gate.adopt(loaded, 20)).toBe(loaded); // false matches a fresh save: nothing to change
  });
});

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

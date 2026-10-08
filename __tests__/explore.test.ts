import { EXPLORE_FINDS_PER_DAY, EXPLORE_POOL, getExploreLeft, grantExploreFind } from '../src/utils/explore';
import { getFocusFind } from '../src/utils/journey';
import { createInitialGameState } from '../src/utils/initialState';

const noon = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12, 0, 0).getTime();

describe('explore finds', () => {
  it('gives two finds a day, then none', () => {
    let state = createInitialGameState();
    const now = noon(2026, 10, 1);
    expect(getExploreLeft(state.explore, now)).toBe(EXPLORE_FINDS_PER_DAY);
    for (let i = 0; i < EXPLORE_FINDS_PER_DAY; i += 1) {
      const result = grantExploreFind(state, now, 0.5);
      expect(result.find).not.toBeNull();
      state = result.state;
    }
    expect(getExploreLeft(state.explore, now)).toBe(0);
    const blocked = grantExploreFind(state, now, 0.5);
    expect(blocked.find).toBeNull();
    expect(blocked.state).toBe(state);
    expect(state.decorations).toHaveLength(2);
  });

  it('resets at local midnight across the DST change (Lisbon 2026-10-25)', () => {
    let state = createInitialGameState();
    const lateSaturday = new Date(2026, 9, 24, 23, 30).getTime();
    state = grantExploreFind(state, lateSaturday, 0).state;
    state = grantExploreFind(state, lateSaturday, 0).state;
    expect(getExploreLeft(state.explore, lateSaturday)).toBe(0);
    const earlySunday = new Date(2026, 9, 25, 0, 30).getTime();
    expect(getExploreLeft(state.explore, earlySunday)).toBe(EXPLORE_FINDS_PER_DAY);
  });

  it('never touches coins, Bond or XP', () => {
    const state = createInitialGameState();
    const next = grantExploreFind(state, noon(2026, 10, 1), 0.99).state;
    expect(next.coins).toBe(state.coins);
    expect(next.totalExperience).toBe(state.totalExperience);
    expect(next.pets).toBe(state.pets);
  });

  it('picks from the explore pool, which includes the 4 ad-only finds', () => {
    const ids = EXPLORE_POOL.map((type) => type.id);
    ['comet-shard', 'moonstone', 'rainbow-ribbon', 'firefly-jar', 'shell', 'acorn'].forEach((id) =>
      expect(ids).toContain(id),
    );
    const last = grantExploreFind(createInitialGameState(), noon(2026, 10, 1), 0.999999).find;
    expect(last).toEqual(EXPLORE_POOL[EXPLORE_POOL.length - 1]);
  });

  it('keeps the ad-only finds out of the focus-timer finds', () => {
    const focusIds = [3, 6, 9, 12, 15, 18].map((n) => getFocusFind(n)?.id);
    ['comet-shard', 'moonstone', 'rainbow-ribbon', 'firefly-jar'].forEach((id) => expect(focusIds).not.toContain(id));
  });
});

import { createDayRecord } from '../src/utils/journey';
import { createInitialGameState } from '../src/utils/initialState';
import { getReturnRecap, shouldShowBackupNudge } from '../src/utils/returnRecap';

const day = 24 * 60 * 60 * 1000;
const at = (d: number, h = 12) => new Date(2026, 9, d, h).getTime();
const activeDay = (d: number, done: number, timers = 0) => ({ ...createDayRecord(at(d)), done, timersFinished: timers });

describe('return recap (#53)', () => {
  const state = { ...createInitialGameState(), days: [activeDay(1, 2), activeDay(2, 3, 1), activeDay(4, 1)] };

  it('stays quiet when the player was here yesterday or today', () => {
    expect(getReturnRecap(state, at(10, 23), at(11, 8))).toBeNull();
    expect(getReturnRecap(state, at(11, 7), at(11, 20))).toBeNull();
  });

  it('describes the last active days after two or more days away', () => {
    expect(getReturnRecap(state, at(8, 20), at(11, 9))).toEqual({ awayDays: 3, days: 3, done: 6, focus: 1 });
  });

  it('covers at most the last seven active days', () => {
    const many = { ...state, days: Array.from({ length: 10 }, (_, index) => activeDay(index + 1, 1)) };
    expect(getReturnRecap(many, at(12), at(20))?.days).toBe(7);
  });

  it('has nothing to say without any history', () => {
    expect(getReturnRecap(createInitialGameState(), at(1), at(20))).toBeNull();
  });

  it('ignores a missing last-seen time', () => {
    expect(getReturnRecap(state, 0, at(20) + day)).toBeNull();
  });
});

describe('backup nudge (#54)', () => {
  const week = Array.from({ length: 7 }, (_, index) => activeDay(index + 1, 1));

  it('waits for a week of active days', () => {
    expect(shouldShowBackupNudge({ ...createInitialGameState(), days: week.slice(0, 6) })).toBe(false);
    expect(shouldShowBackupNudge({ ...createInitialGameState(), days: week })).toBe(true);
  });

  it('never comes back once shown', () => {
    expect(shouldShowBackupNudge({ ...createInitialGameState(), days: week, backupNudgeShown: true })).toBe(false);
  });
});

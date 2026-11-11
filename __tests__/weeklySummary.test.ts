import { createDayRecord } from '../src/utils/journey';
import { getWeeklySummary, SUMMARY_DAYS } from '../src/utils/weeklySummary';
import { DayRecord } from '../src/types';

const rec = (date: number, done: number, extra: Partial<DayRecord> = {}): DayRecord => ({
  ...createDayRecord(date),
  done,
  ...extra,
});
const local = (m: number, d: number, h = 12, y = 2026) => new Date(y, m - 1, d, h).getTime();
const dates = (summary: ReturnType<typeof getWeeklySummary>) => summary.days.map((d) => new Date(d.date).getDate());

describe('weekly summary (#76)', () => {
  const created = local(1, 1);

  it('counts a known fixture and ignores records outside the window', () => {
    const days = [
      rec(local(10, 20), 9), // before the window
      rec(local(10, 26), 2, { recurringDone: 1 }),
      rec(local(10, 28), 3, { timersFinished: 2 }),
      rec(local(11, 1), 4, { recurringDone: 2, timersFinished: 1 }),
      rec(local(11, 3), 50), // after "now"
    ];
    const summary = getWeeklySummary(days, created, local(11, 1, 23));
    expect(summary.days).toHaveLength(SUMMARY_DAYS);
    expect(summary.days.map((d) => d.done)).toEqual([2, 0, 3, 0, 0, 0, 4]);
    expect(summary.totalDone).toBe(9);
    expect(summary.activeDays).toBe(3);
    expect(summary.trackedDays).toBe(7);
    expect(summary.recurringDone).toBe(3);
    expect(summary.focusSessions).toBe(3);
    expect(summary.empty).toBe(false);
  });

  it('uses local midnight as the day edge', () => {
    const days = [rec(local(11, 1, 0), 1), rec(local(10, 31, 23), 1)];
    const summary = getWeeklySummary(days, created, new Date(2026, 10, 1, 0, 0, 1).getTime());
    expect(summary.days[6].done).toBe(1);
    expect(summary.days[5].done).toBe(1);
    expect(getWeeklySummary([rec(local(10, 26, 0), 5)], created, local(11, 1)).days[0].done).toBe(5);
    expect(getWeeklySummary([rec(local(10, 25, 23), 5)], created, local(11, 1)).totalDone).toBe(0);
  });

  it('merges duplicate records of the same day', () => {
    const summary = getWeeklySummary([rec(local(11, 1, 8), 1), rec(local(11, 1, 20), 2)], created, local(11, 1));
    expect(summary.days[6].done).toBe(3);
  });

  it('keeps seven distinct days across the spring daylight-saving change (Lisbon 2026-03-29)', () => {
    const summary = getWeeklySummary([rec(local(3, 29), 2), rec(local(3, 28), 1)], created, local(3, 31));
    expect(dates(summary)).toEqual([25, 26, 27, 28, 29, 30, 31]);
    expect(summary.days.every((d) => new Date(d.date).getHours() === 0)).toBe(true);
    expect(summary.days[4].done).toBe(2);
    expect(summary.totalDone).toBe(3);
  });

  it('keeps seven distinct days across the autumn change (Lisbon 2026-10-25)', () => {
    const summary = getWeeklySummary([rec(local(10, 25), 4)], created, local(10, 27));
    expect(dates(summary)).toEqual([21, 22, 23, 24, 25, 26, 27]);
    expect(summary.days[4].done).toBe(4);
  });

  it('crosses month and year boundaries', () => {
    const summary = getWeeklySummary([rec(local(12, 30), 1)], created, local(1, 2, 9, 2027));
    expect(dates(summary)).toEqual([27, 28, 29, 30, 31, 1, 2]);
    expect(summary.days[3].done).toBe(1);
  });

  it('reports an empty week without treating it as a failure', () => {
    const summary = getWeeklySummary([rec(local(9, 1), 3)], created, local(11, 1));
    expect(summary.empty).toBe(true);
    expect(summary.totalDone).toBe(0);
    expect(summary.activeDays).toBe(0);
    expect(summary.trackedDays).toBe(7);
  });

  it('does not count days before tracking began', () => {
    const summary = getWeeklySummary([rec(local(10, 30), 2)], local(10, 29), local(11, 1));
    expect(summary.days.map((d) => d.tracked)).toEqual([false, false, false, true, true, true, true]);
    expect(summary.trackedDays).toBe(4);
    expect(summary.activeDays).toBe(1);
  });

  it('treats an earlier record as the start of tracking when createdAt is missing', () => {
    const summary = getWeeklySummary([rec(local(10, 30), 1)], 0, local(11, 1));
    expect(summary.days.map((d) => d.tracked)).toEqual([false, false, false, false, true, true, true]);
  });

  it('handles a brand new save', () => {
    const summary = getWeeklySummary([], 0, local(11, 1));
    expect(summary.empty).toBe(true);
    expect(summary.trackedDays).toBe(1);
  });

  it('gives the same summary after a backup code export and import', () => {
    const { gameStateService } = require('../src/services/gameStateService');
    const { createInitialGameState, createSaveData } = require('../src/utils/initialState');
    const now = local(6, 10);
    const state = {
      ...createInitialGameState(),
      createdAt: created,
      days: [rec(local(6, 9), 3, { recurringDone: 1, timersFinished: 2 }), rec(local(6, 7), 2)],
    };
    const restored = gameStateService.importSaveCode(gameStateService.exportSaveCode(createSaveData(state))).gameState;
    expect(getWeeklySummary(restored.days, restored.createdAt, now)).toEqual(
      getWeeklySummary(state.days, state.createdAt, now),
    );
    expect(getWeeklySummary(restored.days, restored.createdAt, now).totalDone).toBe(5);
  });
});

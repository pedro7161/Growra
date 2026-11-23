import { gameStateService } from '../src/services/gameStateService';
import { createInitialGameState, createSaveData } from '../src/utils/initialState';
import { createDayRecord } from '../src/utils/journey';
import {
  getHistoryDay,
  getMonthBounds,
  getMonthHistory,
  indexDays,
  shiftMonth,
} from '../src/utils/calendarHistory';
import { DayRecord } from '../src/types';
import { getAppCopy } from '../src/constants/appCopy';

const local = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();
const rec = (date: number, done: number, completions: DayRecord['completions'] = []): DayRecord => ({
  ...createDayRecord(new Date(date).setHours(0, 0, 0, 0)),
  done,
  completions,
});

describe('calendar history (#79)', () => {
  const created = local(2026, 1, 10);
  const now = local(2026, 11, 11);

  it('buckets a record by local day and reports its completions oldest first', () => {
    const day = local(2026, 3, 5, 0);
    const index = indexDays([
      rec(day, 3, [
        { name: 'b', at: local(2026, 3, 5, 18) },
        { name: 'a', at: local(2026, 3, 5, 9) },
      ]),
    ]);
    const result = getHistoryDay(index, local(2026, 3, 5, 23), created, now);
    expect(result.status).toBe('done');
    expect(result.done).toBe(3);
    expect(result.completions.map((c) => c.name)).toEqual(['a', 'b']);
    expect(result.truncated).toBe(true); // 3 done, 2 named
  });

  it('separates untracked, empty tracked and future days', () => {
    const index = indexDays([rec(local(2026, 6, 1, 0), 1)]);
    expect(getHistoryDay(index, local(2026, 1, 9), created, now).status).toBe('untracked');
    expect(getHistoryDay(index, local(2026, 1, 10), created, now).status).toBe('none');
    expect(getHistoryDay(index, local(2026, 12, 1), created, now).status).toBe('future');
    expect(getHistoryDay(index, local(2026, 11, 11), created, now).status).toBe('none');
  });

  it('treats a record older than createdAt as proof tracking began then', () => {
    const index = indexDays([rec(local(2025, 12, 30, 0), 1)]);
    expect(getHistoryDay(index, local(2025, 12, 29), created, now).status).toBe('untracked');
    expect(getHistoryDay(index, local(2025, 12, 31), created, now).status).toBe('none');
  });

  it('is empty-safe with no records and no creation time', () => {
    const index = indexDays([]);
    expect(getHistoryDay(index, now, 0, now).status).toBe('none');
    expect(getMonthHistory(index, 2026, 10, 0, now).days.map((d) => d.status[0]).join('')).toBe('u'.repeat(10) + 'n' + 'f'.repeat(19));
  });

  it('builds months with correct lengths, leap February and Monday offsets', () => {
    const index = indexDays([]);
    expect(getMonthHistory(index, 2024, 1, created, now).days).toHaveLength(29);
    expect(getMonthHistory(index, 2026, 1, created, now).days).toHaveLength(28);
    expect(getMonthHistory(index, 2026, 10, created, now).mondayOffset).toBe(6); // 1 Nov 2026 is a Sunday
    expect(getMonthHistory(index, 2026, 5, created, now).mondayOffset).toBe(0); // 1 Jun 2026 is a Monday
  });

  it('navigates across year boundaries in both directions', () => {
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
    expect(shiftMonth(2025, 11, 1)).toEqual({ year: 2026, month: 0 });
    expect(shiftMonth(2026, 5, 14)).toEqual({ year: 2027, month: 7 });
    expect(getMonthHistory(indexDays([]), 2026, -1, created, now)).toMatchObject({ year: 2025, month: 11 });
    expect(getMonthBounds(indexDays([]), created, now)).toEqual({
      first: { year: 2026, month: 0 },
      last: { year: 2026, month: 10 },
    });
  });

  it('keeps one entry per calendar day across daylight-saving changes', () => {
    // Whatever the machine timezone, every day of March/October/November is distinct and in order.
    for (const month of [2, 9, 10]) {
      const days = getMonthHistory(indexDays([]), 2026, month, local(2020, 1, 1), now).days;
      const starts = days.map((d) => d.date);
      expect(new Set(starts).size).toBe(starts.length);
      starts.forEach((start, i) => expect(new Date(start).getDate()).toBe(i + 1));
      starts.forEach((start) => expect(new Date(start).getHours()).toBe(0));
    }
  });

  it('sums multiple records that land on one local day and never mutates the input', () => {
    const day = local(2026, 4, 2, 0);
    const records = [rec(day, 1), rec(day, 2)];
    const snapshot = JSON.stringify(records);
    const result = getHistoryDay(indexDays(records), day, created, now);
    expect(result.done).toBe(3);
    expect(JSON.stringify(records)).toBe(snapshot);
  });

  it('survives a backup export and import', () => {
    const state = createInitialGameState();
    const days = [rec(local(2026, 2, 28, 0), 2, [{ name: 'x', at: local(2026, 2, 28, 8) }]), rec(local(2026, 3, 1, 0), 1)];
    const save = createSaveData({ ...state, days, createdAt: created });
    const restored = gameStateService.importSaveCode(gameStateService.exportSaveCode(save));
    expect(restored.gameState.days).toEqual(days);
    expect(restored.gameState.createdAt).toBe(created);
    const index = indexDays(restored.gameState.days);
    const feb = getMonthHistory(index, 2026, 1, restored.gameState.createdAt, now);
    expect(feb.days[27].status).toBe('done');
    expect(getMonthHistory(index, 2026, 2, created, now).days[0].done).toBe(1);
  });

  it('has history copy with matching placeholders in English and Portuguese', () => {
    for (const language of ['en', 'pt'] as const) {
      const copy = getAppCopy(language);
      expect(copy.calendarDayDone).toContain('{day}');
      expect(copy.calendarDayDone).toContain('{done}');
      expect(copy.calendarDayNotTracked).toContain('{day}');
    }
  });
});

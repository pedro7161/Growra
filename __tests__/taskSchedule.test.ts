import { TaskFrequency } from '../src/types';
import {
  addDaysToStartOfDay,
  getCalendarDayDifference,
  getNextAvailableDate,
  getStartOfDay,
} from '../src/utils/taskSchedule';
import { createCustomTask } from '../src/utils/taskFactory';

const local = (y: number, m: number, d: number, h = 0) => new Date(y, m - 1, d, h).getTime();

describe('day boundaries across daylight-saving changes (Europe/Lisbon)', () => {
  it('moves to the next calendar midnight on the 25-hour autumn day', () => {
    expect(addDaysToStartOfDay(local(2026, 10, 25, 10), 1)).toBe(local(2026, 10, 26));
  });

  it('moves to the next calendar midnight on the 23-hour spring day', () => {
    expect(addDaysToStartOfDay(local(2026, 3, 29, 10), 1)).toBe(local(2026, 3, 30));
  });

  it('keeps a completed daily task hidden for the rest of the autumn change day', () => {
    const task = createCustomTask('Water', '', 'health', TaskFrequency.DAILY);
    const nextDue = getNextAvailableDate(task, local(2026, 10, 25, 9));
    expect(nextDue).toBe(local(2026, 10, 26));
    expect(nextDue).toBeGreaterThan(local(2026, 10, 25, 23));
  });

  it('schedules a weekly task exactly one calendar week later across a change', () => {
    const task = createCustomTask('Review', '', 'work', TaskFrequency.WEEKLY);
    expect(getNextAvailableDate(task, local(2026, 10, 22, 9))).toBe(local(2026, 10, 29));
  });

  it('counts consecutive calendar days as 1 even when the day is 23 or 25 hours long', () => {
    expect(getCalendarDayDifference(local(2026, 3, 28, 22), local(2026, 3, 29, 8))).toBe(1);
    expect(getCalendarDayDifference(local(2026, 3, 29, 22), local(2026, 3, 30, 8))).toBe(1);
    expect(getCalendarDayDifference(local(2026, 10, 25, 22), local(2026, 10, 26, 8))).toBe(1);
  });

  it('treats two times on the same day as 0 days apart', () => {
    expect(getCalendarDayDifference(local(2026, 6, 1, 1), local(2026, 6, 1, 23))).toBe(0);
    expect(getStartOfDay(local(2026, 6, 1, 23))).toBe(local(2026, 6, 1));
  });
});

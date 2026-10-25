import { currentSeason, isSeason, seasonKey } from '../src/utils/seasons';

const day = (year: number, month: number, date: number, hour = 12) => new Date(year, month - 1, date, hour).getTime();

describe('seasons (same windows as SHARDMARCH)', () => {
  it('Halloween runs Oct 1 to Nov 2, and to Nov 9 in 2026', () => {
    expect(isSeason('halloween', day(2027, 10, 1))).toBe(true);
    expect(isSeason('halloween', day(2027, 11, 3))).toBe(false);
    expect(isSeason('halloween', day(2026, 11, 9, 23))).toBe(true);
    expect(isSeason('halloween', day(2026, 11, 10))).toBe(false);
  });

  it('Christmas runs Dec 1 to Jan 6', () => {
    expect(isSeason('christmas', day(2026, 12, 1))).toBe(true);
    expect(isSeason('christmas', day(2027, 1, 6, 23))).toBe(true);
    expect(isSeason('christmas', day(2027, 1, 7))).toBe(false);
  });

  it('names the running season and its year', () => {
    expect(currentSeason(day(2026, 10, 25))).toBe('halloween');
    expect(currentSeason(day(2026, 6, 1))).toBeNull();
    expect(seasonKey(day(2026, 10, 25))).toBe('halloween-2026');
    expect(seasonKey(day(2027, 1, 3))).toBe('christmas-2026'); // the season that began in December
    expect(seasonKey(day(2026, 6, 1))).toBeNull();
  });
});

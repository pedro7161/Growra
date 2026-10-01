import {
  ROOM_STYLES,
  STARTER_ROOM_STYLE,
  easterSunday,
  getRoomItemSize,
  isFurniture,
  isSetInSeason,
} from '../src/utils/roomCatalog';
import { DECORATION_TYPES, buyDecoration, getDecorationType } from '../src/utils/journey';
import { createInitialGameState } from '../src/utils/initialState';

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).getTime();

describe('room catalog', () => {
  it('has a free starter, 5 coin styles and 5 set styles', () => {
    expect(ROOM_STYLES.find((s) => s.id === STARTER_ROOM_STYLE)?.price).toBe(0);
    expect(ROOM_STYLES.filter((s) => !s.set && s.price > 0)).toHaveLength(5);
    expect(new Set(ROOM_STYLES.filter((s) => s.set).map((s) => s.set))).toEqual(
      new Set(['japanese', 'halloween', 'christmas', 'valentines', 'easter']),
    );
  });

  it('marks furniture and gives every furniture item a room size', () => {
    const furniture = DECORATION_TYPES.filter(isFurniture);
    expect(furniture.length).toBeGreaterThanOrEqual(16 + 24);
    furniture.forEach((type) => expect(type.roomSize).toBeGreaterThan(0));
    expect(isFurniture(getDecorationType('shell')!)).toBe(false);
    expect(getRoomItemSize('shell')).toBe(0.2);
  });

  it('computes Easter Sunday', () => {
    expect(easterSunday(2026).toDateString()).toBe(new Date(2026, 3, 5).toDateString());
    expect(easterSunday(2027).toDateString()).toBe(new Date(2027, 2, 28).toDateString());
  });

  it('keeps Japanese always in season and events only in their windows', () => {
    expect(isSetInSeason('japanese', at(2026, 7, 1))).toBe(true);
    expect(isSetInSeason('halloween', at(2026, 10, 20))).toBe(true);
    expect(isSetInSeason('halloween', at(2026, 11, 3))).toBe(false);
    expect(isSetInSeason('christmas', at(2026, 12, 1))).toBe(true);
    expect(isSetInSeason('christmas', at(2027, 1, 3))).toBe(true);
    expect(isSetInSeason('christmas', at(2027, 1, 7))).toBe(false);
    expect(isSetInSeason('valentines', at(2027, 2, 14))).toBe(true);
    expect(isSetInSeason('valentines', at(2027, 2, 16))).toBe(false);
    expect(isSetInSeason('easter', at(2027, 3, 21))).toBe(true);
    expect(isSetInSeason('easter', at(2027, 4, 5))).toBe(false);
  });

  it('camp shop refuses furniture', () => {
    const state = { ...createInitialGameState(), coins: 10000 };
    const bed = DECORATION_TYPES.find(isFurniture)!;
    expect(buyDecoration(state, bed.id)).toBe(state);
  });
});

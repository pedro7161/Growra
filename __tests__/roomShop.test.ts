import { buyFurniture, buyRoomStyle, getFurnitureShopStatus, getStyleShopStatus } from '../src/utils/roomShop';
import { createInitialGameState } from '../src/utils/initialState';

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).getTime();
const rich = () => ({ ...createInitialGameState(), coins: 1000 });
const richPlus = () => ({ ...rich(), plus: { owned: true, lastCheckedAt: 1 } });

describe('room shop', () => {
  it('buys a coin style once and takes the coins', () => {
    const next = buyRoomStyle(rich(), 'library', at(2026, 7, 1));
    expect(next.ownedRoomStyles).toContain('library');
    expect(next.coins).toBe(800);
    expect(getStyleShopStatus(next, 'library', at(2026, 7, 1))).toBe('owned');
    expect(buyRoomStyle(next, 'library', at(2026, 7, 1))).toBe(next);
  });

  it('refuses when coins are short', () => {
    const poor = { ...createInitialGameState(), coins: 10 };
    expect(getFurnitureShopStatus(poor, 'bed', at(2026, 7, 1))).toBe('too-expensive');
    expect(buyFurniture(poor, 'bed', at(2026, 7, 1))).toBe(poor);
  });

  it('gates Plus sets behind Plus', () => {
    expect(getStyleShopStatus(rich(), 'japanese-room', at(2026, 7, 1))).toBe('needs-plus');
    expect(buyFurniture(rich(), 'bonsai', at(2026, 7, 1)).decorations).toHaveLength(0);
    expect(buyFurniture(richPlus(), 'bonsai', at(2026, 7, 1)).decorations[0].typeId).toBe('bonsai');
  });

  it('sells event sets only in season, even with Plus', () => {
    expect(getFurnitureShopStatus(richPlus(), 'pumpkins', at(2026, 7, 1))).toBe('out-of-season');
    expect(buyFurniture(richPlus(), 'pumpkins', at(2026, 10, 20)).decorations[0].typeId).toBe('pumpkins');
  });

  it('puts bought furniture in the bag, not in a room', () => {
    const next = buyFurniture(rich(), 'bed', at(2026, 7, 1));
    expect(next.decorations[0]).toMatchObject({ typeId: 'bed', camp: -1, spot: -1 });
    expect(next.decorations[0].roomId).toBeUndefined();
  });
});

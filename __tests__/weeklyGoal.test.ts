import AsyncStorage from '@react-native-async-storage/async-storage';
import { gameStateService } from '../src/services/gameStateService';
import { createInitialGameState, createSaveData } from '../src/utils/initialState';
import { createDayRecord } from '../src/utils/journey';
import {
  getWeekStart,
  getWeeklyGoalProgress,
  normalizeWeeklyGoal,
  stepWeeklyGoal,
  WEEKLY_GOAL_MAX,
} from '../src/utils/weeklyGoal';
import { DayRecord } from '../src/types';

const rec = (date: number, done: number): DayRecord => ({ ...createDayRecord(date), done });
const local = (m: number, d: number, h = 12, y = 2026) => new Date(y, m - 1, d, h).getTime();

describe('weekly goal progress (#80)', () => {
  // 2026-11-11 is a Wednesday; its week is Mon 9 to Sun 15.
  const now = local(11, 11);

  it('weeks start on local Monday midnight', () => {
    expect(getWeekStart(now)).toBe(local(11, 9, 0));
    expect(getWeekStart(local(11, 15, 23))).toBe(local(11, 9, 0));
    expect(getWeekStart(local(11, 16, 0))).toBe(local(11, 16, 0));
  });

  it('sums only the current week from saved day records, edges inclusive of Monday and Sunday', () => {
    const days = [rec(local(11, 8, 0), 9), rec(local(11, 9, 0), 2), rec(local(11, 11, 8), 1), rec(local(11, 15, 0), 3), rec(local(11, 16, 0), 7)];
    const p = getWeeklyGoalProgress(days, 10, now);
    expect(p.done).toBe(6);
    expect(p.remaining).toBe(4);
    expect(p.met).toBe(false);
  });

  it('sums several records of one day once each and does not double count', () => {
    const p = getWeeklyGoalProgress([rec(local(11, 10, 0), 2), rec(local(11, 10, 15), 1)], 3, now);
    expect(p.done).toBe(3);
    expect(p.met).toBe(true);
    expect(p.remaining).toBe(0);
  });

  it('handles month and year rollover', () => {
    const newYear = local(1, 1, 12, 2026); // Thursday; week starts Mon Dec 29 2025
    const days = [rec(local(12, 29, 0, 2025), 2), rec(local(12, 31, 12, 2025), 1), rec(local(12, 28, 12, 2025), 5)];
    expect(getWeeklyGoalProgress(days, 4, newYear).done).toBe(3);
  });

  it('keeps one day per calendar day across daylight-saving changes', () => {
    for (const [month, day] of [[3, 29], [10, 25], [3, 8], [11, 1]]) {
      const start = getWeekStart(local(month, day, 12));
      const week = [0, 1, 2, 3, 4, 5, 6].map((i) => rec(new Date(new Date(start).getFullYear(), new Date(start).getMonth(), new Date(start).getDate() + i, 1).getTime(), 1));
      expect(getWeeklyGoalProgress(week, 7, local(month, day, 12)).done).toBe(7);
    }
  });

  it('an unmet goal is only a number: no penalty, no reset, other state untouched', () => {
    const base = createInitialGameState();
    const state = { ...base, coins: 40, settings: { ...base.settings, weeklyGoal: 5 } };
    const p = getWeeklyGoalProgress([], 5, now);
    expect(p.met).toBe(false);
    expect(p.done).toBe(0);
    expect(state.coins).toBe(40);
  });

  it('goal 0 means off and is never met', () => {
    expect(getWeeklyGoalProgress([rec(local(11, 11, 0), 4)], 0, now).met).toBe(false);
  });

  it('creates, edits, clears and clamps goals', () => {
    expect(stepWeeklyGoal(5, 1)).toBe(6);
    expect(stepWeeklyGoal(1, -1)).toBe(1);
    expect(stepWeeklyGoal(WEEKLY_GOAL_MAX, 1)).toBe(WEEKLY_GOAL_MAX);
    expect(normalizeWeeklyGoal(0)).toBe(0);
    expect(normalizeWeeklyGoal(7)).toBe(7);
    for (const bad of [-1, 2.5, 51, '5', null, undefined, NaN]) expect(normalizeWeeklyGoal(bad)).toBe(0);
  });
});

describe('weeklyGoal persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  const oldSave = () => {
    const base = createInitialGameState();
    const { weeklyGoal: _g, ...settings } = base.settings;
    return JSON.stringify({ ...createSaveData({ ...base, settings, coins: 55 } as never), version: 24 });
  };

  it('defaults to no goal', () => {
    expect(createInitialGameState().settings.weeklyGoal).toBe(0);
  });

  it('an old save without a goal loads with none and keeps other fields', async () => {
    await AsyncStorage.setItem('growra_save_data', oldSave());
    const result = await gameStateService.loadGame();
    expect(result.status).toBe('loaded');
    if (result.status !== 'loaded') return;
    expect(result.saveData.gameState.settings.weeklyGoal).toBe(0);
    expect(result.saveData.gameState.coins).toBe(55);
  });

  it('a goal survives a restart; garbage loads as no goal', async () => {
    const base = createInitialGameState();
    await gameStateService.saveGame(createSaveData({ ...base, settings: { ...base.settings, weeklyGoal: 6 } }));
    const loaded = await gameStateService.loadGame();
    expect(loaded.status === 'loaded' && loaded.saveData.gameState.settings.weeklyGoal).toBe(6);

    const parsed = JSON.parse(oldSave());
    parsed.gameState.settings.weeklyGoal = 'lots';
    await AsyncStorage.setItem('growra_save_data', JSON.stringify(parsed));
    const garbage = await gameStateService.loadGame();
    expect(garbage.status === 'loaded' && garbage.saveData.gameState.settings.weeklyGoal).toBe(0);
  });

  it('a backup round trip keeps the goal; an old backup restores with none', () => {
    const base = createInitialGameState();
    const code = gameStateService.exportSaveCode(createSaveData({ ...base, settings: { ...base.settings, weeklyGoal: 12 } }));
    expect(gameStateService.importSaveCode(code).gameState.settings.weeklyGoal).toBe(12);
    const old = gameStateService.importSaveCode(gameStateService.exportSaveCode(JSON.parse(oldSave())));
    expect(old.gameState.settings.weeklyGoal).toBe(0);
    expect(old.gameState.coins).toBe(55);
  });
});

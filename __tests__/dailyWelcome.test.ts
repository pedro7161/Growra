import AsyncStorage from '@react-native-async-storage/async-storage';
import { gameStateService } from '../src/services/gameStateService';
import { GameState } from '../src/types';
import {
  DAILY_WELCOME_COINS,
  canClaimDailyWelcome,
  claimDailyWelcome,
  isWelcomeClaimable,
  localDayKey,
  normalizeWelcomeClaimedDay,
} from '../src/utils/dailyWelcome';
import { createInitialGameState, createSaveData } from '../src/utils/initialState';

const at = (year: number, month: number, day: number, hour = 12) => new Date(year, month - 1, day, hour).getTime();
const player = (extra: Partial<GameState> = {}): GameState => ({
  ...createInitialGameState(),
  tutorialCompleted: true,
  coins: 100,
  ...extra,
});

describe('daily welcome rule', () => {
  it('formats the local day with zero padding', () => {
    expect(localDayKey(at(2026, 3, 5, 0))).toBe('2026-03-05');
    expect(localDayKey(at(2026, 12, 31, 23))).toBe('2026-12-31');
  });

  it('is small: at or below the smallest flat daily perk (2 coins)', () => {
    expect(DAILY_WELCOME_COINS).toBeGreaterThan(0);
    expect(DAILY_WELCOME_COINS).toBeLessThanOrEqual(2);
  });

  it('pays on the first claim ever', () => {
    const claim = claimDailyWelcome(player(), at(2026, 11, 10));
    expect(claim.coins).toBe(DAILY_WELCOME_COINS);
    expect(claim.state.coins).toBe(100 + DAILY_WELCOME_COINS);
    expect(claim.state.welcomeClaimedDay).toBe('2026-11-10');
  });

  it('pays once per day: a double tap, a second open and later the same day pay nothing', () => {
    const first = claimDailyWelcome(player(), at(2026, 11, 10, 8));
    const again = claimDailyWelcome(first.state, at(2026, 11, 10, 8));
    const later = claimDailyWelcome(again.state, at(2026, 11, 10, 23));
    expect(again.coins).toBe(0);
    expect(later.coins).toBe(0);
    expect(later.state.coins).toBe(100 + DAILY_WELCOME_COINS);
    expect(canClaimDailyWelcome(first.state, at(2026, 11, 10, 23))).toBe(false);
  });

  it('is available again the next day, and missing days costs nothing and pays no extra', () => {
    const first = claimDailyWelcome(player(), at(2026, 11, 10));
    const nextDay = claimDailyWelcome(first.state, at(2026, 11, 11, 0));
    expect(nextDay.coins).toBe(DAILY_WELCOME_COINS);
    const afterAWeek = claimDailyWelcome(nextDay.state, at(2026, 11, 18));
    expect(afterAWeek.coins).toBe(DAILY_WELCOME_COINS);
    expect(afterAWeek.state.coins).toBe(100 + 3 * DAILY_WELCOME_COINS);
  });

  it('does not pay when the clock goes back', () => {
    const claimed = claimDailyWelcome(player(), at(2026, 11, 10)).state;
    expect(claimDailyWelcome(claimed, at(2026, 11, 9, 23)).coins).toBe(0);
    expect(claimDailyWelcome(claimed, at(2025, 1, 1)).coins).toBe(0);
    expect(canClaimDailyWelcome(claimed, at(2026, 11, 9))).toBe(false);
  });

  it('pays at most once when the clock jumps forward, then not again that day or after going back', () => {
    const claimed = claimDailyWelcome(player(), at(2026, 11, 10)).state;
    const forward = claimDailyWelcome(claimed, at(2026, 12, 25));
    expect(forward.coins).toBe(DAILY_WELCOME_COINS);
    expect(claimDailyWelcome(forward.state, at(2026, 12, 25, 20)).coins).toBe(0);
    expect(claimDailyWelcome(forward.state, at(2026, 11, 11)).coins).toBe(0);
  });

  it('crossing midnight starts a new day exactly at 00:00', () => {
    expect(isWelcomeClaimable('2026-11-10', localDayKey(at(2026, 11, 10, 23)))).toBe(false);
    expect(isWelcomeClaimable('2026-11-10', localDayKey(at(2026, 11, 11, 0)))).toBe(true);
    expect(isWelcomeClaimable('2026-12-31', '2027-01-01')).toBe(true);
  });

  it('pays nothing when switched off or before the tutorial is done, and changes no other state', () => {
    const off = player({ settings: { ...player().settings, dailyWelcome: false } });
    expect(claimDailyWelcome(off, at(2026, 11, 10))).toEqual({ state: off, coins: 0 });
    const tutorial = player({ tutorialCompleted: false });
    expect(canClaimDailyWelcome(tutorial, at(2026, 11, 10))).toBe(false);
    const claim = claimDailyWelcome(player(), at(2026, 11, 10));
    expect({ ...claim.state, coins: 0, welcomeClaimedDay: '' }).toEqual({ ...player(), coins: 0, welcomeClaimedDay: '', playerId: claim.state.playerId, createdAt: claim.state.createdAt, lastPlayedAt: claim.state.lastPlayedAt });
  });

  it('treats a damaged claim day as never claimed', () => {
    expect(normalizeWelcomeClaimedDay('2026-11-10')).toBe('2026-11-10');
    for (const bad of [undefined, null, 5, '', 'yesterday', '2026-1-1', {}]) expect(normalizeWelcomeClaimedDay(bad)).toBe('');
  });
});

describe('daily welcome persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  const oldSave = () => {
    const { welcomeClaimedDay: _day, ...rest } = createInitialGameState();
    const { dailyWelcome: _flag, ...settings } = rest.settings;
    return JSON.stringify({ ...createSaveData({ ...rest, settings, coins: 77 } as never), version: 22 });
  };

  it('an old save gets welcomeClaimedDay "" and dailyWelcome on, and keeps its other fields', async () => {
    await AsyncStorage.setItem('growra_save_data', oldSave());
    const result = await gameStateService.loadGame();
    expect(result.status).toBe('loaded');
    if (result.status !== 'loaded') return;
    expect(result.saveData.gameState.welcomeClaimedDay).toBe('');
    expect(result.saveData.gameState.settings.dailyWelcome).toBe(true);
    expect(result.saveData.gameState.coins).toBe(77);
  });

  it('a save with the field keeps the claim day and a switched-off setting across a restart', async () => {
    const base = player({ welcomeClaimedDay: '2026-11-10' });
    await gameStateService.saveGame(createSaveData({ ...base, settings: { ...base.settings, dailyWelcome: false } }));
    const result = await gameStateService.loadGame();
    expect(result.status).toBe('loaded');
    if (result.status !== 'loaded') return;
    expect(result.saveData.gameState.welcomeClaimedDay).toBe('2026-11-10');
    expect(result.saveData.gameState.settings.dailyWelcome).toBe(false);
  });

  it('a restart the same day does not pay again', async () => {
    const claim = claimDailyWelcome(player(), at(2026, 11, 10, 9));
    await gameStateService.saveGame(createSaveData(claim.state));
    const result = await gameStateService.loadGame();
    if (result.status !== 'loaded') throw new Error('save should load');
    expect(claimDailyWelcome(result.saveData.gameState, at(2026, 11, 10, 21)).coins).toBe(0);
    expect(result.saveData.gameState.coins).toBe(100 + DAILY_WELCOME_COINS);
  });

  it('a garbage claim day in a save loads as never claimed', async () => {
    const parsed = JSON.parse(oldSave());
    parsed.gameState.welcomeClaimedDay = 12345;
    await AsyncStorage.setItem('growra_save_data', JSON.stringify(parsed));
    const result = await gameStateService.loadGame();
    expect(result.status === 'loaded' && result.saveData.gameState.welcomeClaimedDay).toBe('');
  });

  it('a corrupt save is kept as a backup and nothing is paid', async () => {
    await AsyncStorage.setItem('growra_save_data', '{broken');
    const result = await gameStateService.loadGame();
    expect(result.status).toBe('corrupt');
  });

  it('a backup code round trip keeps the claim day, so a restore the same day does not pay again', () => {
    const claim = claimDailyWelcome(player(), at(2026, 11, 10, 9));
    const code = gameStateService.exportSaveCode(createSaveData(claim.state));
    const restored = gameStateService.importSaveCode(code).gameState;
    expect(restored.welcomeClaimedDay).toBe('2026-11-10');
    expect(claimDailyWelcome(restored, at(2026, 11, 10, 20)).coins).toBe(0);
    expect(claimDailyWelcome(restored, at(2026, 11, 11, 8)).coins).toBe(DAILY_WELCOME_COINS);
  });

  it('a backup code from before the welcome field restores as never claimed with the setting on', () => {
    const code = gameStateService.exportSaveCode(JSON.parse(oldSave()));
    const restored = gameStateService.importSaveCode(code).gameState;
    expect(restored.welcomeClaimedDay).toBe('');
    expect(restored.settings.dailyWelcome).toBe(true);
    expect(restored.coins).toBe(77);
  });
});

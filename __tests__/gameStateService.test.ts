import AsyncStorage from '@react-native-async-storage/async-storage';
import { gameStateService } from '../src/services/gameStateService';
import { createCompanion, getSellValue } from '../src/utils/gameplay';
import { PetRarity, TaskFrequency } from '../src/types';
import { createInitialGameState, createSaveData } from '../src/utils/initialState';
import { createCustomTask } from '../src/utils/taskFactory';

describe('gameStateService.loadGame', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('reports an empty store', async () => {
    expect(await gameStateService.loadGame()).toEqual({ status: 'empty' });
  });

  it('loads and migrates a valid save', async () => {
    await gameStateService.saveGame(createSaveData(createInitialGameState()));
    expect((await gameStateService.loadGame()).status).toBe('loaded');
  });

  it('keeps an unreadable save under a backup key instead of losing it', async () => {
    await AsyncStorage.setItem('growra_save_data', '{not json');
    const result = await gameStateService.loadGame();

    expect(result.status).toBe('corrupt');
    if (result.status !== 'corrupt') return;
    expect(await AsyncStorage.getItem(result.backupKey)).toBe('{not json');
    expect(await AsyncStorage.getItem('growra_save_data')).toBe('{not json');
  });

  it('turns an old gacha save into companions without losing value', async () => {
    const kept = { ...createCompanion('sprout'), id: 'kept', fusionLevel: 2, equipped: false };
    const duplicate = { ...createCompanion('sprout'), id: 'dupe', fusionLevel: 0, equipped: true };
    const other = { ...createCompanion('glint'), id: 'glint', fusionLevel: 0 };
    const legacy = createSaveData(createInitialGameState());
    const legacyState = {
      ...legacy.gameState,
      coins: 10,
      pityCurrency: 4,
      pets: [kept, duplicate, other].map(({ bond: _bond, ...pet }) => pet),
      equippedPetId: 'dupe',
    };
    await AsyncStorage.setItem('growra_save_data', JSON.stringify({ ...legacy, gameState: legacyState }));

    const result = await gameStateService.loadGame();
    expect(result.status).toBe('loaded');
    if (result.status !== 'loaded') return;
    const { gameState } = result.saveData;

    expect(gameState.pets.map((pet) => pet.id).sort()).toEqual(['glint', 'kept']);
    // Fusion level 2 becomes 30 Bond, which is the first evolution.
    expect(gameState.pets.find((pet) => pet.id === 'kept')?.evolutionStage).toBe(1);
    // The equipped duplicate hands "active" to the copy that was kept.
    expect(gameState.equippedPetId).toBe('kept');
    const converted = getSellValue(duplicate.rarity) + 4 * 5;
    expect(gameState.coins).toBe(10 + converted);
    expect(gameState.notices).toEqual([{ kind: 'companions-migrated', coins: converted }]);
    expect('pityCurrency' in gameState).toBe(false);
  });

  it('turns expeditions into the Journey: gear to coins, road from past completions', async () => {
    const legacy = createSaveData(createInitialGameState());
    const doneAt = new Date(2026, 5, 3, 10).getTime();
    const { days: _days, decorations: _decorations, ...legacyState } = legacy.gameState;
    const oldState = {
      ...legacyState,
      coins: 0,
      gearItems: [{ id: 'g', name: 'Old Blade', rarity: 'rare', sourceZoneIndex: 0, equippedPetId: '', acquiredAt: 0 }],
      battleConsumables: [{ id: 'c', name: 'Tonic', kind: 'heal', rarity: 'common', potency: 1 }],
      expeditionProgress: { expeditionsSent: 3, revealPoints: 10 },
      tasks: [{ ...createCustomTask('Stretch', '', 'health', TaskFrequency.DAILY), completedAt: doneAt }],
    };
    await AsyncStorage.setItem('growra_save_data', JSON.stringify({ ...legacy, gameState: oldState }));

    const result = await gameStateService.loadGame();
    if (result.status !== 'loaded') throw new Error('expected a loaded save');
    const { gameState } = result.saveData;

    const gearCoins = Math.floor(getSellValue(PetRarity.RARE) / 2) + 10;
    expect(gameState.coins).toBe(gearCoins);
    expect(gameState.notices).toEqual([{ kind: 'journey-migrated', coins: gearCoins }]);
    expect(gameState.days).toEqual([
      expect.objectContaining({ done: 1, completions: [{ name: 'Stretch', at: doneAt }] }),
    ]);
    expect('expeditionProgress' in gameState).toBe(false);
    expect('gearItems' in gameState).toBe(false);
  });
});

describe('plus and explore state', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('defaults a new game to no Plus and no finds today', () => {
    const state = createInitialGameState();
    expect(state.plus).toEqual({ owned: false, lastCheckedAt: 0 });
    expect(state.explore).toEqual({ day: 0, count: 0 });
  });

  it('migrates an older save without plus/explore', async () => {
    const legacy = createSaveData(createInitialGameState()) as any;
    delete legacy.gameState.plus;
    delete legacy.gameState.explore;
    await AsyncStorage.setItem('growra_save_data', JSON.stringify(legacy));
    const result = await gameStateService.loadGame();
    expect(result.status).toBe('loaded');
    if (result.status !== 'loaded') return;
    expect(result.saveData.gameState.plus).toEqual({ owned: false, lastCheckedAt: 0 });
    expect(result.saveData.gameState.explore).toEqual({ day: 0, count: 0 });
  });

  it('keeps an owned Plus through save and load', async () => {
    const state = { ...createInitialGameState(), plus: { owned: true, lastCheckedAt: 5 } };
    await gameStateService.saveGame(createSaveData(state));
    const result = await gameStateService.loadGame();
    if (result.status !== 'loaded') throw new Error('not loaded');
    expect(result.saveData.gameState.plus.owned).toBe(true);
  });
});

describe('room state', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('starts a new game with no rooms, the starter style and the footer on', () => {
    const state = createInitialGameState();
    expect(state.rooms).toEqual([]);
    expect(state.ownedRoomStyles).toEqual(['wooden-bedroom']);
    expect(state.roomShareFooter).toBe(true);
  });

  it('migrates an older save without room fields', async () => {
    const legacy = createSaveData(createInitialGameState()) as any;
    delete legacy.gameState.rooms;
    delete legacy.gameState.ownedRoomStyles;
    delete legacy.gameState.roomShareFooter;
    await AsyncStorage.setItem('growra_save_data', JSON.stringify(legacy));
    const result = await gameStateService.loadGame();
    if (result.status !== 'loaded') throw new Error('not loaded');
    expect(result.saveData.gameState.rooms).toEqual([]);
    expect(result.saveData.gameState.ownedRoomStyles).toEqual(['wooden-bedroom']);
    expect(result.saveData.gameState.roomShareFooter).toBe(true);
  });
});

describe('save hardening (#46)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('refuses a backup code whose checksum is fine but whose contents are the wrong shape', () => {
    const good = createSaveData(createInitialGameState());
    const code = gameStateService.exportSaveCode(good);
    expect(gameStateService.importSaveCode(code).gameState.tasks).toEqual([]);

    const broken = { ...good, gameState: { ...good.gameState, tasks: 'oops', coins: 'many' } };
    const badCode = gameStateService.exportSaveCode(broken as never);
    expect(() => gameStateService.importSaveCode(badCode)).toThrow();
  });

  it('treats a readable save with the wrong shape as corrupt instead of loading it', async () => {
    await AsyncStorage.setItem('growra_save_data', JSON.stringify({ version: 16, gameState: { tasks: 5 } }));
    expect((await gameStateService.loadGame()).status).toBe('corrupt');
  });

  it('keeps only the two newest unreadable saves', async () => {
    await AsyncStorage.setItem('growra_save_data_corrupt_100', 'a');
    await AsyncStorage.setItem('growra_save_data_corrupt_200', 'b');
    await AsyncStorage.setItem('growra_save_data_corrupt_300', 'c');
    await AsyncStorage.setItem('growra_save_data', '{not json');
    const result = await gameStateService.loadGame();

    const kept = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith('growra_save_data_corrupt_'));
    expect(kept).toHaveLength(2);
    expect(result.status === 'corrupt' && kept.includes(result.backupKey)).toBe(true);
    expect(kept).toContain('growra_save_data_corrupt_300');
  });

  it('reports a failed write instead of swallowing it', async () => {
    // setItem is already a jest.fn in the AsyncStorage mock; spyOn + mockRestore would wipe its implementation.
    (AsyncStorage.setItem as jest.Mock).mockImplementationOnce(() => Promise.reject(new Error('disk full')));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(await gameStateService.saveGame(createSaveData(createInitialGameState()))).toBe(false);
    expect(await gameStateService.saveGame(createSaveData(createInitialGameState()))).toBe(true);
    errorSpy.mockRestore();
  });

  it('shares a backup code for a readable save and the raw text for a broken one', async () => {
    expect(await gameStateService.readStoredSaveForSharing()).toBeNull();
    await gameStateService.saveGame(createSaveData(createInitialGameState()));
    expect(await gameStateService.readStoredSaveForSharing()).toMatch(/^[^:]+:[^:]+:/);
    await AsyncStorage.setItem('growra_save_data', '{not json');
    expect(await gameStateService.readStoredSaveForSharing()).toBe('{not json');
  });
});

describe('save versioning (#50)', () => {
  const { SAVE_VERSION } = require('../src/utils/initialState');
  const { NewerSaveError } = require('../src/services/gameStateService');

  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('loads a same-version save unchanged in version', async () => {
    await gameStateService.saveGame(createSaveData(createInitialGameState()));
    const result = await gameStateService.loadGame();
    expect(result.status === 'loaded' && result.saveData.version).toBe(SAVE_VERSION);
  });

  it('migrates an older save and stamps the current version', async () => {
    const old = { ...createSaveData(createInitialGameState()), version: 9 };
    await AsyncStorage.setItem('growra_save_data', JSON.stringify(old));
    const result = await gameStateService.loadGame();
    expect(result.status === 'loaded' && result.saveData.version).toBe(SAVE_VERSION);
  });

  it('refuses a save from a newer build and leaves it untouched', async () => {
    const newer = JSON.stringify({ ...createSaveData(createInitialGameState()), version: SAVE_VERSION + 1 });
    await AsyncStorage.setItem('growra_save_data', newer);
    expect(await gameStateService.loadGame()).toEqual({ status: 'newer', version: SAVE_VERSION + 1 });
    expect(await AsyncStorage.getItem('growra_save_data')).toBe(newer);
  });

  it('refuses a backup code from a newer build', () => {
    const code = gameStateService.exportSaveCode({ ...createSaveData(createInitialGameState()), version: SAVE_VERSION + 1 });
    expect(() => gameStateService.importSaveCode(code)).toThrow(NewerSaveError);
  });

  it('snapshots the current save before an overwrite, keeping the newest two', async () => {
    await gameStateService.saveGame(createSaveData(createInitialGameState()));
    for (let index = 0; index < 3; index += 1) {
      await gameStateService.snapshotBeforeOverwrite();
      await new Promise((resolve) => setTimeout(resolve, 2));
    }
    const snapshots = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith('growra_save_data_snapshot_'));
    expect(snapshots).toHaveLength(2);
    expect(await AsyncStorage.getItem(snapshots[0])).toBe(await AsyncStorage.getItem('growra_save_data'));
  });
});

describe('daily reminder setting (#39)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('is off at 20:00 for saves from before the reminder, and keeps a valid stored one', async () => {
    const old = createSaveData(createInitialGameState());
    const { dailyReminder: _gone, ...settings } = old.gameState.settings;
    await AsyncStorage.setItem('growra_save_data', JSON.stringify({ ...old, gameState: { ...old.gameState, settings } }));
    const loaded = await gameStateService.loadGame();
    expect(loaded.status === 'loaded' && loaded.saveData.gameState.settings.dailyReminder).toEqual({ enabled: false, hour: 20, minute: 0 });

    const stored = { ...old, gameState: { ...old.gameState, settings: { ...old.gameState.settings, dailyReminder: { enabled: true, hour: 7, minute: 30 } } } };
    await AsyncStorage.setItem('growra_save_data', JSON.stringify(stored));
    const again = await gameStateService.loadGame();
    expect(again.status === 'loaded' && again.saveData.gameState.settings.dailyReminder).toEqual({ enabled: true, hour: 7, minute: 30 });
  });
});

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

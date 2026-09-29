import AsyncStorage from '@react-native-async-storage/async-storage';
import { gameStateService } from '../src/services/gameStateService';
import { createCompanion, getSellValue } from '../src/utils/gameplay';
import { createInitialGameState, createSaveData } from '../src/utils/initialState';

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
});

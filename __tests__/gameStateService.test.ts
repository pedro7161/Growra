import AsyncStorage from '@react-native-async-storage/async-storage';
import { gameStateService } from '../src/services/gameStateService';
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
});

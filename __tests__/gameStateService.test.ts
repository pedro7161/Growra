import AsyncStorage from '@react-native-async-storage/async-storage';
import { gameStateService } from '../src/services/gameStateService';
import { createCompanion, getSellValue } from '../src/utils/gameplay';
import { PetRarity, TaskFrequency, TaskStatus } from '../src/types';
import { createInitialGameState, createSaveData } from '../src/utils/initialState';
import { createCustomTask } from '../src/utils/taskFactory';
import { syncRecurringTasks } from '../src/utils/taskSchedule';

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

  it("a save from before the What's New popup loads with nothing hidden (#64)", async () => {
    const { whatsNewHiddenFor: _dropped, ...gameState } = createInitialGameState();
    await AsyncStorage.setItem('growra_save_data', JSON.stringify({ ...createSaveData(gameState as never), version: 18 }));
    const result = await gameStateService.loadGame();
    expect(result.status === 'loaded' && result.saveData.gameState.whatsNewHiddenFor).toBe('');
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

describe('work schedule save (v21)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('v20 save gains workItems [] and default work settings, keeps tasks/coins/pets', async () => {
    const task = createCustomTask('Water', '', 'health', TaskFrequency.ONCE, '', 0);
    const base = { ...createInitialGameState(), coins: 77, tasks: [task], pets: [createCompanion('sprout')] };
    const { workItems: _w, ...gameState } = base;
    const { tasksSection: _a, workView: _b, dashboardCollapsed: _c, calendarShow: _d, ...settings } = base.settings;
    await AsyncStorage.setItem(
      'growra_save_data',
      JSON.stringify({ ...createSaveData({ ...gameState, settings } as never), version: 20 }),
    );
    const result = await gameStateService.loadGame();
    expect(result.status).toBe('loaded');
    if (result.status !== 'loaded') return;
    const loaded = result.saveData.gameState;
    expect(loaded.workItems).toEqual([]);
    expect(loaded.settings).toMatchObject({
      tasksSection: 'choose',
      workView: 'day',
      dashboardCollapsed: { personal: false, work: false },
      calendarShow: [],
    });
    expect(loaded.coins).toBe(77);
    expect(loaded.tasks).toHaveLength(1);
    expect(loaded.pets).toHaveLength(base.pets.length);
  });

  it('v21 save with a work schedule keeps its items and work settings', async () => {
    const item = {
      id: 'w1', name: 'Shift', description: '', calendarColor: '#fff', startMinutes: 540, endMinutes: 1020,
      startDateKey: '2026-10-28', repeat: { kind: 'none' }, end: { kind: 'never' }, exceptions: {},
      completedDateKeys: [], createdAt: 1,
    };
    const { groups: _g, ...gameState } = createInitialGameState();
    const { calendarShow: _c, ...settings } = gameState.settings;
    await AsyncStorage.setItem(
      'growra_save_data',
      JSON.stringify({
        ...createSaveData({ ...gameState, workItems: [item], settings: { ...settings, tasksSection: 'work', workView: 'week', calendarShowBoth: true } } as never),
        version: 21,
      }),
    );
    const result = await gameStateService.loadGame();
    expect(result.status === 'loaded' && result.saveData.gameState.workItems).toEqual([item]);
    expect(result.status === 'loaded' && result.saveData.gameState.settings).toMatchObject({
      tasksSection: 'work', workView: 'week', calendarShow: ['personal', 'work'],
    });
  });
});

describe('groups save (v22)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  const v21Save = (legacySettings: Record<string, unknown>, extra: Record<string, unknown> = {}) => {
    const task = createCustomTask('Water', '', 'health', TaskFrequency.ONCE, '', 0);
    const base = { ...createInitialGameState(), coins: 55, tasks: [task], pets: [createCompanion('sprout')], ...extra };
    const { groups: _g, ...gameState } = base;
    const { calendarShow: _c, dashboardCollapsed: _d, ...settings } = base.settings;
    return { base, json: JSON.stringify({ ...createSaveData({ ...gameState, settings: { ...settings, ...legacySettings } } as never), version: 21 }) };
  };

  it("v21 save gains groups [] and maps settings: work/personal collapsed flags kept, calendarShowBoth true → ['personal','work'], false → []", async () => {
    const both = v21Save({ dashboardCollapsed: { personal: true, work: false }, calendarShowBoth: true, tasksSection: 'personal' });
    await AsyncStorage.setItem('growra_save_data', both.json);
    const result = await gameStateService.loadGame();
    expect(result.status).toBe('loaded');
    if (result.status !== 'loaded') return;
    const loaded = result.saveData.gameState;
    expect(result.saveData.version).toBe(22);
    expect(loaded.groups).toEqual([]);
    expect(loaded.settings.dashboardCollapsed).toEqual({ personal: true, work: false });
    expect(loaded.settings.calendarShow).toEqual(['personal', 'work']);
    expect(loaded.settings.tasksSection).toBe('personal');
    expect('calendarShowBoth' in loaded.settings).toBe(false);
    expect(loaded.coins).toBe(55);
    expect(loaded.tasks).toEqual(both.base.tasks);
    expect(loaded.pets).toHaveLength(both.base.pets.length);
    expect(loaded.streak).toEqual(both.base.streak);

    const neither = v21Save({ dashboardCollapsed: { personal: false, work: true }, calendarShowBoth: false });
    await AsyncStorage.setItem('growra_save_data', neither.json);
    const again = await gameStateService.loadGame();
    expect(again.status === 'loaded' && again.saveData.gameState.settings).toMatchObject({
      dashboardCollapsed: { personal: false, work: true },
      calendarShow: [],
    });
  });

  it('v22 save loads unchanged', async () => {
    const task = createCustomTask('Read', '', 'study', TaskFrequency.DAILY, '', 0);
    const item = {
      id: 'w1', name: 'Shift', description: '', calendarColor: '#fff', startMinutes: 540, endMinutes: 1020,
      startDateKey: '2026-10-28', repeat: { kind: 'none' as const }, end: { kind: 'never' as const }, exceptions: {},
      completedDateKeys: ['2026-10-28'], createdAt: 1,
    };
    const groups = [
      { id: 'g1', name: 'Family', color: '#f80', kind: 'list' as const, createdAt: 5, tasks: [task], workItems: [] },
      { id: 'g2', name: 'Team', color: '#08f', kind: 'schedule' as const, createdAt: 6, sourceId: 'src', tasks: [], workItems: [item] },
    ];
    const state = {
      ...createInitialGameState(),
      groups,
      settings: {
        ...createInitialGameState().settings,
        tasksSection: 'g2',
        dashboardCollapsed: { personal: false, work: true, g1: true },
        calendarShow: ['work', 'g1'],
      },
    };
    await gameStateService.saveGame(createSaveData(state));
    const result = await gameStateService.loadGame();
    expect(result.status).toBe('loaded');
    if (result.status !== 'loaded') return;
    expect(result.saveData.gameState.groups).toEqual(groups);
    expect(result.saveData.gameState.settings).toEqual(state.settings);
  });

  it('a malformed groups list keeps only usable groups, and syncing tasks after loading does not crash', async () => {
    const task = { ...createCustomTask('Read', '', 'study', TaskFrequency.DAILY, '', 0), status: TaskStatus.COMPLETED };
    const malformed = [
      null,
      7,
      'g0',
      { name: 'No id', kind: 'list', tasks: [] },
      { id: 'g1', name: 'Odd kind', kind: 'board', tasks: [] },
      { id: 'g5', color: '#f80', kind: 'list', tasks: [] },
      { id: 'g6', name: 'No colour', kind: 'list', tasks: [] },
      { id: 'g2', name: 'No lists', color: '#f80', kind: 'list' },
      { id: 'g3', name: 'Bad lists', color: '#08f', kind: 'schedule', createdAt: 2, tasks: 'x', workItems: { a: 1 } },
      { id: 'g4', name: 'Fine', color: '#0a8', kind: 'list', createdAt: 3, tasks: [task, null, 3], workItems: [] },
    ];
    const state = { ...createInitialGameState(), groups: malformed };
    await AsyncStorage.setItem('growra_save_data', JSON.stringify(createSaveData(state as never)));
    const result = await gameStateService.loadGame();
    expect(result.status).toBe('loaded');
    if (result.status !== 'loaded') return;
    const groups = result.saveData.gameState.groups;
    expect(groups.map((group) => group.id)).toEqual(['g2', 'g3', 'g4']);
    expect(groups[0]).toMatchObject({ createdAt: 0, tasks: [], workItems: [] });
    expect(groups[1]).toMatchObject({ createdAt: 2, tasks: [], workItems: [] });
    expect(groups[2].tasks).toEqual([task]);
    expect(() => syncRecurringTasks(result.saveData.gameState, Date.now())).not.toThrow();

    await AsyncStorage.setItem('growra_save_data', JSON.stringify(createSaveData({ ...state, groups: 'nope' } as never)));
    const again = await gameStateService.loadGame();
    expect(again.status === 'loaded' && again.saveData.gameState.groups).toEqual([]);
  });

  it('a group task saved without a timer (or other later fields) loads with the same defaults Personal tasks get', async () => {
    const { timer: _timer, priority: _priority, calendarColor: _color, ...bare } = createCustomTask('Water plants', '', 'home', TaskFrequency.DAILY, '', 0);
    const group = { id: 'g1', name: 'Home', color: '#0a8', kind: 'list', createdAt: 1, tasks: [bare], workItems: [] };
    const state = { ...createInitialGameState(), tasks: [bare], groups: [group] };
    await AsyncStorage.setItem('growra_save_data', JSON.stringify(createSaveData(state as never)));
    const result = await gameStateService.loadGame();
    expect(result.status).toBe('loaded');
    if (result.status !== 'loaded') return;
    const [loaded] = result.saveData.gameState.groups[0].tasks;
    expect(loaded.timer).toMatchObject({ enabled: false, duration: 0, remainingMs: 0 });
    expect(loaded).toEqual(result.saveData.gameState.tasks[0]);
    expect(() => syncRecurringTasks(result.saveData.gameState, Date.now())).not.toThrow();
  });
});

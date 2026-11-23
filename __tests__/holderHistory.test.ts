import AsyncStorage from '@react-native-async-storage/async-storage';
import { gameStateService } from '../src/services/gameStateService';
import { createInitialGameState, createSaveData } from '../src/utils/initialState';
import { completeTask, completeWorkOccurrence } from '../src/utils/gameplay';
import { completeGroupOccurrence, completeGroupTask, createGroup, setHolderTasks, setHolderWorkItems } from '../src/utils/groups';
import { createCustomTask } from '../src/utils/taskFactory';
import { createWorkItem } from '../src/utils/workSchedule';
import { getHistoryDay, getMonthHistory, indexDays } from '../src/utils/calendarHistory';
import { getRoadPosition } from '../src/utils/journey';
import { GameState, TaskFrequency } from '../src/types';

const local = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();
const NOW = local(2026, 11, 20, 10);
const DAY = local(2026, 11, 20, 0);

function build(): GameState {
  let state = { ...createInitialGameState(), createdAt: local(2026, 1, 1), holderHistorySince: local(2026, 1, 1, 0) };
  state = createGroup(state, { name: 'Family', color: '#0a8', kind: 'list' }, 'g1', NOW) as GameState;
  return state;
}

describe('per-holder calendar history (#79)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });
  afterEach(() => jest.useRealTimers());

  function twoHolderDay() {
    let state = build();
    const groupId = state.groups[0].id;
    const mine = createCustomTask('Mine', '', 'home', TaskFrequency.DAILY, '', local(2026, 11, 20, 0));
    const theirs = createCustomTask('Theirs', '', 'home', TaskFrequency.DAILY, '', local(2026, 11, 20, 0));
    const theirs2 = createCustomTask('Theirs 2', '', 'home', TaskFrequency.DAILY, '', local(2026, 11, 20, 0));
    state = { ...state, tasks: [mine] };
    state = setHolderTasks(state, groupId, [theirs, theirs2]);
    state = completeTask(state, mine.id);
    state = completeGroupTask(state, groupId, theirs.id, NOW + 1000);
    state = completeGroupTask(state, groupId, theirs2.id, NOW + 2000);
    return { state, groupId };
  }

  it('counts personal and group completions separately on the same day', () => {
    const { state, groupId } = twoHolderDay();
    const index = indexDays(state.days);
    const at = (holder: string) =>
      getHistoryDay(index, DAY, state.createdAt, NOW + 5000, { holder, holderSince: state.holderHistorySince });
    const personal = at('personal');
    const group = at(groupId);
    expect(personal.status).toBe('done');
    expect(personal.done).toBe(1);
    expect(personal.completions.map((c) => c.name)).toEqual(['Mine']);
    expect(group.done).toBe(2);
    expect(group.completions.map((c) => c.name)).toEqual(['Theirs', 'Theirs 2']);
    expect(at('work').status).toBe('none');
    expect(at('work').done).toBe(0);
    // The all-holders total is the sum, and is the same from every holder's view.
    expect(personal.allDone).toBe(3);
    expect(group.allDone).toBe(personal.done + group.done);
  });

  it('keeps group completions out of the combined totals and the Journey road', () => {
    const { state } = twoHolderDay();
    expect(state.days).toHaveLength(1);
    expect(state.days[0].done).toBe(1);
    expect(getRoadPosition(state.days).tiles).toBe(1);
    // A group-only day is not a Journey tile.
    const fresh = createCustomTask('Solo', '', 'home', TaskFrequency.DAILY, '', local(2026, 11, 20, 0));
    const groupOnly = completeGroupTask(setHolderTasks(build(), 'g1', [fresh]), 'g1', fresh.id, NOW);
    expect(groupOnly.days[0].done).toBe(0);
    expect(groupOnly.days[0].byHolder?.g1.done).toBe(1);
    expect(getRoadPosition(groupOnly.days).tiles).toBe(0);
  });

  it('counts work shifts under Work and group shifts under their group', () => {
    let state = build();
    state = createGroup(state, { name: 'Team', color: '#08f', kind: 'schedule' }, 'g2', NOW) as GameState;
    const groupId = 'g2';
    const shift = (id: string) =>
      createWorkItem(
        {
          name: 'Shift', description: '', calendarColor: '#36f', startMinutes: 8 * 60, endMinutes: 9 * 60,
          startDateKey: '2026-11-20', repeat: { kind: 'none' }, end: { kind: 'never' },
        },
        id,
        NOW
      );
    state = { ...state, workItems: [shift('w1')] };
    state = setHolderWorkItems(state, groupId, [shift('s1')]);
    state = completeWorkOccurrence(state, 'w1', '2026-11-20', NOW);
    state = completeGroupOccurrence(state, groupId, 's1', '2026-11-20', NOW);
    const index = indexDays(state.days);
    const scope = (holder: string) => ({ holder, holderSince: state.holderHistorySince });
    expect(getHistoryDay(index, DAY, state.createdAt, NOW, scope('work')).done).toBe(1);
    expect(getHistoryDay(index, DAY, state.createdAt, NOW, scope(groupId)).done).toBe(1);
    expect(getHistoryDay(index, DAY, state.createdAt, NOW, scope('personal')).done).toBe(0);
    expect(getHistoryDay(index, DAY, state.createdAt, NOW, scope('work')).allDone).toBe(2);
  });

  it('reports days before per-holder records as combined, never as the holder\'s zero', () => {
    const { state } = twoHolderDay();
    const since = local(2026, 11, 21, 0);
    const index = indexDays(state.days);
    const day = getHistoryDay(index, DAY, state.createdAt, NOW, { holder: 'personal', holderSince: since });
    expect(day.status).toBe('combined');
    expect(day.done).toBe(0);
    expect(day.completions).toEqual([]);
    expect(day.allDone).toBe(1); // only what the combined record knows
  });

  it('keeps month, year and DST edges when scoped', () => {
    const scope = { holder: 'personal', holderSince: local(2026, 1, 1, 0) };
    const days = [
      { ...createDayRecord0(local(2026, 12, 31, 0)), done: 1, byHolder: { personal: { done: 1, completions: [{ name: 'a', at: local(2026, 12, 31, 9) }] } } },
      { ...createDayRecord0(local(2027, 1, 1, 0)), done: 1, byHolder: { personal: { done: 1, completions: [] } } },
    ];
    const index = indexDays(days);
    const dec = getMonthHistory(index, 2026, 11, local(2026, 1, 1), local(2027, 3, 1), scope);
    const jan = getMonthHistory(index, 2027, 0, local(2026, 1, 1), local(2027, 3, 1), scope);
    expect(dec.days[30].status).toBe('done');
    expect(jan.days[0].status).toBe('done');
    expect(jan.days[0].truncated).toBe(true);
    // 23h and 25h days stay one day each.
    for (const [y, m, d] of [[2026, 3, 29], [2026, 10, 25]]) {
      const dst = getHistoryDay(index, local(y, m, d, 12), local(2026, 1, 1), local(2027, 3, 1), scope);
      expect(dst.date).toBe(local(y, m, d, 0));
      expect(dst.status).toBe('none');
    }
  });
});

function createDayRecord0(date: number) {
  return { date, done: 0, recurringDone: 0, customDone: 0, highPriorityDone: 0, timersFinished: 0, scheduledAhead: 0, completions: [] };
}

describe('per-holder history saves (#79)', () => {
  beforeEach(() => AsyncStorage.clear());

  it('an old save without holderHistorySince loads and is combined-only up to today', async () => {
    const base = createSaveData(createInitialGameState());
    const { holderHistorySince: _drop, ...oldState } = base.gameState;
    const day = { ...createDayRecord0(local(2026, 5, 5, 0)), done: 2, completions: [{ name: 'x', at: local(2026, 5, 5, 9) }] };
    await AsyncStorage.setItem('growra_save_data', JSON.stringify({ ...base, version: 25, gameState: { ...oldState, days: [day] } }));
    const result = await gameStateService.loadGame();
    expect(result.status).toBe('loaded');
    if (result.status !== 'loaded') return;
    const loaded = result.saveData.gameState;
    expect(result.saveData.version).toBe(26);
    expect(loaded.days).toEqual([day]);
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(loaded.holderHistorySince).toBe(tomorrow.getTime());
    const index = indexDays(loaded.days);
    const old = getHistoryDay(index, day.date, 0, Date.now(), { holder: 'personal', holderSince: loaded.holderHistorySince });
    expect(old.status).toBe('combined');
    expect(old.allDone).toBe(2);
  });

  it('survives a backup export and import with per-holder records', () => {
    const since = local(2026, 11, 1, 0);
    const days = [{ ...createDayRecord0(DAY), done: 1, byHolder: { personal: { done: 1, completions: [{ name: 'p', at: NOW }] }, g1: { done: 2, completions: [] } } }];
    const save = createSaveData({ ...createInitialGameState(), days, holderHistorySince: since });
    const restored = gameStateService.importSaveCode(gameStateService.exportSaveCode(save));
    expect(restored.gameState.days).toEqual(days);
    expect(restored.gameState.holderHistorySince).toBe(since);
    expect(restored.version).toBe(26);
  });
});

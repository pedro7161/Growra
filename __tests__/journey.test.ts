import { DayRecord, GameState, TaskFrequency } from '../src/types';
import { adoptStarter, applyTaskCreated, completeTask } from '../src/utils/gameplay';
import { createInitialGameState } from '../src/utils/initialState';
import {
  buyDecoration,
  createDayRecord,
  getCampLookBack,
  getFocusFind,
  getRegionForTile,
  getRoadPosition,
  getTileFeatures,
  placeDecoration,
  TIMERS_PER_FIND,
} from '../src/utils/journey';
import { createCustomTask } from '../src/utils/taskFactory';

const DAY = 24 * 60 * 60 * 1000;
const local = (y: number, m: number, d: number, h = 0) => new Date(y, m - 1, d, h).getTime();

function activeDays(count: number, names: string[] = ['Water']): DayRecord[] {
  return Array.from({ length: count }, (_, index) => ({
    ...createDayRecord(local(2026, 6, 1) + index * DAY),
    done: names.length,
    completions: names.map((name) => ({ name, at: local(2026, 6, 1, 9) + index * DAY })),
  }));
}

describe('road position', () => {
  it('starts empty', () => {
    expect(getRoadPosition([])).toMatchObject({ tiles: 0, regionIndex: 0, season: 1, campsReached: 0 });
  });

  it('reaches a camp every 7 active days and a new region every 28', () => {
    expect(getRoadPosition(activeDays(7))).toMatchObject({ campsReached: 1, tilesToNextCamp: 7 });
    expect(getRoadPosition(activeDays(28)).regionIndex).toBe(0);
    expect(getRoadPosition(activeDays(29)).regionIndex).toBe(1);
  });

  it('starts season 2 after the last region', () => {
    expect(getRegionForTile(8 * 28)).toEqual({ regionIndex: 0, season: 2 });
  });

  it('ignores days with nothing completed', () => {
    const days = [...activeDays(2), { ...createDayRecord(local(2026, 7, 1)), scheduledAhead: 1 }];
    expect(getRoadPosition(days).tiles).toBe(2);
  });
});

describe('tiles', () => {
  it('shows how the day was used', () => {
    const day = {
      ...createDayRecord(0),
      done: 6,
      recurringDone: 1,
      timersFinished: 5,
      customDone: 1,
      highPriorityDone: 1,
      scheduledAhead: 2,
    };
    expect(getTileFeatures(day)).toEqual([
      'lantern', 'flowers', 'crystal', 'crystal', 'crystal', 'stone', 'flag', 'signpost', 'tree',
    ]);
  });

  it('adds one tile per day, however many tasks are done', () => {
    const tasks = [0, 1, 2].map((i) => createCustomTask(`Task ${i}`, '', 'misc', TaskFrequency.ONCE, '', 0));
    let state: GameState = { ...createInitialGameState(), tasks };
    tasks.forEach((task) => (state = completeTask(state, task.id)));
    expect(state.days).toHaveLength(1);
    expect(state.days[0].done).toBe(3);
    expect(state.days[0].customDone).toBe(3);
    expect(state.days[0].completions.map((completion) => completion.name)).toEqual(['Task 0', 'Task 1', 'Task 2']);
  });

  it('puts a signpost on today when something is planned for later, without adding a tile', () => {
    const task = createCustomTask('Dentist', '', 'health', TaskFrequency.ONCE, '', Date.now() + 3 * DAY);
    const state = applyTaskCreated(createInitialGameState(), task);
    expect(state.days[0].scheduledAhead).toBe(1);
    expect(getRoadPosition(state.days).tiles).toBe(0);
  });
});

describe('camp look-back', () => {
  it('summarises the week behind a camp', () => {
    const days = activeDays(7, ['Water', 'Read']);
    days[3] = { ...days[3], done: 5 };
    const lookBack = getCampLookBack(days, 0);
    expect(lookBack).toMatchObject({ done: 17, busiestDay: days[3].date, topTaskCount: 7 });
    expect(['Water', 'Read']).toContain(lookBack?.topTaskName);
  });

  it('has nothing to say before the camp is reached', () => {
    expect(getCampLookBack(activeDays(6), 0)).toBeNull();
  });
});

describe('decorations', () => {
  it('buys with coins and refuses what the player cannot afford', () => {
    const poor = { ...createInitialGameState(), coins: 10 };
    expect(buyDecoration(poor, 'flower-pot')).toBe(poor);
    const bought = buyDecoration({ ...poor, coins: 100 }, 'flower-pot');
    expect(bought.coins).toBe(60);
    expect(bought.decorations).toEqual([expect.objectContaining({ typeId: 'flower-pot', camp: -1 })]);
  });

  it('cannot buy finds', () => {
    const state = { ...createInitialGameState(), coins: 1000 };
    expect(buyDecoration(state, 'shell')).toBe(state);
  });

  it('places only at reached camps and swaps whatever was on the spot back to the bag', () => {
    let state: GameState = { ...createInitialGameState(), coins: 1000, days: activeDays(7) };
    state = buyDecoration(buyDecoration(state, 'tent'), 'pennant');
    const [tent, pennant] = state.decorations;
    expect(placeDecoration(state, tent.id, 1, 0)).toBe(state);

    state = placeDecoration(state, tent.id, 0, 0);
    state = placeDecoration(state, pennant.id, 0, 0);
    expect(state.decorations.find((item) => item.id === pennant.id)).toMatchObject({ camp: 0, spot: 0 });
    expect(state.decorations.find((item) => item.id === tent.id)).toMatchObject({ camp: -1 });
  });
});

describe('focus finds', () => {
  it('brings a find every few timers', () => {
    expect(getFocusFind(TIMERS_PER_FIND - 1)).toBeNull();
    expect(getFocusFind(TIMERS_PER_FIND)?.price).toBe(0);
  });

  it('has the active companion bring the find back after a timer task', () => {
    const tasks = Array.from({ length: TIMERS_PER_FIND }, (_, i) => {
      const task = createCustomTask(`Focus ${i}`, '', 'study', TaskFrequency.ONCE, '', 0, true, 25);
      return { ...task, timer: { ...task.timer, state: 'ready' as const } };
    });
    let state: GameState = { ...adoptStarter(createInitialGameState(), 'glint'), tasks };
    tasks.forEach((task) => (state = completeTask(state, task.id)));
    expect(state.decorations).toHaveLength(1);
    expect(state.companionEvents).toContainEqual(
      expect.objectContaining({ kind: 'found', templateId: 'glint', decorationTypeId: state.decorations[0].typeId }),
    );
  });
});

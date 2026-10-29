import { TaskFrequency, TaskStatus } from '../src/types';
import { GameState, TaskPriority } from '../src/types';
import {
  adoptStarter,
  addCompanionBond,
  applyCompanionJoins,
  applyTaskUpdated,
  calculateUpdatedStreak,
  completeTask,
  completeWorkOccurrence,
  upsertWorkItems,
  BASE_TASK_COIN_REWARD,
  getRewardScale,
} from '../src/utils/gameplay';
import { DAILY_BASE_BOND_CAP, collectableCompanionCount, createEmptyUsage, getCompletionFacts, getPerkCoins } from '../src/utils/companions';
import { createInitialGameState, createInitialStreak } from '../src/utils/initialState';
import { createWorkItem } from '../src/utils/workSchedule';
import { createCustomTask } from '../src/utils/taskFactory';

const local = (y: number, m: number, d: number, h = 0) => new Date(y, m - 1, d, h).getTime();

function stateWithTask() {
  const task = createCustomTask('Water', '', 'health', TaskFrequency.ONCE, '', 0);
  return { state: { ...createInitialGameState(), tasks: [task] }, taskId: task.id };
}

describe('completeTask', () => {
  it('pays once when the same task is completed twice (double tap)', () => {
    const { state, taskId } = stateWithTask();
    const once = completeTask(state, taskId);
    const twice = completeTask(once, taskId);

    expect(once.coins).toBeGreaterThanOrEqual(BASE_TASK_COIN_REWARD);
    expect(twice).toBe(once);
    expect(twice.totalTasksCompleted).toBe(1);
  });

  it('marks the task completed', () => {
    const { state, taskId } = stateWithTask();
    expect(completeTask(state, taskId).tasks[0].status).toBe(TaskStatus.COMPLETED);
  });
});

describe('length-scaled rewards', () => {
  const coinsFor = (task: ReturnType<typeof createCustomTask>) => {
    const state = { ...createInitialGameState(), tasks: [task] };
    return completeTask(state, task.id).coins - state.coins;
  };
  // The streak multiplier in effect for a first completion with no companion (ruling 4).
  const multiplier = 1 + calculateUpdatedStreak(createInitialStreak(), Date.now()).bonus;

  it('scales reward with task length, capped at 12 hours', () => {
    expect(getRewardScale(null)).toBe(1);
    expect(getRewardScale(60)).toBeCloseTo(1 + 2 / 3);
    expect(getRewardScale(12 * 60)).toBeCloseTo(9);
    expect(getRewardScale(20 * 60)).toBeCloseTo(9);
  });

  it('pays the base for a task with no length', () => {
    const task = createCustomTask('Plain', '', 'misc', TaskFrequency.ONCE, '', 0);
    expect(coinsFor(task)).toBe(Math.round(BASE_TASK_COIN_REWARD * multiplier));
  });

  it('pays more for a task with a length', () => {
    const task = { ...createCustomTask('Long', '', 'misc', TaskFrequency.ONCE, '', 0), durationMinutes: 120 };
    expect(coinsFor(task)).toBe(Math.round(BASE_TASK_COIN_REWARD * (1 + (2 / 3) * 2) * multiplier));
    expect(coinsFor(task)).toBeGreaterThan(30);
  });

  it('uses the timer length when no duration is set', () => {
    const task = createCustomTask('Focus', '', 'misc', TaskFrequency.ONCE, '', 0, true, 30);
    const ready = { ...task, timer: { ...task.timer, state: 'ready' as const } };
    expect(coinsFor(ready)).toBe(Math.round(BASE_TASK_COIN_REWARD * (1 + (2 / 3) * 0.5) * multiplier));
  });
});

describe('calculateUpdatedStreak', () => {
  const streakOn = (timestamp: number, level: number) => ({
    ...createInitialStreak(),
    level,
    lastCompletedDate: new Date(timestamp).setHours(0, 0, 0, 0),
  });

  it('grows the streak on the day after the spring clock change', () => {
    const next = calculateUpdatedStreak(streakOn(local(2026, 3, 29, 20), 3), local(2026, 3, 30, 9));
    expect(next.level).toBe(4);
  });

  it('grows the streak on the day after the autumn clock change', () => {
    const next = calculateUpdatedStreak(streakOn(local(2026, 10, 25, 20), 3), local(2026, 10, 26, 9));
    expect(next.level).toBe(4);
  });

  it('keeps the level for a second completion on the same day', () => {
    const next = calculateUpdatedStreak(streakOn(local(2026, 6, 1, 8), 5), local(2026, 6, 1, 21));
    expect(next.level).toBe(5);
  });

  it('loses one level per missed day and resets after 3 missed days', () => {
    expect(calculateUpdatedStreak(streakOn(local(2026, 6, 1), 5), local(2026, 6, 3)).level).toBe(4);
    expect(calculateUpdatedStreak(streakOn(local(2026, 6, 1), 5), local(2026, 6, 5)).level).toBe(1);
  });
});

function withTasks(state: GameState, count: number, priority = TaskPriority.MEDIUM) {
  const tasks = Array.from({ length: count }, (_, index) =>
    createCustomTask(`Task ${index}`, '', 'misc', TaskFrequency.ONCE, '', 0, false, 0, priority),
  );
  return { state: { ...state, tasks: [...state.tasks, ...tasks] }, ids: tasks.map((task) => task.id) };
}

const completeAll = (state: GameState, ids: string[]) =>
  ids.reduce((current, id) => completeTask(current, id), state);

describe('companions', () => {
  it('lets the player adopt one starter, which becomes active', () => {
    const state = adoptStarter(createInitialGameState(), 'sprout');
    expect(state.pets).toHaveLength(1);
    expect(state.equippedPetId).toBe(state.pets[0].id);
    expect(adoptStarter(state, 'glint')).toBe(state);
  });

  it('only offers the starters', () => {
    const state = createInitialGameState();
    expect(adoptStarter(state, 'nova')).toBe(state);
  });

  it('grows Bond on the active companion when a task is done', () => {
    // Ripple's style (moving tasks) does not match a completion, so this is the base +1 only.
    const { state, ids } = withTasks(adoptStarter(createInitialGameState(), 'ripple'), 1);
    const next = completeTask(state, ids[0]);
    expect(next.pets[0].bond).toBe(1);
  });

  it('adds a style point when the completion matches what the companion loves', () => {
    // Sprout loves getting started: the first task of the day gives +1 base and +1 style.
    const { state, ids } = withTasks(adoptStarter(createInitialGameState(), 'sprout'), 2);
    const next = completeAll(state, ids);
    expect(next.pets[0].bond).toBe(3);
  });

  it('caps the base Bond per day', () => {
    const { state, ids } = withTasks(adoptStarter(createInitialGameState(), 'ripple'), DAILY_BASE_BOND_CAP + 3);
    const next = completeAll(state, ids);
    expect(next.pets.find((pet) => pet.templateId === 'ripple')?.bond).toBe(DAILY_BASE_BOND_CAP);
  });

  it('pays coins for every task with no daily cap', () => {
    // No companion: the multiplier is the streak alone, which is the same for every completion today.
    const { state, ids } = withTasks(createInitialGameState(), 20);
    const first = completeTask(state, ids[0]);
    const perTask = first.coins - state.coins;
    expect(perTask).toBeGreaterThanOrEqual(BASE_TASK_COIN_REWARD);

    const all = completeAll(state, ids);
    expect(all.coins).toBe(state.coins + 20 * perTask);
    expect(all.totalTasksCompleted).toBe(20);
    // The 16th completion still pays.
    const fifteen = completeAll(state, ids.slice(0, 15));
    expect(completeTask(fifteen, ids[15]).coins - fifteen.coins).toBe(perTask);
  });

  it('brings in a companion when its style is used (Cindra on a 5-task day)', () => {
    const { state, ids } = withTasks(adoptStarter(createInitialGameState(), 'ripple'), 5);
    const next = completeAll(state, ids);
    expect(next.pets.map((pet) => pet.templateId)).toContain('cindra');
    expect(next.companionEvents).toContainEqual({ kind: 'joined', templateId: 'cindra' });
  });

  it('never adds the same companion twice', () => {
    const { state, ids } = withTasks(adoptStarter(createInitialGameState(), 'ripple'), 10);
    const next = applyCompanionJoins(completeAll(state, ids));
    expect(next.pets.filter((pet) => pet.templateId === 'cindra')).toHaveLength(1);
  });

  it('does not bring anyone in before a starter is chosen', () => {
    const { state, ids } = withTasks(createInitialGameState(), 5);
    expect(completeAll(state, ids).pets).toHaveLength(0);
  });

  it('evolves at 30 Bond and reports it', () => {
    const state = adoptStarter(createInitialGameState(), 'sprout');
    const petId = state.pets[0].id;
    const almost = addCompanionBond(state, petId, 29);
    expect(almost.pets[0].evolutionStage).toBe(0);
    const evolved = addCompanionBond(almost, petId, 1);
    expect(evolved.pets[0].evolutionStage).toBe(1);
    expect(evolved.companionEvents).toContainEqual({ kind: 'evolved', templateId: 'sprout' });
  });

  it('gives Ripple Bond and brings it in when a task is moved later', () => {
    const { state } = withTasks(adoptStarter(createInitialGameState(), 'sprout'), 1);
    const before = state.tasks[0];
    const after = { ...before, dueDate: before.dueDate + 3 * 24 * 60 * 60 * 1000 };
    const next = applyTaskUpdated(state, before, after);
    expect(next.usage.rescheduled).toBe(1);
    expect(next.pets.map((pet) => pet.templateId)).toContain('ripple');
  });
});

describe('getEffectiveStreak (#40)', () => {
  const { getEffectiveStreak, calculateUpdatedStreak } = require('../src/utils/gameplay');
  const day = 24 * 60 * 60 * 1000;
  const start = new Date(2026, 9, 10, 12).getTime();
  const streak = { level: 5, bonus: 0.25, lastCompletedDate: new Date(2026, 9, 10).getTime(), consecutiveMisses: 0 };

  it('is unchanged on the day of the last completion and the day after', () => {
    expect(getEffectiveStreak(streak, start)).toBe(streak);
    expect(getEffectiveStreak(streak, start + day)).toBe(streak);
  });

  it('drops for a missed day without waiting for the next completion', () => {
    const effective = getEffectiveStreak(streak, start + 2 * day);
    expect(effective.level).toBe(4);
    expect(effective.bonus).toBeLessThan(streak.bonus);
  });

  it('agrees with the completion path after a gap, minus the completion itself', () => {
    for (const gap of [2, 3, 4, 6]) {
      const now = start + gap * day;
      expect(getEffectiveStreak(streak, now).level).toBe(calculateUpdatedStreak(streak, now).level);
    }
  });

  it('resets to level 1 after three or more missed days', () => {
    expect(getEffectiveStreak(streak, start + 4 * day).level).toBe(1);
  });
});

describe('Lumen, the founder companion (free for everyone who uses Growra before 2027)', () => {
  const december = local(2026, 12, 31, 23);
  const newYear = local(2027, 1, 1, 0);
  const lumens = (state: ReturnType<typeof createInitialGameState>) => state.pets.filter((pet) => pet.templateId === 'lumen');

  it('joins anyone who has picked a starter before 2027, and says so', () => {
    const next = applyCompanionJoins(adoptStarter(createInitialGameState(), 'sprout'), december);
    expect(lumens(next)).toHaveLength(1);
    expect(next.companionEvents).toContainEqual({ kind: 'joined', templateId: 'lumen' });
  });

  it('never joins twice', () => {
    const once = applyCompanionJoins(adoptStarter(createInitialGameState(), 'sprout'), december);
    expect(lumens(applyCompanionJoins(once, december))).toHaveLength(1);
  });

  it('does not join from 2027 on, but stays with anyone who already has it', () => {
    const starter = adoptStarter(createInitialGameState(), 'sprout');
    expect(lumens(applyCompanionJoins(starter, newYear))).toHaveLength(0);
    const founder = applyCompanionJoins(starter, december);
    expect(lumens(applyCompanionJoins(founder, newYear))).toHaveLength(1);
  });

  it('waits for the starter like everyone else', () => {
    expect(applyCompanionJoins(createInitialGameState(), december).pets).toHaveLength(0);
  });

  it('gives +1 coin for every task while active', () => {
    expect(getPerkCoins('founder', getCompletionFacts(createCustomTask('A', '', 'health', TaskFrequency.ONCE, '', 0), createEmptyUsage(), december))).toBe(1);
  });
});

describe('collectable companions count', () => {
  it('counts Lumen only for players who have it', () => {
    expect(collectableCompanionCount(new Set(['sprout']))).toBe(12);
    expect(collectableCompanionCount(new Set(['sprout', 'lumen']))).toBe(13);
  });
});

describe('event companions: Gloam (Halloween) and Holly (Christmas)', () => {
  const halloween = local(2026, 10, 25, 12);
  const christmas = local(2026, 12, 20, 12);
  const june = local(2026, 6, 1, 12);
  const has = (state: ReturnType<typeof createInitialGameState>, id: string) => state.pets.some((pet) => pet.templateId === id);
  const starter = () => adoptStarter(createInitialGameState(), 'sprout');
  const withSeasonTasks = (key: string, count: number) => {
    const state = starter();
    return { ...state, usage: { ...state.usage, seasonTasks: { [key]: count } } };
  };

  afterEach(() => jest.useRealTimers());

  it('counts tasks done during a season, by season and year', () => {
    jest.useFakeTimers().setSystemTime(halloween);
    const { state, ids } = withTasks(starter(), 3);
    expect(completeAll(state, ids).usage.seasonTasks).toEqual({ 'halloween-2026': 3 });
  });

  it('does not count tasks outside a season', () => {
    jest.useFakeTimers().setSystemTime(june);
    const { state, ids } = withTasks(starter(), 3);
    expect(completeAll(state, ids).usage.seasonTasks ?? {}).toEqual({});
  });

  it('Gloam joins after 10 tasks during Halloween, not 9', () => {
    expect(has(applyCompanionJoins(withSeasonTasks('halloween-2026', 9), halloween), 'gloam')).toBe(false);
    const joined = applyCompanionJoins(withSeasonTasks('halloween-2026', 10), halloween);
    expect(has(joined, 'gloam')).toBe(true);
    expect(has(joined, 'holly')).toBe(false);
  });

  it('Holly joins after 10 tasks during Christmas', () => {
    expect(has(applyCompanionJoins(withSeasonTasks('christmas-2026', 10), christmas), 'holly')).toBe(true);
  });

  it("last season's tasks do not count after it ends, but a joined event companion stays", () => {
    expect(has(applyCompanionJoins(withSeasonTasks('halloween-2026', 12), june), 'gloam')).toBe(false);
    const joined = applyCompanionJoins(withSeasonTasks('halloween-2026', 10), halloween);
    expect(has(applyCompanionJoins(joined, june), 'gloam')).toBe(true);
  });

  it('give +3 coins per task during their own season, +1 the rest of the year', () => {
    const facts = (now: number) => getCompletionFacts(createCustomTask('A', '', 'health', TaskFrequency.ONCE, '', 0), createEmptyUsage(), now);
    expect(getPerkCoins('halloween', facts(halloween))).toBe(3);
    expect(getPerkCoins('halloween', facts(christmas))).toBe(1);
    expect(getPerkCoins('christmas', facts(christmas))).toBe(3);
    expect(getPerkCoins('christmas', facts(june))).toBe(1);
  });

  it('event companions only count toward the total once they have joined', () => {
    expect(collectableCompanionCount(new Set(['sprout']))).toBe(12);
    expect(collectableCompanionCount(new Set(['sprout', 'gloam']))).toBe(13);
  });
});

describe('completeWorkOccurrence', () => {
  const shift = createWorkItem(
    {
      name: 'Shift', description: '', calendarColor: '#fff', startMinutes: 9 * 60, endMinutes: 17 * 60,
      startDateKey: '2026-10-28', repeat: { kind: 'none' }, end: { kind: 'never' },
    },
    'w1',
    0,
  );
  const base = upsertWorkItems(createInitialGameState(), [shift]);
  const during = local(2026, 10, 28, 12);
  const multiplier = 1 + calculateUpdatedStreak(createInitialStreak(), during).bonus;

  it('completing an 8 h shift pays Math.round(15 * (1 + 2/3*8)) coins and counts for the streak', () => {
    const done = completeWorkOccurrence(base, 'w1', '2026-10-28', during);
    expect(done.coins).toBe(Math.round(15 * (1 + (2 / 3) * 8) * multiplier));
    expect(done.totalTasksCompleted).toBe(1);
    expect(done.streak.lastCompletedDate).toBe(local(2026, 10, 28));
    expect(done.workItems[0].completedDateKeys).toEqual(['2026-10-28']);
  });

  it("a shift can't be completed before it starts or twice", () => {
    expect(completeWorkOccurrence(base, 'w1', '2026-10-28', local(2026, 10, 28, 8))).toBe(base);
    const done = completeWorkOccurrence(base, 'w1', '2026-10-28', during);
    expect(completeWorkOccurrence(done, 'w1', '2026-10-28', during)).toBe(done);
    expect(completeWorkOccurrence(base, 'nope', '2026-10-28', during)).toBe(base);
  });
});

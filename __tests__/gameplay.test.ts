import { TaskFrequency, TaskStatus } from '../src/types';
import { GameState, TaskPriority } from '../src/types';
import {
  adoptStarter,
  addCompanionBond,
  applyCompanionJoins,
  applyTaskUpdated,
  calculateUpdatedStreak,
  completeTask,
  BASE_TASK_COIN_REWARD,
} from '../src/utils/gameplay';
import { DAILY_BASE_BOND_CAP, DAILY_COIN_TASK_CAP } from '../src/utils/companions';
import { createInitialGameState, createInitialStreak } from '../src/utils/initialState';
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

  it('stops paying coins after the daily cap but still counts the task', () => {
    const { state, ids } = withTasks(adoptStarter(createInitialGameState(), 'ripple'), DAILY_COIN_TASK_CAP + 1);
    const capped = completeAll(state, ids.slice(0, DAILY_COIN_TASK_CAP));
    const extra = completeTask(capped, ids[DAILY_COIN_TASK_CAP]);
    expect(extra.coins).toBe(capped.coins);
    expect(extra.totalTasksCompleted).toBe(capped.totalTasksCompleted + 1);
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

import { TaskFrequency, TaskStatus } from '../src/types';
import {
  calculateUpdatedStreak,
  completeTask,
  getPetTemplates,
  getPityCost,
  multiSummonPet,
  redeemPityPet,
  summonPet,
  BASE_TASK_COIN_REWARD,
  MULTI_SUMMON_COST,
  SUMMON_COST,
} from '../src/utils/gameplay';
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

describe('spending guards', () => {
  it('does not summon without enough coins', () => {
    const state = { ...createInitialGameState(), coins: SUMMON_COST - 1 };
    expect(summonPet(state)).toBe(state);
    expect(multiSummonPet({ ...state, coins: MULTI_SUMMON_COST - 1 }).pets).toHaveLength(0);
  });

  it('summons and charges when the player can pay', () => {
    const next = summonPet({ ...createInitialGameState(), coins: SUMMON_COST });
    expect(next.coins).toBe(0);
    expect(next.pets).toHaveLength(1);
  });

  it('does not redeem a pity pet without enough pity currency', () => {
    const template = getPetTemplates()[0];
    const state = { ...createInitialGameState(), pityCurrency: getPityCost(template.rarity) - 1 };
    expect(redeemPityPet(state, template.id)).toBe(state);
  });
});

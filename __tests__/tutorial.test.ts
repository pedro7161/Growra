import { createInitialGameState } from '../src/utils/initialState';
import {
  applyFirstTaskReward,
  finishTutorial,
  getTutorialStep,
  shouldFinishTutorial,
  skipTutorial,
  TUTORIAL_FINISH_REWARD,
  TUTORIAL_FIRST_TASK_REWARD,
  tutorialStepNumber,
} from '../src/utils/tutorial';
import { GameState, TaskStatus } from '../src/types';

function fresh(): GameState {
  return createInitialGameState();
}
function withTask(state: GameState, status: TaskStatus): GameState {
  return { ...state, tasks: [{ ...({} as GameState['tasks'][number]), id: 't1', status }] };
}
function withPet(state: GameState): GameState {
  return { ...state, pets: [{ ...({} as GameState['pets'][number]), id: 'p1' }], equippedPetId: 'p1' };
}

describe('tutorial steps', () => {
  it('walks add task → complete → companion → journey', () => {
    const s = fresh();
    expect(getTutorialStep(s, 'dashboard', false)).toBe('open-tasks');
    expect(getTutorialStep(s, 'tasks', false)).toBe('tap-add-task');
    expect(getTutorialStep(s, 'tasks', true)).toBe('confirm-task-add');
    const pending = withTask(s, TaskStatus.PENDING);
    expect(getTutorialStep(pending, 'tasks', false)).toBe('complete-task');
    expect(getTutorialStep(pending, 'dashboard', false)).toBe('open-tasks');
    const done = withTask(s, TaskStatus.COMPLETED);
    expect(getTutorialStep(done, 'dashboard', false)).toBe('open-realm');
    expect(getTutorialStep(done, 'companions', false)).toBe('choose-companion');
    expect(getTutorialStep(withPet(done), 'companions', false)).toBe('open-journey');
    expect(getTutorialStep({ ...s, tutorialCompleted: true }, 'tasks', false)).toBe('done');
  });

  it('numbers the four steps for the dots', () => {
    expect(tutorialStepNumber('tap-add-task')).toBe(1);
    expect(tutorialStepNumber('complete-task')).toBe(2);
    expect(tutorialStepNumber('choose-companion')).toBe(3);
    expect(tutorialStepNumber('open-journey')).toBe(4);
  });

  it('finishes when the Journey is opened after choosing a companion', () => {
    const ready = withPet(withTask(fresh(), TaskStatus.COMPLETED));
    expect(shouldFinishTutorial(ready, 'companions')).toBe(false);
    expect(shouldFinishTutorial(ready, 'journey')).toBe(true);
    expect(shouldFinishTutorial(withTask(fresh(), TaskStatus.COMPLETED), 'journey')).toBe(false);
  });
});

describe('tutorial rewards', () => {
  it('pays the first-task bonus once', () => {
    const done = withTask(fresh(), TaskStatus.COMPLETED);
    const paid = applyFirstTaskReward(done);
    expect(paid.coins).toBe(done.coins + TUTORIAL_FIRST_TASK_REWARD);
    expect(applyFirstTaskReward(paid).coins).toBe(paid.coins);
    expect(applyFirstTaskReward(withTask(fresh(), TaskStatus.PENDING)).coins).toBe(fresh().coins);
  });

  it('finishing pays the welcome gift once; skipping pays nothing', () => {
    const s = fresh();
    const finished = finishTutorial(s);
    expect(finished.tutorialCompleted).toBe(true);
    expect(finished.coins).toBe(s.coins + TUTORIAL_FINISH_REWARD);
    expect(finishTutorial(finished).coins).toBe(finished.coins);
    const skipped = skipTutorial(s);
    expect(skipped.tutorialCompleted).toBe(true);
    expect(skipped.coins).toBe(s.coins);
  });
});

import { localizePredefinedTask, predefinedTasks } from '../src/constants/predefinedTasks';

describe('predefined tasks in Portuguese', () => {
  it('has a Portuguese name for every ready-made task', () => {
    for (const task of predefinedTasks) {
      const pt = localizePredefinedTask(task, 'pt');
      expect(pt.name).not.toBe(task.name);
      expect(pt.id).toBe(task.id);
    }
    expect(localizePredefinedTask(predefinedTasks[0], 'en')).toBe(predefinedTasks[0]);
  });
});

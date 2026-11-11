import { getAppCopy } from '../src/constants/appCopy';
import { APP_LANGUAGES } from '../src/constants/languages';
import { createInitialGameState, createSaveData } from '../src/utils/initialState';
import { STARTER_TEMPLATE_IDS } from '../src/utils/companions';
import { adoptStarter } from '../src/utils/gameplay';
import {
  applyFirstTaskReward,
  finishTutorial,
  getTutorialStep,
  skipTutorial,
  TUTORIAL_FINISH_REWARD,
  TUTORIAL_FIRST_TASK_REWARD,
  TutorialStep,
} from '../src/utils/tutorial';
import {
  GUIDE_STEPS,
  REPLAY_STEPS,
  getGuideSpeaker,
  guideBack,
  guideCanAdvance,
  guideNext,
  guideStepAt,
  fillTemplate,
  tutorialMessage,
} from '../src/utils/tutorialGuide';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { gameStateService } from '../src/services/gameStateService';
import { GameState, TaskStatus } from '../src/types';

const task = (status: TaskStatus) => ({ ...({} as GameState['tasks'][number]), id: 't1', status });

describe('guide step sequence (first run)', () => {
  it('walks the whole road in order, deriving each step from game state', () => {
    let state = createInitialGameState();
    const seen: TutorialStep[] = [];
    const record = (screen: string, form = false) => seen.push(getTutorialStep(state, screen, form));
    record('dashboard');
    record('tasks');
    record('tasks', true);
    state = { ...state, tasks: [task(TaskStatus.PENDING)] };
    record('tasks');
    state = { ...state, tasks: [task(TaskStatus.COMPLETED)] };
    record('dashboard');
    record('companions');
    state = adoptStarter(state, STARTER_TEMPLATE_IDS[1]);
    record('companions');
    expect(seen).toEqual([
      'open-tasks', 'tap-add-task', 'confirm-task-add', 'complete-task', 'open-realm', 'choose-companion', 'open-journey',
    ]);
    expect(seen).toEqual(GUIDE_STEPS);
  });
});

describe('speaker', () => {
  it('is the first starter before adoption, then the adopted companion', () => {
    const fresh = createInitialGameState();
    const before = getGuideSpeaker(fresh);
    expect(before.adopted).toBe(false);
    expect(before.templateId).toBe(STARTER_TEMPLATE_IDS[0]);
    expect(before.name.length).toBeGreaterThan(0);

    const pick = STARTER_TEMPLATE_IDS[2];
    const after = getGuideSpeaker(adoptStarter(fresh, pick));
    expect(after.adopted).toBe(true);
    expect(after.templateId).toBe(pick);
  });

  it('addresses the player by the speaker name and invites the choice before adoption', () => {
    const copy = getAppCopy('en');
    const speaker = getGuideSpeaker(createInitialGameState());
    expect(tutorialMessage('choose-companion', copy, speaker, false)).toContain(speaker.name);
    const adopted = getGuideSpeaker(adoptStarter(createInitialGameState(), STARTER_TEMPLATE_IDS[1]));
    expect(tutorialMessage('open-journey', copy, adopted, false)).toContain(adopted.name);
    expect(tutorialMessage('complete-task', copy, adopted, false)).toContain(String(TUTORIAL_FIRST_TASK_REWARD));
    expect(tutorialMessage('complete-task', copy, adopted, true)).not.toContain(String(TUTORIAL_FIRST_TASK_REWARD));
  });
});

describe('Back / Next', () => {
  it('Back walks to earlier bubbles, clamps at the first, and never moves the real step', () => {
    const real = 'complete-task';
    let offset = 0;
    offset = guideBack(GUIDE_STEPS, real, offset);
    expect(guideStepAt(GUIDE_STEPS, real, offset)).toBe('confirm-task-add');
    offset = guideBack(GUIDE_STEPS, real, offset);
    offset = guideBack(GUIDE_STEPS, real, offset);
    offset = guideBack(GUIDE_STEPS, real, offset);
    offset = guideBack(GUIDE_STEPS, real, offset);
    expect(guideStepAt(GUIDE_STEPS, real, offset)).toBe('open-tasks');
    expect(guideBack(GUIDE_STEPS, real, offset)).toBe(offset);
    // The step that drives highlights and rewards is derived from state, untouched by paging.
    const state = { ...createInitialGameState(), tasks: [task(TaskStatus.PENDING)] };
    expect(getTutorialStep(state, 'tasks', false)).toBe(real);
  });

  it('Next walks back toward the current bubble, then acts on the step', () => {
    expect(guideNext(GUIDE_STEPS, 'complete-task', -2)).toEqual({ offset: -1, navigate: null });
    expect(guideNext(GUIDE_STEPS, 'complete-task', -1)).toEqual({ offset: 0, navigate: null });
    // Navigation steps open their screen; action steps only peek ahead.
    expect(guideNext(GUIDE_STEPS, 'open-tasks', 0)).toEqual({ offset: 0, navigate: 'tasks' });
    expect(guideNext(GUIDE_STEPS, 'open-realm', 0)).toEqual({ offset: 0, navigate: 'companions' });
    expect(guideNext(GUIDE_STEPS, 'open-journey', 0)).toEqual({ offset: 0, navigate: 'journey' });
    expect(guideNext(GUIDE_STEPS, 'complete-task', 0)).toEqual({ offset: 1, navigate: null });
  });

  it('cannot skip past choosing a companion', () => {
    expect(guideCanAdvance(GUIDE_STEPS, 'choose-companion', 0)).toBe(false);
    expect(guideNext(GUIDE_STEPS, 'choose-companion', 0).offset).toBe(0);
  });

  it('replay is a shorter road over the same bubbles', () => {
    expect(REPLAY_STEPS.every((step) => GUIDE_STEPS.includes(step))).toBe(true);
    expect(REPLAY_STEPS).not.toContain('choose-companion');
  });
});

describe('skip and rewards', () => {
  it('Skip ends the tutorial without rewards, and stays ended after the first task', () => {
    const skipped = skipTutorial(createInitialGameState());
    expect(skipped.tutorialCompleted).toBe(true);
    expect(skipped.coins).toBe(createInitialGameState().coins);
    const withDone = { ...skipped, tasks: [task(TaskStatus.COMPLETED)] };
    expect(applyFirstTaskReward(withDone).coins).toBe(skipped.coins);
    expect(getTutorialStep(withDone, 'tasks', false)).toBe('done');
  });

  it('replaying (completed save) pays nothing again', () => {
    let state = createInitialGameState();
    state = { ...state, tasks: [task(TaskStatus.COMPLETED)] };
    state = applyFirstTaskReward(state);
    state = finishTutorial(state);
    const paid = state.coins;
    expect(paid).toBe(createInitialGameState().coins + TUTORIAL_FIRST_TASK_REWARD + TUTORIAL_FINISH_REWARD);
    // Replay writes nothing, and even if it called the helpers they are guarded.
    expect(finishTutorial(state).coins).toBe(paid);
    expect(applyFirstTaskReward(state).coins).toBe(paid);
    expect(skipTutorial(state)).toBe(state);
    expect(getTutorialStep(state, 'dashboard', false)).toBe('done');
  });
});

describe('persistence and migration', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  /** Writes the state as a raw save (optionally edited, e.g. to drop fields), then "restarts" the app. */
  const restart = async (state: GameState, mutate?: (saved: any) => void): Promise<GameState> => {
    const saved: any = JSON.parse(JSON.stringify(createSaveData(state)));
    mutate?.(saved);
    await AsyncStorage.setItem('growra_save_data', JSON.stringify(saved));
    const result = await gameStateService.loadGame();
    if (result.status !== 'loaded') throw new Error(`save did not load: ${result.status}`);
    return result.saveData.gameState;
  };

  it('resumes mid-tutorial after a restart from the saved game', async () => {
    const state = { ...createInitialGameState(), tasks: [task(TaskStatus.PENDING)] };
    const restored = await restart(state);
    expect(restored.tutorialCompleted).toBe(false);
    expect(getTutorialStep(restored, 'dashboard', false)).toBe('open-tasks');
    expect(getTutorialStep(restored, 'tasks', false)).toBe('complete-task');
  });

  it('keeps tutorialCompleted and tutorialRewardGranted across a restart', async () => {
    const state = { ...createInitialGameState(), tutorialCompleted: true, tutorialRewardGranted: true };
    const restored = await restart(state);
    expect(restored.tutorialCompleted).toBe(true);
    expect(restored.tutorialRewardGranted).toBe(true);
  });

  it('a brand-new save without the flag still gets onboarding', async () => {
    const restored = await restart(createInitialGameState(), (saved) => {
      delete saved.gameState.tutorialCompleted;
    });
    expect(restored.tutorialCompleted).toBe(false);
  });

  it('an old save without the flag but with tasks, pets or finished tasks is not forced into onboarding', async () => {
    const base = createInitialGameState();
    const variants: ((saved: any) => void)[] = [
      (saved) => { saved.gameState.tasks = [task(TaskStatus.PENDING)]; },
      (saved) => { saved.gameState.pets = adoptStarter(base, STARTER_TEMPLATE_IDS[0]).pets; },
      (saved) => { saved.gameState.totalTasksCompleted = 3; },
    ];
    for (const edit of variants) {
      const restored = await restart(base, (saved) => {
        delete saved.gameState.tutorialCompleted;
        edit(saved);
      });
      expect(restored.tutorialCompleted).toBe(true);
      expect(restored.tutorialRewardGranted).toBe(false);
    }
  });

  it('an explicit false flag is respected even when tasks exist (player is mid-tutorial)', async () => {
    const restored = await restart({ ...createInitialGameState(), tasks: [task(TaskStatus.PENDING)] });
    expect(restored.tutorialCompleted).toBe(false);
  });
});

describe('guide copy', () => {
  it('has the new strings in every language, with {name} where the bubble needs it', () => {
    for (const language of APP_LANGUAGES) {
      const copy = getAppCopy(language);
      for (const key of ['tutorialBack', 'tutorialPreviewBadge', 'tutorialReplayCompleteTask', 'tutorialReplayOpenRealm'] as const) {
        expect([language, key, copy[key].length > 0]).toEqual([language, key, true]);
      }
      for (const key of ['tutorialGuideLabel', 'tutorialPetInvite', 'tutorialPetClose'] as const) {
        expect([language, key, copy[key].includes('{name}')]).toEqual([language, key, true]);
      }
    }
  });
});

describe('review fixes (#82)', () => {
  const adopted = () => adoptStarter(createInitialGameState(), STARTER_TEMPLATE_IDS[1]);

  it('keeps "$&" and "$\'" in a pet name literal when filling the bubble', () => {
    const copy = getAppCopy('en');
    const speaker = { ...getGuideSpeaker(adopted()), name: "Mo$&$'o" };
    expect(tutorialMessage('open-journey', copy, speaker, false)).toContain("I'm Mo$&$'o!");
    expect(fillTemplate('{name} {name}', { name: '$&' })).toBe('$& $&');
    expect(fillTemplate('{coins} {x}', { coins: 5 })).toBe('5 {x}');
  });

  it('never fills a blank pet name into the bubble header', () => {
    const state = adopted();
    const blank = { ...state, pets: state.pets.map((pet) => ({ ...pet, name: '   ' })) };
    expect(getGuideSpeaker(blank).name.trim().length).toBeGreaterThan(0);
  });

  it('falls back to the default portrait when the saved variant has no art', () => {
    const state = adopted();
    const stale = { ...state, pets: state.pets.map((pet) => ({ ...pet, activeImageVariantId: 'removed-variant' })) };
    expect(getGuideSpeaker(stale).variantId).toBe('default');
  });

  it('does not glue a Hangul particle onto the pet name in Korean', () => {
    const copy = getAppCopy('ko');
    expect(copy.tutorialPetInvite).not.toMatch(/\{name\}[가-힣]/);
    expect(copy.tutorialPetClose).not.toMatch(/\{name\}[가-힣]/);
  });

  it('leaves no unfilled placeholder in any language for any bubble', () => {
    const speaker = getGuideSpeaker(adopted());
    const fresh = getGuideSpeaker(createInitialGameState());
    for (const language of APP_LANGUAGES) {
      const copy = getAppCopy(language);
      for (const step of GUIDE_STEPS) {
        for (const replay of [false, true]) {
          for (const who of [speaker, fresh]) {
            expect([language, step, tutorialMessage(step, copy, who, replay)]).not.toEqual([language, step, expect.stringMatching(/\{\w+\}/)]);
          }
        }
      }
    }
  });
});

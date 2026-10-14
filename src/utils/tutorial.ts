import { GameState, TaskStatus } from "../types";

// The first-run tutorial: a welcome card, four guided steps (add a task, complete it, choose a
// companion, see the Journey) and a finish card. Pure functions here; App.tsx renders it.

export type TutorialStep =
  | "open-tasks"
  | "tap-add-task"
  | "confirm-task-add"
  | "complete-task"
  | "open-realm"
  | "choose-companion"
  | "open-journey"
  | "done";

export type TutorialScreen = "dashboard" | "tasks" | "task-calendar" | "journey" | "companions";

/** Coins for completing the first task during the tutorial (shown in that step's hint). */
export const TUTORIAL_FIRST_TASK_REWARD = 100;
/** Welcome gift for finishing the tutorial (shown on the finish card). */
export const TUTORIAL_FINISH_REWARD = 100;
export const TUTORIAL_STEP_COUNT = 4;

export function getTutorialStep(
  gameState: GameState,
  activeScreen: TutorialScreen | string,
  addTaskFormOpen: boolean,
): TutorialStep {
  if (gameState.tutorialCompleted) return "done";

  if (gameState.tasks.length === 0) {
    if (activeScreen !== "tasks") return "open-tasks";
    // Any task counts: predefined (Drink Water is suggested) or the player's own.
    return addTaskFormOpen ? "confirm-task-add" : "tap-add-task";
  }

  const hasCompletedTask = gameState.tasks.some((task) => task.status === TaskStatus.COMPLETED);
  if (!hasCompletedTask) return activeScreen === "tasks" ? "complete-task" : "open-tasks";

  if (gameState.pets.length === 0 || gameState.equippedPetId === "") {
    return activeScreen === "companions" ? "choose-companion" : "open-realm";
  }

  return "open-journey";
}

/** Which of the four steps (1-4) a step belongs to, for the step dots. */
export function tutorialStepNumber(step: TutorialStep): number {
  switch (step) {
    case "open-tasks":
    case "tap-add-task":
    case "confirm-task-add":
      return 1;
    case "complete-task":
      return 2;
    case "open-realm":
    case "choose-companion":
      return 3;
    default:
      return 4;
  }
}

/** The tutorial is finished once the player opens the Journey after choosing a companion. */
export function shouldFinishTutorial(gameState: GameState, activeScreen: string): boolean {
  return !gameState.tutorialCompleted
    && getTutorialStep(gameState, activeScreen, false) === "open-journey"
    && activeScreen === "journey";
}

/** First completed task during the tutorial pays a one-time bonus. */
export function applyFirstTaskReward(gameState: GameState): GameState {
  if (gameState.tutorialCompleted || gameState.tutorialRewardGranted) return gameState;
  const hasCompletedTask = gameState.tasks.some((task) => task.status === TaskStatus.COMPLETED);
  if (!hasCompletedTask) return gameState;
  return { ...gameState, coins: gameState.coins + TUTORIAL_FIRST_TASK_REWARD, tutorialRewardGranted: true };
}

/** Marks the tutorial done and pays the welcome gift. */
export function finishTutorial(gameState: GameState): GameState {
  if (gameState.tutorialCompleted) return gameState;
  return { ...gameState, tutorialCompleted: true, coins: gameState.coins + TUTORIAL_FINISH_REWARD };
}

/** Skipping ends the tutorial without its rewards. */
export function skipTutorial(gameState: GameState): GameState {
  if (gameState.tutorialCompleted) return gameState;
  return { ...gameState, tutorialCompleted: true };
}

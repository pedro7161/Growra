import { GameState, SaveData, Streak } from "../types";
import { defaultSettings } from "./settings";

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function createInitialStreak(): Streak {
  return {
    level: 0,
    bonus: 0,
    lastCompletedDate: 0,
    consecutiveMisses: 0,
  };
}

export function createInitialGameState(): GameState {
  return {
    playerId: generateId(),
    level: 1,
    coins: 0,
    pityCurrency: 0,
    totalExperience: 0,
    totalTasksCompleted: 0,
    tutorialCompleted: false,
    settings: defaultSettings,
    tasks: [],
    pets: [],
    equippedPetId: "",
    streak: createInitialStreak(),
    createdAt: Date.now(),
    lastPlayedAt: Date.now(),
  };
}

export function createSaveData(gameState: GameState): SaveData {
  return {
    gameState,
    lastSavedAt: Date.now(),
    version: 9,
  };
}

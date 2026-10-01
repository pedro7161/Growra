import { GameState, SaveData, Streak } from "../types";
import { defaultSettings } from "./settings";
import { generateId } from "./idUtils";
import { createEmptyUsage } from "./companions";

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
    totalExperience: 0,
    totalTasksCompleted: 0,
    tutorialCompleted: false,
    tutorialRewardGranted: false,
    settings: defaultSettings,
    tasks: [],
    customTaskTemplates: [],
    pets: [],
    equippedPetId: "",
    usage: createEmptyUsage(),
    companionEvents: [],
    notices: [],
    days: [],
    decorations: [],
    streak: createInitialStreak(),
    plus: { owned: false, lastCheckedAt: 0 },
    explore: { day: 0, count: 0 },
    createdAt: Date.now(),
    lastPlayedAt: Date.now(),
  };
}

export function createSaveData(gameState: GameState): SaveData {
  return {
    gameState,
    lastSavedAt: Date.now(),
    version: 17,
  };
}

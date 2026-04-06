import { GameState, SaveData, Streak } from "../types";
import { createStarterPet } from "./gameplay";
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
  const starterPet = createStarterPet();

  return {
    playerId: generateId(),
    level: 1,
    coins: 0,
    pityCurrency: 0,
    totalExperience: 0,
    totalTasksCompleted: 0,
    settings: defaultSettings,
    tasks: [],
    pets: [starterPet],
    equippedPetId: starterPet.id,
    streak: createInitialStreak(),
    createdAt: Date.now(),
    lastPlayedAt: Date.now(),
  };
}

export function createSaveData(gameState: GameState): SaveData {
  return {
    gameState,
    lastSavedAt: Date.now(),
    version: 8,
  };
}

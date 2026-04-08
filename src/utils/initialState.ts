import { GameState, SaveData, Streak } from "../types";
import { defaultSettings } from "./settings";
import { generateId } from "./idUtils";

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
    tutorialRewardGranted: false,
    settings: defaultSettings,
    tasks: [],
    customTaskTemplates: [],
    pets: [],
    gearItems: [],
    battleConsumables: [],
    expeditionProgress: {
      expeditionsSent: 0,
      revealPoints: 0,
      activeZoneIndex: -1,
      activeZoneEndsAt: 0,
      activeNodeId: "",
      activeNodePetId: "",
      activeNodeEndsAt: 0,
      completedNodeIds: [],
    },
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
    version: 17,
  };
}

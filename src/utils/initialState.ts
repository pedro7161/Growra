import { GameState, SaveData, Streak } from "../types";
import { defaultSettings } from "./settings";
import { deviceLanguage } from "../constants/languages";
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
    settings: { ...defaultSettings, language: deviceLanguage() },
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
    rooms: [],
    ownedRoomStyles: ["wooden-bedroom"],
    roomShareFooter: true,
    backupNudgeShown: false,
    whatsNewHiddenFor: "",
    workItems: [],
    groups: [],
    createdAt: Date.now(),
    lastPlayedAt: Date.now(),
  };
}

/**
 * The save format this build writes. Bump it whenever a build changes the save shape, so an older
 * build refuses that save instead of quietly dropping what it doesn't understand (#50).
 */
export const SAVE_VERSION = 22; // 19: whatsNewHiddenFor (#64); 20: ghost room items (#41); 21: work schedule; 22: groups

export function createSaveData(gameState: GameState): SaveData {
  return {
    gameState,
    lastSavedAt: Date.now(),
    version: SAVE_VERSION,
  };
}

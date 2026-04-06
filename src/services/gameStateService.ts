import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameState, SaveData, Task, Pet, TaskStatus, AppSettings, TaskPriority } from "../types";
import { DEFAULT_TASK_CALENDAR_COLOR } from "../constants/taskConfig";
import { getPredefinedTask } from "../constants/predefinedTasks";
import {
  completeTask as applyTaskCompletion,
  equipPet as applyPetEquip,
  fusePet as applyPetFusion,
  getPetTemplateId,
  getPetProgressionSnapshot,
  redeemPityPet as applyPityRedemption,
  sellPet as applyPetSale,
  summonPet as applyPetSummon,
} from "../utils/gameplay";
import { getNextAvailableDate, getStartOfDay } from "../utils/taskSchedule";
import { defaultSettings } from "../utils/settings";

const SAVE_KEY = "growra_save_data";
const BACKUP_PREFIX = "growra-backup";

type PersistedGameState = Omit<GameState, "pityCurrency" | "totalTasksCompleted" | "equippedPetId"> & {
  pityCurrency?: number;
  totalTasksCompleted?: number;
  equippedPetId?: string;
  settings?: AppSettings;
  tasks: (
    Omit<Task, "predefinedTaskId" | "priority" | "calendarColor"> & {
      predefinedTaskId?: string;
      priority?: TaskPriority;
      calendarColor?: string;
    }
  )[];
  pets: (
    Omit<Pet, "templateId" | "fusionLevel" | "evolutionStage" | "combatPower" | "explorationPower"> & {
      templateId?: string;
      fusionLevel?: number;
      evolutionStage?: number;
      combatPower?: number;
      explorationPower?: number;
    }
  )[];
};

type PersistedSaveData = Omit<SaveData, "gameState"> & {
  gameState: PersistedGameState;
};

function getEquippedPetId(gameState: PersistedGameState): string {
  if (gameState.equippedPetId) {
    return gameState.equippedPetId;
  }

  const equippedPet = gameState.pets.find((pet) => pet.equipped);

  if (equippedPet) {
    return equippedPet.id;
  }

  return gameState.pets[0].id;
}

function migrateSaveData(saveData: PersistedSaveData): SaveData {
  const equippedPetId = getEquippedPetId(saveData.gameState);

  return {
    ...saveData,
    version: 8,
    gameState: {
      ...saveData.gameState,
      pityCurrency:
        saveData.gameState.pityCurrency !== undefined ? saveData.gameState.pityCurrency : 0,
      totalTasksCompleted:
        saveData.gameState.totalTasksCompleted !== undefined
          ? saveData.gameState.totalTasksCompleted
          : saveData.gameState.tasks.filter((task) => task.status === TaskStatus.COMPLETED).length,
      settings: saveData.gameState.settings ? saveData.gameState.settings : defaultSettings,
      tasks: saveData.gameState.tasks.map((task) => ({
        ...task,
        predefinedTaskId: task.predefinedTaskId !== undefined ? task.predefinedTaskId : "",
        priority: task.priority !== undefined ? task.priority : TaskPriority.MEDIUM,
        calendarColor:
          task.calendarColor !== undefined
            ? task.calendarColor
            : task.predefinedTaskId
              ? getPredefinedTask(task.predefinedTaskId).calendarColor
              : DEFAULT_TASK_CALENDAR_COLOR,
        dueDate:
          task.status === TaskStatus.COMPLETED && task.completedAt
            ? getNextAvailableDate(task, task.completedAt)
            : getStartOfDay(task.createdAt),
      })),
      equippedPetId,
      pets: saveData.gameState.pets.map((pet) => {
        const templateId =
          pet.templateId !== undefined ? pet.templateId : getPetTemplateId(pet.name, pet.rarity);
        const fusionLevel = pet.fusionLevel !== undefined ? pet.fusionLevel : 0;
        const progression = getPetProgressionSnapshot(templateId, fusionLevel);

        return {
          ...pet,
          templateId,
          fusionLevel,
          evolutionStage: progression.evolutionStage,
          stats: progression.stats,
          combatPower: progression.combatPower,
          explorationPower: progression.explorationPower,
          taskMultiplier: progression.taskMultiplier,
          equipped: pet.id === equippedPetId,
        };
      }),
    },
  };
}

function getChecksum(value: string): string {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return Math.abs(hash >>> 0).toString(36);
}

function createBackupCode(saveData: SaveData): string {
  const serializedSaveData = JSON.stringify(saveData);
  const checksum = getChecksum(serializedSaveData);

  return `${BACKUP_PREFIX}:${checksum}:${encodeURIComponent(serializedSaveData)}`;
}

function parseBackupCode(backupCode: string): SaveData {
  const trimmedBackupCode = backupCode.trim();
  const [prefix, checksum, encodedPayload] = trimmedBackupCode.split(":");

  if (prefix !== BACKUP_PREFIX || !checksum || !encodedPayload) {
    throw new Error("Invalid backup code");
  }

  const serializedSaveData = decodeURIComponent(encodedPayload);

  if (getChecksum(serializedSaveData) !== checksum) {
    throw new Error("Invalid backup checksum");
  }

  const parsedSaveData: PersistedSaveData = JSON.parse(serializedSaveData);
  return migrateSaveData(parsedSaveData);
}

export const gameStateService = {
  async loadGame(): Promise<SaveData | null> {
    try {
      const data = await AsyncStorage.getItem(SAVE_KEY);
      if (!data) {
        return null;
      }

      const parsedData: PersistedSaveData = JSON.parse(data);
      return migrateSaveData(parsedData);
    } catch (error) {
      console.error("Failed to load game:", error);
      return null;
    }
  },

  async saveGame(saveData: SaveData): Promise<void> {
    try {
      await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    } catch (error) {
      console.error("Failed to save game:", error);
    }
  },

  async resetGame(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SAVE_KEY);
    } catch (error) {
      console.error("Failed to reset game:", error);
    }
  },

  exportSaveCode(saveData: SaveData): string {
    return createBackupCode(saveData);
  },

  importSaveCode(backupCode: string): SaveData {
    return parseBackupCode(backupCode);
  },

  async addTask(gameState: GameState, task: Task): Promise<GameState> {
    return {
      ...gameState,
      tasks: [...gameState.tasks, task],
      lastPlayedAt: Date.now(),
    };
  },

  async completeTask(gameState: GameState, taskId: string): Promise<GameState> {
    return applyTaskCompletion(gameState, taskId);
  },

  async equipPet(gameState: GameState, petId: string): Promise<GameState> {
    return applyPetEquip(gameState, petId);
  },

  async addPet(gameState: GameState, pet: Pet): Promise<GameState> {
    return {
      ...gameState,
      pets: [...gameState.pets, pet],
      lastPlayedAt: Date.now(),
    };
  },

  async summonPet(gameState: GameState): Promise<GameState> {
    return applyPetSummon(gameState);
  },

  async redeemPityPet(gameState: GameState, templateId: string): Promise<GameState> {
    return applyPityRedemption(gameState, templateId);
  },

  async fusePet(gameState: GameState, targetPetId: string, sourcePetId: string): Promise<GameState> {
    return applyPetFusion(gameState, targetPetId, sourcePetId);
  },

  async sellPet(gameState: GameState, petId: string): Promise<GameState> {
    return applyPetSale(gameState, petId);
  },
};

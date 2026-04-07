import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GameState,
  SaveData,
  Task,
  Pet,
  TaskStatus,
  AppSettings,
  TaskPriority,
  TaskTimer,
  CustomTaskTemplate,
} from "../types";
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
  multiSummonPet as applyMultiPetSummon,
} from "../utils/gameplay";
import { getNextAvailableDate, getStartOfDay } from "../utils/taskSchedule";
import { defaultSettings, defaultTimerAlertSettings } from "../utils/settings";
import { createTaskTimer } from "../utils/taskTimer";

const SAVE_KEY = "growra_save_data";
const BACKUP_PREFIX = "growra-backup";

type PersistedGameState = Omit<
  GameState,
  "pityCurrency" | "totalTasksCompleted" | "equippedPetId" | "tutorialCompleted" | "customTaskTemplates"
> & {
  pityCurrency?: number;
  totalTasksCompleted?: number;
  equippedPetId?: string;
  tutorialCompleted?: boolean;
  settings?: AppSettings;
  customTaskTemplates?: CustomTaskTemplate[];
  tasks: (
    Omit<Task, "predefinedTaskId" | "customTemplateId" | "category" | "priority" | "calendarColor"> & {
      predefinedTaskId?: string;
      customTemplateId?: string;
      category?: string;
      priority?: TaskPriority;
      calendarColor?: string;
      timer?: TaskTimer;
    }
  )[];
  pets: (
    Omit<Pet, "templateId" | "fusionLevel" | "evolutionStage" | "combatPower" | "explorationPower" | "xpMultiplier" | "activeImageVariantId"> & {
      templateId?: string;
      fusionLevel?: number;
      evolutionStage?: number;
      combatPower?: number;
      explorationPower?: number;
      xpMultiplier?: number;
      activeImageVariantId?: string;
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

  if (gameState.pets.length > 0) {
    return gameState.pets[0].id;
  }

  return "";
}

function migrateSaveData(saveData: PersistedSaveData): SaveData {
  const equippedPetId = getEquippedPetId(saveData.gameState);
  const storedSettings = saveData.gameState.settings ? saveData.gameState.settings : defaultSettings;
  const timerAlert = storedSettings.timerAlert
    ? {
        mode: storedSettings.timerAlert.mode,
        soundName: storedSettings.timerAlert.soundName,
        soundUri: storedSettings.timerAlert.soundUri,
      }
    : defaultTimerAlertSettings;

  return {
    ...saveData,
    version: 11,
    gameState: {
      ...saveData.gameState,
      pityCurrency:
        saveData.gameState.pityCurrency !== undefined ? saveData.gameState.pityCurrency : 0,
      totalTasksCompleted:
        saveData.gameState.totalTasksCompleted !== undefined
          ? saveData.gameState.totalTasksCompleted
          : saveData.gameState.tasks.filter((task) => task.status === TaskStatus.COMPLETED).length,
      tutorialCompleted:
        saveData.gameState.tutorialCompleted !== undefined ? saveData.gameState.tutorialCompleted : false,
      settings: {
        ...storedSettings,
        timerAlert,
      },
      customTaskTemplates: saveData.gameState.customTaskTemplates
        ? saveData.gameState.customTaskTemplates.map((template) => ({
            ...template,
          }))
        : [],
      tasks: saveData.gameState.tasks.map((task) => ({
        ...task,
        predefinedTaskId: task.predefinedTaskId !== undefined ? task.predefinedTaskId : "",
        customTemplateId: task.customTemplateId !== undefined ? task.customTemplateId : "",
        category:
          task.category !== undefined
            ? task.category
            : task.predefinedTaskId
              ? getPredefinedTask(task.predefinedTaskId).category
              : "custom",
        priority: task.priority !== undefined ? task.priority : TaskPriority.MEDIUM,
      calendarColor:
        task.calendarColor !== undefined
          ? task.calendarColor
          : task.predefinedTaskId
            ? getPredefinedTask(task.predefinedTaskId).calendarColor
            : DEFAULT_TASK_CALENDAR_COLOR,
      dueDate:
        task.dueDate !== undefined
          ? task.dueDate
          : task.status === TaskStatus.COMPLETED && task.completedAt
            ? getNextAvailableDate(task, task.completedAt)
            : getStartOfDay(task.createdAt),
      timer: (() => {
        const duration = Math.max(0, task.timer?.duration ?? 0);
        const enabled = task.timer?.enabled ?? false;
        const baseTimer = createTaskTimer(duration, enabled);
        const remaining = Math.min(duration, Math.max(0, task.timer?.remainingMs ?? duration));

        return {
          ...baseTimer,
          state: task.timer?.state ?? baseTimer.state,
          startedAt: task.timer?.startedAt ?? 0,
          remainingMs: enabled ? remaining : 0,
        };
      })(),
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
          xpMultiplier: progression.xpMultiplier,
          activeImageVariantId: pet.activeImageVariantId ?? "default",
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

  async multiSummonPet(gameState: GameState): Promise<GameState> {
    return applyMultiPetSummon(gameState);
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

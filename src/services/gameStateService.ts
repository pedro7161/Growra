import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BattleConsumableItem,
  GameState,
  SaveData,
  Task,
  Pet,
  PetRarity,
  TaskStatus,
  AppSettings,
  TaskPriority,
  TaskTimer,
  CustomTaskTemplate,
  CompanionEvent,
  GameNotice,
  UsageStats,
} from "../types";
import { DEFAULT_TASK_CALENDAR_COLOR } from "../constants/taskConfig";
import { getPredefinedTask } from "../constants/predefinedTasks";
import {
  completeTask as applyTaskCompletion,
  equipPet as applyPetEquip,
  equipGearToPet as applyGearEquip,
  getPetTemplateId,
  getSellValue,
  withCompanionBond,
  exploreExpeditionNode as applyExpeditionNode,
  refreshPetGearState,
  resolveExpeditionBattle as applyExpeditionBattle,
} from "../utils/gameplay";
import { getNextAvailableDate, getStartOfDay } from "../utils/taskSchedule";
import { defaultSettings, defaultTimerAlertSettings } from "../utils/settings";
import { createTaskTimer } from "../utils/taskTimer";
import { BOND_GROWTH_THRESHOLDS, createEmptyUsage } from "../utils/companions";

/** Old saves stored pity currency; it converts to coins at this rate when companions replace gacha. */
const PITY_TO_COINS = 5;

const SAVE_KEY = "growra_save_data";
const CORRUPT_SAVE_KEY_PREFIX = "growra_save_data_corrupt_";

export type LoadResult =
  | { status: "empty" }
  | { status: "loaded"; saveData: SaveData }
  | { status: "corrupt"; backupKey: string };
const BACKUP_PREFIX = "growra-backup";

type PersistedGameState = Omit<
  GameState,
  | "pityCurrency"
  | "totalTasksCompleted"
  | "equippedPetId"
  | "tutorialCompleted"
  | "tutorialRewardGranted"
  | "customTaskTemplates"
  | "gearItems"
  | "battleConsumables"
  | "expeditionProgress"
  | "usage"
  | "companionEvents"
  | "notices"
> & {
  usage?: UsageStats;
  companionEvents?: CompanionEvent[];
  notices?: GameNotice[];
  pityCurrency?: number;
  totalTasksCompleted?: number;
  equippedPetId?: string;
  tutorialCompleted?: boolean;
  tutorialRewardGranted?: boolean;
  settings?: AppSettings;
  customTaskTemplates?: CustomTaskTemplate[];
  gearItems?: {
    id?: string;
    name?: string;
    rarity?: PetRarity;
    bonusStats?: Pet["stats"];
    sourceZoneIndex?: number;
    equippedPetId?: string;
    acquiredAt?: number;
  }[];
  battleConsumables?: {
    id?: string;
    name?: string;
    kind?: BattleConsumableItem["kind"];
    rarity?: PetRarity;
    potency?: number;
    sourceZoneIndex?: number;
    acquiredAt?: number;
  }[];
  expeditionProgress?: {
    expeditionsSent?: number;
    revealPoints?: number;
    activeZoneIndex?: number;
    activeZoneEndsAt?: number;
    activeNodeId?: string;
    activeNodePetId?: string;
    activeNodeEndsAt?: number;
    completedNodeIds?: string[];
  };
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
    Omit<
      Pet,
      | "templateId"
      | "baseStats"
      | "fusionLevel"
      | "evolutionStage"
      | "combatPower"
      | "explorationPower"
      | "xpMultiplier"
      | "activeImageVariantId"
      | "equippedGearId"
    > & {
      templateId?: string;
      baseStats?: Pet["stats"];
      fusionLevel?: number;
      evolutionStage?: number;
      combatPower?: number;
      explorationPower?: number;
      xpMultiplier?: number;
      activeImageVariantId?: string;
      equippedGearId?: string;
      bond?: number;
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

  const gearItems = saveData.gameState.gearItems
    ? saveData.gameState.gearItems.map((gearItem) => ({
        id: gearItem.id !== undefined ? gearItem.id : "",
        name: gearItem.name !== undefined ? gearItem.name : "",
        rarity: gearItem.rarity !== undefined ? gearItem.rarity : PetRarity.COMMON,
        bonusStats:
          gearItem.bonusStats !== undefined
            ? gearItem.bonusStats
            : {
                attack: 0,
                defense: 0,
                speed: 0,
                luck: 0,
              },
        sourceZoneIndex:
          gearItem.sourceZoneIndex !== undefined ? gearItem.sourceZoneIndex : 0,
        equippedPetId:
          gearItem.equippedPetId !== undefined ? gearItem.equippedPetId : "",
        acquiredAt:
          gearItem.acquiredAt !== undefined ? gearItem.acquiredAt : Date.now(),
      }))
    : [];

  // Companions (GAME_REDESIGN §4): each template exists once. Keep the most-grown copy of each
  // (then the equipped one), turn the other copies into coins at their old sell value.
  const normalizedPets = saveData.gameState.pets.map((pet) => {
    const templateId =
      pet.templateId !== undefined ? pet.templateId : getPetTemplateId(pet.name, pet.rarity);
    const fusionLevel = pet.fusionLevel !== undefined ? pet.fusionLevel : 0;
    const bond =
      pet.bond !== undefined ? pet.bond : BOND_GROWTH_THRESHOLDS[Math.min(fusionLevel, BOND_GROWTH_THRESHOLDS.length - 1)];
    return { ...pet, templateId, fusionLevel, bond };
  });
  const keptPetIds = new Set<string>();
  const keptByTemplate = new Map<string, string>();
  [...normalizedPets]
    .sort((left, right) =>
      right.bond !== left.bond
        ? right.bond - left.bond
        : left.id === equippedPetId
          ? -1
          : right.id === equippedPetId
            ? 1
            : left.createdAt - right.createdAt,
    )
    .forEach((pet) => {
      if (!keptByTemplate.has(pet.templateId)) {
        keptByTemplate.set(pet.templateId, pet.id);
        keptPetIds.add(pet.id);
      }
    });
  const duplicateCoins = normalizedPets
    .filter((pet) => !keptPetIds.has(pet.id))
    .reduce((total, pet) => total + getSellValue(pet.rarity), 0);
  const pityCoins = (saveData.gameState.pityCurrency ?? 0) * PITY_TO_COINS;
  const equippedTemplate = normalizedPets.find((pet) => pet.id === equippedPetId)?.templateId;
  const activePetId = equippedTemplate ? keptByTemplate.get(equippedTemplate) ?? "" : equippedPetId;

  const pets = normalizedPets
    .filter((pet) => keptPetIds.has(pet.id))
    .map((pet) =>
      withCompanionBond(
        {
          ...pet,
          level: pet.level ?? 1,
          experience: pet.experience ?? 0,
          evolutionStage: 0,
          baseStats: pet.baseStats ?? pet.stats,
          combatPower: 0,
          explorationPower: 0,
          xpMultiplier: pet.xpMultiplier ?? 1,
          activeImageVariantId: pet.activeImageVariantId !== undefined ? pet.activeImageVariantId : "default",
          equippedGearId: pet.equippedGearId !== undefined ? pet.equippedGearId : "",
          equipped: pet.id === activePetId,
        },
        pet.bond,
      ),
    );
  const convertedCoins = duplicateCoins + pityCoins;
  const completionDays = [
    ...new Set(
      saveData.gameState.tasks
        .filter((task) => task.completedAt)
        .map((task) => getStartOfDay(task.completedAt as number)),
    ),
  ];

  const { pityCurrency: _legacyPity, ...persistedWithoutPity } = saveData.gameState;
  const migratedGameState = refreshPetGearState({
    ...persistedWithoutPity,
    coins: saveData.gameState.coins + convertedCoins,
    usage: saveData.gameState.usage ?? {
      ...createEmptyUsage(),
      activeDays: completionDays.length,
      lastActiveDay: completionDays.length > 0 ? Math.max(...completionDays) : 0,
    },
    companionEvents: saveData.gameState.companionEvents ?? [],
    notices: [
      ...(saveData.gameState.notices ?? []),
      ...(convertedCoins > 0 ? [{ kind: "companions-migrated" as const, coins: convertedCoins }] : []),
    ],
    totalTasksCompleted:
      saveData.gameState.totalTasksCompleted !== undefined
        ? saveData.gameState.totalTasksCompleted
        : saveData.gameState.tasks.filter((task) => task.status === TaskStatus.COMPLETED).length,
    tutorialCompleted:
      saveData.gameState.tutorialCompleted !== undefined
        ? saveData.gameState.tutorialCompleted
        : false,
    tutorialRewardGranted:
      saveData.gameState.tutorialRewardGranted !== undefined
        ? saveData.gameState.tutorialRewardGranted
        : false,
    settings: {
      ...storedSettings,
      timerAlert,
    },
    expeditionProgress: saveData.gameState.expeditionProgress
    ? {
        expeditionsSent:
          saveData.gameState.expeditionProgress.expeditionsSent !== undefined
            ? saveData.gameState.expeditionProgress.expeditionsSent
              : 0,
          revealPoints:
            saveData.gameState.expeditionProgress.revealPoints !== undefined
              ? saveData.gameState.expeditionProgress.revealPoints
              : 0,
          activeZoneIndex:
            saveData.gameState.expeditionProgress.activeZoneIndex !== undefined
              ? saveData.gameState.expeditionProgress.activeZoneIndex
              : -1,
          activeZoneEndsAt:
            saveData.gameState.expeditionProgress.activeZoneEndsAt !== undefined
              ? saveData.gameState.expeditionProgress.activeZoneEndsAt
              : 0,
          activeNodeId:
            saveData.gameState.expeditionProgress.activeNodeId !== undefined
              ? saveData.gameState.expeditionProgress.activeNodeId
              : "",
          activeNodePetId:
            saveData.gameState.expeditionProgress.activeNodePetId !== undefined
              ? saveData.gameState.expeditionProgress.activeNodePetId
              : "",
          activeNodeEndsAt:
            saveData.gameState.expeditionProgress.activeNodeEndsAt !== undefined
              ? saveData.gameState.expeditionProgress.activeNodeEndsAt
              : 0,
          completedNodeIds:
            saveData.gameState.expeditionProgress.completedNodeIds !== undefined
              ? saveData.gameState.expeditionProgress.completedNodeIds
              : [],
        }
      : {
          expeditionsSent: 0,
          revealPoints: 0,
          activeZoneIndex: -1,
          activeZoneEndsAt: 0,
          activeNodeId: "",
          activeNodePetId: "",
          activeNodeEndsAt: 0,
          completedNodeIds: [],
        },
    battleConsumables: saveData.gameState.battleConsumables
      ? saveData.gameState.battleConsumables.map((item) => ({
          ...item,
          id: item.id !== undefined ? item.id : "",
          name: item.name !== undefined ? item.name : "",
          kind: item.kind !== undefined ? item.kind : "heal",
          rarity: item.rarity !== undefined ? item.rarity : PetRarity.COMMON,
          potency: item.potency !== undefined ? item.potency : 1,
          sourceZoneIndex:
            item.sourceZoneIndex !== undefined ? item.sourceZoneIndex : 0,
          acquiredAt: item.acquiredAt !== undefined ? item.acquiredAt : Date.now(),
        }))
      : [],
    customTaskTemplates: saveData.gameState.customTaskTemplates
      ? saveData.gameState.customTaskTemplates.map((template) => ({
          ...template,
        }))
      : [],
    // Gear worn by a removed duplicate goes back to the vault.
    gearItems: gearItems.map((gearItem) =>
      gearItem.equippedPetId === "" || keptPetIds.has(gearItem.equippedPetId)
        ? gearItem
        : { ...gearItem, equippedPetId: "" },
    ),
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
    pets,
    equippedPetId: activePetId,
  });

  return {
    ...saveData,
    version: 16,
    gameState: migratedGameState,
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
  async loadGame(): Promise<LoadResult> {
    const data = await AsyncStorage.getItem(SAVE_KEY);
    if (!data) {
      return { status: "empty" };
    }

    try {
      const parsedData: PersistedSaveData = JSON.parse(data);
      return { status: "loaded", saveData: migrateSaveData(parsedData) };
    } catch (error) {
      // Keep the unreadable save under its own key before anything can overwrite SAVE_KEY,
      // so a later version (or a manual fix) can still recover the player's progress.
      console.error("Failed to load game:", error);
      const backupKey = `${CORRUPT_SAVE_KEY_PREFIX}${Date.now()}`;
      await AsyncStorage.setItem(backupKey, data);
      return { status: "corrupt", backupKey };
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






  async equipGearToPet(
    gameState: GameState,
    gearItemId: string,
    petId: string,
  ): Promise<GameState> {
    return applyGearEquip(gameState, gearItemId, petId);
  },

  async resolveExpeditionBattle(
    gameState: GameState,
    zoneIndex: number,
    petId: string,
    battleConsumableIds: string[] = [],
  ): Promise<GameState> {
    return applyExpeditionBattle(gameState, zoneIndex, petId, battleConsumableIds);
  },

  async exploreExpeditionNode(
    gameState: GameState,
    nodeId: string,
    petId: string,
  ): Promise<GameState> {
    return applyExpeditionNode(gameState, nodeId, petId);
  },
};

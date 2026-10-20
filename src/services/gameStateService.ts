import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DayRecord,
  Decoration,
  ExploreState,
  PlusState,
  Room,
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
  getPetTemplateId,
  getSellValue,
  withCompanionBond,
} from "../utils/gameplay";
import { buildDaysFromTasks } from "../utils/journey";
import { getNextAvailableDate, getStartOfDay } from "../utils/taskSchedule";
import { defaultSettings, defaultTimerAlertSettings } from "../utils/settings";
import { SAVE_VERSION } from "../utils/initialState";
import { createTaskTimer } from "../utils/taskTimer";
import { BOND_GROWTH_THRESHOLDS, createEmptyUsage } from "../utils/companions";

/** Old saves stored pity currency; it converts to coins at this rate when companions replace gacha. */
const PITY_TO_COINS = 5;
/** Coins per battle consumable when the Journey replaced expeditions; gear gets half a pet's sell value. */
const CONSUMABLE_TO_COINS = 10;

const SAVE_KEY = "growra_save_data";
const CORRUPT_SAVE_KEY_PREFIX = "growra_save_data_corrupt_";
/** The save as it was just before an import replaced it. */
const SNAPSHOT_SAVE_KEY_PREFIX = "growra_save_data_snapshot_";
/** Unreadable saves (and pre-import snapshots) kept for recovery; older copies are dropped. */
const MAX_CORRUPT_SAVES = 2;

/** Thrown when a save or backup was written by a newer Growra than this one. */
export class NewerSaveError extends Error {
  constructor(readonly version: number) {
    super(`Save version ${version} is newer than this app (${SAVE_VERSION})`);
    this.name = "NewerSaveError";
  }
}

function savedVersion(data: unknown): number {
  const version = isObject(data) ? data.version : undefined;
  return typeof version === "number" && Number.isFinite(version) ? version : 0;
}

const ARRAY_FIELDS = [
  "tasks",
  "customTaskTemplates",
  "pets",
  "companionEvents",
  "notices",
  "days",
  "decorations",
  "rooms",
  "ownedRoomStyles",
] as const;
const NUMBER_FIELDS = ["level", "coins", "totalExperience", "totalTasksCompleted", "createdAt", "lastPlayedAt"] as const;
const OBJECT_FIELDS = ["settings", "usage", "streak", "plus", "explore"] as const;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * True when a (migrated) save has the shape the app renders from. A checksum only proves a backup
 * code wasn't truncated; this keeps a structurally broken payload from becoming live state.
 */
export function isValidSaveShape(saveData: unknown): saveData is SaveData {
  if (!isObject(saveData) || !isObject(saveData.gameState)) return false;
  const gameState = saveData.gameState;
  return (
    ARRAY_FIELDS.every((field) => Array.isArray(gameState[field])) &&
    NUMBER_FIELDS.every((field) => typeof gameState[field] === "number" && Number.isFinite(gameState[field])) &&
    OBJECT_FIELDS.every((field) => isObject(gameState[field])) &&
    typeof (gameState.settings as Record<string, unknown>).language === "string"
  );
}

/** Keeps only the newest MAX_CORRUPT_SAVES copies under a prefix (the key suffix is the time it was stashed). */
async function pruneCorruptSaves(prefix: string = CORRUPT_SAVE_KEY_PREFIX): Promise<void> {
  const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(prefix));
  const newestFirst = [...keys].sort(
    (left, right) => Number(right.slice(prefix.length)) - Number(left.slice(prefix.length)),
  );
  const stale = newestFirst.slice(MAX_CORRUPT_SAVES);
  if (stale.length > 0) await AsyncStorage.multiRemove(stale);
}

export type LoadResult =
  | { status: "empty" }
  | { status: "loaded"; saveData: SaveData }
  | { status: "corrupt"; backupKey: string }
  | { status: "newer"; version: number };
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
  | "days"
  | "decorations"
  | "plus"
  | "explore"
  | "rooms"
  | "ownedRoomStyles"
  | "roomShareFooter"
> & {
  days?: DayRecord[];
  decorations?: Decoration[];
  plus?: PlusState;
  explore?: ExploreState;
  rooms?: Room[];
  ownedRoomStyles?: string[];
  roomShareFooter?: boolean;
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
    kind?: string;
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

  // Journey (GAME_REDESIGN §5): gear and battle consumables are gone; they turn into coins.
  const gearCoins =
    (saveData.gameState.gearItems ?? []).reduce(
      (total, gearItem) => total + Math.floor(getSellValue(gearItem.rarity ?? PetRarity.COMMON) / 2),
      0,
    ) + (saveData.gameState.battleConsumables ?? []).length * CONSUMABLE_TO_COINS;
  const hadExpeditions = saveData.gameState.expeditionProgress !== undefined;

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
          equippedGearId: "",
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

  const {
    pityCurrency: _legacyPity,
    gearItems: _legacyGear,
    battleConsumables: _legacyConsumables,
    expeditionProgress: _legacyExpeditions,
    ...persistedWithoutLegacy
  } = saveData.gameState;
  const migratedGameState: GameState = {
    ...persistedWithoutLegacy,
    coins: saveData.gameState.coins + convertedCoins + gearCoins,
    usage: saveData.gameState.usage ?? {
      ...createEmptyUsage(),
      activeDays: completionDays.length,
      lastActiveDay: completionDays.length > 0 ? Math.max(...completionDays) : 0,
    },
    companionEvents: saveData.gameState.companionEvents ?? [],
    notices: [
      ...(saveData.gameState.notices ?? []),
      ...(convertedCoins > 0 ? [{ kind: "companions-migrated" as const, coins: convertedCoins }] : []),
      ...(hadExpeditions ? [{ kind: "journey-migrated" as const, coins: gearCoins }] : []),
    ],
    days: saveData.gameState.days ?? buildDaysFromTasks(saveData.gameState.tasks as Task[]),
    decorations: saveData.gameState.decorations ?? [],
    plus: saveData.gameState.plus ?? { owned: false, lastCheckedAt: 0 },
    explore: saveData.gameState.explore ?? { day: 0, count: 0 },
    rooms: saveData.gameState.rooms ?? [],
    ownedRoomStyles: saveData.gameState.ownedRoomStyles ?? ["wooden-bedroom"],
    roomShareFooter: saveData.gameState.roomShareFooter ?? true,
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
      // Saves from before dark mode have no appearance: follow the phone.
      appearance:
        storedSettings.appearance === "light" || storedSettings.appearance === "dark"
          ? storedSettings.appearance
          : "system",
      confirmExit: storedSettings.confirmExit !== false,
      taskToolsOpen: storedSettings.taskToolsOpen !== false,
      musicEnabled: storedSettings.musicEnabled === true,
      sfxEnabled: storedSettings.sfxEnabled === true,
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
    pets,
    equippedPetId: activePetId,
  };

  return {
    ...saveData,
    version: SAVE_VERSION,
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
  if (savedVersion(parsedSaveData) > SAVE_VERSION) {
    throw new NewerSaveError(savedVersion(parsedSaveData));
  }
  const saveData = migrateSaveData(parsedSaveData);

  if (!isValidSaveShape(saveData)) {
    throw new Error("Invalid backup contents");
  }

  return saveData;
}

export const gameStateService = {
  async loadGame(): Promise<LoadResult> {
    const data = await AsyncStorage.getItem(SAVE_KEY);
    if (!data) {
      return { status: "empty" };
    }

    let parsedData: PersistedSaveData | undefined;
    try {
      parsedData = JSON.parse(data);
    } catch {
      parsedData = undefined;
    }
    // A newer build wrote this save: don't migrate it down (that drops what this build doesn't
    // know) and don't overwrite it. The player updates the app instead (#50).
    if (parsedData !== undefined && savedVersion(parsedData) > SAVE_VERSION) {
      return { status: "newer", version: savedVersion(parsedData) };
    }

    try {
      if (parsedData === undefined) throw new Error("Save is not valid JSON");
      const saveData = migrateSaveData(parsedData);
      if (!isValidSaveShape(saveData)) {
        throw new Error("Save has an invalid shape");
      }
      return { status: "loaded", saveData };
    } catch (error) {
      // Keep the unreadable save under its own key before anything can overwrite SAVE_KEY,
      // so a later version (or a manual fix) can still recover the player's progress.
      console.error("Failed to load game:", error);
      const backupKey = `${CORRUPT_SAVE_KEY_PREFIX}${Date.now()}`;
      await AsyncStorage.setItem(backupKey, data);
      await pruneCorruptSaves();
      return { status: "corrupt", backupKey };
    }
  },

  /** Writes the save; resolves false (instead of failing silently) when the write didn't happen. */
  async saveGame(saveData: SaveData): Promise<boolean> {
    try {
      await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      return true;
    } catch (error) {
      console.error("Failed to save game:", error);
      return false;
    }
  },

  /** Copies the current save aside before something replaces it whole (an import). */
  async snapshotBeforeOverwrite(): Promise<void> {
    const data = await AsyncStorage.getItem(SAVE_KEY);
    if (!data) return;
    await AsyncStorage.setItem(`${SNAPSHOT_SAVE_KEY_PREFIX}${Date.now()}`, data);
    await pruneCorruptSaves(SNAPSHOT_SAVE_KEY_PREFIX);
  },

  /** The raw text of a stashed unreadable save, so the player can send it for recovery. */
  async readCorruptSave(backupKey: string): Promise<string | null> {
    return AsyncStorage.getItem(backupKey);
  },

  /**
   * What the crash screen offers to share: a backup code when the stored save still reads,
   * otherwise its raw text. Null when there is nothing stored.
   */
  async readStoredSaveForSharing(): Promise<string | null> {
    const data = await AsyncStorage.getItem(SAVE_KEY);
    if (!data) return null;
    try {
      const saveData = migrateSaveData(JSON.parse(data) as PersistedSaveData);
      return isValidSaveShape(saveData) ? createBackupCode(saveData) : data;
    } catch {
      return data;
    }
  },

  /** The language stored in the save, for screens shown before (or without) the game state. */
  async readStoredLanguage(): Promise<string | null> {
    try {
      const data = await AsyncStorage.getItem(SAVE_KEY);
      const language = data ? (JSON.parse(data) as { gameState?: { settings?: { language?: unknown } } }).gameState?.settings?.language : null;
      return typeof language === "string" ? language : null;
    } catch {
      return null;
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






};

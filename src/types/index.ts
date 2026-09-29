// Task Types
export enum TaskFrequency {
  ONCE = "once",
  DAILY = "daily",
  WEEKLY = "weekly",
}

export enum TaskType {
  PREDEFINED = "predefined",
  CUSTOM = "custom",
}

export enum TaskStatus {
  PENDING = "pending",
  COMPLETED = "completed",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export type AppLanguage = "en" | "pt";

export type AppThemeId = "mint" | "sunset" | "ocean";

export type TimerAlertMode = "vibration" | "sound";

export interface TimerAlertSettings {
  mode: TimerAlertMode;
  soundName: string;
  soundUri: string;
}

export interface AppSettings {
  language: AppLanguage;
  theme: AppThemeId;
  timerAlert: TimerAlertSettings;
}

export interface PredefinedTaskTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  recommendedFrequency: TaskFrequency;
  calendarColor: string;
}

export interface CustomTaskTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: number;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  predefinedTaskId: string;
  customTemplateId: string;
  category: string;
  type: TaskType;
  frequency: TaskFrequency;
  priority: TaskPriority;
  calendarColor: string;
  status: TaskStatus;
  dueDate: number; // next active timestamp
  createdAt: number;
  completedAt?: number;
  timer: TaskTimer;
}

export type TaskTimerState = "idle" | "running" | "paused" | "ready";

export interface TaskTimer {
  enabled: boolean;
  duration: number;
  state: TaskTimerState;
  startedAt: number;
  remainingMs: number;
}

// Pet Types
export enum PetRarity {
  COMMON = "common",
  RARE = "rare",
  EPIC = "epic",
  LEGENDARY = "legendary",
}

export interface PetStats {
  attack: number;
  defense: number;
  speed: number;
  luck: number;
}

export interface GearItem {
  id: string;
  name: string;
  rarity: PetRarity;
  bonusStats: PetStats;
  sourceZoneIndex: number;
  equippedPetId: string;
  acquiredAt: number;
}

export type ExpeditionNodeType = "main" | "cache" | "shrine" | "elite" | "secret";

export type BattleConsumableKind =
  | "heal"
  | "attack"
  | "shield"
  | "speed"
  | "burst"
  | "revive";

export interface BattleConsumableItem {
  id: string;
  name: string;
  kind: BattleConsumableKind;
  rarity: PetRarity;
  potency: number;
  sourceZoneIndex: number;
  acquiredAt: number;
}

export interface PetPassive {
  id: string;
  name: string;
  effect: string; // e.g., "increased_loot", "exploration_speed"
}

export interface PetImageVariants<T> {
  default: T;
  [variantId: string]: T;
}

export interface PetImages<T> {
  base: T;
  evo1: T;
  evo2: T;
  variants: PetImageVariants<T>;
}

export interface PetPromptStages {
  base: string;
  evo1: string;
  evo2: string;
}

export interface PetConcept {
  id: string;
  name: string;
  element: string;
  description: string;
  images: PetImages<string>;
  prompts: PetPromptStages;
}

export interface Pet {
  id: string;
  templateId: string;
  name: string;
  rarity: PetRarity;
  baseStats: PetStats;
  level: number;
  experience: number;
  fusionLevel: number;
  evolutionStage: number;
  stats: PetStats;
  combatPower: number;
  explorationPower: number;
  passives: PetPassive[];
  taskMultiplier: number; // percentage bonus (e.g., 0.05 for 5%)
  xpMultiplier: number; // per-pet XP multiplier (e.g., 0.9 for -10% XP)
  activeImageVariantId: string; // "default" now; cosmetics switch this to a variant name
  equippedGearId: string;
  equipped: boolean;
  createdAt: number;
  bond: number; // grows from using Growra; drives evolution (see utils/companions.ts)
}

// Usage signals for companions (Documents/GAME_REDESIGN.md §2)
export interface UsageStats {
  activeDays: number;
  lastActiveDay: number; // start of the last day with a completed task
  todayDay: number; // start of the day the "today" counters belong to
  todayDone: number;
  todayCoinTasks: number;
  todayBaseBond: number;
  recurringDone: number;
  timersFinished: number;
  customCreated: number;
  highPriorityDone: number;
  overdueCleared: number;
  rescheduled: number;
  scheduledWeekAhead: number;
  bigDays: number;
}

export interface GameNotice {
  kind: "companions-migrated";
  coins: number;
}

export interface CompanionEvent {
  kind: "joined" | "evolved";
  templateId: string;
}

export interface ExpeditionProgress {
  expeditionsSent: number;
  revealPoints: number;
  activeZoneIndex: number;
  activeZoneEndsAt: number;
  activeNodeId: string;
  activeNodePetId: string;
  activeNodeEndsAt: number;
  completedNodeIds: string[];
}

// Streak Types
export interface Streak {
  level: number;
  bonus: number; // percentage multiplier (e.g., 0.50 for +50%)
  lastCompletedDate: number; // timestamp
  consecutiveMisses: number;
}

// Game State
export interface GameState {
  playerId: string;
  level: number;
  coins: number;
  totalExperience: number;
  totalTasksCompleted: number;
  tutorialCompleted: boolean;
  tutorialRewardGranted: boolean;
  settings: AppSettings;
  tasks: Task[];
  customTaskTemplates: CustomTaskTemplate[];
  pets: Pet[];
  gearItems: GearItem[];
  battleConsumables: BattleConsumableItem[];
  expeditionProgress: ExpeditionProgress;
  equippedPetId: string;
  usage: UsageStats;
  companionEvents: CompanionEvent[]; // joins/evolutions waiting to be shown
  notices: GameNotice[]; // one-time messages (e.g. the gacha → companions migration)
  streak: Streak;
  createdAt: number;
  lastPlayedAt: number;
}

// Save Data (for persistence)
export interface SaveData {
  gameState: GameState;
  lastSavedAt: number;
  version: number; // for migration purposes
}

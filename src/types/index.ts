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

export interface AppSettings {
  language: AppLanguage;
  theme: AppThemeId;
}

export interface PredefinedTaskTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  recommendedFrequency: TaskFrequency;
  calendarColor: string;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  predefinedTaskId: string;
  type: TaskType;
  frequency: TaskFrequency;
  priority: TaskPriority;
  calendarColor: string;
  status: TaskStatus;
  dueDate: number; // next active timestamp
  createdAt: number;
  completedAt?: number;
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
  equipped: boolean;
  createdAt: number;
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
  pityCurrency: number;
  totalExperience: number;
  totalTasksCompleted: number;
  tutorialCompleted: boolean;
  settings: AppSettings;
  tasks: Task[];
  pets: Pet[];
  equippedPetId: string;
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

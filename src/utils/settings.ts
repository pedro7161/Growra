import { AppLanguage, AppSettings, GameState, TaskStatus, TimerAlertSettings } from "../types";
import { getTodayTasks } from "./taskSchedule";

const LOCALE_MAP: Record<AppLanguage, string> = {
  en: "en-US",
  pt: "pt-PT",
};

export function getLocaleFromSettings(settings: AppSettings): string {
  return LOCALE_MAP[settings.language] ?? "en-US";
}

export const defaultTimerAlertSettings: TimerAlertSettings = {
  mode: "vibration",
  soundName: "",
  soundUri: "",
};

export const defaultSettings: AppSettings = {
  language: "en",
  theme: "mint",
  timerAlert: defaultTimerAlertSettings,
};

export interface GameStatsSummary {
  totalTasksCompleted: number;
  uncompletedTasks: number;
  todayActiveTasks: number;
  totalPets: number;
  evolvedPets: number;
  activeDays: number;
  equippedPetName: string;
}

export function getGameStatsSummary(gameState: GameState): GameStatsSummary {
  const todayTasks = getTodayTasks(gameState.tasks, Date.now());
  const evolvedPets = gameState.pets.filter((pet) => pet.evolutionStage > 0).length;
  const equippedPet = gameState.pets.find((pet) => pet.id === gameState.equippedPetId);

  return {
    totalTasksCompleted: gameState.totalTasksCompleted,
    uncompletedTasks: gameState.tasks.filter((task) => task.status === TaskStatus.PENDING).length,
    todayActiveTasks: todayTasks.length,
    totalPets: gameState.pets.length,
    evolvedPets,
    activeDays: gameState.usage.activeDays,
    equippedPetName: equippedPet ? equippedPet.name : "-",
  };
}

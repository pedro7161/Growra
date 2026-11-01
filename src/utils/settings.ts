import { LANGUAGE_LOCALES } from "../constants/languages";
import { AppSettings, GameState, TaskStatus, TimerAlertSettings } from "../types";
import { getRoadPosition } from "./journey";
import { getTodayTasks } from "./taskSchedule";

export function getLocaleFromSettings(settings: AppSettings): string {
  return LANGUAGE_LOCALES[settings.language] ?? "en-US";
}

export const defaultTimerAlertSettings: TimerAlertSettings = {
  mode: "vibration",
  soundName: "",
  soundUri: "",
};

export const defaultSettings: AppSettings = {
  language: "en",
  theme: "mint",
  appearance: "system",
  confirmExit: true,
  taskToolsOpen: true,
  dailyReminder: { enabled: false, hour: 20, minute: 0 },
  musicEnabled: false,
  sfxEnabled: false,
  timerAlert: defaultTimerAlertSettings,
  tasksSection: "choose",
  workView: "day",
  dashboardCollapsed: { personal: false, work: false },
  calendarShow: [],
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
    activeDays: getRoadPosition(gameState.days).tiles,
    equippedPetName: equippedPet ? equippedPet.name : "-",
  };
}

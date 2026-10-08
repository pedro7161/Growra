import React, { useEffect, useRef, useState } from "react";
import { Alert, AppState, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import BottomNavigation from "./components/BottomNavigation";
import SettingsModal from "./components/SettingsModal";
import GrowraPlusModal from "./components/GrowraPlusModal";
import RoomEditorScreen from "./screens/RoomEditorScreen";
import { applyPlusOwnership, keepPlusOnImport, usePlusController } from "./hooks/usePlusController";
import { createPlusService } from "./services/plusService";
import { expoIapClient } from "./services/expoIapClient";
import { createAdsService } from "./services/adsService";
import { googleAdsClient } from "./services/googleAdsClient";
import { REWARDED_AD_UNIT_ID } from "./constants/adConfig";
import { getExploreLeft, grantExploreFind } from "./utils/explore";
import { getActiveCompanion } from "./utils/companions";
import { syncRooms } from "./utils/rooms";
import { buildRoomShareMessage, shareRoomPicture } from "./utils/roomShare";
import { resolveTheme } from "./utils/plus";
import { buildCompletionsCsv, buildTasksCsv } from "./utils/historyCsv";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import CompanionRevealModal from "./components/CompanionRevealModal";
import { reachedStreakMilestone } from "./utils/streakMilestones";
import TutorialOverlay, { TutorialStep } from "./components/TutorialOverlay";
import { getAppCopy } from "./constants/appCopy";
import { getAppTheme } from "./constants/appTheme";
import DashboardScreen from "./screens/DashboardScreen";
import CompanionsScreen from "./screens/CompanionsScreen";
import JourneyScreen from "./screens/JourneyScreen";
import TaskCalendarScreen from "./screens/TaskCalendarScreen";
import TasksScreen from "./screens/TasksScreen";
import { gameStateService } from "./services/gameStateService";
import {
  AppLanguage,
  AppThemeId,
  CustomTaskTemplate,
  GameState,
  Task,
  TaskType,
  TaskStatus,
  TimerAlertMode,
  Room,
} from "./types";
import { upsertCustomTaskTemplate } from "./utils/customTaskTemplates";
import {
  adoptStarter,
  applyTaskCreated,
  applyTaskDeleted,
  applyTaskUpdated,
  completeTask,
  equipPet,
} from "./utils/gameplay";
import {
  buyDecoration,
  getRoadPosition,
  placeDecoration,
  removeDecoration,
} from "./utils/journey";
import { ambienceFor } from "./utils/ambience";
import { playGrowraCue, setGrowraAmbience } from "./utils/growraAudio";
import { createInitialGameState, createSaveData } from "./utils/initialState";

import { syncRecurringTasks } from "./utils/taskSchedule";
import {
  finishTaskTimer,
  pauseTaskTimer,
  resetTaskTimer,
  startTaskTimer,
} from "./utils/taskTimer";
import {
  pickTimerAlertSound,
  playTimerAlert,
  removeStoredTimerAlertSound,
} from "./utils/timerAlert";

const plusService = createPlusService(expoIapClient);
const adsService = createAdsService(googleAdsClient, REWARDED_AD_UNIT_ID);

type Screen = "dashboard" | "tasks" | "task-calendar" | "journey" | "companions";

interface TaskTutorialUiState {
  modalVisible: boolean;
  taskType: TaskType;
  selectedPredefinedTaskId: string;
}

const TUTORIAL_FIRST_TASK_REWARD = 100;

function applyTutorialReward(gameState: GameState): GameState {
  if (gameState.tutorialCompleted) {
    return gameState;
  }

  if (gameState.tutorialRewardGranted) {
    return gameState;
  }

  const hasCompletedTask = gameState.tasks.some(
    (task) => task.status === TaskStatus.COMPLETED,
  );

  if (!hasCompletedTask) {
    return gameState;
  }

  return {
    ...gameState,
    coins: gameState.coins + TUTORIAL_FIRST_TASK_REWARD,
    tutorialRewardGranted: true,
  };
}

function getTutorialStep(
  gameState: GameState,
  activeScreen: Screen,
  taskTutorialUiState: TaskTutorialUiState,
): TutorialStep {
  if (gameState.tutorialCompleted) {
    return "done";
  }

  const hasTask = gameState.tasks.length > 0;
  const hasCompletedTask = gameState.tasks.some(
    (task) => task.status === TaskStatus.COMPLETED,
  );
  const hasPet = gameState.pets.length > 0;
  const hasEquippedPet = gameState.equippedPetId !== "";

  if (!hasTask) {
    if (activeScreen !== "tasks") {
      return "open-tasks";
    }

    if (!taskTutorialUiState.modalVisible) {
      return "tap-add-task";
    }

    if (taskTutorialUiState.taskType !== TaskType.PREDEFINED) {
      return "choose-predefined-task";
    }

    if (taskTutorialUiState.selectedPredefinedTaskId !== "drink-water") {
      return "choose-water-task";
    }

    return "confirm-task-add";
  }

  if (!hasCompletedTask) {
    return activeScreen === "tasks" ? "complete-task" : "open-tasks";
  }

  if (!hasPet || !hasEquippedPet) {
    return activeScreen === "companions" ? "choose-companion" : "open-realm";
  }

  return "done";
}

function shouldCompleteTutorial(gameState: GameState): boolean {
  if (gameState.tutorialCompleted) {
    return false;
  }

  const hasCompletedTask = gameState.tasks.some(
    (task) => task.status === TaskStatus.COMPLETED,
  );

  return hasCompletedTask && gameState.pets.length > 0 && gameState.equippedPetId !== "";
}

type CompanionAudioCue = "companion-greeting" | "companion-evolved" | "focus-find";

function companionAudioCueFor(events: GameState["companionEvents"]): CompanionAudioCue | null {
  if (events.some((event) => event.kind === "evolved")) return "companion-evolved";
  if (events.some((event) => event.kind === "found")) return "focus-find";
  if (events.some((event) => event.kind === "joined")) return "companion-greeting";
  return null;
}

function newCompanionAudioCue(before: GameState, after: GameState): CompanionAudioCue | null {
  return companionAudioCueFor(after.companionEvents.slice(before.companionEvents.length));
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>("dashboard");
  const [gameState, setGameState] = useState<GameState | null>(null);
  // Latest state for event handlers. Reading `gameState` from the render closure lets two
  // quick taps both act on the same old state (e.g. completing one task twice).
  const gameStateRef = useRef<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [taskTutorialUiState, setTaskTutorialUiState] = useState<TaskTutorialUiState>({
    modalVisible: false,
    taskType: TaskType.CUSTOM,
    selectedPredefinedTaskId: "",
  });
  const tutorialStep = gameState
    ? getTutorialStep(gameState, activeScreen, taskTutorialUiState)
    : "done";
  const [plusVisible, setPlusVisible] = useState(false);
  const [exploreBusy, setExploreBusy] = useState(false);
  const [roomEditorId, setRoomEditorId] = useState<string | null>(null);
  const [appActive, setAppActive] = useState(true);
  const [adConsentAvailable, setAdConsentAvailable] = useState(false);

  const playUiTap = () => {
    void playGrowraCue("ui-tap", gameStateRef.current?.settings.sfxEnabled ?? false);
  };
  const handleNavigate = (screen: Screen) => {
    if (screen === activeScreen) return;
    setActiveScreen(screen);
    playUiTap();
  };

  useEffect(() => {
    if (settingsVisible) void adsService.canChangeConsent().then(setAdConsentAvailable);
  }, [settingsVisible]);

  const openPlus = () => {
    setPlusVisible(true);
    playUiTap();
    void plus.refreshPrice();
  };
  const plus = usePlusController(plusService, (owned) => {
    const current = gameStateRef.current;
    if (!current || current.plus.owned === owned) return;
    void persistGameState(applyPlusOwnership(current, owned, Date.now()));
  });

  useEffect(() => {
    loadGame();
  }, []);

  // The ambience follows the screen (home / journey / room editor) and pauses while the app is inactive.
  useEffect(() => {
    const musicEnabled = appActive && (gameState?.settings.musicEnabled ?? false);
    void setGrowraAmbience(ambienceFor(activeScreen, roomEditorId !== null, musicEnabled));
  }, [appActive, activeScreen, roomEditorId, gameState?.settings.musicEnabled]);

  useEffect(() => () => void setGrowraAmbience(null), []);

  useEffect(() => {
    if (!gameState) {
      return;
    }

    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        setAppActive(nextAppState === "active");
        if (nextAppState !== "active") {
          return;
        }

        const currentGameState = gameStateRef.current ?? gameState;
        const syncedGameState = syncRecurringTasks(currentGameState);

        if (syncedGameState !== currentGameState) {
          await persistGameState(syncedGameState);
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [gameState]);

  const loadGame = async () => {
    const loadResult = await gameStateService.loadGame();

    let resolvedGameState: GameState;

    if (loadResult.status === "loaded") {
      const syncedGameState = syncRooms(
        applyTutorialReward(syncRecurringTasks(loadResult.saveData.gameState)),
      );
      const resolvedTutorialState = shouldCompleteTutorial(syncedGameState)
        ? { ...syncedGameState, tutorialCompleted: true }
        : syncedGameState;
      await gameStateService.saveGame(createSaveData(resolvedTutorialState));
      resolvedGameState = resolvedTutorialState;
    } else {
      if (loadResult.status === "corrupt") {
        Alert.alert(
          "Save could not be loaded",
          "Your previous progress couldn't be read, so a new game was started. " +
            "A copy of the old save was kept on this device and can still be recovered.",
        );
      }
      const newGameState = createInitialGameState();
      await gameStateService.saveGame(createSaveData(newGameState));
      resolvedGameState = newGameState;
    }

    if (resolvedGameState.notices.length > 0) {
      const copy = getAppCopy(resolvedGameState.settings.language);
      resolvedGameState.notices.forEach((notice) => {
        const [title, body] =
          notice.kind === "companions-migrated"
            ? [copy.companionsMigratedTitle, copy.companionsMigratedBody]
            : [copy.journeyMigratedTitle, copy.journeyMigratedBody];
        Alert.alert(title, body.replace("{coins}", String(notice.coins)));
      });
      resolvedGameState = { ...resolvedGameState, notices: [] };
      await gameStateService.saveGame(createSaveData(resolvedGameState));
    }

    gameStateRef.current = resolvedGameState;
    setGameState(resolvedGameState);
    if (!resolvedGameState.tutorialCompleted) {
      setTutorialVisible(true);
    }

    setLoading(false);
  };

  const persistGameState = async (nextGameState: GameState) => {
    const syncedGameState = syncRooms(applyTutorialReward(syncRecurringTasks(nextGameState)));
    const resolvedTutorialState = shouldCompleteTutorial(syncedGameState)
      ? { ...syncedGameState, tutorialCompleted: true }
      : syncedGameState;
    gameStateRef.current = resolvedTutorialState;
    setGameState(resolvedTutorialState);
    await gameStateService.saveGame(createSaveData(resolvedTutorialState));
    if (resolvedTutorialState.tutorialCompleted && !syncedGameState.tutorialCompleted) {
      setTutorialVisible(false);
    }
  };

  const handleAddTask = async (
    task: Task,
    customTemplate?: CustomTaskTemplate,
  ) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    const updated = applyTaskCreated(
      {
        ...gameState,
        tasks: [...gameState.tasks, task],
        customTaskTemplates: customTemplate
          ? upsertCustomTaskTemplate(
              gameState.customTaskTemplates,
              customTemplate,
            )
          : gameState.customTaskTemplates,
        lastPlayedAt: Date.now(),
      },
      task,
    );
    const companionCue = newCompanionAudioCue(gameState, updated);
    await persistGameState(updated);
    void playGrowraCue(companionCue ?? "task-added", gameState.settings.sfxEnabled);
  };

  const handleCompleteTask = async (taskId: string) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    const updated = completeTask(gameState, taskId);
    if (updated === gameState) return;
    const companionCue = newCompanionAudioCue(gameState, updated);
    const tilesBefore = getRoadPosition(gameState.days).tiles;
    const tilesAfter = getRoadPosition(updated.days).tiles;
    const tileAdvanced = tilesAfter > tilesBefore;
    const playerLeveledUp = updated.level > gameState.level;
    await persistGameState(updated);
    const cue = companionCue ?? (
      tileAdvanced && tilesAfter % 28 === 0
        ? "region-unlock"
        : playerLeveledUp
          ? "player-level-up"
          : reachedStreakMilestone(gameState.streak.level, updated.streak.level)
            ? "streak-milestone"
          : tileAdvanced && tilesAfter % 7 === 0
            ? "camp-milestone"
            : tileAdvanced
              ? "journey-tile"
              : "task-complete"
    );
    void playGrowraCue(cue, gameState.settings.sfxEnabled);
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    const previousTask = gameState.tasks.find((task) => task.id === updatedTask.id);
    const updatedState = {
      ...gameState,
      tasks: gameState.tasks.map((task) =>
        task.id === updatedTask.id ? updatedTask : task,
      ),
      lastPlayedAt: Date.now(),
    };
    const nextState = previousTask
      ? applyTaskUpdated(updatedState, previousTask, updatedTask)
      : updatedState;
    const companionCue = newCompanionAudioCue(gameState, nextState);
    await persistGameState(nextState);
    if (previousTask) {
      void playGrowraCue(companionCue ?? "task-saved", gameState.settings.sfxEnabled);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    const deletedTask = gameState.tasks.find((task) => task.id === taskId);
    const remainingState = {
      ...gameState,
      tasks: gameState.tasks.filter((task) => task.id !== taskId),
      lastPlayedAt: Date.now(),
    };
    const nextState = deletedTask
      ? applyTaskDeleted(remainingState, deletedTask)
      : remainingState;
    const companionCue = newCompanionAudioCue(gameState, nextState);
    await persistGameState(nextState);
    if (deletedTask) {
      void playGrowraCue(companionCue ?? "task-removed", gameState.settings.sfxEnabled);
    }
  };

  const applyTimerUpdate = async (
    taskId: string,
    updater: (task: Task) => Task,
  ) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await persistGameState({
      ...gameState,
      tasks: gameState.tasks.map((task) =>
        task.id === taskId ? updater(task) : task,
      ),
      lastPlayedAt: Date.now(),
    });
  };

  const handleStartTimer = async (taskId: string) => {
    await applyTimerUpdate(taskId, startTaskTimer);
    void playGrowraCue("timer-start", gameStateRef.current?.settings.sfxEnabled ?? false);
  };

  const handlePauseTimer = async (taskId: string) => {
    await applyTimerUpdate(taskId, pauseTaskTimer);
    void playGrowraCue("timer-pause", gameStateRef.current?.settings.sfxEnabled ?? false);
  };

  const handleResetTimer = async (taskId: string) => {
    await applyTimerUpdate(taskId, resetTaskTimer);
    void playGrowraCue("timer-reset", gameStateRef.current?.settings.sfxEnabled ?? false);
  };

  const handleTimerReady = async (taskId: string) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await applyTimerUpdate(taskId, finishTaskTimer);
    await playTimerAlert(gameState.settings.timerAlert);
  };

  const handleEquipPet = async (petId: string) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await persistGameState(equipPet(gameState, petId));
    void playGrowraCue("companion-switched", gameState.settings.sfxEnabled);
  };

  const handleChooseStarter = async (templateId: string) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await persistGameState(adoptStarter(gameState, templateId));
    void playGrowraCue("companion-greeting", gameState.settings.sfxEnabled);
  };

  const handleCloseCompanionReveal = async () => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await persistGameState({ ...gameState, companionEvents: [] });
    playUiTap();
  };

  const handleBuyDecoration = async (typeId: string) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    const updated = buyDecoration(gameState, typeId);
    await persistGameState(updated);
    if (updated !== gameState) void playGrowraCue("bought-with-coins", gameState.settings.sfxEnabled);
  };

  const handlePlaceDecoration = async (
    decorationId: string,
    camp: number,
    spot: number,
  ) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    const updated = placeDecoration(gameState, decorationId, camp, spot);
    await persistGameState(updated);
    if (updated !== gameState) void playGrowraCue("decoration-placed", gameState.settings.sfxEnabled);
  };

  const handleRemoveDecoration = async (decorationId: string) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    const updated = removeDecoration(gameState, decorationId);
    await persistGameState(updated);
    if (updated !== gameState) void playGrowraCue("ui-tap", gameState.settings.sfxEnabled);
  };

  const handleLanguageChange = async (language: AppLanguage) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await persistGameState({
      ...gameState,
      settings: {
        ...gameState.settings,
        language,
      },
    });
    void playGrowraCue("ui-tap", gameState.settings.sfxEnabled);
  };

  const handleThemeChange = async (theme: AppThemeId) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await persistGameState({
      ...gameState,
      settings: {
        ...gameState.settings,
        theme,
      },
    });
    void playGrowraCue("theme-changed", gameState.settings.sfxEnabled);
  };

  const handleAudioPreferenceChange = async (
    key: "musicEnabled" | "sfxEnabled",
    enabled: boolean,
  ) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;
    await persistGameState({
      ...gameState,
      settings: { ...gameState.settings, [key]: enabled },
    });
    const tapEnabled = key === "sfxEnabled"
      ? enabled || gameState.settings.sfxEnabled
      : gameState.settings.sfxEnabled;
    void playGrowraCue("ui-tap", tapEnabled);
  };

  const handleTimerAlertModeChange = async (mode: TimerAlertMode) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await persistGameState({
      ...gameState,
      settings: {
        ...gameState.settings,
        timerAlert: {
          ...gameState.settings.timerAlert,
          mode,
        },
      },
    });
    void playGrowraCue("ui-tap", gameState.settings.sfxEnabled);
  };

  const handlePickTimerAlertSound = async () => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    const pickedSound = await pickTimerAlertSound(
      gameState.settings.timerAlert.soundUri,
    );

    if (!pickedSound) {
      return;
    }

    await persistGameState({
      ...gameState,
      settings: {
        ...gameState.settings,
        timerAlert: {
          mode: "sound",
          soundName: pickedSound.soundName,
          soundUri: pickedSound.soundUri,
        },
      },
    });
    void playGrowraCue("ui-tap", gameState.settings.sfxEnabled);
  };

  const handleClearTimerAlertSound = async () => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await removeStoredTimerAlertSound(gameState.settings.timerAlert.soundUri);

    await persistGameState({
      ...gameState,
      settings: {
        ...gameState.settings,
        timerAlert: {
          ...gameState.settings.timerAlert,
          mode: "vibration",
          soundName: "",
          soundUri: "",
        },
      },
    });
    void playGrowraCue("ui-tap", gameState.settings.sfxEnabled);
  };

  const handleExplore = async () => {
    const before = gameStateRef.current;
    if (!before || exploreBusy || getExploreLeft(before.explore, Date.now()) === 0) return;
    const copy = getAppCopy(before.settings.language);
    setExploreBusy(true);
    try {
      if (!before.plus.owned) {
        const result = await adsService.watchForReward();
        if (result !== "earned") {
          if (result === "unavailable") Alert.alert(copy.plusTitle, copy.exploreNoAd);
          return;
        }
      }
      const current = gameStateRef.current ?? before;
      const { state, find } = grantExploreFind(current, Date.now(), Math.random());
      if (!find) return;
      await persistGameState(state);
      // "Sent off" first, then the find reveal once it has played (no overlap).
      void playGrowraCue("explore-sent", current.settings.sfxEnabled);
      setTimeout(() => void playGrowraCue("focus-find", current.settings.sfxEnabled), 900);
      const companion = getActiveCompanion(state);
      Alert.alert(
        "🧭",
        copy.exploreFound
          .replace("{name}", companion?.name ?? "Growra")
          .replace("{find}", copy.decorationNames[find.id] ?? find.id),
      );
    } finally {
      setExploreBusy(false);
    }
  };

  const handleShareRoom = async (view: View, room: Room) => {
    const current = gameStateRef.current;
    if (!current) return;
    const copy = getAppCopy(current.settings.language);
    const owner = current.pets.find((pet) => pet.id === room.ownerPetId);
    try {
      await shareRoomPicture(view, buildRoomShareMessage(copy, owner?.name ?? null));
      void playGrowraCue("room-picture-shared", current.settings.sfxEnabled);
    } catch {
      Alert.alert("🏠", copy.roomShareError);
    }
  };

  const handleBuyPlus = async () => {
    const copy = getAppCopy(gameStateRef.current?.settings.language ?? "en");
    const result = await plus.buy();
    if (result === "purchased") {
      void playGrowraCue("plus-unlocked", gameStateRef.current?.settings.sfxEnabled ?? false);
      Alert.alert(copy.plusTitle, copy.plusThanks);
    }
    if (result === "pending") Alert.alert(copy.plusTitle, copy.plusPending);
    if (result === "error") Alert.alert(copy.plusTitle, copy.plusError);
    if (result === "unavailable") Alert.alert(copy.plusTitle, copy.plusUnavailable);
  };

  const handleRestorePlus = async () => {
    const copy = getAppCopy(gameStateRef.current?.settings.language ?? "en");
    const result = await plus.restore();
    if (result === "owned") void playGrowraCue("plus-unlocked", gameStateRef.current?.settings.sfxEnabled ?? false);
    Alert.alert(
      copy.plusTitle,
      result === "owned" ? copy.plusRestored : result === "not-owned" ? copy.plusNotFound : copy.plusUnavailable,
    );
  };

  const handleExportCsv = async () => {
    const current = gameStateRef.current;
    if (!current?.plus.owned) return;
    const tasksFile = new File(Paths.cache, "growra-tasks.csv");
    const completionsFile = new File(Paths.cache, "growra-completions.csv");
    tasksFile.write(buildTasksCsv(current.tasks));
    completionsFile.write(buildCompletionsCsv(current.days));
    await Sharing.shareAsync(tasksFile.uri, { mimeType: "text/csv", dialogTitle: "growra-tasks.csv" });
    await Sharing.shareAsync(completionsFile.uri, { mimeType: "text/csv", dialogTitle: "growra-completions.csv" });
  };

  const handleExportData = async (): Promise<string> => {
    if (!gameState) {
      return "";
    }

    return gameStateService.exportSaveCode(createSaveData(gameState));
  };

  const handleImportData = async (backupCode: string) => {
    const importedSaveData = gameStateService.importSaveCode(backupCode);
    const current = gameStateRef.current;
    // Plus ownership belongs to this device's Play account, never to a backup code.
    await persistGameState(current ? keepPlusOnImport(importedSaveData.gameState, current) : importedSaveData.gameState);
    playUiTap();
    void plus.restore();
  };

  if (loading || !gameState) {
    return <View className="flex-1" style={styles.container} />;
  }

  const isPlus = gameState.plus.owned;
  const appTheme = getAppTheme(resolveTheme(gameState.settings.theme, isPlus));

  const renderScreen = () => {
    switch (activeScreen) {
      case "dashboard":
        return (
          <DashboardScreen
            gameState={gameState}
            tutorialLocked={tutorialStep !== "done"}
            onAddTask={handleAddTask}
            onCompleteTask={handleCompleteTask}
            onOpenSettings={() => {
              setSettingsVisible(true);
              playUiTap();
            }}
            onUiTap={playUiTap}
            onStartTimer={handleStartTimer}
            onPauseTimer={handlePauseTimer}
            onResetTimer={handleResetTimer}
            onTimerReady={handleTimerReady}
          />
        );
      case "tasks":
        return (
          <TasksScreen
            settings={gameState.settings}
            tasks={gameState.tasks}
            customTaskTemplates={gameState.customTaskTemplates}
            tutorialTarget={
              tutorialStep === "tap-add-task"
                ? "add-button"
                : tutorialStep === "choose-predefined-task"
                  ? "modal-type-predefined"
                  : tutorialStep === "choose-water-task"
                    ? "modal-task-drink-water"
                    : tutorialStep === "confirm-task-add"
                      ? "modal-submit"
                      : tutorialStep === "complete-task"
                        ? "task-complete"
                        : null
            }
            onTutorialStateChange={setTaskTutorialUiState}
            onAddTask={handleAddTask}
            onCompleteTask={handleCompleteTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onOpenCalendar={() => handleNavigate("task-calendar")}
            onUiTap={playUiTap}
            onStartTimer={handleStartTimer}
            onPauseTimer={handlePauseTimer}
            onResetTimer={handleResetTimer}
            onTimerReady={handleTimerReady}
          />
        );
      case "task-calendar":
        return (
          <TaskCalendarScreen
            settings={gameState.settings}
            tasks={gameState.tasks}
            onBack={() => handleNavigate("tasks")}
          />
        );
      case "journey":
        return (
          <JourneyScreen
            gameState={gameState}
            settings={gameState.settings}
            onBuyDecoration={handleBuyDecoration}
            onPlaceDecoration={handlePlaceDecoration}
            onRemoveDecoration={handleRemoveDecoration}
            isPlus={isPlus}
            exploreBusy={exploreBusy}
            onExplore={handleExplore}
            onOpenPlus={openPlus}
            onUiTap={playUiTap}
          />
        );
      case "companions":
        return (
          <CompanionsScreen
            gameState={gameState}
            settings={gameState.settings}
            tutorialMode={tutorialStep === "choose-companion" ? "choose" : null}
            onChooseStarter={handleChooseStarter}
            onEquipPet={handleEquipPet}
            onUiTap={playUiTap}
            isPlus={isPlus}
            exploreBusy={exploreBusy}
            onExplore={handleExplore}
            onOpenRoom={(roomId) => {
              setRoomEditorId(roomId);
              playUiTap();
            }}
            onOpenPlus={openPlus}
          />
        );
    }
  };

  return (
    <SafeAreaProvider>
      <View
        className="flex-1"
        style={[styles.container, { backgroundColor: appTheme.background }]}
      >
        {renderScreen()}
        <BottomNavigation
          activeScreen={
            activeScreen === "task-calendar" ? "tasks" : activeScreen
          }
          onNavigate={handleNavigate}
          settings={gameState.settings}
          tutorialTarget={
            tutorialStep === "open-tasks" ||
            tutorialStep === "tap-add-task" ||
            tutorialStep === "choose-predefined-task" ||
            tutorialStep === "choose-water-task" ||
            tutorialStep === "confirm-task-add" ||
            tutorialStep === "complete-task"
              ? "tasks"
              : tutorialStep === "open-realm" ||
                  tutorialStep === "choose-companion"
                ? "companions"
                : null
          }
        />
        <SettingsModal
          visible={settingsVisible}
          gameState={gameState}
          onClose={() => {
            setSettingsVisible(false);
            playUiTap();
          }}
          onLanguageChange={handleLanguageChange}
          onThemeChange={handleThemeChange}
          onAudioPreferenceChange={handleAudioPreferenceChange}
          onTimerAlertModeChange={handleTimerAlertModeChange}
          onPickTimerAlertSound={handlePickTimerAlertSound}
          onClearTimerAlertSound={handleClearTimerAlertSound}
          onExportData={handleExportData}
          onImportData={handleImportData}
          isPlus={isPlus}
          onOpenPlus={openPlus}
          onExportCsv={handleExportCsv}
          adConsentAvailable={adConsentAvailable}
          onAdConsent={() => void adsService.changeConsent()}
        />
        {roomEditorId && (
          <RoomEditorScreen
            state={gameState}
            roomId={roomEditorId}
            onChange={(update) => {
              const current = gameStateRef.current;
              if (current) void persistGameState(update(current));
            }}
            onClose={() => {
              setRoomEditorId(null);
              playUiTap();
            }}
            onOpenPlus={openPlus}
            onShare={handleShareRoom}
            onCoinPurchase={() => void playGrowraCue("bought-with-coins", gameStateRef.current?.settings.sfxEnabled ?? false)}
            onUiTap={playUiTap}
          />
        )}
        <GrowraPlusModal
          visible={plusVisible}
          settings={gameState.settings}
          isPlus={isPlus}
          price={plus.price}
          busy={plus.busy}
          onBuy={handleBuyPlus}
          onRestore={handleRestorePlus}
          onClose={() => {
            setPlusVisible(false);
            playUiTap();
          }}
        />
        <TutorialOverlay
          visible={tutorialVisible && tutorialStep !== "done"}
          step={tutorialStep}
          settings={gameState.settings}
        />
        <CompanionRevealModal
          visible={gameState.companionEvents.length > 0}
          settings={gameState.settings}
          events={gameState.companionEvents}
          pets={gameState.pets}
          onClose={handleCloseCompanionReveal}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

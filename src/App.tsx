import React, { useEffect, useRef, useState } from "react";
import { Alert, AppState, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import BottomNavigation from "./components/BottomNavigation";
import BattleRewardModal from "./components/BattleRewardModal";
import SettingsModal from "./components/SettingsModal";
import CompanionRevealModal from "./components/CompanionRevealModal";
import TutorialOverlay, { TutorialStep } from "./components/TutorialOverlay";
import { getAppCopy } from "./constants/appCopy";
import { getAppTheme } from "./constants/appTheme";
import DashboardScreen from "./screens/DashboardScreen";
import PetsScreen from "./screens/PetsScreen";
import TaskCalendarScreen from "./screens/TaskCalendarScreen";
import TasksScreen from "./screens/TasksScreen";
import { gameStateService } from "./services/gameStateService";
import {
  AppLanguage,
  AppThemeId,
  CustomTaskTemplate,
  BattleConsumableItem,
  GearItem,
  GameState,
  Task,
  TaskType,
  TaskStatus,
  TimerAlertMode,
} from "./types";
import { upsertCustomTaskTemplate } from "./utils/customTaskTemplates";
import {
  adoptStarter,
  applyTaskCreated,
  applyTaskDeleted,
  applyTaskUpdated,
  completeTask,
  equipPet,
  equipGearToPet,
  exploreExpeditionNode,
  sendPetOnExpedition,
  resolveExpeditionProgress,
  resolveExpeditionBattle,
  previewExpeditionBattleOutcome,
} from "./utils/gameplay";
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

type Screen = "dashboard" | "tasks" | "task-calendar" | "realm";

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
    return activeScreen === "realm" ? "choose-companion" : "open-realm";
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
  const [battleRewardVisible, setBattleRewardVisible] = useState(false);
  const [battleRewardOutcome, setBattleRewardOutcome] =
    useState<ReturnType<typeof previewExpeditionBattleOutcome> | null>(null);
  const [battleRewardPetId, setBattleRewardPetId] = useState("");
  const [battleRewardGearItems, setBattleRewardGearItems] = useState<GearItem[]>(
    [],
  );
  const [battleRewardConsumables, setBattleRewardConsumables] = useState<
    BattleConsumableItem[]
  >([]);
  const tutorialStep = gameState
    ? getTutorialStep(gameState, activeScreen, taskTutorialUiState)
    : "done";
  const expeditionEndsAt = gameState
    ? gameState.expeditionProgress.activeNodeId !== ""
      ? gameState.expeditionProgress.activeNodeEndsAt
      : gameState.expeditionProgress.activeZoneEndsAt
    : 0;
  const expeditionZoneIndex = gameState
    ? gameState.expeditionProgress.activeZoneIndex
    : -1;

  useEffect(() => {
    loadGame();
  }, []);

  useEffect(() => {
    if (!gameState) {
      return;
    }

    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (nextAppState !== "active") {
          return;
        }

        const syncedGameState = resolveExpeditionProgress(
          syncRecurringTasks(gameState),
        );

        if (syncedGameState !== gameState) {
          await persistGameState(syncedGameState);
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [gameState]);

  useEffect(() => {
    if (!gameState) {
      return;
    }

    const activeEndsAt =
      gameState.expeditionProgress.activeNodeId !== ""
        ? gameState.expeditionProgress.activeNodeEndsAt
        : gameState.expeditionProgress.activeZoneEndsAt;

    if (activeEndsAt <= 0) {
      return;
    }

    const remainingMs = activeEndsAt - Date.now();

    if (remainingMs <= 0) {
      void persistGameState(gameState);
      return;
    }

    const timeoutId = setTimeout(() => {
      void persistGameState(gameState);
    }, remainingMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [gameState, expeditionEndsAt, expeditionZoneIndex]);

  const loadGame = async () => {
    const loadResult = await gameStateService.loadGame();

    let resolvedGameState: GameState;

    if (loadResult.status === "loaded") {
      const syncedGameState = applyTutorialReward(
        resolveExpeditionProgress(syncRecurringTasks(loadResult.saveData.gameState)),
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

    const migrationNotice = resolvedGameState.notices.find(
      (notice) => notice.kind === "companions-migrated",
    );
    if (migrationNotice) {
      const copy = getAppCopy(resolvedGameState.settings.language);
      Alert.alert(
        copy.companionsMigratedTitle,
        copy.companionsMigratedBody.replace("{coins}", String(migrationNotice.coins)),
      );
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
    const syncedGameState = applyTutorialReward(
      resolveExpeditionProgress(syncRecurringTasks(nextGameState)),
    );
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

    await persistGameState(
      applyTaskCreated(
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
      ),
    );
  };

  const handleCompleteTask = async (taskId: string) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await persistGameState(completeTask(gameState, taskId));
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
    await persistGameState(
      previousTask ? applyTaskUpdated(updatedState, previousTask, updatedTask) : updatedState,
    );
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
    await persistGameState(
      deletedTask ? applyTaskDeleted(remainingState, deletedTask) : remainingState,
    );
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
  };

  const handlePauseTimer = async (taskId: string) => {
    await applyTimerUpdate(taskId, pauseTaskTimer);
  };

  const handleResetTimer = async (taskId: string) => {
    await applyTimerUpdate(taskId, resetTaskTimer);
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
  };

  const handleChooseStarter = async (templateId: string) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await persistGameState(adoptStarter(gameState, templateId));
  };

  const handleCloseCompanionReveal = async () => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await persistGameState({ ...gameState, companionEvents: [] });
  };

  const handleFightZone = async (
    zoneIndex: number,
    petId: string,
    battleConsumableIds: string[],
  ) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    const outcome = previewExpeditionBattleOutcome(
      gameState,
      zoneIndex,
      petId,
      battleConsumableIds,
    );
    const nextGameState = resolveExpeditionBattle(
      gameState,
      zoneIndex,
      petId,
      battleConsumableIds,
    );

    const nextGearItems = nextGameState.gearItems.filter(
      (gearItem) =>
        gameState.gearItems.filter((currentGear) => currentGear.id === gearItem.id)
          .length === 0,
    );
    const nextBattleConsumables = nextGameState.battleConsumables.filter(
      (item) =>
        gameState.battleConsumables.filter((currentItem) => currentItem.id === item.id)
          .length === 0,
    );

    await persistGameState(nextGameState);
    setBattleRewardOutcome(outcome);
    setBattleRewardPetId(petId);
    setBattleRewardGearItems(nextGearItems);
    setBattleRewardConsumables(nextBattleConsumables);
    setBattleRewardVisible(true);
  };

  const handleExploreNode = async (nodeId: string, petId: string) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await persistGameState(exploreExpeditionNode(gameState, nodeId, petId));
  };

  const handleEquipGear = async (gearItemId: string, petId: string) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await persistGameState(equipGearToPet(gameState, gearItemId, petId));
  };

  const handleSendPetOnExpedition = async (petId: string) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await persistGameState(sendPetOnExpedition(gameState, petId));
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
  };

  const handleCloseBattleReward = () => {
    setBattleRewardVisible(false);
    setBattleRewardOutcome(null);
    setBattleRewardPetId("");
    setBattleRewardGearItems([]);
    setBattleRewardConsumables([]);
  };

  const battleRewardPet =
    battleRewardPetId !== ""
      ? gameState
        ? gameState.pets.filter((pet) => pet.id === battleRewardPetId)[0]
        : null
      : null;

  const handleExportData = async (): Promise<string> => {
    if (!gameState) {
      return "";
    }

    return gameStateService.exportSaveCode(createSaveData(gameState));
  };

  const handleImportData = async (backupCode: string) => {
    const importedSaveData = gameStateService.importSaveCode(backupCode);
    await persistGameState(importedSaveData.gameState);
  };

  if (loading || !gameState) {
    return <View className="flex-1" style={styles.container} />;
  }

  const appTheme = getAppTheme(gameState.settings.theme);

  const renderScreen = () => {
    switch (activeScreen) {
      case "dashboard":
        return (
          <DashboardScreen
            gameState={gameState}
            tutorialLocked={tutorialStep !== "done"}
            onAddTask={handleAddTask}
            onCompleteTask={handleCompleteTask}
            onOpenSettings={() => setSettingsVisible(true)}
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
            onOpenCalendar={() => setActiveScreen("task-calendar")}
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
            onBack={() => setActiveScreen("tasks")}
          />
        );
      case "realm":
        return (
          <PetsScreen
            gameState={gameState}
            settings={gameState.settings}
            tutorialMode={tutorialStep === "choose-companion" ? "choose" : null}
            onChooseStarter={handleChooseStarter}
            onEquipPet={handleEquipPet}
            onFightZone={handleFightZone}
            onExploreNode={handleExploreNode}
            onEquipGear={handleEquipGear}
            onSendPetOnExpedition={handleSendPetOnExpedition}
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
          onNavigate={setActiveScreen}
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
                ? "realm"
                : null
          }
        />
        <SettingsModal
          visible={settingsVisible}
          gameState={gameState}
          onClose={() => setSettingsVisible(false)}
          onLanguageChange={handleLanguageChange}
          onThemeChange={handleThemeChange}
          onTimerAlertModeChange={handleTimerAlertModeChange}
          onPickTimerAlertSound={handlePickTimerAlertSound}
          onClearTimerAlertSound={handleClearTimerAlertSound}
          onExportData={handleExportData}
          onImportData={handleImportData}
        />
        <TutorialOverlay
          visible={tutorialVisible && tutorialStep !== "done"}
          step={tutorialStep}
          settings={gameState.settings}
        />
        <BattleRewardModal
          visible={battleRewardVisible}
          settings={gameState.settings}
          outcome={battleRewardOutcome}
          battlePet={battleRewardPet}
          gearItems={battleRewardGearItems}
          battleConsumables={battleRewardConsumables}
          onClose={handleCloseBattleReward}
          onEquipGear={handleEquipGear}
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

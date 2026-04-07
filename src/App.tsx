import React, { useEffect, useState } from "react";
import { AppState, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import BottomNavigation from "./components/BottomNavigation";
import SettingsModal from "./components/SettingsModal";
import TutorialOverlay from "./components/TutorialOverlay";
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
  GameState,
  Task,
  TimerAlertMode,
} from "./types";
import { upsertCustomTaskTemplate } from "./utils/customTaskTemplates";
import {
  completeTask,
  equipPet,
  fusePet,
  multiSummonPet,
  redeemPityPet,
  sellPet,
  summonPet,
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

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>("dashboard");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [tutorialVisible, setTutorialVisible] = useState(false);

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

        const syncedGameState = syncRecurringTasks(gameState);

        if (syncedGameState !== gameState) {
          await persistGameState(syncedGameState);
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [gameState]);

  const loadGame = async () => {
    const saveData = await gameStateService.loadGame();

    let resolvedGameState: GameState;

    if (saveData) {
      const syncedGameState = syncRecurringTasks(saveData.gameState);
      await gameStateService.saveGame(createSaveData(syncedGameState));
      resolvedGameState = syncedGameState;
    } else {
      const newGameState = createInitialGameState();
      await gameStateService.saveGame(createSaveData(newGameState));
      resolvedGameState = newGameState;
    }

    setGameState(resolvedGameState);
    if (!resolvedGameState.tutorialCompleted) {
      setTutorialVisible(true);
    }

    setLoading(false);
  };

  const persistGameState = async (nextGameState: GameState) => {
    const syncedGameState = syncRecurringTasks(nextGameState);
    setGameState(syncedGameState);
    await gameStateService.saveGame(createSaveData(syncedGameState));
  };

  const handleAddTask = async (
    task: Task,
    customTemplate?: CustomTaskTemplate,
  ) => {
    if (!gameState) return;

    await persistGameState({
      ...gameState,
      tasks: [...gameState.tasks, task],
      customTaskTemplates: customTemplate
        ? upsertCustomTaskTemplate(
            gameState.customTaskTemplates,
            customTemplate,
          )
        : gameState.customTaskTemplates,
      lastPlayedAt: Date.now(),
    });
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!gameState) return;

    await persistGameState(completeTask(gameState, taskId));
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    if (!gameState) return;

    await persistGameState({
      ...gameState,
      tasks: gameState.tasks.map((task) =>
        task.id === updatedTask.id ? updatedTask : task,
      ),
      lastPlayedAt: Date.now(),
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!gameState) return;

    await persistGameState({
      ...gameState,
      tasks: gameState.tasks.filter((task) => task.id !== taskId),
      lastPlayedAt: Date.now(),
    });
  };

  const applyTimerUpdate = async (
    taskId: string,
    updater: (task: Task) => Task,
  ) => {
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
    if (!gameState) return;

    await applyTimerUpdate(taskId, finishTaskTimer);
    await playTimerAlert(gameState.settings.timerAlert);
  };

  const handleEquipPet = async (petId: string) => {
    if (!gameState) return;

    await persistGameState(equipPet(gameState, petId));
  };

  const handleSummonPet = async () => {
    if (!gameState) return;

    await persistGameState(summonPet(gameState));
  };

  const handleMultiSummonPet = async () => {
    if (!gameState) return;

    await persistGameState(multiSummonPet(gameState));
  };

  const handleRedeemPityPet = async (templateId: string) => {
    if (!gameState) return;

    await persistGameState(redeemPityPet(gameState, templateId));
  };

  const handleFusePet = async (targetPetId: string, sourcePetId: string) => {
    if (!gameState) return;

    await persistGameState(fusePet(gameState, targetPetId, sourcePetId));
  };

  const handleSellPet = async (petId: string) => {
    if (!gameState) return;

    await persistGameState(sellPet(gameState, petId));
  };

  const handleLanguageChange = async (language: AppLanguage) => {
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

  const handleTutorialComplete = async () => {
    if (!gameState) return;
    setTutorialVisible(false);
    await persistGameState({
      ...gameState,
      coins: gameState.coins + 100,
      tutorialCompleted: true,
    });
  };

  const handleTutorialSkip = async () => {
    if (!gameState) return;
    setTutorialVisible(false);
    await persistGameState({ ...gameState, tutorialCompleted: true });
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
            onEquipPet={handleEquipPet}
            onFusePet={handleFusePet}
            onRedeemPityPet={handleRedeemPityPet}
            onSellPet={handleSellPet}
            onSummonPet={handleSummonPet}
            onMultiSummonPet={handleMultiSummonPet}
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
          visible={tutorialVisible}
          settings={gameState.settings}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
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

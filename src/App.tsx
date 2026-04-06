import React, { useState, useEffect } from "react";
import { View, StyleSheet, AppState } from "react-native";
import { AppLanguage, AppThemeId, Task, GameState } from "./types";
import { getAppTheme } from "./constants/appTheme";
import SettingsModal from "./components/SettingsModal";
import DashboardScreen from "./screens/DashboardScreen";
import TasksScreen from "./screens/TasksScreen";
import TaskCalendarScreen from "./screens/TaskCalendarScreen";
import PetsScreen from "./screens/PetsScreen";
import BottomNavigation from "./components/BottomNavigation";
import { gameStateService } from "./services/gameStateService";
import { createInitialGameState, createSaveData } from "./utils/initialState";
import {
  completeTask,
  equipPet,
  fusePet,
  redeemPityPet,
  sellPet,
  summonPet,
} from "./utils/gameplay";
import { syncRecurringTasks } from "./utils/taskSchedule";

type Screen = "dashboard" | "tasks" | "task-calendar" | "pets";

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>("dashboard");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);

  useEffect(() => {
    loadGame();
  }, []);

  useEffect(() => {
    if (!gameState) {
      return;
    }

    const subscription = AppState.addEventListener("change", async (nextAppState) => {
      if (nextAppState !== "active") {
        return;
      }

      const syncedGameState = syncRecurringTasks(gameState);

      if (syncedGameState !== gameState) {
        await persistGameState(syncedGameState);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [gameState]);

  const loadGame = async () => {
    const saveData = await gameStateService.loadGame();

    if (saveData) {
      const syncedGameState = syncRecurringTasks(saveData.gameState);
      await gameStateService.saveGame(createSaveData(syncedGameState));
      setGameState(syncedGameState);
    } else {
      const newGameState = createInitialGameState();
      await gameStateService.saveGame(createSaveData(newGameState));
      setGameState(newGameState);
    }

    setLoading(false);
  };

  const persistGameState = async (nextGameState: GameState) => {
    const syncedGameState = syncRecurringTasks(nextGameState);
    setGameState(syncedGameState);
    await gameStateService.saveGame(createSaveData(syncedGameState));
  };

  const handleAddTask = async (task: Task) => {
    if (!gameState) return;

    await persistGameState({
      ...gameState,
      tasks: [...gameState.tasks, task],
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
      tasks: gameState.tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
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

  const handleEquipPet = async (petId: string) => {
    if (!gameState) return;

    await persistGameState(equipPet(gameState, petId));
  };

  const handleSummonPet = async () => {
    if (!gameState) return;

    await persistGameState(summonPet(gameState));
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
            onAddTask={handleAddTask}
            onCompleteTask={handleCompleteTask}
            onOpenSettings={() => setSettingsVisible(true)}
          />
        );
      case "tasks":
        return (
          <TasksScreen
            settings={gameState.settings}
            tasks={gameState.tasks}
            onAddTask={handleAddTask}
            onCompleteTask={handleCompleteTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onOpenCalendar={() => setActiveScreen("task-calendar")}
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
      case "pets":
        return (
          <PetsScreen
            gameState={gameState}
            settings={gameState.settings}
            onEquipPet={handleEquipPet}
            onFusePet={handleFusePet}
            onRedeemPityPet={handleRedeemPityPet}
            onSellPet={handleSellPet}
            onSummonPet={handleSummonPet}
          />
        );
    }
  };

  return (
    <View className="flex-1" style={[styles.container, { backgroundColor: appTheme.background }]}>
      {renderScreen()}
      <BottomNavigation
        activeScreen={activeScreen === "task-calendar" ? "tasks" : activeScreen}
        onNavigate={setActiveScreen}
        settings={gameState.settings}
      />
      <SettingsModal
        visible={settingsVisible}
        gameState={gameState}
        onClose={() => setSettingsVisible(false)}
        onLanguageChange={handleLanguageChange}
        onThemeChange={handleThemeChange}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

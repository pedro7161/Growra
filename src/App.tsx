import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Task, GameState, TaskStatus } from "./types";
import DashboardScreen from "./screens/DashboardScreen";
import TasksScreen from "./screens/TasksScreen";
import PetsScreen from "./screens/PetsScreen";
import BottomNavigation from "./components/BottomNavigation";
import { gameStateService } from "./services/gameStateService";
import { createInitialGameState, createSaveData } from "./utils/initialState";

type Screen = "dashboard" | "tasks" | "pets";

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>("dashboard");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGame();
  }, []);

  const loadGame = async () => {
    const saveData = await gameStateService.loadGame();

    if (saveData) {
      setGameState(saveData.gameState);
    } else {
      const newGameState = createInitialGameState();
      await gameStateService.saveGame(createSaveData(newGameState));
      setGameState(newGameState);
    }

    setLoading(false);
  };

  const handleAddTask = (task: Task) => {
    if (!gameState) return;

    const updatedGameState = {
      ...gameState,
      tasks: [...gameState.tasks, task],
      lastPlayedAt: Date.now(),
    };

    setGameState(updatedGameState);
  };

  const handleCompleteTask = (taskId: string) => {
    if (!gameState) return;

    const updatedTasks = gameState.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status: TaskStatus.COMPLETED,
            completedAt: Date.now(),
          }
        : task
    );

    const updatedGameState = {
      ...gameState,
      tasks: updatedTasks,
      lastPlayedAt: Date.now(),
    };

    setGameState(updatedGameState);
  };

  if (loading || !gameState) {
    return <View style={styles.container} />;
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case "dashboard":
        return <DashboardScreen gameState={gameState} />;
      case "tasks":
        return (
          <TasksScreen
            tasks={gameState.tasks}
            onAddTask={handleAddTask}
            onCompleteTask={handleCompleteTask}
          />
        );
      case "pets":
        return <PetsScreen />;
    }
  };

  return (
    <View style={styles.container}>
      {renderScreen()}
      <BottomNavigation activeScreen={activeScreen} onNavigate={setActiveScreen} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import DashboardScreen from "./screens/DashboardScreen";
import TasksScreen from "./screens/TasksScreen";
import PetsScreen from "./screens/PetsScreen";
import BottomNavigation from "./components/BottomNavigation";

type Screen = "dashboard" | "tasks" | "pets";

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>("dashboard");

  const renderScreen = () => {
    switch (activeScreen) {
      case "dashboard":
        return <DashboardScreen />;
      case "tasks":
        return <TasksScreen />;
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

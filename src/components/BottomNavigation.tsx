import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from "react-native";

type Screen = "dashboard" | "tasks" | "pets";

interface BottomNavigationProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export default function BottomNavigation({
  activeScreen,
  onNavigate,
}: BottomNavigationProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <NavItem
          label="Dashboard"
          screen="dashboard"
          active={activeScreen === "dashboard"}
          onPress={() => onNavigate("dashboard")}
        />
        <NavItem
          label="Tasks"
          screen="tasks"
          active={activeScreen === "tasks"}
          onPress={() => onNavigate("tasks")}
        />
        <NavItem
          label="Pets"
          screen="pets"
          active={activeScreen === "pets"}
          onPress={() => onNavigate("pets")}
        />
      </View>
    </SafeAreaView>
  );
}

function NavItem({
  label,
  screen,
  active,
  onPress,
}: {
  label: string;
  screen: Screen;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.item, active && styles.itemActive]}
      onPress={onPress}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#fff",
  },
  container: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  item: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  itemActive: {
    borderBottomColor: "#4ecdc4",
  },
  label: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
  labelActive: {
    color: "#4ecdc4",
  },
});

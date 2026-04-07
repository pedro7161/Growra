import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings } from "../types";

type Screen = "dashboard" | "tasks" | "realm";

const ACTIVE_CIRCLE_SIZE = 74;
const ACTIVE_DOCK_WIDTH = 92;
const ACTIVE_DOCK_HEIGHT = 34;

interface BottomNavigationProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
  settings: AppSettings;
}

export default function BottomNavigation({
  activeScreen,
  onNavigate,
  settings,
}: BottomNavigationProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;

  return (
    <View
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.surface,
          paddingBottom: bottomInset,
        },
      ]}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
          },
        ]}
      >
        <NavSlot
          label={copy.navDashboard}
          active={activeScreen === "dashboard"}
          onPress={() => onNavigate("dashboard")}
          settings={settings}
        />
        <NavSlot
          label={copy.navTasks}
          active={activeScreen === "tasks"}
          onPress={() => onNavigate("tasks")}
          settings={settings}
        />
        <NavSlot
          label={copy.navRealm}
          active={activeScreen === "realm"}
          onPress={() => onNavigate("realm")}
          settings={settings}
        />
      </View>
    </View>
  );
}

function NavSlot({
  label,
  active,
  onPress,
  settings,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  settings: AppSettings;
}) {
  const theme = getAppTheme(settings.theme);

  return (
    <View style={styles.slot}>
      {active && (
        <View
          pointerEvents="none"
          style={[
            styles.dockCurve,
            {
              backgroundColor: theme.surface,
              borderTopColor: theme.border,
            },
          ]}
        />
      )}

      <TouchableOpacity
        style={[
          styles.item,
          active ? styles.circleItem : styles.rectangleItem,
          active
            ? {
                backgroundColor: theme.accent,
                borderColor: theme.accentSoft,
              }
            : {
                backgroundColor: theme.surfaceMuted,
                borderColor: theme.border,
              },
        ]}
        onPress={onPress}
      >
        <Text
          style={[
            styles.label,
            active ? styles.circleLabel : styles.rectangleLabel,
            { color: active ? theme.accentText : theme.mutedText },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    overflow: "visible",
  },
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 14,
    borderTopWidth: 1,
    overflow: "visible",
  },
  slot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "visible",
  },
  dockCurve: {
    position: "absolute",
    top: -14,
    width: ACTIVE_DOCK_WIDTH,
    height: ACTIVE_DOCK_HEIGHT,
    borderTopWidth: 1,
    borderTopLeftRadius: ACTIVE_DOCK_WIDTH / 2,
    borderTopRightRadius: ACTIVE_DOCK_WIDTH / 2,
    zIndex: 0,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    zIndex: 1,
  },
  rectangleItem: {
    minWidth: 96,
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
  },
  circleItem: {
    width: ACTIVE_CIRCLE_SIZE,
    height: ACTIVE_CIRCLE_SIZE,
    borderRadius: ACTIVE_CIRCLE_SIZE / 2,
    marginTop: -24,
    marginBottom: 4,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
  },
  label: {
    fontWeight: "600",
  },
  rectangleLabel: {
    fontSize: 12,
  },
  circleLabel: {
    fontSize: 12,
    textAlign: "center",
  },
});

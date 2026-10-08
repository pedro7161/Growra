import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings } from "../types";

type Screen = "dashboard" | "tasks" | "journey" | "companions";

const ACTIVE_CIRCLE_SIZE = 68;
const ACTIVE_DOCK_WIDTH = 82;
const ACTIVE_DOCK_HEIGHT = 34;

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const NAV_ICONS: Record<Screen, { active: IconName; idle: IconName }> = {
  dashboard: { active: "home", idle: "home-outline" },
  tasks: { active: "checkbox", idle: "checkbox-outline" },
  journey: { active: "map", idle: "map-outline" },
  companions: { active: "paw", idle: "paw-outline" },
};

interface BottomNavigationProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
  settings: AppSettings;
  tutorialTarget: Screen | null;
}

export default function BottomNavigation({
  activeScreen,
  onNavigate,
  settings,
  tutorialTarget,
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
          icon={NAV_ICONS.dashboard}
          active={activeScreen === "dashboard"}
          highlighted={tutorialTarget === "dashboard"}
          disabled={tutorialTarget !== null && tutorialTarget !== "dashboard"}
          onPress={() => onNavigate("dashboard")}
          settings={settings}
        />
        <NavSlot
          label={copy.navTasks}
          icon={NAV_ICONS.tasks}
          active={activeScreen === "tasks"}
          highlighted={tutorialTarget === "tasks"}
          disabled={tutorialTarget !== null && tutorialTarget !== "tasks"}
          onPress={() => onNavigate("tasks")}
          settings={settings}
        />
        <NavSlot
          label={copy.navJourney}
          icon={NAV_ICONS.journey}
          active={activeScreen === "journey"}
          highlighted={tutorialTarget === "journey"}
          disabled={tutorialTarget !== null && tutorialTarget !== "journey"}
          onPress={() => onNavigate("journey")}
          settings={settings}
        />
        <NavSlot
          label={copy.navCompanions}
          icon={NAV_ICONS.companions}
          active={activeScreen === "companions"}
          highlighted={tutorialTarget === "companions"}
          disabled={tutorialTarget !== null && tutorialTarget !== "companions"}
          onPress={() => onNavigate("companions")}
          settings={settings}
        />
      </View>
    </View>
  );
}

function NavSlot({
  label,
  icon,
  active,
  highlighted,
  disabled,
  onPress,
  settings,
}: {
  label: string;
  icon: { active: IconName; idle: IconName };
  active: boolean;
  highlighted: boolean;
  disabled: boolean;
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
          highlighted && styles.highlightedItem,
          active
            ? {
                backgroundColor: theme.accent,
                borderColor: theme.accentSoft,
              }
            : {
                backgroundColor: theme.surfaceMuted,
                borderColor: theme.border,
              },
          highlighted && {
            borderColor: theme.hero,
            shadowColor: theme.hero,
            shadowOpacity: 0.35,
            shadowRadius: 12,
            shadowOffset: {
              width: 0,
              height: 4,
            },
            elevation: 12,
          },
          disabled && styles.disabledItem,
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        <Ionicons
          name={active ? icon.active : icon.idle}
          size={active ? 24 : 20}
          color={active ? theme.accentText : theme.mutedText}
        />
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          style={[
            styles.label,
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
    paddingHorizontal: 8,
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
  highlightedItem: {
    transform: [{ scale: 1.04 }],
  },
  disabledItem: {
    opacity: 0.42,
  },
  rectangleItem: {
    alignSelf: "stretch",
    marginHorizontal: 3,
    minHeight: 52,
    paddingHorizontal: 4,
    paddingVertical: 6,
    gap: 2,
    borderRadius: 16,
  },
  circleItem: {
    width: ACTIVE_CIRCLE_SIZE,
    height: ACTIVE_CIRCLE_SIZE,
    borderRadius: ACTIVE_CIRCLE_SIZE / 2,
    marginTop: -20,
    marginBottom: 2,
    gap: 1,
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
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 2,
  },
});

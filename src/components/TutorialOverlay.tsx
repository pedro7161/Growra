import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings } from "../types";

type TutorialStep =
  | "open-tasks"
  | "tap-add-task"
  | "choose-predefined-task"
  | "choose-water-task"
  | "confirm-task-add"
  | "complete-task"
  | "open-realm"
  | "summon-pet"
  | "equip-pet"
  | "done";

interface TutorialOverlayProps {
  visible: boolean;
  step: TutorialStep;
  settings: AppSettings;
}

export default function TutorialOverlay({
  visible,
  step,
  settings,
}: TutorialOverlayProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);

  if (!visible) {
    return null;
  }

  const message =
    step === "open-tasks"
      ? copy.tutorialOpenTasks
      : step === "tap-add-task"
        ? copy.tutorialCreateTaskHint
        : step === "choose-predefined-task"
          ? copy.tutorialChoosePredefinedTaskHint
          : step === "choose-water-task"
            ? copy.tutorialChooseWaterTaskHint
            : step === "confirm-task-add"
              ? copy.tutorialConfirmTaskAddHint
          : step === "complete-task"
            ? copy.tutorialCompleteTaskHint
            : step === "open-realm"
            ? copy.tutorialOpenRealm
            : step === "summon-pet"
              ? copy.tutorialSummonPetHint
              : step === "equip-pet"
                ? copy.tutorialEquipPetHint
                : copy.tutorialRewardTitle;

  const stepLabel =
    step === "open-tasks" ||
    step === "tap-add-task" ||
    step === "choose-predefined-task" ||
    step === "choose-water-task" ||
    step === "confirm-task-add"
      ? "1 / 4"
      : step === "complete-task"
        ? "2 / 4"
        : step === "open-realm" || step === "summon-pet"
          ? "3 / 4"
          : step === "equip-pet"
            ? "4 / 4"
            : "4 / 4";

  return (
    <View pointerEvents="none" style={styles.overlayRoot}>
      <SafeAreaView pointerEvents="none" style={styles.safeArea}>
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.title, { color: theme.text }]}>
            {copy.tutorialGuideTitle}
          </Text>
          <Text style={[styles.stepLabel, { color: theme.mutedText }]}>
            {stepLabel}
          </Text>
          <Text style={[styles.message, { color: theme.mutedText }]}>
            {message}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  safeArea: {
    width: "100%",
  },
  bubble: {
    alignSelf: "center",
    maxWidth: 280,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
  },
});

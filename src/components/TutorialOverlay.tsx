import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings } from "../types";
import { TUTORIAL_FIRST_TASK_REWARD, TUTORIAL_STEP_COUNT, TutorialStep, tutorialStepNumber } from "../utils/tutorial";

export type { TutorialStep } from "../utils/tutorial";

interface TutorialOverlayProps {
  visible: boolean;
  step: TutorialStep;
  settings: AppSettings;
  onSkip: () => void;
}

/**
 * The guided-step hint: a card just above the tab bar (so it never covers screen titles), with
 * step dots and a Skip button. The button to tap is highlighted by the screen itself.
 */
export default function TutorialOverlay({ visible, step, settings, onSkip }: TutorialOverlayProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  if (!visible || step === "done") return null;

  const message: Record<Exclude<TutorialStep, "done">, string> = {
    "open-tasks": copy.tutorialOpenTasks,
    "tap-add-task": copy.tutorialCreateTaskHint,
    "confirm-task-add": copy.tutorialConfirmTaskAddHint,
    "complete-task": copy.tutorialCompleteTaskHint.replace("{coins}", String(TUTORIAL_FIRST_TASK_REWARD)),
    "open-realm": copy.tutorialOpenRealm,
    "choose-companion": copy.tutorialChooseCompanionHint,
    "open-journey": copy.tutorialOpenJourney,
  };
  const current = tutorialStepNumber(step);

  return (
    <View pointerEvents="box-none" style={styles.overlayRoot}>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
        <View style={styles.headerRow}>
          <View style={styles.dots}>
            {Array.from({ length: TUTORIAL_STEP_COUNT }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  { backgroundColor: index < current ? theme.accent : theme.border },
                  index === current - 1 && styles.dotCurrent,
                ]}
              />
            ))}
          </View>
          <Text style={[styles.stepLabel, { color: theme.mutedText }]}>
            {copy.tutorialStepLabel.replace("{n}", String(current)).replace("{total}", String(TUTORIAL_STEP_COUNT))}
          </Text>
          <TouchableOpacity onPress={onSkip} hitSlop={10}>
            <Text style={[styles.skip, { color: theme.mutedText }]}>{copy.tutorialSkip}</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.message, { color: theme.text }]}>{message[step]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    // Sits just above the bottom tab bar.
    paddingBottom: 96,
  },
  card: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dots: { flexDirection: "row", gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotCurrent: { width: 18 },
  stepLabel: { flex: 1, fontSize: 12, fontWeight: "700" },
  skip: { fontSize: 13, fontWeight: "600", paddingVertical: 2 },
  message: { fontSize: 15, lineHeight: 21, fontWeight: "600" },
});

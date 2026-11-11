import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { getPetImage } from "../constants/petImages";
import { AppSettings } from "../types";
import { TUTORIAL_STEP_COUNT, TutorialStep, tutorialStepNumber } from "../utils/tutorial";
import { GuideSpeaker, tutorialMessage } from "../utils/tutorialGuide";
import CompanionArtwork from "./CompanionArtwork";

export type { TutorialStep } from "../utils/tutorial";

interface TutorialOverlayProps {
  visible: boolean;
  /** The bubble to show (may differ from the real step while the player pages Back / Next). */
  step: TutorialStep;
  settings: AppSettings;
  speaker: GuideSpeaker;
  /** Replay from Settings: nothing is paid, so the reward wording changes. */
  replay?: boolean;
  /** True while peeking at a bubble ahead of the real step. */
  preview?: boolean;
  canGoBack: boolean;
  canGoNext: boolean;
  /** Last replay bubble: Next closes the tour. */
  nextFinishes?: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

const MIN_TOUCH = 44;

/**
 * The talking-pet guide: the companion's portrait with a speech bubble (its tail points at the
 * pet, whose name heads the bubble) sitting just above the tab bar, so navigation stays tappable.
 * Back / Next / Skip are always there; the target button is highlighted by the screen itself.
 */
export default function TutorialOverlay({
  visible,
  step,
  settings,
  speaker,
  replay = false,
  preview = false,
  canGoBack,
  canGoNext,
  nextFinishes = false,
  onBack,
  onNext,
  onSkip,
}: TutorialOverlayProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const { height } = useWindowDimensions();
  if (!visible || step === "done") return null;

  const current = tutorialStepNumber(step);
  const portrait = getPetImage(speaker.templateId, speaker.evolutionStage, speaker.variantId);

  return (
    <View pointerEvents="box-none" style={styles.overlayRoot}>
      <View style={styles.row}>
        <View
          style={[styles.portraitFrame, { backgroundColor: theme.surface, borderColor: theme.accent }]}
          accessible
          accessibilityRole="image"
          accessibilityLabel={copy.tutorialGuideLabel.replace("{name}", speaker.name)}
        >
          <CompanionArtwork source={portrait} templateId={speaker.templateId} style={styles.portrait} />
        </View>
        <View style={styles.bubbleWrap}>
          {/* Tail: two stacked triangles make a bordered pointer toward the pet. */}
          <View style={[styles.tail, { borderRightColor: theme.accent }]} />
          <View style={[styles.tailInner, { borderRightColor: theme.surface }]} />
          <View style={[styles.bubble, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
            <View style={styles.headerRow}>
              <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>
                {speaker.name}
              </Text>
              <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
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
            </View>
            <Text style={[styles.stepLabel, { color: theme.mutedText }]}>
              {copy.tutorialStepLabel.replace("{n}", String(current)).replace("{total}", String(TUTORIAL_STEP_COUNT))}
              {preview ? ` · ${copy.tutorialPreviewBadge}` : ""}
            </Text>
            <ScrollView style={{ maxHeight: Math.max(96, height * 0.28) }} showsVerticalScrollIndicator={false}>
              <Text style={[styles.message, { color: theme.text }]}>{tutorialMessage(step, copy, speaker, replay)}</Text>
            </ScrollView>
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.button, { borderColor: theme.border }, !canGoBack && styles.disabled]}
                onPress={onBack}
                disabled={!canGoBack}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canGoBack }}
                accessibilityLabel={copy.tutorialBack}
              >
                <Text style={[styles.buttonText, { color: theme.text }]}>{copy.tutorialBack}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primary, { backgroundColor: theme.accent, borderColor: theme.accent }, !canGoNext && styles.disabled]}
                onPress={onNext}
                disabled={!canGoNext}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canGoNext }}
                accessibilityLabel={nextFinishes ? copy.tutorialFinish : copy.tutorialNext}
              >
                <Text style={[styles.buttonText, { color: theme.accentText }]}>
                  {nextFinishes ? copy.tutorialFinish : copy.tutorialNext}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { borderColor: theme.border }]}
                onPress={onSkip}
                accessibilityRole="button"
                accessibilityLabel={copy.tutorialSkip}
              >
                <Text style={[styles.buttonText, { color: theme.mutedText }]}>{copy.tutorialSkip}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const TAIL = 10;

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    justifyContent: "flex-end",
    paddingHorizontal: 8,
    // Sits just above the bottom tab bar, which stays tappable.
    paddingBottom: 96,
  },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  portraitFrame: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    padding: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  portrait: { flex: 1 },
  bubbleWrap: { flex: 1 },
  bubble: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  tail: {
    position: "absolute",
    left: -TAIL,
    bottom: 22,
    width: 0,
    height: 0,
    borderTopWidth: TAIL,
    borderBottomWidth: TAIL,
    borderRightWidth: TAIL + 1,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  tailInner: {
    position: "absolute",
    left: -TAIL + 3,
    bottom: 23,
    width: 0,
    height: 0,
    zIndex: 2,
    borderTopWidth: TAIL - 1,
    borderBottomWidth: TAIL - 1,
    borderRightWidth: TAIL,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { flex: 1, fontSize: 15, fontWeight: "800" },
  dots: { flexDirection: "row", gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotCurrent: { width: 18 },
  stepLabel: { fontSize: 12, fontWeight: "700" },
  message: { fontSize: 15, lineHeight: 21, fontWeight: "600" },
  buttons: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
  button: {
    minHeight: MIN_TOUCH,
    minWidth: MIN_TOUCH,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { flexGrow: 1 },
  buttonText: { fontSize: 14, fontWeight: "700", textAlign: "center" },
  disabled: { opacity: 0.45 },
});

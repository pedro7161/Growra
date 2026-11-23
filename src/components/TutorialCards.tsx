import React from "react";
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings } from "../types";
import { fillTemplate } from "../utils/tutorialGuide";
import { TUTORIAL_FINISH_REWARD, TUTORIAL_FIRST_TASK_REWARD } from "../utils/tutorial";

const icon = require("../../assets/images/update-icon.png");

/** welcome: first launch. finish: tutorial done (shows the gift). tour: "Replay tutorial" from Settings; starts the guided replay. */
export type TutorialCardMode = "welcome" | "finish" | "tour";

interface TutorialCardsProps {
  mode: TutorialCardMode | null;
  settings: AppSettings;
  onStart: () => void;
  onSkip: () => void;
  onClose: () => void;
}

export default function TutorialCards({ mode, settings, onStart, onSkip, onClose }: TutorialCardsProps) {
  if (!mode) return null;
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);

  const points =
    mode === "welcome"
      ? [copy.tutorialWelcomePoint1, copy.tutorialWelcomePoint2, copy.tutorialWelcomePoint3]
      : [copy.tutorialTipCalendar, copy.tutorialTipJourney, copy.tutorialTipCompanions, copy.tutorialTipSettings];
  const title =
    mode === "welcome" ? copy.tutorialWelcomeTitle : mode === "finish" ? copy.tutorialRewardTitle : copy.tutorialTourTitle;
  const subtitle =
    mode === "welcome"
      ? fillTemplate(copy.tutorialWelcomeBody, { coins: TUTORIAL_FIRST_TASK_REWARD + TUTORIAL_FINISH_REWARD })
      : mode === "finish"
        ? copy.tutorialFinishBody
        : copy.tutorialTourBody;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={mode === "welcome" ? onSkip : onClose}>
      <View style={styles.backdrop}>
        <ScrollView
          style={[styles.card, { backgroundColor: theme.background, borderColor: theme.border }]}
          contentContainerStyle={styles.cardContent}
        >
          <Image source={icon} style={styles.icon} />
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.mutedText }]}>{subtitle}</Text>
          {mode === "finish" && (
            <View style={[styles.gift, { backgroundColor: theme.accentSoft }]}>
              <Text style={[styles.giftText, { color: theme.accent }]}>
                {fillTemplate(copy.tutorialFinishGift, { coins: TUTORIAL_FINISH_REWARD })}
              </Text>
            </View>
          )}
          <View style={styles.points}>
            {points.map((point) => (
              <Text key={point} style={[styles.point, { color: theme.text }]}>
                {point}
              </Text>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.primary, { backgroundColor: theme.accent }]}
            onPress={mode === "finish" ? onClose : onStart}
            accessibilityRole="button"
          >
            <Text style={[styles.primaryText, { color: theme.accentText }]}>
              {mode === "finish" ? copy.tutorialLetsGo : copy.tutorialStart}
            </Text>
          </TouchableOpacity>
          {mode !== "finish" && (
            <TouchableOpacity onPress={mode === "welcome" ? onSkip : onClose} style={styles.linkTouch} accessibilityRole="button">
              <Text style={[styles.link, { color: theme.mutedText }]}>{copy.tutorialSkipAll}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "rgba(0, 0, 0, 0.5)" },
  // Scrolls so large fonts or short screens never push Start / Skip out of reach.
  card: { borderRadius: 22, borderWidth: 1, flexGrow: 0 },
  cardContent: { padding: 22, gap: 10, alignItems: "stretch" },
  icon: { width: 72, height: 72, borderRadius: 18, alignSelf: "center" },
  title: { fontSize: 24, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  gift: { alignSelf: "center", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  giftText: { fontSize: 15, fontWeight: "800" },
  points: { gap: 8, marginVertical: 6 },
  point: { fontSize: 15, lineHeight: 21 },
  primary: { borderRadius: 14, minHeight: 48, justifyContent: "center", paddingVertical: 14, alignItems: "center", marginTop: 4 },
  primaryText: { fontSize: 16, fontWeight: "700" },
  linkTouch: { minHeight: 44, justifyContent: "center" },
  link: { fontSize: 14, fontWeight: "600", textAlign: "center", paddingVertical: 6 },
});

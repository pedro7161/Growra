import React from "react";
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings } from "../types";
import { TUTORIAL_FINISH_REWARD, TUTORIAL_FIRST_TASK_REWARD } from "../utils/tutorial";

const icon = require("../../assets/images/update-icon.png");

/** welcome: first launch. finish: tutorial done (shows the gift). tour: "Replay tutorial" from Settings. */
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
      ? copy.tutorialWelcomeBody.replace("{coins}", String(TUTORIAL_FIRST_TASK_REWARD + TUTORIAL_FINISH_REWARD))
      : mode === "finish"
        ? copy.tutorialFinishBody
        : copy.tutorialTourBody;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={mode === "welcome" ? onSkip : onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <Image source={icon} style={styles.icon} />
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.mutedText }]}>{subtitle}</Text>
          {mode === "finish" && (
            <View style={[styles.gift, { backgroundColor: theme.accentSoft }]}>
              <Text style={[styles.giftText, { color: theme.accent }]}>
                {copy.tutorialFinishGift.replace("{coins}", String(TUTORIAL_FINISH_REWARD))}
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
            onPress={mode === "welcome" ? onStart : onClose}
          >
            <Text style={[styles.primaryText, { color: theme.accentText }]}>
              {mode === "welcome" ? copy.tutorialStart : copy.tutorialLetsGo}
            </Text>
          </TouchableOpacity>
          {mode === "welcome" && (
            <TouchableOpacity onPress={onSkip}>
              <Text style={[styles.link, { color: theme.mutedText }]}>{copy.tutorialSkipAll}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "rgba(0, 0, 0, 0.5)" },
  card: { borderRadius: 22, borderWidth: 1, padding: 22, gap: 10, alignItems: "stretch" },
  icon: { width: 72, height: 72, borderRadius: 18, alignSelf: "center" },
  title: { fontSize: 24, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  gift: { alignSelf: "center", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  giftText: { fontSize: 15, fontWeight: "800" },
  points: { gap: 8, marginVertical: 6 },
  point: { fontSize: 15, lineHeight: 21 },
  primary: { borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  primaryText: { fontSize: 16, fontWeight: "700" },
  link: { fontSize: 14, fontWeight: "600", textAlign: "center", paddingVertical: 6 },
});

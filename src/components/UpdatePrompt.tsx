import React from "react";
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppUpdateController, UpdatePromptState } from "../services/appUpdateService";
import { AppSettings } from "../types";

const icon = require("../../assets/images/update-icon.png");

interface UpdatePromptProps {
  settings: AppSettings;
  state: UpdatePromptState;
  progress: number | null;
  controller: AppUpdateController;
}

/** Google Play update prompt (approved mockup 01-update-prompt): a bottom sheet in the user's theme. */
export default function UpdatePrompt({ settings, state, progress, controller }: UpdatePromptProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);

  if (state === "downloading") {
    const percent = progress === null ? null : Math.round(progress * 100);
    return (
      <View pointerEvents="none" style={[styles.toast, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Image source={icon} style={styles.toastIcon} />
        <View style={styles.grow}>
          <Text style={[styles.toastTitle, { color: theme.text }]}>
            {copy.updateDownloading}
            {percent !== null && <Text style={{ color: theme.mutedText }}>  {percent}%</Text>}
          </Text>
          <View style={[styles.bar, { backgroundColor: theme.surfaceMuted }]}>
            <View style={[styles.barFill, { backgroundColor: theme.accent, width: `${percent ?? 0}%` }]} />
          </View>
        </View>
      </View>
    );
  }

  const sheet =
    state === "available"
      ? { tag: copy.updateAvailableTag, title: copy.updateAvailableTitle, body: copy.updateAvailableBody, primary: copy.updateButton, onPrimary: () => void controller.update(), warn: false }
      : state === "ready"
        ? { tag: copy.updateReadyTag, title: copy.updateReadyTitle, body: copy.updateReadyBody, primary: copy.updateRestartButton, onPrimary: () => void controller.restart(), warn: false }
        : state === "required"
          ? { tag: copy.updateRequiredTag, title: copy.updateRequiredTitle, body: copy.updateRequiredBody, primary: copy.updateNowButton, onPrimary: () => void controller.updateNow(), warn: true }
          : null;
  if (!sheet) return null;

  const required = state === "required";
  const dismiss = () => {
    if (!required) controller.later();
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <View style={[styles.grab, { backgroundColor: theme.border }]} />
          <View style={styles.head}>
            <Image source={icon} style={styles.icon} />
            <View style={styles.grow}>
              <Text
                style={[
                  styles.tag,
                  sheet.warn
                    ? { backgroundColor: theme.warningSoft, color: "#8a5a00" }
                    : { backgroundColor: theme.accentSoft, color: theme.accent },
                ]}
              >
                {sheet.tag}
              </Text>
              <Text style={[styles.title, { color: theme.text }]}>{sheet.title}</Text>
            </View>
          </View>
          <Text style={[styles.body, { color: theme.mutedText }]}>{sheet.body}</Text>
          <TouchableOpacity style={[styles.primary, { backgroundColor: theme.accent }]} onPress={sheet.onPrimary}>
            <Text style={[styles.primaryText, { color: theme.accentText }]}>{sheet.primary}</Text>
          </TouchableOpacity>
          {!required && (
            <TouchableOpacity onPress={dismiss}>
              <Text style={[styles.link, { color: theme.mutedText }]}>{copy.updateLaterButton}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0, 0, 0, 0.45)" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32, gap: 10 },
  grab: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginBottom: 4 },
  head: { flexDirection: "row", alignItems: "center", gap: 14 },
  icon: { width: 56, height: 56, borderRadius: 14 },
  grow: { flex: 1 },
  tag: { alignSelf: "flex-start", marginBottom: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: "hidden", fontSize: 12, fontWeight: "700" },
  title: { fontSize: 22, fontWeight: "700" },
  body: { fontSize: 14, lineHeight: 20, marginBottom: 6 },
  primary: { borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 6 },
  primaryText: { fontSize: 16, fontWeight: "700" },
  link: { fontSize: 14, fontWeight: "600", textAlign: "center", paddingVertical: 6 },
  // Downloading: a slim card above the tab bar; the app stays usable underneath.
  toast: { position: "absolute", left: 12, right: 12, bottom: 90, flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, borderWidth: 1, elevation: 6, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  toastIcon: { width: 36, height: 36, borderRadius: 10 },
  toastTitle: { fontSize: 14, fontWeight: "700" },
  bar: { height: 6, marginTop: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%" },
});

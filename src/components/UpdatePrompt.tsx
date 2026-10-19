import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, Modal, PanResponder, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
    return <DownloadBanner settings={settings} progress={progress} />;
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

/** Swipe this far sideways (px) to hide the download banner. */
export const BANNER_SWIPE_DISMISS = 80;

/**
 * Downloading: a slim card at the top, under the status bar, so it never covers the tab bar or the
 * screen's own buttons. The player can hide it (✕ or a sideways swipe); the download carries on and
 * the "ready" sheet still appears when it finishes.
 */
function DownloadBanner({ settings, progress }: { settings: AppSettings; progress: number | null }) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const insets = useSafeAreaInsets();
  const [hidden, setHidden] = useState(false);
  const offset = useRef(new Animated.Value(0)).current;
  const percent = progress === null ? null : Math.round(progress * 100);

  const hide = (direction: 1 | -1) => {
    Animated.timing(offset, { toValue: direction * 500, duration: 180, useNativeDriver: true }).start(() => setHidden(true));
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => offset.setValue(g.dx),
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) > BANNER_SWIPE_DISMISS) hide(g.dx > 0 ? 1 : -1);
        else Animated.spring(offset, { toValue: 0, useNativeDriver: true }).start();
      },
    }),
  ).current;

  // A new download (after a failed one) shows the banner again.
  useEffect(() => {
    if (progress === null) setHidden(false);
  }, [progress]);

  if (hidden) return null;
  return (
    <Animated.View
      {...pan.panHandlers}
      testID="update-download-banner"
      style={[
        styles.toast,
        { top: insets.top + 8, backgroundColor: theme.surface, borderColor: theme.border, transform: [{ translateX: offset }] },
      ]}
    >
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
      <TouchableOpacity
        onPress={() => hide(1)}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel={copy.updateHideBanner}
        style={styles.close}
      >
        <Text style={[styles.closeText, { color: theme.mutedText }]}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
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
  // Downloading: a slim card at the top (see DownloadBanner); the app stays usable underneath.
  toast: { position: "absolute", left: 12, right: 12, flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, borderWidth: 1, elevation: 6, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  toastIcon: { width: 36, height: 36, borderRadius: 10 },
  toastTitle: { fontSize: 14, fontWeight: "700" },
  bar: { height: 6, marginTop: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%" },
  close: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  closeText: { fontSize: 16, fontWeight: "700" },
});

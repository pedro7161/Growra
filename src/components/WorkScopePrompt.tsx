import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings, WorkEditScope } from "../types";

interface WorkScopePromptProps {
  settings: AppSettings;
  action: "edit" | "delete";
  /** The change touches the whole series (colour or repeat), so "Only this one" can't hold it. */
  followingOnly?: boolean;
  onChoose: (scope: WorkEditScope) => void;
  onCancel: () => void;
}

/** "Only this one" / "This and all following" for a repeating shift, drawn over the screen that asks. */
export default function WorkScopePrompt({ settings, action, followingOnly = false, onChoose, onCancel }: WorkScopePromptProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const button = (label: string, onPress: () => void, primary: boolean, disabled = false) => (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: primary ? theme.accent : theme.surfaceMuted, borderColor: primary ? theme.accent : theme.border },
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Text style={[styles.buttonText, { color: primary ? theme.accentText : theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.backdrop}>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>
          {action === "edit" ? copy.workScopeEditTitle : copy.workScopeDeleteTitle}
        </Text>
        <Text style={[styles.body, { color: theme.mutedText }]}>
          {action === "edit" ? copy.workScopeEditBody : copy.workScopeDeleteBody}
        </Text>
        {button(copy.workScopeOne, () => onChoose("one"), !followingOnly, followingOnly)}
        {button(copy.workScopeFollowing, () => onChoose("following"), followingOnly)}
        {followingOnly ? <Text style={[styles.hint, { color: theme.mutedText }]}>{copy.workScopeRuleHint}</Text> : null}
        <TouchableOpacity onPress={onCancel} style={styles.cancel} accessibilityRole="button">
          <Text style={[styles.cancelText, { color: theme.mutedText }]}>{copy.addTaskCancel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 16,
  },
  card: { borderWidth: 1, borderRadius: 16, padding: 20, gap: 10 },
  title: { fontSize: 18, fontWeight: "700" },
  body: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  button: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center" },
  buttonText: { fontSize: 15, fontWeight: "600" },
  disabled: { opacity: 0.4 },
  hint: { fontSize: 13, lineHeight: 18 },
  cancel: { alignItems: "center", paddingVertical: 8 },
  cancelText: { fontSize: 14, fontWeight: "600" },
});

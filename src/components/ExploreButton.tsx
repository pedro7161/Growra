import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings } from "../types";

interface ExploreButtonProps {
  settings: AppSettings;
  companionName: string;
  left: number;
  isPlus: boolean;
  busy: boolean;
  onPress: () => void;
}

export default function ExploreButton({ settings, companionName, left, isPlus, busy, onPress }: ExploreButtonProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const disabled = left === 0 || busy;
  const hint = left === 0 ? copy.exploreDone : (isPlus ? copy.explorePlusHint : copy.exploreAdHint).replace("{left}", String(left));

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: disabled ? theme.surfaceMuted : theme.accentSoft, borderColor: theme.accent }]}
      onPress={onPress}
      disabled={disabled}
    >
      {busy ? (
        <ActivityIndicator color={theme.accent} />
      ) : (
        <>
          <Text style={[styles.title, { color: theme.text }]}>🧭 {copy.exploreButton.replace("{name}", companionName)}</Text>
          <Text style={[styles.hint, { color: theme.mutedText }]}>{hint}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: 14, borderWidth: 2, padding: 12, alignItems: "center", gap: 2 },
  title: { fontSize: 15, fontWeight: "700" },
  hint: { fontSize: 12 },
});

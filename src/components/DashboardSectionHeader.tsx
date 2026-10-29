import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings } from "../types";

interface DashboardSectionHeaderProps {
  title: string;
  collapsed: boolean;
  settings: AppSettings;
  onToggle: () => void;
}

/** A dashboard section title; tapping it collapses or expands the section. */
export default function DashboardSectionHeader({ title, collapsed, settings, onToggle }: DashboardSectionHeaderProps) {
  const theme = getAppTheme(settings.theme);
  return (
    <TouchableOpacity
      style={styles.header}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded: !collapsed }}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Text style={[styles.chevron, { color: theme.mutedText }]}>{collapsed ? "▸" : "▾"}</Text>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 36, marginBottom: 8 },
  chevron: { fontSize: 14, width: 16 },
  title: { fontSize: 16, fontWeight: "700" },
});

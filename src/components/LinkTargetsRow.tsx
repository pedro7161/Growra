import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings } from "../types";

/** A group that can take a copy of the item being made. */
export interface LinkTarget {
  id: string;
  name: string;
  color: string;
}

interface LinkTargetsRowProps {
  settings: AppSettings;
  targets: LinkTarget[];
  /** The ticked group ids. */
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
}

/** "Also add to…": one checkbox per group of the matching kind. Hidden when there is none. */
export default function LinkTargetsRow({ settings, targets, selected, onChange, disabled = false }: LinkTargetsRowProps) {
  if (targets.length === 0) return null;
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((candidate) => candidate !== id) : [...selected, id]);

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <Text style={[styles.label, { color: theme.text }]}>{copy.linkAlsoAddTo}</Text>
      <Text style={[styles.hint, { color: theme.mutedText }]}>{copy.linkAlsoAddToHint}</Text>
      {targets.map((target) => {
        const ticked = selected.includes(target.id);
        return (
          <TouchableOpacity
            key={target.id}
            style={styles.row}
            onPress={() => toggle(target.id)}
            disabled={disabled}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: ticked, disabled }}
            accessibilityLabel={target.name}
          >
            <View
              style={[
                styles.box,
                { borderColor: ticked ? theme.accent : theme.border, backgroundColor: ticked ? theme.accent : theme.surface },
              ]}
            >
              {ticked ? <Text style={[styles.tick, { color: theme.accentText }]}>✓</Text> : null}
            </View>
            <View style={[styles.dot, { backgroundColor: target.color }]} />
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {target.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16, gap: 4 },
  disabled: { opacity: 0.4 },
  label: { fontSize: 14, fontWeight: "600" },
  hint: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  tick: { fontSize: 14, fontWeight: "800" },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { flex: 1, fontSize: 15, fontWeight: "600" },
});

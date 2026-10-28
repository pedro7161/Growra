import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings, HolderId } from "../types";
import { fillText } from "../utils/groups";
import { LinkedCopy } from "../utils/linkedEdits";

export type { LinkedCopy };

interface LinkedScopePromptProps {
  settings: AppSettings;
  action: "edit" | "delete";
  /** The other copies; "This one" is always included. */
  copies: LinkedCopy[];
  /** The ticked other holders. */
  onConfirm: (holders: HolderId[]) => void;
  onCancel: () => void;
}

/**
 * "Apply to: ✓ This one ✓ Ana ✓ Rui" for an edit or delete of a linked item, drawn over the screen that asks.
 * Every copy starts ticked; "This one" can't be unticked.
 */
export default function LinkedScopePrompt({ settings, action, copies, onConfirm, onCancel }: LinkedScopePromptProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const [ticked, setTicked] = useState<HolderId[]>(() => copies.map((entry) => entry.holder));
  const toggle = (holder: HolderId) =>
    setTicked((current) => (current.includes(holder) ? current.filter((candidate) => candidate !== holder) : [...current, holder]));

  const row = (key: string, label: string, checked: boolean, onPress?: () => void) => (
    <TouchableOpacity
      key={key}
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: !onPress }}
      accessibilityLabel={label}
    >
      <View
        style={[
          styles.box,
          { borderColor: checked ? theme.accent : theme.border, backgroundColor: checked ? theme.accent : theme.surface },
          !onPress && styles.locked,
        ]}
      >
        {checked ? <Text style={[styles.tick, { color: theme.accentText }]}>✓</Text> : null}
      </View>
      <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const danger = action === "delete";
  return (
    <View style={styles.backdrop}>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>{danger ? copy.linkDeleteTitle : copy.linkEditTitle}</Text>
        <Text style={[styles.body, { color: theme.mutedText }]}>{copy.linkApplyTo}</Text>
        <ScrollView style={styles.list}>
          {row("this", copy.linkThisOne, true)}
          {copies.map((entry) => row(entry.holder, entry.name, ticked.includes(entry.holder), () => toggle(entry.holder)))}
        </ScrollView>
        <Text style={[styles.note, { color: theme.mutedText }]}>{copy.linkUntickedNote}</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: danger ? theme.danger : theme.accent }]}
          onPress={() => onConfirm(copies.map((entry) => entry.holder).filter((holder) => ticked.includes(holder)))}
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, { color: danger ? "#fff" : theme.accentText }]}>
            {danger ? copy.linkDelete : copy.linkApply}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel} style={styles.cancel} accessibilityRole="button">
          <Text style={[styles.cancelText, { color: theme.mutedText }]}>{copy.addTaskCancel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** "Also in: Ana, Rui" with an Unlink button, shown in a linked item's details. */
export function LinkedCopiesCard({ settings, copies, onUnlink }: { settings: AppSettings; copies: LinkedCopy[]; onUnlink: () => void }) {
  if (copies.length === 0) return null;
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  return (
    <View style={[styles.linkedCard, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
      <View style={styles.linkedText}>
        <Text style={[styles.linkedNames, { color: theme.text }]}>
          {fillText(copy.linkAlsoIn, { names: copies.map((entry) => entry.name).join(", ") })}
        </Text>
        <Text style={[styles.note, { color: theme.mutedText }]}>{copy.linkUnlinkHint}</Text>
      </View>
      <TouchableOpacity
        style={[styles.unlink, { borderColor: theme.border, backgroundColor: theme.surface }]}
        onPress={onUnlink}
        accessibilityRole="button"
      >
        <Text style={[styles.unlinkText, { color: theme.text }]}>{copy.linkUnlink}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  linkedCard: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 12, padding: 12 },
  linkedText: { flex: 1, gap: 2 },
  linkedNames: { fontSize: 14, fontWeight: "600" },
  unlink: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  unlinkText: { fontSize: 14, fontWeight: "700" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 16,
  },
  card: { borderWidth: 1, borderRadius: 16, padding: 20, gap: 8, maxHeight: "90%" },
  title: { fontSize: 18, fontWeight: "700" },
  body: { fontSize: 14, lineHeight: 20 },
  list: { flexGrow: 0 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  locked: { opacity: 0.6 },
  tick: { fontSize: 14, fontWeight: "800" },
  name: { flex: 1, fontSize: 15, fontWeight: "600" },
  note: { fontSize: 13, lineHeight: 18 },
  button: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center", marginTop: 4 },
  buttonText: { fontSize: 15, fontWeight: "700" },
  cancel: { alignItems: "center", paddingVertical: 8 },
  cancelText: { fontSize: 14, fontWeight: "600" },
});

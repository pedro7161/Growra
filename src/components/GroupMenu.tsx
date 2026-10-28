import React, { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings, GroupKind } from "../types";

interface GroupMenuProps {
  settings: AppSettings;
  /** The name shown to the player (a group's own name, or "Personal"/"Work"). */
  name: string;
  /** Built-ins only offer Share; groups also get rename/colour and delete. */
  isGroup: boolean;
  /** What a share would send (from shareSummary). */
  shareCount: number;
  shareKind: GroupKind;
  /** How many items deleting the group removes (from groupItemCount). */
  itemCount: number;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

type Step = "menu" | "share" | "delete";

/** The ⋯ menu of a chooser card, with its share summary and delete confirmation steps. */
export default function GroupMenu({
  settings,
  name,
  isGroup,
  shareCount,
  shareKind,
  itemCount,
  onShare,
  onEdit,
  onDelete,
  onClose,
}: GroupMenuProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const [step, setStep] = useState<Step>("menu");
  const fill = (text: string, count: number) => text.replace("{name}", name).replace("{count}", String(count));

  const shareText =
    shareKind === "list"
      ? fill(shareCount === 1 ? copy.groupShareTasksOne : copy.groupShareTasks, shareCount)
      : fill(shareCount === 1 ? copy.groupShareItemsOne : copy.groupShareItems, shareCount);
  const deleteText = fill(
    itemCount === 0 ? copy.groupDeleteBodyEmpty : itemCount === 1 ? copy.groupDeleteBodyOne : copy.groupDeleteBody,
    itemCount,
  );

  const menuItem = (label: string, onPress: () => void, danger = false) => (
    <TouchableOpacity key={label} onPress={onPress} accessibilityRole="button">
      <Text style={[styles.menuItem, { color: danger ? theme.danger : theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  const confirm = (title: string, body: string, note: string | null, action: string, onConfirm: () => void, danger: boolean) => (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.body, { color: theme.text }]}>{body}</Text>
      {note ? <Text style={[styles.note, { color: theme.mutedText }]}>{note}</Text> : null}
      <View style={styles.actions}>
        <TouchableOpacity onPress={onClose} accessibilityRole="button">
          <Text style={[styles.action, { color: theme.mutedText }]}>{copy.addTaskCancel}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onConfirm} accessibilityRole="button">
          <Text style={[styles.action, styles.primary, { color: danger ? theme.danger : theme.accent }]}>{action}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={step === "menu" ? onClose : undefined}>
        {step === "menu" ? (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
              {name}
            </Text>
            {menuItem(copy.groupMenuShare, () => setStep("share"))}
            {isGroup ? menuItem(copy.groupMenuEdit, onEdit) : null}
            {isGroup ? menuItem(copy.groupMenuDelete, () => setStep("delete"), true) : null}
          </View>
        ) : step === "share" ? (
          confirm(copy.groupShareTitle.replace("{name}", name), shareText, copy.groupShareNote, copy.groupShareConfirm, onShare, false)
        ) : (
          confirm(copy.groupDeleteTitle, deleteText, null, copy.groupDeleteConfirm, onDelete, true)
        )}
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.45)" },
  card: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 8 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  menuItem: { fontSize: 16, fontWeight: "600", paddingVertical: 10 },
  body: { fontSize: 15, lineHeight: 21 },
  note: { fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 20, marginTop: 8 },
  action: { fontSize: 15, fontWeight: "600", paddingVertical: 6 },
  primary: { fontWeight: "800" },
});

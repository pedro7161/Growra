import React, { useState } from "react";
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { taskCalendarColors } from "../constants/taskConfig";
import { AppSettings, Group, GroupKind } from "../types";
import { MAX_GROUP_NAME_LENGTH, MAX_GROUPS } from "../utils/groups";

export interface GroupFields {
  name: string;
  color: string;
  kind: GroupKind;
}

interface GroupFormModalProps {
  settings: AppSettings;
  /** The group being renamed or recoloured; absent for a new group. */
  editing?: Group;
  /** Colour picked first for a new group. */
  defaultColor: string;
  /** Saves the fields; returns the reason when nothing was saved. */
  onSubmit: (fields: GroupFields) => "cap" | "name" | null;
  onClose: () => void;
}

/** Name, colour and type (Schedule or List) for a group. The type is fixed once the group exists. */
export default function GroupFormModal({ settings, editing, defaultColor, onSubmit, onClose }: GroupFormModalProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const [name, setName] = useState(editing?.name ?? "");
  const [color, setColor] = useState(editing?.color ?? defaultColor);
  const [kind, setKind] = useState<GroupKind>(editing?.kind ?? "schedule");
  const [error, setError] = useState<string | null>(null);
  // An imported group can carry a colour outside the palette; it stays pickable.
  const colors = taskCalendarColors.includes(color) ? taskCalendarColors : [...taskCalendarColors, color];

  const submit = () => {
    const result = onSubmit({ name, color, kind });
    if (result === "name") setError(copy.groupFormNameMissing);
    else if (result === "cap") setError(copy.groupCapReached.replace("{max}", String(MAX_GROUPS)));
    else onClose();
  };

  const kindOption = (value: GroupKind, label: string, hint: string) => {
    const selected = kind === value;
    const locked = editing !== undefined && !selected;
    return (
      <TouchableOpacity
        key={value}
        style={[
          styles.kindOption,
          { borderColor: selected ? theme.accent : theme.border, backgroundColor: selected ? theme.surfaceMuted : theme.surface },
          locked && styles.locked,
        ]}
        onPress={() => setKind(value)}
        disabled={editing !== undefined}
        accessibilityRole="radio"
        accessibilityState={{ selected, disabled: editing !== undefined }}
      >
        <Text style={[styles.kindLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.kindHint, { color: theme.mutedText }]}>{hint}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>{editing ? copy.groupFormEditTitle : copy.groupFormNewTitle}</Text>

          <Text style={[styles.label, { color: theme.text }]}>{copy.groupFormName}</Text>
          <TextInput
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError(null);
            }}
            placeholder={copy.groupFormNamePlaceholder}
            placeholderTextColor={theme.mutedText}
            maxLength={MAX_GROUP_NAME_LENGTH}
            autoFocus={!editing}
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          />

          <Text style={[styles.label, { color: theme.text }]}>{copy.groupFormColor}</Text>
          <View style={styles.colors}>
            {colors.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.colorChip, { backgroundColor: option, borderColor: color === option ? theme.text : "transparent" }]}
                onPress={() => setColor(option)}
                accessibilityRole="radio"
                accessibilityLabel={option}
                accessibilityState={{ selected: color === option }}
              />
            ))}
          </View>

          <Text style={[styles.label, { color: theme.text }]}>{copy.groupFormType}</Text>
          {kindOption("schedule", copy.groupKindSchedule, copy.groupKindScheduleHint)}
          {kindOption("list", copy.groupKindList, copy.groupKindListHint)}
          {editing ? <Text style={[styles.kindHint, { color: theme.mutedText }]}>{copy.groupFormTypeLocked}</Text> : null}

          {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} accessibilityRole="button">
              <Text style={[styles.action, { color: theme.mutedText }]}>{copy.addTaskCancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={submit} accessibilityRole="button">
              <Text style={[styles.action, styles.primary, { color: theme.accent }]}>
                {editing ? copy.groupFormSave : copy.groupFormCreate}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "center", padding: 16, backgroundColor: "rgba(0,0,0,0.45)" },
  card: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 10 },
  title: { fontSize: 18, fontWeight: "700" },
  label: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16 },
  colors: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  colorChip: { width: 32, height: 32, borderRadius: 16, borderWidth: 3 },
  kindOption: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 2 },
  kindLabel: { fontSize: 15, fontWeight: "700" },
  kindHint: { fontSize: 13, lineHeight: 18 },
  locked: { opacity: 0.4 },
  error: { fontSize: 14, fontWeight: "600" },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 20, marginTop: 6 },
  action: { fontSize: 15, fontWeight: "600", paddingVertical: 6 },
  primary: { fontWeight: "800" },
});

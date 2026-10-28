import React, { useState } from "react";
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings, Group } from "../types";
import { GroupShare, decodeGroupCode, extractGroupCode } from "../utils/groupCode";
import { MAX_GROUPS, fillText } from "../utils/groups";

interface GroupImportModalProps {
  settings: AppSettings;
  /** The group already imported from the same source, if any. */
  findExisting: (share: GroupShare) => Group | undefined;
  /** Adds or updates the group; returns "cap" when nothing was added. */
  onImport: (share: GroupShare, mode: "new" | "update") => "cap" | null;
  onClose: () => void;
}

/** "Add group from code": paste a code, see a friendly error, or choose Update / Add as new for a known source. */
export default function GroupImportModal({ settings, findExisting, onImport, onClose }: GroupImportModalProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ share: GroupShare; existing: Group } | null>(null);
  const capText = copy.groupImportErrors.cap.replace("{max}", String(MAX_GROUPS));

  const finish = (share: GroupShare, mode: "new" | "update") => {
    if (onImport(share, mode) === "cap") {
      setPending(null);
      setError(capText);
      return;
    }
    onClose();
  };

  const submit = () => {
    const decoded = decodeGroupCode(extractGroupCode(text), Date.now());
    if ("error" in decoded) {
      setError(copy.groupImportErrors[decoded.error]);
      return;
    }
    const existing = findExisting(decoded.share);
    if (existing) setPending({ share: decoded.share, existing });
    else finish(decoded.share, "new");
  };

  const canSubmit = text.trim() !== "";

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {pending ? (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>{fillText(copy.groupImportUpdateTitle, { name: pending.existing.name })}</Text>
            <Text style={[styles.hint, { color: theme.mutedText }]}>{copy.groupImportUpdateBody}</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={onClose} accessibilityRole="button">
                <Text style={[styles.action, { color: theme.mutedText }]}>{copy.addTaskCancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => finish(pending.share, "new")} accessibilityRole="button">
                <Text style={[styles.action, { color: theme.accent }]}>{copy.groupImportAddNew}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => finish(pending.share, "update")} accessibilityRole="button">
                <Text style={[styles.action, styles.primary, { color: theme.accent }]}>{copy.groupImportUpdate}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>{copy.groupImportTitle}</Text>
            <Text style={[styles.hint, { color: theme.mutedText }]}>{copy.groupImportHint}</Text>
            <TextInput
              value={text}
              onChangeText={(next) => {
                setText(next);
                setError(null);
              }}
              placeholder="GROWRA-GROUP-…"
              placeholderTextColor={theme.mutedText}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              autoFocus
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            />
            {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
            <View style={styles.actions}>
              <TouchableOpacity onPress={onClose} accessibilityRole="button">
                <Text style={[styles.action, { color: theme.mutedText }]}>{copy.addTaskCancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submit} disabled={!canSubmit} accessibilityRole="button">
                <Text style={[styles.action, styles.primary, { color: canSubmit ? theme.accent : theme.border }]}>
                  {copy.groupImportAdd}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.45)" },
  card: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 12 },
  title: { fontSize: 18, fontWeight: "700" },
  hint: { fontSize: 14, lineHeight: 20 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, minHeight: 80, textAlignVertical: "top" },
  error: { fontSize: 14, fontWeight: "600" },
  actions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 20 },
  action: { fontSize: 15, fontWeight: "600", paddingVertical: 6 },
  primary: { fontWeight: "800" },
});

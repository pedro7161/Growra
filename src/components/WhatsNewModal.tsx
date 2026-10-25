import React, { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { ChangelogEntry } from "../constants/changelog";
import { AppSettings } from "../types";

interface WhatsNewModalProps {
  notes: ChangelogEntry | null;
  version: string;
  settings: AppSettings;
  /** True when the player ticked "don't show again until the next update". */
  onClose: (hideUntilNextUpdate: boolean) => void;
}

/** What's new and what was fixed in this version, on every launch until the player hides it (#64). */
export default function WhatsNewModal({ notes, version, settings, onClose }: WhatsNewModalProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const [hide, setHide] = useState(false);
  const close = () => {
    onClose(hide);
    setHide(false);
  };
  const sections = notes
    ? [
        { title: copy.whatsNewNew, lines: notes.items },
        { title: copy.whatsNewFixed, lines: notes.fixes ?? [] },
      ].filter((section) => section.lines.length > 0)
    : [];

  return (
    <Modal visible={notes !== null} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <Text style={[styles.title, { color: theme.text }]}>{copy.whatsNewTitle.replace("{version}", version)}</Text>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {sections.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.accent }]}>{section.title}</Text>
                {section.lines.map((line) => (
                  <View key={line} style={styles.row}>
                    <Text style={[styles.bullet, { color: theme.accent }]}>•</Text>
                    <Text style={[styles.line, { color: theme.text }]}>{line}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.hideRow}
            onPress={() => setHide(!hide)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: hide }}
          >
            <View style={[styles.box, { borderColor: theme.accent, backgroundColor: hide ? theme.accent : "transparent" }]}>
              {hide && <Text style={[styles.tick, { color: theme.accentText }]}>✓</Text>}
            </View>
            <Text style={[styles.hideText, { color: theme.text }]}>{copy.whatsNewHide}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.close, { backgroundColor: theme.accent }]}
            onPress={close}
            accessibilityRole="button"
          >
            <Text style={[styles.closeText, { color: theme.accentText }]}>{copy.whatsNewClose}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0, 0, 0, 0.45)" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32, gap: 12, maxHeight: "85%" },
  title: { fontSize: 22, fontWeight: "700" },
  list: { flexGrow: 0 },
  listContent: { gap: 14 },
  section: { gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: "700", textTransform: "uppercase" },
  row: { flexDirection: "row", gap: 8 },
  bullet: { fontSize: 15, lineHeight: 21 },
  line: { flex: 1, fontSize: 15, lineHeight: 21 },
  hideRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  tick: { fontSize: 15, fontWeight: "700" },
  hideText: { flex: 1, fontSize: 15 },
  close: { borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  closeText: { fontSize: 16, fontWeight: "700" },
});

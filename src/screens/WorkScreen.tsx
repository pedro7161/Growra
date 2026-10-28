import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings } from "../types";

interface WorkScreenProps {
  settings: AppSettings;
  onBackToChooser: () => void;
}

// Placeholder until the full Work screen lands.
export default function WorkScreen({ settings, onBackToChooser }: WorkScreenProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBackToChooser} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button">
          <Text style={[styles.back, { color: theme.accent }]}>{copy.tasksBackToChooser}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>{copy.workTitle}</Text>
      </View>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{copy.workComingTitle}</Text>
        <Text style={[styles.cardBody, { color: theme.mutedText }]}>{copy.workComingBody}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  back: { fontSize: 13, fontWeight: "600", marginBottom: 2 },
  title: { fontSize: 24, fontWeight: "700" },
  card: { margin: 16, borderWidth: 1, borderRadius: 12, padding: 20, gap: 8 },
  cardTitle: { fontSize: 18, fontWeight: "700" },
  cardBody: { fontSize: 14, lineHeight: 20 },
});

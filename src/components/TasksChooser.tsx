import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings } from "../types";

interface TasksChooserProps {
  settings: AppSettings;
  personalCount: number;
  workPreview: string;
  onChoose: (section: "personal" | "work") => void;
}

export default function TasksChooser({ settings, personalCount, workPreview, onChoose }: TasksChooserProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const cards = [
    { id: "personal" as const, title: copy.tasksChoosePersonal, detail: `${personalCount} ${copy.tasksChoosePersonalCount}` },
    { id: "work" as const, title: copy.tasksChooseWork, detail: workPreview },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>{copy.tasksChooserTitle}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {cards.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => onChoose(card.id)}
            accessibilityRole="button"
          >
            <Text style={[styles.cardTitle, { color: theme.text }]}>{card.title}</Text>
            <Text style={[styles.cardDetail, { color: theme.mutedText }]}>{card.detail}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: "700" },
  content: { padding: 16, gap: 16 },
  card: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 28, gap: 6 },
  cardTitle: { fontSize: 22, fontWeight: "700" },
  cardDetail: { fontSize: 15 },
});

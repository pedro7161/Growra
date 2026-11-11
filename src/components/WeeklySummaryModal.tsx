import React from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings, DayRecord } from "../types";
import { formatCount } from "../utils/formatCount";
import { getLocaleFromSettings } from "../utils/settings";
import { getWeeklySummary } from "../utils/weeklySummary";

interface WeeklySummaryModalProps {
  visible: boolean;
  days: DayRecord[];
  createdAt: number;
  settings: AppSettings;
  onClose: () => void;
}

const BAR_MAX_HEIGHT = 64;

/** A look back at the last 7 days, opened only on request (#76). Descriptive, never a goal. */
export default function WeeklySummaryModal({ visible, days, createdAt, settings, onClose }: WeeklySummaryModalProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const locale = getLocaleFromSettings(settings);
  if (!visible) return null;

  const summary = getWeeklySummary(days, createdAt, Date.now());
  const peak = Math.max(1, ...summary.days.map((day) => day.done));
  const weekday = (date: number) => new Date(date).toLocaleDateString(locale, { weekday: "short" });
  const stats = [
    { label: copy.weeklySummaryTasks, value: summary.totalDone },
    ...(summary.recurringDone > 0 ? [{ label: copy.weeklySummaryRecurring, value: summary.recurringDone }] : []),
    ...(summary.focusSessions > 0 ? [{ label: copy.weeklySummaryFocus, value: summary.focusSessions }] : []),
  ];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <Text style={[styles.title, { color: theme.text }]} accessibilityRole="header">
            {copy.weeklySummaryTitle}
          </Text>
          <ScrollView contentContainerStyle={styles.content}>
            {summary.empty ? (
              <Text style={[styles.body, { color: theme.mutedText }]}>{copy.weeklySummaryEmpty}</Text>
            ) : (
              <>
                {stats.map((stat) => (
                  <View key={stat.label} style={styles.statRow}>
                    <Text style={[styles.statLabel, { color: theme.text }]}>{stat.label}</Text>
                    <Text style={[styles.statValue, { color: theme.accent }]}>{formatCount(stat.value, locale)}</Text>
                  </View>
                ))}
                <Text style={[styles.body, { color: theme.text }]}>
                  {copy.weeklySummaryActiveDays
                    .replace("{active}", formatCount(summary.activeDays, locale))
                    .replace("{total}", formatCount(summary.trackedDays, locale))}
                </Text>
                <View style={styles.bars}>
                  {summary.days.map((day) => (
                    <View
                      key={day.date}
                      style={styles.barColumn}
                      accessible
                      accessibilityLabel={
                        day.tracked
                          ? copy.weeklySummaryDayLabel
                              .replace("{day}", weekday(day.date))
                              .replace("{done}", formatCount(day.done, locale))
                          : `${weekday(day.date)}: ${copy.weeklySummaryNotTracked}`
                      }
                    >
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: day.tracked && day.done > 0 ? Math.max(6, (day.done / peak) * BAR_MAX_HEIGHT) : 3,
                              backgroundColor: day.tracked && day.done > 0 ? theme.accent : theme.accentSoft,
                              opacity: day.tracked ? 1 : 0.4,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.barLabel, { color: theme.mutedText }]}>{weekday(day.date)}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            {summary.trackedDays < summary.days.length && (
              <Text style={[styles.note, { color: theme.mutedText }]}>
                {copy.weeklySummaryPartial.replace("{days}", formatCount(summary.trackedDays, locale))}
              </Text>
            )}
          </ScrollView>
          <TouchableOpacity
            style={[styles.close, { backgroundColor: theme.accent }]}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={[styles.closeText, { color: theme.accentText }]}>{copy.weeklySummaryClose}</Text>
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
  content: { gap: 14 },
  body: { fontSize: 15, lineHeight: 21 },
  note: { fontSize: 13, lineHeight: 19 },
  statRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  statLabel: { flex: 1, fontSize: 16 },
  statValue: { fontSize: 22, fontWeight: "700" },
  bars: { flexDirection: "row", gap: 6, alignItems: "flex-end" },
  barColumn: { flex: 1, alignItems: "center", gap: 4 },
  barTrack: { height: BAR_MAX_HEIGHT, justifyContent: "flex-end", alignSelf: "stretch" },
  bar: { borderRadius: 4, alignSelf: "stretch" },
  barLabel: { fontSize: 11 },
  close: { borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  closeText: { fontSize: 16, fontWeight: "700" },
});

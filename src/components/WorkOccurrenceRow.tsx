import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings, WorkOccurrence } from "../types";
import { formatClock } from "../utils/workPreview";
import { canCompleteOccurrence, toDateKey } from "../utils/workSchedule";

interface WorkOccurrenceRowProps {
  occurrence: WorkOccurrence;
  settings: AppSettings;
  now: number;
  /** Week view: one line, no description. */
  compact?: boolean;
  onOpen: () => void;
  onComplete: () => void;
}

/** One shift: its colour, times and name, with a tick while it can be confirmed and a check once it is. */
export default function WorkOccurrenceRow({ occurrence, settings, now, compact = false, onOpen, onComplete }: WorkOccurrenceRowProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const completable = canCompleteOccurrence(occurrence, now);
  const nextDay = toDateKey(occurrence.end) !== occurrence.dateKey && new Date(occurrence.end).getHours() + new Date(occurrence.end).getMinutes() > 0;
  const times = `${formatClock(occurrence.start)}–${formatClock(occurrence.end)}${nextDay ? " +1" : ""}`;

  return (
    <View style={[styles.row, compact && styles.compactRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.colorBar, { backgroundColor: occurrence.calendarColor }]} />
      {occurrence.completed ? (
        <View style={[styles.tick, { backgroundColor: theme.success, borderColor: theme.success }]} accessibilityLabel={copy.workDone}>
          <Text style={[styles.tickMark, { color: theme.accentText }]}>✓</Text>
        </View>
      ) : completable ? (
        <TouchableOpacity
          style={[styles.tick, { borderColor: theme.accent }]}
          onPress={onComplete}
          accessibilityRole="button"
          accessibilityLabel={copy.workMarkDone}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        />
      ) : null}
      <TouchableOpacity style={styles.body} onPress={onOpen} accessibilityRole="button">
        <Text style={[styles.times, { color: theme.mutedText }]}>{times}</Text>
        <Text
          style={[styles.name, { color: theme.text }, occurrence.completed && styles.done]}
          numberOfLines={compact ? 1 : 2}
        >
          {occurrence.name}
        </Text>
        {!compact && occurrence.description ? (
          <Text style={[styles.description, { color: theme.mutedText }]} numberOfLines={2}>
            {occurrence.description}
          </Text>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, overflow: "hidden", minHeight: 64 },
  compactRow: { minHeight: 48, borderRadius: 10 },
  colorBar: { width: 6, alignSelf: "stretch" },
  tick: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 2,
    marginLeft: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tickMark: { fontSize: 15, fontWeight: "800" },
  body: { flex: 1, paddingHorizontal: 12, paddingVertical: 8, gap: 2 },
  times: { fontSize: 13, fontWeight: "600" },
  name: { fontSize: 15, fontWeight: "700" },
  done: { opacity: 0.6 },
  description: { fontSize: 13, lineHeight: 18 },
});

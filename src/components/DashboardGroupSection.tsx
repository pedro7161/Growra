import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings, Group } from "../types";
import { GroupNextItem } from "../utils/workDashboard";
import TaskTimerControls from "./TaskTimerControls";
import WorkOccurrenceRow from "./WorkOccurrenceRow";

interface DashboardGroupSectionProps {
  group: Group;
  next: GroupNextItem;
  collapsed: boolean;
  settings: AppSettings;
  now: number;
  disabled: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onCompleteTask: (taskId: string) => void;
  onCompleteOccurrence: (itemId: string, dateKey: string) => void;
  onStartTimer: (taskId: string) => void;
  onPauseTimer: (taskId: string) => void;
  onResetTimer: (taskId: string) => void;
  onTimerReady: (taskId: string) => void;
}

/** A group on the dashboard: colour dot, name (opens the group), a collapse toggle, and its one next item. */
export default function DashboardGroupSection({
  group,
  next,
  collapsed,
  settings,
  now,
  disabled,
  onToggle,
  onOpen,
  onCompleteTask,
  onCompleteOccurrence,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onTimerReady,
}: DashboardGroupSectionProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={`${copy.groupDashboardToggle}: ${group.name}`}
          accessibilityState={{ expanded: !collapsed }}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={styles.chevronButton}
        >
          <Text style={[styles.chevron, { color: theme.mutedText }]}>{collapsed ? "▸" : "▾"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.titleButton}
          onPress={onOpen}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityHint={copy.groupDashboardOpen}
        >
          <View style={[styles.dot, { backgroundColor: group.color }]} />
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {group.name}
          </Text>
        </TouchableOpacity>
      </View>
      {collapsed ? null : next.kind === "task" ? (
        <View style={[styles.taskRow, { backgroundColor: theme.surface, borderLeftColor: group.color }]}>
          <TouchableOpacity
            style={[styles.checkbox, { borderColor: theme.border }]}
            onPress={() => onCompleteTask(next.task.id)}
            disabled={disabled}
            hitSlop={10}
            accessibilityRole="checkbox"
            accessibilityLabel={next.task.name}
            accessibilityState={{ checked: false, disabled }}
          />
          <View style={styles.taskContent}>
            <Text style={[styles.taskName, { color: theme.text }]}>{next.task.name}</Text>
            <TaskTimerControls
              task={next.task}
              settings={settings}
              disabled={disabled}
              onStart={onStartTimer}
              onPause={onPauseTimer}
              onReset={onResetTimer}
              onReady={onTimerReady}
            />
          </View>
        </View>
      ) : (
        <WorkOccurrenceRow
          occurrence={next.occurrence}
          settings={settings}
          now={now}
          forGroup
          onOpen={onOpen}
          onComplete={() => onCompleteOccurrence(next.occurrence.itemId, next.occurrence.dateKey)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 36, marginBottom: 8 },
  chevronButton: { minHeight: 36, justifyContent: "center" },
  chevron: { fontSize: 14, width: 16 },
  titleButton: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, minHeight: 36 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  title: { fontSize: 16, fontWeight: "700", flexShrink: 1 },
  taskRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, borderLeftWidth: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 999, borderWidth: 2, marginRight: 12 },
  taskContent: { flex: 1 },
  taskName: { fontSize: 15, fontWeight: "600" },
});

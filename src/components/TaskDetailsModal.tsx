import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { taskCalendarColors, taskPriorityOptions } from "../constants/taskConfig";
import { AppSettings, CustomTaskTemplate, Task, TaskFrequency, TaskPriority, TaskType } from "../types";
import { getPredefinedTask } from "../constants/predefinedTasks";
import { updateTaskTimerDuration } from "../utils/taskTimer";
import TaskDatePicker from "./TaskDatePicker";

interface TaskDetailsModalProps {
  visible: boolean;
  settings: AppSettings;
  task: Task | null;
  customTaskTemplates: CustomTaskTemplate[];
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskDetailsModal({
  visible,
  settings,
  task,
  customTaskTemplates,
  onClose,
  onSave,
  onDelete,
}: TaskDetailsModalProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const customCategories = [...new Set(customTaskTemplates.map((template) => template.category))];
  const [draftTask, setDraftTask] = useState<Task | null>(task);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    setDraftTask(task);
    setConfirmingDelete(false);
  }, [task]);

  if (!draftTask) {
    return null;
  }

  const predefinedTask = draftTask.predefinedTaskId ? getPredefinedTask(draftTask.predefinedTaskId) : null;

  const getPriorityLabel = (priority: TaskPriority) => {
    if (priority === TaskPriority.HIGH) {
      return copy.tasksPriorityHigh;
    }

    if (priority === TaskPriority.LOW) {
      return copy.tasksPriorityLow;
    }

    return copy.tasksPriorityMedium;
  };

  const handleTimerToggle = (enabled: boolean) => {
    setDraftTask({
      ...draftTask,
      timer: {
        ...draftTask.timer,
        enabled,
        state: "idle",
        startedAt: 0,
        remainingMs: enabled ? draftTask.timer.duration : 0,
      },
    });
  };

  const handleTimerDurationChange = (value: string) => {
    const parsed = Number(value);

    if (Number.isNaN(parsed)) {
      return;
    }

    const durationMs = Math.max(1, Math.round(parsed)) * 60 * 1000;
    const nextTask = updateTaskTimerDuration(
      {
        ...draftTask,
        timer: {
          ...draftTask.timer,
          enabled: true,
        },
      },
      durationMs
    );

    setDraftTask(nextTask);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.headerAction, { color: theme.mutedText }]}>{copy.addTaskCancel}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>{copy.tasksDetails}</Text>
          <TouchableOpacity onPress={() => onSave(draftTask)}>
            <Text style={[styles.headerAction, { color: theme.accent }]}>{copy.tasksSave}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.text }]}>{copy.addTaskName}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceMuted, borderColor: theme.border, color: theme.text }]}
                value={draftTask.name}
                onChangeText={(name) => setDraftTask({ ...draftTask, name })}
                placeholderTextColor={theme.mutedText}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.text }]}>{copy.addTaskDescription}</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: theme.surfaceMuted, borderColor: theme.border, color: theme.text },
                ]}
                value={draftTask.description}
                onChangeText={(description) => setDraftTask({ ...draftTask, description })}
                multiline
                numberOfLines={4}
                placeholderTextColor={theme.mutedText}
              />
            </View>

            {draftTask.type === TaskType.CUSTOM ? (
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.text }]}>{copy.addTaskCategory}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surfaceMuted, borderColor: theme.border, color: theme.text }]}
                  value={draftTask.category}
                  onChangeText={(category) => setDraftTask({ ...draftTask, category })}
                  placeholderTextColor={theme.mutedText}
                />
                {customCategories.length > 0 ? (
                  <View style={styles.categorySuggestions}>
                    <Text style={[styles.categorySuggestionsLabel, { color: theme.mutedText }]}>
                      {copy.addTaskSavedCategories}
                    </Text>
                    <View style={styles.row}>
                      {customCategories.map((customCategory) => (
                        <TouchableOpacity
                          key={customCategory}
                          style={[
                            styles.categoryChip,
                            {
                              backgroundColor:
                                draftTask.category === customCategory ? theme.accent : theme.surfaceMuted,
                              borderColor:
                                draftTask.category === customCategory ? theme.accent : theme.border,
                            },
                          ]}
                          onPress={() => setDraftTask({ ...draftTask, category: customCategory })}
                        >
                          <Text
                            style={[
                              styles.categoryChipText,
                              {
                                color:
                                  draftTask.category === customCategory ? theme.accentText : theme.mutedText,
                              },
                            ]}
                          >
                            {customCategory}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.text }]}>{copy.addTaskFrequency}</Text>
              <View style={styles.row}>
                {[TaskFrequency.ONCE, TaskFrequency.DAILY, TaskFrequency.WEEKLY].map((frequency) => (
                  <ChipButton
                    key={frequency}
                    label={
                      frequency === TaskFrequency.ONCE
                        ? copy.addTaskOnce
                        : frequency === TaskFrequency.DAILY
                          ? copy.addTaskDaily
                          : copy.addTaskWeekly
                    }
                    active={draftTask.frequency === frequency}
                    onPress={() => setDraftTask({ ...draftTask, frequency })}
                    settings={settings}
                  />
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.text }]}>{copy.addTaskDate}</Text>
              <TaskDatePicker
                settings={settings}
                value={draftTask.dueDate}
                onChange={(dueDate) => setDraftTask({ ...draftTask, dueDate })}
              />
            </View>

            <View style={styles.field}>
              <View style={styles.timerHeader}>
                <Text style={[styles.label, { color: theme.text }]}>{copy.addTaskTimer}</Text>
                <Switch
                  value={draftTask.timer.enabled}
                  onValueChange={handleTimerToggle}
                  thumbColor={draftTask.timer.enabled ? theme.accent : theme.border}
                  trackColor={{ false: theme.surfaceMuted, true: theme.accentSoft }}
                />
              </View>
              {draftTask.timer.enabled && (
                <View style={styles.inlineField}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.compactInput,
                      { backgroundColor: theme.surfaceMuted, borderColor: theme.border, color: theme.text },
                    ]}
                    keyboardType="numeric"
                    value={String(Math.max(1, Math.round(draftTask.timer.duration / 60000)))}
                    onChangeText={handleTimerDurationChange}
                    placeholder="5"
                    placeholderTextColor={theme.mutedText}
                  />
                  <Text style={[styles.inlineLabel, { color: theme.mutedText }]}>min</Text>
                </View>
              )}
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.text }]}>{copy.tasksPriority}</Text>
              <View style={styles.row}>
                {taskPriorityOptions.map((priority) => (
                  <ChipButton
                    key={priority}
                    label={getPriorityLabel(priority)}
                    active={draftTask.priority === priority}
                    onPress={() => setDraftTask({ ...draftTask, priority })}
                    settings={settings}
                  />
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.text }]}>{copy.tasksCalendarColor}</Text>
              <View style={styles.colorRow}>
                {taskCalendarColors.map((calendarColor) => (
                  <TouchableOpacity
                    key={calendarColor}
                    style={[
                      styles.colorSwatch,
                      {
                        backgroundColor: calendarColor,
                        borderColor: draftTask.calendarColor === calendarColor ? theme.text : theme.surface,
                      },
                    ]}
                    onPress={() => setDraftTask({ ...draftTask, calendarColor })}
                  />
                ))}
              </View>
            </View>

            <View style={styles.metaList}>
              <Text style={[styles.metaText, { color: theme.mutedText }]}>
                {copy.tasksCategory}: {predefinedTask ? predefinedTask.category : draftTask.category}
              </Text>
            </View>
          </View>

          {!confirmingDelete ? (
            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: theme.danger }]}
              onPress={() => setConfirmingDelete(true)}
            >
              <Text style={styles.deleteButtonText}>{copy.tasksDelete}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.deleteConfirmationRow}>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: theme.surfaceMuted }]}
                onPress={() => setConfirmingDelete(false)}
              >
                <Text style={[styles.confirmButtonText, { color: theme.mutedText }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: theme.danger }]}
                onPress={() => {
                  onDelete(draftTask.id);
                  setConfirmingDelete(false);
                }}
              >
                <Text style={styles.deleteButtonText}>Confirm Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function ChipButton({
  label,
  active,
  onPress,
  settings,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  settings: AppSettings;
}) {
  const theme = getAppTheme(settings.theme);

  return (
    <TouchableOpacity
      style={[
        styles.chipButton,
        {
          backgroundColor: active ? theme.accent : theme.surfaceMuted,
          borderColor: active ? theme.accent : theme.border,
        },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.chipButtonText, { color: active ? theme.accentText : theme.mutedText }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerAction: {
    fontSize: 14,
    fontWeight: "600",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  content: {
    padding: 16,
    gap: 16,
  },
  section: {
    borderRadius: 16,
    padding: 16,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  compactInput: {
    flex: 0.45,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  categorySuggestions: {
    marginTop: 12,
    gap: 8,
  },
  categorySuggestionsLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  chipButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 3,
  },
  timerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  inlineField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inlineLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  metaList: {
    gap: 6,
  },
  metaText: {
    fontSize: 13,
  },
  deleteButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  deleteConfirmationRow: {
    flexDirection: "row",
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});

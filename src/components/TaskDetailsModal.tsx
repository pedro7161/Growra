import React, { useEffect, useState } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { taskCalendarColors, taskPriorityOptions } from "../constants/taskConfig";
import { AppSettings, Task, TaskFrequency, TaskPriority } from "../types";
import { getPredefinedTask } from "../constants/predefinedTasks";

interface TaskDetailsModalProps {
  visible: boolean;
  settings: AppSettings;
  task: Task | null;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskDetailsModal({
  visible,
  settings,
  task,
  onClose,
  onSave,
  onDelete,
}: TaskDetailsModalProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const [draftTask, setDraftTask] = useState<Task | null>(task);

  useEffect(() => {
    setDraftTask(task);
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
            <Text style={[styles.label, { color: theme.text }]}>{copy.addTaskName}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surfaceMuted, borderColor: theme.border, color: theme.text }]}
              value={draftTask.name}
              onChangeText={(name) => setDraftTask({ ...draftTask, name })}
              placeholderTextColor={theme.mutedText}
            />

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

            <Text style={[styles.label, { color: theme.text }]}>{copy.tasksCalendarColor}</Text>
            <View style={styles.colorRow}>
              {taskCalendarColors.map((calendarColor) => (
                <TouchableOpacity
                  key={calendarColor}
                  style={[
                    styles.colorSwatch,
                    {
                      backgroundColor: calendarColor,
                      borderColor:
                        draftTask.calendarColor === calendarColor ? theme.text : theme.surface,
                    },
                  ]}
                  onPress={() => setDraftTask({ ...draftTask, calendarColor })}
                />
              ))}
            </View>

            <View style={styles.metaList}>
              <Text style={[styles.metaText, { color: theme.mutedText }]}>
                {copy.tasksCategory}: {predefinedTask ? predefinedTask.category : draftTask.type}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: theme.danger }]}
            onPress={() => onDelete(draftTask.id)}
          >
            <Text style={styles.deleteButtonText}>{copy.tasksDelete}</Text>
          </TouchableOpacity>
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
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
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
    marginBottom: 16,
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 3,
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
});

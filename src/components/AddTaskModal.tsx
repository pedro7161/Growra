import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Modal,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings, TaskType, TaskFrequency } from "../types";
import { getPredefinedTask, getPredefinedTaskGroups, predefinedTasks } from "../constants/predefinedTasks";

interface TaskFormValues {
  name: string;
  description: string;
  predefinedTaskId: string;
  type: TaskType;
  frequency: TaskFrequency;
}

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSubmit: (values: TaskFormValues) => void;
}

export default function AddTaskModal({
  visible,
  onClose,
  settings,
  onSubmit,
}: AddTaskModalProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const predefinedTaskGroups = getPredefinedTaskGroups();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [predefinedTaskId, setPredefinedTaskId] = useState(predefinedTasks[0].id);
  const [type, setType] = useState<TaskType>(TaskType.CUSTOM);
  const [frequency, setFrequency] = useState<TaskFrequency>(TaskFrequency.ONCE);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(predefinedTaskGroups.map((group) => [group.category, false]))
  );
  const selectedPredefinedTask = getPredefinedTask(predefinedTaskId);

  const handleSubmit = () => {
    if (type === TaskType.CUSTOM && name.trim()) {
      onSubmit({
        name,
        description,
        predefinedTaskId: "",
        type,
        frequency,
      });
      resetForm();
      return;
    }

    if (type === TaskType.PREDEFINED) {
      onSubmit({
        name: selectedPredefinedTask.name,
        description: selectedPredefinedTask.description,
        predefinedTaskId,
        type,
        frequency,
      });
      resetForm();
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPredefinedTaskId(predefinedTasks[0].id);
    setType(TaskType.CUSTOM);
    setFrequency(TaskFrequency.ONCE);
    setCollapsedCategories(Object.fromEntries(predefinedTaskGroups.map((group) => [group.category, false])));
    onClose();
  };

  const handleSelectPredefinedTask = (taskId: string) => {
    const selectedTask = getPredefinedTask(taskId);
    setPredefinedTaskId(taskId);
    setFrequency(selectedTask.recommendedFrequency);
    setCollapsedCategories({
      ...collapsedCategories,
      [selectedTask.category]: false,
    });
  };

  const handleToggleCategory = (category: string) => {
    setCollapsedCategories({
      ...collapsedCategories,
      [category]: !collapsedCategories[category],
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.content} nestedScrollEnabled>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.cancelButton, { color: theme.mutedText }]}>{copy.addTaskCancel}</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>{copy.addTaskTitle}</Text>
            <TouchableOpacity onPress={handleSubmit}>
              <Text style={[styles.submitButton, { color: theme.accent }]}>{copy.addTaskConfirm}</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.text }]}>{copy.addTaskType}</Text>
              <View style={styles.buttonGroup}>
                <TypeButton
                  label={copy.addTaskCustom}
                  active={type === TaskType.CUSTOM}
                  onPress={() => setType(TaskType.CUSTOM)}
                  settings={settings}
                />
                <TypeButton
                  label={copy.addTaskPredefined}
                  active={type === TaskType.PREDEFINED}
                  onPress={() => {
                    setType(TaskType.PREDEFINED);
                    setFrequency(selectedPredefinedTask.recommendedFrequency);
                  }}
                  settings={settings}
                />
              </View>
            </View>

            {type === TaskType.CUSTOM ? (
              <>
                <View style={styles.field}>
                  <Text style={[styles.label, { color: theme.text }]}>{copy.addTaskName}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    placeholder={copy.addTaskNamePlaceholder}
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor={theme.mutedText}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: theme.text }]}>{copy.addTaskDescription}</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    placeholder={copy.addTaskDescriptionPlaceholder}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    placeholderTextColor={theme.mutedText}
                  />
                </View>
              </>
            ) : (
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.text }]}>{copy.addTaskChooseSystemTask}</Text>
                <ScrollView
                  style={[styles.predefinedListWrapper, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}
                  contentContainerStyle={styles.predefinedList}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {predefinedTaskGroups.map((group) => (
                    <View key={group.category} style={styles.predefinedGroup}>
                      <TouchableOpacity
                        style={[styles.groupHeader, { borderBottomColor: theme.border }]}
                        onPress={() => handleToggleCategory(group.category)}
                      >
                        <Text style={[styles.groupTitle, { color: theme.mutedText }]}>
                          {group.category}
                        </Text>
                        <Text style={[styles.groupToggle, { color: theme.mutedText }]}>
                          {collapsedCategories[group.category] ? "+" : "-"}
                        </Text>
                      </TouchableOpacity>
                      {!collapsedCategories[group.category]
                        ? group.tasks.map((task) => (
                            <TouchableOpacity
                              key={task.id}
                              style={[
                                styles.predefinedCard,
                                predefinedTaskId === task.id && styles.predefinedCardActive,
                                {
                                  backgroundColor:
                                    predefinedTaskId === task.id ? theme.accentSoft : theme.surface,
                                  borderColor:
                                    predefinedTaskId === task.id ? theme.accent : theme.border,
                                },
                              ]}
                              onPress={() => handleSelectPredefinedTask(task.id)}
                            >
                              <View style={styles.predefinedHeader}>
                                <Text
                                  style={[
                                    styles.predefinedName,
                                    predefinedTaskId === task.id && styles.predefinedNameActive,
                                    { color: predefinedTaskId === task.id ? theme.accent : theme.text },
                                  ]}
                                >
                                  {task.name}
                                </Text>
                                <View
                                  style={[
                                    styles.predefinedColorDot,
                                    { backgroundColor: task.calendarColor },
                                  ]}
                                />
                              </View>
                              <Text
                                style={[
                                  styles.predefinedDescription,
                                  predefinedTaskId === task.id && styles.predefinedDescriptionActive,
                                  {
                                    color:
                                      predefinedTaskId === task.id ? theme.text : theme.mutedText,
                                  },
                                ]}
                              >
                                {task.description}
                              </Text>
                            </TouchableOpacity>
                          ))
                        : null}
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.text }]}>{copy.addTaskFrequency}</Text>
              <View style={styles.buttonGroup}>
                <FrequencyButton
                  label={copy.addTaskOnce}
                  active={frequency === TaskFrequency.ONCE}
                  onPress={() => setFrequency(TaskFrequency.ONCE)}
                  settings={settings}
                />
                <FrequencyButton
                  label={copy.addTaskDaily}
                  active={frequency === TaskFrequency.DAILY}
                  onPress={() => setFrequency(TaskFrequency.DAILY)}
                  settings={settings}
                />
                <FrequencyButton
                  label={copy.addTaskWeekly}
                  active={frequency === TaskFrequency.WEEKLY}
                  onPress={() => setFrequency(TaskFrequency.WEEKLY)}
                  settings={settings}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function TypeButton({
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
        styles.button,
        {
          backgroundColor: active ? theme.accent : theme.surfaceMuted,
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.buttonText,
          {
            color: active ? theme.accentText : theme.mutedText,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function FrequencyButton({
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
        styles.button,
        {
          backgroundColor: active ? theme.accent : theme.surfaceMuted,
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.buttonText,
          {
            color: active ? theme.accentText : theme.mutedText,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  cancelButton: {
    fontSize: 14,
    color: "#999",
  },
  submitButton: {
    fontSize: 14,
    color: "#4ecdc4",
    fontWeight: "600",
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
  },
  textArea: {
    textAlignVertical: "top",
    paddingTop: 10,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
  },
  predefinedList: {
    gap: 10,
    padding: 10,
  },
  predefinedListWrapper: {
    maxHeight: 320,
    borderWidth: 1,
    borderRadius: 12,
  },
  predefinedGroup: {
    gap: 8,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 4,
    borderBottomWidth: 1,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  groupToggle: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 18,
  },
  predefinedCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 14,
  },
  predefinedCardActive: {
    borderColor: "#4ecdc4",
    backgroundColor: "#effdfb",
  },
  predefinedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  predefinedColorDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  predefinedName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  predefinedNameActive: {
    color: "#19766f",
  },
  predefinedCategory: {
    fontSize: 11,
    fontWeight: "600",
    color: "#777",
    textTransform: "uppercase",
  },
  predefinedCategoryActive: {
    color: "#1e8d85",
  },
  predefinedDescription: {
    fontSize: 13,
    color: "#666",
  },
  predefinedDescriptionActive: {
    color: "#366865",
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

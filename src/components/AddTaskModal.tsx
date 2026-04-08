import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Modal,
  ScrollView,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings, CustomTaskTemplate, TaskType, TaskFrequency, TaskPriority } from "../types";
import { getPredefinedTask, getPredefinedTaskGroups, predefinedTasks } from "../constants/predefinedTasks";
import { taskPriorityOptions } from "../constants/taskConfig";
import { getStartOfDay } from "../utils/taskSchedule";
import TaskDatePicker from "./TaskDatePicker";
import { getCustomTaskTemplateGroups } from "../utils/customTaskTemplates";

function getPriorityLabel(priority: TaskPriority): string {
  if (priority === TaskPriority.HIGH) {
    return "High";
  }
  if (priority === TaskPriority.LOW) {
    return "Low";
  }
  return "Medium";
}

interface TaskFormValues {
  name: string;
  description: string;
  predefinedTaskId: string;
  customTemplateId: string;
  category: string;
  type: TaskType;
  frequency: TaskFrequency;
  priority: TaskPriority;
  dueDate: number;
  timerEnabled: boolean;
  timerDurationMinutes: number;
  saveAsTemplate: boolean;
}

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  settings: AppSettings;
  customTaskTemplates: CustomTaskTemplate[];
  tutorialEnabled: boolean;
  tutorialTarget:
    | "modal-type-predefined"
    | "modal-task-drink-water"
    | "modal-submit"
    | null;
  onTutorialStateChange: (state: {
    modalVisible: boolean;
    taskType: TaskType;
    selectedPredefinedTaskId: string;
  }) => void;
  onSubmit: (values: TaskFormValues) => void;
}

export default function AddTaskModal({
  visible,
  onClose,
  settings,
  customTaskTemplates,
  tutorialEnabled,
  tutorialTarget,
  onTutorialStateChange,
  onSubmit,
}: AddTaskModalProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const predefinedTaskGroups = getPredefinedTaskGroups();
  const customTaskGroups = getCustomTaskTemplateGroups(customTaskTemplates);
  const customCategories = [...new Set(customTaskTemplates.map((template) => template.category))];
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [predefinedTaskId, setPredefinedTaskId] = useState(predefinedTasks[0].id);
  const [customTemplateId, setCustomTemplateId] = useState("");
  const [type, setType] = useState<TaskType>(TaskType.CUSTOM);
  const [frequency, setFrequency] = useState<TaskFrequency>(TaskFrequency.ONCE);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(predefinedTaskGroups.map((group) => [group.category, false]))
  );
  const [collapsedCustomCategories, setCollapsedCustomCategories] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(customTaskGroups.map((group) => [group.category, false]))
  );
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDurationMinutes, setTimerDurationMinutes] = useState(5);
  const [dueDate, setDueDate] = useState(() => getStartOfDay(Date.now()));
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [showSaveTemplateHelp, setShowSaveTemplateHelp] = useState(false);
  const [tutorialSelectedPredefinedTaskId, setTutorialSelectedPredefinedTaskId] =
    useState("");
  const selectedPredefinedTask = getPredefinedTask(predefinedTaskId);
  const predefinedTutorialTarget = tutorialTarget === "modal-type-predefined";
  const waterTutorialTarget = tutorialTarget === "modal-task-drink-water";
  const submitTutorialTarget = tutorialTarget === "modal-submit";
  const tutorialOn = tutorialEnabled && tutorialTarget !== null;

  useEffect(() => {
    setCollapsedCustomCategories((currentValue) => ({
      ...Object.fromEntries(customTaskGroups.map((group) => [group.category, false])),
      ...currentValue,
    }));
  }, [customTaskGroups]);

  useEffect(() => {
    onTutorialStateChange({
      modalVisible: visible,
      taskType: type,
      selectedPredefinedTaskId: tutorialSelectedPredefinedTaskId,
    });
  }, [
    onTutorialStateChange,
    tutorialSelectedPredefinedTaskId,
    type,
    visible,
  ]);

  const handleSubmit = () => {
    if (tutorialOn && !submitTutorialTarget) {
      return;
    }

    if (type === TaskType.CUSTOM && name.trim() && category.trim()) {
      onSubmit({
        name,
        description,
        predefinedTaskId: "",
        customTemplateId,
        category,
        type,
        frequency,
        priority,
        dueDate,
        timerEnabled,
        timerDurationMinutes,
        saveAsTemplate,
      });
      resetForm();
      return;
    }

    if (type === TaskType.PREDEFINED) {
      onSubmit({
        name: selectedPredefinedTask.name,
        description: selectedPredefinedTask.description,
        predefinedTaskId,
        customTemplateId: "",
        category: selectedPredefinedTask.category,
        type,
        frequency,
        priority,
        dueDate,
        timerEnabled,
        timerDurationMinutes,
        saveAsTemplate: false,
      });
      resetForm();
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("");
    setPredefinedTaskId(predefinedTasks[0].id);
    setCustomTemplateId("");
    setType(TaskType.CUSTOM);
    setFrequency(TaskFrequency.ONCE);
    setPriority(TaskPriority.MEDIUM);
    setCollapsedCategories(Object.fromEntries(predefinedTaskGroups.map((group) => [group.category, false])));
    setCollapsedCustomCategories(Object.fromEntries(customTaskGroups.map((group) => [group.category, false])));
    setTimerEnabled(false);
    setTimerDurationMinutes(5);
    setDueDate(getStartOfDay(Date.now()));
    setSaveAsTemplate(false);
    setShowSaveTemplateHelp(false);
    setTutorialSelectedPredefinedTaskId("");
    onClose();
  };

  const handleSelectPredefinedTask = (taskId: string) => {
    const selectedTask = getPredefinedTask(taskId);
    setPredefinedTaskId(taskId);
    setTutorialSelectedPredefinedTaskId(taskId);
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

  const handleToggleCustomCategory = (customCategory: string) => {
    setCollapsedCustomCategories({
      ...collapsedCustomCategories,
      [customCategory]: !collapsedCustomCategories[customCategory],
    });
  };

  const handleSelectCustomTemplate = (template: CustomTaskTemplate) => {
    setName(template.name);
    setDescription(template.description);
    setCategory(template.category);
    setCustomTemplateId(template.id);
    setSaveAsTemplate(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={tutorialOn ? () => {} : onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.content} nestedScrollEnabled>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <TouchableOpacity
              onPress={onClose}
              disabled={tutorialOn}
              style={tutorialOn ? styles.tutorialDisabled : undefined}
            >
              <Text style={[styles.cancelButton, { color: theme.mutedText }]}>{copy.addTaskCancel}</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>{copy.addTaskTitle}</Text>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={tutorialOn && !submitTutorialTarget}
              style={[
                submitTutorialTarget && styles.tutorialHighlight,
                tutorialOn && !submitTutorialTarget && styles.tutorialDisabled,
              ]}
            >
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
                  highlighted={false}
                  disabled={tutorialOn}
                />
                <TypeButton
                  label={copy.addTaskPredefined}
                  active={type === TaskType.PREDEFINED}
                  onPress={() => {
                    setType(TaskType.PREDEFINED);
                    setFrequency(selectedPredefinedTask.recommendedFrequency);
                  }}
                  settings={settings}
                  highlighted={predefinedTutorialTarget}
                  disabled={tutorialOn && !predefinedTutorialTarget}
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
                    onChangeText={(value) => {
                      setName(value);
                      setCustomTemplateId("");
                    }}
                    placeholderTextColor={theme.mutedText}
                    editable={!tutorialOn}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: theme.text }]}>{copy.addTaskDescription}</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    placeholder={copy.addTaskDescriptionPlaceholder}
                    value={description}
                    onChangeText={(value) => {
                      setDescription(value);
                      setCustomTemplateId("");
                    }}
                    multiline
                    numberOfLines={4}
                    placeholderTextColor={theme.mutedText}
                    editable={!tutorialOn}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: theme.text }]}>{copy.addTaskCategory}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    placeholder={copy.addTaskCategoryPlaceholder}
                    value={category}
                    onChangeText={(value) => {
                      setCategory(value);
                      setCustomTemplateId("");
                    }}
                    placeholderTextColor={theme.mutedText}
                    editable={!tutorialOn}
                  />
                  {customCategories.length > 0 ? (
                    <View style={styles.categorySuggestions}>
                      <Text style={[styles.categorySuggestionsLabel, { color: theme.mutedText }]}>
                        {copy.addTaskSavedCategories}
                      </Text>
                      <View style={styles.categorySuggestionRow}>
                        {customCategories.map((customCategory) => (
                          <TouchableOpacity
                            key={customCategory}
                            style={[
                              styles.categoryChip,
                              {
                                backgroundColor:
                                  category === customCategory ? theme.accent : theme.surfaceMuted,
                                borderColor:
                                  category === customCategory ? theme.accent : theme.border,
                              },
                            ]}
                            onPress={() => {
                              setCategory(customCategory);
                              setCustomTemplateId("");
                            }}
                            disabled={tutorialOn}
                          >
                            <Text
                              style={[
                                styles.categoryChipText,
                                { color: category === customCategory ? theme.accentText : theme.mutedText },
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

                {customTaskGroups.length > 0 ? (
                  <View style={styles.field}>
                    <Text style={[styles.label, { color: theme.text }]}>{copy.addTaskSavedCustomTasks}</Text>
                    <ScrollView
                      style={[styles.predefinedListWrapper, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}
                      contentContainerStyle={styles.predefinedList}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                    >
                      {customTaskGroups.map((group) => (
                        <View key={group.category} style={styles.predefinedGroup}>
                          <TouchableOpacity
                            style={[styles.groupHeader, { borderBottomColor: theme.border }]}
                            onPress={() => handleToggleCustomCategory(group.category)}
                            disabled={tutorialOn}
                          >
                            <Text style={[styles.groupTitle, { color: theme.mutedText }]}>{group.category}</Text>
                            <Text style={[styles.groupToggle, { color: theme.mutedText }]}>
                              {collapsedCustomCategories[group.category] ? "+" : "-"}
                            </Text>
                          </TouchableOpacity>
                          {!collapsedCustomCategories[group.category]
                            ? group.tasks.map((task) => (
                                <TouchableOpacity
                                  key={task.id}
                                  style={[
                                    styles.predefinedCard,
                                    customTemplateId === task.id && styles.predefinedCardActive,
                                    {
                                      backgroundColor: customTemplateId === task.id ? theme.accentSoft : theme.surface,
                                      borderColor: customTemplateId === task.id ? theme.accent : theme.border,
                                    },
                                  ]}
                                  onPress={() => handleSelectCustomTemplate(task)}
                                  disabled={tutorialOn}
                                >
                                  <View style={styles.predefinedHeader}>
                                    <Text
                                      style={[
                                        styles.predefinedName,
                                        customTemplateId === task.id && styles.predefinedNameActive,
                                        { color: customTemplateId === task.id ? theme.accent : theme.text },
                                      ]}
                                    >
                                      {task.name}
                                    </Text>
                                  </View>
                                  <Text
                                    style={[
                                      styles.predefinedDescription,
                                      customTemplateId === task.id && styles.predefinedDescriptionActive,
                                      { color: customTemplateId === task.id ? theme.text : theme.mutedText },
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
                ) : null}
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
                        disabled={tutorialOn}
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
                                waterTutorialTarget &&
                                  task.id === "drink-water" &&
                                  styles.tutorialHighlight,
                                tutorialOn &&
                                  waterTutorialTarget &&
                                  task.id !== "drink-water" &&
                                  styles.tutorialDisabled,
                                tutorialOn &&
                                  submitTutorialTarget &&
                                  styles.tutorialDisabled,
                                predefinedTaskId === task.id && styles.predefinedCardActive,
                                {
                                  backgroundColor:
                                    predefinedTaskId === task.id ? theme.accentSoft : theme.surface,
                                  borderColor:
                                    predefinedTaskId === task.id ? theme.accent : theme.border,
                                },
                              ]}
                              onPress={() => handleSelectPredefinedTask(task.id)}
                              disabled={
                                (tutorialOn && waterTutorialTarget && task.id !== "drink-water") ||
                                submitTutorialTarget
                              }
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
              <View
                style={[
                  styles.buttonGroup,
                  tutorialOn && styles.tutorialDisabled,
                ]}
              >
                <FrequencyButton
                  label={copy.addTaskOnce}
                  active={frequency === TaskFrequency.ONCE}
                  onPress={() => setFrequency(TaskFrequency.ONCE)}
                  settings={settings}
                  disabled={tutorialOn}
                />
                <FrequencyButton
                  label={copy.addTaskDaily}
                  active={frequency === TaskFrequency.DAILY}
                  onPress={() => setFrequency(TaskFrequency.DAILY)}
                  settings={settings}
                  disabled={tutorialOn}
                />
                <FrequencyButton
                  label={copy.addTaskWeekly}
                  active={frequency === TaskFrequency.WEEKLY}
                  onPress={() => setFrequency(TaskFrequency.WEEKLY)}
                  settings={settings}
                  disabled={tutorialOn}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.text }]}>{copy.tasksPriority}</Text>
              <View style={[styles.row, tutorialOn && styles.tutorialDisabled]}>
                {taskPriorityOptions.map((priorityOption) => (
                  <ChipButton
                    key={priorityOption}
                    label={getPriorityLabel(priorityOption)}
                    active={priority === priorityOption}
                    onPress={() => setPriority(priorityOption)}
                    settings={settings}
                    disabled={tutorialOn}
                  />
                ))}
              </View>
            </View>

            <View style={[styles.field, tutorialOn && styles.tutorialDisabled]}>
              <Text style={[styles.label, { color: theme.text }]}>{copy.addTaskDate}</Text>
              <TaskDatePicker
                settings={settings}
                value={dueDate}
                onChange={setDueDate}
                disabled={tutorialOn}
              />
            </View>

            {type === TaskType.CUSTOM ? (
              <View style={styles.field}>
                <View style={styles.timerHeader}>
                  <View style={styles.helpLabelRow}>
                    <Text style={[styles.label, styles.inlineLabelText, { color: theme.text }]}>
                      {copy.addTaskSaveTemplate}
                    </Text>
                    <TouchableOpacity
                      style={[styles.helpButton, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}
                      onPress={() => setShowSaveTemplateHelp(!showSaveTemplateHelp)}
                      disabled={tutorialOn}
                    >
                      <Text style={[styles.helpButtonText, { color: theme.mutedText }]}>?</Text>
                    </TouchableOpacity>
                  </View>
                  <Switch
                  value={saveAsTemplate}
                    onValueChange={tutorialOn ? () => {} : setSaveAsTemplate}
                    thumbColor={saveAsTemplate ? theme.accent : theme.border}
                    trackColor={{ false: theme.surfaceMuted, true: theme.accentSoft }}
                    disabled={tutorialOn}
                  />
                </View>
                {showSaveTemplateHelp ? (
                  <Text style={[styles.helpText, { color: theme.mutedText }]}>
                    {copy.addTaskSaveTemplateHelp}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View style={[styles.field, tutorialOn && styles.tutorialDisabled]}>
              <View style={styles.timerHeader}>
                <Text style={[styles.label, { color: theme.text }]}>{copy.addTaskTimer}</Text>
                <Switch
                  value={timerEnabled}
                  onValueChange={tutorialOn ? () => {} : setTimerEnabled}
                  thumbColor={timerEnabled ? theme.accent : theme.border}
                  trackColor={{ false: theme.surfaceMuted, true: theme.accentSoft }}
                  disabled={tutorialOn}
                />
              </View>
              {timerEnabled && (
                <View style={styles.timerInputRow}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.timerInput,
                      { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
                    ]}
                    value={timerDurationMinutes.toString()}
                    onChangeText={(value) => {
                      if (tutorialOn) {
                        return;
                      }
                      const parsed = Number(value);
                      if (!Number.isNaN(parsed)) {
                        setTimerDurationMinutes(Math.max(1, parsed));
                      }
                    }}
                    keyboardType="numeric"
                    placeholder="5"
                    placeholderTextColor={theme.mutedText}
                    editable={!tutorialOn}
                  />
                  <Text style={[styles.timerLabel, { color: theme.mutedText }]}>min</Text>
                </View>
              )}
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
  highlighted = false,
  disabled = false,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  settings: AppSettings;
  highlighted?: boolean;
  disabled?: boolean;
}) {
  const theme = getAppTheme(settings.theme);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        highlighted && styles.tutorialHighlight,
        disabled && styles.tutorialDisabled,
        {
          backgroundColor: active ? theme.accent : theme.surfaceMuted,
        },
      ]}
      onPress={onPress}
      disabled={disabled}
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
  disabled = false,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  settings: AppSettings;
  disabled?: boolean;
}) {
  const theme = getAppTheme(settings.theme);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.tutorialDisabled,
        {
          backgroundColor: active ? theme.accent : theme.surfaceMuted,
        },
      ]}
      onPress={onPress}
      disabled={disabled}
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

function ChipButton({
  label,
  active,
  onPress,
  settings,
  disabled = false,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  settings: AppSettings;
  disabled?: boolean;
}) {
  const theme = getAppTheme(settings.theme);

  return (
    <TouchableOpacity
      style={[
        styles.chipButton,
        disabled && styles.tutorialDisabled,
        {
          backgroundColor: active ? theme.accent : theme.surfaceMuted,
          borderColor: active ? theme.accent : theme.border,
        },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.chipButtonText,
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
  categorySuggestions: {
    marginTop: 12,
    gap: 8,
  },
  categorySuggestionsLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  categorySuggestionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
  helpLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inlineLabelText: {
    marginBottom: 0,
  },
  helpButton: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  helpButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  helpText: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
  },
  timerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timerInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  timerInput: {
    flex: 0.5,
  },
  timerLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
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
  tutorialHighlight: {
    borderWidth: 2,
    borderColor: "#ffd166",
    shadowColor: "#ffd166",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 10,
  },
  tutorialDisabled: {
    opacity: 0.34,
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
  row: {
    flexDirection: "row",
    gap: 8,
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
});

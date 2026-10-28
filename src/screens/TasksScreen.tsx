import React, { useEffect, useState } from "react";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import {
  AppSettings,
  CustomTaskTemplate,
  HolderId,
  Task,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "../types";
import AddTaskModal from "../components/AddTaskModal";
import TaskDetailsModal from "../components/TaskDetailsModal";
import { getPredefinedTask } from "../constants/predefinedTasks";
import { buildTaskFromFormValues, createQuickAddTaskFormValues, TaskFormValues } from "../utils/taskFactory";
import { getTodayTasks } from "../utils/taskSchedule";
import TaskTimerControls from "../components/TaskTimerControls";
import { getLocaleFromSettings } from "../utils/settings";
import { taskCategoryLabel, taskFrequencyLabel } from "../utils/taskLabels";
import { customTaskDraftProblem } from "../utils/taskDraft";
import { taskMatchesSearch } from "../utils/taskSearch";
import { isBuiltIn } from "../utils/groups";
import { LinkedCopy } from "../utils/linkedEdits";
import { LinkTarget } from "../components/LinkTargetsRow";

interface TasksScreenProps {
  /** Personal, or a list group. */
  holder: HolderId;
  title: string;
  /** The holder's colour: a group shows it beside the title and on its task cards. */
  accentColor: string;
  settings: AppSettings;
  /** The holder's own tasks. */
  tasks: Task[];
  customTaskTemplates: CustomTaskTemplate[];
  onBackToChooser?: () => void;
  tutorialTarget:
    | "add-button"
    | "modal-type-predefined"
    | "modal-task-drink-water"
    | "modal-submit"
    | "task-complete"
    | null;
  onTutorialStateChange: (state: {
    modalVisible: boolean;
    taskType: TaskType;
    selectedPredefinedTaskId: string;
  }) => void;
  /** `alsoAddTo`: groups that get a linked copy. */
  onAddTask: (task: Task, customTemplate?: CustomTaskTemplate, alsoAddTo?: string[]) => void;
  onCompleteTask: (taskId: string) => void;
  /** `others`: the other copies of a linked task the edit also reaches. */
  onUpdateTask: (task: Task, others: HolderId[]) => void;
  onDeleteTask: (taskId: string, others: HolderId[]) => void;
  onUnlink: (taskId: string) => void;
  /** The groups a new task can also go to. */
  linkTargets: LinkTarget[];
  /** The other copies of a linked task. */
  linkedCopiesOf: (task: Task) => LinkedCopy[];
  /** The calendar button is hidden without it. */
  onOpenCalendar?: () => void;
  onTaskToolsOpenChange: (open: boolean) => void;
  onUiTap: () => void;
  onStartTimer: (taskId: string) => void;
  onPauseTimer: (taskId: string) => void;
  onResetTimer: (taskId: string) => void;
  onTimerReady: (taskId: string) => void;
}

export default function TasksScreen({
  holder,
  title,
  accentColor,
  settings,
  tasks,
  customTaskTemplates,
  onBackToChooser,
  tutorialTarget,
  onTutorialStateChange,
  onAddTask,
  onCompleteTask,
  onUpdateTask,
  onDeleteTask,
  onUnlink,
  linkTargets,
  linkedCopiesOf,
  onOpenCalendar,
  onTaskToolsOpenChange,
  onUiTap,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onTimerReady,
}: TasksScreenProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const tutorialOn = tutorialTarget !== null;
  const groupColor = isBuiltIn(holder) ? null : accentColor;
  const tutorialCreateFlow =
    tutorialTarget === "add-button" ||
    tutorialTarget === "modal-type-predefined" ||
    tutorialTarget === "modal-task-drink-water" ||
    tutorialTarget === "modal-submit";
  const now = Date.now();
  const [filter, setFilter] = useState<TaskStatus | "all" | "upcoming">("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickAddName, setQuickAddName] = useState("");
  const toolsOpen = settings.taskToolsOpen;
  const todayTasks = getTodayTasks(tasks, now);
  const upcomingTasks = tasks.filter((task) => task.status === TaskStatus.PENDING && task.dueDate > now);
  const completedTasks = tasks.filter((task) => task.status === TaskStatus.COMPLETED);

  const baseTasks =
    filter === "all" ? tasks : filter === TaskStatus.PENDING ? todayTasks : filter === "upcoming" ? upcomingTasks : completedTasks;
  const filteredTasks = [...baseTasks]
    .filter((task) => taskMatchesSearch(task, searchQuery, settings.language))
    .sort((leftTask, rightTask) => {
      const priorityOrder = {
        [TaskPriority.HIGH]: 0,
        [TaskPriority.MEDIUM]: 1,
        [TaskPriority.LOW]: 2,
      };

      if (leftTask.status !== rightTask.status) {
        return leftTask.status === TaskStatus.PENDING ? -1 : 1;
      }

      if (priorityOrder[leftTask.priority] !== priorityOrder[rightTask.priority]) {
        return priorityOrder[leftTask.priority] - priorityOrder[rightTask.priority];
      }

      if (leftTask.dueDate !== rightTask.dueDate) {
        return leftTask.dueDate - rightTask.dueDate;
      }

      return rightTask.createdAt - leftTask.createdAt;
    });

  const handleAddTask = (values: TaskFormValues, alsoAddTo: string[]) => {
    const { task, customTemplate } = buildTaskFromFormValues(values);
    onAddTask(task, customTemplate, alsoAddTo);
  };
  const selectedCopies = selectedTask ? linkedCopiesOf(selectedTask) : [];
  const handleQuickAdd = () => {
    if (tutorialOn) {
      return;
    }

    if (customTaskDraftProblem({ name: quickAddName, category: "" })) {
      Alert.alert(copy.addTaskTitle, copy.addTaskNameMissing);
      return;
    }

    const { task } = buildTaskFromFormValues(createQuickAddTaskFormValues(quickAddName));
    onAddTask(task);
    setQuickAddName("");
    onUiTap();
  };
  const tutorialTargetTaskId =
    tutorialTarget === "task-complete" && tasks.length > 0 ? tasks[0].id : "";

  useEffect(() => {
    if (!tutorialCreateFlow && !modalVisible) {
      onTutorialStateChange({
        modalVisible: false,
        taskType: TaskType.CUSTOM,
        selectedPredefinedTaskId: "",
      });
    }
  }, [modalVisible, onTutorialStateChange, tutorialCreateFlow]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {/* A group's own name can be wider than the screen: its header column shrinks so the title can truncate. */}
        <View style={groupColor ? styles.headerTextShrink : undefined}>
          {onBackToChooser && !tutorialOn ? (
            <TouchableOpacity
              onPress={() => {
                onUiTap();
                onBackToChooser();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
            >
              <Text style={[styles.backLink, { color: theme.accent }]}>{copy.tasksBackToChooser}</Text>
            </TouchableOpacity>
          ) : null}
          <View style={styles.titleRow}>
            {groupColor ? <View style={[styles.titleDot, { backgroundColor: groupColor }]} /> : null}
            {/* A group name is the user's own and may be long; built-in titles keep their exact look. */}
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={groupColor ? 1 : undefined}>
              {title}
            </Text>
          </View>
          <Text style={[styles.subtitle, { color: theme.mutedText }]}>
            {todayTasks.length} {copy.tasksActiveToday}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {onOpenCalendar ? (
            <TouchableOpacity
              style={[
                styles.calendarButton,
                { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                tutorialOn && styles.tutorialDisabled,
              ]}
              onPress={onOpenCalendar}
              disabled={tutorialOn}
              hitSlop={{ top: 8, bottom: 8 }}
              accessibilityRole="button"
            >
              <Text style={[styles.calendarButtonText, { color: theme.text }]}>{copy.tasksCalendar}</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: theme.accent },
              tutorialTarget === "add-button" && styles.tutorialHighlight,
              tutorialOn && tutorialTarget !== "add-button" && styles.tutorialDisabled,
            ]}
            onPress={() => {
              setModalVisible(true);
              onUiTap();
            }}
            disabled={tutorialOn && tutorialTarget !== "add-button"}
            hitSlop={{ top: 8, bottom: 8 }}
            accessibilityRole="button"
          >
            <Text style={[styles.addButtonText, { color: theme.accentText }]}>{copy.tasksAdd}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <FilterTab
          label={copy.tasksFilterAll}
          active={filter === "all"}
          onPress={() => setFilter("all")}
          settings={settings}
          disabled={tutorialOn}
        />
        <FilterTab
          label={copy.tasksFilterActive}
          active={filter === TaskStatus.PENDING}
          onPress={() => setFilter(TaskStatus.PENDING)}
          settings={settings}
          disabled={tutorialOn}
        />
        <FilterTab
          label={copy.tasksFilterUpcoming}
          active={filter === "upcoming"}
          onPress={() => setFilter("upcoming")}
          settings={settings}
          disabled={tutorialOn}
        />
        <FilterTab
          label={copy.tasksFilterCompleted}
          active={filter === TaskStatus.COMPLETED}
          onPress={() => setFilter(TaskStatus.COMPLETED)}
          settings={settings}
          disabled={tutorialOn}
        />
        <TouchableOpacity
          style={[
            styles.toolsToggle,
            {
              backgroundColor: toolsOpen ? theme.accentSoft : theme.surfaceMuted,
              borderColor: toolsOpen ? theme.accent : theme.border,
            },
            tutorialOn && styles.tutorialDisabled,
          ]}
          onPress={() => {
            onTaskToolsOpenChange(!toolsOpen);
            onUiTap();
          }}
          disabled={tutorialOn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={toolsOpen ? copy.tasksToolsHide : copy.tasksToolsShow}
          accessibilityState={{ expanded: toolsOpen }}
        >
          <Ionicons name={toolsOpen ? "chevron-up" : "search"} size={16} color={toolsOpen ? theme.accent : theme.mutedText} />
        </TouchableOpacity>
      </View>

      {toolsOpen && (
        <View style={[styles.toolsContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <View>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: theme.surfaceMuted,
                  borderColor: theme.border,
                  color: theme.text,
                },
                tutorialOn && styles.tutorialDisabled,
              ]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={copy.tasksSearchPlaceholder}
              placeholderTextColor={theme.mutedText}
              editable={!tutorialOn}
            />
          </View>

          <View>
            <View style={[styles.quickAddRow, tutorialOn && styles.tutorialDisabled]}>
              <TextInput
                style={[
                  styles.quickAddInput,
                  {
                    backgroundColor: theme.surfaceMuted,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={quickAddName}
                onChangeText={setQuickAddName}
                onSubmitEditing={handleQuickAdd}
                placeholder={copy.tasksQuickAddPlaceholder}
                placeholderTextColor={theme.mutedText}
                returnKeyType="done"
                blurOnSubmit={false}
                editable={!tutorialOn}
                accessibilityLabel={copy.tasksQuickAddPlaceholder}
              />
              <TouchableOpacity
                style={[
                  styles.quickAddButton,
                  { backgroundColor: quickAddName.trim() ? theme.accent : theme.surfaceMuted },
                  !quickAddName.trim() && {
                    borderColor: theme.border,
                    borderWidth: 1,
                  },
                ]}
                onPress={handleQuickAdd}
                disabled={tutorialOn}
                accessibilityRole="button"
                accessibilityLabel={copy.tasksQuickAddAccessibilityLabel}
                accessibilityState={{ disabled: tutorialOn }}
              >
                <Text
                  style={[
                    styles.quickAddButtonText,
                    { color: quickAddName.trim() ? theme.accentText : theme.mutedText },
                  ]}
                  numberOfLines={1}
                >
                  {copy.tasksQuickAddSubmit}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Tasks List */}
      <ScrollView style={styles.content}>
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.text }]}>{copy.tasksEmptyTitle}</Text>
            <Text style={[styles.emptySubtext, { color: theme.mutedText }]}>{copy.tasksEmptySubtitle}</Text>
          </View>
        ) : (
          filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={() => onCompleteTask(task.id)}
              stripeColor={groupColor ?? undefined}
              onOpen={() => {
                setSelectedTask(task);
                onUiTap();
              }}
              settings={settings}
              onStartTimer={() => onStartTimer(task.id)}
              onPauseTimer={() => onPauseTimer(task.id)}
              onResetTimer={() => onResetTimer(task.id)}
              onTimerReady={() => onTimerReady(task.id)}
              tutorialEnabled={tutorialOn}
              tutorialTarget={task.id === tutorialTargetTaskId}
            />
          ))
        )}
      </ScrollView>

      <AddTaskModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          onUiTap();
        }}
        settings={settings}
        customTaskTemplates={customTaskTemplates}
        existingTasks={tasks}
        tutorialEnabled={tutorialCreateFlow}
        tutorialTarget={
          tutorialTarget === "modal-type-predefined" ||
          tutorialTarget === "modal-task-drink-water" ||
          tutorialTarget === "modal-submit"
            ? tutorialTarget
            : null
        }
        onTutorialStateChange={onTutorialStateChange}
        onSubmit={handleAddTask}
        linkTargets={linkTargets}
      />
      <TaskDetailsModal
        visible={selectedTask !== null}
        task={selectedTask}
        settings={settings}
        customTaskTemplates={customTaskTemplates}
        onClose={() => {
          setSelectedTask(null);
          onUiTap();
        }}
        onSave={(task, others) => {
          onUpdateTask(task, others);
          setSelectedTask(null);
        }}
        onDelete={(taskId, others) => {
          onDeleteTask(taskId, others);
          setSelectedTask(null);
        }}
        linkedCopies={selectedCopies}
        onUnlink={
          selectedTask && selectedCopies.length > 0
            ? () => {
                onUnlink(selectedTask.id);
                setSelectedTask(null);
              }
            : undefined
        }
      />
    </SafeAreaView>
  );
}

function TaskItem({
  task,
  stripeColor,
  onComplete,
  onOpen,
  settings,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onTimerReady,
  tutorialEnabled,
  tutorialTarget,
}: {
  task: Task;
  /** Replaces the theme accent on the card's left edge (a group's colour). */
  stripeColor?: string;
  onComplete: () => void;
  onOpen: () => void;
  settings: AppSettings;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResetTimer: () => void;
  onTimerReady: () => void;
  tutorialEnabled: boolean;
  tutorialTarget: boolean;
}) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const locale = getLocaleFromSettings(settings);
  const isCompleted = task.status === TaskStatus.COMPLETED;
  const isScheduled = !isCompleted && task.dueDate > Date.now();
  const predefinedTask = task.predefinedTaskId ? getPredefinedTask(task.predefinedTaskId) : null;
  const priorityLabel =
    task.priority === TaskPriority.HIGH
      ? copy.tasksPriorityHigh
      : task.priority === TaskPriority.LOW
        ? copy.tasksPriorityLow
        : copy.tasksPriorityMedium;

  return (
    <View
      style={[
        styles.taskItem,
        {
          backgroundColor: theme.surface,
          borderLeftColor: stripeColor ?? theme.accent,
        },
        isCompleted && styles.taskItemCompleted,
        tutorialTarget && styles.tutorialHighlight,
        tutorialEnabled && !tutorialTarget && styles.tutorialDisabled,
      ]}
    >
      <TouchableOpacity
        style={[
          styles.checkbox,
          {
            borderColor: theme.border,
            opacity: isScheduled ? 0.45 : 1,
          },
          isCompleted && { backgroundColor: theme.accent, borderColor: theme.accent },
          tutorialTarget && styles.tutorialTargetButton,
        ]}
        onPress={onComplete}
        disabled={isCompleted || isScheduled || (tutorialEnabled && !tutorialTarget)}
        hitSlop={10}
        accessibilityRole="checkbox"
        accessibilityLabel={task.name}
        accessibilityState={{
          checked: isCompleted,
          disabled: isCompleted || isScheduled || (tutorialEnabled && !tutorialTarget),
        }}
      >
        {isCompleted && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.taskContent}
        onPress={tutorialEnabled ? undefined : onOpen}
      >
        <Text
          style={[styles.taskName, { color: theme.text }, isCompleted && styles.taskNameCompleted]}
        >
          {task.name}
        </Text>
        {task.description && (
          <Text style={[styles.taskDescription, { color: theme.mutedText }]}>{task.description}</Text>
        )}
        <View style={styles.taskMeta}>
          <View style={styles.taskColorMeta}>
            <View style={[styles.taskColorDot, { backgroundColor: task.calendarColor }]} />
            <Text style={[styles.taskPriority, { color: theme.mutedText }]}>{priorityLabel}</Text>
          </View>
          <Text style={[styles.taskType, { backgroundColor: theme.surfaceMuted, color: theme.mutedText }]}>
            {taskCategoryLabel(settings.language, predefinedTask ? predefinedTask.category : task.category)}
          </Text>
          <Text style={[styles.taskFrequency, { backgroundColor: theme.accentSoft, color: theme.accent }]}>
            {taskFrequencyLabel(copy, task.frequency)}
          </Text>
          {isScheduled ? (
            <Text style={[styles.taskSchedule, { backgroundColor: theme.warningSoft, color: theme.warning }]}>
              {copy.tasksStartsOn}{" "}
              {new Intl.DateTimeFormat(locale, {
                day: "numeric",
                month: "short",
              }).format(new Date(task.dueDate))}
            </Text>
          ) : null}
        </View>
        <TaskTimerControls
          task={task}
          settings={settings}
          onStart={onStartTimer}
          onPause={onPauseTimer}
          onReset={onResetTimer}
          onReady={onTimerReady}
          disabled={tutorialEnabled}
        />
      </TouchableOpacity>
    </View>
  );
}

function FilterTab({
  label,
  active,
  onPress,
  settings,
  disabled,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  settings: AppSettings;
  disabled: boolean;
}) {
  const theme = getAppTheme(settings.theme);

  return (
    <TouchableOpacity
      style={[
        styles.filterTab,
        {
          backgroundColor: active ? theme.accent : theme.surfaceMuted,
        },
        disabled && styles.tutorialDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      hitSlop={{ top: 8, bottom: 8 }}
      accessibilityRole="tab"
      accessibilityState={{ selected: active, disabled }}
    >
      <Text style={[styles.filterText, { color: active ? theme.accentText : theme.mutedText }]}>
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
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backLink: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  headerTextShrink: {
    flexShrink: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  title: {
    flexShrink: 1,
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#666",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calendarButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  calendarButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#4ecdc4",
    borderRadius: 6,
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
    opacity: 0.36,
  },
  tutorialTargetButton: {
    borderColor: "#ffd166",
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  // Wraps at large font sizes instead of pushing the last chips off screen (#51).
  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 8,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  // Search and quick add share one block: even space above, between and below the two rows.
  toolsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
  },
  searchInput: {
    textAlignVertical: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  quickAddRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quickAddInput: {
    textAlignVertical: "center",
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  quickAddButton: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickAddButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Folds the search and quick add rows away; sits at the end of the filter row.
  toolsToggle: {
    marginLeft: "auto",
    flexShrink: 0,
    width: 32,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#4ecdc4",
  },
  taskItemCompleted: {
    opacity: 0.6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: "#4ecdc4",
    borderColor: "#4ecdc4",
  },
  checkmark: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  taskContent: {
    flex: 1,
  },
  taskName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  taskNameCompleted: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  taskDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
  },
  // The priority sits with the other tags, so the task name gets the card's full width.
  taskMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  taskColorMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  taskColorDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  taskPriority: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  taskType: {
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "#f0f0f0",
    borderRadius: 3,
    color: "#666",
  },
  taskFrequency: {
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "#e8f5f5",
    borderRadius: 3,
    color: "#4ecdc4",
  },
  taskSchedule: {
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
  },
});

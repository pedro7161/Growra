import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import {
  AppSettings,
  CustomTaskTemplate,
  Task,
  TaskFrequency,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "../types";
import AddTaskModal from "../components/AddTaskModal";
import TaskDetailsModal from "../components/TaskDetailsModal";
import { getPredefinedTask } from "../constants/predefinedTasks";
import { createCustomTask, createPredefinedTask } from "../utils/taskFactory";
import { getTodayTasks } from "../utils/taskSchedule";
import TaskTimerControls from "../components/TaskTimerControls";
import { createCustomTaskTemplate } from "../utils/customTaskTemplates";

interface TasksScreenProps {
  settings: AppSettings;
  tasks: Task[];
  customTaskTemplates: CustomTaskTemplate[];
  onAddTask: (task: Task, customTemplate?: CustomTaskTemplate) => void;
  onCompleteTask: (taskId: string) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenCalendar: () => void;
  onStartTimer: (taskId: string) => void;
  onPauseTimer: (taskId: string) => void;
  onResetTimer: (taskId: string) => void;
  onTimerReady: (taskId: string) => void;
}

export default function TasksScreen({
  settings,
  tasks,
  customTaskTemplates,
  onAddTask,
  onCompleteTask,
  onUpdateTask,
  onDeleteTask,
  onOpenCalendar,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onTimerReady,
}: TasksScreenProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const now = Date.now();
  const [filter, setFilter] = useState<TaskStatus | "all" | "upcoming">("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const todayTasks = getTodayTasks(tasks, now);
  const upcomingTasks = tasks.filter((task) => task.status === TaskStatus.PENDING && task.dueDate > now);
  const completedTasks = tasks.filter((task) => task.status === TaskStatus.COMPLETED);

  const baseTasks =
    filter === "all" ? tasks : filter === TaskStatus.PENDING ? todayTasks : filter === "upcoming" ? upcomingTasks : completedTasks;
  const filteredTasks = [...baseTasks]
    .filter((task) => {
      const normalizedQuery = searchQuery.trim().toLowerCase();

      if (!normalizedQuery) {
        return true;
      }

      const predefinedTask = task.predefinedTaskId ? getPredefinedTask(task.predefinedTaskId) : null;

      return (
        task.name.toLowerCase().includes(normalizedQuery) ||
        task.description.toLowerCase().includes(normalizedQuery) ||
        task.category.toLowerCase().includes(normalizedQuery) ||
        task.frequency.toLowerCase().includes(normalizedQuery) ||
        task.type.toLowerCase().includes(normalizedQuery) ||
        (predefinedTask ? predefinedTask.category.toLowerCase().includes(normalizedQuery) : false)
      );
    })
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

  const handleAddTask = (
    values: {
      name: string;
      description: string;
      predefinedTaskId: string;
      customTemplateId: string;
      category: string;
      type: TaskType;
      frequency: TaskFrequency;
      priority: any;
      dueDate: number;
      timerEnabled: boolean;
      timerDurationMinutes: number;
      saveAsTemplate: boolean;
    }
  ) => {
    const newTask =
      values.type === TaskType.PREDEFINED
        ? createPredefinedTask(
            getPredefinedTask(values.predefinedTaskId),
            values.frequency,
            values.dueDate,
            values.timerEnabled,
            values.timerDurationMinutes,
            values.priority
          )
        : createCustomTask(
            values.name,
            values.description,
            values.category,
            values.frequency,
            values.customTemplateId,
            values.dueDate,
            values.timerEnabled,
            values.timerDurationMinutes,
            values.priority
          );
    const customTemplate =
      values.type === TaskType.CUSTOM && values.saveAsTemplate
        ? createCustomTaskTemplate(
            values.name,
            values.description,
            values.category,
            values.customTemplateId
          )
        : undefined;
    onAddTask(newTask, customTemplate);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>{copy.tasksTitle}</Text>
          <Text style={[styles.subtitle, { color: theme.mutedText }]}>
            {todayTasks.length} {copy.tasksActiveToday}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.calendarButton, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
            onPress={onOpenCalendar}
          >
            <Text style={[styles.calendarButtonText, { color: theme.text }]}>{copy.tasksCalendar}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.accent }]}
            onPress={() => setModalVisible(true)}
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
        />
        <FilterTab
          label={copy.tasksFilterActive}
          active={filter === TaskStatus.PENDING}
          onPress={() => setFilter(TaskStatus.PENDING)}
          settings={settings}
        />
        <FilterTab
          label={copy.tasksFilterUpcoming}
          active={filter === "upcoming"}
          onPress={() => setFilter("upcoming")}
          settings={settings}
        />
        <FilterTab
          label={copy.tasksFilterCompleted}
          active={filter === TaskStatus.COMPLETED}
          onPress={() => setFilter(TaskStatus.COMPLETED)}
          settings={settings}
        />
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.surfaceMuted,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={copy.tasksSearchPlaceholder}
          placeholderTextColor={theme.mutedText}
        />
      </View>

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
              onOpen={() => setSelectedTask(task)}
              settings={settings}
              onStartTimer={() => onStartTimer(task.id)}
              onPauseTimer={() => onPauseTimer(task.id)}
              onResetTimer={() => onResetTimer(task.id)}
              onTimerReady={() => onTimerReady(task.id)}
            />
          ))
        )}
      </ScrollView>

      <AddTaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        settings={settings}
        customTaskTemplates={customTaskTemplates}
        onSubmit={handleAddTask}
      />
      <TaskDetailsModal
        visible={selectedTask !== null}
        task={selectedTask}
        settings={settings}
        customTaskTemplates={customTaskTemplates}
        onClose={() => setSelectedTask(null)}
        onSave={(task) => {
          onUpdateTask(task);
          setSelectedTask(null);
        }}
        onDelete={(taskId) => {
          onDeleteTask(taskId);
          setSelectedTask(null);
        }}
      />
    </SafeAreaView>
  );
}

function TaskItem({
  task,
  onComplete,
  onOpen,
  settings,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onTimerReady,
}: {
  task: Task;
  onComplete: () => void;
  onOpen: () => void;
  settings: AppSettings;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResetTimer: () => void;
  onTimerReady: () => void;
}) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const locale = settings.language === "pt" ? "pt-PT" : "en-US";
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
          borderLeftColor: theme.accent,
        },
        isCompleted && styles.taskItemCompleted,
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
        ]}
        onPress={onComplete}
        disabled={isCompleted || isScheduled}
      >
        {isCompleted && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={styles.taskContent} onPress={onOpen}>
        <View style={styles.taskTopRow}>
          <Text
            style={[styles.taskName, { color: theme.text }, isCompleted && styles.taskNameCompleted]}
          >
            {task.name}
          </Text>
          <View style={styles.taskColorMeta}>
            <View style={[styles.taskColorDot, { backgroundColor: task.calendarColor }]} />
            <Text style={[styles.taskPriority, { color: theme.mutedText }]}>{priorityLabel}</Text>
          </View>
        </View>
        {task.description && (
          <Text style={[styles.taskDescription, { color: theme.mutedText }]}>{task.description}</Text>
        )}
        <View style={styles.taskMeta}>
          <Text style={[styles.taskType, { backgroundColor: theme.surfaceMuted, color: theme.mutedText }]}>
            {predefinedTask ? predefinedTask.category : task.category}
          </Text>
          <Text style={[styles.taskFrequency, { backgroundColor: theme.accentSoft, color: theme.accent }]}>
            {task.frequency}
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
        styles.filterTab,
        {
          backgroundColor: active ? theme.accent : theme.surfaceMuted,
        },
      ]}
      onPress={onPress}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
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
  addButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
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
  taskMeta: {
    flexDirection: "row",
    gap: 8,
  },
  taskTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  taskColorMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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

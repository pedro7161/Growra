import {
  TaskPriority,
  PredefinedTaskTemplate,
  Task,
  TaskType,
  TaskFrequency,
  TaskStatus,
} from "../types";
import { DEFAULT_TASK_CALENDAR_COLOR } from "../constants/taskConfig";
import { getStartOfDay } from "./taskSchedule";
import { createTaskTimer } from "./taskTimer";
import { generateId } from "./idUtils";

export function createTask(
  name: string,
  description: string,
  type: TaskType,
  frequency: TaskFrequency,
  predefinedTaskId: string = "",
  customTemplateId: string = "",
  category: string = "",
  dueDate: number = getStartOfDay(Date.now()),
  priority: TaskPriority = TaskPriority.MEDIUM,
  calendarColor: string = DEFAULT_TASK_CALENDAR_COLOR,
  timerEnabled: boolean = false,
  timerDurationMinutes: number = 0
): Task {
  const now = Date.now();
  const durationMs = Math.max(0, Math.round(timerDurationMinutes * 60 * 1000));
  const timerConfig = createTaskTimer(durationMs, timerEnabled);

  return {
    id: generateId(),
    name,
    description,
    predefinedTaskId,
    customTemplateId,
    category,
    type,
    frequency,
    priority,
    calendarColor,
    status: TaskStatus.PENDING,
    dueDate,
    createdAt: now,
    timer: timerConfig,
  };
}

export function createCustomTask(
  name: string,
  description: string,
  category: string,
  frequency: TaskFrequency,
  customTemplateId: string = "",
  dueDate: number = getStartOfDay(Date.now()),
  timerEnabled: boolean = false,
  timerDurationMinutes: number = 0,
  priority: TaskPriority = TaskPriority.MEDIUM
): Task {
  return createTask(
    name,
    description,
    TaskType.CUSTOM,
    frequency,
    "",
    customTemplateId,
    category,
    dueDate,
    priority,
    DEFAULT_TASK_CALENDAR_COLOR,
    timerEnabled,
    timerDurationMinutes
  );
}

export function createPredefinedTask(
  template: PredefinedTaskTemplate,
  frequency: TaskFrequency,
  dueDate: number = getStartOfDay(Date.now()),
  timerEnabled: boolean = false,
  timerDurationMinutes: number = 0,
  priority: TaskPriority = TaskPriority.MEDIUM
): Task {
  return createTask(
    template.name,
    template.description,
    TaskType.PREDEFINED,
    frequency,
    template.id,
    "",
    template.category,
    dueDate,
    priority,
    template.calendarColor,
    timerEnabled,
    timerDurationMinutes
  );
}

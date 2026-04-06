import { TaskPriority, PredefinedTaskTemplate, Task, TaskType, TaskFrequency, TaskStatus } from "../types";
import { DEFAULT_TASK_CALENDAR_COLOR } from "../constants/taskConfig";
import { getStartOfDay } from "./taskSchedule";

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function createTask(
  name: string,
  description: string,
  type: TaskType,
  frequency: TaskFrequency,
  predefinedTaskId: string = "",
  dueDate: number = getStartOfDay(Date.now()),
  priority: TaskPriority = TaskPriority.MEDIUM,
  calendarColor: string = DEFAULT_TASK_CALENDAR_COLOR
): Task {
  const now = Date.now();

  return {
    id: generateId(),
    name,
    description,
    predefinedTaskId,
    type,
    frequency,
    priority,
    calendarColor,
    status: TaskStatus.PENDING,
    dueDate,
    createdAt: now,
  };
}

export function createCustomTask(
  name: string,
  description: string,
  frequency: TaskFrequency
): Task {
  return createTask(name, description, TaskType.CUSTOM, frequency);
}

export function createPredefinedTask(
  template: PredefinedTaskTemplate,
  frequency: TaskFrequency
): Task {
  return createTask(
    template.name,
    template.description,
    TaskType.PREDEFINED,
    frequency,
    template.id,
    getStartOfDay(Date.now()),
    TaskPriority.MEDIUM,
    template.calendarColor
  );
}

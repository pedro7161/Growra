import { Task, TaskType, TaskFrequency, TaskStatus } from "../types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function createTask(
  name: string,
  description: string,
  type: TaskType,
  frequency: TaskFrequency,
  dueDate?: number
): Task {
  const now = Date.now();

  return {
    id: generateId(),
    name,
    description,
    type,
    frequency,
    status: TaskStatus.PENDING,
    dueDate: dueDate || now + 24 * 60 * 60 * 1000, // Default: tomorrow
    createdAt: now,
  };
}

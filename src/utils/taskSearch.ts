import { getPredefinedTask } from "../constants/predefinedTasks";
import { AppLanguage, Task } from "../types";
import { taskCategoryLabel } from "./taskLabels";

/**
 * Does the task match the Tasks screen search? Lives outside the screen so the wiring is testable
 * (#58): a task with no category must stay findable by its shown label ("Uncategorised" /
 * "Sem categoria"), which only works because the label is matched as well as the raw category.
 */
export function taskMatchesSearch(task: Task, query: string, language: AppLanguage): boolean {
  const normalizedQuery = query.trim().toLowerCase();

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
    (predefinedTask ? predefinedTask.category.toLowerCase().includes(normalizedQuery) : false) ||
    taskCategoryLabel(language, predefinedTask ? predefinedTask.category : task.category)
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

import { CustomTaskTemplate, Task } from "../types";
import { generateId } from "./idUtils";

export function createCustomTaskTemplate(
  name: string,
  description: string,
  category: string,
  templateId: string = ""
): CustomTaskTemplate {
  return {
    id: templateId || generateId(),
    name,
    description,
    category,
    createdAt: Date.now(),
  };
}

export function upsertCustomTaskTemplate(
  templates: CustomTaskTemplate[],
  template: CustomTaskTemplate
): CustomTaskTemplate[] {
  const existingIndex = templates.findIndex((item) => item.id === template.id);

  if (existingIndex === -1) {
    return [...templates, template];
  }

  return templates.map((item) => (item.id === template.id ? template : item));
}

export function getCustomTaskTemplateGroups(
  templates: CustomTaskTemplate[]
): { category: string; tasks: CustomTaskTemplate[] }[] {
  const categories = [...new Set(templates.map((template) => template.category))];

  return categories.map((category) => ({
    category,
    tasks: templates.filter((template) => template.category === category),
  }));
}

function sameTemplateKey(a: { name: string; category: string }, b: { name: string; category: string }): boolean {
  return (
    a.name.trim().toLowerCase() === b.name.trim().toLowerCase() &&
    a.category.trim().toLowerCase() === b.category.trim().toLowerCase()
  );
}

/**
 * Snapshots a task's reusable fields into a template. The task is only read, so
 * progress, status and dates never leak into the template.
 */
export function templateFromTask(task: Task, templateId: string = ""): CustomTaskTemplate {
  const timerMinutes = task.timer.enabled ? Math.round(task.timer.duration / 60000) : 0;
  return {
    ...createCustomTaskTemplate(task.name, task.description, task.category, templateId),
    frequency: task.frequency,
    priority: task.priority,
    ...(task.durationMinutes ? { durationMinutes: task.durationMinutes } : {}),
    ...(timerMinutes > 0 ? { timerMinutes } : {}),
  };
}

/**
 * Saves a task as a template. A template with the same name and category is
 * updated in place, so repeated taps never create duplicate entries.
 */
export function saveTaskAsTemplate(
  templates: CustomTaskTemplate[],
  task: Task,
): { templates: CustomTaskTemplate[]; template: CustomTaskTemplate } {
  const existing = templates.find((item) => sameTemplateKey(item, task));
  const template = templateFromTask(task, existing?.id ?? "");
  const kept = existing ? { ...template, createdAt: existing.createdAt } : template;
  return { templates: upsertCustomTaskTemplate(templates, kept), template: kept };
}

/** Removes a template only; tasks made from it keep their own copy of every field. */
export function removeCustomTaskTemplate(templates: CustomTaskTemplate[], templateId: string): CustomTaskTemplate[] {
  return templates.filter((item) => item.id !== templateId);
}

/** Drops malformed entries and repeated ids from stored templates (old saves, hand-edited imports). */
export function normalizeCustomTaskTemplates(raw: unknown): CustomTaskTemplate[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: CustomTaskTemplate[] = [];
  for (const item of raw) {
    if (!item || typeof item.id !== "string" || !item.id || typeof item.name !== "string" || seen.has(item.id)) continue;
    seen.add(item.id);
    result.push({
      ...item,
      description: typeof item.description === "string" ? item.description : "",
      category: typeof item.category === "string" ? item.category : "",
      createdAt: typeof item.createdAt === "number" ? item.createdAt : 0,
    });
  }
  return result;
}

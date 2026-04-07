import { CustomTaskTemplate } from "../types";
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

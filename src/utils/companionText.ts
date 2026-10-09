import { getAppCopy } from "../constants/appCopy";

type AppCopy = ReturnType<typeof getAppCopy>;

/** A companion's description in the app's language, falling back to the English original. */
export function companionDescription(copy: AppCopy, template: { id: string; description: string }): string {
  return copy.companionBios[template.id] ?? template.description;
}

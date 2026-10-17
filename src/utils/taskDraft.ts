/** The one thing that still stops a custom task from being saved. */
export type CustomTaskDraftProblem = "name-missing";

export interface CustomTaskDraft {
  name: string;
  category: string;
}

/**
 * Why a custom task can't be saved yet, or null when it can.
 *
 * Only the name is required: Growra is free-form, so a task with no category saves and
 * shows as uncategorised instead of the Add button doing nothing (#47).
 */
export function customTaskDraftProblem(draft: CustomTaskDraft): CustomTaskDraftProblem | null {
  return draft.name.trim() ? null : "name-missing";
}

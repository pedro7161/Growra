import { GameState, HolderId, Task, WorkEditScope, WorkItem } from "../types";
import { applyTaskDeleted, applyTaskUpdated } from "./gameplay";
import { applyLinkedOccurrenceEdit, applyLinkedTaskDelete, applyLinkedTaskEdit, linkedHolders } from "./groupLinks";
import { getHolderWorkItems, setHolderWorkItems } from "./groups";
import { addDaysToKey, occurrenceChange, WorkItemFields } from "./workForm";
import { getOccurrencesBetween, withValidCompletions } from "./workSchedule";

/**
 * The forms' side of linked copies (utils/groupLinks): what an edit changed, and which other holders hold a copy.
 * Only what the player actually edited travels to the other copies, so a copy changed on its own keeps the rest.
 */

/** The task fields a player edits in the details form; progress (status, ticks) is never an edit. */
const EDITED_TASK_FIELDS = [
  "name",
  "description",
  "category",
  "type",
  "predefinedTaskId",
  "customTemplateId",
  "frequency",
  "priority",
  "calendarColor",
  "durationMinutes",
  "dueDate",
] as const satisfies readonly (keyof Task)[];

/** The fields that differ between the task before and after an edit (the timer when it was switched or resized). */
export function taskEditChange(before: Task, after: Task): Partial<Task> {
  const change: Partial<Task> = {};
  for (const field of EDITED_TASK_FIELDS) {
    if (before[field] !== after[field]) (change as Record<string, unknown>)[field] = after[field];
  }
  if (before.timer.enabled !== after.timer.enabled || before.timer.duration !== after.timer.duration) {
    change.timer = after.timer;
  }
  return change;
}

/** The other holders with a copy of this item, in Personal, Work, then group order. */
export function otherCopyHolders(state: GameState, holder: HolderId, item: { linkId?: string }): HolderId[] {
  if (!item.linkId) return [];
  return [...new Set(linkedHolders(state, item.linkId).map((entry) => entry.holder))].filter(
    (candidate) => candidate !== holder,
  );
}

/**
 * Carries an edit to the copies in `others`. When the Personal copy is among them it is a Personal edit too, so a
 * moved Personal task counts as a reschedule, the same as editing it in Personal (groups never count).
 */
export function editTaskCopies(state: GameState, linkId: string, others: HolderId[], change: Partial<Task>): GameState {
  const next = applyLinkedTaskEdit(state, linkId, others, change);
  if (!others.includes("personal")) return next;
  const before = state.tasks.find((task) => task.linkId === linkId);
  const after = next.tasks.find((task) => task.linkId === linkId);
  return before && after && before !== after ? applyTaskUpdated(next, before, after) : next;
}

/** Deletes the copies in `others`; a deleted Personal copy counts as a Personal delete (an overdue one is cleared). */
export function deleteTaskCopies(state: GameState, linkId: string, others: HolderId[]): GameState {
  const personal = others.includes("personal") ? state.tasks.find((task) => task.linkId === linkId) : undefined;
  const next = applyLinkedTaskDelete(state, linkId, others);
  return personal ? applyTaskDeleted(next, personal) : next;
}

/** Another holder with a copy of an item, by the name the player sees. */
export interface LinkedCopy {
  holder: HolderId;
  name: string;
}

/** The other copies of an item with their names (Personal and Work take the caller's localised names). */
export function linkedCopies(
  state: GameState,
  holder: HolderId,
  item: { linkId?: string },
  builtInNames: { personal: string; work: string },
): LinkedCopy[] {
  return otherCopyHolders(state, holder, item).map((other) => ({
    holder: other,
    name:
      other === "personal" || other === "work"
        ? builtInNames[other]
        : (state.groups.find((group) => group.id === other)?.name ?? other),
  }));
}

/** The whole-item fields of the work form, with the ones a one-off edit changed. */
const WORK_FIELDS = [
  "name",
  "description",
  "calendarColor",
  "startMinutes",
  "endMinutes",
  "startDateKey",
  "repeat",
  "end",
] as const satisfies readonly (keyof WorkItemFields)[];

const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

function changedWorkFields(item: WorkItem, fields: WorkItemFields): Partial<WorkItemFields> {
  const change: Partial<WorkItemFields> = {};
  for (const field of WORK_FIELDS) {
    if (!same(item[field], fields[field])) (change as Record<string, unknown>)[field] = fields[field];
  }
  return change;
}

/** A one-off item is edited whole: each chosen copy takes just the fields that changed. */
function editOneOffs(state: GameState, linkId: string, holders: HolderId[], change: Partial<WorkItemFields>): GameState {
  let next = state;
  for (const holder of new Set(holders)) {
    const items = getHolderWorkItems(next, holder);
    if (!items.some((candidate) => candidate.linkId === linkId)) continue;
    next = setHolderWorkItems(
      next,
      holder,
      items.map((candidate) => (candidate.linkId === linkId ? withValidCompletions({ ...candidate, ...change }) : candidate)),
    );
  }
  return next;
}

/**
 * True when the work form's edit of `item` on `dateKey` would change something in `scope` (null for a one-off item),
 * the same test applyLinkedWorkEdit makes, so an untouched form never asks about the copies.
 */
export function changesWorkItem(item: WorkItem, dateKey: string, fields: WorkItemFields, scope: WorkEditScope | null): boolean {
  if (scope === null) return Object.keys(changedWorkFields(item, fields)).length > 0;
  const occurrence = getOccurrencesBetween([item], dateKey, addDaysToKey(dateKey, 1))[0];
  if (!occurrence) return false;
  if (Object.keys(occurrenceChange(occurrence, fields)).length > 0) return true;
  return (
    scope === "following" &&
    (item.calendarColor !== fields.calendarColor || !same(item.repeat, fields.repeat) || !same(item.end, fields.end))
  );
}

/**
 * Applies the work form's edit of `item` on `dateKey` to its linked copy in each chosen holder (the item's own holder
 * included when chosen). `scope` is null for a one-off item. "Only this one" writes the same partial change
 * occurrenceChange gives; "This and all following" splits each copy and also carries a changed colour, repeat or
 * end rule into the continued items, which then share one new link.
 */
export function applyLinkedWorkEdit(
  state: GameState,
  linkId: string,
  holders: HolderId[],
  item: WorkItem,
  dateKey: string,
  fields: WorkItemFields,
  scope: WorkEditScope | null,
  newId: () => string,
): GameState {
  if (scope === null) {
    const change = changedWorkFields(item, fields);
    return Object.keys(change).length === 0 ? state : editOneOffs(state, linkId, holders, change);
  }
  const occurrence = getOccurrencesBetween([item], dateKey, addDaysToKey(dateKey, 1))[0];
  if (!occurrence) return state;
  const change = occurrenceChange(occurrence, fields);
  if (scope === "one") {
    return Object.keys(change).length === 0
      ? state
      : applyLinkedOccurrenceEdit(state, linkId, holders, dateKey, change, "one", newId);
  }

  const idsBefore = new Set(
    [...new Set(holders)].flatMap((holder) => getHolderWorkItems(state, holder).map((candidate) => candidate.id)),
  );
  const split = applyLinkedOccurrenceEdit(state, linkId, holders, dateKey, change, "following", newId);
  const rule: Partial<WorkItem> = {};
  if (item.calendarColor !== fields.calendarColor) rule.calendarColor = fields.calendarColor;
  if (!same(item.repeat, fields.repeat)) rule.repeat = fields.repeat;
  // An unchanged end rule keeps the remaining count the split worked out.
  if (!same(item.end, fields.end)) rule.end = fields.end;
  if (Object.keys(rule).length === 0) return split;
  let next = split;
  for (const holder of new Set(holders)) {
    const items = getHolderWorkItems(next, holder);
    if (items.every((candidate) => idsBefore.has(candidate.id))) continue;
    next = setHolderWorkItems(
      next,
      holder,
      items.map((candidate) => (idsBefore.has(candidate.id) ? candidate : withValidCompletions({ ...candidate, ...rule }))),
    );
  }
  return next;
}

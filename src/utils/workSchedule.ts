// Work schedule date engine: turns work items (a repeat rule plus per-date exceptions) into occurrences,
// and applies "only this one" / "this and following" edits. Pure functions only.
//
// Dates are stepped on the local calendar (new Date(y, m, d + n)), never by adding milliseconds, so
// occurrences keep their wall-clock time across daylight-saving changes.
import { WorkEditScope, WorkException, WorkItem, WorkOccurrence } from "../types";

type WorkChange = Omit<Extract<WorkException, { kind: "change" }>, "kind">;

// Stops a rule that can never produce a date (or a very long scan) from looping forever: ~100 years of days.
const MAX_STEPS = 36_600;

const pad = (n: number) => String(n).padStart(2, "0");

const keyOf = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseKey = (key: string): [number, number, number] => {
  const [y, m, d] = key.split("-").map(Number);
  return [y, m - 1, d];
};

const addDays = (key: string, days: number) => {
  const [y, m, d] = parseKey(key);
  return keyOf(new Date(y, m, d + days));
};

export function toDateKey(ts: number): string {
  return keyOf(new Date(ts));
}

/** Local midnight at the start of the given date key. */
export function dateKeyToStart(key: string): number {
  const [y, m, d] = parseKey(key);
  return new Date(y, m, d).getTime();
}

/** Every date the repeat rule produces from the start date on, in order, before the end rule and exceptions. */
function* repeatDates(item: WorkItem): Generator<string> {
  const [y, m, d] = parseKey(item.startDateKey);
  const repeat = item.repeat;
  if (repeat.kind === "none") {
    yield item.startDateKey;
    return;
  }
  const interval = Math.max(1, Math.floor(repeat.interval) || 1);
  if (repeat.kind === "days") {
    for (let step = 0; step < MAX_STEPS; step += 1) yield keyOf(new Date(y, m, d + step * interval));
    return;
  }
  if (repeat.kind === "weeks") {
    const chosen = [...new Set(repeat.weekdays.filter((day) => day >= 0 && day <= 6))].sort(
      (a, b) => ((a + 6) % 7) - ((b + 6) % 7),
    );
    const weekdays = chosen.length > 0 ? chosen : [new Date(y, m, d).getDay()];
    const monday = d - ((new Date(y, m, d).getDay() + 6) % 7); // weeks run Monday-Sunday, counted from the start date's week
    for (let week = 0; week * 7 < MAX_STEPS; week += interval) {
      for (const weekday of weekdays) {
        const key = keyOf(new Date(y, m, monday + week * 7 + ((weekday + 6) % 7)));
        if (key >= item.startDateKey) yield key;
      }
    }
    return;
  }
  for (let month = 0; month < MAX_STEPS / 30; month += interval) {
    const date = new Date(y, m + month, d);
    if (date.getDate() === d) yield keyOf(date); // otherwise the month lacks this day (e.g. the 31st)
  }
}

/** The item's dates with its end rule applied; skipped dates are included (they count toward "count"). */
function* seriesDates(item: WorkItem): Generator<string> {
  let produced = 0;
  for (const key of repeatDates(item)) {
    if (item.end.kind === "until" && key > item.end.dateKey) return;
    if (item.end.kind === "count" && produced >= item.end.count) return;
    produced += 1;
    yield key;
  }
}

function toOccurrence(item: WorkItem, dateKey: string): WorkOccurrence | null {
  const exception = item.exceptions[dateKey];
  if (exception?.kind === "skip") return null;
  const change = exception?.kind === "change" ? exception : undefined;
  const startMinutes = change?.startMinutes ?? item.startMinutes;
  const endMinutes = change?.endMinutes ?? item.endMinutes;
  const [y, m, d] = parseKey(dateKey);
  const endDay = endMinutes <= startMinutes ? d + 1 : d;
  return {
    itemId: item.id,
    dateKey,
    start: new Date(y, m, d, 0, startMinutes).getTime(),
    end: new Date(y, m, endDay, 0, endMinutes).getTime(),
    name: change?.name ?? item.name,
    description: change?.description ?? item.description,
    calendarColor: item.calendarColor,
    completed: item.completedDateKeys.includes(dateKey),
  };
}

const byStart = (a: WorkOccurrence, b: WorkOccurrence) =>
  a.start - b.start || (a.itemId < b.itemId ? -1 : a.itemId > b.itemId ? 1 : 0);

/** Occurrences whose start date is in [fromKey, toKeyExclusive), sorted by start. */
export function getOccurrencesBetween(items: WorkItem[], fromKey: string, toKeyExclusive: string): WorkOccurrence[] {
  const occurrences: WorkOccurrence[] = [];
  for (const item of items) {
    for (const key of seriesDates(item)) {
      if (key >= toKeyExclusive) break;
      if (key < fromKey) continue;
      const occurrence = toOccurrence(item, key);
      if (occurrence) occurrences.push(occurrence);
    }
  }
  return occurrences.sort(byStart);
}

/** First occurrence of the item, from yesterday on (a night shift can still be running), that passes the test. */
function findOccurrence(item: WorkItem, now: number, test: (o: WorkOccurrence) => boolean): WorkOccurrence | null {
  const fromKey = addDays(toDateKey(now), -1);
  for (const key of seriesDates(item)) {
    if (key < fromKey) continue;
    const occurrence = toOccurrence(item, key);
    if (occurrence && test(occurrence)) return occurrence;
  }
  return null;
}

function earliest(items: WorkItem[], now: number, test: (o: WorkOccurrence) => boolean): WorkOccurrence | null {
  const found = items
    .map((item) => findOccurrence(item, now, test))
    .filter((o): o is WorkOccurrence => o !== null)
    .sort(byStart);
  return found[0] ?? null;
}

/** The next occurrence to work: the first not completed whose end is still ahead (it may be running now). */
export function getNextOccurrence(items: WorkItem[], now: number): WorkOccurrence | null {
  return earliest(items, now, (o) => !o.completed && o.end > now);
}

/** The occurrence running at `now` (start <= now < end) that has not been ticked off yet. */
export function getRunningOccurrence(items: WorkItem[], now: number): WorkOccurrence | null {
  // Each item's first open occurrence that has not ended is the only one that can be running, so the scan stays short.
  const first = earliest(items, now, (o) => !o.completed && o.end > now);
  return first && first.start <= now ? first : null;
}

/** Completable from its start until the end of the day after its start day, if not completed yet. */
export function canCompleteOccurrence(o: WorkOccurrence, now: number): boolean {
  return !o.completed && now >= o.start && now < dateKeyToStart(addDays(o.dateKey, 2));
}

export function createWorkItem(
  fields: Omit<WorkItem, "id" | "exceptions" | "completedDateKeys" | "createdAt">,
  id: string,
  now: number,
): WorkItem {
  return { ...fields, id, exceptions: {}, completedDateKeys: [], createdAt: now };
}

/** The item keeping only the completions that are still occurrences (after its start date or repeat rule changed). */
export function withValidCompletions(item: WorkItem): WorkItem {
  if (item.completedDateKeys.length === 0) return item;
  const valid = new Set(seriesDates(item));
  return { ...item, completedDateKeys: item.completedDateKeys.filter((key) => valid.has(key)) };
}

/** Only the fields actually given, so a change never writes `undefined` over an earlier value. */
function definedChange(change: WorkChange): WorkChange {
  const result: WorkChange = {};
  if (change.name !== undefined) result.name = change.name;
  if (change.description !== undefined) result.description = change.description;
  if (change.startMinutes !== undefined) result.startMinutes = change.startMinutes;
  if (change.endMinutes !== undefined) result.endMinutes = change.endMinutes;
  return result;
}

const pickExceptions = (exceptions: Record<string, WorkException>, keep: (key: string) => boolean) =>
  Object.fromEntries(Object.entries(exceptions).filter(([key]) => keep(key)));

/** The old item ended the day before `dateKey`, keeping only what lies before it. */
function endBefore(item: WorkItem, dateKey: string): WorkItem {
  return {
    ...item,
    end: { kind: "until", dateKey: addDays(dateKey, -1) },
    exceptions: pickExceptions(item.exceptions, (key) => key < dateKey),
    completedDateKeys: item.completedDateKeys.filter((key) => key < dateKey),
  };
}

/** A copy of the item starting at `dateKey`, with the remaining count and the exceptions/completions from then on. */
function continueFrom(item: WorkItem, dateKey: string, change: WorkChange, newId: () => string): WorkItem | null {
  let end = item.end;
  if (end.kind === "count") {
    let before = 0;
    for (const key of seriesDates(item)) {
      if (key >= dateKey) break;
      before += 1;
    }
    const remaining = end.count - before;
    if (remaining <= 0) return null;
    end = { kind: "count", count: remaining };
  }
  const exceptions = pickExceptions(item.exceptions, (key) => key >= dateKey);
  // The edited date takes the new values, so drop the fields the change now sets from its old exception.
  const own = exceptions[dateKey];
  if (own?.kind === "change") {
    const rest = definedChange(own);
    for (const field of Object.keys(change) as (keyof WorkChange)[]) delete rest[field];
    if (Object.keys(rest).length > 0) exceptions[dateKey] = { kind: "change", ...rest };
    else delete exceptions[dateKey];
  }
  return {
    ...item,
    ...change,
    id: newId(),
    startDateKey: dateKey,
    end,
    exceptions,
    completedDateKeys: item.completedDateKeys.filter((key) => key >= dateKey),
  };
}

/**
 * Edits one date ("one": an exception on that date) or the series from that date on ("following": the old
 * item ends the day before, or is removed when dateKey is its first date, and a new item starts at dateKey).
 */
export function editOccurrence(
  items: WorkItem[],
  itemId: string,
  dateKey: string,
  change: WorkChange,
  scope: WorkEditScope,
  newId: () => string,
): WorkItem[] {
  const values = definedChange(change);
  return items.flatMap((item) => {
    if (item.id !== itemId) return [item];
    if (scope === "one") {
      const previous = item.exceptions[dateKey];
      const merged = previous?.kind === "change" ? { ...previous, ...values } : { kind: "change" as const, ...values };
      return [{ ...item, exceptions: { ...item.exceptions, [dateKey]: merged } }];
    }
    const next = continueFrom(item, dateKey, values, newId);
    const kept = dateKey <= item.startDateKey ? [] : [endBefore(item, dateKey)];
    return next ? [...kept, next] : kept;
  });
}

/** Deletes one date (a skip) or the series from that date on. A one-off item is removed outright. */
export function deleteOccurrence(items: WorkItem[], itemId: string, dateKey: string, scope: WorkEditScope): WorkItem[] {
  return items.flatMap((item) => {
    if (item.id !== itemId) return [item];
    if (item.repeat.kind === "none") return [];
    if (scope === "one") return [{ ...item, exceptions: { ...item.exceptions, [dateKey]: { kind: "skip" as const } } }];
    return dateKey <= item.startDateKey ? [] : [endBefore(item, dateKey)];
  });
}

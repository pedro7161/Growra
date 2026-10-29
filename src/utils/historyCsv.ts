import { DayRecord, GameState, Group, Task, TaskStatus, WorkItem, WorkOccurrence } from "../types";
import { dateKeyToStart, getOccurrencesBetween, toDateKey } from "./workSchedule";

export function csvField(value: string | number): string {
  // A cell starting with = + - @ (or a tab/CR) runs as a formula in spreadsheet apps; the
  // leading ' makes it plain text. Numbers are left alone so negative values stay numbers.
  const text = typeof value === "string" && /^[=+\-@\t\r]/.test(value) ? `'${value}` : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map(csvField).join(",")).join("\r\n") + "\r\n";
}

const pad = (value: number) => String(value).padStart(2, "0");

function localDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function localTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function buildTasksCsv(tasks: Task[]): string {
  return toCsv([
    ["name", "category", "frequency", "priority", "due_date", "status"],
    ...tasks.map((task) => [task.name, task.category, task.frequency, task.priority, localDate(task.dueDate), task.status]),
  ]);
}

/** One row per logged completion (the save keeps up to 30 a day). */
export function buildCompletionsCsv(days: DayRecord[]): string {
  const completions = days
    .flatMap((day) => day.completions)
    .sort((left, right) => left.at - right.at);
  return toCsv([["date", "time", "task"], ...completions.map((item) => [localDate(item.at), localTime(item.at), item.name])]);
}

/** The end time, with (+1) when it falls on the next day. */
function occurrenceEnd(o: WorkOccurrence): string {
  return localTime(o.end) + (toDateKey(o.end) === o.dateKey ? "" : " (+1)");
}

/** The export range: the earliest work item start to today. Null when there is nothing to export. */
export function getWorkExportRange(items: WorkItem[], now: number): { fromKey: string; toKey: string } | null {
  if (items.length === 0) return null;
  const fromKey = items.reduce((earliest, item) => (item.startDateKey < earliest ? item.startDateKey : earliest), items[0].startDateKey);
  return { fromKey, toKey: toDateKey(now) };
}

/** One row per occurrence from fromKey to toKey, both inclusive, oldest first. */
export function buildWorkCsv(items: WorkItem[], fromKey: string, toKey: string): string {
  const dayAfterTo = new Date(dateKeyToStart(toKey));
  dayAfterTo.setDate(dayAfterTo.getDate() + 1);
  const occurrences = getOccurrencesBetween(items, fromKey, toDateKey(dayAfterTo.getTime()));
  return toCsv([
    ["date", "start", "end", "name", "completed"],
    ...occurrences.map((o) => [o.dateKey, localTime(o.start), occurrenceEnd(o), o.name, o.completed ? "yes" : "no"]),
  ]);
}

/**
 * One row per group list task and per group schedule occurrence dated fromKey to toKey, both inclusive.
 * A ticked task is dated by its completion, an open one by its due date; rows follow the group order.
 */
export function buildGroupsCsv(state: GameState, fromKey: string, toKey: string): string {
  const rows: (string | number)[][] = [];
  for (const group of state.groups) {
    const taskRows = group.tasks
      .map((task) => {
        const done = task.status === TaskStatus.COMPLETED && task.completedAt !== undefined;
        return { date: localDate(done ? (task.completedAt as number) : task.dueDate), task, done };
      })
      .filter((row) => row.date >= fromKey && row.date <= toKey)
      .sort((left, right) => (left.date < right.date ? -1 : left.date > right.date ? 1 : 0));
    for (const row of taskRows) rows.push([group.name, "task", row.date, "", "", row.task.name, row.done ? "yes" : "no"]);
    const dayAfterTo = new Date(dateKeyToStart(toKey));
    dayAfterTo.setDate(dayAfterTo.getDate() + 1);
    for (const o of getOccurrencesBetween(group.workItems, fromKey, toDateKey(dayAfterTo.getTime()))) {
      rows.push([group.name, "schedule", o.dateKey, localTime(o.start), occurrenceEnd(o), o.name, o.completed ? "yes" : "no"]);
    }
  }
  return toCsv([["group", "type", "date", "start", "end", "name", "completed"], ...rows]);
}

/** The group export range: the earliest item date to today (or to the last task date, if later). Null when there is nothing to export. */
export function getGroupsExportRange(groups: Group[], now: number): { fromKey: string; toKey: string } | null {
  const keys = groups.flatMap((group) => [
    ...group.tasks.map((task) => localDate(task.status === TaskStatus.COMPLETED && task.completedAt !== undefined ? task.completedAt : task.dueDate)),
    ...group.workItems.map((item) => item.startDateKey),
  ]);
  if (keys.length === 0) return null;
  const today = toDateKey(now);
  const sorted = [...keys].sort();
  return { fromKey: sorted[0], toKey: sorted[sorted.length - 1] > today ? sorted[sorted.length - 1] : today };
}

import { DayRecord, Task, WorkItem } from "../types";
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
    ...occurrences.map((o) => [o.dateKey, localTime(o.start), localTime(o.end) + (toDateKey(o.end) === o.dateKey ? '' : ' (+1)'), o.name, o.completed ? "yes" : "no"]),
  ]);
}

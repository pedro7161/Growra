import { GameState, Group, TaskFrequency, TaskPriority, WorkItem } from "../src/types";
import { addTaskWithCopies, addWorkItemWithCopies, linkedHolders } from "../src/utils/groupLinks";
import { createGroup, getHolderTasks, getHolderWorkItems } from "../src/utils/groups";
import { createInitialGameState } from "../src/utils/initialState";
import {
  applyLinkedWorkEdit,
  changesWorkItem,
  deleteTaskCopies,
  editTaskCopies,
  linkedCopies,
  otherCopyHolders,
  taskEditChange,
} from "../src/utils/linkedEdits";
import { createCustomTask } from "../src/utils/taskFactory";
import { WorkItemFields } from "../src/utils/workForm";
import { createWorkItem, getOccurrencesBetween } from "../src/utils/workSchedule";

// jest.config.js runs in Europe/Lisbon.
const local = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min).getTime();
const NOW = local(2026, 11, 20, 10, 15);

function ids(prefix: string): () => string {
  let next = 0;
  return () => `${prefix}${++next}`;
}

function withGroups(groups: [string, Group["kind"]][]): GameState {
  let state = createInitialGameState();
  for (const [id, kind] of groups) {
    const result = createGroup(state, { name: id, color: "#ff8800", kind }, id, NOW);
    if ("error" in result) throw new Error(result.error);
    state = result;
  }
  return state;
}

const saturdays = (): WorkItem =>
  createWorkItem(
    {
      name: "Sat shift",
      description: "",
      calendarColor: "#3366ff",
      startMinutes: 9 * 60,
      endMinutes: 17 * 60,
      startDateKey: "2026-11-21",
      repeat: { kind: "weeks", interval: 1, weekdays: [6] },
      end: { kind: "never" },
    },
    "w1",
    NOW,
  );

const fieldsOf = (item: WorkItem): WorkItemFields => ({
  name: item.name,
  description: item.description,
  calendarColor: item.calendarColor,
  startMinutes: item.startMinutes,
  endMinutes: item.endMinutes,
  startDateKey: item.startDateKey,
  repeat: item.repeat,
  end: item.end,
});

function linkedShift(item: WorkItem = saturdays()) {
  const state = withGroups([
    ["ana", "schedule"],
    ["rui", "schedule"],
  ]);
  const linked = addWorkItemWithCopies(state, "work", item, ["ana", "rui"], ids("n"));
  return { linked, item: linked.workItems[0], linkId: linked.workItems[0].linkId! };
}

const datesOf = (items: WorkItem[]) =>
  getOccurrencesBetween(items, "2026-11-21", "2026-12-13").map((occurrence) => `${occurrence.dateKey} ${occurrence.name}`);

describe("taskEditChange", () => {
  it("keeps only the fields the player edited", () => {
    const before = { ...createCustomTask("Dishes", "", "home", TaskFrequency.DAILY, "", NOW, true, 10), id: "t1" };
    expect(taskEditChange(before, { ...before })).toEqual({});
    const after = { ...before, name: "Dishes!", priority: TaskPriority.HIGH, durationMinutes: 15 };
    expect(taskEditChange(before, after)).toEqual({ name: "Dishes!", priority: TaskPriority.HIGH, durationMinutes: 15 });
    // A cleared length travels as undefined; a timer change sends the timer.
    const withLength = { ...before, durationMinutes: 20 };
    expect(taskEditChange(withLength, { ...withLength, durationMinutes: undefined })).toEqual({ durationMinutes: undefined });
    expect("durationMinutes" in taskEditChange(withLength, { ...withLength, durationMinutes: undefined })).toBe(true);
    const longer = { ...before, timer: { ...before.timer, duration: before.timer.duration * 2 } };
    expect(taskEditChange(before, longer)).toEqual({ timer: longer.timer });
    // A running timer's own state is not an edit.
    const running = { ...before, timer: { ...before.timer, state: "running" as const, startedAt: NOW } };
    expect(taskEditChange(before, running)).toEqual({});
  });
});

describe("otherCopyHolders", () => {
  it("lists the other holders of a linked item, never the item's own", () => {
    const state = withGroups([
      ["ana", "list"],
      ["rui", "list"],
    ]);
    const task = { ...createCustomTask("Dishes", "", "home", TaskFrequency.DAILY, "", NOW), id: "t1" };
    const linked = addTaskWithCopies(state, "personal", task, ["ana", "rui"], ids("n"));
    const original = linked.tasks.find((candidate) => candidate.id === "t1")!;
    expect(otherCopyHolders(linked, "personal", original)).toEqual(["ana", "rui"]);
    const ana = linked.groups[0].tasks[0];
    expect(otherCopyHolders(linked, "ana", ana)).toEqual(["personal", "rui"]);
    expect(otherCopyHolders(linked, "personal", task)).toEqual([]);
    expect(linkedCopies(linked, "ana", ana, { personal: "Pessoal", work: "Trabalho" })).toEqual([
      { holder: "personal", name: "Pessoal" },
      { holder: "rui", name: "rui" },
    ]);
  });
});

describe("editTaskCopies / deleteTaskCopies", () => {
  const DAY = 24 * 60 * 60 * 1000;
  function linkedTask(dueDate: number) {
    const state = { ...withGroups([["ana", "list"], ["rui", "list"]]), coins: 75 };
    const task = { ...createCustomTask("Dishes", "", "home", TaskFrequency.DAILY, "", dueDate), id: "t1" };
    const linked = addTaskWithCopies(state, "ana", task, ["rui"], ids("n"));
    // Personal holds a copy too (made from Personal in the app; added here by hand).
    const linkId = getHolderTasks(linked, "ana")[0].linkId!;
    return { linked: { ...linked, tasks: [{ ...task, id: "p1", linkId }] }, linkId };
  }

  it("a group edit that moves the Personal copy counts as a Personal reschedule; groups never count", () => {
    const { linked, linkId } = linkedTask(Date.now());
    const later = { dueDate: Date.now() + 3 * DAY };
    const onlyRui = editTaskCopies(linked, linkId, ["rui"], later);
    expect(getHolderTasks(onlyRui, "rui")[0].dueDate).toBe(later.dueDate);
    expect(onlyRui.usage).toBe(linked.usage);
    const withPersonal = editTaskCopies(linked, linkId, ["personal", "rui"], later);
    expect(withPersonal.tasks[0].dueDate).toBe(later.dueDate);
    expect(withPersonal.usage.rescheduled).toBe(linked.usage.rescheduled + 1);
    expect(withPersonal.coins).toBe(75);
  });

  it("deleting copies removes them from the chosen holders only", () => {
    const { linked, linkId } = linkedTask(Date.now() - 2 * DAY);
    const next = deleteTaskCopies(linked, linkId, ["personal"]);
    expect(next.tasks).toEqual([]);
    expect(getHolderTasks(next, "ana")).toHaveLength(1);
    expect(getHolderTasks(next, "rui")).toHaveLength(1);
    // The Personal copy was overdue: deleting it clears it, as in Personal.
    expect(next.usage.overdueCleared).toBe(linked.usage.overdueCleared + 1);
    expect(deleteTaskCopies(linked, linkId, ["rui"]).usage).toBe(linked.usage);
  });
});

describe("applyLinkedWorkEdit", () => {
  it("'one' writes only the changed fields on that date in each chosen copy", () => {
    const { linked, item, linkId } = linkedShift();
    const next = applyLinkedWorkEdit(
      linked,
      linkId,
      ["work", "ana"],
      item,
      "2026-11-28",
      { ...fieldsOf(item), startMinutes: 10 * 60 },
      "one",
      ids("e"),
    );
    expect(next.workItems[0].exceptions).toEqual({ "2026-11-28": { kind: "change", startMinutes: 600 } });
    expect(getHolderWorkItems(next, "ana")[0].exceptions).toEqual({ "2026-11-28": { kind: "change", startMinutes: 600 } });
    expect(getHolderWorkItems(next, "rui")).toBe(getHolderWorkItems(linked, "rui"));
    // Nothing changed: nothing written.
    expect(applyLinkedWorkEdit(linked, linkId, ["work", "ana"], item, "2026-11-28", fieldsOf(item), "one", ids("e"))).toBe(linked);
  });

  it("'following' splits the chosen copies, carries colour and repeat over, and links the continuations", () => {
    const { linked, item, linkId } = linkedShift();
    const fields = { ...fieldsOf(item), name: "Late shift", calendarColor: "#d35454" };
    const next = applyLinkedWorkEdit(linked, linkId, ["work", "ana"], item, "2026-11-28", fields, "following", ids("e"));

    for (const holder of ["work", "ana"] as const) {
      const items = getHolderWorkItems(next, holder);
      expect(items).toHaveLength(2);
      expect(items[1]).toMatchObject({ name: "Late shift", calendarColor: "#d35454", startDateKey: "2026-11-28" });
      expect(items[0].calendarColor).toBe("#3366ff");
      expect(datesOf(items)).toEqual(["2026-11-21 Sat shift", "2026-11-28 Late shift", "2026-12-05 Late shift", "2026-12-12 Late shift"]);
    }
    expect(getHolderWorkItems(next, "rui")).toBe(getHolderWorkItems(linked, "rui"));
    const continued = next.workItems[1].linkId!;
    expect(continued).not.toBe(linkId);
    expect(getHolderWorkItems(next, "ana")[1].linkId).toBe(continued);
    // Rui (left out) keeps the old link with the ended parts.
    expect(linkedHolders(next, linkId).map((entry) => entry.holder)).toEqual(["work", "ana", "rui"]);
  });

  it("a one-off item is replaced field by field in each chosen copy", () => {
    const oneOff = { ...saturdays(), repeat: { kind: "none" as const } };
    const { linked, item, linkId } = linkedShift(oneOff);
    const anaOwn = { ...getHolderWorkItems(linked, "ana")[0], description: "Ana's note" };
    const state = {
      ...linked,
      groups: linked.groups.map((group) => (group.id === "ana" ? { ...group, workItems: [anaOwn] } : group)),
    };
    const fields = { ...fieldsOf(item), endMinutes: 18 * 60, startDateKey: "2026-11-22" };
    const next = applyLinkedWorkEdit(state, linkId, ["work", "ana"], item, "2026-11-21", fields, null, ids("e"));
    expect(next.workItems[0]).toMatchObject({ endMinutes: 1080, startDateKey: "2026-11-22", id: item.id });
    // Only the edited fields travel: Ana's own note stays.
    expect(getHolderWorkItems(next, "ana")[0]).toMatchObject({ endMinutes: 1080, startDateKey: "2026-11-22", description: "Ana's note" });
    expect(getHolderWorkItems(next, "rui")[0]).toMatchObject({ endMinutes: 17 * 60, startDateKey: "2026-11-21" });
  });
});

describe("changesWorkItem", () => {
  it("is false for an untouched form in every scope, so the copies prompt is not shown", () => {
    const item = saturdays();
    const oneOff = { ...item, repeat: { kind: "none" as const } };
    expect(changesWorkItem(oneOff, "2026-11-21", fieldsOf(oneOff), null)).toBe(false);
    expect(changesWorkItem(item, "2026-11-28", fieldsOf(item), "one")).toBe(false);
    expect(changesWorkItem(item, "2026-11-28", fieldsOf(item), "following")).toBe(false);
  });

  it("is true for a change that reaches the copies in that scope", () => {
    const item = saturdays();
    const oneOff = { ...item, repeat: { kind: "none" as const } };
    expect(changesWorkItem(oneOff, "2026-11-21", { ...fieldsOf(oneOff), calendarColor: "#ff0000" }, null)).toBe(true);
    expect(changesWorkItem(item, "2026-11-28", { ...fieldsOf(item), name: "Late shift" }, "one")).toBe(true);
    expect(changesWorkItem(item, "2026-11-28", { ...fieldsOf(item), endMinutes: 18 * 60 }, "following")).toBe(true);
    expect(changesWorkItem(item, "2026-11-28", { ...fieldsOf(item), calendarColor: "#ff0000" }, "following")).toBe(true);
    // A colour is not a one-day change, so "only this one" with just a new colour changes nothing.
    expect(changesWorkItem(item, "2026-11-28", { ...fieldsOf(item), calendarColor: "#ff0000" }, "one")).toBe(false);
  });
});

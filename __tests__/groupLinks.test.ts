import { GameState, Group, TaskFrequency, TaskPriority, TaskStatus, WorkItem } from "../src/types";
import {
  addTaskWithCopies,
  addWorkItemWithCopies,
  applyLinkedOccurrenceDelete,
  applyLinkedOccurrenceEdit,
  applyLinkedTaskDelete,
  applyLinkedTaskEdit,
  linkTargets,
  linkedHolders,
  unlink,
} from "../src/utils/groupLinks";
import { createGroup, getHolderTasks, getHolderWorkItems, setHolderWorkItems } from "../src/utils/groups";
import { createInitialGameState } from "../src/utils/initialState";
import { createCustomTask } from "../src/utils/taskFactory";
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

const dailyShift = (id = "w1"): WorkItem =>
  createWorkItem(
    {
      name: "Shift",
      description: "",
      calendarColor: "#3366ff",
      startMinutes: 9 * 60,
      endMinutes: 17 * 60,
      startDateKey: "2026-11-20",
      repeat: { kind: "days", interval: 1 },
      end: { kind: "never" },
    },
    id,
    local(2026, 11, 1),
  );

describe("groupLinks", () => {
  it("adding to 2 groups creates 3 linked items with fresh ids and no completions", () => {
    const state = withGroups([
      ["ana", "list"],
      ["rui", "list"],
      ["shifts", "schedule"],
    ]);
    const task = {
      ...createCustomTask("Dishes", "", "home", TaskFrequency.DAILY, "", local(2026, 11, 20)),
      id: "t1",
      completedAt: NOW,
    };
    const next = addTaskWithCopies(state, "personal", task, ["ana", "rui", "shifts", "missing"], ids("n"));

    const original = getHolderTasks(next, "personal").find((candidate) => candidate.id === "t1");
    const anaCopy = getHolderTasks(next, "ana")[0];
    const ruiCopy = getHolderTasks(next, "rui")[0];
    expect(original?.linkId).toBeDefined();
    expect(anaCopy.linkId).toBe(original?.linkId);
    expect(ruiCopy.linkId).toBe(original?.linkId);
    expect(new Set([original?.id, anaCopy.id, ruiCopy.id, original?.linkId]).size).toBe(4);
    expect(original?.completedAt).toBe(NOW);
    expect(anaCopy.completedAt).toBeUndefined();
    expect(anaCopy).toEqual({ ...task, id: anaCopy.id, linkId: original?.linkId, completedAt: undefined });
    expect(getHolderWorkItems(next, "shifts")).toEqual([]);
    expect(linkedHolders(next, original!.linkId!)).toEqual([
      { holder: "personal", id: "t1" },
      { holder: "ana", id: anaCopy.id },
      { holder: "rui", id: ruiCopy.id },
    ]);

    const work = withGroups([
      ["ana", "schedule"],
      ["bea", "schedule"],
    ]);
    const item = { ...dailyShift(), completedDateKeys: ["2026-11-20"] };
    const added = addWorkItemWithCopies(work, "work", item, ["ana", "bea"], ids("m"));
    const all = [...added.workItems, ...getHolderWorkItems(added, "ana"), ...getHolderWorkItems(added, "bea")];
    expect(all).toHaveLength(3);
    expect(new Set(all.map((candidate) => candidate.id)).size).toBe(3);
    expect(new Set(all.map((candidate) => candidate.linkId)).size).toBe(1);
    expect(added.workItems[0].completedDateKeys).toEqual(["2026-11-20"]);
    expect(getHolderWorkItems(added, "ana")[0].completedDateKeys).toEqual([]);

    // No valid target: the item is added on its own, without a link.
    const alone = addTaskWithCopies(state, "personal", task, ["shifts"], ids("x"));
    expect(alone.tasks.find((candidate) => candidate.id === "t1")?.linkId).toBeUndefined();
  });

  it("linked delete of a task removes it only from the chosen holders", () => {
    const state = withGroups([
      ["ana", "list"],
      ["rui", "list"],
    ]);
    const task = { ...createCustomTask("Dishes", "", "home", TaskFrequency.DAILY, "", NOW), id: "t1" };
    const linked = addTaskWithCopies(state, "personal", task, ["ana", "rui"], ids("n"));
    const linkId = linked.tasks.find((candidate) => candidate.id === "t1")!.linkId!;

    const next = applyLinkedTaskDelete(linked, linkId, ["personal", "ana"]);
    expect(next.tasks.some((candidate) => candidate.id === "t1")).toBe(false);
    expect(getHolderTasks(next, "ana")).toEqual([]);
    expect(getHolderTasks(next, "rui")).toHaveLength(1);
    expect(applyLinkedTaskDelete(linked, "nope", ["personal", "ana"])).toBe(linked);
  });

  it("linked task edit changes only the propagated fields of the chosen copies", () => {
    const state = withGroups([
      ["ana", "list"],
      ["rui", "list"],
    ]);
    const task = { ...createCustomTask("Dishes", "", "home", TaskFrequency.DAILY, "", NOW, true, 10), id: "t1" };
    let linked = addTaskWithCopies(state, "personal", task, ["ana", "rui"], ids("n"));
    const linkId = linked.tasks.find((candidate) => candidate.id === "t1")!.linkId!;
    // The Ana copy was ticked off on its own and its timer is running.
    const anaBefore = getHolderTasks(linked, "ana")[0];
    linked = {
      ...linked,
      groups: linked.groups.map((group) =>
        group.id === "ana"
          ? {
              ...group,
              tasks: [
                {
                  ...anaBefore,
                  status: TaskStatus.COMPLETED,
                  completedAt: NOW,
                  dueDate: NOW + 1,
                  timer: { ...anaBefore.timer, state: "running" as const, startedAt: NOW },
                },
              ],
            }
          : group,
      ),
    };

    const next = applyLinkedTaskEdit(linked, linkId, ["ana", "personal"], {
      id: "hijack",
      linkId: "hijack",
      name: "Wash up",
      priority: TaskPriority.HIGH,
      timer: { ...task.timer },
    });
    const ana = getHolderTasks(next, "ana")[0];
    expect(ana).toMatchObject({
      id: anaBefore.id,
      linkId,
      name: "Wash up",
      priority: TaskPriority.HIGH,
      status: TaskStatus.COMPLETED,
      completedAt: NOW,
      dueDate: NOW + 1,
    });
    expect(ana.timer.state).toBe("running");
    expect(next.tasks.find((candidate) => candidate.id === "t1")?.name).toBe("Wash up");
    expect(getHolderTasks(next, "rui")[0].name).toBe("Dishes");

    // Turning the timer off reaches every chosen copy.
    const off = applyLinkedTaskEdit(next, linkId, ["ana"], { timer: { ...task.timer, enabled: false } });
    expect(getHolderTasks(off, "ana")[0].timer.enabled).toBe(false);
    expect(applyLinkedTaskEdit(next, linkId, ["ana"], { name: "Wash up" })).toBe(next);
  });

  it("linked 'following' edit on copies with different one-day exceptions keeps each copy's earlier exceptions", () => {
    let state = withGroups([
      ["ana", "schedule"],
      ["bea", "schedule"],
    ]);
    state = addWorkItemWithCopies(state, "work", dailyShift(), ["ana", "bea"], ids("c"));
    const linkId = state.workItems[0].linkId!;
    const anaItem = getHolderWorkItems(state, "ana")[0];
    const beaItem = getHolderWorkItems(state, "bea")[0];
    state = setHolderWorkItems(state, "ana", [
      { ...anaItem, exceptions: { "2026-11-21": { kind: "change", name: "Ana early" } } },
    ]);
    state = setHolderWorkItems(state, "bea", [{ ...beaItem, exceptions: { "2026-11-22": { kind: "skip" } } }]);

    const next = applyLinkedOccurrenceEdit(
      state,
      linkId,
      ["work", "ana", "bea"],
      "2026-11-24",
      { startMinutes: 10 * 60 },
      "following",
      ids("s"),
    );

    const continued: WorkItem[] = [];
    for (const holder of ["work", "ana", "bea"]) {
      const items = getHolderWorkItems(next, holder);
      expect(items).toHaveLength(2);
      const [ended, rest] = items;
      expect(ended.linkId).toBe(linkId);
      expect(ended.end).toEqual({ kind: "until", dateKey: "2026-11-23" });
      expect(rest.startDateKey).toBe("2026-11-24");
      expect(rest.startMinutes).toBe(10 * 60);
      continued.push(rest);
    }
    expect(new Set(continued.map((item) => item.linkId)).size).toBe(1);
    expect(continued[0].linkId).not.toBe(linkId);
    expect(new Set(continued.map((item) => item.id)).size).toBe(3);

    const ana = getHolderWorkItems(next, "ana");
    expect(getOccurrencesBetween(ana, "2026-11-21", "2026-11-22")[0].name).toBe("Ana early");
    const bea = getHolderWorkItems(next, "bea");
    expect(getOccurrencesBetween(bea, "2026-11-20", "2026-11-25").map((o) => o.dateKey)).toEqual([
      "2026-11-20",
      "2026-11-21",
      "2026-11-23",
      "2026-11-24",
    ]);

    // A later edit of a past date still reaches the ended items through the old linkId.
    const past = applyLinkedOccurrenceEdit(next, linkId, ["work", "ana"], "2026-11-20", { name: "Day one" }, "one", ids("p"));
    expect(getOccurrencesBetween(past.workItems, "2026-11-20", "2026-11-21")[0].name).toBe("Day one");
    expect(getOccurrencesBetween(getHolderWorkItems(past, "ana"), "2026-11-20", "2026-11-21")[0].name).toBe("Day one");
    expect(getOccurrencesBetween(getHolderWorkItems(past, "bea"), "2026-11-20", "2026-11-21")[0].name).toBe("Shift");

    // A one-day edit does not undo a copy's own skip; a one-day delete skips that date in each chosen copy.
    const kept = applyLinkedOccurrenceEdit(next, linkId, ["bea"], "2026-11-22", { name: "X" }, "one", ids("q"));
    expect(kept).toBe(next);
    const skipped = applyLinkedOccurrenceDelete(next, linkId, ["work", "ana"], "2026-11-21", "one");
    expect(getOccurrencesBetween(skipped.workItems, "2026-11-21", "2026-11-22")).toEqual([]);
    expect(getOccurrencesBetween(getHolderWorkItems(skipped, "ana"), "2026-11-21", "2026-11-22")).toEqual([]);
    expect(getOccurrencesBetween(getHolderWorkItems(skipped, "bea"), "2026-11-21", "2026-11-22")).toHaveLength(1);
    const cut = applyLinkedOccurrenceDelete(next, continued[0].linkId!, ["work", "ana", "bea"], "2026-11-24", "following");
    expect(cut.workItems).toHaveLength(1);
    expect(getHolderWorkItems(cut, "bea")).toHaveLength(1);
  });

  it("unlinked copy is untouched by a later linked edit", () => {
    const state = withGroups([
      ["ana", "list"],
      ["rui", "list"],
    ]);
    const task = { ...createCustomTask("Dishes", "", "home", TaskFrequency.DAILY, "", NOW), id: "t1" };
    const linked = addTaskWithCopies(state, "personal", task, ["ana", "rui"], ids("n"));
    const linkId = linked.tasks.find((candidate) => candidate.id === "t1")!.linkId!;
    const anaId = getHolderTasks(linked, "ana")[0].id;

    const unlinked = unlink(linked, "ana", anaId);
    expect(getHolderTasks(unlinked, "ana")[0].linkId).toBeUndefined();
    expect(unlink(unlinked, "ana", anaId)).toBe(unlinked);
    expect(linkedHolders(unlinked, linkId).map((entry) => entry.holder)).toEqual(["personal", "rui"]);

    const next = applyLinkedTaskEdit(unlinked, linkId, ["personal", "ana", "rui"], { name: "Wash up" });
    expect(getHolderTasks(next, "ana")[0].name).toBe("Dishes");
    expect(getHolderTasks(next, "rui")[0].name).toBe("Wash up");

    let work = withGroups([["ana", "schedule"]]);
    work = addWorkItemWithCopies(work, "work", dailyShift(), ["ana"], ids("c"));
    const workLink = work.workItems[0].linkId!;
    const copy = getHolderWorkItems(work, "ana")[0];
    const free = unlink(work, "ana", copy.id);
    const edited = applyLinkedOccurrenceEdit(free, workLink, ["work", "ana"], "2026-11-21", { name: "X" }, "one", ids("z"));
    expect(getHolderWorkItems(edited, "ana")[0]).toEqual({ ...copy, linkId: undefined });
  });

  it("linkTargets lists only groups of the matching kind, excluding the source", () => {
    const state = withGroups([
      ["ana", "list"],
      ["shifts", "schedule"],
      ["rui", "list"],
      ["bea", "schedule"],
    ]);
    expect(linkTargets(state, "list", "personal").map((group) => group.id)).toEqual(["ana", "rui"]);
    expect(linkTargets(state, "list", "ana").map((group) => group.id)).toEqual(["rui"]);
    expect(linkTargets(state, "schedule", "bea").map((group) => group.id)).toEqual(["shifts"]);
  });
});

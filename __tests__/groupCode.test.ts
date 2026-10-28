import { GameState, Group, Task, TaskFrequency, TaskPriority, TaskStatus, WorkItem } from "../src/types";
import {
  GROUP_CODE_VERSION,
  GroupShare,
  buildGroupShare,
  decodeGroupCode,
  encodeGroupCode,
  findImportedGroup,
  importGroupCode,
  shareSummary,
} from "../src/utils/groupCode";
import { MAX_GROUPS, createGroup } from "../src/utils/groups";
import { createInitialGameState } from "../src/utils/initialState";
import { encodeShareCode } from "../src/utils/shareCode";
import { createCustomTask } from "../src/utils/taskFactory";
import { getStartOfDay } from "../src/utils/taskSchedule";
import { createWorkItem } from "../src/utils/workSchedule";

const NOW = new Date(2026, 9, 28, 15, 30).getTime();

function idMaker(prefix = "n"): () => string {
  let next = 0;
  return () => `${prefix}${(next += 1)}`;
}

function withGroup(state: GameState, group: Partial<Group> & Pick<Group, "id" | "kind">): GameState {
  const created = createGroup(state, { name: group.name ?? "Group", color: group.color ?? "#f80", kind: group.kind }, group.id, 1);
  if ("error" in created) throw new Error(created.error);
  return {
    ...created,
    groups: created.groups.map((candidate) => (candidate.id === group.id ? { ...candidate, ...group } : candidate)),
  };
}

function shift(id: string, fields: Partial<WorkItem> = {}): WorkItem {
  return {
    ...createWorkItem(
      {
        name: "Shift",
        description: "",
        calendarColor: "#1f7a73",
        startMinutes: 540,
        endMinutes: 1020,
        startDateKey: "2026-10-26",
        repeat: { kind: "none" },
        end: { kind: "never" },
      },
      id,
      5,
    ),
    ...fields,
  };
}

function decodeOk(code: string): GroupShare {
  const decoded = decodeGroupCode(code);
  if (!("share" in decoded)) throw new Error(`expected a share, got ${decoded.error}`);
  return decoded.share;
}

function asState(result: GameState | { error: "cap" }): GameState {
  if ("error" in result) throw new Error(result.error);
  return result;
}

describe("group codes", () => {
  it("round-trips a schedule group with repeats and exceptions; no completions, no linkId", () => {
    const items: WorkItem[] = [
      shift("w1", {
        name: "Night shift ☾ Piso 3",
        description: "Ala B, café às 2h",
        calendarColor: "#08f",
        startMinutes: 1320,
        endMinutes: 360,
        repeat: { kind: "weeks", interval: 1, weekdays: [1, 3, 5] },
        end: { kind: "count", count: 12 },
        exceptions: {
          "2026-10-28": { kind: "skip" },
          "2026-10-30": { kind: "change", name: "Short", startMinutes: 1380 },
        },
        completedDateKeys: ["2026-10-26"],
        linkId: "link-1",
      }),
      shift("w2", { repeat: { kind: "months", interval: 2 }, end: { kind: "until", dateKey: "2027-06-01" } }),
      shift("w3", { repeat: { kind: "days", interval: 3 } }),
    ];
    const state = withGroup(createInitialGameState(), { id: "g1", name: "Team", color: "#0a8", kind: "schedule", workItems: items });

    const built = buildGroupShare(state, "g1");
    expect(built).toMatchObject({ sourceId: "g1", name: "Team", color: "#0a8", kind: "schedule", tasks: [] });
    expect(built.workItems).toHaveLength(3);
    for (const item of built.workItems) {
      expect(item.id).toBe("");
      expect(item.completedDateKeys).toEqual([]);
      expect("linkId" in item).toBe(false);
    }

    const code = encodeGroupCode(built);
    expect(code).toMatch(new RegExp(`^GROWRA-GROUP-${GROUP_CODE_VERSION}-[A-Za-z0-9_-]+-[0-9a-f]{8}$`));
    expect(code).not.toContain("link-1");
    const decoded = decodeOk(`  ${code}\n`);
    expect(decoded).toEqual(built);
    expect(decoded.workItems[0]).toMatchObject({
      name: "Night shift ☾ Piso 3",
      description: "Ala B, café às 2h",
      calendarColor: "#08f",
      startMinutes: 1320,
      endMinutes: 360,
      startDateKey: "2026-10-26",
      repeat: { kind: "weeks", interval: 1, weekdays: [1, 3, 5] },
      end: { kind: "count", count: 12 },
      exceptions: items[0].exceptions,
    });
    expect(shareSummary(decoded)).toEqual({ count: 3, kind: "schedule" });

    const imported = asState(importGroupCode(createInitialGameState(), decoded, NOW, idMaker(), "new"));
    const group = imported.groups[0];
    expect(group).toMatchObject({ name: "Team", color: "#0a8", kind: "schedule", sourceId: "g1", createdAt: NOW });
    expect(group.workItems.map((item) => item.id)).toEqual(["n2", "n3", "n4"]);
    expect(group.workItems.every((item) => item.completedDateKeys.length === 0 && item.linkId === undefined)).toBe(true);
    expect(group.workItems[0].startDateKey).toBe("2026-10-26");
    expect(group.workItems[0].createdAt).toBe(NOW);
  });

  it("round-trips a list group with priority, length and frequency", () => {
    const daily: Task = {
      ...createCustomTask("Stretch", "Ten minutes", "health", TaskFrequency.DAILY, "", 0, true, 10, TaskPriority.HIGH, 30),
      status: TaskStatus.COMPLETED,
      completedAt: 123,
      dueDate: 999_999,
      linkId: "link-2",
    };
    const weekly = createCustomTask("Groceries", "", "", TaskFrequency.WEEKLY, "", 0, false, 0, TaskPriority.LOW);
    const once = { ...createCustomTask("Call Ana", "", "social", TaskFrequency.ONCE, "", 0), calendarColor: "#c3a" };
    const doneOnce = { ...createCustomTask("Done already", "", "", TaskFrequency.ONCE, "", 0), status: TaskStatus.COMPLETED };
    const state = withGroup(createInitialGameState(), {
      id: "g1", name: "Home", kind: "list", sourceId: "friend:g9", tasks: [daily, weekly, once, doneOnce],
    });

    const built = buildGroupShare(state, "g1");
    expect(built.sourceId).toBe("friend:g9");
    // A one-time task that is already done is not part of the list any more.
    expect(built.tasks.map((task) => task.name)).toEqual(["Stretch", "Groceries", "Call Ana"]);
    const code = encodeGroupCode(built);
    expect(code).not.toContain("link-2");
    const decoded = decodeOk(code);
    expect(decoded).toEqual(built);
    expect(decoded.tasks[0]).toMatchObject({
      name: "Stretch", description: "Ten minutes", category: "health", frequency: TaskFrequency.DAILY,
      priority: TaskPriority.HIGH, durationMinutes: 30, status: TaskStatus.PENDING,
      timer: { enabled: true, duration: 600_000, state: "idle", remainingMs: 600_000 },
    });
    expect(decoded.tasks[0].completedAt).toBeUndefined();
    expect(decoded.tasks[1]).toMatchObject({ frequency: TaskFrequency.WEEKLY, priority: TaskPriority.LOW });
    expect(decoded.tasks[1].durationMinutes).toBeUndefined();
    expect(decoded.tasks[2].calendarColor).toBe("#c3a");
    expect(shareSummary(decoded)).toEqual({ count: 3, kind: "list" });

    const imported = asState(importGroupCode(createInitialGameState(), decoded, NOW, idMaker(), "new"));
    const tasks = imported.groups[0].tasks;
    expect(tasks.map((task) => task.id)).toEqual(["n2", "n3", "n4"]);
    for (const task of tasks) {
      expect(task).toMatchObject({ status: TaskStatus.PENDING, dueDate: getStartOfDay(NOW), createdAt: NOW });
      expect(task.completedAt).toBeUndefined();
      expect(task.linkId).toBeUndefined();
    }
  });

  it("truncated, edited-checksum, wrong-prefix and newer-version codes are errors", () => {
    const state = withGroup(createInitialGameState(), { id: "g1", kind: "schedule", workItems: [shift("w1")] });
    const code = encodeGroupCode(buildGroupShare(state, "g1"));
    const [, body, sum] = code.match(/^GROWRA-GROUP-1-(.+)-([0-9a-f]{8})$/) ?? [];

    expect(decodeGroupCode(code.slice(0, -3))).toEqual({ error: "format" });
    expect(decodeGroupCode(`GROWRA-GROUP-1-${body.slice(0, -4)}-${sum}`)).toEqual({ error: "checksum" });
    const flipped = sum[0] === "0" ? `1${sum.slice(1)}` : `0${sum.slice(1)}`;
    expect(decodeGroupCode(`GROWRA-GROUP-1-${body}-${flipped}`)).toEqual({ error: "checksum" });
    expect(decodeGroupCode(code.replace("GROWRA-GROUP-", "GROWRA-ROOM-"))).toEqual({ error: "format" });
    expect(decodeGroupCode(code.replace("GROWRA-GROUP-1-", "GROWRA-GROUP-2-"))).toEqual({ error: "newer" });
    expect(decodeGroupCode("")).toEqual({ error: "format" });

    // A correct envelope with content that is not a group is a format error, never a throw.
    for (const payload of ["not json", "null", "[]", '{"v":1}', '["g1","Team","#fff","x",[]]', '["g1","","#fff","s",[]]', '["g1","Team","#fff","s",{}]']) {
      expect(decodeGroupCode(encodeShareCode("GROWRA-GROUP-", 1, payload))).toEqual({ error: "format" });
    }
    // Inside a valid group, an invalid item is dropped and the rest kept.
    const mixed = decodeOk(
      encodeShareCode("GROWRA-GROUP-", 1, JSON.stringify(["g1", "Team", "#fff", "s", [{ n: "Ok", s: 60, e: 120, a: "2026-10-28" }, { n: "Bad", s: 60 }, 7, null]])),
    );
    expect(mixed.workItems.map((item) => item.name)).toEqual(["Ok"]);
  });

  it("import at 10 groups returns cap error and leaves state equal", () => {
    let state = createInitialGameState();
    for (let index = 0; index < MAX_GROUPS; index += 1) state = withGroup(state, { id: `g${index}`, kind: "list" });
    const before = JSON.parse(JSON.stringify(state));
    const shared = decodeOk(encodeGroupCode(buildGroupShare(state, "g0")));
    expect(importGroupCode(state, shared, NOW, idMaker(), "new")).toEqual({ error: "cap" });
    expect(state).toEqual(before);
  });

  it("importing a code from the same source offers update (findImportedGroup) and 'update' replaces items only", () => {
    const sender = withGroup(createInitialGameState(), {
      id: "g1", name: "Team", color: "#0a8", kind: "schedule", workItems: [shift("w1", { name: "Monday" })],
    });
    const first = decodeOk(encodeGroupCode(buildGroupShare(sender, "g1")));
    expect(findImportedGroup(createInitialGameState(), first.sourceId)).toBeUndefined();

    let receiver = asState(importGroupCode(createInitialGameState(), first, NOW, idMaker("a"), "new"));
    const local = receiver.groups[0];
    // The receiver renames it, collapses it on the dashboard and shows it in the calendar.
    receiver = {
      ...receiver,
      groups: [{ ...local, name: "Ana's shifts", color: "#123" }],
      settings: { ...receiver.settings, dashboardCollapsed: { ...receiver.settings.dashboardCollapsed, [local.id]: true }, calendarShow: [local.id] },
    };
    expect(findImportedGroup(receiver, "g1")?.id).toBe(local.id);

    const newer = decodeOk(
      encodeGroupCode(buildGroupShare({ ...sender, groups: [{ ...sender.groups[0], workItems: [shift("w1", { name: "Tuesday" }), shift("w2", { name: "Friday" })] }] }, "g1")),
    );
    const updated = asState(importGroupCode(receiver, newer, NOW + 1, idMaker("b"), "update"));
    expect(updated.groups).toHaveLength(1);
    expect(updated.groups[0]).toMatchObject({ id: local.id, name: "Ana's shifts", color: "#123", sourceId: "g1", createdAt: local.createdAt });
    expect(updated.groups[0].workItems.map((item) => [item.id, item.name])).toEqual([["b1", "Tuesday"], ["b2", "Friday"]]);
    expect(updated.settings).toEqual(receiver.settings);

    const copy = asState(importGroupCode(receiver, newer, NOW + 1, idMaker("c"), "new"));
    expect(copy.groups).toHaveLength(2);
    expect(copy.groups[1]).toMatchObject({ name: "Team", sourceId: "g1" });
  });

  it("sharing Work produces a schedule share named after Work; importing it never touches state.workItems", () => {
    const sender = { ...createInitialGameState(), playerId: "player-7", workItems: [shift("w1"), shift("w2", { linkId: "x" })] };
    const built = buildGroupShare(sender, "work", "Trabalho");
    expect(built).toMatchObject({ sourceId: "player-7:work", name: "Trabalho", kind: "schedule", tasks: [] });
    expect(built.workItems).toHaveLength(2);
    expect(buildGroupShare(sender, "personal", "Pessoal")).toMatchObject({ sourceId: "player-7:personal", name: "Pessoal", kind: "list" });

    const receiver = { ...createInitialGameState(), playerId: "player-9", coins: 40, workItems: [shift("mine")] };
    const imported = asState(importGroupCode(receiver, decodeOk(encodeGroupCode(built)), NOW, idMaker(), "new"));
    expect(imported.workItems).toBe(receiver.workItems);
    expect(imported.tasks).toBe(receiver.tasks);
    expect(imported.coins).toBe(40);
    expect(imported.groups[0]).toMatchObject({ name: "Trabalho", kind: "schedule", sourceId: "player-7:work" });
    expect(imported.groups[0].workItems).toHaveLength(2);
  });
});

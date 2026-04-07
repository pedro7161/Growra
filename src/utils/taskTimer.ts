import { Task, TaskTimer } from "../types";

export function createTaskTimer(durationMs: number, enabled: boolean): TaskTimer {
  const normalized = Math.max(0, durationMs);

  return {
    enabled,
    duration: normalized,
    state: "idle",
    startedAt: 0,
    remainingMs: normalized,
  };
}

export function computeTimerRemaining(timer: TaskTimer, now = Date.now()): number {
  if (!timer.enabled) {
    return 0;
  }

  if (timer.state === "running") {
    const elapsed = now - timer.startedAt;
    return Math.max(0, timer.remainingMs - elapsed);
  }

  return timer.remainingMs;
}

export function updateTaskTimerDuration(task: Task, nextDurationMs: number): Task {
  if (!task.timer.enabled) {
    return task;
  }

  const duration = Math.max(0, nextDurationMs);
  const currentRemaining = computeTimerRemaining(task.timer);
  const durationDelta = duration - task.timer.duration;

  if (task.timer.state === "idle") {
    return updateTaskTimer(task, {
      ...task.timer,
      duration,
      remainingMs: duration,
      startedAt: 0,
    });
  }

  if (task.timer.state === "ready") {
    return updateTaskTimer(task, {
      ...task.timer,
      duration,
      state: "idle",
      remainingMs: duration,
      startedAt: 0,
    });
  }

  const remainingMs = Math.max(0, currentRemaining + durationDelta);

  if (remainingMs === 0) {
    return updateTaskTimer(task, {
      ...task.timer,
      duration,
      state: "ready",
      remainingMs: 0,
      startedAt: 0,
    });
  }

  if (task.timer.state === "running") {
    return updateTaskTimer(task, {
      ...task.timer,
      duration,
      remainingMs,
      startedAt: Date.now(),
    });
  }

  return updateTaskTimer(task, {
    ...task.timer,
    duration,
    remainingMs,
    startedAt: 0,
  });
}

function updateTaskTimer(task: Task, nextTimer: TaskTimer): Task {
  return {
    ...task,
    timer: nextTimer,
  };
}

export function startTaskTimer(task: Task): Task {
  if (!task.timer.enabled || task.timer.state === "running") {
    return task;
  }

  const remaining = computeTimerRemaining(task.timer);

  if (remaining <= 0) {
    return updateTaskTimer(task, {
      ...task.timer,
      state: "ready",
      remainingMs: 0,
      startedAt: 0,
    });
  }

  return updateTaskTimer(task, {
    ...task.timer,
    state: "running",
    startedAt: Date.now(),
    remainingMs: remaining,
  });
}

export function pauseTaskTimer(task: Task): Task {
  if (task.timer.state !== "running") {
    return task;
  }

  const remaining = computeTimerRemaining(task.timer);

  return updateTaskTimer(task, {
    ...task.timer,
    state: "paused",
    startedAt: 0,
    remainingMs: remaining,
  });
}

export function resetTaskTimer(task: Task): Task {
  if (!task.timer.enabled) {
    return task;
  }

  return updateTaskTimer(task, {
    ...task.timer,
    state: "idle",
    startedAt: 0,
    remainingMs: task.timer.duration,
  });
}

export function finishTaskTimer(task: Task): Task {
  if (!task.timer.enabled) {
    return task;
  }

  return updateTaskTimer(task, {
    ...task.timer,
    state: "ready",
    startedAt: 0,
    remainingMs: 0,
  });
}

export function ensureTimerReady(task: Task, now = Date.now()): Task {
  if (!task.timer.enabled || task.timer.state !== "running") {
    return task;
  }

  const remaining = computeTimerRemaining(task.timer, now);

  if (remaining > 0) {
    return task;
  }

  return finishTaskTimer(task);
}

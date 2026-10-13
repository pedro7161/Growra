// Google Play in-app updates: decides which update prompt to show and walks
// available → downloading → ready (restart), or the blocking "required" sheet for
// releases marked priority 4-5 on Play. The native side is behind AppUpdateClient so
// this file stays plain TypeScript and testable with fakes.

/** What Play says about the installed version. */
export interface AppUpdateCheck {
  available: boolean;
  /** Priority set on the Play release, 0 (default) to 5. */
  priority: number;
  flexibleAllowed: boolean;
  immediateAllowed: boolean;
  /** A flexible update was already downloaded (in an earlier session) and only needs a restart. */
  downloaded: boolean;
}

export interface AppUpdateProgress {
  status: "downloading" | "downloaded" | "failed";
  /** 0..1 when Play reports sizes, otherwise null. */
  fraction: number | null;
}

export interface AppUpdateClient {
  /** null when updates can't be checked (iOS, web, sideloaded install, Play unavailable). */
  check(): Promise<AppUpdateCheck | null>;
  /** Starts the background download. Resolves false if the user declined Play's dialog. */
  startFlexible(): Promise<boolean>;
  /** Installs a downloaded flexible update; the app restarts. */
  completeFlexible(): Promise<void>;
  /** Opens Play's full-screen update flow. */
  startImmediate(): Promise<void>;
  onProgress(listener: (progress: AppUpdateProgress) => void): void;
}

export type UpdatePromptState = "none" | "available" | "downloading" | "ready" | "required";

/** Play release priority (0-5) from which an update blocks the app until it's installed. */
export const REQUIRED_UPDATE_PRIORITY = 4;

export function decideUpdatePrompt(check: AppUpdateCheck | null): UpdatePromptState {
  if (!check) return "none";
  if (check.downloaded) return "ready";
  if (!check.available) return "none";
  if (check.priority >= REQUIRED_UPDATE_PRIORITY && check.immediateAllowed) return "required";
  if (check.flexibleAllowed) return "available";
  return "none";
}

export interface AppUpdateSnapshot {
  state: UpdatePromptState;
  /** Download progress 0..1 while downloading (null until Play reports sizes). */
  progress: number | null;
}

export interface AppUpdateController {
  getSnapshot(): AppUpdateSnapshot;
  subscribe(listener: () => void): () => void;
  /** Asks Play about updates. Only the first call does anything. */
  checkOnce(): Promise<void>;
  update(): Promise<void>;
  later(): void;
  restart(): Promise<void>;
  updateNow(): Promise<void>;
}

export function createAppUpdateController(client: AppUpdateClient): AppUpdateController {
  let snapshot: AppUpdateSnapshot = { state: "none", progress: null };
  let checked = false;
  let listening = false;
  const listeners = new Set<() => void>();

  const set = (next: Partial<AppUpdateSnapshot>) => {
    snapshot = { ...snapshot, ...next };
    listeners.forEach((listener) => listener());
  };

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async checkOnce() {
      if (checked) return;
      checked = true;
      const check = await client.check().catch(() => null);
      set({ state: decideUpdatePrompt(check) });
    },
    async update() {
      set({ state: "downloading", progress: null });
      if (!listening) {
        listening = true;
        client.onProgress((progress) => {
          if (progress.status === "downloaded") set({ state: "ready" });
          else if (progress.status === "failed") set({ state: "none" });
          else set({ progress: progress.fraction });
        });
      }
      const accepted = await client.startFlexible().catch(() => false);
      if (!accepted && snapshot.state === "downloading") set({ state: "none" });
    },
    later() {
      set({ state: "none" });
    },
    restart() {
      return client.completeFlexible();
    },
    async updateNow() {
      // The required sheet stays up if the user backs out of Play's screen.
      await client.startImmediate().catch(() => undefined);
    },
  };
}

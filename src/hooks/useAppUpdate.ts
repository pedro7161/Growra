import { useEffect, useSyncExternalStore } from "react";
import { createAppUpdateController } from "../services/appUpdateService";
import { playAppUpdateClient } from "../services/playAppUpdateClient";

/** One controller for the app's lifetime, so "Later" and the once-per-launch check hold. */
const controller = createAppUpdateController(playAppUpdateClient);

/** Checks Google Play once at startup and exposes the update prompt's state and actions. */
export function useAppUpdate() {
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  useEffect(() => {
    void controller.checkOnce();
  }, []);
  return { ...snapshot, controller };
}

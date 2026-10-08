export type AmbienceScreen = "dashboard" | "tasks" | "task-calendar" | "journey" | "companions";
export type AmbienceTrack = "home" | "journey" | "room";

/**
 * The optional background loop for where the person is: the room editor has its own
 * loop, the Journey keeps its ambience, everything else gets the calm home ambience.
 */
export function ambienceFor(
  screen: AmbienceScreen,
  roomEditorOpen: boolean,
  musicEnabled: boolean,
): AmbienceTrack | null {
  if (!musicEnabled) return null;
  if (roomEditorOpen) return "room";
  return screen === "journey" ? "journey" : "home";
}

import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

import type { AmbienceTrack } from "./ambience";

const ambienceSources: Record<AmbienceTrack, number> = {
  home: require("../assets/audio/growra-calm-home-ambience.m4a"),
  journey: require("../assets/audio/growra-journey-ambience.m4a"),
  room: require("../assets/audio/growra-room-editor-loop.m4a"),
};

/** The home loop sits lower: it plays while the person is working. */
const AMBIENCE_VOLUME: Record<AmbienceTrack, number> = { home: 0.16, journey: 0.22, room: 0.2 };

const cueSources = {
  "task-complete": require("../assets/audio/growra-task-complete.m4a"),
  "task-added": require("../assets/audio/growra-task-added.m4a"),
  "task-saved": require("../assets/audio/growra-task-saved.m4a"),
  "task-removed": require("../assets/audio/growra-task-removed.m4a"),
  "companion-greeting": require("../assets/audio/growra-companion-greeting.m4a"),
  "companion-evolved": require("../assets/audio/growra-companion-evolved.m4a"),
  "player-level-up": require("../assets/audio/growra-player-level-up.m4a"),
  "focus-find": require("../assets/audio/growra-focus-find.m4a"),
  "journey-tile": require("../assets/audio/growra-journey-tile.m4a"),
  "camp-milestone": require("../assets/audio/growra-camp-milestone.m4a"),
  "region-unlock": require("../assets/audio/growra-region-unlock.m4a"),
  "timer-start": require("../assets/audio/growra-timer-start.m4a"),
  "timer-pause": require("../assets/audio/growra-timer-pause.m4a"),
  "timer-reset": require("../assets/audio/growra-timer-reset.m4a"),
  "ui-tap": require("../assets/audio/growra-ui-tap.m4a"),
  "plus-unlocked": require("../assets/audio/growra-plus-unlocked.m4a"),
  "room-picture-shared": require("../assets/audio/growra-room-picture-shared.m4a"),
  "bought-with-coins": require("../assets/audio/growra-bought-with-coins.m4a"),
  "explore-sent": require("../assets/audio/growra-explore-sent.m4a"),
  "decoration-placed": require("../assets/audio/growra-decoration-placed.m4a"),
  "companion-switched": require("../assets/audio/growra-companion-switched.m4a"),
  "theme-changed": require("../assets/audio/growra-theme-changed.m4a"),
} as const;

export type GrowraCue = keyof typeof cueSources;

/** Soft by design; the newer cues were mastered to sit a little below the task cues. */
const CUE_VOLUME: Partial<Record<GrowraCue, number>> = {
  "ui-tap": 0.18,
  "plus-unlocked": 0.4,
  "room-picture-shared": 0.3,
  "bought-with-coins": 0.32,
  "explore-sent": 0.3,
  "decoration-placed": 0.3,
  "companion-switched": 0.34,
  "theme-changed": 0.28,
};

const ambiencePlayers = new Map<AmbienceTrack, ReturnType<typeof createAudioPlayer>>();
let ambienceDesired: AmbienceTrack | null = null;

async function configureAudio(): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
  });
}

/** Plays `track` as the background loop (pausing any other), or stops it with null. */
export async function setGrowraAmbience(track: AmbienceTrack | null): Promise<void> {
  ambienceDesired = track;
  for (const [key, player] of ambiencePlayers) {
    if (key !== track) player.pause();
  }
  if (!track) return;
  try {
    await configureAudio();
    if (ambienceDesired !== track) return;
    let player = ambiencePlayers.get(track);
    if (!player) {
      player = createAudioPlayer(ambienceSources[track]);
      player.loop = true;
      player.volume = AMBIENCE_VOLUME[track];
      ambiencePlayers.set(track, player);
    }
    if (!player.playing) player.play();
  } catch (error) {
    console.error("Failed to update Growra ambience:", error);
  }
}

export async function playGrowraCue(cue: GrowraCue, enabled: boolean): Promise<void> {
  if (!enabled) return;
  try {
    await configureAudio();
    const player = createAudioPlayer(cueSources[cue]);
    player.volume = CUE_VOLUME[cue] ?? 0.38;
    const subscription = player.addListener("playbackStatusUpdate", (status) => {
      if (status.didJustFinish) {
        subscription.remove();
        player.remove();
      }
    });
    player.play();
  } catch (error) {
    console.error(`Failed to play Growra cue ${cue}:`, error);
  }
}

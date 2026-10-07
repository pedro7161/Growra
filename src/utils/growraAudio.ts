import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

const ambienceSource = require("../assets/audio/growra-journey-ambience.m4a");

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
} as const;

export type GrowraCue = keyof typeof cueSources;

let ambiencePlayer: ReturnType<typeof createAudioPlayer> | null = null;
let ambienceDesired = false;

async function configureAudio(): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
  });
}

export async function setGrowraAmbienceEnabled(enabled: boolean): Promise<void> {
  ambienceDesired = enabled;
  if (!enabled) {
    ambiencePlayer?.pause();
    return;
  }
  try {
    await configureAudio();
    if (!ambienceDesired) return;
    if (!ambiencePlayer) {
      ambiencePlayer = createAudioPlayer(ambienceSource);
      ambiencePlayer.loop = true;
      ambiencePlayer.volume = 0.22;
    }
    if (!ambiencePlayer.playing) ambiencePlayer.play();
  } catch (error) {
    console.error("Failed to update Growra ambience:", error);
  }
}

export async function playGrowraCue(cue: GrowraCue, enabled: boolean): Promise<void> {
  if (!enabled) return;
  try {
    await configureAudio();
    const player = createAudioPlayer(cueSources[cue]);
    player.volume = cue === "ui-tap" ? 0.18 : 0.38;
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

import { File, Paths } from "expo-file-system";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { Vibration } from "react-native";
import { TimerAlertSettings } from "../types";

const TIMER_ALERT_FILE_PREFIX = "timer-alert-sound-";

function getFileExtension(fileName: string): string {
  const nameParts = fileName.split(".");
  return nameParts.length > 1 ? `.${nameParts[nameParts.length - 1]}` : "";
}

function getManagedTimerAlertFile(fileName: string): File {
  return new File(Paths.document, `${TIMER_ALERT_FILE_PREFIX}${Date.now()}${getFileExtension(fileName)}`);
}

export async function removeStoredTimerAlertSound(uri: string): Promise<void> {
  const managedRoot = Paths.document.uri;

  if (!uri || !managedRoot || !uri.startsWith(managedRoot)) {
    return;
  }

  const storedFile = new File(uri);

  if (!storedFile.exists) {
    return;
  }

  storedFile.delete();
}

export async function pickTimerAlertSound(
  previousUri: string
): Promise<{ soundName: string; soundUri: string } | null> {
  const pickedFileResult = await File.pickFileAsync(undefined, "audio/*");
  const pickedFile = "name" in pickedFileResult ? pickedFileResult : pickedFileResult[0];
  const targetFile = getManagedTimerAlertFile(pickedFile.name);

  pickedFile.copy(targetFile);

  await removeStoredTimerAlertSound(previousUri);

  return {
    soundName: pickedFile.name,
    soundUri: targetFile.uri,
  };
}

async function playSound(uri: string): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
  });

  const player = createAudioPlayer({ uri });
  const subscription = player.addListener("playbackStatusUpdate", (status) => {
    if (!status.didJustFinish) {
      return;
    }

    subscription.remove();
    player.remove();
  });

  player.play();
}

export async function playTimerAlert(settings: TimerAlertSettings): Promise<void> {
  if (settings.mode === "sound" && settings.soundUri) {
    try {
      await playSound(settings.soundUri);
      return;
    } catch (error) {
      console.error("Failed to play timer alert sound:", error);
    }
  }

  Vibration.vibrate([0, 500, 250, 500]);
}

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
  let pickedFileResult: Awaited<ReturnType<typeof File.pickFileAsync>>;
  try {
    pickedFileResult = await File.pickFileAsync(undefined, "audio/*");
  } catch {
    // The user closed the picker without choosing a file.
    return null;
  }

  // The declared type allows an array, but the picker returns one file; re-wrap it by URI.
  const pickedUri = Array.isArray(pickedFileResult) ? pickedFileResult[0]?.uri : pickedFileResult.uri;
  if (!pickedUri) {
    return null;
  }
  const pickedFile = new File(pickedUri);

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
  // Release the native player once the alert has played, or every alert leaks one.
  const subscription = player.addListener("playbackStatusUpdate", (status) => {
    if (status.didJustFinish) {
      subscription.remove();
      player.remove();
    }
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

import type { AlertButton, AlertOptions } from "react-native";
import type { getAppCopy } from "../constants/appCopy";
import type { GameState } from "../types";

type AppCopy = ReturnType<typeof getAppCopy>;
type ShowAlert = (title: string, message: string, buttons: AlertButton[], options: AlertOptions) => void;

/**
 * Asks before an import replaces the whole save, naming what's about to go (#49). Resolves true
 * only on "Replace"; cancelling, or dismissing the dialog, leaves the save untouched.
 */
export function confirmReplaceSave(copy: AppCopy, current: GameState, showAlert: ShowAlert): Promise<boolean> {
  return new Promise((resolve) => {
    const body = copy.importConfirmBody
      .replace("{tasks}", String(current.tasks.length))
      .replace("{companions}", String(current.pets.length))
      .replace("{coins}", String(current.coins));
    showAlert(copy.importConfirmTitle, body, [
      { text: copy.addTaskCancel, style: "cancel", onPress: () => resolve(false) },
      { text: copy.importConfirmReplace, style: "destructive", onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}

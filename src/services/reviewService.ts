import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";
import { Linking } from "react-native";

// Ratings: a "Rate Growra" button in Settings, and Google Play's in-app review popup offered once,
// when the user reaches a Journey camp (7 active days). Play decides whether the popup actually
// shows (it limits how often), so the Settings button always opens the store listing instead.

const PROMPTED_KEY = "growra_review_prompted";
const PACKAGE = "com.growra.app";
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PACKAGE}`;

/** True when this task completion just reached a camp (every 7th active day). */
export function reachedCamp(tilesBefore: number, tilesAfter: number): boolean {
  return tilesAfter > tilesBefore && tilesAfter > 0 && tilesAfter % 7 === 0;
}

/** Offers Play's review popup once per install. */
export async function maybeAskForReview(): Promise<void> {
  try {
    if ((await AsyncStorage.getItem(PROMPTED_KEY)) === "1") return;
    if (!(await StoreReview.hasAction())) return;
    await AsyncStorage.setItem(PROMPTED_KEY, "1");
    await StoreReview.requestReview();
  } catch {
    // Reviews are a nicety; never let them break task completion.
  }
}

/** Opens Growra's Play Store page (the Play app when installed, the website otherwise). */
export async function openStoreListing(): Promise<void> {
  try {
    await Linking.openURL(`market://details?id=${PACKAGE}`);
  } catch {
    await Linking.openURL(PLAY_STORE_URL).catch(() => undefined);
  }
}

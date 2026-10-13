import { requireOptionalNativeModule } from "expo";

/** What Play says about the installed version. Same shape as the native "check" result. */
export interface NativeAppUpdateCheck {
  available: boolean;
  priority: number;
  flexibleAllowed: boolean;
  immediateAllowed: boolean;
  downloaded: boolean;
}

/** Raw Play install state (InstallStatus codes: 2 downloading, 5 failed, 6 canceled, 11 downloaded). */
export interface NativeProgressEvent {
  status: number;
  bytesDownloaded: number;
  totalBytesToDownload: number;
}

interface GrowraAppUpdateNative {
  check(): Promise<NativeAppUpdateCheck | null>;
  startFlexible(): Promise<boolean>;
  startImmediate(): Promise<boolean>;
  completeFlexible(): Promise<void>;
  addListener(event: "onProgress", listener: (event: NativeProgressEvent) => void): { remove(): void };
}

/** null on iOS, web, Expo Go and tests: the module only exists in Android builds. */
export const GrowraAppUpdate = requireOptionalNativeModule<GrowraAppUpdateNative>("GrowraAppUpdate");

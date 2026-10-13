import { GrowraAppUpdate } from "../../modules/growra-app-update";
import { AppUpdateClient } from "./appUpdateService";

// Play's InstallStatus codes, as sent by the native module.
const INSTALL_STATUS = { pending: 1, downloading: 2, failed: 5, canceled: 6, downloaded: 11 } as const;

/** Google Play in-app updates through the local growra-app-update module (Android only). */
export const playAppUpdateClient: AppUpdateClient = {
  async check() {
    return GrowraAppUpdate ? await GrowraAppUpdate.check() : null;
  },
  async startFlexible() {
    return GrowraAppUpdate ? await GrowraAppUpdate.startFlexible() : false;
  },
  async completeFlexible() {
    await GrowraAppUpdate?.completeFlexible();
  },
  async startImmediate() {
    await GrowraAppUpdate?.startImmediate();
  },
  onProgress(listener) {
    GrowraAppUpdate?.addListener("onProgress", (event) => {
      const fraction = event.totalBytesToDownload > 0 ? event.bytesDownloaded / event.totalBytesToDownload : null;
      switch (event.status) {
        case INSTALL_STATUS.downloaded:
          listener({ status: "downloaded", fraction: 1 });
          break;
        case INSTALL_STATUS.failed:
        case INSTALL_STATUS.canceled:
          listener({ status: "failed", fraction: null });
          break;
        case INSTALL_STATUS.pending:
        case INSTALL_STATUS.downloading:
          listener({ status: "downloading", fraction });
          break;
      }
    });
  },
};

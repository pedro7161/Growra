import mobileAds, { AdEventType, AdsConsent, RewardedAd, RewardedAdEventType } from "react-native-google-mobile-ads";
import { AdResult, AdsClient } from "./adsService";

const AD_TIMEOUT_MS = 15000;
let initialized = false;

export const googleAdsClient: AdsClient = {
  async ensureConsent() {
    await AdsConsent.requestInfoUpdate();
    await AdsConsent.loadAndShowConsentFormIfRequired();
    const info = await AdsConsent.getConsentInfo();
    if (!info.canRequestAds) return false;
    if (!initialized) {
      await mobileAds().initialize();
      initialized = true;
    }
    return true;
  },

  showRewarded(adUnitId) {
    return new Promise<AdResult>((resolve) => {
      const ad = RewardedAd.createForAdRequest(adUnitId);
      let earned = false;
      let settled = false;
      const finish = (result: AdResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        unsubscribers.forEach((unsubscribe) => unsubscribe());
        resolve(result);
      };
      const unsubscribers = [
        ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
          clearTimeout(timer); // loaded in time; now wait for the user
          ad.show().catch(() => finish("unavailable"));
        }),
        ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
          earned = true;
        }),
        ad.addAdEventListener(AdEventType.CLOSED, () => finish(earned ? "earned" : "dismissed")),
        ad.addAdEventListener(AdEventType.ERROR, () => finish("unavailable")),
      ];
      const timer = setTimeout(() => finish("unavailable"), AD_TIMEOUT_MS);
      ad.load();
    });
  },
};

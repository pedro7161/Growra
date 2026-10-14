import { AdsClient } from "./adsService";

/** Web build: there are no ads on web (the AdMob SDK is native only). Lets the web preview bundle. */
export const googleAdsClient: AdsClient = {
  async ensureConsent() {
    return false;
  },
  async showRewarded() {
    return "unavailable";
  },
};

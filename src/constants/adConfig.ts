/**
 * AdMob ids. Growra is registered in AdMob as an unpublished app (publisher
 * pub-1937871003523129); app.json's androidAppId must match ADMOB_APP_ID.
 * Development builds always use Google's test unit, so nobody working on the
 * app can load (or click) a live ad; production builds use the real unit.
 */
export const ADMOB_TEST_PUBLISHER = "ca-app-pub-3940256099942544";
export const ADMOB_APP_ID = "ca-app-pub-1937871003523129~4166202568";
export const PRODUCTION_REWARDED_AD_UNIT_ID = "ca-app-pub-1937871003523129/8241268237";
export const TEST_REWARDED_AD_UNIT_ID = "ca-app-pub-3940256099942544/5224354917";

export function pickRewardedAdUnit(devBuild: boolean): string {
  return devBuild ? TEST_REWARDED_AD_UNIT_ID : PRODUCTION_REWARDED_AD_UNIT_ID;
}

// __DEV__ is set by React Native; anywhere it isn't (e.g. plain Jest), assume development.
const isDevBuild = typeof __DEV__ === "undefined" ? true : __DEV__;

export const REWARDED_AD_UNIT_ID = pickRewardedAdUnit(isDevBuild);

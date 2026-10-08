import { readFileSync } from "fs";
import {
  ADMOB_APP_ID,
  PRODUCTION_REWARDED_AD_UNIT_ID,
  TEST_REWARDED_AD_UNIT_ID,
  pickRewardedAdUnit,
} from "../src/constants/adConfig";

describe("AdMob config", () => {
  it("gives development builds Google's test unit, never a live one", () => {
    expect(pickRewardedAdUnit(true)).toBe(TEST_REWARDED_AD_UNIT_ID);
    expect(TEST_REWARDED_AD_UNIT_ID).toContain("ca-app-pub-3940256099942544");
  });

  it("gives production builds the real unit from this publisher", () => {
    expect(pickRewardedAdUnit(false)).toBe(PRODUCTION_REWARDED_AD_UNIT_ID);
    expect(PRODUCTION_REWARDED_AD_UNIT_ID).toMatch(/^ca-app-pub-1937871003523129\/\d{10}$/);
  });

  it("keeps app.json's androidAppId equal to the AdMob app id", () => {
    const appJson = JSON.parse(readFileSync("app.json", "utf8"));
    const plugin = appJson.expo.plugins.find(
      (entry: unknown) => Array.isArray(entry) && entry[0] === "react-native-google-mobile-ads",
    );
    expect(plugin[1].androidAppId).toBe(ADMOB_APP_ID);
  });
});

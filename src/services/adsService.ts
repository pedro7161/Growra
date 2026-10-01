/** Rewarded ads (spec §2). The SDK sits behind AdsClient; googleAdsClient.ts is the only importer. */
export type AdResult = "earned" | "dismissed" | "unavailable";

export interface AdsClient {
  /** Shows the UMP consent form if required; true when ads may be requested. */
  ensureConsent(): Promise<boolean>;
  showRewarded(adUnitId: string): Promise<AdResult>;
}

export function createAdsService(client: AdsClient, adUnitId: string) {
  return {
    async watchForReward(): Promise<AdResult> {
      try {
        if (!(await client.ensureConsent())) return "unavailable";
        return await client.showRewarded(adUnitId);
      } catch {
        return "unavailable";
      }
    },
  };
}

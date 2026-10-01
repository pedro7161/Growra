/** Rewarded ads (spec §2). The SDK sits behind AdsClient; googleAdsClient.ts is the only importer. */
export type AdResult = "earned" | "dismissed" | "unavailable";

export interface AdsClient {
  /** Shows the UMP consent form if required; true when ads may be requested. */
  ensureConsent(): Promise<boolean>;
  showRewarded(adUnitId: string): Promise<AdResult>;
  /** True when the user must be able to review or withdraw consent (EEA/UK). */
  privacyOptionsRequired?(): Promise<boolean>;
  showPrivacyOptions?(): Promise<void>;
}

/** Consent + loading + watching; after this the explore button frees up whatever the SDK does. */
const DEFAULT_TIMEOUT_MS = 3 * 60 * 1000;

export function createAdsService(client: AdsClient, adUnitId: string, options: { timeoutMs?: number } = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function run(): Promise<AdResult> {
    if (!(await client.ensureConsent())) return "unavailable";
    return client.showRewarded(adUnitId);
  }

  return {
    watchForReward(): Promise<AdResult> {
      return new Promise<AdResult>((resolve) => {
        const timer = setTimeout(() => resolve("unavailable"), timeoutMs);
        run().then(
          (result) => {
            clearTimeout(timer);
            resolve(result);
          },
          () => {
            clearTimeout(timer);
            resolve("unavailable");
          },
        );
      });
    },

    async canChangeConsent(): Promise<boolean> {
      try {
        return (await client.privacyOptionsRequired?.()) ?? false;
      } catch {
        return false;
      }
    },

    async changeConsent(): Promise<void> {
      try {
        await client.showPrivacyOptions?.();
      } catch {
        // The form failed to load; nothing changes.
      }
    },
  };
}

/** Rewarded ads (spec §2). The SDK sits behind AdsClient; googleAdsClient.ts is the only importer. */
export type AdResult = "earned" | "dismissed" | "unavailable";

/** What a caller gets back: an ad result, or "busy" when one ad is already in flight. */
export type WatchResult = AdResult | "busy";

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

  let inFlight = false;

  return {
    /**
     * One ad at a time: a fast double tap used to pass a React state guard twice in a frame and
     * start two ads, so the guard lives here and is a plain variable, not state. "busy" is a
     * no-op answer - the second tap must not show a message or spend the reward.
     */
    watchForReward(): Promise<WatchResult> {
      if (inFlight) return Promise.resolve("busy");
      inFlight = true;
      return new Promise<WatchResult>((resolve) => {
        let settled = false;
        // Released on every exit - earned, dismissed, unavailable, a throw, and the watchdog -
        // because a guard that leaks turns a double-ad bug into a button that never works again.
        const settle = (result: AdResult) => {
          if (settled) return;
          settled = true;
          inFlight = false;
          clearTimeout(timer);
          resolve(result);
        };
        const timer = setTimeout(() => settle("unavailable"), timeoutMs);
        run().then(settle, () => settle("unavailable"));
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

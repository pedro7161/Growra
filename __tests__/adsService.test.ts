import { AdResult, AdsClient, createAdsService } from '../src/services/adsService';

function fake(consent: boolean, result: 'earned' | 'dismissed' | 'unavailable'): AdsClient & { shown: number } {
  const client = {
    shown: 0,
    ensureConsent: async () => consent,
    showRewarded: async () => {
      client.shown += 1;
      return result;
    },
  };
  return client;
}

describe('adsService', () => {
  it('returns earned when the ad pays out', async () => {
    expect(await createAdsService(fake(true, 'earned'), 'unit').watchForReward()).toBe('earned');
  });

  it('dismissed (skipped early) gives no reward', async () => {
    expect(await createAdsService(fake(true, 'dismissed'), 'unit').watchForReward()).toBe('dismissed');
  });

  it('never shows an ad without consent', async () => {
    const client = fake(false, 'earned');
    expect(await createAdsService(client, 'unit').watchForReward()).toBe('unavailable');
    expect(client.shown).toBe(0);
  });

  it('maps a throwing client to unavailable', async () => {
    const client: AdsClient = {
      ensureConsent: async () => true,
      showRewarded: async () => {
        throw new Error('no fill');
      },
    };
    expect(await createAdsService(client, 'unit').watchForReward()).toBe('unavailable');
  });
});

describe('adsService double-tap guard', () => {
  afterEach(() => jest.useRealTimers());

  /** Lets the service reach showRewarded (consent is awaited first) before the ad is finished. */
  const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

  function slowClient(result: AdResult): AdsClient & { shown: number; finish: () => void } {
    let release: (() => void) | null = null;
    const client = {
      shown: 0,
      ensureConsent: async () => true,
      showRewarded: () => {
        client.shown += 1;
        return new Promise<AdResult>((resolve) => {
          release = () => resolve(result);
        });
      },
      finish: () => release?.(),
    };
    return client;
  }

  it('starts exactly one ad for two overlapping taps', async () => {
    const client = slowClient('earned');
    const service = createAdsService(client, 'unit');

    const first = service.watchForReward();
    const second = service.watchForReward();

    expect(await second).toBe('busy'); // the second tap does nothing at all
    await flush();
    expect(client.shown).toBe(1);

    client.finish();
    expect(await first).toBe('earned'); // and the first tap still pays out
    expect(client.shown).toBe(1);
  });

  it('frees the guard after an ad is earned, so a later tap works', async () => {
    const client = slowClient('earned');
    const service = createAdsService(client, 'unit');

    const first = service.watchForReward();
    await flush();
    client.finish();
    expect(await first).toBe('earned');

    const later = service.watchForReward();
    await flush();
    client.finish();
    expect(await later).toBe('earned');
    expect(client.shown).toBe(2);
  });

  it('frees the guard after a dismissed ad', async () => {
    const client = slowClient('dismissed');
    const service = createAdsService(client, 'unit');
    const first = service.watchForReward();
    await flush();
    client.finish();
    expect(await first).toBe('dismissed');
    const later = service.watchForReward();
    await flush();
    client.finish();
    expect(await later).toBe('dismissed');
    expect(client.shown).toBe(2);
  });

  it('frees the guard when no ad was available', async () => {
    const client = fake(false, 'earned');
    const service = createAdsService(client, 'unit');
    expect(await service.watchForReward()).toBe('unavailable');
    expect(await service.watchForReward()).toBe('unavailable');
  });

  it('frees the guard when the client throws', async () => {
    let calls = 0;
    const client: AdsClient = {
      ensureConsent: async () => true,
      showRewarded: async () => {
        calls += 1;
        throw new Error('no fill');
      },
    };
    const service = createAdsService(client, 'unit');
    expect(await service.watchForReward()).toBe('unavailable');
    expect(await service.watchForReward()).toBe('unavailable');
    expect(calls).toBe(2); // not locked out by the first failure
  });

  it('frees the guard when the watchdog fires, so explore is not locked forever', async () => {
    jest.useFakeTimers();
    const client: AdsClient = {
      ensureConsent: async () => true,
      showRewarded: () => new Promise(() => undefined), // never answers
    };
    const service = createAdsService(client, 'unit', { timeoutMs: 1000 });

    const stuck = service.watchForReward();
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(1001);
    expect(await stuck).toBe('unavailable');

    // The guard must be released by the timeout too, or the button never works again.
    const next = service.watchForReward();
    await jest.advanceTimersByTimeAsync(1001);
    expect(await next).toBe('unavailable');
  });
});

describe('adsService watchdog and consent options', () => {
  afterEach(() => jest.useRealTimers());

  it('settles as unavailable when the client never answers', async () => {
    jest.useFakeTimers();
    const client: AdsClient = {
      ensureConsent: async () => true,
      showRewarded: () => new Promise(() => undefined),
    };
    const pending = createAdsService(client, 'unit', { timeoutMs: 1000 }).watchForReward();
    await Promise.resolve();
    jest.advanceTimersByTime(1001);
    expect(await pending).toBe('unavailable');
  });

  it('settles as unavailable when consent never answers', async () => {
    jest.useFakeTimers();
    const client: AdsClient = {
      ensureConsent: () => new Promise(() => undefined),
      showRewarded: async () => 'earned',
    };
    const pending = createAdsService(client, 'unit', { timeoutMs: 1000 }).watchForReward();
    jest.advanceTimersByTime(1001);
    expect(await pending).toBe('unavailable');
  });

  it('offers the privacy options form only when the client says it is required', async () => {
    let shown = 0;
    const client: AdsClient = {
      ensureConsent: async () => true,
      showRewarded: async () => 'earned',
      privacyOptionsRequired: async () => true,
      showPrivacyOptions: async () => { shown += 1; },
    };
    const service = createAdsService(client, 'unit');
    expect(await service.canChangeConsent()).toBe(true);
    await service.changeConsent();
    expect(shown).toBe(1);
  });
});

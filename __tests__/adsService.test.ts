import { AdsClient, createAdsService } from '../src/services/adsService';

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

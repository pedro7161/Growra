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

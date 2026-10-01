import { BillingClient, StorePurchase, createPlusService, PLUS_PRODUCT_ID } from '../src/services/plusService';

function purchase(state: StorePurchase['state'], acknowledged = false): StorePurchase {
  return { productId: PLUS_PRODUCT_ID, state, acknowledged, raw: {} };
}

function fakeClient(overrides: Partial<BillingClient> = {}): BillingClient & { acks: number } {
  const client = {
    acks: 0,
    connect: async () => true,
    getPrice: async () => '€0.99',
    purchase: async () => ({ kind: 'purchase' as const, purchase: purchase('purchased') }),
    ownedPurchases: async () => [] as StorePurchase[],
    acknowledge: async () => {
      client.acks += 1;
    },
    ...overrides,
  };
  return client;
}

describe('plusService', () => {
  it('returns the price from the store', async () => {
    expect(await createPlusService(fakeClient()).getPrice()).toBe('€0.99');
  });

  it('acknowledges and reports a completed purchase', async () => {
    const client = fakeClient();
    expect(await createPlusService(client).buy()).toBe('purchased');
    expect(client.acks).toBe(1);
  });

  it('reports pending without acknowledging', async () => {
    const client = fakeClient({ purchase: async () => ({ kind: 'purchase', purchase: purchase('pending') }) });
    expect(await createPlusService(client).buy()).toBe('pending');
    expect(client.acks).toBe(0);
  });

  it('treats a cancelled sheet as cancelled, not an error', async () => {
    const client = fakeClient({ purchase: async () => ({ kind: 'cancelled' }) });
    expect(await createPlusService(client).buy()).toBe('cancelled');
  });

  it('reports unavailable when the store cannot connect', async () => {
    const client = fakeClient({ connect: async () => false });
    const service = createPlusService(client);
    expect(await service.buy()).toBe('unavailable');
    expect(await service.getPrice()).toBeNull();
  });

  it('still reports purchased when acknowledgement throws (retried on restore)', async () => {
    const client = fakeClient({
      acknowledge: async () => {
        throw new Error('network');
      },
    });
    expect(await createPlusService(client).buy()).toBe('purchased');
  });

  it('restore finds an owned purchase and acknowledges it if needed', async () => {
    const client = fakeClient({ ownedPurchases: async () => [purchase('purchased', false)] });
    expect(await createPlusService(client).restore()).toBe('owned');
    expect(client.acks).toBe(1);
  });

  it('restore reports not-owned when Play has no purchase (refund)', async () => {
    expect(await createPlusService(fakeClient()).restore()).toBe('not-owned');
  });

  it('restore unavailable keeps cached ownership (never returns not-owned when offline)', async () => {
    const client = fakeClient({
      ownedPurchases: async () => {
        throw new Error('offline');
      },
    });
    expect(await createPlusService(client).restore()).toBe('unavailable');
  });

  it('retries the connection after a failed connect', async () => {
    let attempts = 0;
    const client = fakeClient({
      connect: async () => {
        attempts += 1;
        return attempts > 1;
      },
    });
    const service = createPlusService(client);
    expect(await service.restore()).toBe('unavailable');
    expect(await service.restore()).toBe('not-owned');
  });
});

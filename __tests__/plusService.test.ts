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

  it('treats "already owned" as a restore, not a failed purchase', async () => {
    // A user who paid and reinstalled: Play refuses the second purchase, but they do own Plus.
    const client = fakeClient({
      purchase: async () => ({ kind: 'already-owned' }),
      ownedPurchases: async () => [purchase('purchased', false)],
    });
    expect(await createPlusService(client).buy()).toBe('purchased');
    expect(client.acks).toBe(1); // the restored purchase is acknowledged
  });

  it('reports an error when Play says "already owned" but has no purchase to restore', async () => {
    const client = fakeClient({ purchase: async () => ({ kind: 'already-owned' }) });
    expect(await createPlusService(client).buy()).toBe('error');
  });

  it('does not restore on an ordinary purchase error', async () => {
    let restores = 0;
    const client = fakeClient({
      purchase: async () => ({ kind: 'error' }),
      ownedPurchases: async () => {
        restores += 1;
        return [purchase('purchased')];
      },
    });
    expect(await createPlusService(client).buy()).toBe('error');
    expect(restores).toBe(0);
  });

  it('does not restore when the user cancels the sheet', async () => {
    let restores = 0;
    const client = fakeClient({
      purchase: async () => ({ kind: 'cancelled' }),
      ownedPurchases: async () => {
        restores += 1;
        return [purchase('purchased')];
      },
    });
    expect(await createPlusService(client).buy()).toBe('cancelled');
    expect(restores).toBe(0);
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

describe('plusService buy watchdog', () => {
  afterEach(() => jest.useRealTimers());

  it('settles as error when the store never answers a purchase', async () => {
    jest.useFakeTimers();
    const client = fakeClient({ purchase: () => new Promise(() => undefined) });
    const pending = createPlusService(client, { buyTimeoutMs: 1000 }).buy();
    await jest.advanceTimersByTimeAsync(1001);
    expect(await pending).toBe('error');
  });
});

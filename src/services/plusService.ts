/**
 * Growra Plus purchase logic (spec §1). The store SDK is hidden behind BillingClient so this file is
 * pure and testable; expoIapClient.ts is the only file that imports expo-iap.
 */
export const PLUS_PRODUCT_ID = "growra_plus";

export type BuyResult = "purchased" | "pending" | "cancelled" | "unavailable" | "error";
export type RestoreResult = "owned" | "not-owned" | "unavailable";

export interface StorePurchase {
  productId: string;
  state: "purchased" | "pending" | "unknown";
  acknowledged: boolean;
  raw: unknown; // the SDK's own purchase object, passed back for acknowledgement
}

export type PurchaseOutcome =
  | { kind: "purchase"; purchase: StorePurchase }
  | { kind: "cancelled" }
  | { kind: "error" };

export interface BillingClient {
  connect(): Promise<boolean>;
  getPrice(productId: string): Promise<string | null>;
  purchase(productId: string): Promise<PurchaseOutcome>;
  ownedPurchases(): Promise<StorePurchase[]>;
  acknowledge(purchase: StorePurchase): Promise<void>;
}

export interface PlusService {
  getPrice(): Promise<string | null>;
  buy(): Promise<BuyResult>;
  restore(): Promise<RestoreResult>;
}

/** A purchase sheet can stay open while the user types card details; after this the button frees up. */
const DEFAULT_BUY_TIMEOUT_MS = 10 * 60 * 1000;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

export function createPlusService(
  client: BillingClient,
  options: { buyTimeoutMs?: number } = {},
): PlusService {
  const buyTimeoutMs = options.buyTimeoutMs ?? DEFAULT_BUY_TIMEOUT_MS;
  let connecting: Promise<boolean> | null = null;

  async function connect(): Promise<boolean> {
    if (!connecting) {
      connecting = client.connect().catch(() => false);
    }
    const ok = await connecting;
    if (!ok) {
      connecting = null; // try again next time
    }
    return ok;
  }

  async function acknowledgeIfNeeded(purchase: StorePurchase): Promise<void> {
    if (purchase.state !== "purchased" || purchase.acknowledged) return;
    try {
      await client.acknowledge(purchase);
    } catch {
      // Play gives 3 days; the next restore() retries.
    }
  }

  return {
    async getPrice() {
      if (!(await connect())) return null;
      try {
        return await client.getPrice(PLUS_PRODUCT_ID);
      } catch {
        return null;
      }
    },

    async buy() {
      if (!(await connect())) return "unavailable";
      try {
        const outcome = await withTimeout<PurchaseOutcome>(client.purchase(PLUS_PRODUCT_ID), buyTimeoutMs, { kind: "error" });
        if (outcome.kind === "cancelled") return "cancelled";
        if (outcome.kind === "error") return "error";
        if (outcome.purchase.state === "pending") return "pending";
        if (outcome.purchase.state !== "purchased") return "error";
        await acknowledgeIfNeeded(outcome.purchase);
        return "purchased";
      } catch {
        return "error";
      }
    },

    async restore() {
      if (!(await connect())) return "unavailable";
      try {
        const owned = (await client.ownedPurchases()).filter(
          (purchase) => purchase.productId === PLUS_PRODUCT_ID && purchase.state === "purchased",
        );
        for (const purchase of owned) {
          await acknowledgeIfNeeded(purchase);
        }
        return owned.length > 0 ? "owned" : "not-owned";
      } catch {
        return "unavailable";
      }
    },
  };
}

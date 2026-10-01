import {
  ErrorCode,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type Purchase,
} from "expo-iap";
import { BillingClient, PurchaseOutcome, StorePurchase } from "./plusService";

function toStorePurchase(purchase: Purchase): StorePurchase {
  return {
    productId: purchase.productId,
    state: purchase.purchaseState,
    acknowledged: Boolean((purchase as { isAcknowledgedAndroid?: boolean | null }).isAcknowledgedAndroid),
    raw: purchase,
  };
}

export const expoIapClient: BillingClient = {
  async connect() {
    return Boolean(await initConnection());
  },

  async getPrice(productId) {
    const products = (await fetchProducts({ skus: [productId], type: "in-app" })) ?? [];
    const product = (products as { id: string; displayPrice?: string }[]).find((item) => item.id === productId);
    return product?.displayPrice ?? null;
  },

  purchase(productId) {
    return new Promise<PurchaseOutcome>((resolve) => {
      let settled = false;
      const settle = (outcome: PurchaseOutcome) => {
        if (settled) return;
        settled = true;
        updated.remove();
        failed.remove();
        resolve(outcome);
      };
      const updated = purchaseUpdatedListener((purchase) => {
        if (purchase.productId === productId) settle({ kind: "purchase", purchase: toStorePurchase(purchase) });
      });
      const failed = purchaseErrorListener((error) => {
        settle(error.code === ErrorCode.UserCancelled ? { kind: "cancelled" } : { kind: "error" });
      });
      requestPurchase({ request: { google: { skus: [productId] } }, type: "in-app" }).then(
        (result) => {
          // Android also resolves with the purchases; use them in case no listener event arrives.
          const purchases = (Array.isArray(result) ? result : result ? [result] : []) as Purchase[];
          const match = purchases.find((purchase) => purchase.productId === productId);
          if (match) settle({ kind: "purchase", purchase: toStorePurchase(match) });
        },
        () => settle({ kind: "error" }),
      );
    });
  },

  async ownedPurchases() {
    return ((await getAvailablePurchases()) ?? []).map(toStorePurchase);
  },

  async acknowledge(purchase) {
    await finishTransaction({ purchase: purchase.raw as Purchase, isConsumable: false });
  },
};

import { BillingClient } from "./plusService";

/** Web build: no Play Billing on web. Lets the web preview bundle. */
export const expoIapClient: BillingClient = {
  async connect() {
    return false;
  },
  async getPrice() {
    return null;
  },
  async purchase() {
    return { kind: "error" };
  },
  async ownedPurchases() {
    return [];
  },
  async acknowledge() {},
};

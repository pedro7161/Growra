import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { GameState } from "../types";
import { resolveTheme } from "../utils/plus";
import { BuyResult, PlusService, RestoreResult } from "../services/plusService";

/** Pure: record ownership; a Plus theme without Plus falls back to Mint. */
export function applyPlusOwnership(state: GameState, owned: boolean, now: number): GameState {
  const theme = resolveTheme(state.settings.theme, owned);
  return {
    ...state,
    plus: { owned, lastCheckedAt: now },
    settings: theme === state.settings.theme ? state.settings : { ...state.settings, theme },
  };
}

/** Importing a backup must never change Plus: ownership always comes from this device's Play account. */
export function keepPlusOnImport(imported: GameState, current: GameState): GameState {
  return applyPlusOwnership(imported, current.plus.owned, current.plus.lastCheckedAt);
}

/** Re-asks the store only while the price is still unknown (e.g. the app started offline). */
export async function nextPrice(
  current: string | null,
  service: Pick<PlusService, "getPrice">,
): Promise<string | null> {
  return current ?? (await service.getPrice());
}

/**
 * Loads the price, re-checks ownership on start and foreground, and runs buy/restore.
 * "unavailable" never changes ownership, so Plus keeps working offline.
 */
export function usePlusController(service: PlusService, onOwnedChange: (owned: boolean) => void) {
  const [price, setPrice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const priceRef = useRef<string | null>(null);
  const onOwnedChangeRef = useRef(onOwnedChange);
  onOwnedChangeRef.current = onOwnedChange;

  const restore = useCallback(async (): Promise<RestoreResult> => {
    const result = await service.restore();
    if (result !== "unavailable") onOwnedChangeRef.current(result === "owned");
    return result;
  }, [service]);

  const refreshPrice = useCallback(async () => {
    const loadedPrice = await nextPrice(priceRef.current, service);
    priceRef.current = loadedPrice;
    setPrice(loadedPrice);
  }, [service]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (alive) await refreshPrice();
      if (alive) await restore();
    })();
    const subscription = AppState.addEventListener("change", (next) => {
      if (next !== "active") return;
      void refreshPrice();
      void restore();
    });
    return () => {
      alive = false;
      subscription.remove();
    };
  }, [service, restore, refreshPrice]);

  const buy = useCallback(async (): Promise<BuyResult> => {
    setBusy(true);
    try {
      const result = await service.buy();
      if (result === "purchased") onOwnedChangeRef.current(true);
      return result;
    } finally {
      setBusy(false);
    }
  }, [service]);

  return { price, busy, buy, restore, refreshPrice };
}

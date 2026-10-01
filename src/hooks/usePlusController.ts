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

/**
 * Loads the price, re-checks ownership on start and foreground, and runs buy/restore.
 * "unavailable" never changes ownership, so Plus keeps working offline.
 */
export function usePlusController(service: PlusService, onOwnedChange: (owned: boolean) => void) {
  const [price, setPrice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const onOwnedChangeRef = useRef(onOwnedChange);
  onOwnedChangeRef.current = onOwnedChange;

  const restore = useCallback(async (): Promise<RestoreResult> => {
    const result = await service.restore();
    if (result !== "unavailable") onOwnedChangeRef.current(result === "owned");
    return result;
  }, [service]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const loadedPrice = await service.getPrice();
      if (alive) setPrice(loadedPrice);
      if (alive) await restore();
    })();
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") void restore();
    });
    return () => {
      alive = false;
      subscription.remove();
    };
  }, [service, restore]);

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

  return { price, busy, buy, restore };
}

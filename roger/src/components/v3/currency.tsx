"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Currency } from "@/data/config";

// Same behaviour as src/components/circles/price.tsx on the live site: default from the
// visitor's country, and the visitor's own choice kept for the tab. When porting, feed
// `initial` from the x-vercel-ip-country header the way price.tsx does today.
const KEY = "roger.cur";
const Ctx = createContext<{ cur: Currency; setCur: (c: Currency) => void }>({ cur: "USD", setCur: () => {} });

export function CurrencyProvider({ initial = "USD", children }: { initial?: Currency; children: ReactNode }) {
  const [cur, set] = useState<Currency>(initial);
  useEffect(() => {
    const saved = sessionStorage.getItem(KEY);
    if (saved === "USD" || saved === "CAD") return set(saved);
    fetch("/geo")
      .then((r) => r.json())
      .then((d: { country?: string }) => d.country === "CA" && set("CAD"))
      .catch(() => {});
  }, []);
  const setCur = useCallback((c: Currency) => {
    sessionStorage.setItem(KEY, c);
    set(c);
  }, []);
  return <Ctx.Provider value={{ cur, setCur }}>{children}</Ctx.Provider>;
}

export const useCurrency = () => useContext(Ctx);

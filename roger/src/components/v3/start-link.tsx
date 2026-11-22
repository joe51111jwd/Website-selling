"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { StartPath } from "@/data/config";
import { useCurrency } from "./currency";

/** Every start button goes to /start (owned by the app) with path and cur, and carries ref, zack and utm through. */
export function useStartHref(path?: StartPath, extra?: Record<string, string>) {
  const pathname = usePathname();
  const { cur } = useCurrency();
  const [carried, setCarried] = useState<Record<string, string>>({});
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const keep: Record<string, string> = {};
    for (const k of ["ref", "zack", "utm"]) {
      const v = q.get(k);
      if (v) keep[k] = v;
    }
    setCarried(keep);
  }, [pathname]);
  const p: StartPath = path ?? (pathname.startsWith("/agents") || pathname.startsWith("/zack") ? "agents" : "re");
  return `/start?${new URLSearchParams({ path: p, cur, ...carried, ...extra })}`;
}

export function StartLink({
  path,
  extra,
  className = "btn",
  children,
}: {
  path?: StartPath;
  extra?: Record<string, string>;
  className?: string;
  children: ReactNode;
}) {
  const href = useStartHref(path, extra);
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

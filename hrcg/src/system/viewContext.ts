// Context shared by <ViewTitle> (provider) and <LoopVideo>/<Picture> (consumers).
// Lets media report states beside their title (FILM UNAVAILABLE · POSTER SHOWN) and lets dev
// builds assert every media element sits under a non-drawing view title (rule 22). Owner: A1.

import { createContext, useContext } from 'react';
import type { ViewKind } from '../content/viewTitles';

export interface ViewContextValue {
  kind: ViewKind;
  text: string;
  /** Media report a status line ('' clears). Keyed so several media can share one title. */
  setStatus(key: string, status: string): void;
}

export const ViewContext = createContext<ViewContextValue | null>(null);

export function useViewContext(): ViewContextValue | null {
  return useContext(ViewContext);
}

const warned = new Set<string>();

/** Dev-only: warn once when media has no view title, or only a `drawing` one. */
export function assertLabelled(mediaId: string, ctx: ViewContextValue | null) {
  if (!import.meta.env.DEV) return;
  if (warned.has(mediaId)) return;
  if (!ctx) {
    warned.add(mediaId);
    console.error(`[HRCG] media "${mediaId}" has no <ViewTitle> ancestor (truth rule 22).`);
  } else if (ctx.kind === 'drawing') {
    warned.add(mediaId);
    console.error(`[HRCG] media "${mediaId}" sits under a 'drawing' view title; AI media needs film/frame/still/depth.`);
  }
}

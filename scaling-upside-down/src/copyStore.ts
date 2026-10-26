// One shared record of the copy, so every button, the closed loop and the screen-reader
// announcement agree. `seq` goes up by one on each successful copy.
import { useSyncExternalStore } from "react";
import type { AssistantId } from "./assistants";

export type CopySource = "hero" | "story" | "nav" | "loop" | "chip" | "notice";
export type CopyStatus = "idle" | "copying" | "copied" | "error";
export type CopyState = {
  status: CopyStatus;
  words: number; // known once the file has loaded
  bytes: number;
  seq: number; // successful copies this visit
  errors: number; // failed copies this visit
  source: CopySource | null;
  assistant: AssistantId | null;
};

let state: CopyState = { status: "idle", words: 0, bytes: 0, seq: 0, errors: 0, source: null, assistant: null };
const subs = new Set<() => void>();
const set = (patch: Partial<CopyState>) => {
  state = { ...state, ...patch };
  subs.forEach((f) => f());
};
const subscribe = (f: () => void) => {
  subs.add(f);
  return () => subs.delete(f);
};

export const getCopy = () => state;
export const setFile = (words: number, bytes: number) => set({ words, bytes });
export const setCopying = (source: CopySource, assistant?: AssistantId) => set({ status: "copying", source, assistant: assistant ?? null });
export const markCopied = (words: number, source: CopySource, assistant?: AssistantId) =>
  set({ status: "copied", words, seq: state.seq + 1, source, assistant: assistant ?? null });
export const markError = (source: CopySource) => set({ status: "error", errors: state.errors + 1, source });

export function useCopy(): CopyState {
  return useSyncExternalStore(subscribe, getCopy, getCopy);
}

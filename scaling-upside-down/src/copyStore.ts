// One shared record of the file and of copies, so every button and the screen-reader announcement
// agree. `seq` goes up by one on each successful copy. What is copied is the file's starting prompt
// (the Bootloader itself is a file: downloaded, emailed, uploaded).
import { useSyncExternalStore } from "react";

export type CopySource = "loop" | "notice" | "appendix";
export type CopyPart = "file" | "prompt";
export type CopyStatus = "idle" | "copying" | "copied" | "error";
export type CopyState = {
  status: CopyStatus;
  words: number; // known once the file has loaded
  bytes: number;
  seq: number; // successful copies this visit
  errors: number; // failed copies this visit
  source: CopySource | null;
  part: CopyPart | null;
};

let state: CopyState = { status: "idle", words: 0, bytes: 0, seq: 0, errors: 0, source: null, part: null };
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
export const setCopying = (source: CopySource, part: CopyPart) => set({ status: "copying", source, part });
export const markCopied = (source: CopySource, part: CopyPart) => set({ status: "copied", seq: state.seq + 1, source, part });
export const markError = (source: CopySource) => set({ status: "error", errors: state.errors + 1, source });

export function useCopy(): CopyState {
  return useSyncExternalStore(subscribe, getCopy, getCopy);
}

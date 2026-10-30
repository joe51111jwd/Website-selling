// Cancellable waits for scripted sequences (the intro, the key).
export class Aborted extends Error {}

export function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Aborted());
    const id = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(id);
      reject(new Aborted());
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** Resolves when web fonts are ready, or after `cap` ms, whichever is first. */
export function fontsReady(cap = 1200): Promise<void> {
  const ready = (document as Document & { fonts?: FontFaceSet }).fonts?.ready ?? Promise.resolve();
  return Promise.race([ready.then(() => undefined), new Promise<void>((r) => window.setTimeout(r, cap))]);
}

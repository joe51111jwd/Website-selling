// Small async helper for user-triggered sequences (the equation, the finale).
export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

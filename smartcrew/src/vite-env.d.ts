/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WATERMARK?: string;
  /** "1": a review build for Andrew (the ⚑ markers and unapproved proposals show). */
  readonly VITE_SHOW_FLAGS?: string;
  readonly VITE_LOOK?: string;
  /** "1": the pain picker may ask /api/match-pain (set in vite.config.ts: Vercel builds with the key). */
  readonly VITE_PAIN_AI?: string;
}

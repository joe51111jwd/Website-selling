/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WATERMARK?: string;
  /** "1": a review build for Andrew (the ⚑ markers and unapproved proposals show). */
  readonly VITE_SHOW_FLAGS?: string;
}

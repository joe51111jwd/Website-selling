// Prerender entry (brief 8.3a), loaded by scripts/prerender.mjs through Vite's ssrLoadModule.
// Renders <App/> with react-dom/static and waits for every Suspense boundary. Owner: A1.

import { StrictMode } from 'react';
import { prerender } from 'react-dom/static';
import { App } from '../App';

export interface RenderResult {
  html: string;
  errors: string[];
}

export async function render(): Promise<RenderResult> {
  const errors: string[] = [];
  const { prelude } = await prerender(
    <StrictMode>
      <App />
    </StrictMode>,
    {
      // Never outline Suspense boundaries: one static document with no $RC scripts or templates
      // (brief 8.3a; the no-JS page must hold the real sheets, and CSP blocks inline scripts). A2-4.
      progressiveChunkSize: Number.POSITIVE_INFINITY,
      onError(error: unknown, info?: { componentStack?: string }) {
        const e = error as Error;
        errors.push(`${e?.stack ?? String(error)}${info?.componentStack ? `\n${info.componentStack}` : ''}`);
      },
    },
  );
  const html = await new Response(prelude as ReadableStream<Uint8Array>).text();
  return { html, errors };
}

export { lintHtml, lintSource, type LintViolation } from './lintRules';

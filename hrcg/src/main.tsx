// Client entry. Owner: A1.
// - ?sandbox=<name> (dev server only): client-render the sandbox router (no hydration).
// - Prerendered page (#root[data-prerendered]): hydrateRoot(<App/>). React's first render is
//   state-agnostic, so it matches the prerendered markup exactly (brief 8.3a).
// - Dev server (empty #root): createRoot(<App/>).

import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './system/fonts.css';
import './system/tokens.css';
import './system/base.css';
import './chrome/chrome.css';
import { App } from './App';

const root = document.getElementById('root')!;
const params = new URLSearchParams(window.location.search);

// Sandboxes exist on the dev server only (the production shell never bundles the router).
if (import.meta.env.DEV && params.has('sandbox')) {
  void import('./sandboxes/index').then(({ SandboxRoot }) => {
    createRoot(root).render(
      <StrictMode>
        <SandboxRoot
          name={params.get('sandbox') ?? ''}
          chrome={params.get('chrome') === '1'}
          ground={params.get('ground')}
        />
      </StrictMode>,
    );
  });
} else if (root.hasAttribute('data-prerendered') && root.firstElementChild) {
  hydrateRoot(
    root,
    <StrictMode>
      <App />
    </StrictMode>,
    {
      onRecoverableError(error) {
        console.warn('[HRCG] hydration recovered:', error);
      },
    },
  );
} else {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './App';
import { PaintDefs } from './Hero';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PaintDefs />
    <App />
  </StrictMode>,
);

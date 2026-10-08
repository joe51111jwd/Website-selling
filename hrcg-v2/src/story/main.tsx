import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles.css';
import './story.css';
import { Story } from './Story';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Story />
  </StrictMode>,
);

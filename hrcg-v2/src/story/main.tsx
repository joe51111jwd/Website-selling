import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles.css';
import './story.css';
import { Story } from './Story';
import { PaintDefs } from '../Hero';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PaintDefs />
    <Story />
  </StrictMode>,
);

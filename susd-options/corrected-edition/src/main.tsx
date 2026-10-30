import { createRoot } from 'react-dom/client';
import './styles/fonts.css';
import './styles/base.css';
import './styles/sheet.css';
import './styles/sections.css';
import './styles/finale.css';
import { App } from './App';
import { installGrain, installLight, installShadows } from './paper';

createRoot(document.getElementById('root')!).render(<App />);

// The paper, the lamp and the shadows are baked after the first frame (see paper.ts).
performance.mark('tex-start');
installGrain();
installShadows();
installLight();
performance.mark('tex-end');

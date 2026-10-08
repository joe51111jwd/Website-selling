// Self-hosted variable fonts (the same files as the site's public/fonts). @remotion/fonts blocks
// rendering until each face has loaded (delayRender inside loadFont).
import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';
import { F } from './theme';

export const fontsReady = Promise.all([
  loadFont({ family: F.bs, url: staticFile('fonts/big-shoulders.woff2'), weight: '100 900', display: 'block' }),
  loadFont({ family: F.stencil, url: staticFile('fonts/big-shoulders-stencil.woff2'), weight: '100 900', display: 'block' }),
  loadFont({ family: F.archivo, url: staticFile('fonts/archivo.woff2'), weight: '100 900', display: 'block' }),
  loadFont({ family: F.mono, url: staticFile('fonts/jetbrains-mono.woff2'), weight: '100 800', display: 'block' }),
]);

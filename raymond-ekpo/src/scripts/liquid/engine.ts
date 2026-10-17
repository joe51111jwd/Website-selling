// The renderer behind the page. A fixed canvas draws the ember light and, at the top of the page,
// the headline and the liquid glass droplets moving over it. Sections set the light with
// data-light="strength focusX focusY angle"; the light eases towards whichever section is in the
// middle of the screen. The page's own content sits on top as ordinary HTML.
import { flush, finePointer, still } from '../fx/frame';
import { program, target, triangle, bindTex, free, type Target } from './gl';
import { SCENE_FRAG, DROPS_FRAG, MAX_DROPS } from './shaders';
import { Drops } from './drops';
import { drawHeadline } from './headline';

type Light = { glow: number; fx: number; fy: number; turn: number };

const parseLight = (el: HTMLElement): Light => {
  const [glow = 1, fx = 0.7, fy = 0.6, turn = -0.35] = (el.dataset.light ?? '').split(/\s+/).filter(Boolean).map(Number);
  return { glow, fx, fy, turn };
};

export function start() {
  const html = document.documentElement;
  const canvas = document.querySelector<HTMLCanvasElement>('.liquid-canvas');
  const gl = canvas?.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' });
  if (!canvas || !gl) return;

  let sceneP: ReturnType<typeof program>;
  let dropsP: ReturnType<typeof program>;
  try {
    sceneP = program(gl, SCENE_FRAG);
    dropsP = program(gl, DROPS_FRAG);
  } catch (e) {
    console.warn('Liquid: falling back to CSS', e);
    return;
  }
  const draw = triangle(gl);

  const textTex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, textTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  let textPad = 0;
  let textReady = 0;

  let scene: Target | null = null;
  let W = 0;
  let H = 0;
  let quality = 1;
  const resize = () => {
    W = innerWidth;
    H = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2) * quality;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    free(gl, scene);
    scene = target(gl, canvas.width, canvas.height, { internal: gl.RGBA8, format: gl.RGBA, type: gl.UNSIGNED_BYTE });
  };
  resize();

  // ---- the droplets and the headline they move over (one set per page) ----
  const field = document.querySelector<HTMLElement>('[data-drops]');
  const headline = document.querySelector<HTMLElement>('[data-headline]');
  const small = innerWidth < 760;
  let drops: Drops | null = null;
  if (field) {
    const r = field.getBoundingClientRect();
    drops = new Drops(r.width, r.height, small, field.dataset.drops || 'hero');
  }

  const buildText = async () => {
    if (!headline) return;
    const t = await drawHeadline(headline, Math.min(devicePixelRatio || 1, 2));
    gl.bindTexture(gl.TEXTURE_2D, textTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, t.canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    textPad = t.pad;
    textReady = 1;
    headline.classList.add('in-scene');
  };
  buildText();

  // ---- pointer ----
  const pointer = { x: -1e4, y: -1e4 };
  if (finePointer && field && !still) {
    addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType !== 'mouse') return;
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        const r = field.getBoundingClientRect();
        const inside = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
        drops?.point(inside ? e.clientX - r.left : null, e.clientY - r.top);
      },
      { passive: true },
    );
    document.documentElement.addEventListener('pointerleave', () => drops?.point(null));
    field.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('a, button')) return;
      const r = field.getBoundingClientRect();
      drops?.splash(e.clientX - r.left, e.clientY - r.top);
    });
  }

  // ---- the light, eased towards the section in view ----
  let sections: [HTMLElement, Light][] = [];
  const collect = () => (sections = [...document.querySelectorAll<HTMLElement>('[data-light]')].map((el) => [el, parseLight(el)]));
  collect();
  const light: Light = sections[0]?.[1] ? { ...sections[0][1] } : { glow: 1, fx: 0.7, fy: 0.6, turn: -0.35 };
  const wanted = (): Light => {
    let best: Light | null = null;
    for (const [el, l] of sections) {
      const r = el.getBoundingClientRect();
      if (r.top <= H * 0.5 && r.bottom >= H * 0.5) best = l;
    }
    return best ?? { glow: 0.35, fx: 0.7, fy: 0.75, turn: -0.35 };
  };

  html.classList.add('liquid-gl');

  let resizeTimer = 0;
  addEventListener('resize', () => {
    resize();
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (field && drops) {
        const r = field.getBoundingClientRect();
        drops.resize(r.width, r.height);
      }
      collect();
      buildText();
    }, 200);
  });

  let running = true;
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    html.classList.remove('liquid-gl');
    running = false;
  });

  const dropData = new Float32Array(MAX_DROPS * 4);
  const dirData = new Float32Array(MAX_DROPS * 2);
  let last = performance.now();
  let t0 = last;
  let appear = still ? 1 : 0;
  let calm = 0;
  let slow = 0;
  const wake = () => (calm = 20);
  if (still) ['scroll', 'resize'].forEach((ev) => addEventListener(ev, wake, { passive: true }));
  wake();

  const frame = (now: number) => {
    if (!running) return;
    requestAnimationFrame(frame);
    const real = Math.max(0, (now - last) / 1000);
    const dt = Math.min(1 / 30, real);
    last = now;
    if (document.hidden) return;
    if (still && calm-- <= 0) return;

    if (!still && real > 0.028) {
      if (++slow > 80 && quality > 0.55) {
        quality *= 0.85;
        slow = 0;
        resize();
      }
    } else slow = Math.max(0, slow - 1);

    flush();
    const time = (now - t0) / 1000;

    // light
    const goal = wanted();
    const k = still ? 1 : 1 - Math.pow(0.04, dt);
    light.glow += (goal.glow - light.glow) * k;
    light.fx += (goal.fx - light.fx) * k;
    light.fy += (goal.fy - light.fy) * k;
    light.turn += (goal.turn - light.turn) * k;

    // droplets
    let n = 0;
    let hr: DOMRect | null = null;
    if (drops && field) {
      hr = field.getBoundingClientRect();
      if (hr.bottom > -100 && hr.top < H + 100) {
        appear = Math.min(1, appear + real / 1.6);
        if (!still) drops.step(dt, time, 1 - Math.pow(1 - appear, 3));
        else if (appear >= 1 && drops.list.every((d) => d.cursor || d.r > 0)) {
          // reduced motion: the drops simply sit at their places
        } else drops.step(1 / 60, 0, 1);
        for (const d of drops.list) {
          if (n >= MAX_DROPS || d.r < 0.5) continue;
          const sp = Math.hypot(d.vx, d.vy);
          dropData.set([hr.left + d.x, hr.top + d.y, d.r, Math.min(0.45, sp / 1600)], n * 4);
          dirData.set(sp > 1 ? [d.vx / sp, d.vy / sp] : [1, 0], n * 2);
          n++;
        }
      }
    }

    // pass 1: the scene
    gl.useProgram(sceneP.p);
    let u = sceneP.u;
    gl.uniform2f(u.uRes, W, H);
    gl.uniform1f(u.uTime, still ? 12 : time);
    gl.uniform1f(u.uGlow, light.glow);
    gl.uniform1f(u.uTurn, light.turn);
    gl.uniform2f(u.uFocus, light.fx, light.fy);
    bindTex(gl, u.uText, textTex, 0);
    if (headline && textReady) {
      const r = headline.getBoundingClientRect();
      gl.uniform4f(u.uTextRect, r.left - textPad, r.top - textPad, r.width + textPad * 2, r.height + textPad * 2);
      gl.uniform1f(u.uTextOn, r.bottom > -50 && r.top < H + 50 ? 1 : 0);
    } else gl.uniform1f(u.uTextOn, 0);
    draw(scene);

    // pass 2: the glass
    gl.useProgram(dropsP.p);
    u = dropsP.u;
    bindTex(gl, u.uScene, scene!.tex, 0);
    gl.uniform2f(u.uRes, W, H);
    gl.uniform1f(u.uDpr, canvas.width / W);
    gl.uniform1i(u.uCount, n);
    gl.uniform4fv(u['uDrop[0]'], dropData);
    gl.uniform2fv(u['uDir[0]'], dirData);
    gl.uniform1f(u.uK, small ? 26 : 40);
    gl.uniform2f(u.uLight, pointer.x, pointer.y);
    draw(null, canvas.width, canvas.height);
  };
  requestAnimationFrame(frame);

  if (import.meta.env.DEV) {
    Object.assign(window, {
      __liquid: {
        drops,
        warm: (s: number) => {
          for (let i = 0; i < s * 60; i++) drops?.step(1 / 60, (performance.now() - t0) / 1000 + i / 60, 1);
          t0 -= s * 1000;
          appear = 1;
        },
      },
    });
  }
}

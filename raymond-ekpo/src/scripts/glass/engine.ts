// The Liquid Glass renderer. A fixed WebGL canvas sits behind the page. Every frame it steps the
// ink, reads where the glass sits on the page, draws the world (paper, ink, light, the lens slide)
// into a texture, then draws that texture through the glass. The page's own text sits on top, so
// it stays real, selectable and accessible.
import { flush, finePointer, still } from '../fx/frame';
import { program, target, triangle, bindTex, free, type Target } from './gl';
import { WORLD_FRAG, GLASS_FRAG, MAX_RECTS, MAX_TEXTS, MAX_ZONES } from './shaders';
import { KINDS, SELECTORS, type Kind } from './targets';
import { buildAtlas, slotRect, type Slot } from './sdf';
import { Fluid } from './fluid';
import { lens } from './state';

type Item = { el: HTMLElement; k: Kind; radius: number; fade: HTMLElement | null; clip: HTMLElement | null };
type Emitter = { el: HTMLElement; next: number; every: number; x0: number; x1: number; y: string; first: number; amount: number; drops: number; seen: boolean };

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function start() {
  const html = document.documentElement;
  const canvas = document.querySelector<HTMLCanvasElement>('.glass-canvas');
  const gl = canvas?.getContext('webgl2', {
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  if (!canvas || !gl) return; // the CSS glass in glass.css stays as the fallback

  let world: ReturnType<typeof program>;
  let glass: ReturnType<typeof program>;
  try {
    world = program(gl, WORLD_FRAG);
    glass = program(gl, GLASS_FRAG);
  } catch (e) {
    console.warn('Liquid Glass: falling back to CSS', e);
    return;
  }
  const draw = triangle(gl);

  const small = innerWidth < 700;
  let fluid: Fluid | null = null;
  try {
    if (Fluid.supported(gl)) fluid = new Fluid(gl, draw, small ? 520 : 900, small ? 104 : 176);
  } catch (e) {
    console.warn('Liquid Glass: no ink', e);
    fluid = null;
  }

  const blank = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, blank);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));

  const atlasTex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, atlasTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 1, 1, 0, gl.RED, gl.UNSIGNED_BYTE, new Uint8Array(1));
  let atlasSize = [1, 1];

  const slideA = gl.createTexture()!;
  const slideB = gl.createTexture()!;
  let slideVersion = -1;

  let scene: Target | null = null;
  let quality = 1;
  let W = 0;
  let H = 0;

  const resize = () => {
    W = innerWidth;
    H = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.75) * quality;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    free(gl, scene);
    scene = target(gl, canvas.width, canvas.height, { internal: gl.RGBA8, format: gl.RGBA, type: gl.UNSIGNED_BYTE, mips: true });
    fluid?.resize(W, H);
  };

  // ---- what is glass ----
  let items: Item[] = [];
  const shut = (el: HTMLElement) => {
    const d = el.closest('details');
    return !!d && !d.open && !el.closest('summary');
  };
  // the nearest ancestor that crops its content: glass inside it shows only while it's inside
  const clipper = (el: HTMLElement) => {
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') return a;
    }
    return null;
  };
  const collect = () => {
    const found = new Map<HTMLElement, Kind>();
    for (const [sel, kind] of SELECTORS) document.querySelectorAll<HTMLElement>(sel).forEach((el) => found.has(el) || found.set(el, KINDS[kind]));
    document.querySelectorAll<HTMLElement>('[data-glass]').forEach((el) => found.set(el, KINDS[el.dataset.glass!] ?? KINDS.pane));
    items = [...found]
      .filter(([el]) => !shut(el) && !el.closest('.bar'))
      .map(([el, k]) => {
        el.classList.add('lg');
        return {
          el,
          k,
          radius: parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0,
          fade: el.closest<HTMLElement>('[data-reveal], .fade-in, [data-glass-fade]'),
          clip: clipper(el),
        };
      });
    // document order, with anything that floats drawn last
    items.sort((a, b) => (a.k.z ?? 0) - (b.k.z ?? 0) || (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  };

  // ---- glass lettering ----
  let slots: Slot[] = [];
  let building = false;
  const rebuildText = async () => {
    if (building) return;
    building = true;
    await document.fonts.ready;
    const targets = [...document.querySelectorAll<HTMLElement>('[data-glass-text]')].map((el) => ({
      el,
      clip: el.closest<HTMLElement>('[data-glass-clip]'),
    }));
    const previous = new Map(slots.map((s) => [s.el, s]));
    const atlas = await buildAtlas(targets);
    for (const s of atlas.slots) {
      const old = previous.get(s.el);
      if (old) {
        s.appear = old.appear;
        s.seen = old.seen;
      }
    }
    document.querySelectorAll('.lg-text-on').forEach((el) => el.classList.remove('lg-text-on'));
    atlas.slots.forEach((s) => {
      s.el.classList.add('lg-text-on');
      s.dark = !!s.el.closest('[data-world="dark"], .band-ink:not(.shelf-band), .band-ox');
    });
    slots = atlas.slots.slice(0, MAX_TEXTS);
    gl.bindTexture(gl.TEXTURE_2D, atlasTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, atlas.width, atlas.height, 0, gl.RED, gl.UNSIGNED_BYTE, atlas.pixels);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    atlasSize = [atlas.width, atlas.height];
    building = false;
  };

  // ---- ink: sections marked data-ink drop some in now and then while they're on screen ----
  let emitters: Emitter[] = [];
  const collectEmitters = () => {
    zoned = !!document.querySelector('[data-ink-zone]');
    const old = new Map(emitters.map((e) => [e.el, e]));
    emitters = [...document.querySelectorAll<HTMLElement>('[data-ink]')].map((el) => {
      const [x0, x1] = (el.dataset.inkX ?? '0.1 0.9').split(' ').map(Number);
      return (
        old.get(el) ?? {
          el,
          next: 0,
          drops: 0,
          seen: false,
          every: Number(el.dataset.inkEvery ?? 5),
          x0,
          x1,
          // px from the top, or from the bottom when it ends in "b"
          y: el.dataset.inkY ?? '-40',
          // the opening drops land this far below the usual entry point
          first: Number(el.dataset.inkFirst ?? 120),
          amount: Number(el.dataset.ink || 1),
        }
      );
    });
  };
  let zoned = false;
  let inkActive = false;
  let lastInkSeen = -1e9;

  // reduced motion: the opening drops play out of sight, a few seconds of them in one go, and
  // the ink is shown only once it has settled
  const settle: (() => void)[] = [];
  const opening = (e: Emitter, r: DOMRect, top: number, k: number) => {
    const x = e.x0 + (e.x1 - e.x0) * [rand(0.2, 0.3), rand(0.7, 0.8), rand(0.45, 0.55)][k];
    fluid!.drop(r.left + r.width * x, top + e.first + (still ? k * 40 : 0), [7, 5.5, 4.5][k] * e.amount, [20, 17, 14][k], rand(-5, 5), 80);
  };

  const emit = (time: number) => {
    if (!fluid) return;
    let seen = false;
    for (const e of emitters) {
      const r = e.el.getBoundingClientRect();
      if (r.bottom < -H * 0.2 || r.top > H * 1.1) {
        if (still) e.seen = false;
        continue;
      }
      seen = true;
      const at = (x: number) => r.left + r.width * x;
      const top = e.y.endsWith('b') ? r.bottom + parseFloat(e.y) : r.top + parseFloat(e.y);
      if (still) {
        if (e.seen) continue;
        e.seen = true;
        const steps = (n: number) => Array.from({ length: n }, () => () => fluid!.step(1 / 60, 0, time));
        settle.push(() => opening(e, r, top, 0), ...steps(27), () => opening(e, r, top, 1), ...steps(27), () => opening(e, r, top, 2), ...steps(330));
        continue;
      }
      if (time < e.next) continue;
      if (e.drops < 3) {
        // the first visit opens with three drops close together, falling fast into the name
        opening(e, r, top, e.drops);
        e.next = time + [0.45, 0.9, e.every][e.drops];
      } else {
        const darker = Math.random() < 0.25 ? 0.5 : 0;
        fluid.drop(at(rand(e.x0, e.x1)), top, rand(3.5, 5.5) * e.amount, rand(11, 18), rand(-6, 6), rand(30, 44), darker);
        e.next = time + e.every * rand(0.7, 1.3);
      }
      e.drops++;
    }
    if (seen) lastInkSeen = time;
  };

  // ---- the world's zones ----
  const zones = (sel: string, out: Float32Array) => {
    let n = 0;
    document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      if (n >= MAX_ZONES) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > H + 200) return;
      // a band that spans the page only fades at its top and bottom, and not at all at the page's end
      const full = r.left <= 1 && r.right >= W - 1;
      const last = r.bottom + scrollY >= document.documentElement.scrollHeight - 2;
      const h = r.height + (last ? 600 : 0);
      out.set(full ? [-400, r.top, W + 800, h] : [r.left, r.top, r.width, h], n * 4);
      n++;
    });
    return n;
  };
  // the floating nav darkens over dark sections, the way glass takes on what's behind it
  const bar = document.querySelector<HTMLElement>('.bar');
  let barDark = false;

  // ---- the cursor: a light for the glass and a hand in the water ----
  const cursor = { x: -1e4, y: -1e4, on: 0, target: 0, dx: 0, dy: 0 };
  if (finePointer) {
    addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType !== 'mouse') return;
        if (cursor.target) {
          cursor.dx += e.clientX - cursor.x;
          cursor.dy += e.clientY - cursor.y;
        }
        cursor.x = e.clientX;
        cursor.y = e.clientY;
        cursor.target = 1;
      },
      { passive: true },
    );
    document.documentElement.addEventListener('pointerleave', () => (cursor.target = 0));
  }

  // ---- set up ----
  resize();
  collect();
  collectEmitters();
  rebuildText();
  html.classList.add('glass-gl');

  let resizeTimer = 0;
  addEventListener('resize', () => {
    resize();
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      collect();
      rebuildText();
    }, 220);
  });
  let mutateTimer = 0;
  new MutationObserver(() => {
    clearTimeout(mutateTimer);
    mutateTimer = window.setTimeout(() => {
      collect();
      collectEmitters();
    }, 120);
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open', 'hidden', 'data-glass'], childList: true });

  let running = true;
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    html.classList.remove('glass-gl');
    running = false;
  });

  const rects = new Float32Array(MAX_RECTS * 4);
  const shapes = new Float32Array(MAX_RECTS * 4);
  const tints = new Float32Array(MAX_RECTS * 4);
  const fx = new Float32Array(MAX_RECTS * 4);
  const tRects = new Float32Array(MAX_TEXTS * 4);
  const tUV = new Float32Array(MAX_TEXTS * 4);
  const tClip = new Float32Array(MAX_TEXTS * 4);
  const tFx = new Float32Array(MAX_TEXTS * 4);
  const dark = new Float32Array(MAX_ZONES * 4);
  const lit = new Float32Array(MAX_ZONES * 4);
  const inkZones = new Float32Array(MAX_ZONES * 4);
  const bands = new Float32Array(16);

  // dev only: ?sim=8 runs the ink faster, for screenshots from a slow software renderer
  const simSpeed = import.meta.env.DEV ? Number(new URLSearchParams(location.search).get('sim') ?? 1) : 1;
  let last = performance.now();
  let t0 = last;
  let lastScroll = scrollY;
  let slowFrames = 0;
  let calm = 0; // reduced motion: frames left to draw after something changed
  const wake = () => (calm = 30);
  if (still) ['scroll', 'resize', 'pointerdown', 'keydown', 'transitionrun', 'input'].forEach((ev) => addEventListener(ev, wake, { passive: true, capture: true }));
  wake();

  const frame = (now: number) => {
    if (!running) return;
    requestAnimationFrame(frame);
    // the first frame's timestamp can come before start(), so never let time run backwards
    const real = Math.max(0, (now - last) / 1000);
    const dt = Math.min(1 / 30, real);
    last = now;
    if (document.hidden) return;
    if (still && calm <= 0 && !settle.length) return;
    calm--;

    if (!still && dt > 0.026) {
      if (++slowFrames > 90 && quality > 0.6) {
        quality = Math.max(0.6, quality * 0.85);
        slowFrames = 0;
        resize();
      }
    } else slowFrames = Math.max(0, slowFrames - 1);

    flush();
    const time = (now - t0) / 1000;
    const y = scrollY;
    const scrolled = y - lastScroll;
    lastScroll = y;

    // ---- ink ----
    if (fluid) {
      emit(time);
      const wanted = still || time - lastInkSeen < 25;
      if (wanted && !inkActive) {
        // back after a long while: the water was cleared, so the opening plays again
        fluid.clear();
        emitters.forEach((e) => (e.drops = 0));
      }
      inkActive = wanted;
      if (inkActive) {
        if (!still && cursor.target && (cursor.dx || cursor.dy)) fluid.stir(cursor.x, cursor.y, cursor.dx, cursor.dy);
        if (!still) {
          fluid.step(dt, scrolled, time);
          for (let i = 1; i < simSpeed; i++) fluid.step(1 / 60, 0, time);
        } else {
          if (scrolled) fluid.step(0, scrolled, time);
          for (let i = 0; i < 24 && settle.length; i++) settle.shift()!();
          if (settle.length) calm = Math.max(calm, 2);
        }
      }
    }
    cursor.dx = 0;
    cursor.dy = 0;
    cursor.on += (cursor.target - cursor.on) * Math.min(1, dt * 4);

    // ---- glass on screen this frame ----
    let n = 0;
    for (const it of items) {
      if (n >= MAX_RECTS) break;
      const r = it.el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.bottom < -80 || r.top > H + 80 || r.right < -80 || r.left > W + 80) continue;
      if (it.el.closest('[inert]')) continue;
      let alpha = parseFloat(getComputedStyle(it.el).opacity);
      if (it.fade && it.fade !== it.el) alpha *= parseFloat(getComputedStyle(it.fade).opacity);
      if (it.clip) {
        // leave it out while the box that crops it hides it entirely (a folded panel, say)
        const c = it.clip.getBoundingClientRect();
        const ix = Math.max(0, Math.min(r.right, c.right) - Math.max(r.left, c.left));
        const iy = Math.max(0, Math.min(r.bottom, c.bottom) - Math.max(r.top, c.top));
        if (ix * iy < r.width * r.height * 0.02) continue;
      }
      if (alpha < 0.01) continue;
      const k = it.k;
      rects.set([r.left, r.top, r.width, r.height], n * 4);
      shapes.set([it.radius, k.bezel, k.thick, k.frost], n * 4);
      tints.set(k.tint, n * 4);
      fx.set([k.magnify ?? 1, alpha, k.shadow ?? 0, k.bend ?? 1], n * 4);
      n++;
    }

    let tn = 0;
    for (const s of slots) {
      if (tn >= MAX_TEXTS || !s.el.isConnected) continue;
      const r = slotRect(s);
      if (r.y + r.h < 0 || r.y > H || r.w < 2) continue;
      s.seen = true;
      s.appear = still ? 1 : Math.min(1, s.appear + Math.min(real, 0.5) / 1.5);
      const c = s.clip?.getBoundingClientRect();
      tRects.set([r.x, r.y, r.w, r.h], tn * 4);
      tUV.set([s.ax / atlasSize[0], s.ay / atlasSize[1], s.aw / atlasSize[0], s.ah / atlasSize[1]], tn * 4);
      tClip.set(c ? [c.left, c.top, c.width, c.height] : [-1e4, -1e4, 2e4, 2e4], tn * 4);
      const e = 1 - Math.pow(1 - s.appear, 3);
      tFx.set([s.range, Math.max(3.5, s.fontSize * 0.034 + (s.fontSize < 140 ? 1.5 : 0)), e, s.dark ? 1 : 0], tn * 4);
      tn++;
    }

    const darkN = zones('[data-world="dark"], .band-ink:not(.shelf-band), .band-ox', dark);
    let overDark = false;
    for (let i = 0; i < darkN; i++) if (dark[i * 4 + 1] < 40 && dark[i * 4 + 1] + dark[i * 4 + 3] > 40) overDark = true;
    if (bar && overDark !== barDark) {
      barDark = overDark;
      bar.classList.toggle('bar--dark', overDark);
    }
    const litN = zones('[data-world="light"]', lit);
    const inkZoneN = zones('[data-ink-zone]', inkZones);

    // ---- the lens and its slide ----
    let slideOn = 0;
    let slideRect = [0, 0, 0, 0];
    if (lens.slide && lens.before && lens.after) {
      if (lens.version !== slideVersion) {
        for (const [tex, src] of [
          [slideA, lens.before],
          [slideB, lens.after],
        ] as const) {
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        slideVersion = lens.version;
      }
      const r = lens.slide.getBoundingClientRect();
      if (r.bottom > -100 && r.top < H + 100) {
        slideOn = 1;
        slideRect = [r.left, r.top, r.width, r.height];
      }
    }
    bands.fill(0);
    lens.bands.slice(0, 4).forEach((b, i) => bands.set(b, i * 4));
    const lensOn = slideOn ? lens.on : 0;

    // ---- pass 1: the world ----
    gl.useProgram(world.p);
    let u = world.u;
    gl.uniform2f(u.uRes, W, H);
    gl.uniform1f(u.uScroll, y);
    gl.uniform1f(u.uTime, still ? 0 : time);
    bindTex(gl, u.uDye, fluid && inkActive ? fluid.texture : blank, 0);
    gl.uniform2f(u.uDomain, fluid?.M ?? 0, fluid?.D ?? H);
    gl.uniform2f(u.uDyeTexel, 1.5 / Math.max(1, W), 1.5 / Math.max(1, fluid?.D ?? H));
    gl.uniform1f(u.uInk, fluid && inkActive && !settle.length ? 1 : 0);
    gl.uniform1i(u.uDarkN, darkN);
    gl.uniform4fv(u['uDark[0]'], dark);
    gl.uniform1i(u.uLightN, litN);
    gl.uniform4fv(u['uLight[0]'], lit);
    gl.uniform1i(u.uInkZoneN, inkZoneN);
    gl.uniform1f(u.uInkZoned, zoned ? 1 : 0);
    gl.uniform4fv(u['uInkZone[0]'], inkZones);
    bindTex(gl, u.uSlideA, slideOn ? slideA : blank, 1);
    bindTex(gl, u.uSlideB, slideOn ? slideB : blank, 2);
    gl.uniform4f(u.uSlide, slideRect[0], slideRect[1], slideRect[2], slideRect[3]);
    gl.uniform1f(u.uSlideOn, slideOn);
    gl.uniform4f(u.uLens, lens.x, lens.y, lens.r, lensOn);
    gl.uniform4fv(u['uWipe[0]'], bands);
    gl.uniform1fv(u['uWipeX[0]'], lens.wipe);
    draw(scene);
    gl.bindTexture(gl.TEXTURE_2D, scene!.tex);
    gl.generateMipmap(gl.TEXTURE_2D);

    // ---- pass 2: through the glass ----
    gl.useProgram(glass.p);
    u = glass.u;
    bindTex(gl, u.uScene, scene!.tex, 0);
    bindTex(gl, u.uAtlas, atlasTex, 1);
    gl.uniform2f(u.uRes, W, H);
    gl.uniform1f(u.uDpr, canvas.width / W);
    gl.uniform1f(u.uTime, still ? 0 : time);
    gl.uniform3f(u.uCursor, cursor.x, cursor.y, cursor.on);
    gl.uniform1i(u.uCount, n);
    gl.uniform4fv(u['uRect[0]'], rects);
    gl.uniform4fv(u['uShape[0]'], shapes);
    gl.uniform4fv(u['uTint[0]'], tints);
    gl.uniform4fv(u['uFx[0]'], fx);
    gl.uniform1i(u.uTextN, tn);
    gl.uniform2f(u.uAtlasTexel, 1 / atlasSize[0], 1 / atlasSize[1]);
    gl.uniform4fv(u['uTRect[0]'], tRects);
    gl.uniform4fv(u['uTUV[0]'], tUV);
    gl.uniform4fv(u['uTClip[0]'], tClip);
    gl.uniform4fv(u['uTFx[0]'], tFx);
    gl.uniform4f(u.uLens, lens.x, lens.y, lens.r, lensOn);
    gl.uniform1f(u.uLensMag, lens.mag);
    draw(null, canvas.width, canvas.height);
  };
  requestAnimationFrame(frame);
  if (import.meta.env.DEV) Object.assign(window, { __glass: { get slots() { return slots; }, get items() { return items; }, fluid, lens, warm: (n: number) => { const t = (performance.now() - t0) / 1000; for (let i = 0; i < n; i++) { emit(t + i / 60); fluid?.step(1 / 60, 0, t + i / 60); } t0 -= n * (1000 / 60); } } });
}

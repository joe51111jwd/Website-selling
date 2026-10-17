// The Liquid Glass renderer. A fixed WebGL canvas sits behind the page. Every frame it reads
// where the glass elements are, then draws the moving backdrop and the glass that bends it.
// The page's own text sits on top, so everything stays selectable, accessible and crisp.
import { flush, finePointer, still } from '../fx/frame';
import { BACK_FRAG, COMP_FRAG, MAX_RECTS, MAX_TEXTS, VERT } from './shaders';
import { MOODS, SECTION_MOODS, TARGETS, TEXTS, TINTS, type Target } from './targets';
import { buildAtlas, slotRect, type Slot } from './atlas';

type Item = { el: HTMLElement; t: Target; radius: number; order: number };

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
  return s;
}

function program(gl: WebGL2RenderingContext, frag: string) {
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag));
  gl.bindAttribLocation(p, 0, 'aPos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link');
  const u = new Proxy({} as Record<string, WebGLUniformLocation | null>, {
    get: (cache, name: string) => (name in cache ? cache[name] : (cache[name] = gl.getUniformLocation(p, name))),
  });
  return { p, u };
}

export function start() {
  const html = document.documentElement;
  const canvas = document.querySelector<HTMLCanvasElement>('.glass-canvas');
  const gl = canvas?.getContext('webgl2', { antialias: false, alpha: false, depth: false, powerPreference: 'high-performance' });
  if (!canvas || !gl) return; // the CSS glass in glass.css stays as the fallback

  let back: ReturnType<typeof program>;
  let comp: ReturnType<typeof program>;
  try {
    back = program(gl, BACK_FRAG);
    comp = program(gl, COMP_FRAG);
  } catch (e) {
    console.warn('Liquid Glass: falling back to CSS', e);
    return;
  }

  // one triangle that covers the screen
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // the backdrop renders into a mipmapped texture so glass can frost it by picking a blurrier level
  const backTex = gl.createTexture();
  const fbo = gl.createFramebuffer();
  const atlasTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, atlasTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  let atlasSize = [1, 1];

  let quality = 1;
  let W = 0;
  let H = 0;
  let dpr = 1;
  let bw = 0;
  let bh = 0;

  const resize = () => {
    W = innerWidth;
    H = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 1.5) * quality;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    bw = Math.max(1, Math.round(canvas.width / 2));
    bh = Math.max(1, Math.round(canvas.height / 2));
    gl.bindTexture(gl.TEXTURE_2D, backTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, bw, bh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, backTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  // ---- which elements are glass ----
  let items: Item[] = [];
  const allSel = TARGETS.map((t) => t.sel).join(',');
  // inside a closed menu the browser still reports a size, so leave those out until it opens
  const shut = (el: HTMLElement) => {
    const d = el.closest('details');
    return !!d && !d.open && !el.closest('summary');
  };
  const collect = () => {
    items = [...document.querySelectorAll<HTMLElement>(allSel)].filter((el) => !shut(el)).map((el, order) => {
      const t = TARGETS.find((x) => el.matches(x.sel))!;
      el.classList.add('lg');
      return { el, t, radius: parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, order };
    });
    items.sort((a, b) => (a.t.z ?? 0) - (b.t.z ?? 0) || a.order - b.order);
  };

  // ---- glass lettering ----
  let slots: Slot[] = [];
  let building = false;
  const rebuildText = async () => {
    if (building) return;
    building = true;
    await document.fonts.ready;
    const targets = TEXTS.flatMap(({ sel, clip }) =>
      [...document.querySelectorAll<HTMLElement>(sel)].map((el) => ({ el, clip: clip ? el.closest<HTMLElement>(clip) : null })),
    );
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
    atlas.slots.forEach((s) => s.el.classList.add('lg-text-on'));
    slots = atlas.slots.slice(0, MAX_TEXTS);
    gl.bindTexture(gl.TEXTURE_2D, atlasTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, atlas.width, atlas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, atlas.pixels);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    atlasSize = [atlas.width, atlas.height];
    building = false;
  };

  // ---- the backdrop's mood follows the section in view ----
  const mood = { base: [...MOODS.ink.base], vein: [...MOODS.ink.vein], glow: [...MOODS.ink.glow] };
  let moodSections: [HTMLElement, keyof typeof MOODS][] = [];
  const collectMoods = () => {
    moodSections = SECTION_MOODS.flatMap(([sel, m]) => [...document.querySelectorAll<HTMLElement>(sel)].map((el) => [el, m] as [HTMLElement, keyof typeof MOODS]));
  };
  const targetMood = () => {
    const mid = H * 0.5;
    let best: keyof typeof MOODS = 'ink';
    for (const [el, m] of moodSections) {
      const r = el.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) best = m;
    }
    return MOODS[best];
  };

  // ---- the droplet that follows the cursor ----
  const drop = { x: -500, y: -500, vx: 0, vy: 0, tx: -500, ty: -500, r: 0, on: false };
  let mouse = { x: W / 2, y: H * 0.3 };
  if (finePointer && !still) {
    addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType !== 'mouse') return;
        drop.tx = e.clientX;
        drop.ty = e.clientY;
        mouse = { x: e.clientX, y: e.clientY };
        if (!drop.on) {
          drop.on = true;
          drop.x = drop.tx;
          drop.y = drop.ty;
        }
      },
      { passive: true },
    );
    document.documentElement.addEventListener('pointerleave', () => (drop.on = false));
  }

  // ---- set up ----
  resize();
  collect();
  collectMoods();
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
  // menus opening, the fit check's summary appearing, panels changing: re-read the radii now and then
  new MutationObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(collect, 120);
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open', 'hidden', 'class'], childList: true });

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    html.classList.remove('glass-gl');
    running = false;
  });

  const rects = new Float32Array(MAX_RECTS * 4);
  const params = new Float32Array(MAX_RECTS * 4);
  const tints = new Float32Array(MAX_RECTS * 4);
  const tRects = new Float32Array(MAX_TEXTS * 4);
  const tUV = new Float32Array(MAX_TEXTS * 4);
  const tClip = new Float32Array(MAX_TEXTS * 4);
  const tAppear = new Float32Array(MAX_TEXTS);

  let running = true;
  let last = performance.now();
  let t0 = last;
  let slowFrames = 0;
  let calm = 0; // reduced motion: frames left to draw after something changed
  const wake = () => (calm = 40);
  if (still) ['scroll', 'resize', 'pointerdown', 'keydown', 'transitionrun', 'input'].forEach((ev) => addEventListener(ev, wake, { passive: true, capture: true }));
  wake();

  const frame = (now: number) => {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (document.hidden) return;
    if (still && calm-- <= 0) return;

    // drop resolution if this machine is struggling
    if (!still && dt > 0.028) {
      if (++slowFrames > 90 && quality > 0.6) {
        quality = Math.max(0.6, quality * 0.8);
        slowFrames = 0;
        resize();
      }
    } else slowFrames = Math.max(0, slowFrames - 1);

    flush();

    // panels on screen this frame
    let n = 0;
    for (const it of items) {
      if (n >= MAX_RECTS) break;
      const r = it.el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.bottom < -60 || r.top > H + 60 || r.right < -60 || r.left > W + 60) continue;
      rects.set([r.left, r.top, r.width, r.height], n * 4);
      params.set([it.radius, it.t.frost, it.t.bezel ?? 24, it.t.refract ?? 1], n * 4);
      tints.set(TINTS[it.t.tint], n * 4);
      n++;
    }

    // lettering on screen this frame
    let tn = 0;
    for (const s of slots) {
      if (tn >= MAX_TEXTS || !s.el.isConnected) continue;
      const r = slotRect(s);
      if (r.y + r.h < 0 || r.y > H || r.w < 2) continue;
      if (!s.seen) s.seen = true;
      s.appear = still ? 1 : Math.min(1, s.appear + dt / 1.6);
      const c = s.clip?.getBoundingClientRect();
      tRects.set([r.x, r.y, r.w, r.h], tn * 4);
      tUV.set([s.ax / atlasSize[0], s.ay / atlasSize[1], s.aw / atlasSize[0], s.ah / atlasSize[1]], tn * 4);
      tClip.set(c ? [c.left, c.top, c.width, c.height] : [-1e4, -1e4, 2e4, 2e4], tn * 4);
      tAppear[tn] = 1 - Math.pow(1 - s.appear, 3);
      tn++;
    }

    // mood eases towards the section in view
    const target = targetMood();
    const k = still ? 1 : 1 - Math.pow(0.02, dt);
    for (const key of ['base', 'vein', 'glow'] as const) {
      for (let i = 0; i < 3; i++) mood[key][i] += (target[key][i] - mood[key][i]) * k;
    }

    // the droplet: a spring that stretches along its path
    if (finePointer && !still) {
      const ax = (drop.tx - drop.x) * 120 - drop.vx * 14;
      const ay = (drop.ty - drop.y) * 120 - drop.vy * 14;
      drop.vx += ax * dt;
      drop.vy += ay * dt;
      drop.x += drop.vx * dt;
      drop.y += drop.vy * dt;
      drop.r += ((drop.on ? 34 : 0) - drop.r) * Math.min(1, dt * 8);
    }
    const speed = Math.hypot(drop.vx, drop.vy);
    const dir = speed > 1 ? [drop.vx / speed, drop.vy / speed] : [1, 0];
    const lx = -0.45 + (mouse.x / Math.max(1, W) - 0.5) * 0.9;
    const ly = -0.88 + (mouse.y / Math.max(1, H) - 0.5) * 0.5;
    const ll = Math.hypot(lx, ly);

    const time = still ? 0 : (now - t0) / 1000;

    // pass 1: the backdrop
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, bw, bh);
    gl.useProgram(back.p);
    gl.uniform2f(back.u.uRes, W, H);
    gl.uniform1f(back.u.uTime, time);
    gl.uniform1f(back.u.uScroll, scrollY);
    gl.uniform2f(back.u.uMouse, mouse.x, mouse.y);
    gl.uniform3fv(back.u.uBase, mood.base);
    gl.uniform3fv(back.u.uVein, mood.vein);
    gl.uniform3fv(back.u.uGlow, mood.glow);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindTexture(gl.TEXTURE_2D, backTex);
    gl.generateMipmap(gl.TEXTURE_2D);

    // pass 2: backdrop and glass
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(comp.p);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, backTex);
    gl.uniform1i(comp.u.uBack, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, atlasTex);
    gl.uniform1i(comp.u.uAtlas, 1);
    gl.uniform2f(comp.u.uRes, W, H);
    gl.uniform1f(comp.u.uDpr, canvas.width / W);
    gl.uniform2f(comp.u.uLight, lx / ll, ly / ll);
    gl.uniform1i(comp.u.uCount, n);
    gl.uniform4fv(comp.u['uRect[0]'], rects);
    gl.uniform4fv(comp.u['uParam[0]'], params);
    gl.uniform4fv(comp.u['uTint[0]'], tints);
    gl.uniform4f(comp.u.uDrop, drop.x, drop.y, drop.r, Math.min(0.7, speed / 2200));
    gl.uniform2f(comp.u.uDropDir, dir[0], dir[1]);
    gl.uniform1i(comp.u.uTextCount, tn);
    gl.uniform4fv(comp.u['uTRect[0]'], tRects);
    gl.uniform4fv(comp.u['uTUV[0]'], tUV);
    gl.uniform4fv(comp.u['uTClip[0]'], tClip);
    gl.uniform1fv(comp.u['uTAppear[0]'], tAppear);
    gl.uniform2f(comp.u.uAtlasTexel, 1 / atlasSize[0], 1 / atlasSize[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.activeTexture(gl.TEXTURE0);
  };
  requestAnimationFrame(frame);
}

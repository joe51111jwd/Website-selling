// SECTION A–A slice shader (brief 4.2). Owner: A4.
// ONLY ever loaded with dynamic import() (from SectionSlice), so three stays out of the shell bundle and
// shares the hero's lazy three chunk. One fullscreen quad, one draw call, rendered on demand.
//
//   d = depth(uv)                       near = 1 (8-bit single channel, smoothed to half float, LinearFilter)
//   in front of the plane (d > uSlice):  mix(slabBlack, chalk, d^1.4) · exposure + contour(d, 14)
//                                        (+ faint intermediate contours at a quarter interval). The brief's
//                                        0.85 exposure turned the near floor into a sheet of grey paper;
//                                        0.3 keeps the depth ramp but leaves it chalk on the slab.
//   behind the plane:                    the film frame
//   the cut line:                        chalk blue where |d − uSlice| < ~1 px (fwidth), crawling over 07
//
// Colours are the palette's sRGB values written straight through (the still is sampled without
// decoding too), so GL pixels match the <img> stills and the no-GL renders exactly.

import {
  WebGLRenderer,
  Scene,
  OrthographicCamera,
  PlaneGeometry,
  Mesh,
  ShaderMaterial,
  Texture,
  DataTexture,
  DataUtils,
  RedFormat,
  HalfFloatType,
  LinearFilter,
  NoColorSpace,
  Color,
} from 'three';

export interface SliceSources {
  /** the film frame (sec-c34-color), decoded */
  still: HTMLImageElement;
  /** the depth map (sec-c34-depth), decoded */
  depth: HTMLImageElement;
  /** depth at the camera end and at the robot end of the slider */
  nearD: number;
  farD: number;
}

export interface SliceRenderer {
  /** s: 0 = camera end, 1 = robot end */
  render(s: number): void;
  resize(width: number, height: number, dpr: number): void;
  dispose(): void;
  readonly canvas: HTMLCanvasElement;
}

/** The palette in linear-free sRGB triples (tokens.css). */
const C = {
  slabBlack: '#0b0b0a',
  chalk: '#ece8e1',
  pencil: '#9a958c',
  chalkBlue: '#6f98e8',
};

const vert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const frag = /* glsl */ `
precision highp float;
uniform sampler2D uStill;
uniform sampler2D uDepth;
uniform float uSlice;
uniform float uLevels;
uniform float uExposure;
uniform vec3 cBlack;
uniform vec3 cChalk;
uniform vec3 cPencil;
uniform vec3 cBlue;
varying vec2 vUv;

// iso-depth lines, about 1 px wide at any depth gradient (fwidth AA)
float contour(float d, float levels) {
  float f = d * levels;
  float w = max(fwidth(f), 1e-4);
  float g = abs(fract(f - 0.5) - 0.5) / w;
  return 1.0 - clamp(g - 0.5, 0.0, 1.0);
}

void main() {
  float d = texture2D(uDepth, vUv).r;
  vec3 film = texture2D(uStill, vUv).rgb;
  float fw = max(fwidth(d), 1e-4);
  // 1 where the frame is nearer the camera than the section plane: drawn
  float front = smoothstep(uSlice - fw * 0.5, uSlice + fw * 0.5, d);
  // the brief's depth ramp, exposed low so the drawing sits on the slab like chalk, not like paper
  vec3 drawn = mix(cBlack, cChalk, pow(d, 1.4)) * uExposure;
  // 14 index contours, and finer intermediate ones (a quarter interval) so 07's body reads as form
  drawn = mix(drawn, cPencil, contour(d, uLevels * 4.0) * 0.35);
  drawn = mix(drawn, cChalk, contour(d, uLevels) * 0.62);
  vec3 col = mix(film, drawn, front);
  // the 2 px chalk-blue intersection of plane and scene
  float band = 1.0 - smoothstep(fw * 0.6, fw * 1.8, abs(d - uSlice));
  col = mix(col, cBlue, band);
  gl_FragColor = vec4(col, 1.0);
}
`;

function tex(img: HTMLImageElement): Texture {
  const t = new Texture(img);
  t.colorSpace = NoColorSpace;
  t.minFilter = LinearFilter;
  t.magFilter = LinearFilter;
  t.generateMipmaps = false;
  t.flipY = true;
  t.needsUpdate = true;
  return t;
}

/**
 * The depth map is 8-bit, so a smooth floor arrives as plateaus one code wide; contours drawn on it come
 * out as stepped bands. Lift it to half float and run a small separable blur (two box passes ≈ Gaussian,
 * radius 2 px at 960 × 540) so the iso-depth lines are clean, then upload it as a single-channel texture
 * (half-float linear filtering is core in WebGL2).
 */
function depthTexture(img: HTMLImageElement): DataTexture {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(0, 0, w, h).data;
  let a = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) a[i] = px[i * 4]! / 255;
  let b = new Float32Array(w * h);
  const R = 2;
  const pass = (src: Float32Array, dst: Float32Array, horizontal: boolean) => {
    const n = horizontal ? w : h;
    const m = horizontal ? h : w;
    for (let j = 0; j < m; j++) {
      let acc = 0;
      const at = (i: number) => src[horizontal ? j * w + Math.min(n - 1, Math.max(0, i)) : Math.min(n - 1, Math.max(0, i)) * w + j]!;
      for (let i = -R; i <= R; i++) acc += at(i);
      for (let i = 0; i < n; i++) {
        dst[horizontal ? j * w + i : i * w + j] = acc / (2 * R + 1);
        acc += at(i + R + 1) - at(i - R);
      }
    }
  };
  for (let k = 0; k < 2; k++) {
    pass(a, b, true);
    pass(b, a, false);
  }
  b = new Float32Array(0);
  const half = new Uint16Array(w * h);
  // texture rows go bottom-up (flipY is ignored for data textures)
  for (let y = 0; y < h; y++) {
    const row = (h - 1 - y) * w;
    for (let x = 0; x < w; x++) half[y * w + x] = DataUtils.toHalfFloat(a[row + x]!);
  }
  a = new Float32Array(0);
  const t = new DataTexture(half, w, h, RedFormat, HalfFloatType);
  t.colorSpace = NoColorSpace;
  t.minFilter = LinearFilter;
  t.magFilter = LinearFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

const rgb = (hex: string) => new Color().setRGB(
  parseInt(hex.slice(1, 3), 16) / 255,
  parseInt(hex.slice(3, 5), 16) / 255,
  parseInt(hex.slice(5, 7), 16) / 255,
  NoColorSpace,
);

/** Map the slider to the plane depth (brief 4.2 and sec-c34-meta: uSlice = mix(nearD, farD, s)). */
export function sliceDepth(s: number, nearD: number, farD: number): number {
  const k = Math.min(1, Math.max(0, s));
  return nearD + (farD - nearD) * k;
}

export function createSliceRenderer(canvas: HTMLCanvasElement, src: SliceSources): SliceRenderer {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
    preserveDrawingBuffer: true, // screenshots / ?capture read the canvas
  });
  // no <colorspace_fragment> in the shader: its sRGB values reach the canvas unconverted
  renderer.setClearColor(rgb(C.slabBlack), 1);

  const stillTex = tex(src.still);
  const depthTex = depthTexture(src.depth);
  const material = new ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uStill: { value: stillTex },
      uDepth: { value: depthTex },
      uSlice: { value: sliceDepth(0.5, src.nearD, src.farD) },
      uLevels: { value: 14 },
      uExposure: { value: 0.3 },
      cBlack: { value: rgb(C.slabBlack) },
      cChalk: { value: rgb(C.chalk) },
      cPencil: { value: rgb(C.pencil) },
      cBlue: { value: rgb(C.chalkBlue) },
    },
  });
  const geometry = new PlaneGeometry(2, 2);
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  const scene = new Scene();
  scene.add(mesh);
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  return {
    canvas,
    render(s: number) {
      material.uniforms.uSlice!.value = sliceDepth(s, src.nearD, src.farD);
      renderer.render(scene, camera);
    },
    resize(width: number, height: number, dpr: number) {
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      stillTex.dispose();
      depthTex.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

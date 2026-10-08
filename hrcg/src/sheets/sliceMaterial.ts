// SECTION A–A slice shader (brief 4.2). Owner: A4.
// ONLY ever loaded with dynamic import() (from SectionSlice), so three stays out of the shell bundle and
// shares the hero's lazy three chunk. One fullscreen quad, one draw call, rendered on demand.
//
//   d = depth(uv)                       near = 1 (8-bit single channel, LinearFilter, NoColorSpace)
//   in front of the plane (d > uSlice):  mix(slabBlack, chalk, d^1.4) · 0.85 + pencil · contour(d, 14)
//                                        (+ faint intermediate contours at a quarter interval)
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
  vec3 drawn = mix(cBlack, cChalk, pow(d, 1.4)) * 0.85;
  // 14 index contours, and finer intermediate ones (a quarter interval) so 07's body reads as form
  drawn = mix(drawn, cPencil, contour(d, uLevels * 4.0) * 0.32);
  drawn = mix(drawn, cPencil, contour(d, uLevels) * 0.9);
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

const rgb = (hex: string) => new Color().setRGB(
  parseInt(hex.slice(1, 3), 16) / 255,
  parseInt(hex.slice(3, 5), 16) / 255,
  parseInt(hex.slice(5, 7), 16) / 255,
  NoColorSpace,
);

/**
 * Map the slider to the plane depth (brief 4.2: uSlice = mix(nearD, farD, s)). The mix runs through an
 * ease-out (1 − (1 − s)^1.6): relative depth changes fast across the near floor and slowly over 07, so
 * without it most of the cut's travel would be spent on floor and 07 would flash past at the end.
 */
export function sliceDepth(s: number, nearD: number, farD: number): number {
  const k = 1 - Math.pow(1 - Math.min(1, Math.max(0, s)), 1.6);
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
  const depthTex = tex(src.depth);
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

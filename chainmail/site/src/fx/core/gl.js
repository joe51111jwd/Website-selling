/* Minimal WebGL2 helpers: one full-screen triangle, one program per effect. */

export const FULLSCREEN_VERT = /* glsl */ `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

export function getGL(canvas, opts = {}) {
  try {
    return canvas.getContext('webgl2', {
      alpha: !!opts.alpha,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: opts.powerPreference || 'high-performance',
      desynchronized: false,
    });
  } catch (e) {
    return null;
  }
}

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error('[fx] shader compile failed: ' + log);
  }
  return sh;
}

/* Builds program + fullscreen triangle VAO. Returns { prog, vao, u(name) }. */
export function createQuadProgram(gl, frag, vert = FULLSCREEN_VERT) {
  const vs = compile(gl, gl.VERTEX_SHADER, vert);
  const fs = compile(gl, gl.FRAGMENT_SHADER, frag);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, 'aPos');
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS) && !gl.isContextLost()) {
    throw new Error('[fx] program link failed: ' + gl.getProgramInfoLog(prog));
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  const cache = new Map();
  const u = (name) => {
    if (!cache.has(name)) cache.set(name, gl.getUniformLocation(prog, name));
    return cache.get(name);
  };
  return {
    prog,
    vao,
    u,
    draw() {
      gl.useProgram(prog);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
      gl.deleteVertexArray(vao);
    },
  };
}

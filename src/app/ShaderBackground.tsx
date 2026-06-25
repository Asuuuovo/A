"use client";

import { useEffect, useRef, useState } from "react";

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Rain shader - 透过玻璃看背景，雨滴产生折射
const rainShaderSource = `
precision highp float;
varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_rainIntensity;
uniform sampler2D u_texture;

#define S(a, b, t) smoothstep(a, b, t)

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec3 N13(float p) {
  vec3 p3 = fract(vec3(p) * vec3(.1031, .11369, .13787));
  p3 += dot(p3, p3.yzx + 19.19);
  return fract(vec3((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y, (p3.y + p3.z) * p3.x));
}

float N(float t) {
  return fract(sin(t * 12345.564) * 7658.76);
}

float Saw(float b, float t) {
  return S(0., b, t) * S(1., b, t);
}

vec2 DropLayer2(vec2 uv, float t) {
  vec2 UV = uv;
  uv.y += t * 0.75;
  vec2 a = vec2(6., 1.);
  vec2 grid = a * 2.;
  vec2 id = floor(uv * grid);
  float colShift = N(id.x);
  uv.y += colShift;
  id = floor(uv * grid);
  vec3 n = N13(id.x * 35.2 + id.y * 2376.1);
  vec2 st = fract(uv * grid) - vec2(.5, 0);
  float x = n.x - .5;
  float y = UV.y * 20.0;
  float wiggle = sin(y + sin(y));
  x += wiggle * (.5 - abs(x)) * (n.z - .5);
  x *= .7;
  float ti = fract(t + n.z);
  y = (Saw(.85, ti) - .5) * .9 + .5;
  vec2 p = vec2(x, y);
  float d = length((st - p) * a.yx);
  float mainDrop = S(.4, .0, d);
  float r = sqrt(S(1., y, st.y));
  float cd = abs(st.x - x);
  float trail = S(.23 * r, .15 * r * r, cd);
  float trailFront = S(-.02, .02, st.y - y);
  trail *= trailFront * r * r;
  y = UV.y;
  float trail2 = S(.2 * r, .0, cd);
  float droplets = max(0., (sin(y * (1. - y) * 120.) - st.y)) * trail2 * trailFront * n.z;
  y = fract(y * 10.) + (st.y - .5);
  float dd = length(st - vec2(x, y));
  droplets = S(.3, 0., dd);
  float m = mainDrop + droplets * r * trailFront;
  return vec2(m, trail);
}

float StaticDrops(vec2 uv, float t) {
  uv *= 40.;
  vec2 id = floor(uv);
  uv = fract(uv) - .5;
  vec3 n = N13(id.x * 107.45 + id.y * 3543.654);
  vec2 p = (n.xy - .5) * .7;
  float d = length(uv - p);
  float fade = Saw(.025, fract(t + n.z));
  float c = S(.3, 0., d) * fract(n.z * 10.) * fade;
  return c;
}

vec2 Drops(vec2 uv, float t, float l0, float l1, float l2) {
  float s = StaticDrops(uv, t) * l0;
  vec2 m1 = DropLayer2(uv, t) * l1;
  vec2 m2 = DropLayer2(uv * 1.85, t) * l2;
  float c = s + m1.x + m2.x;
  c = S(.3, 1., c);
  return vec2(c, max(m1.y * l0, m2.y * l1));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - .5 * u_resolution.xy) / u_resolution.y;
  vec2 UV = v_uv;
  float T = u_time * .2;
  float t = T * .2;

  float rainAmount = u_rainIntensity;

  float maxBlur = 3.0 + rainAmount * 3.0;
  float minBlur = 2.0;

  float staticDrops = S(-.5, 1., rainAmount) * 2.0;
  float layer1 = S(.25, .75, rainAmount);
  float layer2 = S(.0, .5, rainAmount);

  vec2 c = Drops(uv, t, staticDrops, layer1, layer2);

  // 计算法线（用于折射）
  vec2 e = vec2(.001, 0.);
  float cx = Drops(uv + e, t, staticDrops, layer1, layer2).x;
  float cy = Drops(uv + e.yx, t, staticDrops, layer1, layer2).x;
  vec2 n = vec2(cx - c.x, cy - c.x);

  // 焦距混合（模糊程度）
  float focus = mix(maxBlur - c.y, minBlur, S(.1, .2, c.x));

  // 背景折射扭曲 - 雨滴像玻璃透镜（旋转180度）
  vec2 distortedUV = vec2(1.0 - UV.x, 1.0 - UV.y) + n * 0.1;
  vec3 col = texture2D(u_texture, distortedUV).rgb;

  // 暗角
  col *= 1.0 - dot(UV - 0.5, UV - 0.5) * 0.5;

  gl_FragColor = vec4(col, 1.0);
}
`;

// Snow shader
const snowShaderSource = `
precision highp float;
varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_snowIntensity;
uniform sampler2D u_texture;

#define S(a, b, t) smoothstep(a, b, t)

#define LIGHT_SNOW
#ifdef LIGHT_SNOW
  #define LAYERS 50
  #define DEPTH 0.5
  #define WIDTH 0.3
  #define SPEED 0.6
#else
  #define LAYERS 200
  #define DEPTH 0.1
  #define WIDTH 0.8
  #define SPEED 1.5
#endif

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 UV = v_uv;
  float aspect = u_resolution.x / u_resolution.y;

  // 背景纹理（旋转180度）
  vec3 bg = texture2D(u_texture, vec2(1.0 - UV.x, 1.0 - UV.y)).rgb;

  const mat3 p = mat3(13.323122,23.5112,21.71123,21.1212,28.7312,11.9312,21.8112,14.7212,61.3934);
  vec2 snowUv = uv;
  snowUv.x *= aspect;

  vec3 acc = vec3(0.0);
  float dof = 5.0 * sin(u_time * 0.1);
  for (int i = 0; i < LAYERS; i++) {
    float fi = float(i);
    vec2 q = snowUv * (1.0 + fi * DEPTH * 0.01);
    q += vec2(q.y * (WIDTH * mod(fi * 7.238917, 1.0) - WIDTH * 0.5), SPEED * u_time / (1.0 + fi * DEPTH * 0.02));
    vec3 n = vec3(floor(q), 31.189 + fi);
    vec3 m = floor(n) * 0.00001 + fract(n);
    vec3 mp = (31415.9 + m) / fract(p * m);
    vec3 r = fract(mp);
    vec2 s = abs(mod(q, 1.0) - 0.5 + 0.9 * r.xy - 0.45);
    s += 0.01 * abs(2.0 * fract(10.0 * q.yx) - 1.0);
    float d = 0.6 * max(s.x - s.y, s.x + s.y) + max(s.x, s.y) - 0.01;
    float edge = 0.005 + 0.04 * min(0.5 * abs(fi - 5.0 - dof), 1.0);
    acc += vec3(smoothstep(edge, -edge, d) * (r.x / (1.0 + 0.02 * fi * DEPTH)));
  }

  float snowIntensity = acc.r * u_snowIntensity;
  vec3 snowColor = mix(vec3(0.95, 0.97, 1.0), vec3(1.0), 0.5);
  vec3 col = mix(bg, snowColor, snowIntensity);

  float vignette = 1.0 - length(uv - 0.5) * 0.5;
  col *= vignette;

  gl_FragColor = vec4(col, 0.95);
}
`;

// Wave shader - gentle wave distortion on background
const waveShaderSource = `
precision highp float;
varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D u_texture;

void main() {
  vec2 uv = v_uv;
  float T = u_time * 0.3;

  // Subtle horizontal wave distortion
  float wave = sin(uv.y * 6.0 + T * 1.5) * 0.008;
  wave += sin(uv.y * 10.0 - T * 1.0) * 0.005;
  wave += sin(uv.y * 15.0 + T * 2.0) * 0.003;

  // Apply wave distortion to uv
  vec2 distortedUV = vec2(uv.x + wave, uv.y);

  // Sample texture with distorted coordinates
  vec3 col = texture2D(u_texture, distortedUV).rgb;

  // Vignette
  float vignette = 1.0 - length(uv - 0.5) * 0.5;
  col *= vignette;

  gl_FragColor = vec4(col, 1.0);
}
`;

interface ShaderBackgroundProps {
  mode: number;
  rainIntensity?: number;
  snowIntensity?: number;
  blurIntensity?: number;
}

export default function ShaderBackground({ mode, rainIntensity = 0.7, snowIntensity = 0.7, blurIntensity = 0.5 }: ShaderBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const rainIntensityRef = useRef(rainIntensity);
  const snowIntensityRef = useRef(snowIntensity);
  const blurIntensityRef = useRef(blurIntensity);
  const modeRef = useRef(mode);
  const programCacheRef = useRef<{ [key: number]: WebGLProgram | null }>({});
  const textureCacheRef = useRef<{ [key: number]: WebGLTexture | null }>({});
  const [blurLevel, setBlurLevel] = useState(blurIntensity);

  const fragmentShaders = [rainShaderSource, snowShaderSource, waveShaderSource];

  useEffect(() => {
    rainIntensityRef.current = rainIntensity;
  }, [rainIntensity]);

  useEffect(() => {
    snowIntensityRef.current = snowIntensity;
  }, [snowIntensity]);

  useEffect(() => {
    blurIntensityRef.current = blurIntensity;
    setBlurLevel(blurIntensity);
  }, [blurIntensity]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { antialias: true, alpha: false });
    if (!gl) return;
    glRef.current = gl;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const compileShader = (shaderType: number, source: string) => {
      const shader = gl.createShader(shaderType)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    };

    const createProgram = (fragmentSource: string) => {
      const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
      const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
      if (!vertexShader || !fragmentShader) return null;

      const program = gl.createProgram()!;
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(program));
        return null;
      }
      return program;
    };

    for (let i = 0; i < fragmentShaders.length; i++) {
      programCacheRef.current[i] = createProgram(fragmentShaders[i]);
    }

    let currentProgram = programCacheRef.current[modeRef.current];
    if (!currentProgram) return;
    programRef.current = currentProgram;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1,  -1, 1,
      -1,  1,  1, -1,   1, 1,
    ]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(currentProgram, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const startTime = performance.now();

    const animate = () => {
      const gl = glRef.current;
      const program = programRef.current;
      if (!gl || !program) return;

      const time = (performance.now() - startTime) / 1000;
      const currentMode = modeRef.current;

      const timeLocation = gl.getUniformLocation(program, "u_time");
      const resolutionLocation = gl.getUniformLocation(program, "u_resolution");

      gl.uniform1f(timeLocation, time);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

      if (currentMode === 0 || currentMode === 1 || currentMode === 2) {
        // 绑定纹理
        const texture = textureCacheRef.current[currentMode];
        if (texture) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          const texLocation = gl.getUniformLocation(program, "u_texture");
          if (texLocation) gl.uniform1i(texLocation, 0);
        }

        if (currentMode === 0) {
          const rainLocation = gl.getUniformLocation(program, "u_rainIntensity");
          if (rainLocation) gl.uniform1f(rainLocation, rainIntensityRef.current);
        } else if (currentMode === 1) {
          const snowLocation = gl.getUniformLocation(program, "u_snowIntensity");
          if (snowLocation) gl.uniform1f(snowLocation, snowIntensityRef.current);
        }
      }

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // 加载纹理
  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;

    const loadTexture = (url: string, index: number) => {
      const texture = gl!.createTexture();
      if (!texture) return;

      // 创建占位纹理（防止加载前黑屏）
      gl!.bindTexture(gl!.TEXTURE_2D, texture);
      const placeholder = new Uint8Array([128, 128, 128, 255]);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, 1, 1, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, placeholder);

      const img = new Image();
      img.onload = () => {
        gl!.bindTexture(gl!.TEXTURE_2D, texture);
        gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, img);
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
        textureCacheRef.current[index] = texture;
      };
      img.onerror = () => {
        console.error("Failed to load texture:", url);
      };
      img.src = url;
    };

    loadTexture("/rain1.jpg", 0);
    loadTexture("/snow1.jpg", 1);
    loadTexture("/sea.jpg", 2);
  }, []);

  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;

    const program = programCacheRef.current[mode];
    if (!program) return;

    programRef.current = program;
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  }, [mode]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-screen h-screen"
      style={{
        zIndex: 0,
        filter: `blur(${blurLevel * 8}px)`,
      }}
    />
  );
}

export { rainShaderSource, snowShaderSource, waveShaderSource };

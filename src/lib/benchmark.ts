/**
 * One-tap graphics benchmark for the 3D climber avatars.
 *
 * Renders a short, deliberately GPU-heavy WebGL loop in an offscreen canvas —
 * roughly the work a page full of spinning avatars does — measures the frame
 * rate, and maps it onto a quality tier. Runs for well under two seconds and
 * cleans the canvas up afterwards.
 */
import type { QualityPref } from "@/lib/quality";

export type BenchTier = Exclude<QualityPref, "auto">;

export interface BenchmarkResult {
  /** Measured frames per second during the timed window. */
  fps: number;
  /** Quality tier that suits the measured frame rate. */
  tier: BenchTier;
  /** True when WebGL was unavailable and the tier is a device guess. */
  fallback: boolean;
}

const VERT = `
attribute vec2 p;
uniform float t;
void main() {
  float a = t + p.x;
  gl_Position = vec4(p.x * cos(a) * 0.9, p.y * sin(a) * 0.9, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
uniform float t;
void main() {
  // Deliberate per-pixel load so the test reflects real shading cost.
  float v = 0.0;
  for (int i = 0; i < 48; i++) {
    v += sin(gl_FragCoord.x * 0.03 + t + float(i)) * cos(gl_FragCoord.y * 0.03 - t);
  }
  gl_FragColor = vec4(abs(v) * 0.02, 0.2, 0.4, 1.0);
}`;

const compile = (gl: WebGLRenderingContext, type: number, src: string) => {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  return shader;
};

/** Warm-up before timing starts (ms). */
const WARMUP_MS = 250;
/** Timed window (ms). */
const SAMPLE_MS = 1200;
/** Draw calls per frame — mimics several avatars on screen at once. */
const DRAWS = 90;

export const tierForFps = (fps: number): BenchTier => {
  if (fps >= 55) return "high";
  if (fps >= 32) return "balanced";
  return "low";
};

/**
 * Runs the benchmark. `onProgress` gets 0..1 so the button can show a bar.
 * Never throws — a missing WebGL context resolves as a conservative fallback.
 */
export const runQualityBenchmark = (
  onProgress?: (progress: number) => void,
): Promise<BenchmarkResult> =>
  new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve({ fps: 0, tier: "balanced", fallback: true });
      return;
    }

    const canvas = document.createElement("canvas");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(320 * dpr);
    canvas.height = Math.round(320 * dpr);
    canvas.style.cssText = "position:fixed;left:-9999px;top:0;width:320px;height:320px;";
    document.body.appendChild(canvas);

    const gl = (canvas.getContext("webgl", { antialias: false, powerPreference: "high-performance" }) ??
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;

    const finish = (result: BenchmarkResult) => {
      canvas.remove();
      onProgress?.(1);
      resolve(result);
    };

    if (!gl) {
      finish({ fps: 0, tier: "low", fallback: true });
      return;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tLoc = gl.getUniformLocation(program, "t");

    const start = performance.now();
    let frames = 0;
    let timedStart = 0;
    let raf = 0;

    const step = () => {
      const now = performance.now();
      const elapsed = now - start;

      for (let i = 0; i < DRAWS; i++) {
        gl.uniform1f(tLoc, elapsed * 0.001 + i * 0.05);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      // Force the GPU to finish so the timing reflects real work.
      gl.flush();

      if (elapsed >= WARMUP_MS) {
        if (!timedStart) timedStart = now;
        else frames += 1;
      }

      onProgress?.(Math.min(elapsed / (WARMUP_MS + SAMPLE_MS), 0.98));

      if (timedStart && now - timedStart >= SAMPLE_MS) {
        cancelAnimationFrame(raf);
        const fps = Math.round((frames * 1000) / (now - timedStart));
        finish({ fps, tier: tierForFps(fps), fallback: false });
        return;
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
  });

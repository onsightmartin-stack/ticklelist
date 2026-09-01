import { useEffect, useRef } from "react";

/**
 * Global confetti + fireworks celebration overlay.
 *
 * Mount <Celebration /> once (in __root). Any code can call the
 * exported `celebrate()` function to fire a burst — e.g. on a
 * successful ascent / adventure / post / visit submission.
 */

type Listener = () => void;
const listeners = new Set<Listener>();

/** Fire a confetti + fireworks burst across the screen. */
export function celebrate() {
  if (typeof window === "undefined") return;
  listeners.forEach((l) => l());
}

// ---- particle engine -------------------------------------------------------

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
  shape: "rect" | "circle";
  gravity: number;
  drag: number;
}

const COLORS = [
  "#f59e0b", // summit gold / orange
  "#22d3ee", // cyan accent
  "#f8fafc", // ice white
  "#f97316", // ember orange
  "#a855f7", // legal violet
  "#84cc16", // forest lime
  "#fb7185", // rose
  "#fde047", // gold
];

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pickColor = () => COLORS[Math.floor(Math.random() * COLORS.length)] ?? COLORS[0]!;

function spawnConfetti(particles: Particle[], w: number, h: number, count: number) {
  for (let i = 0; i < count; i++) {
    const fromLeft = Math.random() < 0.5;
    const x = fromLeft ? rand(0, w * 0.2) : rand(w * 0.8, w);
    particles.push({
      x,
      y: rand(-40, h * 0.25),
      vx: fromLeft ? rand(2, 7) : rand(-7, -2),
      vy: rand(2, 6),
      life: 0,
      maxLife: rand(90, 150),
      size: rand(6, 12),
      color: pickColor(),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.3, 0.3),
      shape: Math.random() < 0.7 ? "rect" : "circle",
      gravity: 0.12,
      drag: 0.992,
    });
  }
}

function spawnFirework(
  particles: Particle[],
  x: number,
  y: number,
  count: number,
) {
  const color = pickColor();
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + rand(-0.1, 0.1);
    const speed = rand(2, 6.5);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: rand(45, 80),
      size: rand(2, 4),
      color,
      rot: 0,
      vr: 0,
      shape: "circle",
      gravity: 0.05,
      drag: 0.96,
    });
  }
  // bright core flash
  particles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 12,
    size: 26,
    color,
    rot: 0,
    vr: 0,
    shape: "circle",
    gravity: 0,
    drag: 1,
  });
}

export default function Celebration() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let particles: Particle[] = [];
    let raf = 0;
    let running = false;
    let lastFrame = 0;

    const step = (ts: number) => {
      if (!running) return;
      const dt = lastFrame ? Math.min(32, ts - lastFrame) : 16;
      lastFrame = ts;
      ctx.clearRect(0, 0, w, h);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]!;
        p.life += dt * 0.06;
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        const t = p.life / p.maxLife;
        if (t >= 1) {
          particles.splice(i, 1);
          continue;
        }
        const alpha = t < 0.1 ? t / 0.1 : 1 - t;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = p.color;
        if (p.shape === "rect") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      if (particles.length === 0) {
        running = false;
        canvas.style.display = "none";
        return;
      }
      raf = requestAnimationFrame(step);
    };

    const fire = () => {
      // confetti rain
      spawnConfetti(particles, w, h, 70);
      // 3 firework bursts at varied positions
      const fw = [
        [w * 0.3, h * 0.35],
        [w * 0.7, h * 0.3],
        [w * 0.5, h * 0.22],
      ] as const;
      fw.forEach(([fx, fy], idx) => {
        window.setTimeout(() => {
          spawnFirework(particles, fx, fy, 28);
          if (!running) {
            running = true;
            canvas.style.display = "block";
            lastFrame = 0;
            raf = requestAnimationFrame(step);
          }
        }, idx * 220);
      });
      if (!running) {
        running = true;
        canvas.style.display = "block";
        lastFrame = 0;
        raf = requestAnimationFrame(step);
      }
    };

    listeners.add(fire);
    return () => {
      listeners.delete(fire);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
        display: "none",
      }}
    />
  );
}

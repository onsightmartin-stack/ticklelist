import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, RotateCw } from "lucide-react";
import { buildAvatarFigureSvg, decodeAvatarConfig, type AvatarConfig } from "@/lib/avatar-builder";
import { motionAllowed } from "@/lib/motion";
import {
  getStoredQuality,
  QUALITY_EVENT,
  qualitySettings,
  reportAvatarFps,
  AUTO_TIER_EVENT,
  getAutoTier,
  type QualityPref,
} from "@/lib/quality";
import { cn } from "@/lib/utils";

interface Avatar3DProps {
  /** Encoded avatar path (`gen:...`) or a decoded config. */
  path?: string | null;
  config?: AvatarConfig | null;
  name: string;
  className?: string;
  /** Idle auto-rotation speed in degrees per second (0 disables). */
  spinSpeed?: number;
  /** Show the rotate buttons and drag hint. */
  controls?: boolean;
  /** Render the member's backdrop as a 3D stage instead of a transparent one. */
  stage?: boolean;
  animated?: boolean;
}

const IDLE_DELAY = 2000;
/**
 * Browsers cap live WebGL contexts (~16) and silently kill the oldest ones.
 * Long lists of climbers therefore share a budget (set by the quality
 * preference): past it, call sites keep the flat figure, which looks identical
 * at thumbnail size.
 */
let liveContexts = 0;


/**
 * Real-time low-poly 3D climber avatar (Nintendo 64 flavoured).
 *
 * three.js is loaded lazily in the browser only; until then the flat SVG
 * figure is shown so SSR, slow connections and WebGL-less devices still get a
 * picture. Drag or swipe to orbit, arrow keys nudge, and the model idles with
 * a breathing bob until you touch it.
 */
const Avatar3D = ({
  path,
  config: configProp,
  name,
  className,
  spinSpeed = 18,
  controls = true,
  stage = false,
  animated,
}: Avatar3DProps) => {
  const config = useMemo(() => configProp ?? decodeAvatarConfig(path ?? null), [configProp, path]);
  const play = animated ?? config?.animated !== false;

  const fallback = useMemo(
    () => (config ? buildAvatarFigureSvg(config, play, "front") : null),
    [config, play],
  );

  // Graphics quality — resolution, backdrop and live-model budget.
  const [quality, setQualityPref] = useState<QualityPref>("auto");
  // Tier chosen by the auto mode; changes when measured FPS moves it up or down.
  const [autoTier, setAutoTier] = useState<string>("balanced");
  useEffect(() => {
    setQualityPref(getStoredQuality());
    setAutoTier(getAutoTier());
    const onChange = () => {
      setQualityPref(getStoredQuality());
      setAutoTier(getAutoTier());
    };
    window.addEventListener(QUALITY_EVENT, onChange);
    window.addEventListener(AUTO_TIER_EVENT, onChange);
    return () => {
      window.removeEventListener(QUALITY_EVENT, onChange);
      window.removeEventListener(AUTO_TIER_EVENT, onChange);
    };
  }, []);

  const hostRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // Imperative controls shared with the render loop.
  const angle = useRef(-0.35);
  const velocity = useRef(0);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const lastMove = useRef(0);
  const idleAt = useRef(0);
  const moved = useRef(false);
  const autoSpin = useRef(true);

  useEffect(() => {
    if (!config) return;
    const host = hostRef.current;
    if (!host) return;

    const gfx = qualitySettings(quality);
    const showStage = stage && gfx.backdrop;

    if (liveContexts >= gfx.maxContexts) {
      setFailed(true);
      return;
    }
    liveContexts += 1;
    setFailed(false);
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      liveContexts -= 1;
    };

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const [THREE, rigMod] = await Promise.all([
          import("three"),
          import("@/lib/avatar-3d"),
        ]);
        if (disposed) return;

        const renderer = new THREE.WebGLRenderer({
          antialias: gfx.antialias,
          alpha: !showStage,
          powerPreference: "high-performance",
        });

        renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, gfx.maxDpr) * gfx.pixelScale);
        renderer.setSize(host.clientWidth || 200, host.clientHeight || 280, false);
        const canvas = renderer.domElement;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.display = "block";
        canvas.style.imageRendering = gfx.antialias ? "auto" : "pixelated";
        canvas.style.touchAction = "none";
        host.appendChild(canvas);

        const scene = new THREE.Scene();
        const colors = rigMod.backdropColors(config.bg);
        if (showStage) {
          scene.background = new THREE.Color(colors.top);
          scene.fog = new THREE.Fog(colors.bottom, 9, 20);
          const ground = new THREE.Mesh(
            new THREE.CircleGeometry(7, 12),
            new THREE.MeshLambertMaterial({ color: colors.ground, flatShading: true }),
          );
          ground.rotation.x = -Math.PI / 2;
          scene.add(ground);
          // Chunky ridge line in the distance — always behind the climber,
          // never between the camera and the figure.
          const ridgeR = 8.5;
          for (let i = 0; i < gfx.ridgePeaks; i++) {
            const a = Math.PI + (i / Math.max(gfx.ridgePeaks - 1, 1)) * Math.PI; // 180°..360° → back hemisphere
            const peak = new THREE.Mesh(
              new THREE.ConeGeometry(2.4, 3.4 + (i % 2), 4),
              new THREE.MeshLambertMaterial({ color: colors.bottom, flatShading: true }),
            );
            peak.position.set(Math.sin(a) * ridgeR, 1.2, Math.cos(a) * ridgeR);
            peak.rotation.y = a;
            scene.add(peak);
          }
        }

        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
        camera.position.set(0, 2.3, 13);
        camera.lookAt(0, 1.85, 0);

        scene.add(new THREE.AmbientLight(0xffffff, 1.15));
        const key = new THREE.DirectionalLight(0xfff3e0, 1.5);
        key.position.set(3, 6, 5);
        scene.add(key);
        const rim = new THREE.DirectionalLight(0x7dd3fc, 0.8);
        rim.position.set(-4, 2, -4);
        scene.add(rim);

        const rig = rigMod.buildAvatarRig(config);
        const pivot = new THREE.Group();
        pivot.add(rig.root);
        scene.add(pivot);

        // Blob shadow, N64 style: a dark disc, not a real shadow map.
        const shadow = new THREE.Mesh(
          new THREE.CircleGeometry(1.15, 12),
          new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 }),
        );
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.02;
        scene.add(shadow);

        const resize = () => {
          const w = host.clientWidth || 200;
          const h = host.clientHeight || 280;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(host);

        // Only burn frames while the avatar is on screen.
        let visible = true;
        const io = new IntersectionObserver(([entry]) => {
          visible = entry?.isIntersecting ?? true;
        });
        io.observe(host);

        const allowMotion = motionAllowed() && play;
        let raf = 0;
        let prev = performance.now();
        let t = 0;
        // Rolling frame-rate sample fed back into the "auto" quality tier.
        let frames = 0;
        let sampleStart = performance.now();

        const tick = (now: number) => {
          raf = requestAnimationFrame(tick);
          const dt = Math.min((now - prev) / 1000, 0.05);
          prev = now;
          if (!visible) {
            frames = 0;
            sampleStart = now;
            return;
          }
          t += dt;

          frames += 1;
          if (now - sampleStart >= 2000) {
            reportAvatarFps((frames * 1000) / (now - sampleStart));
            frames = 0;
            sampleStart = now;
          }

          if (!dragging.current) {
            if (Math.abs(velocity.current) > 0.01) {
              angle.current += velocity.current * dt;
              velocity.current *= Math.pow(0.12, dt);
            } else {
              velocity.current = 0;
              if (autoSpin.current && allowMotion && now - idleAt.current > IDLE_DELAY) {
                angle.current += (spinSpeed * Math.PI) / 180 * dt;
              }
            }
          }
          pivot.rotation.y = angle.current;

          if (allowMotion) {
            const bob = Math.sin(t * 1.9);
            rig.root.position.y = 1.5 + bob * 0.045;
            rig.head.rotation.z = Math.sin(t * 1.2) * 0.04;
            rig.head.rotation.y = Math.sin(t * 0.7) * 0.12;
            rig.armL.rotation.x = Math.sin(t * 1.9) * 0.12;
            rig.armR.rotation.x = -Math.sin(t * 1.9) * 0.12;
            rig.armL.rotation.z = 0.06;
            rig.armR.rotation.z = -0.06;
            rig.torso.rotation.y = Math.sin(t * 0.95) * 0.05;
            const s = 1 - bob * 0.02;
            shadow.scale.setScalar(s);
          }

          renderer.render(scene, camera);
        };
        raf = requestAnimationFrame(tick);
        setReady(true);

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          io.disconnect();
          rig.dispose();
          scene.traverse((o) => {
            const m = o as import("three").Mesh;
            if (m.geometry) m.geometry.dispose();
            if (m.material) {
              const list = Array.isArray(m.material) ? m.material : [m.material];
              list.forEach((mm) => mm.dispose());
            }
          });
          renderer.forceContextLoss();
          renderer.dispose();
          canvas.remove();
          release();
        };
        if (disposed) cleanup();
      } catch {
        release();
        if (!disposed) setFailed(true);
      }
    })();

    return () => {
      disposed = true;
      cleanup?.();
      release();
      setReady(false);
    };

  }, [config, play, spinSpeed, stage, quality, autoTier]);

  const nudge = (deg: number) => {
    velocity.current = (deg * Math.PI) / 180 * 4;
    idleAt.current = performance.now();
  };

  if (!config || !fallback) return null;

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    lastX.current = e.clientX;
    lastMove.current = performance.now();
    velocity.current = 0;
    moved.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const now = performance.now();
    const dx = e.clientX - lastX.current;
    const dt = Math.max((now - lastMove.current) / 1000, 0.001);
    if (Math.abs(dx) > 2) moved.current = true;
    const delta = (dx * 0.011);
    angle.current += delta;
    velocity.current = delta / dt;
    lastX.current = e.clientX;
    lastMove.current = now;
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    idleAt.current = performance.now();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  return (
    <div className={cn("relative select-none", className)}>
      <div
        role="img"
        aria-label={`${name} climber model — drag to rotate`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => {
          if (moved.current) {
            e.preventDefault();
            e.stopPropagation();
            moved.current = false;
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            nudge(-160);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            nudge(160);
          } else if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            autoSpin.current = !autoSpin.current;
          }
        }}
        className="relative h-full w-full cursor-grab touch-none overflow-hidden outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <div ref={hostRef} className="absolute inset-0" />
        {(!ready || failed) && (
          <div
            className="pointer-events-none absolute inset-0 [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: fallback }}
          />
        )}
      </div>

      {controls && (
        <div className="mt-1 flex items-center justify-center gap-2 text-muted-foreground">
          <button
            type="button"
            onClick={() => nudge(-160)}
            aria-label={`Rotate ${name} left`}
            className="rounded-full border border-border bg-card p-1.5 transition-colors hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <span className="text-[10px] uppercase tracking-wider">Drag to spin</span>
          <button
            type="button"
            onClick={() => nudge(160)}
            aria-label={`Rotate ${name} right`}
            className="rounded-full border border-border bg-card p-1.5 transition-colors hover:text-foreground"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Avatar3D;

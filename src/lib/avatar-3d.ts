/**
 * Low-poly, Nintendo 64 flavoured 3D climber avatars.
 *
 * Builds a real three.js character rig from the same `AvatarConfig` the SVG
 * avatars use, so nothing about storage, unlocks or pickers changes — only the
 * rendering. Everything is boxes and prisms with flat shading and nearest
 * filtered pixel textures, deliberately chunky like a cartridge-era model.
 *
 * This module imports three.js and must only be loaded from the browser
 * (dynamic `import()` inside an effect), never at SSR module scope.
 */

import * as THREE from "three";
import { avatarParts, type AvatarConfig, type AvatarParts } from "@/lib/avatar-builder";

const colorOf = (key: keyof AvatarParts, id: string, fallback: string) =>
  avatarParts.find((p) => p.key === key)?.options.find((o) => o.id === id)?.color ?? fallback;

/** Flat-shaded, unlit-ish material — the N64 look came from vertex lighting. */
const mat = (color: THREE.ColorRepresentation, opts: { shiny?: boolean } = {}) =>
  new THREE.MeshLambertMaterial({
    color,
    flatShading: true,
    emissive: new THREE.Color(color).multiplyScalar(opts.shiny ? 0.25 : 0.12),
  });

const box = (
  w: number,
  h: number,
  d: number,
  material: THREE.Material | THREE.Material[],
  pos: [number, number, number] = [0, 0, 0],
) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(...pos);
  m.castShadow = true;
  return m;
};

const shade = (hex: string, amount: number) => {
  const c = new THREE.Color(hex);
  c.multiplyScalar(amount);
  return `#${c.getHexString()}`;
};

/* ------------------------------------------------------------- face texture */

const FACE_PX = 64;

/** Pixel-art face painted onto the front of the head cube. */
const faceTexture = (config: AvatarConfig): THREE.Texture => {
  const canvas = document.createElement("canvas");
  canvas.width = FACE_PX;
  canvas.height = FACE_PX;
  const ctx = canvas.getContext("2d")!;
  const skin = colorOf("skin", config.skin, "#e0ac86");
  const hair = colorOf("hairColor", config.hairColor, "#5a3a22");

  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = skin;
  ctx.fillRect(0, 0, FACE_PX, FACE_PX);

  // Cheek blush + jaw shading, chunky pixel blocks.
  ctx.fillStyle = shade(skin, 0.86);
  ctx.fillRect(0, 46, FACE_PX, 18);
  ctx.fillStyle = shade(skin, 1.12);
  ctx.fillRect(4, 6, FACE_PX - 8, 8);

  const eye = (x: number) => {
    switch (config.eyes) {
      case "happy":
        ctx.fillStyle = "#101820";
        ctx.fillRect(x - 6, 28, 4, 4);
        ctx.fillRect(x - 2, 24, 6, 4);
        ctx.fillRect(x + 4, 28, 4, 4);
        break;
      case "focused":
        ctx.fillStyle = "#101820";
        ctx.fillRect(x - 8, 22, 16, 4);
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(x - 7, 27, 14, 7);
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(x - 2, 27, 5, 7);
        break;
      default:
        ctx.fillStyle = "#101820";
        ctx.fillRect(x - 8, 21, 16, 3);
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(x - 7, 25, 14, 10);
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(x - 3, 25, 6, 10);
        ctx.fillStyle = "#101820";
        ctx.fillRect(x - 1, 27, 3, 6);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x + 2, 26, 2, 2);
    }
  };

  if (config.eyes === "shades" || config.eyes === "glacier") {
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(6, 22, 52, 14);
    ctx.fillStyle = config.eyes === "glacier" ? "#4b5563" : "#1f2937";
    ctx.fillRect(28, 25, 8, 6);
    ctx.fillStyle = "#ffffff22";
    ctx.fillRect(10, 25, 14, 4);
  } else if (config.eyes === "goggles") {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(2, 18, 60, 20);
    ctx.fillStyle = "#22d3ee";
    ctx.fillRect(6, 22, 52, 12);
    ctx.fillStyle = "#ffffff66";
    ctx.fillRect(10, 24, 18, 4);
  } else {
    eye(20);
    eye(44);
  }

  // Nose
  ctx.fillStyle = shade(skin, 0.8);
  ctx.fillRect(30, 38, 4, 6);

  // Mouth
  ctx.fillStyle = "#7f1d1d";
  switch (config.mouth) {
    case "neutral":
      ctx.fillRect(26, 50, 12, 3);
      break;
    case "grin":
      ctx.fillRect(23, 48, 18, 6);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(24, 49, 16, 2);
      break;
    case "shout":
      ctx.fillRect(25, 46, 14, 12);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(26, 47, 12, 3);
      break;
    default:
      ctx.fillRect(25, 50, 14, 3);
      ctx.fillRect(23, 47, 3, 3);
      ctx.fillRect(38, 47, 3, 3);
  }

  // Beard drawn straight over the lower face pixels.
  if (config.beard !== "none") {
    ctx.fillStyle = hair;
    if (config.beard === "stubble") {
      ctx.globalAlpha = 0.4;
      ctx.fillRect(6, 44, 52, 20);
      ctx.globalAlpha = 1;
    } else if (config.beard === "goatee") {
      ctx.fillRect(24, 54, 16, 10);
    } else {
      ctx.fillRect(4, 44, 56, 20);
      ctx.fillStyle = "#7f1d1d";
      if (config.mouth !== "shout") ctx.fillRect(25, 50, 14, 3);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

/* --------------------------------------------------------------- rig parts */

export interface AvatarRig {
  root: THREE.Group;
  head: THREE.Group;
  torso: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  dispose: () => void;
}

const hairGroup = (config: AvatarConfig, hairMat: THREE.Material) => {
  const g = new THREE.Group();
  switch (config.hair) {
    case "none":
      break;
    case "buzz":
      g.add(box(1.12, 0.14, 1.12, hairMat, [0, 0.56, 0]));
      break;
    case "curly":
      for (const [x, z] of [[-0.36, -0.3], [0.36, -0.3], [-0.36, 0.34], [0.36, 0.34], [0, 0]] as const) {
        g.add(box(0.5, 0.34, 0.5, hairMat, [x, 0.6, z]));
      }
      break;
    case "ponytail":
      g.add(box(1.16, 0.24, 1.16, hairMat, [0, 0.6, 0]));
      g.add(box(0.3, 0.9, 0.3, hairMat, [0, 0.25, -0.68]));
      break;
    case "long":
      g.add(box(1.18, 0.26, 1.18, hairMat, [0, 0.6, 0]));
      g.add(box(0.2, 1.1, 1.1, hairMat, [-0.6, 0.05, 0]));
      g.add(box(0.2, 1.1, 1.1, hairMat, [0.6, 0.05, 0]));
      g.add(box(1.1, 1.0, 0.2, hairMat, [0, 0.05, -0.6]));
      break;
    case "mohawk":
      g.add(box(0.22, 0.62, 1.0, hairMat, [0, 0.86, 0]));
      break;
    case "dreads":
      g.add(box(1.16, 0.2, 1.16, hairMat, [0, 0.6, 0]));
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.add(box(0.16, 0.8, 0.16, hairMat, [Math.sin(a) * 0.5, 0.15, Math.cos(a) * 0.5]));
      }
      break;
    default:
      g.add(box(1.16, 0.3, 1.16, hairMat, [0, 0.55, 0]));
      g.add(box(0.18, 0.4, 1.1, hairMat, [-0.58, 0.25, 0]));
      g.add(box(0.18, 0.4, 1.1, hairMat, [0.58, 0.25, 0]));
  }
  return g;
};

const headwearGroup = (config: AvatarConfig, jacket: string) => {
  const g = new THREE.Group();
  const j = mat(jacket);
  switch (config.headwear) {
    case "beanie":
      g.add(box(1.24, 0.42, 1.24, j, [0, 0.66, 0]));
      g.add(box(1.28, 0.16, 1.28, mat(shade(jacket, 0.6)), [0, 0.46, 0]));
      g.add(box(0.24, 0.24, 0.24, mat("#f8fafc"), [0, 0.94, 0]));
      break;
    case "cap":
      g.add(box(1.24, 0.34, 1.24, j, [0, 0.62, 0]));
      g.add(box(1.0, 0.1, 0.5, mat(shade(jacket, 0.75)), [0, 0.48, 0.82]));
      break;
    case "helmet":
      g.add(box(1.3, 0.5, 1.3, mat("#f1f5f9"), [0, 0.68, 0]));
      g.add(box(1.34, 0.12, 1.34, mat("#0ea5e9"), [0, 0.46, 0]));
      break;
    case "hood":
      g.add(box(1.4, 1.2, 1.4, mat(shade(jacket, 0.9)), [0, 0.3, -0.16]));
      g.add(box(1.1, 1.0, 0.2, mat("#0b1220"), [0, 0.24, 0.62]));
      break;
    case "oxygen":
      g.add(box(1.26, 0.36, 1.26, mat("#f97316"), [0, 0.64, 0]));
      g.add(box(0.8, 0.5, 0.3, mat("#e2e8f0"), [0, -0.18, 0.58]));
      g.add(box(0.12, 0.5, 0.12, mat("#475569"), [0.5, -0.5, 0.5]));
      break;
    case "crown": {
      g.add(box(1.24, 0.2, 1.24, mat("#ca8a04", { shiny: true }), [0, 0.58, 0]));
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        g.add(box(0.18, 0.3, 0.18, mat("#eab308", { shiny: true }), [Math.sin(a) * 0.48, 0.8, Math.cos(a) * 0.48]));
      }
      break;
    }
    default:
      break;
  }
  return g;
};

const accessoryFor = (config: AvatarConfig) => {
  const g = new THREE.Group();
  switch (config.accessory) {
    case "poles":
      g.add(box(0.08, 1.9, 0.08, mat("#94a3b8"), [-0.95, -0.55, 0.1]));
      g.add(box(0.08, 1.9, 0.08, mat("#94a3b8"), [0.95, -0.55, 0.1]));
      break;
    case "axe":
      g.add(box(0.1, 1.5, 0.1, mat("#0f172a"), [-0.95, -0.5, 0.14]));
      g.add(box(0.6, 0.12, 0.12, mat("#cbd5e1", { shiny: true }), [-0.7, 0.2, 0.14]));
      g.add(box(0.1, 0.24, 0.1, mat("#cbd5e1"), [-0.95, -1.3, 0.14]));
      break;
    case "rope": {
      const geo = new THREE.TorusGeometry(0.34, 0.09, 4, 10);
      const t = new THREE.Mesh(geo, mat("#22d3ee"));
      t.rotation.y = Math.PI / 2;
      t.position.set(0.85, -0.5, 0);
      g.add(t);
      break;
    }
    case "flag":
      g.add(box(0.08, 2.2, 0.08, mat("#e2e8f0"), [0.95, -0.2, 0]));
      g.add(box(0.06, 0.55, 0.85, mat("#22d3ee"), [0.95, 0.72, 0.5]));
      break;
    default:
      break;
  }
  return g;
};

/* -------------------------------------------------------------- the climber */

/** Assembles the full low-poly climber. Units: ~1 = a head width. */
export const buildAvatarRig = (config: AvatarConfig): AvatarRig => {
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends THREE.Object3D>(o: T) => {
    o.traverse((c) => {
      const m = c as THREE.Mesh;
      if (m.geometry) disposables.push(m.geometry);
      if (m.material) {
        const list = Array.isArray(m.material) ? m.material : [m.material];
        for (const mm of list) disposables.push(mm);
      }
    });
    return o;
  };

  const skin = colorOf("skin", config.skin, "#e0ac86");
  const jacket = colorOf("jacket", config.jacket, "#dc2626");
  const hair = colorOf("hairColor", config.hairColor, "#5a3a22");

  const skinMat = mat(skin);
  const jacketMat = mat(jacket, { shiny: config.jacket === "gold" });
  const jacketDark = mat(shade(jacket, 0.7));
  const hairMat = mat(hair);
  const pantsMat = mat("#1f2937");
  const bootMat = mat("#0f172a");

  const root = new THREE.Group();

  // Torso + hips
  const torso = new THREE.Group();
  torso.position.y = 0.35;
  torso.add(box(1.5, 1.6, 0.85, jacketMat));
  torso.add(box(1.54, 0.3, 0.88, jacketDark, [0, -0.72, 0])); // hem
  torso.add(box(0.16, 1.2, 0.06, mat(shade(jacket, 0.45)), [0, 0.15, 0.44])); // zip
  if (config.jacket === "down" || config.jacket === "gold") {
    for (const y of [0.5, 0.05, -0.4]) {
      torso.add(box(1.56, 0.08, 0.9, jacketDark, [0, y, 0]));
    }
  }
  // Backpack — every climber carries one.
  torso.add(box(1.0, 1.1, 0.4, mat("#334155"), [0, 0.1, -0.6]));
  torso.add(box(1.05, 0.14, 0.44, mat("#22d3ee"), [0, -0.3, -0.61]));
  root.add(torso);

  // Head
  const head = new THREE.Group();
  head.position.y = 1.62;
  const faceTex = faceTexture(config);
  disposables.push(faceTex);
  const side = mat(skin);
  const headMats: THREE.Material[] = [
    side, // +x
    side, // -x
    mat(shade(skin, 1.1)), // +y
    mat(shade(skin, 0.75)), // -y
    new THREE.MeshLambertMaterial({ map: faceTex, flatShading: true }), // +z (face)
    mat(shade(skin, 0.9)), // -z
  ];
  head.add(box(1.15, 1.15, 1.1, headMats));
  head.add(box(0.14, 0.34, 0.24, skinMat, [-0.62, -0.05, 0])); // ears
  head.add(box(0.14, 0.34, 0.24, skinMat, [0.62, -0.05, 0]));
  head.add(hairGroup(config, hairMat));
  head.add(headwearGroup(config, jacket));
  root.add(head);

  // Neck
  root.add(box(0.45, 0.3, 0.45, mat(shade(skin, 0.85)), [0, 1.05, 0]));

  // Arms — pivot at the shoulder so they can swing.
  const makeArm = (sign: number) => {
    const g = new THREE.Group();
    g.position.set(sign * 0.92, 1.0, 0);
    g.add(box(0.42, 1.1, 0.42, jacketMat, [0, -0.5, 0]));
    g.add(box(0.44, 0.36, 0.44, skinMat, [0, -1.18, 0])); // glove/hand
    return g;
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);
  root.add(armL, armR);

  // Legs
  const makeLeg = (sign: number) => {
    const g = new THREE.Group();
    g.position.set(sign * 0.36, -0.45, 0);
    g.add(box(0.5, 1.2, 0.5, pantsMat, [0, -0.6, 0]));
    g.add(box(0.56, 0.28, 0.75, bootMat, [0, -1.32, 0.12]));
    return g;
  };
  const legL = makeLeg(-1);
  const legR = makeLeg(1);
  root.add(legL, legR);

  root.add(accessoryFor(config));

  track(root);
  root.position.y = 1.5;

  return {
    root,
    head,
    torso,
    armL,
    armR,
    legL,
    legR,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
};

/** Backdrop colours reused from the 2D avatar backdrops. */
export const backdropColors = (id: string): { top: string; bottom: string; ground: string } => {
  switch (id) {
    case "glacier":
      return { top: "#0e7490", bottom: "#a5f3fc", ground: "#67e8f9" };
    case "sunset":
      return { top: "#fb7185", bottom: "#7c2d12", ground: "#7c2d12" };
    case "night":
      return { top: "#0b1220", bottom: "#111827", ground: "#111827" };
    case "aurora":
      return { top: "#0b1220", bottom: "#065f46", ground: "#134e4a" };
    case "plain":
      return { top: "#1e293b", bottom: "#334155", ground: "#334155" };
    default:
      return { top: "#0f172a", bottom: "#1e293b", ground: "#1e293b" };
  }
};

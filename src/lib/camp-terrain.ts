/**
 * Base Camp terrain: where a climber's feet can actually be.
 *
 * The scene SVG is drawn with viewBox 0 0 2000 900 and sliced into the
 * 1800x900 world, centred horizontally — so the SVG sits 100px to the left of
 * the world origin. The mid ridge polyline below is the skyline of the
 * walkable mountains: nobody may stand higher than that crest, and nobody may
 * drop below the valley floor.
 */

import { CAMP_GROUND } from "@/lib/camp-builds";

const SCENE_W = 2000;
const WORLD_W = 1800;
/** Horizontal offset from world pixels to scene (SVG) pixels. */
const SCENE_OFFSET = (SCENE_W - WORLD_W) / 2;

/** Mid ridge crest, as [sceneX, sceneY] pairs (matches BaseCampScene). */
const RIDGE: Array<[number, number]> = [
  [0, 560],
  [SCENE_W * 0.13, 420],
  [SCENE_W * 0.26, 545],
  [SCENE_W * 0.41, 400],
  [SCENE_W * 0.58, 550],
  [SCENE_W * 0.72, 430],
  [SCENE_W * 0.87, 545],
  [SCENE_W, 450],
];

/** A little sink so feet bite into the slope instead of hovering on the edge. */
const FOOT_SINK = 8;

/** Highest point (smallest y) a climber may stand at this world x. */
export const campSurfaceY = (worldX: number): number => {
  const x = worldX + SCENE_OFFSET;
  let y = RIDGE[RIDGE.length - 1]![1];
  for (let i = 0; i < RIDGE.length - 1; i++) {
    const [x0, y0] = RIDGE[i]!;
    const [x1, y1] = RIDGE[i + 1]!;
    if (x >= x0 && x <= x1) {
      const t = x1 === x0 ? 0 : (x - x0) / (x1 - x0);
      y = y0 + (y1 - y0) * t;
      break;
    }
  }
  return y + FOOT_SINK;
};

/** Lowest point (largest y) a climber may stand at — the valley floor. */
export const CAMP_FLOOR_Y = CAMP_GROUND.maxY;

/**
 * Pull any position onto solid terrain: inside the world horizontally, never
 * above the mountain tops and never below the valley floor.
 */
export const groundPosition = (x: number, y: number) => {
  const gx = Math.min(CAMP_GROUND.maxX, Math.max(CAMP_GROUND.minX, x));
  const top = campSurfaceY(gx);
  const gy = Math.min(CAMP_FLOOR_Y, Math.max(top, y));
  return { x: gx, y: gy };
};

/** Climbers higher up the slope are further away, so draw them smaller. */
export const campDepthScale = (y: number) => {
  const top = 400;
  const t = Math.min(1, Math.max(0, (y - top) / (CAMP_FLOOR_Y - top)));
  return 0.6 + t * 0.45;
};

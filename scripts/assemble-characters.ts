/**
 * assemble-characters.ts — Composites LimeZu character generator layers
 * into final spritesheets for the Phaser 3 game.
 *
 * Layer order (bottom→top): Body → Eyes → Outfit → Hairstyle → Accessory
 * All layers share the same 56-col × 20-row frame grid (32×64 per frame).
 *
 * Output: public/assets/sprites/characters.png + characters.json (Phaser atlas)
 */
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT = join(__dirname, "..");
const LIMEZU = join(PROJECT, "LimeZu", "Modern_Interiors", "2_Characters", "Character_Generator");
const OUT_DIR = join(PROJECT, "public", "assets", "sprites");

const FRAME_W = 32;
const FRAME_H = 64;
const SHEET_W = 1792; // 56 columns × 32px
const SHEET_H = 1280; // 20 rows × 64px

// ─── Animation row/frame mapping ────────────────────────────────────
// These map LimeZu spritesheet rows to our game animations.
// Row indices are 0-based. Frame ranges are [startCol, endCol) within that row.
//
// Spritesheet layout (56 cols × 20 rows at 32×64):
//   Row 0:  Idle down (4 frames)
//   Row 1:  Walk down (28 frames — we use first 6)
//   Row 2:  Interaction / pickup (24 frames)
//   Row 3:  (empty / padding)
//   Row 4:  Idle side (10 frames)
//   Row 5:  Walk side
//   Row 6:  Idle up
//   Row 7:  Walk up
//   Row 8:  Carry / push
//   Row 9-12: Combat / full-width animations
//   Row 13: Sit down (front-facing)
//   Row 14: Sit side
//   Row 15: Sit variant 3
//   Row 16: Phone / sit action
//   Row 17: Hurt
//   Row 18: Push/Pull
//   Row 19: Emote / misc

const ANIM_MAP = {
  // idle-sit: use walk-down row, neutral poses for subtle breathing effect
  // Cols picked: 0 (neutral) and 4 (neutral return) from walk cycle
  "idle-sit": { row: 1, cols: [0, 4] },
  // typing: use walk-down frames for subtle hand/body movement
  typing: { row: 1, cols: [0, 1, 2] },
  // walk-down: first 4 frames of walk cycle (bounce: 0,1,2,1 in game)
  "walk-down": { row: 1, cols: [0, 1, 2, 3] },
};

const TOTAL_FRAMES = Object.values(ANIM_MAP).reduce((sum, a) => sum + a.cols.length, 0); // 9

// ─── Character definitions ──────────────────────────────────────────
interface CharacterDef {
  body: string;
  eyes: string;
  outfit: string;
  hairstyle: string;
  accessory: string | null;
}

const characters: Record<string, CharacterDef> = {
  michael: {
    body: "Body_32x32_01.png", // light skin
    eyes: "Eyes_32x32_01.png",
    outfit: "Outfit_01_32x32_08.png", // shirt+tie, white/light variant
    hairstyle: "Hairstyle_01_32x32_01.png", // short dark hair
    accessory: null,
  },
  dwight: {
    body: "Body_32x32_01.png",
    eyes: "Eyes_32x32_01.png",
    outfit: "Outfit_01_32x32_03.png", // shirt+tie, mustard/brown variant
    hairstyle: "Hairstyle_02_32x32_03.png", // parted hair, brown
    accessory: "Accessory_15_Glasses_32x32_01.png", // glasses!
  },
  jim: {
    body: "Body_32x32_01.png",
    eyes: "Eyes_32x32_01.png",
    outfit: "Outfit_02_32x32_02.png", // casual shirt, blue variant
    hairstyle: "Hairstyle_03_32x32_03.png", // shaggy, brown
    accessory: null,
  },
  pam: {
    body: "Body_32x32_02.png", // slightly different skin tone
    eyes: "Eyes_32x32_02.png",
    outfit: "Outfit_05_32x32_02.png", // cardigan look, pink variant
    hairstyle: "Hairstyle_08_32x32_04.png", // ponytail, light brown
    accessory: null,
  },
};

// ─── Helpers ────────────────────────────────────────────────────────

function layerPath(category: string, filename: string): string {
  const subdir =
    category === "Bodies"
      ? "Bodies"
      : category === "Eyes"
        ? "Eyes"
        : category === "Outfits"
          ? "Outfits"
          : category === "Hairstyles"
            ? "Hairstyles"
            : "Accessories";
  return join(LIMEZU, subdir, "32x32", filename);
}

/** Composite 5 layers into a single full character spritesheet buffer */
async function compositeCharacter(def: CharacterDef): Promise<Buffer> {
  // Body may be wider (1854px) — crop to SHEET_W × SHEET_H
  const bodyBuffer = await sharp(layerPath("Bodies", def.body))
    .extract({ left: 0, top: 0, width: SHEET_W, height: SHEET_H })
    .toBuffer();

  const overlays: sharp.OverlayOptions[] = [
    { input: await cropLayer(layerPath("Eyes", def.eyes)) },
    { input: await cropLayer(layerPath("Outfits", def.outfit)) },
    { input: await cropLayer(layerPath("Hairstyles", def.hairstyle)) },
  ];

  if (def.accessory) {
    overlays.push({
      input: await cropLayer(layerPath("Accessories", def.accessory)),
    });
  }

  return sharp(bodyBuffer)
    .composite(overlays)
    .png()
    .toBuffer();
}

/** Ensure a layer is exactly SHEET_W × SHEET_H */
async function cropLayer(path: string): Promise<Buffer> {
  const meta = await sharp(path).metadata();
  if (meta.width === SHEET_W && meta.height === SHEET_H) {
    return sharp(path).toBuffer();
  }
  // Crop or extend to match
  const w = Math.min(meta.width ?? SHEET_W, SHEET_W);
  const h = Math.min(meta.height ?? SHEET_H, SHEET_H);
  return sharp(path)
    .extract({ left: 0, top: 0, width: w, height: h })
    .extend({
      right: SHEET_W - w,
      bottom: SHEET_H - h,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();
}

/** Extract a single frame from a full sheet */
function extractFrame(sheet: Buffer, col: number, row: number): sharp.Sharp {
  return sharp(sheet).extract({
    left: col * FRAME_W,
    top: row * FRAME_H,
    width: FRAME_W,
    height: FRAME_H,
  });
}

// ─── Main ───────────────────────────────────────────────────────────

mkdirSync(OUT_DIR, { recursive: true });

const charNames = Object.keys(characters);
const CHARS = charNames.length;
const ATLAS_W = TOTAL_FRAMES * FRAME_W; // 9 * 32 = 288
const ATLAS_H = CHARS * FRAME_H; // 4 * 64 = 256

interface FrameInfo {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const frames: FrameInfo[] = [];
const frameBuffers: { input: Buffer; left: number; top: number }[] = [];

for (let ci = 0; ci < CHARS; ci++) {
  const charName = charNames[ci];
  const def = characters[charName];

  console.log(`Compositing ${charName}...`);
  console.log(`  Body: ${def.body}`);
  console.log(`  Eyes: ${def.eyes}`);
  console.log(`  Outfit: ${def.outfit}`);
  console.log(`  Hairstyle: ${def.hairstyle}`);
  console.log(`  Accessory: ${def.accessory ?? "none"}`);

  const fullSheet = await compositeCharacter(def);

  // Save full sheet for visual inspection (debug)
  const fullSheetPath = join(OUT_DIR, `${charName}-full.png`);
  await sharp(fullSheet).toFile(fullSheetPath);
  console.log(`  Full sheet → ${fullSheetPath}`);

  // Extract animation frames
  let frameX = 0;
  for (const [animName, animDef] of Object.entries(ANIM_MAP)) {
    for (let f = 0; f < animDef.cols.length; f++) {
      const col = animDef.cols[f];
      const row = animDef.row;

      const frameBuf = await extractFrame(fullSheet, col, row).toBuffer();

      const destX = frameX * FRAME_W;
      const destY = ci * FRAME_H;

      frameBuffers.push({ input: frameBuf, left: destX, top: destY });

      frames.push({
        name: `${charName}-${animName}-${f}`,
        x: destX,
        y: destY,
        w: FRAME_W,
        h: FRAME_H,
      });

      frameX++;
    }
  }
}

// Build the atlas PNG
console.log(`\nBuilding atlas (${ATLAS_W}×${ATLAS_H})...`);

const atlasBuffer = await sharp({
  create: {
    width: ATLAS_W,
    height: ATLAS_H,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(frameBuffers)
  .png({ compressionLevel: 9 })
  .toBuffer();

const pngPath = join(OUT_DIR, "characters.png");
await sharp(atlasBuffer).toFile(pngPath);

// Build Phaser 3 atlas JSON
const atlasFrames: Record<
  string,
  { frame: { x: number; y: number; w: number; h: number } }
> = {};
for (const f of frames) {
  atlasFrames[f.name] = {
    frame: { x: f.x, y: f.y, w: f.w, h: f.h },
  };
}

const atlasJson = {
  frames: atlasFrames,
  meta: {
    image: "characters.png",
    size: { w: ATLAS_W, h: ATLAS_H },
    scale: "1",
  },
};

const jsonPath = join(OUT_DIR, "characters.json");
writeFileSync(jsonPath, JSON.stringify(atlasJson, null, 2));

console.log(`\nDone!`);
console.log(`  Atlas PNG  → ${pngPath} (${ATLAS_W}×${ATLAS_H})`);
console.log(`  Atlas JSON → ${jsonPath} (${frames.length} frames)`);
console.log(`  Characters: ${charNames.join(", ")}`);
console.log(`  Animations: ${Object.entries(ANIM_MAP).map(([k, v]) => `${k} (${v.cols.length}fr)`).join(", ")}`);
console.log(`  Full sheets saved for inspection (${charNames.map((n) => `${n}-full.png`).join(", ")})`);

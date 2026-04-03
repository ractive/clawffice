/**
 * generate-characters.ts — Programmatically draws character spritesheets.
 * 4 characters × 3 animations (idle-sit 2fr, typing 3fr, walk-down 4fr) = 36 frames
 * Each frame: 32×48 pixels
 * Output: public/assets/sprites/characters.png + characters.json
 */
import { createCanvas } from "@napi-rs/canvas";
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const FW = 32; // frame width
const FH = 48; // frame height
const FRAMES_PER_CHAR = 9; // 2 + 3 + 4
const CHARS = 4;
const ATLAS_W = FRAMES_PER_CHAR * FW; // 9 * 32 = 288
const ATLAS_H = CHARS * FH; // 4 * 48 = 192

const canvas = createCanvas(ATLAS_W, ATLAS_H);
const ctx = canvas.getContext("2d");
ctx.clearRect(0, 0, ATLAS_W, ATLAS_H);

// ─── color palettes ─────────────────────────────────────────────────

interface Palette {
  skin: string;
  skinShadow: string;
  hair: string;
  hairHighlight: string;
  shirt: string;
  shirtShadow: string;
  tie?: string;
  pants: string;
  pantsShadow: string;
  shoes: string;
  glasses?: boolean;
  undershirt?: string;
}

const palettes: Record<string, Palette> = {
  michael: {
    skin: "#E8B87A",
    skinShadow: "#D09860",
    hair: "#2A2A2A",
    hairHighlight: "#3A3A3A",
    shirt: "#F0F0F0",
    shirtShadow: "#D0D0D0",
    tie: "#2244AA",
    pants: "#5A5A3A",
    pantsShadow: "#4A4A2A",
    shoes: "#3A3A3A",
  },
  dwight: {
    skin: "#E8C090",
    skinShadow: "#D0A870",
    hair: "#8B5A2B",
    hairHighlight: "#A06830",
    shirt: "#C8A820",
    shirtShadow: "#A88810",
    tie: "#2A2A2A",
    pants: "#4A4A2A",
    pantsShadow: "#3A3A1A",
    shoes: "#3A3A3A",
    glasses: true,
  },
  jim: {
    skin: "#E8C090",
    skinShadow: "#D0A870",
    hair: "#6B4226",
    hairHighlight: "#7A5030",
    shirt: "#4488CC",
    shirtShadow: "#3366AA",
    pants: "#3A3A5A",
    pantsShadow: "#2A2A4A",
    shoes: "#3A3A3A",
  },
  pam: {
    skin: "#F0C8A0",
    skinShadow: "#D8B088",
    hair: "#A06830",
    hairHighlight: "#B87840",
    shirt: "#CC6688",
    shirtShadow: "#AA4466",
    undershirt: "#558844",
    pants: "#3A3A5A",
    pantsShadow: "#2A2A4A",
    shoes: "#6A4A3A",
  },
};

// ─── drawing helpers ────────────────────────────────────────────────

function px(x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** Draw character head (front-facing) */
function drawHead(
  ox: number,
  oy: number,
  p: Palette,
  _breathOffset = 0,
) {
  // Hair top
  px(ox + 10, oy + 2, 12, 4, p.hair);
  px(ox + 9, oy + 3, 14, 3, p.hair);
  px(ox + 10, oy + 4, 12, 2, p.hairHighlight); // highlight

  // Face
  px(ox + 10, oy + 6, 12, 10, p.skin);
  px(ox + 11, oy + 7, 10, 8, p.skin);
  // Ears
  px(ox + 9, oy + 8, 1, 3, p.skin);
  px(ox + 22, oy + 8, 1, 3, p.skin);

  // Eyes (2px wide)
  px(ox + 12, oy + 9, 2, 2, "#2A2A2A");
  px(ox + 18, oy + 9, 2, 2, "#2A2A2A");
  // Eye whites
  px(ox + 12, oy + 9, 1, 1, "#FFFFFF");
  px(ox + 18, oy + 9, 1, 1, "#FFFFFF");

  // Mouth
  px(ox + 14, oy + 13, 4, 1, "#C08060");

  // Glasses for Dwight
  if (p.glasses) {
    px(ox + 11, oy + 8, 4, 4, "rgba(0,0,0,0)");
    px(ox + 17, oy + 8, 4, 4, "rgba(0,0,0,0)");
    // frames
    ctx.strokeStyle = "#555555";
    ctx.lineWidth = 1;
    ctx.strokeRect(ox + 10.5, oy + 7.5, 5, 5);
    ctx.strokeRect(ox + 16.5, oy + 7.5, 5, 5);
    // bridge
    px(ox + 15, oy + 9, 2, 1, "#555555");
    // arms
    px(ox + 9, oy + 9, 2, 1, "#555555");
    px(ox + 21, oy + 9, 2, 1, "#555555");
  }

  // Hair sides
  px(ox + 9, oy + 5, 2, 4, p.hair);
  px(ox + 21, oy + 5, 2, 4, p.hair);

  // Chin shadow
  px(ox + 11, oy + 15, 10, 1, p.skinShadow);
}

/** Draw sitting torso (for idle-sit and typing) */
function drawSittingBody(ox: number, oy: number, p: Palette) {
  // Neck
  px(ox + 14, oy + 16, 4, 2, p.skin);

  // Shirt / torso
  px(ox + 9, oy + 18, 14, 10, p.shirt);
  px(ox + 10, oy + 19, 12, 8, p.shirtShadow);

  // Tie
  if (p.tie) {
    px(ox + 15, oy + 18, 2, 8, p.tie);
    px(ox + 14, oy + 18, 4, 1, p.tie); // knot
  }

  // Undershirt (Pam)
  if (p.undershirt) {
    px(ox + 12, oy + 19, 8, 2, p.undershirt);
  }

  // Arms at sides (sitting)
  px(ox + 7, oy + 19, 2, 7, p.shirt);
  px(ox + 23, oy + 19, 2, 7, p.shirt);

  // Hands
  px(ox + 7, oy + 26, 2, 2, p.skin);
  px(ox + 23, oy + 26, 2, 2, p.skin);

  // Pants (sitting)
  px(ox + 9, oy + 28, 14, 6, p.pants);
  px(ox + 10, oy + 29, 12, 4, p.pantsShadow);

  // Chair hint
  px(ox + 6, oy + 28, 3, 6, "#484848");
  px(ox + 23, oy + 28, 3, 6, "#484848");
  px(ox + 6, oy + 34, 20, 2, "#3A3A3A");

  // Legs / feet
  px(ox + 10, oy + 34, 5, 4, p.pants);
  px(ox + 17, oy + 34, 5, 4, p.pants);

  // Shoes
  px(ox + 10, oy + 38, 5, 2, p.shoes);
  px(ox + 17, oy + 38, 5, 2, p.shoes);

  // Chair legs
  px(ox + 8, oy + 40, 2, 6, "#333333");
  px(ox + 22, oy + 40, 2, 6, "#333333");
  px(ox + 6, oy + 44, 20, 2, "#2A2A2A"); // chair base
}

/** Draw typing arms (offset varies by frame) */
function drawTypingArms(
  ox: number,
  oy: number,
  p: Palette,
  frame: number,
) {
  // Arms reaching forward to keyboard
  const armOffsets = [0, -1, 1]; // slight variation per frame
  const off = armOffsets[frame];

  // Left arm
  px(ox + 7, oy + 19, 2, 5, p.shirt);
  px(ox + 8, oy + 24, 4, 2, p.shirt);
  px(ox + 11 + off, oy + 25, 3, 2, p.skin); // left hand on keyboard

  // Right arm
  px(ox + 23, oy + 19, 2, 5, p.shirt);
  px(ox + 20, oy + 24, 4, 2, p.shirt);
  px(ox + 18 - off, oy + 25, 3, 2, p.skin); // right hand on keyboard
}

/** Draw walking body (facing down/south) */
function drawWalkingBody(
  ox: number,
  oy: number,
  p: Palette,
  frame: number,
) {
  // Neck
  px(ox + 14, oy + 16, 4, 2, p.skin);

  // Shirt / torso
  px(ox + 9, oy + 18, 14, 10, p.shirt);
  px(ox + 10, oy + 19, 12, 8, p.shirtShadow);

  // Tie
  if (p.tie) {
    px(ox + 15, oy + 18, 2, 8, p.tie);
    px(ox + 14, oy + 18, 4, 1, p.tie);
  }

  if (p.undershirt) {
    px(ox + 12, oy + 19, 8, 2, p.undershirt);
  }

  // Walking arm swing
  const armSwing = [1, 2, 1, 0];
  const swing = armSwing[frame];

  // Left arm
  px(ox + 7, oy + 19 + swing, 2, 7, p.shirt);
  px(ox + 7, oy + 26 + swing, 2, 2, p.skin);

  // Right arm
  px(ox + 23, oy + 19 - swing + 1, 2, 7, p.shirt);
  px(ox + 23, oy + 26 - swing + 1, 2, 2, p.skin);

  // Pants
  px(ox + 9, oy + 28, 14, 6, p.pants);

  // Walking legs
  const legFrames = [
    // [leftX, leftH, rightX, rightH]
    [11, 8, 18, 6],
    [10, 10, 19, 4],
    [11, 6, 18, 8],
    [12, 4, 17, 10],
  ];
  const [lx, lh, rx, rh] = legFrames[frame];

  px(ox + lx, oy + 34, 4, lh, p.pants);
  px(ox + rx, oy + 34, 4, rh, p.pants);

  // Shoes
  px(ox + lx, oy + 34 + lh, 4, 2, p.shoes);
  px(ox + rx, oy + 34 + rh, 4, 2, p.shoes);
}

// ─── draw all character frames ──────────────────────────────────────

interface FrameInfo {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const frames: FrameInfo[] = [];

const charNames = ["michael", "dwight", "jim", "pam"];

for (let ci = 0; ci < CHARS; ci++) {
  const charName = charNames[ci];
  const p = palettes[charName];
  const baseY = ci * FH;
  let frameX = 0;

  // idle-sit: 2 frames (slight breathing motion)
  for (let f = 0; f < 2; f++) {
    const ox = frameX * FW;
    const breathOffset = f === 1 ? 1 : 0;

    drawHead(ox, baseY + breathOffset, p);
    drawSittingBody(ox, baseY + breathOffset, p);

    frames.push({
      name: `${charName}-idle-sit-${f}`,
      x: ox,
      y: baseY,
      w: FW,
      h: FH,
    });
    frameX++;
  }

  // typing: 3 frames
  for (let f = 0; f < 3; f++) {
    const ox = frameX * FW;

    drawHead(ox, baseY, p);
    // Draw body but override arms
    // Neck
    px(ox + 14, baseY + 16, 4, 2, p.skin);
    // Shirt
    px(ox + 9, baseY + 18, 14, 10, p.shirt);
    px(ox + 10, baseY + 19, 12, 8, p.shirtShadow);
    if (p.tie) {
      px(ox + 15, baseY + 18, 2, 8, p.tie);
      px(ox + 14, baseY + 18, 4, 1, p.tie);
    }
    if (p.undershirt) {
      px(ox + 12, baseY + 19, 8, 2, p.undershirt);
    }
    // Typing arms
    drawTypingArms(ox, baseY, p, f);
    // Pants (sitting)
    px(ox + 9, baseY + 28, 14, 6, p.pants);
    px(ox + 10, baseY + 29, 12, 4, p.pantsShadow);
    // Chair
    px(ox + 6, baseY + 28, 3, 6, "#484848");
    px(ox + 23, baseY + 28, 3, 6, "#484848");
    px(ox + 6, baseY + 34, 20, 2, "#3A3A3A");
    // Legs
    px(ox + 10, baseY + 34, 5, 4, p.pants);
    px(ox + 17, baseY + 34, 5, 4, p.pants);
    px(ox + 10, baseY + 38, 5, 2, p.shoes);
    px(ox + 17, baseY + 38, 5, 2, p.shoes);
    // Chair legs
    px(ox + 8, baseY + 40, 2, 6, "#333333");
    px(ox + 22, baseY + 40, 2, 6, "#333333");
    px(ox + 6, baseY + 44, 20, 2, "#2A2A2A");

    frames.push({
      name: `${charName}-typing-${f}`,
      x: ox,
      y: baseY,
      w: FW,
      h: FH,
    });
    frameX++;
  }

  // walk-down: 4 frames
  for (let f = 0; f < 4; f++) {
    const ox = frameX * FW;
    const bobOffset = f % 2 === 0 ? 0 : -1;

    drawHead(ox, baseY + bobOffset, p);
    drawWalkingBody(ox, baseY + bobOffset, p, f);

    frames.push({
      name: `${charName}-walk-down-${f}`,
      x: ox,
      y: baseY,
      w: FW,
      h: FH,
    });
    frameX++;
  }
}

// ─── output ─────────────────────────────────────────────────────────

const outDir = join(__dirname, "..", "public", "assets", "sprites");
mkdirSync(outDir, { recursive: true });

const pngPath = join(outDir, "characters.png");
const jsonPath = join(outDir, "characters.json");

// Optimize PNG
const rawPng = canvas.toBuffer("image/png");
await sharp(rawPng).png({ compressionLevel: 9 }).toFile(pngPath);

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

writeFileSync(jsonPath, JSON.stringify(atlasJson, null, 2));

console.log(`✓ Characters PNG  → ${pngPath} (${ATLAS_W}×${ATLAS_H})`);
console.log(`✓ Characters JSON → ${jsonPath} (${frames.length} frames)`);
console.log(`  Characters: ${charNames.join(", ")}`);
console.log(
  `  Animations: idle-sit (2fr), typing (3fr), walk-down (4fr)`,
);
console.log(
  `  Frames: ${frames.map((f) => f.name).join(", ")}`,
);

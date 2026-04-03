/**
 * generate-tileset.ts — Programmatically draws a 32×32 pixel art office tileset.
 * Output: public/assets/tiles/office-tileset.png + office-tileset.json
 */
import { createCanvas } from "@napi-rs/canvas";
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const TILE = 32;
const COLS = 6;
const ROWS = 4;
const WIDTH = COLS * TILE;
const HEIGHT = ROWS * TILE;

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext("2d");

// ─── helpers ─────────────────────────────────────────────────────────

function px(x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function rect(
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  stroke?: string,
) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
}

/** Offset into tile grid */
function tileOrigin(col: number, row: number): [number, number] {
  return [col * TILE, row * TILE];
}

// ─── row 0: base tiles ──────────────────────────────────────────────

function drawCarpet(col: number, row: number) {
  const [ox, oy] = tileOrigin(col, row);
  rect(ox, oy, TILE, TILE, "#6B7B8D"); // blue-gray base
  // subtle texture dots
  const dots = [
    [3, 5],
    [10, 2],
    [20, 8],
    [26, 3],
    [7, 15],
    [15, 12],
    [24, 18],
    [5, 25],
    [18, 22],
    [28, 28],
    [12, 28],
    [22, 14],
    [1, 19],
    [16, 6],
    [29, 11],
  ];
  for (const [dx, dy] of dots) {
    px(ox + dx, oy + dy, 1, 1, "#5E6E7F");
    px(ox + ((dx + 13) % 30), oy + ((dy + 11) % 30), 1, 1, "#7888998");
  }
}

function drawWall(col: number, row: number) {
  const [ox, oy] = tileOrigin(col, row);
  rect(ox, oy, TILE, TILE, "#E8DCC8"); // beige base
  // horizontal mortar lines
  for (let y = 8; y < TILE; y += 8) {
    px(ox, oy + y, TILE, 1, "#D4C8B4");
  }
  // vertical mortar offset
  for (let row2 = 0; row2 < 4; row2++) {
    const xOff = row2 % 2 === 0 ? 16 : 0;
    px(ox + xOff, oy + row2 * 8, 1, 8, "#D4C8B4");
  }
  // subtle highlight at top
  px(ox, oy, TILE, 1, "#F0E8DA");
}

function drawGlassWall(col: number, row: number) {
  const [ox, oy] = tileOrigin(col, row);
  rect(ox, oy, TILE, TILE, "#B8D8E8"); // light blue
  // frame
  px(ox, oy, 2, TILE, "#8899AA");
  px(ox + 30, oy, 2, TILE, "#8899AA");
  px(ox, oy, TILE, 2, "#8899AA");
  px(ox, oy + 30, TILE, 2, "#8899AA");
  // highlight lines (reflections)
  for (let i = 0; i < 3; i++) {
    const sx = ox + 6 + i * 10;
    for (let dy = 4; dy < 28; dy++) {
      px(sx, oy + dy, 1, 1, "#D0E8F4");
    }
  }
  // slight glare spot
  px(ox + 8, oy + 6, 3, 2, "#E0F0FF");
}

function drawDoor(col: number, row: number) {
  const [ox, oy] = tileOrigin(col, row);
  rect(ox, oy, TILE, TILE, "#E8DCC8"); // wall background
  // door frame
  rect(ox + 4, oy + 2, 24, 30, "#8B6914");
  // door panel
  rect(ox + 6, oy + 4, 20, 28, "#A0782C");
  // panel details
  rect(ox + 8, oy + 6, 16, 10, "#8B6914");
  rect(ox + 8, oy + 19, 16, 10, "#8B6914");
  // handle
  px(ox + 21, oy + 16, 2, 3, "#D4AA44");
  px(ox + 21, oy + 17, 3, 1, "#D4AA44");
  // highlight
  px(ox + 6, oy + 4, 1, 28, "#B88A3C");
}

function drawKitchenTile(col: number, row: number) {
  const [ox, oy] = tileOrigin(col, row);
  // checkerboard
  for (let ty = 0; ty < TILE; ty += 4) {
    for (let tx = 0; tx < TILE; tx += 4) {
      const light = (tx / 4 + ty / 4) % 2 === 0;
      px(ox + tx, oy + ty, 4, 4, light ? "#F0F0F0" : "#D8D8D8");
    }
  }
  // grout lines
  for (let g = 0; g < TILE; g += 4) {
    px(ox + g, oy, 1, TILE, "#C8C8C8");
    px(ox, oy + g, TILE, 1, "#C8C8C8");
  }
}

function drawAnnexCarpet(col: number, row: number) {
  const [ox, oy] = tileOrigin(col, row);
  rect(ox, oy, TILE, TILE, "#6B8B7B"); // green-gray
  const dots = [
    [4, 3],
    [12, 7],
    [22, 5],
    [8, 18],
    [18, 14],
    [28, 22],
    [3, 28],
    [14, 25],
    [26, 10],
  ];
  for (const [dx, dy] of dots) {
    px(ox + dx, oy + dy, 1, 1, "#5E7B6B");
  }
}

// ─── row 1: furniture ───────────────────────────────────────────────

function drawDeskTopLeft(col: number, row: number) {
  const [ox, oy] = tileOrigin(col, row);
  // desk surface
  rect(ox, oy, TILE, TILE, "#8B6C3C");
  // edge highlight
  px(ox, oy, TILE, 2, "#A07844");
  px(ox, oy, 2, TILE, "#A07844");
  // wood grain
  for (let y = 6; y < TILE; y += 5) {
    px(ox + 4, oy + y, 24, 1, "#7A5C30");
  }
  // shadow at bottom
  px(ox, oy + 30, TILE, 2, "#6B5428");
}

function drawDeskTopRight(col: number, row: number) {
  const [ox, oy] = tileOrigin(col, row);
  // desk surface
  rect(ox, oy, TILE, TILE, "#8B6C3C");
  px(ox + 30, oy, 2, TILE, "#A07844");
  px(ox, oy, TILE, 2, "#A07844");
  // monitor
  rect(ox + 6, oy + 4, 20, 16, "#2A2A2A"); // frame
  rect(ox + 8, oy + 6, 16, 12, "#1844AA"); // screen
  // screen glow
  px(ox + 10, oy + 8, 12, 2, "#3366CC");
  px(ox + 10, oy + 12, 8, 1, "#3366CC");
  // monitor stand
  rect(ox + 14, oy + 20, 4, 3, "#2A2A2A");
  rect(ox + 12, oy + 23, 8, 2, "#333333");
  // shadow
  px(ox, oy + 30, TILE, 2, "#6B5428");
}

function drawDeskBottomLeft(col: number, row: number) {
  const [ox, oy] = tileOrigin(col, row);
  rect(ox, oy, TILE, TILE, "#6B7B8D"); // carpet bg
  // desk front panel
  rect(ox, oy, TILE, 12, "#7A5C30");
  px(ox, oy, TILE, 1, "#8B6C3C"); // top edge
  // desk legs
  rect(ox + 2, oy + 12, 3, 20, "#6B5428");
  rect(ox + 27, oy + 12, 3, 20, "#6B5428");
  // leg shadow
  px(ox + 2, oy + 30, 3, 2, "#4A3A18");
  px(ox + 27, oy + 30, 3, 2, "#4A3A18");
}

function drawDeskBottomRight(col: number, row: number) {
  const [ox, oy] = tileOrigin(col, row);
  rect(ox, oy, TILE, TILE, "#6B7B8D"); // carpet bg
  // desk front panel
  rect(ox, oy, TILE, 12, "#7A5C30");
  px(ox, oy, TILE, 1, "#8B6C3C");
  // desk legs
  rect(ox + 2, oy + 12, 3, 20, "#6B5428");
  rect(ox + 27, oy + 12, 3, 20, "#6B5428");
  // keyboard on desk front
  rect(ox + 8, oy + 2, 16, 7, "#444444");
  rect(ox + 9, oy + 3, 14, 5, "#555555");
  // key rows
  for (let ky = 0; ky < 3; ky++) {
    for (let kx = 0; kx < 6; kx++) {
      px(ox + 10 + kx * 2, oy + 3 + ky * 2, 1, 1, "#777777");
    }
  }
}

function drawOfficeChair(col: number, row: number) {
  const [ox, oy] = tileOrigin(col, row);
  rect(ox, oy, TILE, TILE, "#6B7B8D"); // carpet bg
  // chair base (star shape - simplified)
  px(ox + 14, oy + 26, 4, 2, "#333333");
  px(ox + 10, oy + 28, 12, 2, "#333333");
  px(ox + 12, oy + 30, 8, 2, "#222222");
  // chair post
  px(ox + 15, oy + 20, 2, 6, "#444444");
  // seat
  rect(ox + 8, oy + 12, 16, 8, "#3A3A3A");
  rect(ox + 9, oy + 13, 14, 6, "#484848");
  // backrest
  rect(ox + 9, oy + 4, 14, 9, "#3A3A3A");
  rect(ox + 10, oy + 5, 12, 7, "#484848");
  // highlight on backrest
  px(ox + 10, oy + 5, 1, 7, "#555555");
}

function drawBookshelf(col: number, row: number) {
  const [ox, oy] = tileOrigin(col, row);
  // shelf frame
  rect(ox + 2, oy, 28, TILE, "#6B4E2A");
  // shelves
  for (let s = 0; s < 4; s++) {
    const sy = oy + 2 + s * 8;
    // books on this shelf
    const bookColors = [
      ["#CC3333", "#3366CC", "#339933", "#CC9933", "#9933CC"],
      ["#3399CC", "#CC6633", "#336633", "#CC3366", "#6633CC"],
      ["#33CC99", "#CC3333", "#6666CC", "#CC9933", "#339966"],
      ["#9933CC", "#CC6633", "#3366CC", "#339933", "#CC3333"],
    ];
    const colors = bookColors[s];
    for (let b = 0; b < 5; b++) {
      px(ox + 4 + b * 5, sy, 4, 6, colors[b]);
      // book spine highlight
      px(ox + 4 + b * 5, sy, 1, 6, "#FFFFFF20");
    }
    // shelf board
    px(ox + 2, sy + 6, 28, 2, "#5A3E1C");
  }
}

// ─── row 2: more furniture ──────────────────────────────────────────

function drawFilingCabinet(col: number, row: number) {
  const [ox, oy] = tileOrigin(col, row);
  // body
  rect(ox + 4, oy + 1, 24, 30, "#888888");
  // edge highlight
  px(ox + 4, oy + 1, 1, 30, "#999999");
  // drawers
  for (let d = 0; d < 3; d++) {
    const dy = oy + 3 + d * 9;
    rect(ox + 6, dy, 20, 8, "#7A7A7A");
    px(ox + 6, dy, 20, 1, "#999999"); // drawer top edge
    // handle
    px(ox + 13, dy + 3, 6, 2, "#AAAAAA");
    px(ox + 14, dy + 4, 4, 1, "#CCCCCC");
  }
  // shadow at bottom
  px(ox + 4, oy + 30, 24, 1, "#666666");
}

function drawPlant(col: number, row: number) {
  const [ox, oy] = tileOrigin(col, row);
  // transparent bg first (for furniture layer)
  rect(ox, oy, TILE, TILE, "rgba(0,0,0,0)");
  // pot
  rect(ox + 10, oy + 22, 12, 9, "#8B4513");
  rect(ox + 11, oy + 23, 10, 7, "#A0522D");
  px(ox + 10, oy + 22, 12, 1, "#6B3410"); // rim
  // soil
  px(ox + 11, oy + 23, 10, 2, "#3A2510");
  // leaves
  const leafColor = "#2D8B2D";
  const leafLight = "#3AA83A";
  // center stem
  px(ox + 15, oy + 14, 2, 9, "#1A6B1A");
  // leaves radiating out
  px(ox + 10, oy + 10, 5, 4, leafColor);
  px(ox + 17, oy + 8, 6, 4, leafColor);
  px(ox + 12, oy + 5, 5, 5, leafColor);
  px(ox + 18, oy + 12, 5, 4, leafColor);
  px(ox + 8, oy + 14, 5, 3, leafColor);
  // leaf highlights
  px(ox + 11, oy + 10, 2, 1, leafLight);
  px(ox + 18, oy + 8, 2, 1, leafLight);
  px(ox + 13, oy + 5, 2, 1, leafLight);
}

function drawReceptionDeskLeft(col: number, row: number) {
  const [ox, oy] = tileOrigin(col, row);
  // L-shaped counter - left part (front facing)
  rect(ox, oy + 4, TILE, 24, "#A0782C");
  // counter top
  rect(ox, oy + 2, TILE, 4, "#B88A3C");
  px(ox, oy + 2, TILE, 1, "#C89A4C"); // highlight
  // front panel
  rect(ox + 2, oy + 8, 28, 18, "#8B6914");
  // bottom edge
  px(ox, oy + 28, TILE, 2, "#6B5428");
}

function drawReceptionDeskRight(col: number, row: number) {
  const [ox, oy] = tileOrigin(col, row);
  // L-shaped counter - right part (side facing)
  rect(ox, oy + 4, 20, 24, "#A0782C");
  // counter top
  rect(ox, oy + 2, 20, 4, "#B88A3C");
  px(ox, oy + 2, 20, 1, "#C89A4C");
  // panel
  rect(ox + 2, oy + 8, 16, 18, "#8B6914");
  // computer on counter
  rect(ox + 4, oy - 4, 12, 8, "#2A2A2A");
  rect(ox + 5, oy - 3, 10, 6, "#1844AA");
  px(ox + 6, oy - 2, 8, 2, "#3366CC");
  // bottom edge
  px(ox, oy + 28, 20, 2, "#6B5428");
}

function drawCopier(col: number, row: number) {
  const [ox, oy] = tileOrigin(col, row);
  // body
  rect(ox + 3, oy + 8, 26, 22, "#E0E0E0");
  // top lid
  rect(ox + 3, oy + 4, 26, 6, "#CCCCCC");
  px(ox + 3, oy + 4, 26, 1, "#DDDDDD");
  // paper tray
  rect(ox + 6, oy + 26, 20, 4, "#D0D0D0");
  // control panel
  rect(ox + 20, oy + 10, 7, 4, "#333333");
  px(ox + 22, oy + 11, 2, 2, "#44CC44"); // green light
  // detail lines
  px(ox + 3, oy + 18, 26, 1, "#BBBBBB");
  // shadow
  px(ox + 3, oy + 29, 26, 1, "#AAAAAA");
}

function drawVendingMachine(col: number, row: number) {
  const [ox, oy] = tileOrigin(col, row);
  // body
  rect(ox + 2, oy, 28, TILE, "#3344AA");
  // front panel
  rect(ox + 4, oy + 2, 24, 20, "#2244CC");
  // items display
  for (let iy = 0; iy < 3; iy++) {
    for (let ix = 0; ix < 4; ix++) {
      const colors = ["#CC3333", "#33CC33", "#CCCC33", "#CC6633"];
      px(ox + 6 + ix * 5, oy + 4 + iy * 6, 3, 4, colors[ix]);
    }
  }
  // glass reflection
  px(ox + 5, oy + 3, 1, 18, "#5566CC");
  // dispensing slot
  rect(ox + 6, oy + 24, 20, 5, "#1A1A1A");
  // coin slot
  px(ox + 24, oy + 14, 2, 3, "#AAAAAA");
  // brand label
  px(ox + 10, oy + 23, 12, 1, "#FF6600");
}

// ─── row 3: props ───────────────────────────────────────────────────

function drawWaterCooler(col: number, row: number) {
  const [ox, oy] = tileOrigin(col, row);
  // transparent bg
  rect(ox, oy, TILE, TILE, "rgba(0,0,0,0)");
  // base/stand
  rect(ox + 10, oy + 22, 12, 10, "#DDDDDD");
  rect(ox + 11, oy + 28, 10, 4, "#CCCCCC");
  // water jug (upside down)
  rect(ox + 11, oy + 2, 10, 20, "#88CCEE");
  rect(ox + 12, oy + 3, 8, 18, "#AADDFF");
  // water level
  rect(ox + 12, oy + 8, 8, 13, "#4499CC");
  // jug cap
  px(ox + 13, oy + 1, 6, 2, "#DDDDDD");
  // spigots
  px(ox + 10, oy + 22, 3, 2, "#CC3333"); // hot
  px(ox + 19, oy + 22, 3, 2, "#3366CC"); // cold
}

function drawCoffeeMaker(col: number, row: number) {
  const [ox, oy] = tileOrigin(col, row);
  rect(ox, oy, TILE, TILE, "rgba(0,0,0,0)");
  // machine body
  rect(ox + 6, oy + 6, 18, 18, "#2A2A2A");
  rect(ox + 7, oy + 7, 16, 16, "#333333");
  // top
  rect(ox + 8, oy + 4, 14, 4, "#2A2A2A");
  // coffee pot (orange)
  rect(ox + 8, oy + 16, 12, 10, "#DD6600");
  rect(ox + 9, oy + 17, 10, 8, "#CC5500");
  // pot handle
  px(ox + 20, oy + 18, 3, 6, "#2A2A2A");
  // coffee inside pot
  rect(ox + 9, oy + 20, 10, 4, "#3A1A00");
  // light
  px(ox + 10, oy + 10, 2, 2, "#44CC44");
  // steam
  px(ox + 12, oy + 2, 1, 3, "#CCCCCC");
  px(ox + 15, oy + 1, 1, 4, "#CCCCCC");
}

function drawWallTop(col: number, row: number) {
  const [ox, oy] = tileOrigin(col, row);
  rect(ox, oy, TILE, TILE, "#E8DCC8");
  // darker bottom edge for depth
  px(ox, oy + 28, TILE, 4, "#C8B8A0");
  // shadow gradient
  px(ox, oy + 26, TILE, 2, "#D8C8B0");
  // top highlight
  px(ox, oy, TILE, 2, "#F0E8DA");
}

function drawWallLeft(col: number, row: number) {
  const [ox, oy] = tileOrigin(col, row);
  rect(ox, oy, TILE, TILE, "#E8DCC8");
  // left edge shadow
  px(ox, oy, 4, TILE, "#C8B8A0");
  px(ox + 4, oy, 2, TILE, "#D8C8B0");
  // mortar lines
  for (let y = 8; y < TILE; y += 8) {
    px(ox + 6, oy + y, TILE - 6, 1, "#D4C8B4");
  }
}

function drawWallRight(col: number, row: number) {
  const [ox, oy] = tileOrigin(col, row);
  rect(ox, oy, TILE, TILE, "#E8DCC8");
  // right edge shadow
  px(ox + 26, oy, 6, TILE, "#C8B8A0");
  px(ox + 24, oy, 2, TILE, "#D8C8B0");
  // mortar lines
  for (let y = 8; y < TILE; y += 8) {
    px(ox, oy + y, 24, 1, "#D4C8B4");
  }
}

function drawEmpty(_col: number, _row: number) {
  // fully transparent — nothing to draw
}

// ─── draw all tiles ─────────────────────────────────────────────────

// Clear canvas to transparent
ctx.clearRect(0, 0, WIDTH, HEIGHT);

type TileDef = {
  name: string;
  col: number;
  row: number;
  draw: (col: number, row: number) => void;
};

const tiles: TileDef[] = [
  // Row 0 — base
  { name: "carpet", col: 0, row: 0, draw: drawCarpet },
  { name: "wall", col: 1, row: 0, draw: drawWall },
  { name: "glass_wall", col: 2, row: 0, draw: drawGlassWall },
  { name: "door", col: 3, row: 0, draw: drawDoor },
  { name: "kitchen_tile", col: 4, row: 0, draw: drawKitchenTile },
  { name: "annex_carpet", col: 5, row: 0, draw: drawAnnexCarpet },
  // Row 1 — furniture
  { name: "desk_top_left", col: 0, row: 1, draw: drawDeskTopLeft },
  { name: "desk_top_right", col: 1, row: 1, draw: drawDeskTopRight },
  { name: "desk_bottom_left", col: 2, row: 1, draw: drawDeskBottomLeft },
  { name: "desk_bottom_right", col: 3, row: 1, draw: drawDeskBottomRight },
  { name: "office_chair", col: 4, row: 1, draw: drawOfficeChair },
  { name: "bookshelf", col: 5, row: 1, draw: drawBookshelf },
  // Row 2 — more furniture
  { name: "filing_cabinet", col: 0, row: 2, draw: drawFilingCabinet },
  { name: "plant", col: 1, row: 2, draw: drawPlant },
  { name: "reception_desk_left", col: 2, row: 2, draw: drawReceptionDeskLeft },
  {
    name: "reception_desk_right",
    col: 3,
    row: 2,
    draw: drawReceptionDeskRight,
  },
  { name: "copier", col: 4, row: 2, draw: drawCopier },
  { name: "vending_machine", col: 5, row: 2, draw: drawVendingMachine },
  // Row 3 — props
  { name: "water_cooler", col: 0, row: 3, draw: drawWaterCooler },
  { name: "coffee_maker", col: 1, row: 3, draw: drawCoffeeMaker },
  { name: "wall_top", col: 2, row: 3, draw: drawWallTop },
  { name: "wall_left", col: 3, row: 3, draw: drawWallLeft },
  { name: "wall_right", col: 4, row: 3, draw: drawWallRight },
  { name: "empty", col: 5, row: 3, draw: drawEmpty },
];

for (const tile of tiles) {
  tile.draw(tile.col, tile.row);
}

// ─── output ─────────────────────────────────────────────────────────

const outDir = join(__dirname, "..", "public", "assets", "tiles");
mkdirSync(outDir, { recursive: true });

const pngPath = join(outDir, "office-tileset.png");
const jsonPath = join(outDir, "office-tileset.json");

const rawPng = canvas.toBuffer("image/png");
await sharp(rawPng).png({ compressionLevel: 9 }).toFile(pngPath);

// Build metadata: tile name → { col, row, gid } (GID is 1-based for Tiled)
const metadata: Record<
  string,
  { col: number; row: number; gid: number }
> = {};
for (const tile of tiles) {
  const gid = tile.row * COLS + tile.col + 1; // Tiled GIDs are 1-based
  metadata[tile.name] = { col: tile.col, row: tile.row, gid };
}

const jsonData = {
  tileSize: TILE,
  columns: COLS,
  rows: ROWS,
  imageWidth: WIDTH,
  imageHeight: HEIGHT,
  tiles: metadata,
};

writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));

console.log(`✓ Tileset PNG  → ${pngPath} (${WIDTH}×${HEIGHT})`);
console.log(`✓ Tileset JSON → ${jsonPath} (${tiles.length} tiles)`);
console.log(
  "  Tiles:",
  tiles.map((t) => t.name).join(", "),
);

/**
 * generate-tilemap.ts — Generates a Tiled-compatible JSON tilemap for the office.
 * Reads tileset metadata to get correct GIDs.
 * Output: public/assets/tiles/office-map.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const assetsDir = join(__dirname, "..", "public", "assets", "tiles");
const tilesetMeta = JSON.parse(
  readFileSync(join(assetsDir, "office-tileset.json"), "utf-8"),
);

// GID lookup
const G: Record<string, number> = {};
for (const [name, info] of Object.entries(
  tilesetMeta.tiles as Record<
    string,
    { col: number; row: number; gid: number }
  >,
)) {
  G[name] = info.gid;
}

const TILE = 32;
const MAP_W = 30;
const MAP_H = 24;
// GID 0 means "no tile" in Tiled format

// Helper: create a 2D grid filled with a value
function grid(fill = 0): number[][] {
  return Array.from({ length: MAP_H }, () => Array(MAP_W).fill(fill));
}

// Flatten 2D grid to 1D array (row-major) for Tiled
function flatten(g: number[][]): number[] {
  return g.flat();
}

// Helper: fill rectangular region in grid
function fillRect(
  g: number[][],
  x: number,
  y: number,
  w: number,
  h: number,
  val: number,
) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const gy = y + dy;
      const gx = x + dx;
      if (gy >= 0 && gy < MAP_H && gx >= 0 && gx < MAP_W) {
        g[gy][gx] = val;
      }
    }
  }
}

// Set single tile
function set(g: number[][], x: number, y: number, val: number) {
  if (y >= 0 && y < MAP_H && x >= 0 && x < MAP_W) {
    g[y][x] = val;
  }
}

// ─── Floor layer ────────────────────────────────────────────────────

const floor = grid();

// Michael's office: top-left, 6×5 (cols 1-6, rows 1-5)
fillRect(floor, 1, 1, 6, 5, G.carpet);

// Reception: top-center (cols 8-13, rows 1-5)
fillRect(floor, 8, 1, 6, 5, G.carpet);

// Hallway connecting rooms (cols 1-24, row 6-7)
fillRect(floor, 1, 6, 24, 2, G.carpet);

// Bullpen: center (cols 3-12, rows 8-15)
fillRect(floor, 3, 8, 10, 8, G.carpet);

// Hallway from bullpen to break room (cols 13-14, rows 8-15)
fillRect(floor, 13, 8, 2, 8, G.carpet);

// Additional hallway (cols 1-2, rows 8-15)
fillRect(floor, 1, 8, 2, 8, G.carpet);

// Break room: right side (cols 15-19, rows 8-13)
fillRect(floor, 15, 8, 5, 6, G.kitchen_tile);

// Annex carpet below bullpen (cols 3-12, rows 16-20)
fillRect(floor, 3, 16, 10, 5, G.annex_carpet);

// ─── Walls layer ────────────────────────────────────────────────────

const walls = grid();

// Michael's office walls
fillRect(walls, 0, 0, 8, 1, G.wall); // top wall
fillRect(walls, 0, 0, 1, 7, G.wall); // left wall
fillRect(walls, 0, 6, 1, 1, G.wall); // left wall join
set(walls, 7, 1, G.wall); // right wall start
set(walls, 7, 2, G.glass_wall); // glass
set(walls, 7, 3, G.glass_wall);
set(walls, 7, 4, G.glass_wall);
set(walls, 7, 5, G.wall);
set(walls, 7, 0, G.wall);
// Door into Michael's office
set(walls, 4, 6, G.door); // door from hallway

// Reception walls
fillRect(walls, 8, 0, 6, 1, G.wall); // top
set(walls, 14, 0, G.wall);
set(walls, 14, 1, G.wall);
set(walls, 14, 2, G.glass_wall);
set(walls, 14, 3, G.glass_wall);
set(walls, 14, 4, G.wall);
set(walls, 14, 5, G.wall);

// Outer walls top
fillRect(walls, 15, 0, 10, 1, G.wall);

// Right outer wall
fillRect(walls, 25, 0, 1, MAP_H, G.wall);

// Break room walls
fillRect(walls, 15, 7, 5, 1, G.wall); // top wall of break room
set(walls, 14, 7, G.door); // door to break room
set(walls, 20, 7, G.wall);
fillRect(walls, 20, 8, 1, 6, G.wall); // right wall
set(walls, 20, 14, G.wall);
fillRect(walls, 15, 14, 6, 1, G.wall); // bottom wall

// Bottom wall of hallway / bullpen area
fillRect(walls, 0, 8, 1, 13, G.wall); // left outer wall continued
fillRect(walls, 0, 21, 14, 1, G.wall); // bottom outer wall

// South wall
fillRect(walls, 14, 16, 1, 6, G.wall);

// Additional outer walls
fillRect(walls, 21, 0, 4, 1, G.wall);
fillRect(walls, 21, 1, 1, MAP_H - 1, G.wall);

// ─── Furniture layer ────────────────────────────────────────────────

const furniture = grid();

// Michael's office furniture
set(furniture, 2, 1, G.desk_top_left);
set(furniture, 3, 1, G.desk_top_right);
set(furniture, 2, 2, G.desk_bottom_left);
set(furniture, 3, 2, G.desk_bottom_right);
set(furniture, 2, 3, G.office_chair); // Michael's chair
set(furniture, 5, 1, G.bookshelf);
set(furniture, 6, 1, G.plant);

// Reception furniture
set(furniture, 10, 3, G.reception_desk_left);
set(furniture, 11, 3, G.reception_desk_right);
set(furniture, 10, 4, G.office_chair); // Pam's chair
set(furniture, 13, 1, G.plant);

// Bullpen: 4 desk clusters
// Cluster 1 (Dwight): cols 4-5, rows 9-10
set(furniture, 4, 9, G.desk_top_left);
set(furniture, 5, 9, G.desk_top_right);
set(furniture, 4, 10, G.desk_bottom_left);
set(furniture, 5, 10, G.desk_bottom_right);
set(furniture, 4, 11, G.office_chair);

// Cluster 2 (Jim): cols 7-8, rows 9-10
set(furniture, 7, 9, G.desk_top_left);
set(furniture, 8, 9, G.desk_top_right);
set(furniture, 7, 10, G.desk_bottom_left);
set(furniture, 8, 10, G.desk_bottom_right);
set(furniture, 7, 11, G.office_chair);

// Cluster 3: cols 4-5, rows 13-14
set(furniture, 4, 13, G.desk_top_left);
set(furniture, 5, 13, G.desk_top_right);
set(furniture, 4, 14, G.desk_bottom_left);
set(furniture, 5, 14, G.desk_bottom_right);
set(furniture, 4, 12, G.office_chair);

// Cluster 4: cols 7-8, rows 13-14
set(furniture, 7, 13, G.desk_top_left);
set(furniture, 8, 13, G.desk_top_right);
set(furniture, 7, 14, G.desk_bottom_left);
set(furniture, 8, 14, G.desk_bottom_right);
set(furniture, 7, 12, G.office_chair);

// Bullpen extras
set(furniture, 11, 9, G.filing_cabinet);
set(furniture, 11, 13, G.filing_cabinet);
set(furniture, 12, 11, G.plant);

// Break room furniture
set(furniture, 16, 8, G.vending_machine);
set(furniture, 18, 8, G.coffee_maker);
set(furniture, 16, 10, G.water_cooler);
set(furniture, 19, 10, G.copier);

// ─── Furniture Top layer (for tall items that overlap above) ────────

const furnitureTop = grid();

// Bookshelf and vending machine tops extend visually (mark the tile above them)
// This layer handles tall furniture for depth sorting
set(furnitureTop, 5, 0, G.wall_top); // above bookshelf in Michael's office (cosmetic)
// We use empty for now; this layer is available for future depth-sorting needs

// ─── Spawn points ───────────────────────────────────────────────────

const spawns = [
  {
    name: "michael",
    x: 2 * TILE + TILE / 2,
    y: 3 * TILE + TILE / 2,
    properties: [{ name: "role", type: "string", value: "main" }],
  },
  {
    name: "dwight",
    x: 4 * TILE + TILE / 2,
    y: 11 * TILE + TILE / 2,
    properties: [{ name: "role", type: "string", value: "sub" }],
  },
  {
    name: "jim",
    x: 7 * TILE + TILE / 2,
    y: 11 * TILE + TILE / 2,
    properties: [{ name: "role", type: "string", value: "sub" }],
  },
  {
    name: "pam",
    x: 10 * TILE + TILE / 2,
    y: 4 * TILE + TILE / 2,
    properties: [{ name: "role", type: "string", value: "sub" }],
  },
];

// ─── Assemble Tiled JSON ────────────────────────────────────────────

// Build collision property for wall tiles
const wallGids = [
  G.wall,
  G.glass_wall,
  G.door,
  G.wall_top,
  G.wall_left,
  G.wall_right,
];

const tiledMap = {
  compressionlevel: -1,
  height: MAP_H,
  infinite: false,
  layers: [
    {
      data: flatten(floor),
      height: MAP_H,
      id: 1,
      name: "Floor",
      opacity: 1,
      type: "tilelayer",
      visible: true,
      width: MAP_W,
      x: 0,
      y: 0,
    },
    {
      data: flatten(walls),
      height: MAP_H,
      id: 2,
      name: "Walls",
      opacity: 1,
      type: "tilelayer",
      visible: true,
      width: MAP_W,
      x: 0,
      y: 0,
      properties: [
        {
          name: "collision",
          type: "bool",
          value: true,
        },
      ],
    },
    {
      data: flatten(furniture),
      height: MAP_H,
      id: 3,
      name: "Furniture",
      opacity: 1,
      type: "tilelayer",
      visible: true,
      width: MAP_W,
      x: 0,
      y: 0,
    },
    {
      data: flatten(furnitureTop),
      height: MAP_H,
      id: 4,
      name: "FurnitureTop",
      opacity: 1,
      type: "tilelayer",
      visible: true,
      width: MAP_W,
      x: 0,
      y: 0,
    },
    {
      draworder: "topdown",
      id: 5,
      name: "Spawns",
      objects: spawns.map((s, i) => ({
        height: 0,
        id: i + 1,
        name: s.name,
        point: true,
        properties: s.properties,
        rotation: 0,
        type: "",
        visible: true,
        width: 0,
        x: s.x,
        y: s.y,
      })),
      opacity: 1,
      type: "objectgroup",
      visible: true,
      x: 0,
      y: 0,
    },
  ],
  nextlayerid: 6,
  nextobjectid: 5,
  orientation: "orthogonal",
  renderorder: "right-down",
  tiledversion: "1.10.2",
  tileheight: TILE,
  tilesets: [
    {
      columns: tilesetMeta.columns,
      firstgid: 1,
      image: "office-tileset.png",
      imageheight: tilesetMeta.imageHeight,
      imagewidth: tilesetMeta.imageWidth,
      margin: 0,
      name: "office-tileset",
      spacing: 0,
      tilecount: tilesetMeta.columns * tilesetMeta.rows,
      tileheight: TILE,
      tilewidth: TILE,
      tiles: wallGids.map((gid) => ({
        id: gid - 1, // Tiled tile IDs are 0-based within tileset
        properties: [
          {
            name: "collision",
            type: "bool",
            value: true,
          },
        ],
      })),
    },
  ],
  tilewidth: TILE,
  type: "map",
  version: "1.10",
  width: MAP_W,
};

const outPath = join(assetsDir, "office-map.json");
writeFileSync(outPath, JSON.stringify(tiledMap, null, 2));

console.log(`✓ Tilemap JSON → ${outPath}`);
console.log(`  Map size: ${MAP_W}×${MAP_H} tiles (${MAP_W * TILE}×${MAP_H * TILE} px)`);
console.log(`  Layers: Floor, Walls, Furniture, FurnitureTop, Spawns`);
console.log(
  `  Spawns: ${spawns.map((s) => `${s.name} (${s.x},${s.y})`).join(", ")}`,
);

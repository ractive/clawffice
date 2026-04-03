/**
 * generate-tilemap.ts — Generates a Tiled-compatible JSON tilemap for the Dunder Mifflin office.
 * Reads the tileset JSON produced by build-tileset.ts to get GIDs.
 *
 * Map: 30×24 tiles (960×768px at 32px/tile)
 * Layers: Floor, Walls, Furniture, FurnitureTop (tile layers) + Spawns (object layer)
 *
 * Output: public/assets/tiles/office-map.json
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, "..", "public", "assets", "tiles");

// ─── Load tileset metadata ────────────────────────────────────────────────────

const tilesetMeta = JSON.parse(
	readFileSync(join(assetsDir, "office-tileset.json"), "utf-8"),
) as {
	tileSize: number;
	columns: number;
	rows: number;
	imageWidth: number;
	imageHeight: number;
	tiles: Record<string, { gid: number; col: number; row: number }>;
	collision: string[];
};

// GID lookup — G["carpet"] → 1, etc.
const G: Record<string, number> = {};
for (const [name, info] of Object.entries(tilesetMeta.tiles)) {
	G[name] = info.gid;
}

// Verify critical tiles exist
const required = [
	"carpet",
	"kitchen_tile",
	"annex_carpet",
	"wall",
	"wall_top",
	"wall_base",
	"wall_left",
	"wall_right",
	"wall_corner_tl",
	"wall_corner_tr",
	"glass_wall",
	"door",
	"desk_tl",
	"desk_tr",
	"desk_ml",
	"desk_mr",
	"desk_bl",
	"desk_br",
	"desk2_tl",
	"desk2_tr",
	"desk2_ml",
	"desk2_mr",
	"desk2_bl",
	"desk2_br",
	"office_chair",
	"bookshelf_tl",
	"bookshelf_tr",
	"bookshelf_bl",
	"bookshelf_br",
	"plant_t",
	"plant_b",
	"reception_tl",
	"reception_tc",
	"reception_tr",
	"reception_ml",
	"reception_mc",
	"reception_mr",
	"reception_bl",
	"reception_bc",
	"reception_br",
	"filing_cabinet_t",
	"filing_cabinet_b",
	"vending_tl",
	"vending_tr",
	"vending_ml",
	"vending_mr",
	"vending_bl",
	"vending_br",
	"water_cooler",
	"coffee_maker",
	"copier_t",
	"copier_b",
];
for (const key of required) {
	if (!G[key]) {
		console.error(`MISSING tile GID for "${key}" — run build-tileset.ts first`);
		process.exit(1);
	}
}

// ─── Map constants ────────────────────────────────────────────────────────────

const TILE = 32;
const MAP_W = 30;
const MAP_H = 24;
// GID 0 = empty tile in Tiled format

// ─── Grid helpers ─────────────────────────────────────────────────────────────

function grid(fill = 0): number[][] {
	return Array.from({ length: MAP_H }, () => Array<number>(MAP_W).fill(fill));
}

function flatten(g: number[][]): number[] {
	return g.flat();
}

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

function set(g: number[][], x: number, y: number, val: number) {
	if (y >= 0 && y < MAP_H && x >= 0 && x < MAP_W) {
		g[y][x] = val;
	}
}

// ─── Floor layer ──────────────────────────────────────────────────────────────
//
// Office layout (tile coords):
//
//   Cols:  0    5    10   15   20   25   29
//          |    |    |    |    |    |    |
//   Row 0: ████ outer top wall ██████████████
//   Row 1: █[  Michael's office  ]█[Reception]█
//   Row 5: ████████████████████████████████████
//   Row 6: ████ hallway connecting rooms ██████
//   Row 7: ████████████████████████████████████
//   Row 8: █[Bullpen 10×8      ]█[Break  ]█
//   Row15: █████████████████████████████████████
//   Row16: █[Annex 10×5        ]█
//   Row20: ████████████████████████████████████
//

const floor = grid();

// Michael's office: cols 1-6, rows 1-5
fillRect(floor, 1, 1, 6, 5, G.carpet);

// Reception area: cols 8-13, rows 1-5
fillRect(floor, 8, 1, 6, 5, G.carpet);

// Hallway: cols 1-24, rows 6-7
fillRect(floor, 1, 6, 24, 2, G.carpet);

// Bullpen: cols 3-12, rows 8-15
fillRect(floor, 3, 8, 10, 8, G.carpet);

// Narrow corridors beside bullpen
fillRect(floor, 1, 8, 2, 8, G.carpet);
fillRect(floor, 13, 8, 2, 8, G.carpet);

// Break room: cols 15-19, rows 8-13 — kitchen tile floor
fillRect(floor, 15, 8, 5, 6, G.kitchen_tile);

// Annex: cols 3-12, rows 16-20
fillRect(floor, 3, 16, 10, 5, G.annex_carpet);

// ─── Walls layer ──────────────────────────────────────────────────────────────

const walls = grid();

// ── Outer perimeter ──
// Top outer wall (row 0)
fillRect(walls, 0, 0, MAP_W, 1, G.wall_top);

// Left outer wall (col 0, rows 1-21)
fillRect(walls, 0, 1, 1, 21, G.wall);

// Right outer wall (col 25, rows 0-21)
fillRect(walls, 25, 0, 1, 22, G.wall);

// Bottom outer wall (row 21, cols 0-14)
fillRect(walls, 0, 21, 15, 1, G.wall);
// Annex right outer wall (col 21, rows 16–bottom)
fillRect(walls, 21, 16, 1, MAP_H - 16, G.wall);

// ── Michael's office ──
// Right wall of Michael's office: col 7, rows 0-5
// Top is wall, rows 2-4 are glass, row 5 wall
set(walls, 7, 0, G.wall_top);
set(walls, 7, 1, G.wall);
set(walls, 7, 2, G.glass_wall);
set(walls, 7, 3, G.glass_wall);
set(walls, 7, 4, G.glass_wall);
set(walls, 7, 5, G.wall);
// Door from hallway into Michael's office
set(walls, 4, 6, G.door);

// ── Reception / lobby divider ──
// Right divider at col 14, rows 0-5
set(walls, 14, 0, G.wall_top);
set(walls, 14, 1, G.wall);
set(walls, 14, 2, G.glass_wall);
set(walls, 14, 3, G.glass_wall);
set(walls, 14, 4, G.wall);
set(walls, 14, 5, G.wall);

// Wall between hallway and Michael's office top (row 0, cols 0-7)
fillRect(walls, 0, 0, 8, 1, G.wall_top);
// Wall top row for reception area (row 0, cols 8-14)
fillRect(walls, 8, 0, 7, 1, G.wall_top);
// Top wall continues to right outer wall
fillRect(walls, 15, 0, 11, 1, G.wall_top);

// ── Break room ──
// Top wall of break room (row 7, cols 15-20)
fillRect(walls, 15, 7, 5, 1, G.wall);
// Door into break room
set(walls, 14, 7, G.door);
set(walls, 20, 7, G.wall_corner_tr);
// Right wall of break room (col 20, rows 8-13)
fillRect(walls, 20, 8, 1, 6, G.wall_right);
// Bottom wall of break room (row 14, cols 15-20)
fillRect(walls, 15, 14, 6, 1, G.wall);
// Left wall of break room (col 14, rows 8-14)
fillRect(walls, 14, 8, 1, 7, G.wall_left);

// ── South wall of bullpen / annex ──
// Row 21: already handled by outer perimeter above

// ── Annex right wall (col 14, rows 16-21) ──
fillRect(walls, 14, 16, 1, 6, G.wall);

// ── Corridor wall between bullpen and annex (row 16, cols 1-2) ──
// Left side continuation
fillRect(walls, 0, 8, 1, 14, G.wall); // left outer wall continued (rows 8-21)

// ─── Furniture layer ──────────────────────────────────────────────────────────

const furniture = grid();

// ── Michael's office ──
// Desk (2×3 block): top-left at col 2, row 1
set(furniture, 2, 1, G.desk_tl);
set(furniture, 3, 1, G.desk_tr);
set(furniture, 2, 2, G.desk_ml);
set(furniture, 3, 2, G.desk_mr);
set(furniture, 2, 3, G.desk_bl);
set(furniture, 3, 3, G.desk_br);
// Michael's chair (below desk)
set(furniture, 3, 4, G.office_chair);
// Bookshelf in corner (2×2 at col 5-6, row 1-2)
set(furniture, 5, 1, G.bookshelf_tl);
set(furniture, 6, 1, G.bookshelf_tr);
set(furniture, 5, 2, G.bookshelf_bl);
set(furniture, 6, 2, G.bookshelf_br);
// Plant
set(furniture, 6, 3, G.plant_t);
set(furniture, 6, 4, G.plant_b);

// ── Reception ──
// Reception desk (3×3 counter): cols 9-11, rows 2-4
set(furniture, 9, 2, G.reception_tl);
set(furniture, 10, 2, G.reception_tc);
set(furniture, 11, 2, G.reception_tr);
set(furniture, 9, 3, G.reception_ml);
set(furniture, 10, 3, G.reception_mc);
set(furniture, 11, 3, G.reception_mr);
set(furniture, 9, 4, G.reception_bl);
set(furniture, 10, 4, G.reception_bc);
set(furniture, 11, 4, G.reception_br);
// Pam's chair (in front of desk)
set(furniture, 10, 5, G.office_chair);
// Plant by entrance
set(furniture, 13, 2, G.plant_t);
set(furniture, 13, 3, G.plant_b);

// ── Bullpen — 4 desk clusters ──
// Each cluster: 2×3 desk + chair above

// Cluster A (Dwight): cols 4-5, rows 9-11, chair at row 8
set(furniture, 4, 9, G.desk_tl);
set(furniture, 5, 9, G.desk_tr);
set(furniture, 4, 10, G.desk_ml);
set(furniture, 5, 10, G.desk_mr);
set(furniture, 4, 11, G.desk_bl);
set(furniture, 5, 11, G.desk_br);
set(furniture, 4, 8, G.office_chair);

// Cluster B (Jim): cols 7-8, rows 9-11, chair at row 8
set(furniture, 7, 9, G.desk2_tl);
set(furniture, 8, 9, G.desk2_tr);
set(furniture, 7, 10, G.desk2_ml);
set(furniture, 8, 10, G.desk2_mr);
set(furniture, 7, 11, G.desk2_bl);
set(furniture, 8, 11, G.desk2_br);
set(furniture, 7, 8, G.office_chair);

// Cluster C: cols 4-5, rows 13-15, chair at row 12
set(furniture, 4, 13, G.desk_tl);
set(furniture, 5, 13, G.desk_tr);
set(furniture, 4, 14, G.desk_ml);
set(furniture, 5, 14, G.desk_mr);
set(furniture, 4, 15, G.desk_bl);
set(furniture, 5, 15, G.desk_br);
set(furniture, 4, 12, G.office_chair);

// Cluster D: cols 7-8, rows 13-15, chair at row 12
set(furniture, 7, 13, G.desk2_tl);
set(furniture, 8, 13, G.desk2_tr);
set(furniture, 7, 14, G.desk2_ml);
set(furniture, 8, 14, G.desk2_mr);
set(furniture, 7, 15, G.desk2_bl);
set(furniture, 8, 15, G.desk2_br);
set(furniture, 7, 12, G.office_chair);

// Filing cabinets along bullpen east wall
set(furniture, 11, 9, G.filing_cabinet_t);
set(furniture, 11, 10, G.filing_cabinet_b);
set(furniture, 11, 13, G.filing_cabinet_t);
set(furniture, 11, 14, G.filing_cabinet_b);

// ── Break room ──
// Vending machines (2×3 block at cols 15-16, rows 8-10)
set(furniture, 15, 8, G.vending_tl);
set(furniture, 16, 8, G.vending_tr);
set(furniture, 15, 9, G.vending_ml);
set(furniture, 16, 9, G.vending_mr);
set(furniture, 15, 10, G.vending_bl);
set(furniture, 16, 10, G.vending_br);
// Water cooler
set(furniture, 18, 8, G.water_cooler);
// Coffee maker
set(furniture, 19, 8, G.coffee_maker);
// Copier (2 rows tall)
set(furniture, 17, 11, G.copier_t);
set(furniture, 17, 12, G.copier_b);

// ─── FurnitureTop layer (depth > characters — tall items) ─────────────────────

const furnitureTop = grid();

// Plant tops in Michael's office and reception render above characters
// when they walk behind the plant's pot row
set(furnitureTop, 6, 3, G.plant_t); // already in furniture but duplicate for depth
set(furnitureTop, 13, 2, G.plant_t);

// ─── Spawn points ─────────────────────────────────────────────────────────────

const spawns = [
	{
		name: "michael",
		x: 3 * TILE + TILE / 2, // in front of Michael's desk
		y: 4 * TILE + TILE / 2,
		properties: [{ name: "role", type: "string", value: "main" }],
	},
	{
		name: "dwight",
		x: 4 * TILE + TILE / 2, // at Dwight's cluster
		y: 11 * TILE + TILE / 2,
		properties: [{ name: "role", type: "string", value: "sub" }],
	},
	{
		name: "jim",
		x: 7 * TILE + TILE / 2, // at Jim's cluster
		y: 11 * TILE + TILE / 2,
		properties: [{ name: "role", type: "string", value: "sub" }],
	},
	{
		name: "pam",
		x: 10 * TILE + TILE / 2, // at reception desk
		y: 5 * TILE + TILE / 2,
		properties: [{ name: "role", type: "string", value: "sub" }],
	},
];

// ─── Tileset collision tile properties ────────────────────────────────────────

// Build the Tiled tile property list for collision tiles
const collisionTileProperties = tilesetMeta.collision.map((name) => ({
	id: G[name] - 1, // Tiled tile IDs are 0-based within tileset
	properties: [{ name: "collision", type: "bool", value: true }],
}));

// ─── Assemble Tiled JSON ───────────────────────────────────────────────────────

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
			properties: [{ name: "collision", type: "bool", value: true }],
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
	nextobjectid: spawns.length + 1,
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
			tiles: collisionTileProperties,
		},
	],
	tilewidth: TILE,
	type: "map",
	version: "1.10",
	width: MAP_W,
};

// ─── Write output ─────────────────────────────────────────────────────────────

const outPath = join(assetsDir, "office-map.json");
writeFileSync(outPath, JSON.stringify(tiledMap, null, 2));

// Count non-zero tiles per layer for the summary
function countNonZero(g: number[][]): number {
	return g.flat().filter((v) => v > 0).length;
}

console.log(`Tilemap JSON → ${outPath}`);
console.log(
	`  Map size:  ${MAP_W}×${MAP_H} tiles (${MAP_W * TILE}×${MAP_H * TILE}px)`,
);
console.log(
	`  Layers:    Floor (${countNonZero(floor)} tiles), Walls (${countNonZero(walls)}), Furniture (${countNonZero(furniture)}), FurnitureTop (${countNonZero(furnitureTop)})`,
);
console.log(
	`  Spawns:    ${spawns.map((s) => `${s.name} @ (${s.x},${s.y})`).join(", ")}`,
);
console.log(
	`  Collision: ${tilesetMeta.collision.length} tile types registered`,
);

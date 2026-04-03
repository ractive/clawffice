/**
 * build-tileset.ts — Extracts tiles from LimeZu Modern Office + Modern Interiors
 * and packs them into a single tileset PNG + JSON for use with Phaser 3 / Tiled.
 *
 * Sources:
 *   LimeZu/Modern_Office/Modern_Office_32x32.png          (512×1696, 16×53 tiles)
 *   LimeZu/Modern_Interiors/…/Room_Builder_Floors_32x32.png (480×1280, 15×40 tiles)
 *   LimeZu/Modern_Interiors/…/Room_Builder_Walls_32x32.png  (1024×1280, 32×40 tiles)
 *   LimeZu/Modern_Interiors/…/Theme_Sorter_32x32/12_Kitchen_32x32.png (512×1568, 16×49 tiles)
 *
 * Output:
 *   public/assets/tiles/office-tileset.png
 *   public/assets/tiles/office-tileset.json
 */

import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ─── Source paths ─────────────────────────────────────────────────────────────

const SOURCES = {
	office: join(ROOT, "LimeZu/Modern_Office/Modern_Office_32x32.png"),
	floors: join(
		ROOT,
		"LimeZu/Modern_Interiors/1_Interiors/32x32/Room_Bulder_subfiles_32x32/Room_Builder_Floors_32x32.png",
	),
	walls: join(
		ROOT,
		"LimeZu/Modern_Interiors/1_Interiors/32x32/Room_Bulder_subfiles_32x32/Room_Builder_Walls_32x32.png",
	),
	kitchen: join(
		ROOT,
		"LimeZu/Modern_Interiors/1_Interiors/32x32/Theme_Sorter_32x32/12_Kitchen_32x32.png",
	),
} as const;

type SourceKey = keyof typeof SOURCES;

// ─── Tile definitions ─────────────────────────────────────────────────────────
//
// Each entry maps a logical name → (source sheet, col, row).
// All source sheets use 32×32 tiles on a grid.
//
// Verified coordinates (inspected visually from each sheet):
//
// FLOORS sheet (480×1280, 15 cols × 40 rows):
//   Column groups are separated by 1-px black bars at cols 3, 7, 11.
//   col 0 = blue-gray grid tiles, col 4 = cream/beige tiles, col 12 = muted green-gray
//   Row 0 = connector/transition tile (skip), rows 2+ = plain fill tiles.
//
// WALLS sheet (1024×1280, 32 cols × 40 rows):
//   Room Builder wall system: groups of 3 cols per color (left-edge, fill, right-edge).
//   First group (cols 0-2): teal diamond border / white fill.
//   Second group (cols 4-6): clean white/cream walls — best for office.
//   row 0 = decorative top band, row 1 = upper fill, row 2 = lower fill, row 3 = baseboard.
//
// OFFICE sheet (512×1696, 16 cols × 53 rows):
//   Rows 0-5:   Desk surfaces (tan, 4 cols wide per desk × 3 rows tall)
//   Rows 8-9:   Office chairs (gray row 8, orange row 9)
//   Row 8 c6:   Tall plant (fern in pot)
//   Rows 10-11: Art frames (c0-4), tall plants (c5), bookshelf (c6-7)
//   Rows 22-24: Vending machines (2 variants, each 2 cols × 3 rows)
//   Rows 27-29: Gray conference/reception table (3 cols wide × 3 rows tall)
//   Rows 30-31: Tan storage/reception desk (4 cols wide)
//   Row 18-20:  Copier/printer (c8, 1×2)
//
// KITCHEN sheet (512×1568, 16 cols × 49 rows):
//   Row 6 c8: Coffee maker (small dark appliance)
//   Row 6 c9: Water cooler/dispenser (blue jug)

type TileSource = {
	name: string;
	src: SourceKey;
	srcCol: number;
	srcRow: number;
	collision?: boolean;
};

const TILE_DEFS: TileSource[] = [
	// ── Base floors ──────────────────────────────────────────────────────────
	// Floors col 0 row 2: blue-gray grid — main office carpet
	{ name: "carpet", src: "floors", srcCol: 0, srcRow: 2 },
	// Floors col 4 row 2: cream/beige subtle tile — kitchen / hallway
	{ name: "kitchen_tile", src: "floors", srcCol: 4, srcRow: 2 },
	// Floors col 12 row 2: muted green-gray — annex / conference room
	{ name: "annex_carpet", src: "floors", srcCol: 12, srcRow: 2 },

	// ── Walls (Room Builder cream/white system) ───────────────────────────────
	// Walls col 5 row 0: top band / wainscoting strip
	{ name: "wall_top", src: "walls", srcCol: 5, srcRow: 0, collision: true },
	// Walls col 5 row 2: main wall fill (solid cream)
	{ name: "wall", src: "walls", srcCol: 5, srcRow: 2, collision: true },
	// Walls col 5 row 3: baseboard / lower wall transition
	{ name: "wall_base", src: "walls", srcCol: 5, srcRow: 3, collision: true },
	// Walls col 4 row 2: left Room Builder edge
	{ name: "wall_left", src: "walls", srcCol: 4, srcRow: 2, collision: true },
	// Walls col 6 row 2: right Room Builder edge
	{ name: "wall_right", src: "walls", srcCol: 6, srcRow: 2, collision: true },
	// Walls col 4 row 0: top-left corner
	{
		name: "wall_corner_tl",
		src: "walls",
		srcCol: 4,
		srcRow: 0,
		collision: true,
	},
	// Walls col 6 row 0: top-right corner
	{
		name: "wall_corner_tr",
		src: "walls",
		srcCol: 6,
		srcRow: 0,
		collision: true,
	},

	// ── Glass partition ───────────────────────────────────────────────────────
	// Office row 4 col 4: light lavender glass panel
	{ name: "glass_wall", src: "office", srcCol: 4, srcRow: 4, collision: true },
	// Office row 4 col 5: door/opening gap (transparent center)
	{ name: "door", src: "office", srcCol: 5, srcRow: 4 },

	// ── Desk — tan variant (rows 0-2, cols 0-1, 2×3 tiles) ───────────────────
	{ name: "desk_tl", src: "office", srcCol: 0, srcRow: 0 },
	{ name: "desk_tr", src: "office", srcCol: 1, srcRow: 0 },
	{ name: "desk_ml", src: "office", srcCol: 0, srcRow: 1 },
	{ name: "desk_mr", src: "office", srcCol: 1, srcRow: 1 }, // monitor side
	{ name: "desk_bl", src: "office", srcCol: 0, srcRow: 2 },
	{ name: "desk_br", src: "office", srcCol: 1, srcRow: 2 },

	// ── Desk — dark/gray-green variant (rows 0-2, cols 8-9) ──────────────────
	{ name: "desk2_tl", src: "office", srcCol: 8, srcRow: 0 },
	{ name: "desk2_tr", src: "office", srcCol: 9, srcRow: 0 },
	{ name: "desk2_ml", src: "office", srcCol: 8, srcRow: 1 },
	{ name: "desk2_mr", src: "office", srcCol: 9, srcRow: 1 },
	{ name: "desk2_bl", src: "office", srcCol: 8, srcRow: 2 },
	{ name: "desk2_br", src: "office", srcCol: 9, srcRow: 2 },

	// ── Office chairs ─────────────────────────────────────────────────────────
	// Row 8 col 0: gray chair (top-down, facing down)
	{ name: "office_chair", src: "office", srcCol: 0, srcRow: 8 },
	// Row 9 col 0: brown/orange upholstered chair
	{ name: "office_chair2", src: "office", srcCol: 0, srcRow: 9 },

	// ── Plant ─────────────────────────────────────────────────────────────────
	// Row 8 col 6: tall fern/plant (top half, in pot)
	{ name: "plant_t", src: "office", srcCol: 6, srcRow: 8 },
	// Row 9 col 6: plant bottom (pot base)
	{ name: "plant_b", src: "office", srcCol: 6, srcRow: 9 },

	// ── Bookshelf (rows 10-11, cols 6-7, 2×2 block) ──────────────────────────
	{ name: "bookshelf_tl", src: "office", srcCol: 6, srcRow: 10 },
	{ name: "bookshelf_tr", src: "office", srcCol: 7, srcRow: 10 },
	{ name: "bookshelf_bl", src: "office", srcCol: 6, srcRow: 11 },
	{ name: "bookshelf_br", src: "office", srcCol: 7, srcRow: 11 },

	// ── Filing cabinet (rows 22-23, col 0: single gray cabinet) ──────────────
	{ name: "filing_cabinet_t", src: "office", srcCol: 0, srcRow: 22 },
	{ name: "filing_cabinet_b", src: "office", srcCol: 0, srcRow: 23 },

	// ── Vending machine variant 1 (rows 22-24, cols 0-1) ─────────────────────
	// NOTE: filing cabinet (above) overlaps row 22 col 0; vending starts at col 2
	{ name: "vending_tl", src: "office", srcCol: 2, srcRow: 22 },
	{ name: "vending_tr", src: "office", srcCol: 3, srcRow: 22 },
	{ name: "vending_ml", src: "office", srcCol: 2, srcRow: 23 },
	{ name: "vending_mr", src: "office", srcCol: 3, srcRow: 23 },
	{ name: "vending_bl", src: "office", srcCol: 2, srcRow: 24 },
	{ name: "vending_br", src: "office", srcCol: 3, srcRow: 24 },

	// ── Water cooler (kitchen sheet row 6 col 9: blue-jug dispenser) ──────────
	{ name: "water_cooler", src: "kitchen", srcCol: 9, srcRow: 6 },

	// ── Coffee maker (kitchen sheet row 6 col 8: dark countertop appliance) ───
	{ name: "coffee_maker", src: "kitchen", srcCol: 8, srcRow: 6 },

	// ── Copier / printer (office rows 18-19, col 8: gray printer unit) ────────
	{ name: "copier_t", src: "office", srcCol: 8, srcRow: 18 },
	{ name: "copier_b", src: "office", srcCol: 8, srcRow: 19 },

	// ── Reception / front desk (rows 27-29, cols 0-2, gray counter table) ─────
	{ name: "reception_tl", src: "office", srcCol: 0, srcRow: 27 },
	{ name: "reception_tc", src: "office", srcCol: 1, srcRow: 27 },
	{ name: "reception_tr", src: "office", srcCol: 2, srcRow: 27 },
	{ name: "reception_ml", src: "office", srcCol: 0, srcRow: 28 },
	{ name: "reception_mc", src: "office", srcCol: 1, srcRow: 28 },
	{ name: "reception_mr", src: "office", srcCol: 2, srcRow: 28 },
	{ name: "reception_bl", src: "office", srcCol: 0, srcRow: 29 },
	{ name: "reception_bc", src: "office", srcCol: 1, srcRow: 29 },
	{ name: "reception_br", src: "office", srcCol: 2, srcRow: 29 },

	// ── Conference / storage table (rows 30-31, cols 0-3, tan surface) ────────
	{ name: "conf_table_tl", src: "office", srcCol: 0, srcRow: 30 },
	{ name: "conf_table_tc", src: "office", srcCol: 1, srcRow: 30 },
	{ name: "conf_table_tr", src: "office", srcCol: 2, srcRow: 30 },
	{ name: "conf_table_bl", src: "office", srcCol: 0, srcRow: 31 },
	{ name: "conf_table_bc", src: "office", srcCol: 1, srcRow: 31 },
	{ name: "conf_table_br", src: "office", srcCol: 2, srcRow: 31 },
];

// ─── Output grid layout ───────────────────────────────────────────────────────

const TILE = 32;
const OUT_COLS = 16;
const OUT_ROWS = Math.ceil(TILE_DEFS.length / OUT_COLS);
const OUT_W = OUT_COLS * TILE;
const OUT_H = OUT_ROWS * TILE;

// ─── Build tileset ────────────────────────────────────────────────────────────

console.log(
	`Building tileset: ${TILE_DEFS.length} tiles → ${OUT_COLS}×${OUT_ROWS} grid (${OUT_W}×${OUT_H}px)`,
);

// Load source sheets once
console.log("  Loading source sheets...");
const srcBuffers: Record<SourceKey, Buffer> = {
	office: await sharp(SOURCES.office).toBuffer(),
	floors: await sharp(SOURCES.floors).toBuffer(),
	walls: await sharp(SOURCES.walls).toBuffer(),
	kitchen: await sharp(SOURCES.kitchen).toBuffer(),
};
console.log("  Source sheets loaded.");

// Extract each tile and build compositing list
const composites: sharp.OverlayOptions[] = [];

for (let i = 0; i < TILE_DEFS.length; i++) {
	const def = TILE_DEFS[i];
	const destCol = i % OUT_COLS;
	const destRow = Math.floor(i / OUT_COLS);

	process.stdout.write(
		`  [${String(i + 1).padStart(2)}/${TILE_DEFS.length}] ${def.name.padEnd(22)} ← ${def.src}(${def.srcCol},${def.srcRow})\n`,
	);

	const tileBuffer = await sharp(srcBuffers[def.src])
		.extract({
			left: def.srcCol * TILE,
			top: def.srcRow * TILE,
			width: TILE,
			height: TILE,
		})
		.toBuffer();

	composites.push({
		input: tileBuffer,
		left: destCol * TILE,
		top: destRow * TILE,
	});
}

// ─── Write PNG ────────────────────────────────────────────────────────────────

const outDir = join(ROOT, "public", "assets", "tiles");
mkdirSync(outDir, { recursive: true });

const pngPath = join(outDir, "office-tileset.png");
const jsonPath = join(outDir, "office-tileset.json");

await sharp({
	create: {
		width: OUT_W,
		height: OUT_H,
		channels: 4,
		background: { r: 0, g: 0, b: 0, alpha: 0 },
	},
})
	.composite(composites)
	.png({ compressionLevel: 6 })
	.toFile(pngPath);

// ─── Write JSON ───────────────────────────────────────────────────────────────

type TileEntry = {
	gid: number;
	col: number;
	row: number;
	srcSheet: string;
	srcCol: number;
	srcRow: number;
};

const tilesJson: Record<string, TileEntry> = {};
const collisionTiles: string[] = [];

for (let i = 0; i < TILE_DEFS.length; i++) {
	const def = TILE_DEFS[i];
	const destCol = i % OUT_COLS;
	const destRow = Math.floor(i / OUT_COLS);
	const gid = i + 1; // Tiled GIDs are 1-based

	tilesJson[def.name] = {
		gid,
		col: destCol,
		row: destRow,
		srcSheet: def.src,
		srcCol: def.srcCol,
		srcRow: def.srcRow,
	};

	if (def.collision) {
		collisionTiles.push(def.name);
	}
}

writeFileSync(
	jsonPath,
	JSON.stringify(
		{
			tileSize: TILE,
			columns: OUT_COLS,
			rows: OUT_ROWS,
			imageWidth: OUT_W,
			imageHeight: OUT_H,
			tiles: tilesJson,
			collision: collisionTiles,
		},
		null,
		2,
	),
);

// ─── Summary ─────────────────────────────────────────────────────────────────

const kbSize = (statSync(pngPath).size / 1024).toFixed(1);
console.log(`\nTileset PNG  → ${pngPath}`);
console.log(`             ${OUT_W}×${OUT_H}px, ${kbSize} KB`);
console.log(`Tileset JSON → ${jsonPath}`);
console.log(`             ${TILE_DEFS.length} tiles across ${OUT_ROWS} rows`);
console.log(
	`Collision tiles (${collisionTiles.length}): ${collisionTiles.join(", ")}`,
);

/**
 * export-tiled-map.ts — Export DunderMifflin.tmx to game-ready JSON + copy tilesets.
 *
 * Steps:
 *   1. Run `tiled --export-map json` to convert TMX → Tiled JSON
 *   2. Fix tileset `image` paths to bare filenames (all PNGs land in public/assets/tiles/)
 *   3. Write corrected JSON back to public/assets/tiles/office-map.json
 *   4. Copy all tileset PNGs to public/assets/tiles/
 *
 * Usage: bun scripts/export-tiled-map.ts
 */

import { spawnSync } from "node:child_process";
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const TILED_BIN = "/opt/homebrew/bin/tiled";
const SRC_TMX = join(ROOT, "DunderMifflin/DunderMifflin.tmx");
const SRC_TILESETS_DIR = join(ROOT, "DunderMifflin/tilesets");
const OUT_DIR = join(ROOT, "public/assets/tiles");
const OUT_MAP = join(OUT_DIR, "office-map.json");

const TILESET_FILES = [
	"1_Generic_32x32.png",
	"2_LivingRoom_32x32.png",
	"3_Bathroom_32x32.png",
	"12_Kitchen_32x32.png",
	"18_Jail_32x32.png",
	"19_Hospital_32x32.png",
	"Modern_Office_Shadowless_32x32.png",
	"Room_Builder_32x32.png",
	"Room_Builder_Office_32x32.png",
];

// ─── Preflight checks ─────────────────────────────────────────────────────────

if (!existsSync(TILED_BIN)) {
	console.error(`Error: Tiled CLI not found at ${TILED_BIN}`);
	process.exit(1);
}

if (!existsSync(SRC_TMX)) {
	console.error(`Error: Source TMX not found at ${SRC_TMX}`);
	process.exit(1);
}

// ─── Step 1: Export TMX → JSON via Tiled CLI ──────────────────────────────────

mkdirSync(OUT_DIR, { recursive: true });

console.log("Exporting TMX...");
console.log(`  ${SRC_TMX}`);
console.log(`  → ${OUT_MAP}`);

const proc = spawnSync(TILED_BIN, ["--export-map", "json", SRC_TMX, OUT_MAP], {
	encoding: "utf8",
});

if (proc.status !== 0) {
	console.error(`Error: tiled exited with code ${proc.status}`);
	if (proc.stderr) console.error(proc.stderr);
	process.exit(1);
}

// ─── Step 2: Fix tileset image paths ──────────────────────────────────────────

console.log("\nFixing tileset image paths...");

const rawJson = readFileSync(OUT_MAP, "utf8");

// biome-ignore lint/suspicious/noExplicitAny: Tiled JSON has a loose shape
const mapData: any = JSON.parse(rawJson);

if (!Array.isArray(mapData.tilesets)) {
	console.error("Error: exported JSON has no tilesets array");
	process.exit(1);
}

let fixedCount = 0;

for (const tileset of mapData.tilesets) {
	if (typeof tileset.image === "string" && tileset.image !== "") {
		const before = tileset.image;
		tileset.image = basename(tileset.image);
		if (before !== tileset.image) {
			console.log(`  ${before}`);
			console.log(`    → ${tileset.image}`);
			fixedCount++;
		}
	}
}

console.log(`  ${fixedCount} path(s) rewritten`);

// ─── Step 3: Write corrected JSON ─────────────────────────────────────────────

writeFileSync(OUT_MAP, JSON.stringify(mapData, null, 2));
console.log(`\nWrote ${OUT_MAP}`);

// ─── Step 4: Copy tileset PNGs ────────────────────────────────────────────────

console.log("\nCopying tileset PNGs...");

let copiedCount = 0;
const missing: string[] = [];

for (const filename of TILESET_FILES) {
	const src = join(SRC_TILESETS_DIR, filename);
	const dest = join(OUT_DIR, filename);

	if (!existsSync(src)) {
		missing.push(filename);
		continue;
	}

	copyFileSync(src, dest);
	console.log(`  ${filename}`);
	copiedCount++;
}

if (missing.length > 0) {
	console.warn(
		`\nWarning: ${missing.length} tileset file(s) not found in ${SRC_TILESETS_DIR}:`,
	);
	for (const f of missing) console.warn(`  ${f}`);
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`
Done.
  Map JSON  → ${OUT_MAP}
  Tilesets  → ${OUT_DIR}/ (${copiedCount}/${TILESET_FILES.length} files copied, ${fixedCount} path(s) fixed)
`);

---
title: Iteration 03 — DunderMifflin Map Integration
date: 2026-05-03
status: in-progress
type: iteration
branch: iter-3/tiled-office-redesign
---

# Iteration 03 — DunderMifflin Map Integration

**Goal:** Replace the programmatically-generated tilemap with the professional Fiverr-designed Dunder Mifflin office map, producing a polished, visually rich office using 9 LimeZu tilesets and 8 tile layers.

**Why:** The current `generate-tilemap.ts` produces a flat, broken-looking 30x24 office with black voids and misplaced furniture. A professional Fiverr designer delivered a hand-crafted 56x30 tile map (`DunderMifflin/DunderMifflin.tmx`) with 9 LimeZu tileset sheets and 8 properly layered tile layers — this is the quality bar we need.

**What changed from original plan:** Phases 1-2 (Tiled setup + manual office layout design) are replaced by the Fiverr deliverable. Phase 5 (character improvements) is deferred to a separate iteration.

**Licensing:** `DunderMifflin/` is gitignored (source TMX + raw LimeZu tileset sheets — paid assets). The exported assets in `public/assets/tiles/` (tileset PNGs + JSON) ARE committed so the game runs out of the box from a clone. This mirrors how `public/assets/sprites/characters.png` (derived from LimeZu) is already committed.

## New Map Details

- **Source:** `DunderMifflin/DunderMifflin.tmx` (56x30 tiles, 32x32px, 1792x960px total)
- **Preview:** `DunderMifflin/DunderMifflin.png`
- **Tilesets (9):** all in `DunderMifflin/tilesets/`
  - `1_Generic_32x32.png` (512x2496, 16 cols)
  - `2_LivingRoom_32x32.png` (512x1440, 16 cols)
  - `3_Bathroom_32x32.png` (512x1792, 16 cols)
  - `12_Kitchen_32x32.png` (512x1568, 16 cols)
  - `18_Jail_32x32.png` (512x1440, 16 cols)
  - `19_Hospital_32x32.png` (512x3520, 16 cols)
  - `Modern_Office_Shadowless_32x32.png` (512x1696, 16 cols)
  - `Room_Builder_32x32.png` (2432x3616, 76 cols) — large but within 4096 WebGL limit
  - `Room_Builder_Office_32x32.png` (512x448, 16 cols)
- **Layers (8 tile layers, no object layers):**
  1. Ground
  2. Ground Details
  3. Walls
  4. Walls Details
  5. Same Level
  6. Same Level Details
  7. Above Head
  8. Above Player Details
- **No collision data** in the TMX (needs layer-based approach)
- **No spawn points** (needs code-defined fallbacks)

## Phase 1 — Export Pipeline [5/5]

Create `scripts/export-tiled-map.ts` to bridge TMX → game-ready assets:

- [x] Call `tiled --export-map json DunderMifflin/DunderMifflin.tmx` (Tiled 1.12.1 confirmed at `/opt/homebrew/bin/tiled`)
- [x] Post-process JSON: fix tileset `image` paths from absolute to just filenames (e.g. `"1_Generic_32x32.png"`)
- [x] Copy 9 tileset PNGs from `DunderMifflin/tilesets/` → `public/assets/tiles/`
- [x] Write corrected JSON to `public/assets/tiles/office-map.json`
- [x] Skip tile-extruder initially — `pixelArt: true` + `roundPixels: true` in game config prevent bleeding at 32px; revisit if artifacts appear

## Phase 2 — Game Code Updates [8/8]

### Preloader (`src/game/scenes/Preloader.ts`)

- [x] Load all 9 tileset images (replace single `office-tileset.png` load)
- [x] Keep `office-map` key for tilemap JSON (same path, new content)

### OfficeScene (`src/game/scenes/OfficeScene.ts`)

- [x] Register 9 tilesets via `map.addTilesetImage(name, name)` for each
- [x] Create all 8 layers passing tileset array to `createLayer()`
- [x] Set layer depths: Ground=0, Ground Details=1, Walls=2, Walls Details=3, Same Level=4, Same Level Details=5, Above Head=10000, Above Player Details=10001
- [x] Collision via `setCollisionByExclusion([-1, 0])` on Walls + Walls Details layers (layer-based since TMX has no per-tile collision properties)
- [x] Define fallback spawn points in code (approximate desk positions from visual inspection of map); keep existing object-layer reading code for forward compatibility
- [x] Camera bounds to 1792x960px (56x30 at 32px)

## Phase 3 — Cleanup [6/6]

- [x] Add `DunderMifflin/` to `.gitignore` (source TMX + LimeZu paid tileset sheets)
- [x] Delete `scripts/build-tileset.ts` (replaced by export script)
- [x] Delete `scripts/generate-tilemap.ts` (replaced by export script)
- [x] Delete old `public/assets/tiles/office-tileset.png` and `office-tileset.json` (replaced by new tilesets)
- [x] Delete old `tiled/` directory (scratch map; `DunderMifflin/` is new source of truth)
- [x] Update `package.json` scripts: replace `generate:tileset`/`generate:tilemap` with `generate:map` → `bun scripts/export-tiled-map.ts`

## Phase 4 — Verify [5/5]

- [x] `bun run generate:map` succeeds — produces JSON + copies 9 PNGs
- [x] `bun run dev` — all 8 layers render, office matches `DunderMifflin.png`
- [x] Characters spawn at approximately correct positions
- [x] No tile bleeding at zoom levels 1x-3x
- [x] `bun run check` passes (biome + typecheck + tests)

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| TMX → JSON conversion | `tiled` CLI + post-processing script | CLI is installed (v1.12.1), produces clean Phaser-compatible JSON; avoids custom parser or npm dependency |
| Tile bleeding prevention | Skip tile-extruder initially | `pixelArt: true` + `roundPixels: true` sufficient at 32px; add later if needed |
| Room_Builder_32x32.png (2432x3616) | Keep as-is, don't split | Fits within 4096 WebGL limit; desktop-only tool |
| Collision | Layer-based (`setCollisionByExclusion`) on Walls layers | TMX has no per-tile collision data; adding it manually across 9 tilesets would be tedious |
| Spawn points | Code-defined fallbacks | TMX has no object layer; define coordinates from visual inspection, refine after testing |
| Old scripts | Delete (not deprecate) | Fully replaced; git history preserves them if ever needed |
| Character improvements | Deferred to iteration 04 | Keep scope focused on map integration |

## Files Summary

| Action | Path |
|--------|------|
| **Create** | `scripts/export-tiled-map.ts` |
| **Modify** | `src/game/scenes/Preloader.ts` |
| **Modify** | `src/game/scenes/OfficeScene.ts` |
| **Modify** | `package.json` |
| **Delete** | `scripts/build-tileset.ts` |
| **Delete** | `scripts/generate-tilemap.ts` |
| **Delete** | `public/assets/tiles/office-tileset.png` |
| **Delete** | `public/assets/tiles/office-tileset.json` |
| **Delete** | `tiled/` directory |
| **Generated** | `public/assets/tiles/office-map.json` |
| **Copied** | `public/assets/tiles/*.png` (9 tilesets) |

## Notes

- `DunderMifflin/` is gitignored — source TMX + raw LimeZu tileset sheets are paid assets; exported assets in `public/assets/tiles/` are committed
- `assemble-characters.ts` is unaffected — character atlas pipeline stays the same
- claw-socket (`../claw-socket/`) requires no changes
- Phaser supports multiple tilesets per layer via array argument to `createLayer()`
- Flipped tiles in the TMX (GIDs > 2^30 in Ground Details layer) are handled natively by Phaser's Tiled JSON parser

## Agent Assignments

| Task | Owner |
|------|-------|
| Phase 1 (export pipeline) | **game-developer** or **pixel-artist** |
| Phase 2 (game code updates) | **game-developer** |
| Phase 3 (cleanup) | **game-developer** |
| Phase 4 (verify) | **all** |

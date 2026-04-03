---
title: Iteration 02 — LimeZu Asset Integration
type: iteration
status: complete
tags:
  - iteration
  - assets
  - art
  - refactor
date: 2026-04-03
---

# Iteration 02 — LimeZu Asset Integration

**Goal:** Replace all programmatically generated pixel art with LimeZu's Modern Office + Modern Interiors assets, producing a polished-looking office with recognizable Office characters.

## Phase 1 — Asset Exploration & Inventory

- [x] Unzip all LimeZu archives into organized working directories
- [x] Inventory Modern Office tileset: catalog tiles by category (floors, walls, furniture, props) at 32×32 size
- [x] Inventory Modern Interiors character generator: catalog bodies, eyes, outfits, hairstyles, accessories at 32×32 size
- [x] Identify which character animations are available (idle, sit variants, run/walk, phone, typing)
- [x] Read CHARACTER_GENERATOR.txt and HOW_TO_CHARACTER_GENERATOR.png to understand the 5-layer compositing system
- [x] Read Spritesheet_animations_GUIDE.png to understand animation frame layouts
- [x] Document frame counts, grid layout, and frame dimensions for each animation type
- [x] Identify the best tiles for: Dunder Mifflin carpet, walls, glass walls, doors, kitchen tile
- [x] Identify the best furniture for: desks with monitors, office chairs, reception desk, bookshelf, filing cabinet, copier, vending machine, water cooler, coffee maker, plants

## Phase 2 — Character Assembly

- [x] Select body type, skin tone, eyes for each character (Michael, Dwight, Jim, Pam)
- [x] Select outfits: Michael (white shirt + dark tie), Dwight (mustard shirt + tie + glasses), Jim (blue button-down, no tie), Pam (pink cardigan + green undershirt)
- [x] Select hairstyles: Michael (dark combed), Dwight (parted brown), Jim (shaggy brown), Pam (ponytail, light brown)
- [x] Select accessories: Dwight's glasses (critical!)
- [x] Write `scripts/assemble-characters.ts` — composites the 5 layers per character into final spritesheets
- [x] Generate idle-sit, typing/sit, walk-down animations for each character
- [x] Output Phaser 3 atlas: `public/assets/sprites/characters.png` + `characters.json`
- [x] Verify all 4 characters are visually distinct and recognizable

## Phase 3 — Tileset & Tilemap Rebuild

- [x] Write `scripts/build-tileset.ts` — extracts needed tiles from LimeZu sheets into a single game tileset PNG + metadata
- [x] Include Room Builder tiles (floors, walls, corners, doors) from Modern Office
- [x] Include furniture tiles from Modern Office (desks, chairs, shelves, cabinets)
- [x] Include props from Modern Office + Modern Interiors (copier, vending machine, kitchen items)
- [x] Output: `public/assets/tiles/office-tileset.png` + `office-tileset.json`
- [x] Rewrite `scripts/generate-tilemap.ts` to use new tile GIDs
- [x] Rebuild office layout: Michael's office, reception, bullpen (4 desks), break room, hallway
- [x] Use Room Builder wall/floor system for proper room construction
- [x] Add shadow tiles where appropriate for depth
- [x] Preserve spawn points for 4 characters with same properties
- [x] Output: `public/assets/tiles/office-map.json`

## Phase 4 — Game Code Updates

- [x] Update Preloader to load new tileset dimensions/format
- [x] Update OfficeScene tilemap layer creation for new tileset
- [x] Update OfficeCharacter animation definitions to match new atlas frame names/counts
- [x] Update CharacterManager spawn logic if character dimensions changed
- [x] Verify camera bounds and zoom still work with new map size
- [x] Test demo mode — characters animate correctly with new sprites

## Phase 5 — Polish & Verify

- [x] Visual QA: run `bun run dev` and verify office looks good
- [x] Verify all 4 characters are at correct positions and animate correctly
- [x] Verify idle/typing/sit state transitions work
- [x] Verify camera zoom and drag still work
- [x] `bun run check` passes (format + typecheck + tests)
- [x] Add attribution comment in source: link to limezu.itch.io (required by license)
- [x] Remove old programmatic generation scripts (generate-tileset.ts, generate-characters.ts) or keep as fallback

## Notes

- LimeZu assets live in `./LimeZu/` (gitignored) — generation scripts read from there and output to `public/assets/`
- Use 32×32 tile size for consistency
- Character sprites are composited from 5 layers: Body → Eyes → Outfit → Hairstyle → Accessory
- Modern Office has 3 tile styles: room builder, black shadow, shadowless — prefer black shadow for depth
- License requires attribution (link to limezu.itch.io)

## Agent Assignments

| Task Group | Agent |
|-----------|-------|
| Phase 1 (exploration) | **main agent** |
| Phase 2 (character assembly script) | **pixel-artist** |
| Phase 3 (tileset/tilemap rebuild) | **pixel-artist** |
| Phase 4 (game code updates) | **game-developer** |
| Phase 5 (polish) | **main agent** |

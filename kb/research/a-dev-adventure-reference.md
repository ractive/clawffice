---
title: "Reference Analysis: a-dev-adventure-game (Phaser 3 + LimeZu)"
type: research
tags: [research, reference, phaser, limezu, tilemap, spritesheet, tiled, architecture]
date: 2026-04-03
status: complete
source: "https://github.com/albert-gonzalez/a-dev-adventure-game"
---

# Reference Analysis: a-dev-adventure-game

The only known open-source Phaser 3 game using LimeZu Modern Interiors assets. Created by Albert Gonzalez as a portfolio RPG. This document extracts every integration insight relevant to [[limezu-phaser-integration]].

## 1. Tech Stack

| Component | Choice |
|---|---|
| Game engine | Phaser 3.55.2 |
| Language | TypeScript 4.6 |
| Bundler | Parcel 2.5 |
| Map editor | Tiled (v1.4+) |
| Physics | Arcade |
| Asset pipeline | None (manual) |
| tile-extruder | **Not used** |
| i18n | i18next |
| Testing | Jest |

**No build-time asset processing** — no tile-extruder, no custom scripts, no spritesheet packing. Assets are used as-is from LimeZu packs.

## 2. Tileset Configuration

### room.png — The Single Combined Tileset

The project uses a **single PNG tileset image** (`room.png`) for ALL room/office tiles:
- **Dimensions**: 352x832 pixels
- **Tile size**: 32x32 pixels
- **Layout**: 11 columns, 286 tiles total
- **Margin**: 0
- **Spacing**: 0

This is NOT a raw LimeZu asset — it's a **manually composed tileset sheet** assembled from LimeZu tiles in an image editor (GIMP — `.xcf` source file is present at `src/game/assets/tilemaps/room.xcf`).

### Key Insight: No Tile Bleeding Fixes

Zero margin, zero spacing. They simply rely on:
- Integer pixel positions (no sub-pixel rendering)
- Phaser's default tile rendering
- The tileset being a clean grid with no gaps

This means they either didn't encounter bleeding or accepted minor artifacts.

### Tileset Registration in Tiled JSON

```json
{
  "columns": 11,
  "firstgid": 1,
  "image": "room.png",
  "imageheight": 832,
  "imagewidth": 352,
  "margin": 0,
  "name": "room",
  "spacing": 0,
  "tilecount": 286,
  "tileheight": 32,
  "tilewidth": 32
}
```

### Tiled TSX Collision Data

The `room.tsx` file defines per-tile collision using Tiled's collision editor. 62 of 286 tiles have collision objectgroups — mostly full-tile rectangles (`width=32, height=32`), but some tiles have partial collision boxes for furniture edges.

## 3. Character Sprite Configuration

### Frame Dimensions

Two character sizes defined:

```typescript
export const HUMAN_FRAME_SIZE = {
  frameWidth: 32,
  frameHeight: 64,
};

export const DOG_FRAME_SIZE = {
  frameWidth: 32,
  frameHeight: 32,
};
```

Human characters are **32x64 pixels** (1:2 ratio, occupying 1 tile wide x 2 tiles tall).

### Spritesheet Layout

Character spritesheets (albert.png, boss.png, etc.) are:
- **96x256 pixels** (3 columns x 4 rows)
- **12 frames total** in a 3-column layout
- **Tiled TSX**: `tilewidth="32" tileheight="64" tilecount="12" columns="3"`

The 12-frame layout maps to 4 directions x 3 frames each:

| Row | Frames | Direction |
|-----|--------|-----------|
| 0 | 0, 1, 2 | Down |
| 1 | 3, 4, 5 | Left |
| 2 | 6, 7, 8 | Right |
| 3 | 9, 10, 11 | Up |

### Character Spritesheet Source

Characters are **pre-composited sheets** — each PNG is a single character with all 12 walk frames baked in. The `.xcf` (GIMP) source files confirm manual composition. They did NOT use the LimeZu character generator at runtime — they pre-built each character in GIMP.

### Bounding Boxes

Characters have carefully tuned collision boxes:

```typescript
// Main character: only bottom 10px for feet
const MAIN_CHARACTER_BOUNDING_BOX_HEIGHT = 10;
const MAIN_CHARACTER_BOUNDING_BOX_OFFSET = 55;

// Standing NPCs: 45px tall box, offset 30px from top
export const STANDING_NPC_BOUNDING_BOX_HEIGHT = 45;
export const STANDING_NPC_BOUNDING_BOX_OFFSET = 30;

// Sitting NPCs: 44px tall, offset 20px
export const SITTING_NPC_BOUNDING_BOX = {
  height: 44,
  offset: 20,
};
```

The main character's tiny 10px bounding box at offset 55 (feet only) allows walking behind furniture and overlapping with the upper portion of objects — critical for the LimeZu perspective.

## 4. Animation Definitions

### Frame Mapping

```typescript
// Down: frames 0, 1, 2 — walk cycle uses [0, 1, 2, 1]
// Left: frames 3, 4, 5 — walk cycle uses [3, 4, 5, 4]
// Right: frames 6, 7, 8 — walk cycle uses [6, 7, 8, 7]
// Up: frames 9, 10, 11 — walk cycle uses [9, 10, 11, 10]
```

Each direction has a 4-frame cycle that bounces: `[left, center, right, center]`. The still/idle frame is always the center frame of each direction (1, 4, 7, 10).

### Animation Config

- **Frame rate**: 8 FPS
- **Walk animations**: repeat infinitely (-1)
- **Still animations**: no repeat (0)
- **Prefix system**: animations can be prefixed (e.g., `SLEEPY_` prefix for sleeping variant)

### NPC Animation

NPCs that are animated get their own `createCharacterAnimations()` call with their key as prefix. Sitting NPCs are NOT animated — they use a static frame (frame 0).

The `lookAtMainCharacter()` function makes NPCs face the player during dialogue by calculating direction from position delta and calling `updateAnimation()` with `forceStill=true`.

## 5. Tilemap Layer Architecture

### Layer Structure (7-8 layers per map)

| Layer | Type | Purpose |
|-------|------|---------|
| `ground` | tilelayer | Floor tiles, base layer |
| `objects` | tilelayer | Furniture, walls — has collision |
| `objectsOver` | tilelayer | Objects rendered above character |
| `middleGround` | tilelayer | Intermediate depth items |
| `foreground` | tilelayer | Top-most visual layer |
| `dynamicObjects` | objectgroup | Runtime-spawned sprites |
| `characters` | objectgroup | Character spawn positions |
| `actions` | objectgroup | Interactive trigger zones |

### Map Dimensions

- **Home scene**: 24x30 tiles (768x960 px)
- **Office scene**: 40x21 tiles (1280x672 px)
- **Tile size**: 32x32 consistently

### The RenderTexture Trick (Critical Pattern)

The project does NOT simply render tilemap layers at different depths. Instead, it uses a **RenderTexture compositing approach**:

```typescript
// In createMap():
const groundCanvas = scene.add.renderTexture(0, 0, w, h);
const middleGroundCanvas = scene.add.renderTexture(0, 0, w, h);
const foregroundCanvas = scene.add.renderTexture(0, 0, w, h);
middleGroundCanvas.setDepth(MIDDLE_GROUND_DEPTH);  // 9997
foregroundCanvas.setDepth(FOREGROUND_DEPTH);         // 9998

// In update() — EVERY FRAME:
groundCanvas.clear();
groundCanvas.draw([ground, objects, objectsOver]);
middleGroundCanvas.clear();
middleGroundCanvas.draw(middleGround);
foregroundCanvas.clear();
foregroundCanvas.draw(foreground);
```

All tilemap layers are created as **invisible** (`setVisible(false)`) and then drawn onto RenderTexture canvases each frame. The ground canvas composites ground + objects + objectsOver together. The middleGround and foreground get their own canvases at high depth values.

**Why?** This is likely to solve depth-sorting issues. By drawing static tile layers onto canvases, they can assign a single depth to each canvas group while allowing characters to sort dynamically between them using `setDepth(Math.ceil(character.y / TILE_HEIGHT))`.

### Depth Sorting

Characters get Y-based depth sorting every frame:

```typescript
albertSprite.setDepth(Math.ceil(albertSprite.y / TILE_HEIGHT));
Object.values(state.scene.characterSprites).forEach(
  (character) => character && character.setDepth(Math.ceil(character.y / TILE_HEIGHT))
);
```

Since `TILE_HEIGHT = 32`, characters sort at integer depth values. The middleGround canvas at depth 9997 is always above all characters, while the ground canvas at default depth (0) is always below.

## 6. Collision System

### Tile-based Collision

Collision is defined in Tiled via per-tile collision shapes (in the .tsx file) and loaded via:

```typescript
map.createLayer(layerId, tiles, 0, 0)
  .setVisible(false)
  .setCollisionFromCollisionGroup();
```

`setCollisionFromCollisionGroup()` reads the collision rectangles from Tiled's tileset definition.

### Object-based Collision

Characters collide with:
- `ground` layer (floor boundaries)
- `objects` layer (furniture)
- Other character sprites (NPCs)

Actions (interactive zones) use **overlap** detection, not collision — so the player walks through them and triggers callbacks.

### Physics Body Configuration

The main character has physics applied automatically via `createObjectsFromMap()` which calls `scene.physics.world.enable(objects)`. The body is then resized to feet-only (10px height).

## 7. Asset Pipeline

### No Build Scripts

There are zero asset processing scripts. The pipeline is:

1. **LimeZu tiles** → manually assembled in GIMP into `room.png` (with .xcf source)
2. **LimeZu characters** → manually composited in GIMP into individual PNGs (with .xcf sources)
3. **Tiled** → maps created referencing room.png tileset + character tilesets
4. **Tiled export** → `.jsonc` files (JSON with comments, handled by Parcel raw transformer)
5. **Parcel** → bundles everything, treats .jsonc/.mp3/.ogg as raw assets

The `.parcelrc` config:
```json
{
  "extends": "@parcel/config-default",
  "transformers": {
    "*.{jsonc,mp3,ogg}": ["@parcel/transformer-raw"],
    "*.{ts,tsx}": ["@parcel/transformer-typescript-tsc"]
  }
}
```

### Tiled Project Files

Both `.tmx` (Tiled XML) and exported `.jsonc` (Tiled JSON) are committed. The `.tmx` is the editable source, `.jsonc` is what the game loads. There's also a `.tiled-project` and `.tiled-session` file in the repo.

## 8. How They Load Tilemaps in Phaser

### Preload Phase

```typescript
// Load tilemap JSON
scene.load.tilemapTiledJSON(key, data);

// Load tileset image
scene.load.image("room", roomImage);

// Load spritesheets
scene.load.spritesheet("albert", albertImage, { frameWidth: 32, frameHeight: 64 });
```

### Create Phase

```typescript
// Create tilemap from loaded JSON
const map = scene.make.tilemap({ key });

// Connect tileset image to tilemap definition
const tiles = map.addTilesetImage("room", "room");

// Create layers from tilemap
map.createLayer("ground", tiles, 0, 0)
  .setVisible(false)
  .setCollisionFromCollisionGroup();

// Create characters from object layer
map.createFromObjects("characters", { key: "albert", frame: 2, name: "albert" });
```

### Character Placement

Characters are placed in Tiled as objects in the "characters" object layer, then spawned via `map.createFromObjects()`. Each character object in Tiled references the character's tileset, and the sprite config specifies which frame to show initially.

## 9. Pitfalls and Clever Solutions

### Pitfall: Tile Bleeding
**Their approach**: Zero margin/spacing, no tile-extruder. This works at 32px tile size because sub-pixel artifacts are less visible. At 16px (native LimeZu size) this would likely be more problematic.

### Clever: RenderTexture Layer Compositing
Drawing invisible tilemap layers onto RenderTextures each frame is unconventional but solves the depth-sorting problem elegantly. Characters can sort by Y-position between fixed-depth canvas layers.

### Clever: Feet-Only Bounding Box
The 10px-at-feet collision box for the main character is essential for LimeZu's perspective. It lets the character's upper body overlap with furniture and walk behind taller objects naturally.

### Clever: Action Zone Overlaps
Interactive areas use physics overlaps (not collisions), so the player walks into them naturally. Combined with direction checking (`isActivationDirectionCorrect()`), the player must face the object and press action.

### Pitfall: Single Tileset Limitation
Using one `room.png` for everything means the tileset was manually assembled. Adding new tiles requires editing the GIMP file, re-exporting, and updating the Tiled tileset. Not scalable for large tile collections.

### Clever: Animation Prefix System
The prefix system (`SLEEPY_`, character keys) allows the same animation creation function to support multiple character variants without code duplication.

### Notable: Y-Sort Formula
`Math.ceil(character.y / TILE_HEIGHT)` gives integer depth values. This means characters in the same tile row share the same depth. For most office scenarios this is sufficient.

## 10. Implications for Clawffice

### What to Adopt
- [x] 32x64 character frame size (standard for LimeZu at 32px scale)
- [x] 12-frame character spritesheet layout (3 cols x 4 rows, same direction order)
- [x] 4-frame bounce walk cycle `[0, 1, 2, 1]` per direction
- [x] 8 FPS animation framerate
- [x] Feet-only collision box (~10px) for main character
- [x] Y-based depth sorting: `Math.ceil(y / tileHeight)`
- [x] Tiled for map editing with per-tile collision in .tsx
- [x] Object layers for character spawns and interactive zones
- [x] `setCollisionFromCollisionGroup()` for tile collision

### What to Improve On
- [ ] Use tile-extruder for bleeding prevention (they skipped this)
- [ ] Automate tileset generation instead of manual GIMP assembly
- [ ] Use native tilemap layer depth instead of RenderTexture hack (Phaser supports layer depth directly now)
- [ ] Consider runtime character layering instead of pre-composited sheets
- [ ] Use proper Phaser tilemap JSON export (not .jsonc requiring special Parcel config)
- [ ] Add margin/spacing to tilesets for camera zoom/sub-pixel safety

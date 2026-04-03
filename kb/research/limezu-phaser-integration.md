---
title: "LimeZu Asset Packs + Phaser 3 Integration Research"
type: research
tags: [research, assets, pixel-art, limezu, phaser, tileset, spritesheet]
date: 2026-04-03
status: complete
---

# LimeZu Asset Packs + Phaser 3 Integration Research

## 1. Asset Pack Overview

### Modern Office (Revamped)
- **Base tile size**: 16x16 pixels
- **Available sizes**: 16x, 32x, 48x variants included
- **Contents**: 300+ office furniture sprites, shadow options, walls, floors
- **Includes**: Room Builder folder, RPG Maker MV files
- **Does NOT include**: Character sprites (those come from Modern Interiors)
- **Price**: ~$2.50 on itch.io
- **File**: Modern_Office_Revamped_v1.2 (~2.7 MB)

### Modern Interiors
- **Base tile size**: 16x16 pixels
- **Available sizes**: 16x16, 32x32, 48x48 variants
- **Contents**: Thousands of individual PNGs organized by theme, 100+ animated objects (.gif + spritesheets)
- **Includes**: Character Generator system, Room Builder, premade characters
- **Price**: ~$1.50+ on itch.io
- **Compatibility note**: Modern Office is designed to be compatible with Modern Interiors style

## 2. Character Generator Compositing System

### Layer Structure
The character generator uses a **layered compositing approach** with these component categories:
1. **Body** (base layer) - naked body base sprites with skin tone variants
2. **Eyes** - separate eye files
3. **Outfit** - clothing overlay (53+ available outfits)
4. **Hairstyle** - hair overlays with semi-transparent bridge pixels for skin-to-hair color blending
5. **Accessories/Hats** - top layer items

### Compositing Order
Per LimeZu's documentation: Body -> Outfit -> Hairstyle creates a ready-to-use spritesheet. The compositing is simple alpha-overlay stacking -- each layer PNG is drawn on top of the previous at the same position.

### Folder Structure
```
Character_Generator/
  Heads/        (or Body files)
  Outfits/
  Hats/         (Accessories)
  Hairstyles/
  Eyes/
0_Premade_Characters/   (20+ ready-made characters)
spritesheet_animation_GUIDE   (row-by-row animation documentation)
```

### Character Sprite Dimensions
- Characters are NOT square -- they use a **1x2 tile ratio**:
  - 16x16 tileset -> **16x32** px per character frame
  - 32x32 tileset -> **32x64** px per character frame
  - 48x48 tileset -> **48x96** px per character frame

### Spritesheet Layout
- **56 frames horizontally, 20 rows vertically** (for premade character sheets)
- GameMaker config reference: 56 frames/row, 32w x 64h (for 32x variant)
- Animations run **left to right**, each row is a different animation
- Actual pixel dimensions may be slightly irregular: e.g. 927x656 instead of expected 896x640 (extra whitespace at edges)
- Animation types include: idle (4-dir), walk (4-dir), run (4-dir), sit, hurt (4-dir), punch, shoot (4-dir), push, pickup, emote
- A `spritesheet_animation_GUIDE` file documents which animation is on which row

### Available Character Generation Tools
1. **Official folder-based**: Manually composite PNGs in image editor (Aseprite, Piskel)
2. **0a3r's Character Generation Tool** (Java/FXGL): Windows .bat launcher, requires purchased assets placed in `bin/` folder, outputs complete PNG spritesheets
3. **MrSwordsman's Character Generator 2.0** (Unity-based): Cross-platform, supports 16/32/48 sizes, can export specific animations, supports randomization. Requires a 16x16 version to load.

### Automating Sprite Assembly Programmatically
No official automation API exists. For programmatic compositing:
- Use **Sharp** (Node.js) `composite()` to overlay layer PNGs at same coordinates
- Use **Canvas API** (browser or node-canvas) to draw layers sequentially
- Layer order: body first, then eyes, outfit, hairstyle, accessories on top
- All layers share identical frame layout, so compositing is simple pixel-aligned overlay

## 3. Tileset Integration with Phaser 3

### Recommended Pipeline: LimeZu -> Tiled -> Phaser 3

**Step 1: Prepare tileset in Tiled Map Editor**
- Import the Room_Builder.png (or subfiles) as a tileset
- Set tile size to 16x16 (or 32x32 if using upscaled version)
- **Critical**: Check "Embed in Map" when creating the tileset
- Design map using Tiled's layer system

**Step 2: Export from Tiled**
- Export as JSON (File > Export As > JSON map files)
- Tile layers must use uncompressed format (CSV or Base64 uncompressed)

**Step 3: Load in Phaser 3**
```javascript
// preload
this.load.image('office-tiles', 'assets/tileset.png');
this.load.tilemapTiledJSON('office-map', 'assets/map.json');

// create
const map = this.make.tilemap({ key: 'office-map' });
const tileset = map.addTilesetImage('tileset-name-in-tiled', 'office-tiles');
const layer = map.createLayer('layer-name-in-tiled', tileset);
```

### Phaser Tileset Parser Limitation
- Does NOT support "Collection of Images" tilesets -- all tiles must be in a single tileset image
- Must be embedded in the exported JSON

## 4. Pixel Art Scaling in Phaser 3

### Game Config for Crisp Pixel Art
```javascript
const config = {
  pixelArt: true,      // NEAREST texture filtering, disables anti-aliasing
  roundPixels: true,    // snaps to integer coordinates
  // Use a small internal resolution, scale up to fill screen
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 320,   // e.g. 20 tiles * 16px
    height: 240,  // e.g. 15 tiles * 16px
  }
};
```

### Scaling Approaches
1. **Integer zoom**: Set camera zoom to 2x, 3x, 4x for clean pixel doubling
2. **Small canvas + CSS scale**: Render at native 16px resolution, let browser scale up with `image-rendering: pixelated`
3. **Use 32x or 48x variants**: LimeZu provides pre-scaled versions -- avoids runtime scaling entirely

### Key Settings
- `pixelArt: true` in game config applies NEAREST filtering globally
- `camera.roundPixels = true` prevents sub-pixel rendering artifacts
- For non-integer zoom, tile bleeding artifacts may still occur

## 5. Room Builder System

### Structure of Room_Builder.png
- **Top section**: Ceilings tileset with all variations
- **Middle section**: Wall patterns sorted by color + tutorial tiles
- **Side section**: Floor patterns sorted by color
- **Bottom section**: Legacy floor paths

### How to Build Rooms
- White-bordered tiles = individual tiles, configure to fit scene
- Wall sections = use as blocks/large chunks (especially 3D corner pieces)
- Wall height varies (2-3+ tiles) depending on room function
- Tutorial tiles included with color/symbol matching system
- Large Room_Builder.png can be laggy -- use subfiles in `Room_Builder_subfiles/` as alternative

## 6. Multi-Layer Character Rendering in Phaser 3

### Approach A: Container (Simple, Dynamic)
```javascript
class Character extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    this.bodySprite = scene.add.sprite(0, 0, 'body');
    this.outfitSprite = scene.add.sprite(0, 0, 'outfit');
    this.hairSprite = scene.add.sprite(0, 0, 'hair');
    this.add([this.bodySprite, this.outfitSprite, this.hairSprite]);
  }
  preUpdate(time, delta) {
    // Must manually forward preUpdate to children for animations
    this.bodySprite.preUpdate(time, delta);
    this.outfitSprite.preUpdate(time, delta);
    this.hairSprite.preUpdate(time, delta);
  }
}
```
- Pro: Easy to swap layers dynamically (change outfit at runtime)
- Con: Multiple draw calls per character, performance issues at scale

### Approach B: CanvasTexture / DynamicTexture (Pre-composited)
```javascript
const tex = scene.textures.createCanvas('char-1', 16, 32);
tex.drawFrame('body-sheet', frameIndex, 0, 0);
tex.drawFrame('outfit-sheet', frameIndex, 0, 0);
tex.drawFrame('hair-sheet', frameIndex, 0, 0);
tex.refresh(); // required for WebGL
```
- Pro: Single draw call per character, best performance
- Con: Must regenerate texture on animation frame change or outfit swap

### Approach C: Build-Time Compositing (Recommended for This Project)
- Use Sharp/Canvas to pre-composite all character variants at build time
- Generate a single spritesheet per character with all animations baked in
- Load as standard Phaser spritesheet -- simplest runtime code
- Best performance, simplest animation handling
- Trade-off: Larger asset files, less runtime flexibility

## 7. Texture Atlas Creation

### Using TexturePacker
- Select **Phaser 3** format in TexturePacker
- Supports pivot points, multi-pack (auto-splits large atlases), normal maps
- Drag folders in -- auto-updates when files change
- CLI available for build pipeline automation
- Output: PNG spritesheet + JSON atlas definition

### Loading in Phaser 3
```javascript
this.load.atlas('characters', 'atlas.png', 'atlas.json');
// Then create animations referencing frame names from the atlas
```

### Alternative: Sharp + Custom JSON
- Use `sharpsheet` npm package for automated atlas generation
- Or use Sharp `composite()` to build spritesheets manually
- Generate Phaser-compatible JSON atlas definition alongside

## 8. Animation Frame Handling

### Registering Animations from Spritesheets
```javascript
// Load as spritesheet with frame dimensions
this.load.spritesheet('char', 'character.png', {
  frameWidth: 16,
  frameHeight: 32
});

// Create animation from specific frame range (row-based)
this.anims.create({
  key: 'walk-down',
  frames: this.anims.generateFrameNumbers('char', {
    start: 0,     // first frame of walk-down row
    end: 5        // last frame
  }),
  frameRate: 8,
  repeat: -1
});
```

### Mapping LimeZu Rows to Animations
Since LimeZu spritesheets have 56 frames per row:
- Row 0 (frames 0-55): first animation
- Row 1 (frames 56-111): second animation
- etc.
- Consult `spritesheet_animation_GUIDE` for exact row-to-animation mapping

## 9. Common Pitfalls

### Tile Bleeding / Seam Lines
- **Problem**: Single-pixel gaps between tiles during camera movement or non-integer zoom
- **Fix**: Use `tile-extruder` CLI tool to extrude tile edges:
  ```bash
  npx tile-extruder --tileWidth 16 --tileHeight 16 --input tileset.png --output tileset-extruded.png
  ```
- After 1px extrusion: specify `margin: 1, spacing: 2` in `addTilesetImage()`
- Also set `camera.roundPixels = true`

### Tileset Too Large
- Complete LimeZu tileset PNGs can be very large (8192+ px)
- May exceed GPU texture limits on some devices
- **Fix**: Split into smaller tileset images, or use only needed subsets

### Character Spritesheet Dimension Irregularities
- Spritesheets may have unexpected whitespace (e.g. 927x656 instead of 896x640)
- Causes frame division errors in engines expecting clean grids
- **Fix**: Trim/crop to exact multiples of frame size before loading, or use individual animation PNGs

### Tiled Parser Limitations in Phaser
- Must use embedded tilesets (not external TSX files without embedding)
- Must use CSV or uncompressed Base64 layer format
- No "Collection of Images" tileset support

### Performance with Multiple Texture Layers
- Container approach with 5+ layers per character degrades with many NPCs
- **Fix**: Pre-composite characters at build time into single spritesheets

### Missing Characters in Modern Office
- Modern Office pack does NOT include character sprites
- Must separately purchase Modern Interiors for the character generator

## 10. Recommended Tools

| Tool | Purpose |
|------|---------|
| **Tiled** | Map editor -- design office layout, export JSON for Phaser |
| **tile-extruder** | CLI to extrude tiles and prevent bleeding artifacts |
| **TexturePacker** | Create optimized texture atlases with Phaser 3 JSON format |
| **Sharp** (Node.js) | Programmatic image compositing for character sprite assembly |
| **Aseprite** | Pixel art editor (LimeZu's tool of choice) |
| **sharpsheet** | Node.js spritesheet generator using Sharp + bin packing |
| **Canvas API** | Runtime or build-time sprite compositing in browser/Node |

## 11. Reference Projects and Resources

- [[pixel-art-assets]] -- earlier asset research including LimeZu pricing
- [a-dev-adventure-game](https://github.com/albert-gonzalez/a-dev-adventure-game) -- Phaser.js game using LimeZu Modern Interiors + Tiled
- [Phaser forum: Multi-layer characters](https://phaser.discourse.group/t/character-with-multiple-sprite-layers-body-clothes-accessories/10011) -- Container vs CanvasTexture approaches
- [Ourcade: Loading Tiled Tilemaps](https://blog.ourcade.co/posts/2020/phaser-3-noob-guide-loading-tiled-tilemaps/) -- Step-by-step Tiled + Phaser guide
- [tile-extruder](https://github.com/sporadic-labs/tile-extruder) -- CLI for fixing tile bleeding
- [TexturePacker + Phaser tutorial](https://www.codeandweb.com/texturepacker/tutorials/how-to-create-sprite-sheets-for-phaser) -- Official TexturePacker guide
- [0a3r Character Generation Tool](https://0a3r.itch.io/modern-interiors-character-generation-tool) -- Java tool for LimeZu character assembly
- [Character Generator 2.0](https://legendaryswordsman2.itch.io/character-generator) -- Unity-based cross-platform tool
- [LimeZu Room Builder devlog](https://limezu.itch.io/moderninteriors/devlog/224184/190th-update-the-room-builder-file) -- Room construction documentation
- [LimeZu Wall tutorial](https://limezu.itch.io/moderninteriors/devlog/209960/tutorial-how-to-walls) -- Wall tile arrangement guide

---
title: "Engine Comparison for LimeZu Asset Integration"
type: research
status: complete
date: 2026-04-03
tags: [research, engines, limezu, tileset, comparison]
---

# Engine Comparison for LimeZu Asset Integration

Research into which game engines work best with LimeZu pixel art asset packs (Modern Office, Modern Interiors), comparing alternatives to Phaser 3.

## Summary Verdict

**Phaser 3 remains the best choice for this project.** It is the only engine that is web-native, lightweight, has a proven LimeZu integration example, and aligns with the existing codebase. The main pain point (tile bleeding) is solved by tile-extruder and will be eliminated entirely in Phaser 4. No alternative engine offers a compelling enough advantage to justify a rewrite.

---

## 1. RPG Maker MV/MZ

### LimeZu Integration
- LimeZu ships **dedicated RPG Maker MV files** (added in Update 1.2, December 2020). These are 48x48 sprites formatted to RPG Maker conventions.
- RPG Maker MZ can also use 16x16 tiles natively since a newer engine update, but the map editor zoom makes small tiles inconvenient to work with.
- **Known issues**: Some LimeZu tilesets are 2544x768 px, exceeding RPG Maker's standard 768x768 format, causing display issues in the database. Some assets need manual off-grid adjustment.

### Character Generator Spritesheets
- RPG Maker has its own character generator system with a specific format. LimeZu's 5-layer compositing system (Body/Eyes/Outfit/Hair/Accessory) does NOT map to RPG Maker's generator format. You would need to pre-composite characters and import them as custom character sheets.

### Web Browser Support
- RPG Maker MZ can export to HTML5/web, but with significant limitations:
  - No file system operations (NW.js security restrictions)
  - Many plugins are desktop-only and incompatible with HTML5
  - Save data uses HTML5 storage instead of files
  - The runtime is heavy and opinionated

### Tile Bleeding
- RPG Maker handles its own rendering; tile bleeding is generally not an issue within its pipeline since it controls the entire rendering stack.

### Community Examples
- RPG Maker is the most common engine in the LimeZu community (the assets are literally branded "RPG Tileset"). Many itch.io games use LimeZu + RPG Maker.

### Deal-Breakers
- **RPG Maker is designed for traditional RPGs**, not web-based office visualizations. Its event system, battle system, and scene structure are all RPG-oriented. Building a real-time agent visualization dashboard in RPG Maker would be fighting the engine at every step.
- **Proprietary, paid software** ($80 for MZ). Not open source.
- **Heavy web export** with an opinionated runtime. No easy WebSocket integration for real-time data.
- **Cannot programmatically control** the game from external code (our WebSocket bridge pattern is not natural in RPG Maker).

**Verdict: Not suitable.** Perfect for traditional RPGs using LimeZu assets, wrong tool for a web-based visualization.

---

## 2. Godot

### LimeZu Integration
- LimeZu now ships **Godot autotile files** for Modern Exteriors (added June 2024, 26 terrains), and autotiles for Modern Interiors and Modern Farm.
- Assets available in 3 sizes (16x16, 32x32, 48x48). Import requires setting the texture to "2D Pixel" preset to avoid blurriness.
- Godot 4's Terrain system (successor to Godot 3's Autotile) works with LimeZu's autotile format. Setup involves configuring peering bits in a 3x3 grid.
- **Room Builder**: Users report the Room_Builder.png works in Godot but can be laggy due to file size. Sub-files may be needed.
- A [Godot Forums thread](https://godotforums.org/d/27773-help-with-tilemap-creation-of-modern-interiors-set) discusses challenges with 3D walls and corner pieces in Godot.

### Character Generator Spritesheets
- Godot's AnimatedSprite2D or SpriteFrames can handle the 56-frame x 20-row spritesheet format. Setup is manual but straightforward.
- No special tooling advantage over Phaser for this specific layout.

### Web Browser Support
- Godot exports to HTML5/WebAssembly, **but**:
  - Minimum WASM file is ~40 MB uncompressed (~5 MB with Brotli compression)
  - Can be optimized down to ~2.7 MB zipped by stripping 3D renderer, network stack, and unused features, but requires **recompiling custom export templates** from source
  - Compare to Phaser: under 1 MB for the entire framework
  - GitHub Pages and CloudFlare Pages have issues with files >25 MB
- Threading support in web exports has had historical issues.

### Tile Bleeding
- Godot generally handles pixel-perfect rendering well with its 2D renderer. The "2D Pixel" import preset and viewport stretch mode help. Less of an issue than in Phaser.

### Community Examples
- Multiple Godot users discuss LimeZu integration in itch.io comments and Godot forums. LimeZu explicitly supports Godot with autotile files.

### Deal-Breakers
- **Web export size** is 5-40x larger than Phaser, which matters for a web visualization that should load fast.
- **Overkill**: Godot is a full game engine with a visual editor, scene tree, GDScript runtime, physics, etc. This project needs none of that.
- **Rewrite cost**: Would require rewriting the entire game in GDScript/C#, losing the TypeScript codebase and Vite build pipeline.
- **External communication**: WebSocket support exists but is less natural than in a JavaScript-native environment.

**Verdict: Excellent engine for LimeZu assets, wrong platform for a web visualization.** The autotile support is genuinely better than Phaser's, but the web export overhead and rewrite cost are prohibitive.

---

## 3. Unity (with 2D Tilemap)

### LimeZu Integration
- Unity's 2D Tilemap system can import LimeZu spritesheets: set Texture Type to "Sprite 2D", Sprite Mode to "Multiple", then use Sprite Editor to slice by grid (16x16 or 32x32).
- Must set Max Size to 8192 in import settings or Unity will compress large tilesheets.
- A [community-built Character Generation Tool](https://0a3r.itch.io/modern-interiors-character-generation-tool) for LimeZu's Modern Interiors was built in Unity. LimeZu endorsed it.
- No autotile files shipped for Unity (unlike Godot/GameMaker). Tile rules must be set up manually.

### Character Generator Spritesheets
- Unity can handle the 56x20 spritesheet layout via Sprite Editor slicing. Animation clips are created manually in the Animation window.
- The community Character Generation Tool proves it works, though the tool itself has had issues (files not found, no Mac build due to Apple restrictions).

### Web Browser Support
- Unity exports to WebGL, but:
  - Build sizes are very large (typically 10-30 MB minimum)
  - WebGL builds have known performance issues, especially on mobile
  - Unity's web player has been deprioritized relative to native platforms
  - Requires Unity license management

### Tile Bleeding
- Unity's Sprite Atlas system with padding handles tile bleeding. The 2D Pixel Perfect package provides additional tools.

### Community Examples
- The Character Generation Tool by 0a3r is the main community example. General LimeZu + Unity usage exists but is less documented than RPG Maker or Godot.

### Deal-Breakers
- **Massive overkill** for a web visualization. Unity is a multi-platform AAA-capable engine.
- **Huge web export size** (worse than Godot).
- **C# language** requires complete rewrite.
- **License complexity** and cost for commercial use.
- **Slow iteration**: Unity's compile-and-play cycle is much slower than Vite hot reload.

**Verdict: Not suitable.** The Character Generation Tool is interesting but not a reason to use Unity for the game itself.

---

## 4. Tiled Map Editor + Any Engine

### LimeZu Integration
- Tiled is the de facto standard tile map editor. LimeZu's Room_Builder.png and individual tilesheets import directly as Tiled tilesets.
- The Room Builder workflow in Tiled: import the large Room_Builder.png as a tileset, paint rooms using the stamp tool. Works well, though the file can be laggy.
- Tiled supports terrain/autotile rules that can be configured for LimeZu's wall/floor patterns.

### Does It Make Engine Choice Less Important?
- **Partially yes**: Tiled exports to JSON/TMX format, which is supported by Phaser, Godot, Kaplay, Excalibur, Unity (via plugins), and most other engines. This decouples map design from engine choice.
- **But**: The engine still needs to parse and render the Tiled map. Phaser has first-class Tiled JSON support built in (`this.make.tilemap({ key: 'map' })`). Other engines vary.
- **The real value**: Using Tiled for map design is recommended regardless of engine. It's better than hand-coding tilemap JSON.

### Current Project Status
- The existing project generates tilemaps programmatically via `scripts/generate-tilemap.ts`. Iteration 02 plans to rebuild this with LimeZu assets.
- Tiled could replace or supplement the generation scripts for the map layout phase, then export JSON for Phaser to consume.

### Community Examples
- [a-dev-adventure-game](https://github.com/albert-gonzalez/a-dev-adventure-game) uses exactly this stack: **Phaser + Tiled + LimeZu Modern Interiors**. This is the closest existing open-source reference to what clawffice needs.

**Verdict: Tiled is a strong recommendation as a complementary tool, not an engine replacement.** Use Tiled for map design, export JSON, load in Phaser. This is a well-proven workflow.

---

## 5. PixiJS

### LimeZu Integration
- PixiJS can load any spritesheet/tileset image. No special LimeZu support, but no special barriers either.
- Tilemap support requires additional libraries (e.g., `@pixi/tilemap`). The tilemap ecosystem is fragmented and confusing compared to Phaser's built-in support.
- No Tiled JSON parser built in; would need a third-party library.

### Character Generator Spritesheets
- PixiJS `AnimatedSprite` can handle spritesheet animations. Setup is entirely manual (define frame rectangles, create textures).
- More boilerplate than Phaser's `this.anims.create()` approach.

### Web Browser Support
- Excellent. PixiJS is web-native, ~450 KB (3x smaller than Phaser's ~1.2 MB).
- WebGL/WebGPU with Canvas fallback.

### Tile Bleeding
- No built-in tile bleeding prevention. Must handle manually (extrusion, texture settings).

### Community Examples
- No known LimeZu + PixiJS examples found.

### Deal-Breakers
- **PixiJS is a rendering library, not a game framework.** No built-in: scenes, physics, input handling, camera system, tilemap parsing, animation system, or audio.
- Would need to rebuild everything Phaser provides for free: scene management, camera with zoom/pan, tilemap layers, sprite animation system.
- The project already uses Phaser which is built on top of its own WebGL renderer. Switching to PixiJS means losing all game-specific functionality.

**Verdict: No advantage over Phaser for this use case.** The smaller bundle size does not justify losing all of Phaser's game framework features. Would be interesting only if Phaser's overhead was a problem (it isn't).

---

## 6. Kaboom.js / Kaplay

### LimeZu Integration
- Kaplay (the maintained community fork of the abandoned Kaboom.js) supports spritesheets with `sliceX`/`sliceY` options and sprite atlas loading.
- Tiled integration exists via community tutorials. Tile sizes of 16x16 are supported.
- `spriteAtlasPadding` option (added recently) helps with tile bleeding.

### Character Generator Spritesheets
- Can load spritesheets with Aseprite JSON format or manual slice definitions.
- Less mature animation system than Phaser.

### Web Browser Support
- Web-native JavaScript library. Lightweight.

### Tile Bleeding
- The `spriteAtlasPadding` option is a recent addition. Less battle-tested than Phaser's tile-extruder ecosystem.

### Community Examples
- No known LimeZu + Kaboom/Kaplay examples found.

### Deal-Breakers
- **Kaboom.js is abandoned** by Replit. Kaplay is a community fork that is maintained but has a smaller ecosystem.
- Less mature tilemap support than Phaser.
- Smaller community, fewer resources for troubleshooting.
- Would require a full rewrite with no clear benefit.

**Verdict: Not recommended.** Smaller and simpler than Phaser, but that simplicity becomes a disadvantage for a project that needs robust tilemap layers, camera systems, and animation management.

---

## 7. Other Notable Engines

### Excalibur.js
- TypeScript-native 2D game engine with a dedicated [Tiled plugin](https://excaliburjs.com/docs/tiled-plugin/) that parses TMX/TMJ/TSX/TSJ files.
- Built-in `pixelArt: true` mode with `pixelRatio` scaling for crisp pixel art.
- Smaller community than Phaser but actively maintained.
- **Interesting alternative** if starting from scratch, but no advantage over Phaser for an existing project.

### LittleJS
- Tiny HTML5 game engine (~6 KB) with pixel art support.
- Too minimal for this project's needs (tilemap layers, camera, animation system).

### GameMaker Studio
- LimeZu ships GameMaker Studio autotile files alongside Godot autotiles.
- **Not web-native.** HTML5 export exists but is a secondary target. Proprietary, paid.
- Not suitable for a web visualization project.

### Construct 3
- LimeZu's Serene Village pack includes Construct 3 autotiles.
- Browser-based editor. Can export to HTML5.
- Proprietary (subscription model). Visual scripting oriented.
- Not suitable for a code-driven, WebSocket-connected visualization.

---

## Comparison Matrix

| Criterion | Phaser 3 | RPG Maker MZ | Godot 4 | Unity | PixiJS | Kaplay | Excalibur |
|---|---|---|---|---|---|---|---|
| LimeZu tileset import | Manual (works) | Native MV files | Autotile files | Manual slice | Manual | Manual | Manual + Tiled |
| LimeZu Room Builder | Via Tiled JSON | Native but oversized | Autotile support | Manual | No tooling | Via Tiled | Via Tiled plugin |
| Character spritesheet (56x20) | `anims.create()` | Custom import | AnimatedSprite2D | Sprite Editor | Manual frames | `sliceX/Y` | SpriteSheet |
| Web browser (primary target) | Native | Limited HTML5 | WASM (5-40 MB) | WebGL (10-30 MB) | Native | Native | Native |
| Tile bleeding handling | tile-extruder; Phaser 4 fixes it | Built-in | Good with 2D preset | Sprite Atlas padding | Manual | spriteAtlasPadding | pixelArt mode |
| Bundle size | ~1.2 MB | Heavy runtime | 5-40 MB WASM | 10-30 MB | ~450 KB | ~200 KB | ~500 KB |
| Tiled map support | Built-in, first-class | Not applicable | Built-in | Plugin | Third-party | Community tutorial | Official plugin |
| Community LimeZu examples | a-dev-adventure-game | Many RPG Maker games | Forum discussions | Character Gen Tool | None found | None found | None found |
| Language | TypeScript | JavaScript (plugins) | GDScript/C# | C# | TypeScript | JavaScript | TypeScript |
| Rewrite required | No (current engine) | Yes (complete) | Yes (complete) | Yes (complete) | Yes (partial) | Yes (complete) | Yes (complete) |

---

## Recommendations

1. **Stay with Phaser 3** for the game engine. It is web-native, TypeScript-compatible, has built-in Tiled JSON support, proven LimeZu integration, and the existing codebase is already built on it.

2. **Adopt Tiled Map Editor** for designing the office layout. Export Tiled JSON, load in Phaser. The [a-dev-adventure-game](https://github.com/albert-gonzalez/a-dev-adventure-game) project proves this Phaser + Tiled + LimeZu stack works.

3. **Use tile-extruder** (`sporadic-labs/tile-extruder`) to solve tile bleeding. Add extrusion as a build step in the tileset generation pipeline.

4. **Watch Phaser 4** (in RC stage as of May 2025). It includes built-in bleed clamping for TilemapLayer, eliminating the need for tile extrusion entirely. Migration from Phaser 3 should be straightforward when v4 stabilizes.

5. **Reference Godot's autotile format** if considering future tooling improvements, but do not switch engines.

---

## Key Sources

- [LimeZu Modern Office](https://limezu.itch.io/modernoffice) - Asset pack page with engine compatibility notes
- [LimeZu Modern Interiors](https://limezu.itch.io/moderninteriors) - Main asset pack with character generator
- [a-dev-adventure-game](https://github.com/albert-gonzalez/a-dev-adventure-game) - Open source Phaser + Tiled + LimeZu Modern Interiors project
- [Modern Interiors Character Generation Tool](https://0a3r.itch.io/modern-interiors-character-generation-tool) - Unity-based tool for LimeZu character assembly
- [tile-extruder](https://github.com/sporadic-labs/tile-extruder) - Tile extrusion tool for Phaser bleeding fix
- [Godot Autotiles devlog](https://limezu.itch.io/modernexteriors/devlog/745267/328th-update-godot-autotiles-various-tweaks-1) - LimeZu's Godot autotile support
- [RPG Maker MV files devlog](https://limezu.itch.io/modernoffice/devlog/206327/update-12-rpg-maker-mv-files) - LimeZu's RPG Maker support
- [Godot Forums - LimeZu tilemap help](https://godotforums.org/d/27773-help-with-tilemap-creation-of-modern-interiors-set)
- [Phaser v4 RC4](https://phaser.io/news/2025/05/phaser-v4-release-candidate-4) - Phaser 4 with tile bleed clamping
- [Godot web export optimization](https://amann.dev/blog/2025/godot_web_size/) - Godot WASM size analysis

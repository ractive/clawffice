# Clawffice

A pixel art office game that visualizes Claude Code agents as characters from The Office. Built with Phaser 3, TypeScript, and Bun.

Agents connect via WebSocket and are assigned to characters (Michael, Dwight, Jim, Pam) who act out their activity in a top-down Dunder Mifflin office — idling, typing, sitting, and walking between desks.

![screenshot](screenshot.png)

## Requirements

- [Bun](https://bun.sh) for package management and script running
- [Tiled Map Editor](https://www.mapeditor.org/) CLI (v1.12+) for map export
- [LimeZu](https://limezu.itch.io) asset packs (Modern Office + Modern Interiors) in `./LimeZu/` for character sprite generation
- `DunderMifflin/` directory with the Fiverr-designed office TMX and LimeZu tileset sheets (gitignored — paid assets)

## Quick Start

```bash
bun install
bun run generate   # export map + build character sprites
bun run dev        # start dev server at http://localhost:8080
```

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start Vite dev server with hot reload |
| `bun run build` | Production build to `dist/` |
| `bun run check` | Run format + lint + typecheck + tests |
| `bun run generate` | Regenerate all assets (map + characters) |
| `bun run generate:map` | Export Tiled TMX → JSON + copy tileset PNGs |
| `bun run generate:characters` | Composite character sprites from LimeZu layers |

## Architecture

```
src/
  game/
    scenes/          Boot → Preloader → OfficeScene
    characters/      CharacterManager, OfficeCharacter (sprite + state)
    bridge/          AgentBridge (maps WebSocket events to character actions)
  network/           ClawSocketClient (WebSocket connection to Claude Code)

scripts/
  export-tiled-map.ts     Export DunderMifflin.tmx → JSON + copy 9 tilesets
  assemble-characters.ts  Composite 5-layer character sprites → Phaser atlas

public/assets/
  tiles/     office-map.json, 9 LimeZu tileset PNGs
  sprites/   characters.png, characters.json
```

## Asset Pipeline

### Map

The office map is a hand-crafted 56×30 tile Dunder Mifflin layout designed in Tiled Map Editor using 9 LimeZu tileset sheets and 8 tile layers (Ground through Above Player Details). The export script (`bun run generate:map`) converts the TMX source via the Tiled CLI, fixes tileset paths, and copies the PNGs to `public/assets/tiles/`. The exported assets are committed so the game runs out of the box.

### Characters

Character sprites are composited from LimeZu's 5-layer character generator system:

**Body → Eyes → Outfit → Hairstyle → Accessory**

Each character has hand-picked layers to match their Office counterpart (e.g., Dwight gets mustard shirt + glasses). The pipeline extracts specific animation frames (idle-sit, typing, walk-down) into a compact Phaser atlas.

The LimeZu source asset packs in `./LimeZu/` are gitignored (purchase from [limezu.itch.io](https://limezu.itch.io)).

## Art Credits

All pixel art assets by [LimeZu](https://limezu.itch.io) — Modern Office + Modern Interiors packs. LimeZu creates amazing pixel art full-time. If you like what you see, consider supporting him:

- [itch.io](https://limezu.itch.io) — buy the asset packs
- [Patreon](https://www.patreon.com/limezu) — monthly support with early access to new sprites

## License

MIT

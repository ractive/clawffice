# Clawffice

A pixel art office game that visualizes Claude Code agents as characters from The Office. Built with Phaser 3, TypeScript, and Bun.

Agents connect via WebSocket and are assigned to characters (Michael, Dwight, Jim, Pam) who act out their activity in a top-down Dunder Mifflin office — idling, typing, sitting, and walking between desks.

![screenshot](screenshot.png)

## Requirements

- [Bun](https://bun.sh) for package management and script running
- [LimeZu](https://limezu.itch.io) asset packs (Modern Office + Modern Interiors) in `./LimeZu/` for asset generation

## Quick Start

```bash
bun install
bun run generate   # build tileset, tilemap, and character sprites from LimeZu assets
bun run dev        # start dev server at http://localhost:8080
```

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start Vite dev server with hot reload |
| `bun run build` | Production build to `dist/` |
| `bun run check` | Run format + lint + typecheck + tests |
| `bun run generate` | Regenerate all assets (tileset, tilemap, characters) |
| `bun run generate:tileset` | Extract tiles from LimeZu sheets into game tileset |
| `bun run generate:tilemap` | Generate Tiled-compatible office map JSON |
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
  build-tileset.ts        Extract tiles from LimeZu source sheets → PNG + JSON
  generate-tilemap.ts     Generate 30x24 Tiled-compatible office map
  assemble-characters.ts  Composite 5-layer character sprites → Phaser atlas

public/assets/
  tiles/     office-tileset.png, office-tileset.json, office-map.json
  sprites/   characters.png, characters.json
```

## Asset Pipeline

Character sprites are composited from LimeZu's 5-layer character generator system:

**Body → Eyes → Outfit → Hairstyle → Accessory**

Each character has hand-picked layers to match their Office counterpart (e.g., Dwight gets mustard shirt + glasses). The pipeline extracts specific animation frames (idle-sit, typing, walk-down) into a compact Phaser atlas.

The tileset pipeline extracts individual tiles from multiple LimeZu source sheets (office furniture, Room Builder walls/floors, kitchen items) into a single 512x128 tileset with collision metadata.

Both pipelines require the LimeZu asset packs in `./LimeZu/` (gitignored — purchase from [limezu.itch.io](https://limezu.itch.io)).

## Art Credits

All pixel art assets by [LimeZu](https://limezu.itch.io) — Modern Office + Modern Interiors packs. LimeZu creates amazing pixel art full-time. If you like what you see, consider supporting him:

- [itch.io](https://limezu.itch.io) — buy the asset packs
- [Patreon](https://www.patreon.com/limezu) — monthly support with early access to new sprites

## License

MIT

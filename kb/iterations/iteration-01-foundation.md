---
title: Iteration 01 — Foundation
type: iteration
status: in-progress
tags:
  - iteration
  - foundation
date: 2026-04-03
---

# Iteration 01 — Foundation

**Goal:** A working game showing a small office with 4 characters whose states update from live claw-socket data.

## Shared Setup (main agent)

- [x] Install dev dependencies: `@napi-rs/canvas`, `sharp`, `free-tex-packer-core`, `biome`
- [x] Add `scripts` to tsconfig paths and package.json scripts
- [x] Create directory structure: `public/assets/{tiles,sprites,ui}`, `scripts/`
- [x] Add `typecheck` and `check` scripts to package.json

## Pixel Artist Tasks

### Tileset Generation (`scripts/generate-tileset.ts`)
- [x] Create base tile palette (32×32): carpet, wall, glass wall, door, kitchen tile, annex carpet
- [x] Create furniture tiles: desk (2×1 or 2×2 with monitor), office chair, bookshelf, filing cabinet, plant, reception desk
- [x] Create props: copier, vending machine, water cooler, coffee maker
- [x] Pack all tiles into a single tileset PNG + metadata
- [x] Output: `public/assets/tiles/office-tileset.png`

### Tilemap Generation (`scripts/generate-tilemap.ts`)
- [x] Build small starter office in Tiled JSON format: Michael's office, reception, bullpen (4 desks), break room
- [x] Use zone-based data structure (room definitions → stamped onto map)
- [x] Include layers: Floor, Walls (collision), Furniture, FurnitureTop, Spawns (object layer)
- [x] Define spawn points for 4 characters with custom properties
- [x] Output: `public/assets/tiles/office-map.json`

### Character Sprites (`scripts/generate-characters.ts`)
- [x] Create 4 character spritesheets (32×48): Michael, Dwight, Jim, Pam
- [x] Each character needs: idle-sit (2 frames), typing (3 frames), walk-down (4 frames)
- [x] Distinguish characters by hair color/style, clothing color, accessories (Dwight's glasses)
- [x] Pack into atlas with Phaser3-compatible JSON
- [x] Output: `public/assets/sprites/characters.png` + `characters.json`

## Game Developer Tasks

### Project Setup
- [x] Clean up template boilerplate (remove default scenes content)
- [x] Set game config: 1024×768, pixel art rendering (pixelArt: true, roundPixels: true)
- [x] Create scene flow: Boot → Preloader → OfficeScene

### WebSocket Client (`src/network/`)
- [x] Create `ClawSocketClient` class — connects to `ws://localhost:3838`, handles reconnection
- [x] Parse snapshot, subscribe to `["agent.*", "tool.*", "session.*"]`
- [x] Emit typed events for agent state changes
- [x] Create TypeScript interfaces matching claw-socket API schemas
- [x] Support offline/demo mode with mock data when claw-socket unavailable

### Tilemap Loading (`src/game/scenes/OfficeScene.ts`)
- [x] Load tileset + tilemap in preload
- [x] Create layers with proper depth ordering
- [x] Set up collision on wall layer
- [x] Set camera bounds and zoom controls (mouse wheel)
- [x] Read spawn points from object layer

### Character System (`src/game/characters/`)
- [x] `OfficeCharacter` class: wraps Phaser.Sprite, handles animations, state transitions
- [x] `CharacterManager`: maps agentId → character, assigns agents to Office characters
- [x] Spawn characters at positions from tilemap spawn points
- [x] Animate based on agent status: working→typing, idle→sit-idle, tool_running→typing-fast
- [x] Y-depth sorting each frame

### State Bridge (`src/game/bridge/`)
- [x] `AgentBridge`: listens to ClawSocketClient events, updates CharacterManager
- [x] Main agent → Michael Scott
- [x] Subagents → assigned to next available character (Dwight, Jim, Pam in order)
- [x] Handle agent start/stop (character appears/disappears)

## Definition of Done
- [x] `bun run dev` shows the office with 4 character sprites at their desks
- [x] Characters animate between idle/typing when connected to a live claw-socket
- [x] Demo mode works when claw-socket is not running (mock agent activity)
- [x] Camera zoom with mouse wheel works
- [x] `bun run check` passes (format + typecheck + tests)
- [x] Architecture supports adding more rooms/characters without refactoring

## Agent Assignments

| Task Group | Agent |
|-----------|-------|
| Tileset, tilemap, character sprite generation | **pixel-artist** |
| Phaser scenes, WebSocket, character system, bridge | **game-developer** |

Agents can work **in parallel** — pixel-artist outputs to `public/assets/`, game-developer consumes from there. Game-developer should create placeholder/fallback assets initially so it doesn't block on pixel-artist output.

---
title: "Decision Log"
type: decisions
tags: [decisions, architecture]
---

# Decision Log

## 2026-04-03: Project Kickoff — Clawffice

**Context:** Visualize Claude Code agents working in a pixel art top-down office themed as "The Office" (US TV show).

**Tech stack:**
- Phaser 3 (already scaffolded via `bun create @phaserjs/game@latest`)
- Bun runtime
- TypeScript
- claw-socket WebSocket API for real-time agent data

**Core concept:**
- The office layout resembles Dunder Mifflin Scranton branch
- Michael Scott = master/main agent (the boss)
- Other characters = subagents doing work
- Agent status maps to character animations
- Tool usage maps to visual activities

**Art style:** Pixel art, top-down view, similar to RPG Maker / Stardew Valley office scenes. 32×32 tile grid, 32×48 characters.

## 2026-04-03: Tile Size — 32×32

**Decision:** Use 32×32 tiles (not 16×16) for more detail per tile.
Characters are 32×48 for the taller top-down RPG look.

## 2026-04-03: Asset Generation — Programmatic with @napi-rs/canvas

**Decision:** Generate all pixel art assets programmatically (no external art tools, no AI generation).

**Tooling:**
- `@napi-rs/canvas` — primary drawing (Canvas 2D API)
- `sharp` — post-processing
- `free-tex-packer-core` — spritesheet packing with Phaser3 JSON export

**Why:** No usable open-source Office character sprites exist. Paid itch.io packs can't be redistributed. AI generation is inconsistent at 32px scale. Procedural code is deterministic and gives full control.

## 2026-04-03: Tilemap Architecture — Zone-Based Composition

**Decision:** Define office as a collection of room data objects stamped onto a single blank Phaser tilemap.

**Why:** Must be extensible from small (4-room starter) to large (full Dunder Mifflin) without refactoring. Single tilemap keeps coordinate system and collision simple. Room data is pure JSON config.

See [[research/phaser-tilemap-architecture]] for details.

## 2026-04-03: Agent Specialization — Two Custom Agents

**Decision:** Two agents for parallel development:
- `game-developer` — all Phaser code, WebSocket, scenes, characters
- `pixel-artist` — all art assets via canvas scripts

**Why:** Genuinely independent outputs (code vs. assets). Loosely coupled via `public/assets/` directory.

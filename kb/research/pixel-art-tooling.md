---
title: "Pixel Art Tooling Research"
type: research
tags: [research, tooling, pixel-art, assets]
date: 2026-04-03
---

# Pixel Art Generation Tooling

## Recommended Stack

| Package | Purpose | Install |
|---------|---------|---------|
| `@napi-rs/canvas` | Primary drawing — full Canvas 2D API via Skia/NAPI | `bun add -d @napi-rs/canvas` |
| `sharp` | Post-processing, compositing, format conversion | `bun add -d sharp` |
| `free-tex-packer-core` | Spritesheet packing with Phaser 3 JSON export | `bun add -d free-tex-packer-core` |

All confirmed working with Bun runtime.

## Why These?

### @napi-rs/canvas
- Full Canvas 2D API (fillRect, arc, bezier, paths, text)
- Natural interface for procedural pixel art
- Outputs PNG buffers directly
- MIT license, actively maintained

### sharp
- High-performance image manipulation (libvips)
- Great for compositing sprites into sheets, palette work
- Apache-2.0 license

### free-tex-packer-core
- Built-in `Phaser3` exporter — outputs exact atlas JSON Phaser expects
- Handles padding, trim, packing algorithms
- MIT license

## Tilemap Generation
No library needed — Tiled JSON is plain JSON. Write a TypeScript helper to generate it directly (~30 lines). Optionally use `@kayahr/tiled` for TypeScript types.

## AI Art Generation — Not Recommended
- Inconsistent style/palette across generations
- Can't produce tileable assets reliably
- 32×32 is too small for current AI models
- Procedural code generation is more deterministic and consistent

## Workflow
1. **Draw** individual tiles (32×32) and character frames (32×48) with `@napi-rs/canvas`
2. **Pack** into spritesheets/atlases with `free-tex-packer-core` (Phaser3 exporter)
3. **Generate** Tiled JSON tilemaps with plain TypeScript
4. **Post-process** with `sharp` if needed (palette reduction, compositing)

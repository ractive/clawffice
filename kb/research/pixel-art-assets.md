---
title: "Pixel Art Asset Research"
type: research
tags: [research, assets, pixel-art, licensing]
date: 2026-04-03
---

# Pixel Art Asset Research

## The Office Character Sprites — Nothing Usable

No game-ready sprite sheets of The Office characters exist. All fan art found is:
- **Static images only** (no animations, no sprite sheets)
- **Standard copyright** — not licensed for reuse
- Found on DeviantArt, PixelJoint, Tumblr — all individual artist copyright

Even if sprites existed, The Office characters are **NBC/Universal IP** — using recognizable likenesses is a trademark/copyright concern regardless.

## Open Source Compatible Assets

### Office Worker Sprites (OpenGameArt) — CC-BY 4.0
- URL: https://opengameart.org/content/office-worker-sprites
- 4 office worker characters with walking, typing, printing, drinking animations
- 16×16 per frame (small — would need upscaling or redrawing for 32×32)
- **Usable with attribution**

### Pixel Worker Fukushima (OpenGameArt) — CC0 Public Domain
- URL: https://opengameart.org/content/pixel-worker-sprite-fukushima
- Worker character, 4-directional walking + working animations
- **Fully usable, no restrictions**

## Paid Packs (Cannot Redistribute in Open Source Repo)

| Pack | Price | Notes |
|------|-------|-------|
| LimeZu Modern Office (itch.io) | $2.50 | 300+ office furniture sprites, 16/32/48px. No characters. |
| LimeZu Modern Interiors (itch.io) | $1.50+ | Huge set + character generator. Office theme included. |
| Donarg Office Interior (itch.io) | $2.00 | Office objects, 16/32/48px. No characters. |
| GandalfHardcore NPC Pack (itch.io) | $8.99 | 63+ modern characters at 64×64 with animations. |
| Serial RPG Character Pack (itch.io) | $2.50+ | 29 characters at 32×32 including businessman type. |

All paid packs: **commercial use OK but CANNOT redistribute** — not viable for an open source repo.

## Recommendation

**Generate our own pixel art programmatically.** This is the cleanest approach because:
1. No licensing issues
2. Characters can be customized to resemble Office characters (hair, clothing colors) without directly copying IP
3. The pixel-artist agent can generate these via canvas scripts
4. We maintain full control over the art style and animation frames

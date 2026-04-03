---
title: "Phaser Tilemap Architecture"
type: research
tags: [research, architecture, phaser, tilemap, extensibility]
date: 2026-04-03
---

# Phaser 3 Tilemap Architecture for Extensibility

## Core Approach: Zone-Based Composition

Define the office as a collection of rooms (zones), each a self-contained data unit stamped onto a single large tilemap.

### Room Definition Data Structure
```typescript
interface RoomDefinition {
  id: string;                    // 'michaels-office', 'bullpen', 'kitchen'
  tilemapKey: string;            // key for tile data
  gridPosition: { x: number; y: number }; // position in tiles
  size: { width: number; height: number }; // size in tiles
  connections: ConnectionPoint[];
}
```

### Strategy: Single Blank Tilemap, Stamp Rooms
- Create one oversized blank tilemap
- Stamp each room's tile data using `putTilesAt()`
- To grow: add rooms to config, re-stamp
- Simple coordinate system, easy collision

## Layer Stack (bottom to top)
1. **Floor** — carpet, tile, hardwood
2. **FloorDecor** — rugs, cables, stains
3. **Walls** — walls, partitions, windows (collision)
4. **Furniture** — static desks, shelves, cabinets
5. **FurnitureTop** — monitors, papers on desks
6. **Spawns** (object layer) — agent spawn points
7. **Zones** (object layer) — interaction zones, room boundaries

Characters render between Furniture and FurnitureTop via depth sorting.

## Camera
- `setBounds()` to match tilemap size
- Mouse wheel zoom (clamp 0.5–2.0)
- Recalculate bounds on zoom change
- Optional: follow selected character

## Key Phaser APIs
- `this.make.tilemap({ key })` — load Tiled JSON
- `map.createBlankLayer()` — create empty layer
- `map.putTilesAt()` — stamp room data
- `map.putTileAt()` / `removeTileAt()` — runtime edits
- `layer.setCollisionByProperty()` — collision from Tiled props
- `map.getObjectLayer().objects` — read spawn/zone data
- Depth sorting: `sprite.setDepth(sprite.y)` updated each frame

## Tiled JSON Format Summary
- `data[]` is flat 1D array (row-major), length = width × height
- Tile index 0 = empty/no tile
- `firstgid` in tilesets maps global IDs
- Object layers use pixel coordinates (not tile)
- Custom properties on tiles, layers, objects all readable

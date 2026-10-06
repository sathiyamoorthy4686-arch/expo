# 🗺️ Labyrinth Grid Matrix Encoding Standards

## 1. Overview
The **AI Treasure Escape** engine uses a discrete 2D grid matrix system to define maze geometry, collision geometry, pathfinding graphs, and procedural entity placement.

Both the **Web Client (HTML5 Canvas / JS)** and **Desktop Engine (Python / Pygame)** adhere strictly to identical matrix encodings and coordinate conversion standards.

---

## 2. Cell Encoding Standards

| Value | Cell Type | Description | Collision Property |
|---|---|---|---|
| `0` | **Walkable Corridor** | Floor tile with high-tech subgrid inset patterns & ambient light dot | Non-blocking (`collision: false`) |
| `1` | **Solid Wall** | Pure white cybernetic barrier with corner beveling and neighbor-aware rounding | Blocking (`collision: true`) |

---

## 3. Coordinate System & Conversion

```
(0,0) ─────── +X (Cols) ───────>
  │
  │   Grid Tile (gx, gy) -> World Coordinates (wx, wy):
  │   wx = (gx + 0.5) * cellWidth
  │   wy = (gy + 0.5) * cellHeight
  ▼
+Y (Rows)
```

- **Grid to World Transformation**:
  $$\text{wx} = (\text{gx} + 0.5) \times \frac{\text{CanvasWidth}}{\text{Cols}}$$
  $$\text{wy} = (\text{gy} + 0.5) \times \frac{\text{CanvasHeight}}{\text{Rows}}$$
- **World to Clamped Grid Transformation**:
  $$\text{gx} = \text{clamp}\left(0, \text{Cols}-1, \left\lfloor \frac{\text{wx}}{\text{cellWidth}} \right\rfloor \right)$$
  $$\text{gy} = \text{clamp}\left(0, \text{Rows}-1, \left\lfloor \frac{\text{wy}}{\text{cellHeight}} \right\rfloor \right)$$

---

## 4. Multi-Level Roster & Dimensions

| Level | Name | Matrix Size | Difficulty | Enemy Speed | Par Time | Target Treasures |
|---|---|---|---|---|---|---|
| **Level 1** | Easy Explorer | `15 × 15` | Easy | 45 px/s | 45s | 6 |
| **Level 2** | Classic Expo | `17 × 17` | Medium | 55 px/s | 60s | 10 |
| **Level 3** | Adventurer Pass | `19 × 19` | Hard | 65 px/s | 75s | 14 |
| **Level 4** | Master Labyrinth | `21 × 21` | Expert | 75 px/s | 90s | 18 |
| **Level 5** | Impossible Core | `23 × 23` | Impossible | 85 px/s | 120s | 24 |

---

## 5. Procedural Treasure Placement Rules
Treasures are dynamically generated per level using topology classification:

1. **Dead-Ends** (walkable tiles with exactly 1 walkable neighbor):
   - Reserved for **Ancient Treasure Chests** (+100 pts) and **Royal Crowns** (+50 pts) in the deepest reaches.
2. **Junctions** (walkable tiles with $\ge 3$ walkable neighbors):
   - Populated with **Royal Crowns** and **Diamonds** (+10 pts).
3. **Corridors** (linear passages):
   - Evenly spaced **Gold Coins** (+20 pts) and **Diamonds** (+10 pts).
4. **Safety Zones**:
   - Immediate 1.8-tile radius around **Start Safe-Zone** and **Exit Portal** are guaranteed void of obstacle spawns.

---

## 6. Star Rating System
Upon reaching the exit portal, player performance is evaluated:
- ⭐ **1 Star**: Escape labyrinth safely.
- ⭐⭐ **2 Stars**: Escape labyrinth + collect $\ge 50\%$ of available treasures.
- ⭐⭐⭐ **3 Stars**: Escape labyrinth + collect $\ge 95\%$ of available treasures within par time.

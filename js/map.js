/**
 * LevelLoader & Dynamic Map Registry for AI Treasure Escape
 */
class LevelLoader {
  constructor() {
    this.levels = new Map();
  }

  registerLevel(levelIndex, levelDef) {
    this.levels.set(levelIndex, {
      id: levelIndex,
      name: levelDef.name || `Level ${levelIndex}`,
      subtitle: levelDef.subtitle || 'Labyrinth Adventure',
      cols: levelDef.grid[0].length,
      rows: levelDef.grid.length,
      grid: levelDef.grid.map(row => [...row]),
      startGrid: levelDef.startGrid || [1, 0],
      exitGrid: levelDef.exitGrid || [levelDef.grid[0].length - 2, levelDef.grid.length - 1],
      enemySpawnGrid: levelDef.enemySpawnGrid || [levelDef.grid[0].length - 2, 1],
      enemySpeed: levelDef.enemySpeed || 55.0,
      enemyGracePeriod: levelDef.enemyGracePeriod || 3.5,
      parTime: levelDef.parTime || 60,
      targetTreasures: levelDef.targetTreasures || 8,
      difficulty: levelDef.difficulty || 'Normal',
      theme: levelDef.theme || {
        bg: '#58b4e7',
        corridor: '#69c3f5',
        wall: '#ffffff',
        border: '#ffffff',
        accent: '#00f0ff'
      }
    });
  }

  getLevel(levelIndex) {
    if (this.levels.has(levelIndex)) {
      return this.levels.get(levelIndex);
    }
    // Fallback to level 1 or first available
    return this.levels.get(1) || Array.from(this.levels.values())[0];
  }

  getAllLevels() {
    return Array.from(this.levels.values());
  }

  getLevelCount() {
    return this.levels.size;
  }
}

const levelLoader = new LevelLoader();
window.levelLoader = levelLoader;


class Treasure {
  constructor(gx, gy, type, wx, wy) {
    this.gx = gx;
    this.gy = gy;
    this.x = wx;
    this.y = wy;
    this.type = type;
    this.collected = false;
    this.animOffset = Math.random() * Math.PI * 2;

    if (type === 'diamond') {
      this.value = 10;
      this.name = 'Diamond';
      this.color = '#00f0ff';
      this.sound = 'collect_diamond';
    } else if (type === 'coin') {
      this.value = 20;
      this.name = 'Gold Coin';
      this.color = '#ffd700';
      this.sound = 'collect_coin';
    } else if (type === 'crown') {
      this.value = 50;
      this.name = 'Royal Crown';
      this.color = '#ff50c8';
      this.sound = 'collect_crown';
    } else if (type === 'chest') {
      this.value = 100;
      this.name = 'Treasure Chest';
      this.color = '#ffa500';
      this.sound = 'collect_chest';
    }
  }

  update(dt) {
    this.animOffset += dt * 3;
  }

  draw(ctx) {
    if (this.collected) return;
    const bob = Math.sin(this.animOffset) * 3.5;
    const px = this.x;
    const py = this.y + bob;

    // Soft drop shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(px, this.y + 8, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.type === 'diamond') {
      ctx.fillStyle = '#00f0ff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, py - 9);
      ctx.lineTo(px + 8, py - 2);
      ctx.lineTo(px, py + 9);
      ctx.lineTo(px - 8, py - 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Top facet shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.moveTo(px, py - 9);
      ctx.lineTo(px + 4, py - 2);
      ctx.lineTo(px, py + 2);
      ctx.lineTo(px - 4, py - 2);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'coin') {
      ctx.fillStyle = '#ffd700';
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#b8860b';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', px, py);
    } else if (this.type === 'crown') {
      ctx.fillStyle = '#ffd700';
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px - 9, py + 5);
      ctx.lineTo(px - 8, py - 4);
      ctx.lineTo(px - 3, py - 1);
      ctx.lineTo(px, py - 7);
      ctx.lineTo(px + 3, py - 1);
      ctx.lineTo(px + 8, py - 4);
      ctx.lineTo(px + 9, py + 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Jewels
      ctx.fillStyle = '#ff2b56';
      ctx.beginPath();
      ctx.arc(px, py - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'chest') {
      ctx.fillStyle = '#9c5221';
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(px - 10, py - 7, 20, 14, 3);
      ctx.fill();
      ctx.stroke();

      // Lock
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

class GameMap {
  constructor(canvasWidth, canvasHeight, level = 1) {
    this.w = canvasWidth;
    this.h = canvasHeight;
    this.level = level;
    this.cols = 17;
    this.rows = 17;
    this.grid = ORIGINAL_MAZE.map(row => [...row]);
    this.cellW = this.w / this.cols;
    this.cellH = this.h / this.rows;

    this.startGrid = [4, 0];
    this.exitGrid = [12, 16];

    this.startWorld = this.gridToWorld(4, 0.4);
    this.exitWorld = this.gridToWorld(12, 15.6);

    if (level === 1) {
      this.enemySpawnGrid = [15, 1];
    } else if (level === 2) {
      this.enemySpawnGrid = [1, 15];
    } else {
      this.enemySpawnGrid = [15, 7];
    }
    this.enemySpawnWorld = this.gridToWorld(...this.enemySpawnGrid);

    this.treasures = [];
    this.spawnTreasures();
  }

  gridToWorld(gx, gy) {
    return [
      (gx + 0.5) * this.cellW,
      (gy + 0.5) * this.cellH
    ];
  }

  worldToGrid(wx, wy) {
    let gx = Math.floor(wx / this.cellW);
    let gy = Math.floor(wy / this.cellH);
    gx = Math.max(0, Math.min(this.cols - 1, gx));
    gy = Math.max(0, Math.min(this.rows - 1, gy));
    return [gx, gy];
  }

  checkCollision(wx, wy, radius) {
    const minGx = Math.floor((wx - radius) / this.cellW);
    const maxGx = Math.floor((wx + radius) / this.cellW);
    const minGy = Math.floor((wy - radius) / this.cellH);
    const maxGy = Math.floor((wy + radius) / this.cellH);

    // Bounds check
    if (wx - radius < 0 || wx + radius > this.w) return true;
    if (wy - radius < 0 && !(minGx <= this.startGrid[0] && this.startGrid[0] <= maxGx)) return true;
    if (wy + radius > this.h && !(minGx <= this.exitGrid[0] && this.exitGrid[0] <= maxGx)) return true;

    for (let gy = Math.max(0, minGy); gy <= Math.min(this.rows - 1, maxGy); gy++) {
      for (let gx = Math.max(0, minGx); gx <= Math.min(this.cols - 1, maxGx); gx++) {
        if (this.grid[gy][gx] === 1) {
          const rx = gx * this.cellW;
          const ry = gy * this.cellH;
          const rw = this.cellW;
          const rh = this.cellH;

          const cx = Math.max(rx, Math.min(wx, rx + rw));
          const cy = Math.max(ry, Math.min(wy, ry + rh));

          const distSq = (wx - cx) ** 2 + (wy - cy) ** 2;
          if (distSq < (radius * 0.92) ** 2) {
            return true;
          }
        }
      }
    }
    return false;
  }

  spawnTreasures() {
    this.treasures = [];
    const candidates = [
      [1, 1, 'diamond'],
      [3, 3, 'coin'],
      [9, 1, 'coin'],
      [15, 3, 'diamond'],
      [7, 5, 'chest'],
      [13, 5, 'coin'],
      [3, 7, 'crown'],
      [11, 7, 'diamond'],
      [1, 9, 'coin'],
      [7, 9, 'chest'],
      [15, 9, 'diamond'],
      [3, 11, 'crown'],
      [9, 11, 'coin'],
      [13, 11, 'diamond'],
      [1, 13, 'coin'],
      [7, 13, 'crown'],
      [15, 13, 'chest'],
      [3, 15, 'diamond'],
      [9, 15, 'coin']
    ];

    let selected = [];
    if (this.level === 1) {
      selected = [0, 2, 4, 6, 8, 11, 14, 16].map(i => candidates[i]);
    } else if (this.level === 2) {
      selected = [0, 1, 2, 4, 5, 6, 8, 10, 11, 14, 15, 16].map(i => candidates[i]);
    } else {
      selected = candidates.slice(0, 16);
    }

    selected.forEach(([gx, gy, type]) => {
      const [wx, wy] = this.gridToWorld(gx, gy);
      this.treasures.push(new Treasure(gx, gy, type, wx, wy));
    });
  }

  draw(ctx, animTime = 0) {
    // 1. Draw base sky/ocean maze
    ctx.fillStyle = '#58b4e7';
    ctx.fillRect(0, 0, this.w, this.h);

    // 2. Draw subtle corridor textures
    ctx.fillStyle = '#69c3f5';
    for (let gy = 0; gy < this.rows; gy++) {
      for (let gx = 0; gx < this.cols; gx++) {
        if (this.grid[gy][gx] === 0) {
          ctx.beginPath();
          ctx.roundRect(gx * this.cellW + 2, gy * this.cellH + 2, this.cellW - 4, this.cellH - 4, 4);
          ctx.fill();
        }
      }
    }

    // 3. Draw Crisp Solid White Walls
    ctx.fillStyle = '#ffffff';
    for (let gy = 0; gy < this.rows; gy++) {
      for (let gx = 0; gx < this.cols; gx++) {
        if (this.grid[gy][gx] === 1) {
          ctx.fillRect(
            Math.floor(gx * this.cellW),
            Math.floor(gy * this.cellH),
            Math.ceil(this.cellW),
            Math.ceil(this.cellH)
          );
        }
      }
    }

    // Outer border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, this.w, this.h);

    // 4. Draw START Portal & Badge
    const [sx, sy] = this.startWorld;
    const startPulse = 180 + 75 * Math.sin(animTime * 5.0);
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${startPulse / 255})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00e6b4';
    ctx.beginPath();
    ctx.arc(sx, sy, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('START', sx, sy - 20);
    ctx.restore();

    // 5. Draw EXIT Portal & Badge
    const [ex, ey] = this.exitWorld;
    const exitPulse = 180 + 75 * Math.cos(animTime * 5.0);
    ctx.save();
    ctx.fillStyle = `rgba(255, 215, 0, ${exitPulse / 255})`;
    ctx.beginPath();
    ctx.arc(ex, ey, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex, ey, 13, 0, Math.PI * 2);
    ctx.fill();

    // Checkered center
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(ex - 6, ey - 6, 6, 6);
    ctx.fillRect(ex, ey, 6, 6);

    ctx.fillStyle = '#ffe650';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏁 EXIT', ex, ey + 24);
    ctx.restore();

    // 6. Draw Treasures
    this.treasures.forEach(tr => tr.draw(ctx));
  }
}

window.GameMap = GameMap;
window.Treasure = Treasure;

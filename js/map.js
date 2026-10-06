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

// Level 1: Easy Explorer (15x15) - Spacious beginner-friendly layout with gentle turns
levelLoader.registerLevel(1, {
  name: 'Easy Explorer',
  subtitle: 'Stage 1: Sunlit Corridors',
  difficulty: 'Easy',
  enemySpeed: 45.0,
  enemyGracePeriod: 4.0,
  parTime: 45,
  targetTreasures: 6,
  startGrid: [2, 0],
  exitGrid: [12, 14],
  enemySpawnGrid: [13, 1],
  grid: [
    [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 0: Start at (2,0)
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1], // 1
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1], // 2
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1], // 3
    [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1], // 4
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1], // 5
    [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1], // 6
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1], // 7
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1], // 8
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1], // 9
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1], // 10
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 11
    [1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1], // 12
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 13
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1]  // 14: Exit at (12,14)
  ]
});

// Level 2: Classic Expo Labyrinth (17x17) - Authentic Science Expo layout with balanced loops
levelLoader.registerLevel(2, {
  name: 'Classic Expo',
  subtitle: 'Stage 2: The Original Labyrinth',
  difficulty: 'Medium',
  enemySpeed: 55.0,
  enemyGracePeriod: 3.5,
  parTime: 60,
  targetTreasures: 10,
  startGrid: [4, 0],
  exitGrid: [12, 16],
  enemySpawnGrid: [15, 1],
  grid: [
    [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 0: Start at (4,0)
    [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1], // 1
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1], // 2
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1], // 3
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1], // 4
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1], // 5
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1], // 6
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1], // 7
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1], // 8
    [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1], // 9
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1], // 10
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1], // 11
    [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1], // 12
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], // 13
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1], // 14
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1], // 15
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1]  // 16: Exit at (12,16)
  ]
});

// Level 3: Adventurer Multi-Path (19x19) - Dynamic branching corridors with tactical shortcuts
levelLoader.registerLevel(3, {
  name: 'Adventurer Pass',
  subtitle: 'Stage 3: Multi-Path Chambers',
  difficulty: 'Hard',
  enemySpeed: 65.0,
  enemyGracePeriod: 3.0,
  parTime: 75,
  targetTreasures: 14,
  startGrid: [2, 0],
  exitGrid: [16, 18],
  enemySpawnGrid: [17, 1],
  grid: [
    [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 0: Start at (2,0)
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1], // 1
    [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1], // 2
    [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], // 3
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1], // 4
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1], // 5
    [1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1], // 6
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], // 7
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1], // 8
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1], // 9: Center Chamber
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1], // 10
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], // 11
    [1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1], // 12
    [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1], // 13
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1], // 14
    [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1], // 15
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1], // 16
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1], // 17
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1]  // 18: Exit at (16,18)
  ]
});

// Level 4: Master Complex Labyrinth (21x21) - Dense intricate maze with misleading dead-ends
levelLoader.registerLevel(4, {
  name: 'Master Labyrinth',
  subtitle: 'Stage 4: Labyrinth of Illusions',
  difficulty: 'Expert',
  enemySpeed: 75.0,
  enemyGracePeriod: 2.5,
  parTime: 90,
  targetTreasures: 18,
  startGrid: [2, 0],
  exitGrid: [18, 20],
  enemySpawnGrid: [19, 1],
  grid: [
    [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 0: Start at (2,0)
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1], // 1
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1], // 2
    [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1], // 3
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1], // 4
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], // 5
    [1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1], // 6
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], // 7
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1], // 8
    [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1], // 9
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1], // 10
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1], // 11
    [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1], // 12
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1], // 13
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1], // 14
    [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1], // 15
    [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1], // 16
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1], // 17
    [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1], // 18
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 19
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1]  // 20: Exit at (18,20)
  ]
});

// Level 5: Impossible Challenge Maze (23x23) - Ultimate Science Expo grand championship labyrinth
levelLoader.registerLevel(5, {
  name: 'Impossible Core',
  subtitle: 'Stage 5: The Grand Sovereign Vault',
  difficulty: 'Impossible',
  enemySpeed: 85.0,
  enemyGracePeriod: 2.0,
  parTime: 120,
  targetTreasures: 24,
  startGrid: [2, 0],
  exitGrid: [20, 22],
  enemySpawnGrid: [21, 1],
  grid: [
    [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 0: Start at (2,0)
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1], // 1
    [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1], // 2
    [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1], // 3
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1], // 4
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], // 5
    [1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1], // 6
    [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], // 7
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1], // 8
    [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1], // 9
    [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1], // 10
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1], // 11
    [1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1], // 12
    [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1], // 13
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1], // 14
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1], // 15
    [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1], // 16
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1], // 17
    [1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1], // 18
    [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1], // 19
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1], // 20
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 21
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1]  // 22: Exit at (20,22)
  ]
});






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
      const scale = 1.0 + 0.08 * Math.sin(this.animOffset * 2.0);
      const dw = 9 * scale;
      const dh = 11 * scale;

      // Outer cyan aura glow
      ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(px, py, dw + 4, 0, Math.PI * 2);
      ctx.fill();

      // Diamond lower cone
      ctx.fillStyle = '#00c8e6';
      ctx.beginPath();
      ctx.moveTo(px - dw, py - 2);
      ctx.lineTo(px, py + dh);
      ctx.lineTo(px + dw, py - 2);
      ctx.closePath();
      ctx.fill();

      // Diamond upper table
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(px - dw, py - 2);
      ctx.lineTo(px - dw * 0.5, py - dh * 0.7);
      ctx.lineTo(px + dw * 0.5, py - dh * 0.7);
      ctx.lineTo(px + dw, py - 2);
      ctx.closePath();
      ctx.fill();

      // Front center facet
      ctx.fillStyle = '#80faff';
      ctx.beginPath();
      ctx.moveTo(px - dw * 0.5, py - dh * 0.7);
      ctx.lineTo(px + dw * 0.5, py - dh * 0.7);
      ctx.lineTo(px + dw * 0.3, py - 2);
      ctx.lineTo(px, py + dh * 0.75);
      ctx.lineTo(px - dw * 0.3, py - 2);
      ctx.closePath();
      ctx.fill();

      // Specular gleam highlight
      const gleam = (Math.sin(this.animOffset * 4.0) + 1.0) * 0.5;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + 0.6 * gleam})`;
      ctx.beginPath();
      ctx.arc(px - dw * 0.3, py - dh * 0.3, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();
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
    
    // Load dynamic level configuration from LevelLoader
    const levelData = window.levelLoader ? window.levelLoader.getLevel(level) : null;
    if (levelData) {
      this.levelData = levelData;
      this.cols = levelData.cols;
      this.rows = levelData.rows;
      this.grid = levelData.grid.map(row => [...row]);
      this.startGrid = [...levelData.startGrid];
      this.exitGrid = [...levelData.exitGrid];
      this.enemySpawnGrid = [...levelData.enemySpawnGrid];
      this.theme = levelData.theme;
      this.enemySpeed = levelData.enemySpeed;
      this.enemyGracePeriod = levelData.enemyGracePeriod;
    } else {
      this.cols = 17;
      this.rows = 17;
      this.grid = [];
      this.startGrid = [4, 0];
      this.exitGrid = [12, 16];
      this.enemySpawnGrid = [15, 1];
    }

    this.cellW = this.w / this.cols;
    this.cellH = this.h / this.rows;

    // Dynamically calculate world coordinates for customizable start and exit portals
    this.startWorld = this.gridToWorld(this.startGrid[0], this.startGrid[1] === 0 ? 0.45 : this.startGrid[1] + 0.5);
    this.exitWorld = this.gridToWorld(this.exitGrid[0], this.exitGrid[1] === this.rows - 1 ? this.rows - 0.55 : this.exitGrid[1] + 0.5);
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
    const walkableTiles = [];
    const deadEnds = [];
    const junctions = [];
    const corridors = [];

    const startGx = this.startGrid[0];
    const startGy = this.startGrid[1];
    const exitGx = this.exitGrid[0];
    const exitGy = this.exitGrid[1];

    // 1. Classify all walkable floor tiles
    for (let gy = 1; gy < this.rows - 1; gy++) {
      for (let gx = 1; gx < this.cols - 1; gx++) {
        if (this.grid[gy][gx] === 0) {
          // Exclude safe start zone & exit zone
          const dStart = Math.hypot(gx - startGx, gy - startGy);
          const dExit = Math.hypot(gx - exitGx, gy - exitGy);
          if (dStart < 1.8 || dExit < 1.8) continue;

          // Count walkable neighbors (cardinal)
          let neighbors = 0;
          if (this.grid[gy - 1]?.[gx] === 0) neighbors++;
          if (this.grid[gy + 1]?.[gx] === 0) neighbors++;
          if (this.grid[gy]?.[gx - 1] === 0) neighbors++;
          if (this.grid[gy]?.[gx + 1] === 0) neighbors++;

          const tileInfo = { gx, gy, neighbors, dStart, dExit };
          walkableTiles.push(tileInfo);

          if (neighbors === 1) {
            deadEnds.push(tileInfo);
          } else if (neighbors >= 3) {
            junctions.push(tileInfo);
          } else {
            corridors.push(tileInfo);
          }
        }
      }
    }

    const targetCount = this.levelData?.targetTreasures || 8;
    const selected = [];
    const usedKeys = new Set();

    const addPlacement = (tile, type) => {
      const key = `${tile.gx},${tile.gy}`;
      if (!usedKeys.has(key)) {
        usedKeys.add(key);
        selected.push({ gx: tile.gx, gy: tile.gy, type });
      }
    };

    // 2. High-value chests in the deepest dead-ends
    deadEnds.sort((a, b) => b.dStart - a.dStart);
    deadEnds.forEach((de, idx) => {
      if (selected.length < targetCount) {
        const type = idx % 2 === 0 ? 'chest' : 'crown';
        addPlacement(de, type);
      }
    });

    // 3. Royal Crowns & Diamonds in key junctions
    junctions.sort((a, b) => (b.dStart + b.dExit) - (a.dStart + a.dExit));
    junctions.forEach((junc, idx) => {
      if (selected.length < targetCount) {
        const type = idx % 2 === 0 ? 'crown' : 'diamond';
        addPlacement(junc, type);
      }
    });

    // 4. Gold Coins & Diamonds along corridors with even spacing
    corridors.sort((a, b) => (Math.sin(a.gx * 3.7 + a.gy * 5.1) - Math.sin(b.gx * 3.7 + b.gy * 5.1)));
    corridors.forEach((corr, idx) => {
      if (selected.length < targetCount) {
        // Enforce minimal spacing between treasures
        const tooClose = selected.some(s => Math.hypot(s.gx - corr.gx, s.gy - corr.gy) < 2.0);
        if (!tooClose) {
          const type = idx % 3 === 0 ? 'diamond' : 'coin';
          addPlacement(corr, type);
        }
      }
    });

    // Fill remaining if needed
    if (selected.length < targetCount) {
      walkableTiles.forEach(tile => {
        if (selected.length < targetCount && !usedKeys.has(`${tile.gx},${tile.gy}`)) {
          addPlacement(tile, 'coin');
        }
      });
    }

    // Spawn entities
    selected.forEach(({ gx, gy, type }) => {
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

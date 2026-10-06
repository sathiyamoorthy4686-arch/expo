/**
 * Main Game Engine, Robot Explorer, AI Monster, and State Machine
 */

const STATE_ATTRACT = 0;
const STATE_HOW_TO_PLAY = 1;
const STATE_COUNTDOWN = 2;
const STATE_PLAYING = 3;
const STATE_VICTORY = 4;
const STATE_GAMEOVER = 5;

class Player {
  constructor(startX, startY, radius = 13) {
    this.x = startX;
    this.y = startY;
    this.radius = radius;
    this.vx = 0;
    this.vy = 0;
    this.baseSpeed = 105; // Balanced, controllable movement speed
    this.facingAngle = Math.PI / 2; // Default facing down
    this.isMoving = false;
    this.hitRadius = 12;
    this.animTime = 0;
  }

  update(dt, inputDir, collisionFn, gameMap, particles) {
    this.animTime += dt;
    const targetVx = inputDir.x * this.baseSpeed;
    const targetVy = inputDir.y * this.baseSpeed;

    // Instant stop when input is 0 (neutral / stop)
    if (inputDir.x === 0 && inputDir.y === 0) {
      this.vx = 0;
      this.vy = 0;
      this.isMoving = false;
      return;
    }

    // Snappy acceleration
    const accel = 20.0;
    this.vx += (targetVx - this.vx) * Math.min(1.0, accel * dt);
    this.vy += (targetVy - this.vy) * Math.min(1.0, accel * dt);

    if (Math.abs(this.vx) > 5 || Math.abs(this.vy) > 5) {
      this.facingAngle = Math.atan2(this.vy, this.vx);
      this.isMoving = true;
      if (particles && Math.random() < 0.35) {
        particles.spawnPlayerTrail(this.x, this.y + 4);
      }
    } else {
      this.isMoving = false;
    }

    // Corridor Alignment Assist
    const [gx, gy] = gameMap.worldToGrid(this.x, this.y);
    const [centerWx, centerWy] = gameMap.gridToWorld(gx, gy);

    // If moving horizontally, gently center Y to hallway center
    if (Math.abs(this.vx) > Math.abs(this.vy)) {
      const diffY = centerWy - this.y;
      this.y += diffY * Math.min(1.0, 12.0 * dt);
    }
    // If moving vertically, gently center X to hallway center
    else if (Math.abs(this.vy) > Math.abs(this.vx)) {
      const diffX = centerWx - this.x;
      this.x += diffX * Math.min(1.0, 12.0 * dt);
    }

    // Attempt X movement
    const newX = this.x + this.vx * dt;
    if (!collisionFn(newX, this.y, this.radius)) {
      this.x = newX;
    } else {
      this.vx = 0;
    }

    // Attempt Y movement
    const newY = this.y + this.vy * dt;
    if (!collisionFn(this.x, newY, this.radius)) {
      this.y = newY;
    } else {
      this.vy = 0;
    }
  }

  stop() {
    this.vx = 0;
    this.vy = 0;
    this.isMoving = false;
  }

  draw(ctx) {
    const px = this.x;
    const py = this.y;
    const r = this.radius;

    ctx.save();

    // 1. Soft Floor Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(px, py + r - 2, r + 3, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Robot Chassis (Metallic Blue & Silver)
    ctx.fillStyle = '#1e88e5';
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner Glow
    ctx.fillStyle = '#e3f2fd';
    ctx.beginPath();
    ctx.arc(px, py, r - 3, 0, Math.PI * 2);
    ctx.fill();

    // 3. Robot Visor Face Screen (Glowing Screen)
    ctx.fillStyle = '#0a192f';
    ctx.beginPath();
    ctx.roundRect(px - r * 0.65, py - r * 0.5, r * 1.3, r * 0.9, 4);
    ctx.fill();

    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 4. Expressive Cyber Eyes (facing active angle)
    const eyeDist = 4;
    const ex = px + Math.cos(this.facingAngle) * eyeDist;
    const ey = py + Math.sin(this.facingAngle) * eyeDist;

    ctx.fillStyle = '#00ffea';
    ctx.shadowColor = '#00ffea';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(ex - 3, ey, 2, 0, Math.PI * 2);
    ctx.arc(ex + 3, ey, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 5. Robot Antenna with Pulsing Beacon
    const pulse = 0.5 + 0.5 * Math.sin(this.animTime * 10);
    ctx.strokeStyle = '#90caf9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py - r + 3);
    ctx.lineTo(px, py - r - 6);
    ctx.stroke();

    ctx.fillStyle = `rgba(255, 215, 0, ${0.6 + 0.4 * pulse})`;
    ctx.beginPath();
    ctx.arc(px, py - r - 6, 3, 0, Math.PI * 2);
    ctx.fill();

    // 6. Navigation indicator arrow
    if (this.isMoving) {
      const ax = px + Math.cos(this.facingAngle) * (r + 7);
      const ay = py + Math.sin(this.facingAngle) * (r + 7);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ax, ay, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

class Enemy {
  constructor(startX, startY, speed = 60) {
    this.x = startX;
    this.y = startY;
    this.speed = speed;
    this.radius = 15;
    this.hitRadius = 15;
    this.path = [];
    this.pathTimer = 0;
    this.recalcInterval = 0.25;
    this.gracePeriod = 3.5;
    this.animTime = 0;
  }

  update(dt, player, gameMap, particles) {
    this.animTime += dt;

    if (this.gracePeriod > 0) {
      this.gracePeriod -= dt;
      if (particles && Math.random() < 0.2) {
        particles.spawnEnemyAura(this.x, this.y);
      }
      return;
    }

    this.pathTimer -= dt;
    if (this.pathTimer <= 0 || this.path.length === 0) {
      this.pathTimer = this.recalcInterval;
      const sGrid = gameMap.worldToGrid(this.x, this.y);
      const tGrid = gameMap.worldToGrid(player.x, player.y);

      const gridPath = window.findPath(gameMap.grid, sGrid, tGrid);
      if (gridPath && gridPath.length > 1) {
        this.path = gridPath.slice(1).map(([gx, gy]) => gameMap.gridToWorld(gx, gy));
      } else if (gridPath && gridPath.length === 1) {
        this.path = [gameMap.gridToWorld(gridPath[0][0], gridPath[0][1])];
      }
    }

    if (this.path.length > 0) {
      const [tx, ty] = this.path[0];
      const dx = tx - this.x;
      const dy = ty - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 6.0) {
        this.path.shift();
      } else {
        const step = Math.min(dist, this.speed * dt);
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
      }
    }

    if (particles && Math.random() < 0.4) {
      particles.spawnEnemyAura(this.x, this.y);
    }
  }

  stop() {
    this.path = [];
  }

  draw(ctx) {
    const px = this.x;
    const py = this.y;
    const r = this.radius;

    ctx.save();
    const pulse = 1.0 + 0.1 * Math.sin(this.animTime * 6.0);
    const curR = r * pulse;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(px, py + curR - 4, curR + 3, curR * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark Fiery Body / Shield
    if (this.gracePeriod > 0) {
      ctx.strokeStyle = 'rgba(120, 120, 200, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, curR + 4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#8228a0';
    } else {
      ctx.strokeStyle = 'rgba(255, 30, 80, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, curR + 5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#c8193c';
    }

    ctx.beginPath();
    ctx.arc(px, py, curR, 0, Math.PI * 2);
    ctx.fill();

    // Spooky Glowing Eyes
    const eyePulse = Math.sin(this.animTime * 10.0) > 0 ? '#ffea00' : '#ff3300';
    ctx.fillStyle = eyePulse;
    ctx.beginPath();
    ctx.arc(px - 5, py - 3, 3, 0, Math.PI * 2);
    ctx.arc(px + 5, py - 3, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(px - 5, py - 3, 1, 0, Math.PI * 2);
    ctx.arc(px + 5, py - 3, 1, 0, Math.PI * 2);
    ctx.fill();

    // Horns
    ctx.fillStyle = '#ffd232';
    ctx.beginPath();
    ctx.moveTo(px - 8, py - curR + 4);
    ctx.lineTo(px - 13, py - curR - 5);
    ctx.lineTo(px - 4, py - curR + 2);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(px + 8, py - curR + 4);
    ctx.lineTo(px + 13, py - curR - 5);
    ctx.lineTo(px + 4, py - curR + 2);
    ctx.closePath();
    ctx.fill();

    // Awakening label
    if (this.gracePeriod > 0) {
      ctx.fillStyle = '#fff064';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`AWAKENING... ${this.gracePeriod.toFixed(1)}s`, px, py - curR - 12);
    }

    ctx.restore();
  }
}

class GameManager {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.cv = new window.BrowserCVController();
    this.particles = new window.ParticleSystem();
    this.sound = window.soundSynth;

    this.state = STATE_ATTRACT;
    this.difficulty = 1;
    this.level = 1;
    this.score = 0;
    this.gameTime = 0;
    this.countdownTimer = 3.0;
    this.kioskTimer = 0;

    // HUD Elements
    this.hudScore = document.getElementById('hud-score');
    this.hudTreasures = document.getElementById('hud-treasures');
    this.hudTimer = document.getElementById('hud-timer');
    this.monsterStateEl = document.getElementById('monster-state');
    this.monsterDistEl = document.getElementById('monster-dist');
    this.dangerAlert = document.getElementById('danger-alert');

    // UI Overlays
    this.overlayContainer = document.getElementById('ui-overlay');
    this.screenAttract = document.getElementById('screen-attract');
    this.screenHow = document.getElementById('screen-how');
    this.screenCountdown = document.getElementById('screen-countdown');
    this.screenVictory = document.getElementById('screen-victory');
    this.screenGameOver = document.getElementById('screen-gameover');

    this.countdownNum = document.getElementById('countdown-num');
    this.countdownMsg = document.getElementById('countdown-msg');

    this.vicTreasurePts = document.getElementById('vic-treasure-pts');
    this.vicTimeBonus = document.getElementById('vic-time-bonus');
    this.vicFinalScore = document.getElementById('vic-final-score');
    this.vicKioskTimer = document.getElementById('vic-kiosk-timer');

    this.goScore = document.getElementById('go-score');
    this.goKioskTimer = document.getElementById('go-kiosk-timer');

    this.setupUI();
    this.initGame(1);

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  setupUI() {
    document.getElementById('btn-start-game').addEventListener('click', () => {
      this.sound.play('ui_click');
      this.startCountdown();
    });

    document.getElementById('btn-show-rules').addEventListener('click', () => {
      this.sound.play('ui_click');
      this.showScreen(STATE_HOW_TO_PLAY);
    });

    document.getElementById('btn-how').addEventListener('click', () => {
      this.sound.play('ui_click');
      this.showScreen(STATE_HOW_TO_PLAY);
    });

    document.getElementById('btn-back-title').addEventListener('click', () => {
      this.sound.play('ui_click');
      this.showScreen(STATE_ATTRACT);
    });

    document.getElementById('btn-play-again').addEventListener('click', () => {
      this.sound.play('ui_click');
      this.startCountdown();
    });

    document.getElementById('btn-retry').addEventListener('click', () => {
      this.sound.play('ui_click');
      this.startCountdown();
    });

    const btnSound = document.getElementById('btn-sound');
    btnSound.addEventListener('click', () => {
      const isEnabled = this.sound.toggle();
      btnSound.textContent = isEnabled ? '🔊 AUDIO ON' : '🔇 AUDIO OFF';
    });

    const btnFs = document.getElementById('btn-fullscreen');
    btnFs.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(err));
      } else {
        document.exitFullscreen().catch(err => console.log(err));
      }
    });

    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.difficulty = parseInt(btn.dataset.diff, 10);
        this.level = this.difficulty;
        this.sound.play('ui_click');
      });
    });
  }

  showScreen(state) {
    this.state = state;
    this.overlayContainer.classList.remove('hidden');
    this.screenAttract.classList.add('hidden');
    this.screenHow.classList.add('hidden');
    this.screenCountdown.classList.add('hidden');
    this.screenVictory.classList.add('hidden');
    this.screenGameOver.classList.add('hidden');

    // Freeze entities if on popup modals
    if (state !== STATE_PLAYING && this.player) {
      this.player.stop();
      if (this.enemy) this.enemy.stop();
    }

    if (state === STATE_ATTRACT) {
      this.screenAttract.classList.remove('hidden');
    } else if (state === STATE_HOW_TO_PLAY) {
      this.screenHow.classList.remove('hidden');
    } else if (state === STATE_COUNTDOWN) {
      this.screenCountdown.classList.remove('hidden');
    } else if (state === STATE_VICTORY) {
      this.screenVictory.classList.remove('hidden');
    } else if (state === STATE_GAMEOVER) {
      this.screenGameOver.classList.remove('hidden');
    } else if (state === STATE_PLAYING) {
      this.overlayContainer.classList.add('hidden');
    }
  }

  initGame(level = 1) {
    this.level = level;
    this.map = new window.GameMap(this.canvas.width, this.canvas.height, this.level);
    
    const [sx, sy] = this.map.startWorld;
    this.player = new Player(sx, sy);

    const enemySpeed = 50.0 + this.level * 10.0;
    const [ex, ey] = this.map.enemySpawnWorld;
    this.enemy = new Enemy(ex, ey, enemySpeed);

    this.score = 0;
    this.gameTime = 0;
    this.dangerAlert.style.display = 'none';
    this.updateHUD();
  }

  startCountdown() {
    this.initGame(this.difficulty);
    this.countdownTimer = 3.9;
    this.showScreen(STATE_COUNTDOWN);
    this.sound.play('countdown_tick');
  }

  updateHUD() {
    this.hudScore.textContent = this.score;
    const totalTr = this.map.treasures.length;
    const foundTr = this.map.treasures.filter(t => t.collected).length;
    this.hudTreasures.textContent = `${foundTr} / ${totalTr}`;

    const mins = Math.floor(this.gameTime / 60).toString().padStart(2, '0');
    const secs = Math.floor(this.gameTime % 60).toString().padStart(2, '0');
    this.hudTimer.textContent = `${mins}:${secs}`;
  }

  gameLoop(timestamp) {
    const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(dt) {
    this.particles.update(dt);

    if (this.state === STATE_COUNTDOWN) {
      this.countdownTimer -= dt;
      const countVal = Math.ceil(this.countdownTimer);

      if (countVal > 0) {
        if (this.countdownNum.textContent !== countVal.toString()) {
          this.countdownNum.textContent = countVal;
          this.sound.play('countdown_tick');
        }
      } else {
        this.countdownNum.textContent = 'GO!';
        this.countdownMsg.textContent = 'ESCAPE THE LABYRINTH!';
        if (this.countdownTimer < -0.4) {
          this.sound.play('countdown_go');
          this.showScreen(STATE_PLAYING);
        }
      }
    } else if (this.state === STATE_PLAYING) {
      this.gameTime += dt;
      this.updateHUD();

      // Read movement strictly from fingertip / input
      const move = this.cv.getMovement();
      this.player.update(dt, move, (x, y, r) => this.map.checkCollision(x, y, r), this.map, this.particles);

      // Monster update
      this.enemy.update(dt, this.player, this.map, this.particles);

      // Treasures collection
      this.map.treasures.forEach(tr => {
        tr.update(dt);
        if (!tr.collected) {
          const dist = Math.hypot(this.player.x - tr.x, this.player.y - tr.y);
          if (dist < this.player.hitRadius + 14) {
            tr.collected = true;
            this.score += tr.value;
            this.sound.play(tr.sound);
            this.particles.spawnTreasureSparkles(tr.x, tr.y, tr.color);
            this.particles.addFloatingText(tr.x, tr.y - 12, `+${tr.value} ${tr.name}!`, tr.color, 16);
            this.updateHUD();
          }
        }
      });

      // Monster proximity telemetry
      const enemyDist = Math.hypot(this.player.x - this.enemy.x, this.player.y - this.enemy.y);
      if (this.enemy.gracePeriod > 0) {
        this.monsterStateEl.textContent = `AWAKE IN ${this.enemy.gracePeriod.toFixed(1)}s`;
        this.monsterStateEl.className = 'val-mono alert';
        this.monsterDistEl.textContent = 'SLEEPING';
        this.monsterDistEl.className = 'val-mono';
        this.dangerAlert.style.display = 'none';
      } else {
        this.monsterStateEl.textContent = 'HUNTING (A*)';
        this.monsterStateEl.className = 'val-mono';

        if (enemyDist < 120) {
          this.monsterDistEl.textContent = 'DANGER!';
          this.monsterDistEl.className = 'val-mono danger';
          this.dangerAlert.style.display = 'flex';
          if (Math.random() < 0.05) this.sound.play('danger');
        } else if (enemyDist < 240) {
          this.monsterDistEl.textContent = 'APPROACHING';
          this.monsterDistEl.className = 'val-mono alert';
          this.dangerAlert.style.display = 'none';
        } else {
          this.monsterDistEl.textContent = 'SAFE';
          this.monsterDistEl.className = 'val-mono';
          this.dangerAlert.style.display = 'none';
        }
      }

      // Check Caught by Monster (Game Over)
      if (this.enemy.gracePeriod <= 0 && enemyDist < this.player.hitRadius + this.enemy.hitRadius) {
        this.player.stop();
        this.enemy.stop();
        this.sound.play('game_over');
        this.particles.spawnEnemyAura(this.player.x, this.player.y);
        this.goScore.textContent = this.score;
        this.kioskTimer = 10.0;
        this.dangerAlert.style.display = 'none';
        this.showScreen(STATE_GAMEOVER);
      }

      // Check Reached Exit Portal (Victory)
      const [ex, ey] = this.map.exitWorld;
      const exitDist = Math.hypot(this.player.x - ex, this.player.y - ey);
      if (exitDist < 24) {
        this.player.stop();
        this.enemy.stop();
        this.sound.play('victory');
        this.particles.spawnConfetti(ex, ey);
        this.particles.spawnConfetti(this.canvas.width / 2, this.canvas.height / 2);

        const timeBonus = Math.max(0, Math.floor(300 - this.gameTime * 4));
        const finalScore = this.score + timeBonus;

        this.vicTreasurePts.textContent = this.score;
        this.vicTimeBonus.textContent = `+${timeBonus}`;
        this.vicFinalScore.textContent = finalScore;
        this.kioskTimer = 12.0;
        this.dangerAlert.style.display = 'none';
        this.showScreen(STATE_VICTORY);
      }
    } else if (this.state === STATE_VICTORY || this.state === STATE_GAMEOVER) {
      // Complete freeze during modals
      if (this.player) this.player.stop();
      if (this.enemy) this.enemy.stop();

      this.kioskTimer -= dt;
      const timerStr = `Auto-resetting in ${Math.max(1, Math.ceil(this.kioskTimer))}s...`;
      if (this.state === STATE_VICTORY) {
        this.vicKioskTimer.textContent = timerStr;
      } else {
        this.goKioskTimer.textContent = timerStr;
      }

      if (this.kioskTimer <= 0) {
        this.showScreen(STATE_ATTRACT);
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Draw labyrinth & treasures
    this.map.draw(this.ctx, performance.now() / 1000);

    // 2. Draw robot player & monster enemy
    this.player.draw(this.ctx);
    this.enemy.draw(this.ctx);

    // 3. Draw particle effects & floating score popups
    this.particles.draw(this.ctx);

    // 4. Draw real-time minimap tactical radar
    this.drawMinimap();
  }

  drawMinimap() {
    const mmCanvas = document.getElementById('minimap-canvas');
    if (!mmCanvas) return;
    const mmCtx = mmCanvas.getContext('2d');
    const w = mmCanvas.width;
    const h = mmCanvas.height;

    mmCtx.fillStyle = '#06101e';
    mmCtx.fillRect(0, 0, w, h);

    if (!this.map) return;

    const cellW = w / this.map.cols;
    const cellH = h / this.map.rows;

    // 1. Draw miniature walls
    mmCtx.fillStyle = '#1e4060';
    for (let gy = 0; gy < this.map.rows; gy++) {
      for (let gx = 0; gx < this.map.cols; gx++) {
        if (this.map.grid[gy][gx] === 1) {
          mmCtx.fillRect(gx * cellW, gy * cellH, Math.ceil(cellW), Math.ceil(cellH));
        }
      }
    }

    // 2. Start (Green) & Exit (Gold)
    mmCtx.fillStyle = '#00e6b4';
    mmCtx.beginPath();
    mmCtx.arc((this.map.startGrid[0] + 0.5) * cellW, (this.map.startGrid[1] + 0.5) * cellH, 3, 0, Math.PI * 2);
    mmCtx.fill();

    mmCtx.fillStyle = '#ffd700';
    mmCtx.beginPath();
    mmCtx.arc((this.map.exitGrid[0] + 0.5) * cellW, (this.map.exitGrid[1] + 0.5) * cellH, 3.5, 0, Math.PI * 2);
    mmCtx.fill();

    // 3. Uncollected treasures (Gold Blips)
    mmCtx.fillStyle = '#ffea00';
    this.map.treasures.forEach(tr => {
      if (!tr.collected) {
        mmCtx.beginPath();
        mmCtx.arc((tr.gx + 0.5) * cellW, (tr.gy + 0.5) * cellH, 2, 0, Math.PI * 2);
        mmCtx.fill();
      }
    });

    // 4. Enemy Monster (Pulsing Red Blip)
    if (this.enemy) {
      const [egx, egy] = this.map.worldToGrid(this.enemy.x, this.enemy.y);
      mmCtx.fillStyle = '#ff2b56';
      mmCtx.beginPath();
      mmCtx.arc((egx + 0.5) * cellW, (egy + 0.5) * cellH, 3.5, 0, Math.PI * 2);
      mmCtx.fill();
    }

    // 5. Player (Cyan Blip with Pulse Ring)
    if (this.player) {
      const [pgx, pgy] = this.map.worldToGrid(this.player.x, this.player.y);
      mmCtx.fillStyle = '#00f0ff';
      mmCtx.beginPath();
      mmCtx.arc((pgx + 0.5) * cellW, (pgy + 0.5) * cellH, 3.5, 0, Math.PI * 2);
      mmCtx.fill();
    }
  }

}

// Start game manager when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameManager();
});

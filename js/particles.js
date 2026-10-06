/**
 * High-performance Particle FX & Floating Texts for Canvas
 */
class Particle {
  constructor(x, y, vx, vy, color, radius, lifetime, shape = 'circle', gravity = 0) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.radius = radius;
    this.maxLife = lifetime;
    this.life = lifetime;
    this.shape = shape;
    this.gravity = gravity;
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.vy += this.gravity * dt * 60;
  }

  get isAlive() {
    return this.life > 0;
  }

  draw(ctx) {
    if (this.life <= 0) return;
    const alpha = Math.max(0, this.life / this.maxLife);
    const r = Math.max(1, this.radius * alpha);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;

    if (this.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shape === 'star') {
      ctx.beginPath();
      const cx = this.x;
      const cy = this.y;
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r / 3, cy - r / 3);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx + r / 3, cy + r / 3);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r / 3, cy + r / 3);
      ctx.lineTo(cx - r, cy);
      ctx.lineTo(cx - r / 3, cy - r / 3);
      ctx.closePath();
      ctx.fill();
    } else if (this.shape === 'square') {
      ctx.fillRect(this.x - r, this.y - r, r * 2, r * 2);
    }
    ctx.restore();
  }
}

class FloatingText {
  constructor(x, y, text, color = '#ffd700', fontSize = 18, lifetime = 1.3) {
    this.x = x;
    this.y = y;
    this.startY = y;
    this.text = text;
    this.color = color;
    this.fontSize = fontSize;
    this.lifetime = lifetime;
    this.life = lifetime;
    this.vy = -38.0;
  }

  update(dt) {
    this.life -= dt;
    this.y += this.vy * dt;
    this.vy *= 0.96; // Gentle decelerating float
  }

  get isAlive() {
    return this.life > 0;
  }

  draw(ctx) {
    if (this.life <= 0) return;
    const progress = 1.0 - (this.life / this.lifetime);
    const alpha = Math.max(0, this.life / this.lifetime);
    
    // Scale pop animation: springs up fast, then floats gently
    const scale = progress < 0.2 ? 0.7 + (progress / 0.2) * 0.45 : Math.max(0.9, 1.15 - progress * 0.25);
    const size = Math.round(this.fontSize * scale);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `900 ${size}px 'Outfit', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Outer glow aura
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(this.text, this.x, this.y);

    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y);

    // White shine core
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText(this.text, this.x, this.y - 1);

    ctx.restore();
  }
}


class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
  }

  update(dt) {
    this.particles.forEach(p => p.update(dt));
    this.particles = this.particles.filter(p => p.isAlive);

    this.floatingTexts.forEach(ft => ft.update(dt));
    this.floatingTexts = this.floatingTexts.filter(ft => ft.isAlive);
  }

  draw(ctx) {
    this.particles.forEach(p => p.draw(ctx));
    this.floatingTexts.forEach(ft => ft.draw(ctx));
  }

  spawnTreasureSparkles(x, y, color = '#ffd700') {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 3.3;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const radius = 3 + Math.random() * 4;
      const life = 0.4 + Math.random() * 0.5;
      const shape = Math.random() < 0.5 ? 'star' : 'circle';
      this.particles.push(new Particle(x, y, vx, vy, color, radius, life, shape, 0.05));
    }
  }

  spawnPlayerTrail(x, y) {
    const vx = (Math.random() - 0.5) * 0.8;
    const vy = (Math.random() - 0.5) * 0.8;
    this.particles.push(new Particle(x, y, vx, vy, '#b4e6ff', 3, 0.3, 'circle'));
  }

  spawnEnemyAura(x, y) {
    const vx = (Math.random() - 0.5) * 1.2;
    const vy = -0.5 - Math.random() * 1.0;
    const colors = ['#ff2850', '#b4005a', '#ff641e'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    this.particles.push(new Particle(x, y, vx, vy, color, 4, 0.4, 'circle', -0.02));
  }

  spawnConfetti(x, y) {
    const colors = ['#ffd700', '#ff3c64', '#00e5ff', '#64ff64', '#ff9600', '#dc50ff'];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 5.0;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const radius = 4 + Math.random() * 3;
      const life = 0.8 + Math.random() * 1.0;
      const shapes = ['square', 'circle', 'star'];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      this.particles.push(new Particle(x, y, vx, vy, color, radius, life, shape, 0.12));
    }
  }

  addFloatingText(x, y, text, color = '#ffd700', fontSize = 18) {
    this.floatingTexts.push(new FloatingText(x, y, text, color, fontSize));
  }
}

window.ParticleSystem = ParticleSystem;

class Particle {
  constructor(x, y, vx, vy, color, size, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.maxLife = life;
    this.life = life;
    this.friction = 0.96;
    this.gravity = 0.05;
  }

  update() {
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0.5, this.size * alpha), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.puckTrail = [];
    this.maxTrailLength = 12;
  }

  addHitSparks(x, y, dirX, dirY, color, isBoost = false) {
    const count = isBoost ? 16 : 8;
    const speedMultiplier = isBoost ? 6 : 3;

    for (let i = 0; i < count; i++) {
      const angle = Math.atan2(dirY, dirX) + (Math.random() - 0.5) * (isBoost ? 1.5 : 1.0);
      const speed = (Math.random() * 0.8 + 0.2) * speedMultiplier;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = Math.random() * 3 + (isBoost ? 2.5 : 1.5);
      const life = Math.floor(Math.random() * 15) + 10;
      const sparkColor = isBoost ? '#ffe600' : color;
      
      this.particles.push(new Particle(x, y, vx, vy, sparkColor, size, life));
    }
  }

  addGoalBurst(x, y, color) {
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = Math.random() * 4 + 2;
      const life = Math.floor(Math.random() * 30) + 20;
      
      this.particles.push(new Particle(x, y, vx, vy, color, size, life));
    }
  }

  addPuckTrailPoint(x, y, speedRatio) {
    this.puckTrail.unshift({ x, y, speedRatio });
    if (this.puckTrail.length > this.maxTrailLength) {
      this.puckTrail.pop();
    }
  }

  clearTrail() {
    this.puckTrail = [];
  }

  updateAndDraw(ctx) {
    // Draw Puck Trail (High-performance 2D vector trail)
    if (this.puckTrail.length > 1) {
      ctx.save();
      for (let i = 0; i < this.puckTrail.length - 1; i++) {
        const p1 = this.puckTrail[i];
        const p2 = this.puckTrail[i + 1];
        
        if (p1.speedRatio > 0.3) {
          const alpha = (1 - i / this.puckTrail.length) * Math.min(1, p1.speedRatio);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          
          ctx.lineWidth = Math.max(1, 12 * alpha * p1.speedRatio);
          ctx.strokeStyle = p1.speedRatio > 1.2 
            ? `rgba(255, 230, 0, ${alpha * 0.75})` 
            : `rgba(0, 243, 255, ${alpha * 0.45})`;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Update and draw particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      p.draw(ctx);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
}

const effects = new ParticleSystem();

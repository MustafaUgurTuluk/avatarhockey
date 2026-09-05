class Puck {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = radius;
    this.maxSpeed = 22;
    this.friction = 0.992;
    this.color = '#ffe600';
    this.lastHitBy = null;
    this.currentSpeed = 0;
  }

  reset(x, y, launchX = 0) {
    this.x = x;
    this.y = y;
    const launchDir = launchX >= 0 ? 1 : -1;
    this.vx = launchDir * 4.5;
    this.vy = (Math.random() - 0.5) * 3.5;
    this.lastHitBy = null;
    this.currentSpeed = Math.hypot(this.vx, this.vy);
  }

  update() {
    this.vx *= this.friction;
    this.vy *= this.friction;

    this.currentSpeed = Math.hypot(this.vx, this.vy);

    // Speed Cap
    if (this.currentSpeed > this.maxSpeed) {
      const scale = this.maxSpeed / this.currentSpeed;
      this.vx *= scale;
      this.vy *= scale;
      this.currentSpeed = this.maxSpeed;
    }

    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx) {
    ctx.save();
    
    ctx.shadowBlur = this.currentSpeed > 12 ? 20 : 10;
    ctx.shadowColor = this.lastHitBy === 'p1' 
      ? '#00f3ff' 
      : (this.lastHitBy === 'p2' ? '#ff0055' : '#ffe600');

    const grad = ctx.createRadialGradient(
      this.x - this.radius * 0.3, 
      this.y - this.radius * 0.3, 
      this.radius * 0.1, 
      this.x, 
      this.y, 
      this.radius
    );
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, this.color);
    grad.addColorStop(1, '#ccb800');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}

class Mallet {
  constructor(x, y, radius, color, isP1) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = radius;
    this.color = color;
    this.isP1 = isP1;
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.prevX = this.startX;
    this.prevY = this.startY;
    this.vx = 0;
    this.vy = 0;
  }

  updateVelocity() {
    this.vx = this.x - this.prevX;
    this.vy = this.y - this.prevY;
    this.prevX = this.x;
    this.prevY = this.y;
  }

  draw(ctx) {
    ctx.save();

    ctx.shadowBlur = 18;
    ctx.shadowColor = this.color;

    const baseGrad = ctx.createRadialGradient(
      this.x - this.radius * 0.3,
      this.y - this.radius * 0.3,
      this.radius * 0.2,
      this.x,
      this.y,
      this.radius
    );
    baseGrad.addColorStop(0, '#ffffff');
    baseGrad.addColorStop(0.5, this.color);
    baseGrad.addColorStop(1, '#0f111a');

    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f111a';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

class Paddle {
  constructor(x, y, width, height, color, isP1) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.vx = 0;
    this.vy = 0;
    this.width = width;
    this.height = height;
    this.color = color;
    this.isP1 = isP1;
    this.moveVx = 0;
    this.moveVy = 0;
    this.tiltAngle = 0;
    this.targetTilt = 0;
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.prevX = this.startX;
    this.prevY = this.startY;
    this.vx = 0;
    this.vy = 0;
    this.moveVx = 0;
    this.moveVy = 0;
    this.tiltAngle = 0;
    this.targetTilt = 0;
  }

  updateVelocity() {
    this.vx = this.x - this.prevX;
    this.vy = this.y - this.prevY;
    this.prevX = this.x;
    this.prevY = this.y;
  }

  draw(ctx) {
    ctx.save();

    if (this.tiltAngle) {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.tiltAngle);
      ctx.translate(-this.x, -this.y);
    }

    const left = this.x - this.width / 2;
    const top = this.y - this.height / 2;
    const rx = 8;

    ctx.shadowBlur = 20;
    ctx.shadowColor = this.color;

    const grad = ctx.createLinearGradient(left, top, left + this.width, top + this.height);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, this.color);
    grad.addColorStop(1, '#0e111d');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(left, top, this.width, this.height, rx);
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 2;
    for (let offset = -this.height * 0.3; offset <= this.height * 0.3; offset += 14) {
      ctx.beginPath();
      ctx.moveTo(this.x - this.width * 0.3, this.y + offset);
      ctx.lineTo(this.x + this.width * 0.3, this.y + offset);
      ctx.stroke();
    }

    ctx.restore();
  }
}

class AirHockeyTable {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.border = 24;
    this.goalSize = 170;
    this.goalYStart = (this.height - this.goalSize) / 2;
    this.goalYEnd = this.goalYStart + this.goalSize;
  }

  draw(ctx, theme = 'normal') {
    ctx.save();

    if (theme === 'normal') {
      ctx.fillStyle = '#141724';
      ctx.fillRect(0, 0, this.width, this.height);
    }

    const rinkX = this.border;
    const rinkY = this.border;
    const rinkW = this.width - this.border * 2;
    const rinkH = this.height - this.border * 2;

    if (theme === 'normal') {
      ctx.fillStyle = '#0d0f18';
      ctx.fillRect(rinkX, rinkY, rinkW, rinkH);
    }

    if (theme === 'normal') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      for (let x = rinkX; x < rinkX + rinkW; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, rinkY);
        ctx.lineTo(x, rinkY + rinkH);
        ctx.stroke();
      }

      ctx.strokeStyle = '#1e2338';
      ctx.lineWidth = 4;
      ctx.strokeRect(rinkX, rinkY, rinkW, rinkH);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.setLineDash([8, 8]);
      ctx.moveTo(this.width / 2, rinkY);
      ctx.lineTo(this.width / 2, rinkY + rinkH);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(this.width / 2, this.height / 2, 70, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.arc(this.width / 2, this.height / 2, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(rinkX, this.height / 2, 90, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 0, 85, 0.3)';
      ctx.beginPath();
      ctx.arc(rinkX + rinkW, this.height / 2, 90, Math.PI / 2, 3 * Math.PI / 2);
      ctx.stroke();
    }

    // 3D Recessed Goal Pocket (Player 1 - Left)
    const gY = this.goalYStart;
    const gH = this.goalSize;

    // Left Goal Net Background (Extends outwards to outer border)
    ctx.fillStyle = '#060912';
    ctx.fillRect(0, gY, rinkX, gH);

    // Goal Net Grid Pattern (Left)
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.25)';
    ctx.lineWidth = 1.5;
    for (let nx = 0; nx <= rinkX; nx += 8) {
      ctx.beginPath();
      ctx.moveTo(nx, gY);
      ctx.lineTo(nx, gY + gH);
      ctx.stroke();
    }
    for (let ny = gY; ny <= gY + gH; ny += 12) {
      ctx.beginPath();
      ctx.moveTo(0, ny);
      ctx.lineTo(rinkX, ny);
      ctx.stroke();
    }

    // Glowing Goal Line (Left Rink Edge)
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(rinkX, gY);
    ctx.lineTo(rinkX, gY + gH);
    ctx.stroke();

    // 3D Recessed Goal Pocket (Player 2 - Right)
    ctx.fillStyle = '#060912';
    ctx.fillRect(this.width - rinkX, gY, rinkX, gH);

    // Goal Net Grid Pattern (Right)
    ctx.strokeStyle = 'rgba(255, 0, 85, 0.25)';
    ctx.lineWidth = 1.5;
    for (let nx = this.width - rinkX; nx <= this.width; nx += 8) {
      ctx.beginPath();
      ctx.moveTo(nx, gY);
      ctx.lineTo(nx, gY + gH);
      ctx.stroke();
    }
    for (let ny = gY; ny <= gY + gH; ny += 12) {
      ctx.beginPath();
      ctx.moveTo(this.width - rinkX, ny);
      ctx.lineTo(this.width, ny);
      ctx.stroke();
    }

    // Glowing Goal Line (Right Rink Edge)
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.width - rinkX, gY);
    ctx.lineTo(this.width - rinkX, gY + gH);
    ctx.stroke();

    // 3D Goal Posts (Left & Right)
    ctx.fillStyle = '#e0e6ed';
    ctx.strokeStyle = '#1e2338';
    ctx.lineWidth = 2;

    [
      {x: rinkX, y: gY}, {x: rinkX, y: gY + gH},
      {x: this.width - rinkX, y: gY}, {x: this.width - rinkX, y: gY + gH}
    ].forEach(post => {
      ctx.beginPath();
      ctx.arc(post.x, post.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    ctx.restore();
  }
}

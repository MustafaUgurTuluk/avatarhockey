class TacticalPaddleGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.width = 960;
    this.height = 540;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.table = new AirHockeyTable(this.width, this.height);
    this.puck = new Puck(this.width / 2, this.height / 2, 16);
    this.puck.maxSpeed = 15; // Controlled tactical speed

    // Flat Wall Paddles (Width 22, Height 104)
    this.p1 = new Paddle(140, this.height / 2, 22, 104, '#00f3ff', true);
    this.p2 = new Paddle(this.width - 140, this.height / 2, 22, 104, '#ff0055', false);

    this.scoreP1 = 0;
    this.scoreP2 = 0;
    this.targetScore = 7;
    this.isPaused = false;
    this.isPlaying = false;
    this.isAiMode = false;
    this.winner = null;

    this.keys = {};

    this.elScoreP1 = document.getElementById('scoreP1');
    this.elScoreP2 = document.getElementById('scoreP2');
    this.elHitSpeed = document.getElementById('hitSpeedMeter');
    this.startModal = document.getElementById('paddleStartModal');
    this.pauseModal = document.getElementById('pauseModal');
    this.winModal = document.getElementById('winModal');
    this.winnerText = document.getElementById('winnerText');

    this.setupInputs();
    this.setupEvents();
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  setupEvents() {
    document.getElementById('btnPaddleStart2P')?.addEventListener('click', () => {
      this.isAiMode = false;
      this.startGame();
    });

    document.getElementById('btnPaddleStartAI')?.addEventListener('click', () => {
      this.isAiMode = true;
      this.startGame();
    });
  }

  startGame() {
    this.scoreP1 = 0;
    this.scoreP2 = 0;
    this.winner = null;
    this.isPlaying = true;
    this.isPaused = false;
    this.updateScoreDisplay();

    this.startModal?.classList.remove('active');
    this.pauseModal?.classList.remove('active');
    this.winModal?.classList.remove('active');

    this.resetPositions(1);
  }

  resetPositions(scorer = 1) {
    const launchX = scorer === 1 ? 3.8 : -3.8;
    this.puck.reset(this.width / 2, this.height / 2, launchX);
    this.p1.reset();
    this.p2.reset();
    effects.clearTrail();
  }

  handlePlayerMovement() {
    const moveSpeed = 5.8;
    const border = this.table.border;

    // Player 1 (WASD)
    let p1dx = 0;
    let p1dy = 0;
    if (this.keys['KeyW']) p1dy -= moveSpeed;
    if (this.keys['KeyS']) p1dy += moveSpeed;
    if (this.keys['KeyA']) p1dx -= moveSpeed;
    if (this.keys['KeyD']) p1dx += moveSpeed;

    if (p1dx !== 0 && p1dy !== 0) {
      p1dx *= 0.7071;
      p1dy *= 0.7071;
    }

    this.p1.x += p1dx;
    this.p1.y += p1dy;

    const p1MinX = border + this.p1.width / 2;
    const p1MaxX = (this.width / 2) - this.p1.width / 2 - 2;
    const p1MinY = border + this.p1.height / 2;
    const p1MaxY = this.height - border - this.p1.height / 2;

    this.p1.x = Math.max(p1MinX, Math.min(p1MaxX, this.p1.x));
    this.p1.y = Math.max(p1MinY, Math.min(p1MaxY, this.p1.y));
    this.p1.updateVelocity();

    // Player 2 (Arrow keys or AI)
    if (this.isAiMode) {
      this.updateAiBot();
    } else {
      let p2dx = 0;
      let p2dy = 0;
      if (this.keys['ArrowUp']) p2dy -= moveSpeed;
      if (this.keys['ArrowDown']) p2dy += moveSpeed;
      if (this.keys['ArrowLeft']) p2dx -= moveSpeed;
      if (this.keys['ArrowRight']) p2dx += moveSpeed;

      if (p2dx !== 0 && p2dy !== 0) {
        p2dx *= 0.7071;
        p2dy *= 0.7071;
      }

      this.p2.x += p2dx;
      this.p2.y += p2dy;
    }

    const p2MinX = (this.width / 2) + this.p2.width / 2 + 2;
    const p2MaxX = this.width - border - this.p2.width / 2;
    const p2MinY = border + this.p2.height / 2;
    const p2MaxY = this.height - border - this.p2.height / 2;

    this.p2.x = Math.max(p2MinX, Math.min(p2MaxX, this.p2.x));
    this.p2.y = Math.max(p2MinY, Math.min(p2MaxY, this.p2.y));
    this.p2.updateVelocity();
  }

  updateAiBot() {
    const aiSpeed = 4.8;
    const targetX = this.puck.x > this.width / 2 ? this.puck.x : this.width * 0.8;
    const targetY = this.puck.y;

    const dx = targetX - this.p2.x;
    const dy = targetY - this.p2.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 5) {
      this.p2.x += (dx / dist) * Math.min(aiSpeed, dist);
      this.p2.y += (dy / dist) * Math.min(aiSpeed, dist);
    }
  }

  checkPaddlePuckCollision(paddle, playerTag) {
    const halfW = paddle.width / 2;
    const halfH = paddle.height / 2;

    // Closest point on rectangular paddle to puck center
    const closestX = Math.max(paddle.x - halfW, Math.min(this.puck.x, paddle.x + halfW));
    const closestY = Math.max(paddle.y - halfH, Math.min(this.puck.y, paddle.y + halfH));

    const dx = this.puck.x - closestX;
    const dy = this.puck.y - closestY;
    const distSq = dx * dx + dy * dy;
    const radiusSq = this.puck.radius * this.puck.radius;

    if (distSq < radiusSq) {
      const dist = Math.sqrt(distSq) || 0.001;
      const nx = dx / dist;
      const ny = dy / dist;

      // Positional correction: separate puck from paddle volume
      const overlap = this.puck.radius - dist;
      this.puck.x += nx * overlap;
      this.puck.y += ny * overlap;

      const dot = paddle.vx * nx + paddle.vy * ny;
      const isBoost = dot > 0.3;
      const boostFactor = isBoost ? 1.35 : 1.0;

      // Angle deflection based on hit offset from center of paddle
      const hitOffset = Math.max(-1, Math.min(1, (this.puck.y - paddle.y) / halfH));
      const bounceAngle = hitOffset * (Math.PI / 3.5); // Up to 50 degrees deflection angle
      
      const speed = Math.max(5.2, Math.hypot(this.puck.vx, this.puck.vy) * boostFactor);
      const dirX = paddle.isP1 ? 1 : -1;

      this.puck.vx = Math.cos(bounceAngle) * speed * dirX + paddle.vx * 0.8;
      this.puck.vy = Math.sin(bounceAngle) * speed + paddle.vy * 0.8;

      this.puck.lastHitBy = playerTag;
      soundFx.playHit(isBoost, speed / 12);
      effects.addHitSparks(this.puck.x, this.puck.y, nx, ny, paddle.color, isBoost);

      this.updateHitSpeedMeter(speed, isBoost);
    }
  }

  updateHitSpeedMeter(speed, isBoost) {
    const displayKm = Math.round(speed * 3.6);
    if (this.elHitSpeed) {
      this.elHitSpeed.innerText = `Vuruş Hızı: ${displayKm} km/h ${isBoost ? '⚡ İVME!' : ''}`;
      this.elHitSpeed.style.borderColor = isBoost ? '#ffe600' : 'rgba(255, 230, 0, 0.3)';
      this.elHitSpeed.style.color = isBoost ? '#ffe600' : '#f0f4f8';
    }
  }

  updatePhysics() {
    this.handlePlayerMovement();

    // Single clean integration step per frame
    this.puck.update();

    // Paddle collisions
    this.checkPaddlePuckCollision(this.p1, 'p1');
    this.checkPaddlePuckCollision(this.p2, 'p2');

    // Table Boundary Collisions
    const border = this.table.border;
    const r = this.puck.radius;

    if (this.puck.y - r < border) {
      this.puck.y = border + r;
      this.puck.vy = -this.puck.vy * 0.95;
      soundFx.playWallHit();
    }
    if (this.puck.y + r > this.height - border) {
      this.puck.y = this.height - border - r;
      this.puck.vy = -this.puck.vy * 0.95;
      soundFx.playWallHit();
    }

    if (this.puck.x - r < border) {
      if (this.puck.y > this.table.goalYStart && this.puck.y < this.table.goalYEnd) {
        this.handleGoal(2);
        return;
      } else {
        this.puck.x = border + r;
        this.puck.vx = -this.puck.vx * 0.95;
        soundFx.playWallHit();
      }
    }

    if (this.puck.x + r > this.width - border) {
      if (this.puck.y > this.table.goalYStart && this.puck.y < this.table.goalYEnd) {
        this.handleGoal(1);
        return;
      } else {
        this.puck.x = this.width - border - r;
        this.puck.vx = -this.puck.vx * 0.95;
        soundFx.playWallHit();
      }
    }

    effects.addPuckTrailPoint(this.puck.x, this.puck.y, this.puck.currentSpeed / 10);
  }

  handleGoal(scoringPlayer) {
    if (scoringPlayer === 1) {
      this.scoreP1++;
      effects.addGoalBurst(this.width - this.table.border, this.height / 2, '#00f3ff');
    } else {
      this.scoreP2++;
      effects.addGoalBurst(this.table.border, this.height / 2, '#ff0055');
    }

    soundFx.playGoal();
    this.updateScoreDisplay();

    if (this.scoreP1 >= this.targetScore || this.scoreP2 >= this.targetScore) {
      this.handleWin(this.scoreP1 >= this.targetScore ? 1 : 2);
    } else {
      this.resetPositions(scoringPlayer);
    }
  }

  handleWin(winnerPlayer) {
    this.winner = winnerPlayer;
    this.isPlaying = false;
    soundFx.playWin();

    if (this.winnerText) {
      this.winnerText.innerText = winnerPlayer === 1 ? 'OYUNCU 1 KAZANDI!' : (this.isAiMode ? 'YAPAY ZEKA KAZANDI!' : 'OYUNCU 2 KAZANDI!');
      this.winnerText.className = `winner-banner ${winnerPlayer === 1 ? 'winner-p1' : 'winner-p2'}`;
    }
    this.winModal?.classList.add('active');
  }

  updateScoreDisplay() {
    if (this.elScoreP1) this.elScoreP1.innerText = this.scoreP1;
    if (this.elScoreP2) this.elScoreP2.innerText = this.scoreP2;
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.table.draw(this.ctx, true);
    effects.updateAndDraw(this.ctx);
    this.puck.draw(this.ctx);
    this.p1.draw(this.ctx);
    this.p2.draw(this.ctx);
  }

  step() {
    if (this.isPlaying && !this.isPaused) {
      this.updatePhysics();
    }
    this.render();
  }
}

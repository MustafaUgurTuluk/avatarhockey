class AirHockeyGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    this.width = 960;
    this.height = 540;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.table = new AirHockeyTable(this.width, this.height);
    this.puck = new Puck(this.width / 2, this.height / 2, 16);
    this.p1 = new Mallet(160, this.height / 2, 28, '#00f3ff', true);
    this.p2 = new Mallet(this.width - 160, this.height / 2, 28, '#ff0055', false);

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
    this.startModal = document.getElementById('startModal');
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
    document.getElementById('btnStart2P')?.addEventListener('click', () => {
      this.isAiMode = false;
      this.startGame();
    });

    document.getElementById('btnStartAI')?.addEventListener('click', () => {
      this.isAiMode = true;
      this.startGame();
    });

    document.getElementById('btnSoundToggle')?.addEventListener('click', (e) => {
      const enabled = soundFx.toggle();
      e.target.innerHTML = enabled ? '🔊 Ses: Açık' : '🔇 Ses: Kapalı';
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

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.pauseModal?.classList.add('active');
    } else {
      this.pauseModal?.classList.remove('active');
    }
  }

  resetPositions(scorer = 1) {
    const launchX = scorer === 1 ? 4.5 : -4.5;
    this.puck.reset(this.width / 2, this.height / 2, launchX);
    this.p1.reset();
    this.p2.reset();
    effects.clearTrail();
  }

  handlePlayerMovement() {
    const moveSpeed = 7.5;
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

    const p1MinX = border + this.p1.radius;
    const p1MaxX = (this.width / 2) - this.p1.radius - 2;
    const p1MinY = border + this.p1.radius;
    const p1MaxY = this.height - border - this.p1.radius;

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

    const p2MinX = (this.width / 2) + this.p2.radius + 2;
    const p2MaxX = this.width - border - this.p2.radius;
    const p2MinY = border + this.p2.radius;
    const p2MaxY = this.height - border - this.p2.radius;

    this.p2.x = Math.max(p2MinX, Math.min(p2MaxX, this.p2.x));
    this.p2.y = Math.max(p2MinY, Math.min(p2MaxY, this.p2.y));
    this.p2.updateVelocity();
  }

  updateAiBot() {
    const aiSpeed = 6.2;
    const targetX = this.puck.x > this.width / 2 ? this.puck.x : this.width * 0.75;
    const targetY = this.puck.y;

    const dx = targetX - this.p2.x;
    const dy = targetY - this.p2.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 5) {
      this.p2.x += (dx / dist) * Math.min(aiSpeed, dist);
      this.p2.y += (dy / dist) * Math.min(aiSpeed, dist);
    }
  }

  checkMalletPuckCollision(mallet, playerTag) {
    const dx = this.puck.x - mallet.x;
    const dy = this.puck.y - mallet.y;
    const dist = Math.hypot(dx, dy);
    const minDist = mallet.radius + this.puck.radius;

    if (dist < minDist) {
      const nx = dx / (dist || 1);
      const ny = dy / (dist || 1);

      // Positional correction: instantly separate overlapping circles
      this.puck.x = mallet.x + nx * minDist;
      this.puck.y = mallet.y + ny * minDist;

      // Forward stroke acceleration boost check
      const dot = mallet.vx * nx + mallet.vy * ny;
      const isBoost = dot > 0.4;
      const boostFactor = isBoost ? 1.5 : 1.0;

      // Transfer velocity cleanly
      this.puck.vx = (nx * 6.5 + mallet.vx * 1.3) * boostFactor;
      this.puck.vy = (ny * 6.5 + mallet.vy * 1.3) * boostFactor;

      this.puck.lastHitBy = playerTag;

      const hitSpeed = Math.hypot(this.puck.vx, this.puck.vy);
      soundFx.playHit(isBoost, hitSpeed / 12);
      effects.addHitSparks(this.puck.x, this.puck.y, nx, ny, mallet.color, isBoost);

      this.updateHitSpeedMeter(hitSpeed, isBoost);
    }
  }

  updateHitSpeedMeter(speed, isBoost) {
    const displayKm = Math.round(speed * 4.2);
    if (this.elHitSpeed) {
      this.elHitSpeed.innerText = `Vuruş Hızı: ${displayKm} km/h ${isBoost ? '⚡ İVME BOOST!' : ''}`;
      this.elHitSpeed.style.borderColor = isBoost ? '#ffe600' : 'rgba(255, 230, 0, 0.3)';
      this.elHitSpeed.style.color = isBoost ? '#ffe600' : '#f0f4f8';
    }
  }

  updatePhysics() {
    this.handlePlayerMovement();

    // Update Puck position
    this.puck.update();

    // Mallet collisions
    this.checkMalletPuckCollision(this.p1, 'p1');
    this.checkMalletPuckCollision(this.p2, 'p2');

    // Table Boundary Collisions
    const border = this.table.border;
    const r = this.puck.radius;

    // Top Wall
    if (this.puck.y - r < border) {
      this.puck.y = border + r;
      this.puck.vy = -this.puck.vy * 0.95;
      soundFx.playWallHit();
    }
    // Bottom Wall
    if (this.puck.y + r > this.height - border) {
      this.puck.y = this.height - border - r;
      this.puck.vy = -this.puck.vy * 0.95;
      soundFx.playWallHit();
    }

    // Left Side Goal or Wall (Requires puck to travel deep into recessed 3D goal pocket)
    const isInsideGoalY = (this.puck.y > this.table.goalYStart + 4 && this.puck.y < this.table.goalYEnd - 4);

    if (this.puck.x - r < border) {
      if (isInsideGoalY) {
        if (this.puck.x < border - 12) {
          this.handleGoal(2);
          return;
        }
      } else {
        this.puck.x = border + r;
        this.puck.vx = Math.abs(this.puck.vx) * 0.95;
        soundFx.playWallHit();
      }
    }

    // Right Side Goal or Wall (Requires puck to travel deep into recessed 3D goal pocket)
    if (this.puck.x + r > this.width - border) {
      if (isInsideGoalY) {
        if (this.puck.x > this.width - border + 12) {
          this.handleGoal(1);
          return;
        }
      } else {
        this.puck.x = this.width - border - r;
        this.puck.vx = -Math.abs(this.puck.vx) * 0.95;
        soundFx.playWallHit();
      }
    }

    const speedRatio = this.puck.currentSpeed / 12;
    effects.addPuckTrailPoint(this.puck.x, this.puck.y, speedRatio);
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
    this.table.draw(this.ctx, false);
    effects.updateAndDraw(this.ctx);
    this.puck.draw(this.ctx);
    this.p1.draw(this.ctx);
    this.p2.draw(this.ctx);
  }
}

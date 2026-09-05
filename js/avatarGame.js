/**
 * Avatar Element Hockey - Avatar Match Style
 * 
 * - Characters stand behind flat paddle walls
 * - SPACE (P1) / ENTER (P2) to STRIKE the ball (momentum = power!)
 * - Move up/down to BLOCK incoming shots by positioning the paddle
 * - Each element has a unique ACTIVE ABILITY (Q / Numpad1)
 * - No friction: ball maintains base speed, strikes boost temporarily
 */
class AvatarElementGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.width = 960;
    this.height = 540;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Table & Puck
    this.table = new AirHockeyTable(this.width, this.height);
    
    // Ball physics: Dynamic rally acceleration, escalating speed cap
    this.puck = new Puck(this.width / 2, this.height / 2, 14);
    this.puck.friction = 1.0;
    this.puck.maxSpeed = 24.5;
    this.baseSpeed = 7.0;

    // Game loop timing & Rally heat state
    this.gameFrame = 0;
    this.rallyCount = 0;
    this.rallyHeat = 0;
    this.lastHitFrame = 0;
    this.screenShakeTimer = 0;

    // Flat Wall Paddles
    this.p1 = new Paddle(100, this.height / 2, 18, 100, '#00aaff', true);
    this.p2 = new Paddle(this.width - 100, this.height / 2, 18, 100, '#ff3300', false);

    // Avatar Champions (Weight, Mass, Acceleration, Braking & Agility)
    this.champions = {
      zuko: {
        id: 'zuko', name: 'Zuko', element: 'Ateş',
        icon: '🔥', color: '#ff3300', glow: '#ff6600',
        moveSpeed: 4.8, strikeForce: 10.0, paddleHeight: 95,
        mass: 1.1, accel: 0.32, brake: 0.60,
        trailColor: '#ff4400',
        abilityName: 'Ateş Topu',
        abilityDesc: 'Herhangi bir yerden topa ateş topu fırlatarak müdahale eder.',
        abilityCooldown: 350,
        ability2Name: 'Alev Duvarı',
        ability2Desc: 'Orta çizgide topu geri sektiren ve hızlandıran alevden duvar örer.',
        ability2Cooldown: 490
      },
      katara: {
        id: 'katara', name: 'Katara', element: 'Su',
        icon: '🌊', color: '#00aaff', glow: '#33ccff',
        moveSpeed: 4.8, strikeForce: 9.0, paddleHeight: 110,
        mass: 1.0, accel: 0.30, brake: 0.62,
        trailColor: '#00ccff',
        abilityName: 'Buz Hunisi Duvarı',
        abilityDesc: 'Rakip kaleye buz fırlatır. Bloklanamazsa 7sn boyunca kalede topu içeri yönlendiren buz hunisi oluşur.',
        abilityCooldown: 420,
        ability2Name: 'Su Kırbacı',
        ability2Desc: 'İleriye doğru su kırbacı savurur, topu fırlatır ve rakibi 3sn dondurur.',
        ability2Cooldown: 350
      },
      aang: {
        id: 'aang', name: 'Aang', element: 'Hava',
        icon: '🌪️', color: '#00ffcc', glow: '#66ffea',
        moveSpeed: 4.8, strikeForce: 9.5, paddleHeight: 90,
        mass: 0.85, accel: 0.42, brake: 0.66,
        trailColor: '#00ffcc',
        abilityName: 'Rüzgar Çekimi & Fırlatma',
        abilityDesc: 'Yakınına gelen topu havayla çekip yakalar ve rakibe doğru süper hızla fırlatır.',
        abilityCooldown: 490,
        ability2Name: 'Hava Işınlanması',
        ability2Desc: 'Anında kendi kalesinin önüne ışınlanır ve rüzgar dalgası saçar.',
        ability2Cooldown: 420
      },
      toph: {
        id: 'toph', name: 'Toph', element: 'Toprak',
        icon: '🪨', color: '#ffaa00', glow: '#ffcc00',
        moveSpeed: 4.8, strikeForce: 10.0, paddleHeight: 105,
        mass: 1.35, accel: 0.24, brake: 0.55,
        trailColor: '#ffaa00',
        abilityName: 'Kaya Duvarı',
        abilityDesc: 'Kale ağzına kısa süreliğine kaya duvarı örer.',
        abilityCooldown: 380,
        ability2Name: 'Kaya Fırlatma',
        ability2Desc: 'Menzilli kaya fırlatır; rakibe değerse geri iter, menzili bitince zeminde engel olarak kalır.',
        ability2Cooldown: 380
      },
      azula: {
        id: 'azula', name: 'Azula', element: 'Yıldırım',
        icon: '⚡', color: '#a855f7', glow: '#c084fc',
        moveSpeed: 4.9, strikeForce: 10.2, paddleHeight: 96,
        mass: 0.95, accel: 0.36, brake: 0.64,
        trailColor: '#d8b4fe',
        abilityName: 'Yıldırım Oku',
        abilityDesc: 'Topa saf yıldırım fırlatarak elektrik yükler; top zikzak yaparak süper hızla uçar.',
        abilityCooldown: 380,
        ability2Name: 'Statik Şok Dalgası',
        ability2Desc: 'Önündeki alana şok dalgası yayar; topu savurur ve rakibi 1.5sn elektriksel titreşime sokar.',
        ability2Cooldown: 450
      }
    };

    this.p1CharKey = 'katara';
    this.p2CharKey = 'zuko';

    // Ability 1 Cooldowns
    this.p1AbilityCooldown = 0;
    this.p2AbilityCooldown = 0;

    // Ability 2 Cooldowns
    this.p1Ability2Cooldown = 0;
    this.p2Ability2Cooldown = 0;

    // ======= ABILITY STATE =======
    // Katara: Ice beam projectile & Water whip & Ice Funnel Walls
    this.iceBeams = []; // {x, y, vx, width, height, isP1}
    this.waterWhips = []; // {x, y, width, height, isP1, timer}
    this.p1IceFunnelTimer = 0;
    this.p2IceFunnelTimer = 0;

    // Freeze state (3 seconds)
    this.p1FreezeTimer = 0;
    this.p2FreezeTimer = 0;
    this.FREEZE_DURATION = 180; // 3.0 seconds (180 frames at 60fps)

    // Stun state (Back-hit & Fire Hazard stun)
    this.p1StunTimer = 0;
    this.p2StunTimer = 0;

    // Zuko: Flame Wall
    this.flameWallActive = false;
    this.flameWallTimer = 0;
    this.flameWallH = 0;

    // Toph: Flying Boulders
    this.boulders = []; // {x, y, vx, radius, isP1, distTraveled, maxDist, isStopped, stoppedTimer, hasHitOpponent}

    // Zuko: Remote strike (no projectile)
    // Aang: Wind catch mode
    this.p1WindCatchActive = false;
    this.p2WindCatchActive = false;
    this.p1WindCatchTimer = 0;
    this.p2WindCatchTimer = 0;
    this.WIND_CATCH_DURATION = 240; // ~4 seconds window to catch

    // Toph: Earth wall in front of goal
    this.p1EarthWallTimer = 0;
    this.p2EarthWallTimer = 0;
    this.EARTH_WALL_DURATION = 210; // ~3.5 seconds

    // Azula: Lightning Bolts & Static Pulses
    this.lightningBolts = []; // {x, y, vx, width, height, isP1, timer, zaps}
    this.staticPulses = []; // {x, y, radius, maxRadius, isP1, timer}
    this.p1ShockTimer = 0;
    this.p2ShockTimer = 0;
    this.puckLightningBoostTimer = 0;

    // Ball serving state
    this.servingPlayer = null;
    this.serveReady = false;

    // === GOAL BUG FIX: flag to prevent multiple goals ===
    this.goalScored = false;

    // State
    this.scoreP1 = 0;
    this.scoreP2 = 0;
    this.targetScore = 7;
    this.isPaused = false;
    this.isPlaying = false;
    this.isAiMode = false;
    this.isOnlineMode = false;
    this.isHost = false;
    this.isGuest = false;
    this.winner = null;
    this.selectedMap = 'ice';
    this.windState = 'active'; // 'active' or 'calm'
    this.windDirX = 1; // 1 or -1
    this.windDirY = 0.5; // diagonal y direction
    this.windTimer = 240; // timer for wind phases

    // === MAP HAZARD STATES ===
    // Fire Map: Ground Flame Patch & Puck Speed Boost
    this.fireFlameTimer = 200;
    this.fireFlameActive = false;
    this.fireFlameX = 0;
    this.fireFlameY = 0;
    this.fireFlameRadius = 38;
    this.fireFlameDuration = 0;
    this.puckFireBoostTimer = 0;

    // Ice Map: Center Tidal Wave Sweeping Paddles
    this.iceWaveTimer = 350;
    this.iceWaveActive = false;
    this.iceWaveXLeft = 0;
    this.iceWaveXRight = 0;

    // Air Map: Ground Tornado Puck Launcher
    this.airTornadoTimer = 280;
    this.airTornadoActive = false;
    this.airTornadoX = 0;
    this.airTornadoY = 0;
    this.airTornadoRadius = 42;
    this.airTornadoDuration = 0;

    // Earth Map: Mud Slowdown Zone & Rising Rock Obstacles
    this.earthRockTimer = 250;
    this.earthRockActive = false;
    this.earthRockX = 0;
    this.earthRockY = 0;
    this.earthRockW = 64;
    this.earthRockH = 64;
    this.earthRockDuration = 0;

    // Storm Map: Lightning Strikes & High-Voltage Electric Rail Hazards
    this.stormLightningTimer = 360;
    this.stormLightningActive = false;
    this.stormLightningTelegraph = 0;
    this.stormLightningX = 0;
    this.stormLightningY = 0;
    this.stormLightningRadius = 55;
    this.stormMapCanvas = null;

    // Key states
    this.keys = {};
    this.keyJustPressed = {};

    // Animation Timers & Strike Shockwave FX
    this.animTime = 0;
    this.p1StrikeAnim = 0;
    this.p2StrikeAnim = 0;

    // Preload & Cache Character Portraits
    this.characterImages = {};
    if (typeof Image !== 'undefined') {
      ['katara', 'zuko', 'aang', 'toph', 'azula'].forEach(char => {
        const img = new Image();
        img.src = `assets/characters/${char}.jpg`;
        this.characterImages[char] = img;
      });
    }

    // DOM Elements
    this.elScoreP1 = document.getElementById('scoreP1');
    this.elScoreP2 = document.getElementById('scoreP2');
    this.elHitSpeed = document.getElementById('hitSpeedMeter');
    this.startModal = document.getElementById('avatarStartModal');
    this.pauseModal = document.getElementById('pauseModal');
    this.winModal = document.getElementById('winModal');
    this.winnerText = document.getElementById('winnerText');
    this.elP1Energy = document.getElementById('p1EnergyBar');
    this.elP2Energy = document.getElementById('p2EnergyBar');

    // HUD Avatars and Cut-In DOM
    this.p1AvatarImg = document.getElementById('p1AvatarImg');
    this.p2AvatarImg = document.getElementById('p2AvatarImg');
    this.p1CharName = document.getElementById('p1CharName');
    this.p2CharName = document.getElementById('p2CharName');
    this.bendingCutin = document.getElementById('bendingCutin');
    this.cutinBar = document.getElementById('cutinBar');
    this.cutinPortrait = document.getElementById('cutinPortrait');
    this.cutinCharName = document.getElementById('cutinCharName');
    this.cutinAbilityName = document.getElementById('cutinAbilityName');
    this.winChampionImg = document.getElementById('winChampionImg');
    this.winElementHalo = document.getElementById('winElementHalo');
    this.cutinTimeout = null;

    this.setupInputs();
    this.setupEvents();
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      if (['Space', 'Enter', 'Numpad0'].includes(e.code)) {
        e.preventDefault();
        if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
          document.activeElement.blur();
        }
      }
      if (!this.keys[e.code]) {
        this.keyJustPressed[e.code] = true;
      }
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
      if (['Space', 'Enter', 'Numpad0'].includes(e.code)) {
        e.preventDefault();
      }
      this.keys[e.code] = false;
      this.keyJustPressed[e.code] = false;
    });
  }

  notifyRoomConfigChange() {
    if (window.onlineManager && window.onlineManager.isHost && window.onlineManager.isConnected) {
      window.onlineManager.sendRoomConfig({
        p1Char: this.p1CharKey,
        p2Char: this.p2CharKey,
        map: this.selectedMap
      });
    }
  }

  setupEvents() {
    document.querySelectorAll('.p1-char-card').forEach((card) => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.p1-char-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.p1CharKey = card.dataset.char;
        this.updateHudAvatars();
        this.notifyRoomConfigChange();
      });
    });
    document.querySelectorAll('.p2-char-card').forEach((card) => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.p2-char-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.p2CharKey = card.dataset.char;
        this.updateHudAvatars();
        this.notifyRoomConfigChange();
      });
    });

    document.querySelectorAll('.map-card').forEach((card) => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.map-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.selectedMap = card.dataset.map;
        this.notifyRoomConfigChange();
      });
    });

    document.getElementById('btnAvatarStart2P')?.addEventListener('click', () => {
      this.isOnlineMode = false;
      this.isAiMode = false;
      this.startGame();
    });
    document.getElementById('btnAvatarStartAI')?.addEventListener('click', () => {
      this.isOnlineMode = false;
      this.isAiMode = true;
      this.startGame();
    });

    this.updateHudAvatars();
  }

  updateHudAvatars() {
    const p1Char = this.champions[this.p1CharKey] || this.champions.katara;
    const p2Char = this.champions[this.p2CharKey] || this.champions.zuko;

    if (this.p1AvatarImg) {
      this.p1AvatarImg.src = `assets/characters/${this.p1CharKey}.jpg`;
      this.p1AvatarImg.alt = p1Char.name;
    }
    if (this.p1CharName) {
      this.p1CharName.innerText = p1Char.name.toUpperCase();
    }
    if (this.p2AvatarImg) {
      this.p2AvatarImg.src = `assets/characters/${this.p2CharKey}.jpg`;
      this.p2AvatarImg.alt = p2Char.name;
    }
    if (this.p2CharName) {
      this.p2CharName.innerText = p2Char.name.toUpperCase();
    }
  }

  showBendingCutIn(charKey, abilityName, isP1) {
    if (!this.bendingCutin || !this.cutinPortrait) return;
    const char = this.champions[charKey];
    if (!char) return;

    this.cutinPortrait.src = `assets/characters/${charKey}.jpg`;
    if (this.cutinCharName) {
      this.cutinCharName.innerText = char.name.toUpperCase();
      this.cutinCharName.style.color = char.color;
    }
    if (this.cutinAbilityName) {
      this.cutinAbilityName.innerText = `${abilityName} ${char.icon}`;
    }
    if (this.cutinBar) {
      this.cutinBar.style.borderTopColor = char.color;
      this.cutinBar.style.borderBottomColor = char.color;
      this.cutinBar.style.boxShadow = `0 0 35px ${char.glow}`;
    }

    this.bendingCutin.classList.remove('active');
    void this.bendingCutin.offsetWidth;
    this.bendingCutin.classList.add('active');

    if (this.cutinTimeout) clearTimeout(this.cutinTimeout);
    this.cutinTimeout = setTimeout(() => {
      this.bendingCutin?.classList.remove('active');
    }, 850);
  }

  startOnlineGame(isHost) {
    this.isOnlineMode = true;
    this.isHost = isHost;
    this.isGuest = !isHost;
    this.isAiMode = false;
    this.startGame();
  }

  startGame() {
    if (window.onlineManager && window.onlineManager.isConnected) {
      this.isOnlineMode = true;
      this.isHost = window.onlineManager.isHost;
      this.isGuest = window.onlineManager.isGuest;
      this.isAiMode = false;
    }

    if (!this.isOnlineMode || this.isHost) {
      this.selectedMap = document.querySelector('.map-card.active')?.dataset.map || this.selectedMap || 'ice';
    }
    this.iceMapCanvas = null;
    this.fireMapCanvas = null;
    this.airMapCanvas = null;
    this.earthMapCanvas = null;
    this.stormMapCanvas = null;
    this.scoreP1 = 0;
    this.scoreP2 = 0;
    this.winner = null;
    this.isPlaying = true;
    this.isPaused = false;
    this.goalScored = false;
    this.p1AbilityCooldown = 0;
    this.p2AbilityCooldown = 0;
    this.iceBeams = [];
    this.lightningBolts = [];
    this.staticPulses = [];
    this.p1FreezeTimer = 0;
    this.p2FreezeTimer = 0;
    this.p1StunTimer = 0;
    this.p2StunTimer = 0;
    this.p1ShockTimer = 0;
    this.p2ShockTimer = 0;
    this.puckLightningBoostTimer = 0;
    this.p1EarthWallTimer = 0;
    this.p2EarthWallTimer = 0;
    this.fireFlameActive = false;
    this.puckFireBoostTimer = 0;
    this.fireFlameTimer = 200;
    this.iceWaveActive = false;
    this.iceWaveTimer = 350;
    this.airTornadoActive = false;
    this.airTornadoTimer = 280;
    this.earthRockActive = false;
    this.earthRockTimer = 250;
    this.stormLightningActive = false;
    this.stormLightningTelegraph = 0;
    this.stormLightningTimer = 360;

    const p1Char = this.champions[this.p1CharKey] || this.champions['katara'];
    const p2Char = this.champions[this.p2CharKey] || this.champions['zuko'];
    this.p1.color = p1Char.color;
    this.p1.height = p1Char.paddleHeight;
    this.p2.color = p2Char.color;
    this.p2.height = p2Char.paddleHeight;

    this.updateScoreDisplay();
    this.updateHudAvatars();
    this.startModal?.classList.remove('active');
    document.getElementById('onlineStartModal')?.classList.remove('active');
    this.pauseModal?.classList.remove('active');
    this.winModal?.classList.remove('active');

    this.setupServe('p1');
  }

  setupServe(whoServes) {
    this.servingPlayer = whoServes;
    this.serveReady = true;
    this.goalScored = false;
    
    this.p1.reset();
    this.p2.reset();
    this.p1StunTimer = 0;
    this.p2StunTimer = 0;
    this.rallyCount = 0;
    this.rallyHeat = 0;
    this.lastHitFrame = 0;
    this.screenShakeTimer = 0;

    if (whoServes === 'p1') {
      this.puck.x = this.p1.x + this.p1.width / 2 + this.puck.radius + 5;
      this.puck.y = this.height / 2;
    } else {
      this.puck.x = this.p2.x - this.p2.width / 2 - this.puck.radius - 5;
      this.puck.y = this.height / 2;
    }
    this.puck.vx = 0;
    this.puck.vy = 0;
    this.puck.lastHitBy = null;
    this.puck.isWhipped = null;
    effects.clearTrail();
    
    this.updateHitSpeedMeter(0);
  }

  serveTheBall(whoServes) {
    if (!this.serveReady) return;
    this.serveReady = false;
    this.servingPlayer = null;
    
    const char = this.champions[whoServes === 'p1' ? this.p1CharKey : this.p2CharKey];
    const dir = whoServes === 'p1' ? 1 : -1;
    const launchSpeed = char.strikeForce * 0.7;
    const angle = (Math.random() - 0.5) * 0.8;

    this.puck.vx = dir * launchSpeed * Math.cos(angle);
    this.puck.vy = launchSpeed * Math.sin(angle);
    this.puck.lastHitBy = whoServes;
    this.puck.isWhipped = null;
    this.rallyCount = 1;
    this.rallyHeat = 0;
    this.lastHitFrame = this.gameFrame || 0;
    
    soundFx.playHit(true, 0.8);
    this.updateHitSpeedMeter(launchSpeed);
  }

  // ============ ABILITIES ============

  executeAangWindFling(isP1) {
    const playerTag = isP1 ? 'p1' : 'p2';
    const player = isP1 ? this.p1 : this.p2;

    if (isP1) { this.p1WindCatchActive = false; this.p1WindCatchTimer = 0; }
    else { this.p2WindCatchActive = false; this.p2WindCatchTimer = 0; }

    soundFx.playHit(true, 1.8);
    effects.addHitSparks(this.puck.x, this.puck.y, isP1 ? 1 : -1, 0, '#00ffcc', true);

    // Suction pull: Pull puck to front of paddle
    this.puck.x = isP1 ? player.x + player.width / 2 + 18 : player.x - player.width / 2 - 18;
    this.puck.y = player.y;

    const launchSpeed = 16.5;
    const randomAngle = (Math.random() - 0.5) * 1.1; // -32 deg to +32 deg targeted shot
    const dirX = isP1 ? 1 : -1;

    this.puck.vx = dirX * launchSpeed * Math.cos(randomAngle);
    this.puck.vy = launchSpeed * Math.sin(randomAngle);
    this.puck.lastHitBy = playerTag;

    this.updateHitSpeedMeter(launchSpeed, '🌪️ AANG: RÜZGAR FIRLATMASI!');
  }

  triggerAbility(playerTag) {
    const isP1 = playerTag === 'p1';
    const charKey = isP1 ? this.p1CharKey : this.p2CharKey;
    const char = this.champions[charKey];
    const cooldown = isP1 ? this.p1AbilityCooldown : this.p2AbilityCooldown;
    const freezeTimer = isP1 ? this.p1FreezeTimer : this.p2FreezeTimer;
    const stunTimer = isP1 ? this.p1StunTimer : this.p2StunTimer;

    if (cooldown > 0 || freezeTimer > 0 || stunTimer > 0) return;

    if (isP1) {
      this.p1AbilityCooldown = char.abilityCooldown;
      this.p1StrikeAnim = 1.0;
    } else {
      this.p2AbilityCooldown = char.abilityCooldown;
      this.p2StrikeAnim = 1.0;
    }

    this.showBendingCutIn(charKey, char.abilityName, isP1);

    if (charKey === 'katara') {
      const beamX = isP1 ? this.p1.x + 25 : this.p2.x - 25;
      const beamVx = isP1 ? 14 : -14;
      this.iceBeams.push({
        x: beamX,
        y: isP1 ? this.p1.y : this.p2.y,
        vx: beamVx,
        width: 32,
        height: 16,
        isP1: isP1
      });
      soundFx.playHit(true, 1.2);
      this.updateHitSpeedMeter(0, '🌊 KATARA: BUZ ŞERİDİ FIRLATILDI!');
    }
    else if (charKey === 'zuko') {
      const pushDir = isP1 ? 1 : -1;
      const hitAngle = (Math.random() - 0.5) * 0.8;
      const power = 16.0;

      this.puck.vx = pushDir * power * Math.cos(hitAngle);
      this.puck.vy = power * Math.sin(hitAngle);
      this.puck.lastHitBy = playerTag;
      
      soundFx.playHit(true, 1.5);
      this.updateHitSpeedMeter(power, '🔥 ZUKO: UZAKTAN ATEŞ VURUŞU!');
      effects.addHitSparks(this.puck.x, this.puck.y, pushDir, hitAngle, '#ff3300', true);
    }
    else if (charKey === 'aang') {
      // WIND CATCH & FLING: Sucks puck immediately if near, or activates Air Vacuum Catch Mode
      const player = isP1 ? this.p1 : this.p2;
      const dist = Math.hypot(this.puck.x - player.x, this.puck.y - player.y);
      const suctionRadius = 175; // Wide vacuum catch radius!

      if (dist <= suctionRadius && !this.goalScored) {
        this.executeAangWindFling(isP1);
      } else {
        if (isP1) {
          this.p1WindCatchActive = true;
          this.p1WindCatchTimer = this.WIND_CATCH_DURATION;
        } else {
          this.p2WindCatchActive = true;
          this.p2WindCatchTimer = this.WIND_CATCH_DURATION;
        }
        soundFx.playHit(true, 1.3);
        this.updateHitSpeedMeter(0, '🌪️ AANG: RÜZGAR ÇEKİMİ AKTİF!');
      }
    }
    else if (charKey === 'toph') {
      // EARTH WALL: wall in front of own goal
      if (isP1) this.p1EarthWallTimer = this.EARTH_WALL_DURATION;
      else this.p2EarthWallTimer = this.EARTH_WALL_DURATION;
      soundFx.playHit(true, 1.4);
      this.updateHitSpeedMeter(0, '🪨 TOPH: KAYA DUVARI ÖRÜLDÜ!');
    }
    else if (charKey === 'azula') {
      // 1st Ability: Yıldırım Oku (Lightning Bolt)
      const player = isP1 ? this.p1 : this.p2;
      const startX = isP1 ? player.x + 30 : player.x - 30;
      const vx = isP1 ? 16.5 : -16.5;
      this.lightningBolts.push({
        x: startX,
        y: player.y,
        vx: vx,
        width: 36,
        height: 16,
        isP1: isP1,
        distTraveled: 0,
        maxDist: this.width
      });
      soundFx.playLightning();
      effects.addHitSparks(startX, player.y, isP1 ? 1 : -1, 0, '#c084fc', true);
      this.updateHitSpeedMeter(0, '⚡ AZULA: YILDIRIM OKU FIRLATILDI!');
    }
  }

  triggerAbility2(playerTag) {
    const isP1 = playerTag === 'p1';
    const charKey = isP1 ? this.p1CharKey : this.p2CharKey;
    const char = this.champions[charKey];
    const cooldown = isP1 ? this.p1AbilityCooldown : this.p2AbilityCooldown;
    const freezeTimer = isP1 ? this.p1FreezeTimer : this.p2FreezeTimer;
    const stunTimer = isP1 ? this.p1StunTimer : this.p2StunTimer;

    if (cooldown > 0 || freezeTimer > 0 || stunTimer > 0) return;

    if (isP1) {
      this.p1StrikeAnim = 1.0;
    } else {
      this.p2StrikeAnim = 1.0;
    }

    this.showBendingCutIn(charKey, char.ability2Name, isP1);

    const player = isP1 ? this.p1 : this.p2;
    const border = this.table.border;

    if (charKey === 'katara') {
      if (isP1) this.p1AbilityCooldown = char.ability2Cooldown;
      else this.p2AbilityCooldown = char.ability2Cooldown;

      const whipW = 340;
      const whipX = isP1 ? player.x + whipW / 2 : player.x - whipW / 2;
      this.waterWhips.push({
        x: whipX,
        y: player.y,
        width: whipW,
        height: 24,
        isP1: isP1,
        timer: 22
      });
      soundFx.playHit(true, 1.5);
      effects.addHitSparks(whipX, player.y, isP1 ? 1 : -1, 0, '#00ccff', true);
      this.updateHitSpeedMeter(0, '🌊 KATARA: SU KIRBACI SAVURDU!');
    }
    else if (charKey === 'zuko') {
      // 2nd Ability: Alev Duvarı (Flame Wall) - Step-by-step held key growing mechanic!
      if (this.flameWallActive) return;

      // IMMEDIATELY deplete energy bar so 1st ability cannot be triggered simultaneously!
      if (isP1) this.p1AbilityCooldown = char.ability2Cooldown;
      else this.p2AbilityCooldown = char.ability2Cooldown;

      this.flameWallActive = true;
      this.flameWallBuilding = true;
      this.flameWallPlayer = playerTag;
      this.flameWallStepCount = 1;
      this.flameWallMaxSteps = 4;
      this.flameWallStepTimer = 0;
      this.flameWallActiveTimer = 210;

      soundFx.playHit(true, 1.6);
      this.updateHitSpeedMeter(0, '🔥 ZUKO: ALEV DUVARI ÖRÜLÜYOR...');
    }
    else if (charKey === 'aang') {
      if (isP1) this.p1AbilityCooldown = char.ability2Cooldown;
      else this.p2AbilityCooldown = char.ability2Cooldown;

      const targetX = isP1 ? border + 45 : this.width - border - 45;
      const targetY = this.height / 2;

      effects.addGoalBurst(player.x, player.y, '#00ffcc');
      player.x = targetX;
      player.y = targetY;
      player.vx = 0;
      player.vy = 0;
      soundFx.playHit(true, 1.4);
      effects.addGoalBurst(player.x, player.y, '#ffffff');

      // Repel puck if heading towards goal
      const dirX = isP1 ? -1 : 1;
      if ((isP1 && this.puck.vx < 0 && this.puck.x < 200) || (!isP1 && this.puck.vx > 0 && this.puck.x > this.width - 200)) {
        this.puck.vx = -this.puck.vx * 1.3;
        effects.addHitSparks(this.puck.x, this.puck.y, -dirX, 0, '#00ffcc', true);
      }

      this.updateHitSpeedMeter(0, '🌪️ AANG: KALE ÖNÜNE IŞINLANDI!');
    }
    else if (charKey === 'toph') {
      if (isP1) this.p1AbilityCooldown = char.ability2Cooldown;
      else this.p2AbilityCooldown = char.ability2Cooldown;

      const startX = isP1 ? player.x + 30 : player.x - 30;
      const vx = isP1 ? 12 : -12;
      const maxDist = (this.width / 2) - 40; // Approx half the field length (~440px range)
      this.boulders.push({
        x: startX,
        y: player.y,
        vx: vx,
        radius: 24,
        isP1: isP1,
        distTraveled: 0,
        maxDist: maxDist,
        isStopped: false,
        stoppedTimer: 210, // ~3.5 seconds stays on ground as obstacle
        hasHitOpponent: false
      });
      soundFx.playHit(true, 1.5);
      effects.addHitSparks(startX, player.y, isP1 ? 1 : -1, 0, '#ffaa00', true);
      this.updateHitSpeedMeter(0, '🪨 TOPH: MENZİLLİ KAYA FIRLATILDI!');
    }
    else if (charKey === 'azula') {
      if (isP1) this.p1AbilityCooldown = char.ability2Cooldown;
      else this.p2AbilityCooldown = char.ability2Cooldown;

      const pulseX = isP1 ? player.x + 35 : player.x - 35;
      this.staticPulses.push({
        x: pulseX,
        y: player.y,
        radius: 20,
        maxRadius: 220,
        isP1: isP1,
        timer: 26
      });
      soundFx.playShock();
      soundFx.playLightning();
      effects.addHitSparks(pulseX, player.y, isP1 ? 1 : -1, 0, '#00f5ff', true);
      effects.addGoalBurst(pulseX, player.y, '#a855f7');
      this.updateHitSpeedMeter(0, '⚡ AZULA: STATİK ŞOK DALGASI!');
    }
  }

  // ============ MOVEMENT ============

  handlePlayerMovement() {
    const border = this.table.border;

    const applyMovement = (player, charKey, isP1, forceDx = null, forceDy = null) => {
      let inputDx = 0, inputDy = 0;
      const freezeTimer = isP1 ? this.p1FreezeTimer : this.p2FreezeTimer;
      const stunTimer = isP1 ? this.p1StunTimer : this.p2StunTimer;
      const char = this.champions[charKey];
      
      if (freezeTimer <= 0 && stunTimer <= 0) {
        if (forceDx !== null && forceDy !== null) {
          inputDx = forceDx; inputDy = forceDy; // AI movement
        } else {
          if (isP1) {
            if (this.keys['KeyW']) inputDy -= char.moveSpeed;
            if (this.keys['KeyS']) inputDy += char.moveSpeed;
            if (this.keys['KeyA']) inputDx -= char.moveSpeed;
            if (this.keys['KeyD']) inputDx += char.moveSpeed;
          } else {
            if (this.keys['ArrowUp']) inputDy -= char.moveSpeed;
            if (this.keys['ArrowDown']) inputDy += char.moveSpeed;
            if (this.keys['ArrowLeft']) inputDx -= char.moveSpeed;
            if (this.keys['ArrowRight']) inputDx += char.moveSpeed;
          }
        }
      }

      // Diagonal speed normalization for consistent velocity
      if (inputDx !== 0 && inputDy !== 0) {
        inputDx *= 0.7071;
        inputDy *= 0.7071;
      }

      if (player.moveVx === undefined) player.moveVx = 0;
      if (player.moveVy === undefined) player.moveVy = 0;
      if (player.tiltAngle === undefined) player.tiltAngle = 0;

      // Stun momentum brake
      if (stunTimer > 0) {
        player.moveVx *= 0.4;
        player.moveVy *= 0.4;
        if (Math.abs(player.moveVx) < 0.1) player.moveVx = 0;
        if (Math.abs(player.moveVy) < 0.1) player.moveVy = 0;
      }

      let dx = 0, dy = 0;

      // Ice Map: Low-friction slippery movement (Katara is immune)
      if (this.selectedMap === 'ice' && charKey !== 'katara') {
        let iceVx = (isP1 ? this.p1IceVx : this.p2IceVx) || 0;
        let iceVy = (isP1 ? this.p1IceVy : this.p2IceVy) || 0;

        iceVx = iceVx * 0.94 + inputDx * 0.12;
        iceVy = iceVy * 0.94 + inputDy * 0.12;

        const currentSpeed = Math.hypot(iceVx, iceVy);
        if (currentSpeed > char.moveSpeed) {
          iceVx = (iceVx / currentSpeed) * char.moveSpeed;
          iceVy = (iceVy / currentSpeed) * char.moveSpeed;
        }

        if (isP1) { this.p1IceVx = iceVx; this.p1IceVy = iceVy; }
        else { this.p2IceVx = iceVx; this.p2IceVy = iceVy; }

        player.moveVx = iceVx;
        player.moveVy = iceVy;
        dx = iceVx;
        dy = iceVy;
      } else {
        // WEIGHT & TRACTION INERTIA (Normal maps & Katara on ice)
        // Distinct physical weight: smooth ramp up (3-5 frames), sharp braking on release (2-3 frames), NO ice sliding!
        const accelRate = char.accel || 0.32;
        const brakeRate = char.brake || 0.60;

        // X-Axis
        if (inputDx !== 0) {
          const isReversingX = (player.moveVx > 0.3 && inputDx < 0) || (player.moveVx < -0.3 && inputDx > 0);
          const effectiveAccelX = isReversingX ? Math.min(0.75, accelRate * 2.2) : accelRate;
          player.moveVx += (inputDx - player.moveVx) * effectiveAccelX;
        } else {
          player.moveVx *= brakeRate;
          if (Math.abs(player.moveVx) < 0.18) player.moveVx = 0;
        }

        // Y-Axis
        if (inputDy !== 0) {
          const isReversingY = (player.moveVy > 0.3 && inputDy < 0) || (player.moveVy < -0.3 && inputDy > 0);
          const effectiveAccelY = isReversingY ? Math.min(0.75, accelRate * 2.2) : accelRate;
          player.moveVy += (inputDy - player.moveVy) * effectiveAccelY;
        } else {
          player.moveVy *= brakeRate;
          if (Math.abs(player.moveVy) < 0.18) player.moveVy = 0;
        }

        // Hard clamp to char.moveSpeed
        const curSpd = Math.hypot(player.moveVx, player.moveVy);
        if (curSpd > char.moveSpeed) {
          player.moveVx = (player.moveVx / curSpd) * char.moveSpeed;
          player.moveVy = (player.moveVy / curSpd) * char.moveSpeed;
        }

        if (isP1) { this.p1IceVx = player.moveVx; this.p1IceVy = player.moveVy; }
        else { this.p2IceVx = player.moveVx; this.p2IceVy = player.moveVy; }

        dx = player.moveVx;
        dy = player.moveVy;
      }

      // Dynamic Inertia Tilt (Paddle & portrait tilt forward with acceleration)
      const targetTilt = (player.moveVx / char.moveSpeed) * (isP1 ? 0.08 : -0.08);
      player.tiltAngle = (player.tiltAngle || 0) + (targetTilt - (player.tiltAngle || 0)) * 0.25;

      // Static Shock & Stun Jitter Disruption
      const shockTimer = isP1 ? this.p1ShockTimer : this.p2ShockTimer;
      if ((shockTimer > 0 || stunTimer > 0) && freezeTimer <= 0) {
        dx += (Math.random() - 0.5) * 2.8;
        dy += (Math.random() - 0.5) * 2.8;
        if (Math.random() < 0.22) {
          effects.addHitSparks(player.x, player.y, (Math.random() - 0.5), (Math.random() - 0.5), stunTimer > 0 ? '#ffea00' : '#a855f7', false);
        }
      }

      // Air Map: Diagonal Wind (only when wind is active)
      if (this.selectedMap === 'air' && charKey !== 'aang' && this.windState === 'active') {
        dx += this.windDirX * 1.0;
        dy += this.windDirY * 1.0;
      }

      // Storm Map: High-Voltage Electrified Rails (Azula is grounded/immune)
      if (this.selectedMap === 'storm' && charKey !== 'azula') {
        const railRepelDist = border + player.height / 2 + 12;
        if (player.y < railRepelDist) {
          dy += 2.0; // Repelled downward from top rail
          if (Math.random() < 0.2) effects.addHitSparks(player.x, player.y, 0, 1, '#a855f7', false);
        } else if (player.y > this.height - railRepelDist) {
          dy -= 2.0; // Repelled upward from bottom rail
          if (Math.random() < 0.2) effects.addHitSparks(player.x, player.y, 0, -1, '#a855f7', false);
        }
      }

      // Earth Map: Muddy soil center zone slowdown (Toph is immune)
      if (this.selectedMap === 'earth' && charKey !== 'toph') {
        const centerMinX = (this.width / 2) - 140;
        const centerMaxX = (this.width / 2) + 140;
        if (player.x >= centerMinX && player.x <= centerMaxX) {
          dx *= 0.35;
          dy *= 0.35;
        }
      }

      // Earth Map: Block paddle from walking into Rock Obstacle
      if (this.selectedMap === 'earth' && this.earthRockActive) {
        const rW = this.earthRockW;
        const rH = this.earthRockH;
        const rMinX = this.earthRockX - rW / 2;
        const rMaxX = this.earthRockX + rW / 2;
        const rMinY = this.earthRockY - rH / 2;
        const rMaxY = this.earthRockY + rH / 2;

        const nextX = player.x + dx;
        const nextY = player.y + dy;
        const pRadius = player.width / 2;

        if (nextX + pRadius > rMinX && nextX - pRadius < rMaxX &&
            nextY + pRadius > rMinY && nextY - pRadius < rMaxY) {
          dx = 0;
          dy = 0;
        }
      }

      // Toph Grounded Boulders: Block paddle movement
      for (const b of this.boulders) {
        if (b.isStopped) {
          const dist = Math.hypot((player.x + dx) - b.x, (player.y + dy) - b.y);
          if (dist < b.radius + player.width / 2) {
            dx = 0;
            dy = 0;
            break;
          }
        }
      }

      player.x += dx;
      player.y += dy;

      // Fire Map: Restricted middle zone
      let minX = border + 30;
      let maxX = (this.width / 2) - player.width / 2 - 5;
      if (!isP1) {
        minX = (this.width / 2) + player.width / 2 + 5;
        maxX = this.width - border - 30;
      }

      if (this.selectedMap === 'fire' && charKey !== 'zuko') {
        const restriction = 140; // 140px safe distance from center
        if (isP1) maxX = (this.width / 2) - restriction;
        else minX = (this.width / 2) + restriction;
      }

      const clampedX = Math.max(minX, Math.min(maxX, player.x));
      const clampedY = Math.max(border + player.height / 2, Math.min(this.height - border - player.height / 2, player.y));
      if (clampedX !== player.x) player.moveVx = 0;
      if (clampedY !== player.y) player.moveVy = 0;
      player.x = clampedX;
      player.y = clampedY;
      player.updateVelocity();
    };

    // Online Mode Input Routing
    if (this.isOnlineMode) {
      if (this.isGuest) {
        // Guest sends local keyboard input (WASD or Arrow keys) to Host
        const input = {
          up: !!(this.keys['KeyW'] || this.keys['ArrowUp']),
          down: !!(this.keys['KeyS'] || this.keys['ArrowDown']),
          left: !!(this.keys['KeyA'] || this.keys['ArrowLeft']),
          right: !!(this.keys['KeyD'] || this.keys['ArrowRight']),
          serve: !!(this.keys['Space'] || this.keys['Enter'] || this.keys['Numpad0']),
          ability1: !!(this.keys['KeyQ'] || this.keys['Numpad1'] || this.keys['ShiftRight']),
          ability2: !!(this.keys['KeyE'] || this.keys['KeyP'] || this.keys['Numpad2'])
        };
        if (window.onlineManager) {
          window.onlineManager.sendGuestInput(input);
        }
        return;
      }

      // Online Host: P1 is local (WASD), P2 is Guest via WebRTC
      applyMovement(this.p1, this.p1CharKey, true);

      // P1 Serve (SPACE)
      if (this.keyJustPressed['Space']) {
        this.keyJustPressed['Space'] = false;
        if (this.servingPlayer === 'p1') this.serveTheBall('p1');
      }
      // P1 Ability 1 (Q)
      if (this.keyJustPressed['KeyQ']) {
        this.keyJustPressed['KeyQ'] = false;
        this.triggerAbility('p1');
      }
      // P1 Ability 2 (E)
      if (this.keyJustPressed['KeyE']) {
        this.keyJustPressed['KeyE'] = false;
        this.triggerAbility2('p1');
      }

      // P2 Movement (Remote Guest Inputs)
      const gi = window.onlineManager ? window.onlineManager.guestInput : {};
      const charP2 = this.champions[this.p2CharKey];
      let gDx = 0, gDy = 0;
      if (gi.up) gDy -= charP2.moveSpeed;
      if (gi.down) gDy += charP2.moveSpeed;
      if (gi.left) gDx -= charP2.moveSpeed;
      if (gi.right) gDx += charP2.moveSpeed;

      applyMovement(this.p2, this.p2CharKey, false, gDx, gDy);

      if (gi.serve && this.servingPlayer === 'p2') {
        this.serveTheBall('p2');
      }
      if (gi.ability1 && !this._lastGuestAbility1) {
        this.triggerAbility('p2');
      }
      this._lastGuestAbility1 = gi.ability1;

      if (gi.ability2 && !this._lastGuestAbility2) {
        this.triggerAbility2('p2');
      }
      this._lastGuestAbility2 = gi.ability2;

      return;
    }

    // Single-Player (AI) or Local 2-Player Movement
    applyMovement(this.p1, this.p1CharKey, true);

    // P1 Serve (SPACE)
    if (this.keyJustPressed['Space']) {
      this.keyJustPressed['Space'] = false;
      this.p1StrikeAnim = 1.0;
      if (this.servingPlayer === 'p1') {
        this.serveTheBall('p1');
      }
    }
    // P1 Ability 1 (Q)
    if (this.keyJustPressed['KeyQ']) {
      this.keyJustPressed['KeyQ'] = false;
      this.triggerAbility('p1');
    }
    // P1 Ability 2 (E)
    if (this.keyJustPressed['KeyE']) {
      this.keyJustPressed['KeyE'] = false;
      this.triggerAbility2('p1');
    }

    // === Player 2 Movement ===
    if (this.isAiMode) {
      this.updateAiBot(this.p2CharKey, applyMovement);
    } else {
      applyMovement(this.p2, this.p2CharKey, false);
    }

    // P2 Serve (ENTER)
    if (this.keyJustPressed['Enter'] || this.keyJustPressed['Numpad0']) {
      this.keyJustPressed['Enter'] = false;
      this.keyJustPressed['Numpad0'] = false;
      this.p2StrikeAnim = 1.0;
      if (this.servingPlayer === 'p2') {
        this.serveTheBall('p2');
      }
    }
    // P2 Ability 1 (Numpad1 or RShift)
    if (this.keyJustPressed['Numpad1'] || this.keyJustPressed['ShiftRight']) {
      this.keyJustPressed['Numpad1'] = false;
      this.keyJustPressed['ShiftRight'] = false;
      this.triggerAbility('p2');
    }
    // P2 Ability 2 (P or Numpad2)
    if (this.keyJustPressed['KeyP'] || this.keyJustPressed['Numpad2']) {
      this.keyJustPressed['KeyP'] = false;
      this.keyJustPressed['Numpad2'] = false;
      this.triggerAbility2('p2');
    }
  }

  // ============ AI ============

  updateAiBot(charKey, applyMovement) {
    const char = this.champions[charKey];
    if (this.p2FreezeTimer > 0 || this.p2StunTimer > 0) return; 
    
    const aiSpeed = char.moveSpeed * 0.82;
    let targetY = this.puck.y;
    let targetX = this.width * 0.78;
    
    if (this.puck.vx > 0) {
      targetY = this.puck.y + this.puck.vy * 8;
      targetX = this.width - 130;
    } else {
      targetX = this.width * 0.72;
    }

    const dx = targetX - this.p2.x;
    const dy = targetY - this.p2.y;
    const dist = Math.hypot(dx, dy);

    let moveX = 0, moveY = 0;
    if (dist > 4) {
      moveX = (dx / dist) * Math.min(aiSpeed, Math.abs(dx));
      moveY = (dy / dist) * Math.min(aiSpeed, Math.abs(dy));
    }
    
    applyMovement(this.p2, charKey, false, moveX, moveY);

    // AI serves
    if (this.servingPlayer === 'p2' && this.serveReady && Math.random() < 0.02) {
      this.serveTheBall('p2');
    }

    // AI uses ability
    if (this.p2AbilityCooldown <= 0 && Math.random() < 0.005) {
      this.triggerAbility('p2');
    }

    // AI uses ability 2
    if (this.p2Ability2Cooldown <= 0 && Math.random() < 0.004) {
      this.triggerAbility2('p2');
    }
  }

  // ============ COLLISIONS ============

  checkPaddlePuckBlock(paddle, playerTag) {
    const pMinX = paddle.x - paddle.width / 2;
    const pMaxX = paddle.x + paddle.width / 2;
    const pMinY = paddle.y - paddle.height / 2;
    const pMaxY = paddle.y + paddle.height / 2;

    const closestX = Math.max(pMinX, Math.min(pMaxX, this.puck.x));
    const closestY = Math.max(pMinY, Math.min(pMaxY, this.puck.y));

    const dx = this.puck.x - closestX;
    const dy = this.puck.y - closestY;
    const distSq = dx * dx + dy * dy;

    if (distSq < this.puck.radius * this.puck.radius) {
      const isP1 = playerTag === 'p1';
      const charKey = isP1 ? this.p1CharKey : this.p2CharKey;
      const char = this.champions[charKey];

      // Back-hit penalty check: Puck hits player from behind!
      // P1 faces right (+x), so puck behind P1 is (puck.x < paddle.x).
      // P2 faces left (-x), so puck behind P2 is (puck.x > paddle.x).
      const isBackHit = isP1 ? (this.puck.x < paddle.x) : (this.puck.x > paddle.x);
      if (isBackHit) {
        const forwardSpeed = Math.max(9.5, Math.hypot(this.puck.vx, this.puck.vy) * 1.08);
        const relY = (this.puck.y - paddle.y) / (paddle.height / 2);
        const deflectAngle = relY * 0.45;

        if (isP1) {
          this.p1AbilityCooldown = char.abilityCooldown;
          this.p1Ability2Cooldown = char.ability2Cooldown;
          this.p1StunTimer = 50;
          this.p1.moveVx = 0;
          this.p1.moveVy = 0;
          this.puck.x = pMaxX + this.puck.radius + 2;
          this.puck.vx = forwardSpeed * Math.cos(deflectAngle);
        } else {
          this.p2AbilityCooldown = char.abilityCooldown;
          this.p2Ability2Cooldown = char.ability2Cooldown;
          this.p2StunTimer = 50;
          this.p2.moveVx = 0;
          this.p2.moveVy = 0;
          this.puck.x = pMinX - this.puck.radius - 2;
          this.puck.vx = -forwardSpeed * Math.cos(deflectAngle);
        }
        this.puck.vy = forwardSpeed * Math.sin(deflectAngle);
        this.puck.lastHitBy = playerTag;
        soundFx.playBonk();
        effects.addHitSparks(this.puck.x, this.puck.y, isP1 ? 1 : -1, 0, '#ffff00', true);
        this.screenShakeTimer = 6;
        this.updateHitSpeedMeter(forwardSpeed, isP1 ? '😵 P1 ARKADAN VURULDU! STUN & YETENEK SIFIRLANDI!' : '😵 P2 ARKADAN VURULDU! STUN & YETENEK SIFIRLANDI!');
        return;
      }

      // Water Whip freeze check: If puck was struck by Katara's whip, freeze the opponent upon contact!
      if (this.puck.isWhipped) {
        if (this.puck.isWhipped === 'p1' && playerTag === 'p2') {
          this.p2FreezeTimer = this.FREEZE_DURATION;
          soundFx.playHit(true, 1.5);
          effects.addHitSparks(paddle.x, paddle.y, 1, 0, '#00ccff', true);
          this.updateHitSpeedMeter(0, `❄️ KIRBAÇLI TOP RAKİBE DEĞDİ VE DONDURDU!`);
        } else if (this.puck.isWhipped === 'p2' && playerTag === 'p1') {
          this.p1FreezeTimer = this.FREEZE_DURATION;
          soundFx.playHit(true, 1.5);
          effects.addHitSparks(paddle.x, paddle.y, -1, 0, '#00ccff', true);
          this.updateHitSpeedMeter(0, `❄️ KIRBAÇLI TOP RAKİBE DEĞDİ VE DONDURDU!`);
        }
        this.puck.isWhipped = null;
      }

      // Aang wind catch check: Catch & Launch at high speed towards opponent
      if ((isP1 && this.p1WindCatchActive) || (!isP1 && this.p2WindCatchActive)) {
        this.executeAangWindFling(isP1);
        return;
      }

      const overlapLeft = pMaxX - (this.puck.x - this.puck.radius);
      const overlapRight = (this.puck.x + this.puck.radius) - pMinX;
      const overlapTop = pMaxY - (this.puck.y - this.puck.radius);
      const overlapBottom = (this.puck.y + this.puck.radius) - pMinY;
      const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

      if (minOverlap === overlapLeft || minOverlap === overlapRight) {
        if (isP1) this.puck.x = pMaxX + this.puck.radius;
        else this.puck.x = pMinX - this.puck.radius;
        
        const relY = (this.puck.y - paddle.y) / (paddle.height / 2);
        const deflectAngle = relY * 0.62;

        // 1. Rally Tracking (Hızlı Paslaşma & Seri Vuruş Sayacı)
        const currentFrame = this.gameFrame || 0;
        const framesSinceLastHit = currentFrame - (this.lastHitFrame || 0);
        const isConsecutiveVolley = (this.puck.lastHitBy && this.puck.lastHitBy !== playerTag);

        if (isConsecutiveVolley) {
          this.rallyCount = (this.rallyCount || 0) + 1;
        } else if (!this.puck.lastHitBy) {
          this.rallyCount = 1;
        }
        this.lastHitFrame = currentFrame;

        // 2. Incoming Speed & Base Momentum
        const currentPuckSpeed = Math.hypot(this.puck.vx, this.puck.vy);
        let baseSpeed = Math.max(this.baseSpeed, currentPuckSpeed);

        // 3. Consecutive Rally Speed Multiplier (Her ardışık başarılı pasta hız artar)
        let rallyMultiplier = 1.0;
        if (this.rallyCount >= 2) {
          const stage = Math.min(8, this.rallyCount);
          rallyMultiplier += (stage - 1) * 0.085;
        }

        // 4. Rapid / Close-Quarter Ping-Pong Boost (Yakın Mesafe Hızlı Sekme Bonusu)
        let rapidBonus = 0;
        if (framesSinceLastHit > 0 && framesSinceLastHit < 75) {
          const quickness = 1.0 - (framesSinceLastHit / 75);
          rapidBonus += quickness * 2.8;
        }

        // Extra close proximity bonus if paddles are close to each other
        const paddleDistX = Math.abs(this.p1.x - this.p2.x);
        if (paddleDistX < this.width * 0.55) {
          const proximity = 1.0 - (paddleDistX / (this.width * 0.55));
          rapidBonus += proximity * 2.2;
        }

        // 5. Offensive Smash / Drive vs Defensive Cushioning
        const paddleMoveVx = paddle.moveVx !== undefined ? paddle.moveVx : paddle.vx;
        const paddleMoveVy = paddle.moveVy !== undefined ? paddle.moveVy : paddle.vy;

        const movingForward = isP1 ? paddleMoveVx > 0.35 : paddleMoveVx < -0.35;
        const movingBackward = isP1 ? paddleMoveVx < -0.4 : paddleMoveVx > 0.4;
        const forwardSpeed = Math.abs(paddleMoveVx);
        const forwardRatio = forwardSpeed / char.moveSpeed;

        let driveBonus = 0;
        let isDriveSmash = false;
        let isCushion = false;

        if (movingForward) {
          // Require character to build full forward momentum (at least 75% max speed) for powerful smash
          if (forwardRatio >= 0.75) {
            driveBonus = forwardSpeed * 1.45;
            isDriveSmash = true;

            const strikeActive = isP1 ? this.p1StrikeAnim > 0.25 : this.p2StrikeAnim > 0.25;
            if (strikeActive) {
              driveBonus += 2.4;
              this.screenShakeTimer = 7;
            }
          } else {
            // Balanced contact bonus if tapping forward without building full run momentum
            driveBonus = forwardSpeed * 0.35;
          }
        } else if (movingBackward) {
          // Defensive Cushion: Soft touch absorbs incoming velocity for control
          isCushion = true;
          rallyMultiplier *= 0.82;
        }

        // 6. Compute Final Outgoing Speed
        let speed = (baseSpeed * rallyMultiplier) + rapidBonus + driveBonus;

        // Ensure at least character's minimum strike force on full forward smashes
        if (isDriveSmash && speed < char.strikeForce) {
          speed = char.strikeForce + driveBonus * 0.3;
        }

        // Dynamic Max Speed Cap: Capped at balanced 21.5 km/h
        const dynamicMaxSpeed = Math.min(21.5, 15.0 + Math.min(6.5, (this.rallyCount || 1) * 0.7));
        speed = Math.min(dynamicMaxSpeed, Math.max(this.baseSpeed, speed));

        // 7. Spin / Slice Angular Deflection
        const sliceImpulse = paddleMoveVy * 0.38;
        const outgoingVy = (speed * Math.sin(deflectAngle)) + sliceImpulse;

        this.puck.vx = (isP1 ? 1 : -1) * speed * Math.cos(deflectAngle);
        this.puck.vy = outgoingVy;
        this.puck.lastHitBy = playerTag;

        // Update Rally Heat (0 to 1)
        this.rallyHeat = Math.min(1.0, Math.max(0, (this.rallyCount - 2) / 5));

        if (isP1) this.p1StrikeAnim = 1.0;
        else this.p2StrikeAnim = 1.0;

        // 8. Audio & Visual Feedback
        if (this.rallyCount >= 3) {
          soundFx.playRallyHit(this.rallyCount, speed / 12);
        } else if (isDriveSmash) {
          soundFx.playHit(true, speed / 10);
        } else {
          soundFx.playHit(false, 0.55);
        }

        // Dynamic sparks & effects
        if (this.rallyCount >= 6) {
          effects.addHitSparks(this.puck.x, this.puck.y, isP1 ? 1 : -1, relY * 0.5, '#ff0055', true);
          effects.addHitSparks(this.puck.x, this.puck.y, isP1 ? 1 : -1, relY * 0.5, '#00ffff', true);
        } else if (this.rallyCount >= 3 || isDriveSmash) {
          effects.addHitSparks(this.puck.x, this.puck.y, isP1 ? 1 : -1, relY * 0.5, char.trailColor, true);
        } else {
          effects.addHitSparks(this.puck.x, this.puck.y, isP1 ? 1 : -1, 0, char.trailColor, false);
        }

        // Speed Meter & HUD Banner
        let hitTag = '';
        if (this.rallyCount >= 7) {
          hitTag = `💥 HİPER RALLİ X${this.rallyCount} (${speed.toFixed(1)} km/h)!`;
        } else if (this.rallyCount >= 5) {
          hitTag = `⚡ SONİK RALLİ X${this.rallyCount} (${speed.toFixed(1)} km/h)!`;
        } else if (this.rallyCount >= 3) {
          hitTag = `🔥 ATEŞLİ RALLİ X${this.rallyCount} (${speed.toFixed(1)} km/h)!`;
        } else if (isDriveSmash) {
          hitTag = `💥 HÜCUM ŞUTU (${speed.toFixed(1)} km/h)!`;
        } else if (isCushion) {
          hitTag = `🛡️ YASTIKLAMA (${speed.toFixed(1)} km/h)`;
        }
        this.updateHitSpeedMeter(speed, hitTag);

      } else {
        if (this.puck.y < paddle.y) this.puck.y = pMinY - this.puck.radius;
        else this.puck.y = pMaxY + this.puck.radius;
        this.puck.vy = -this.puck.vy;
        this.puck.lastHitBy = playerTag;
        soundFx.playHit(false, 0.5);
      }
    }
  }

  checkEarthWallCollision(wallX, wallYCenter, wallW, wallH) {
    const wMinX = wallX - wallW / 2;
    const wMaxX = wallX + wallW / 2;
    const wMinY = wallYCenter - wallH / 2;
    const wMaxY = wallYCenter + wallH / 2;

    const closestX = Math.max(wMinX, Math.min(wMaxX, this.puck.x));
    const closestY = Math.max(wMinY, Math.min(wMaxY, this.puck.y));
    const dx = this.puck.x - closestX;
    const dy = this.puck.y - closestY;

    if (dx * dx + dy * dy < this.puck.radius * this.puck.radius) {
      this.puck.vx = -this.puck.vx;
      // Push puck out
      if (this.puck.x < wallX) this.puck.x = wMinX - this.puck.radius;
      else this.puck.x = wMaxX + this.puck.radius;
      soundFx.playWallHit();
      effects.addHitSparks(this.puck.x, this.puck.y, 0, 1, '#ffaa00', true);
    }
  }

  checkRockObstacleCollision() {
    if (!this.earthRockActive) return;

    const rW = this.earthRockW;
    const rH = this.earthRockH;
    const rMinX = this.earthRockX - rW / 2;
    const rMaxX = this.earthRockX + rW / 2;
    const rMinY = this.earthRockY - rH / 2;
    const rMaxY = this.earthRockY + rH / 2;

    const closestX = Math.max(rMinX, Math.min(rMaxX, this.puck.x));
    const closestY = Math.max(rMinY, Math.min(rMaxY, this.puck.y));
    const dx = this.puck.x - closestX;
    const dy = this.puck.y - closestY;
    const distSq = dx * dx + dy * dy;

    if (distSq < this.puck.radius * this.puck.radius) {
      const overlapLeft = (this.puck.x + this.puck.radius) - rMinX;
      const overlapRight = rMaxX - (this.puck.x - this.puck.radius);
      const overlapTop = (this.puck.y + this.puck.radius) - rMinY;
      const overlapBottom = rMaxY - (this.puck.y - this.puck.radius);

      const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

      if (minOverlap === overlapLeft) {
        this.puck.x = rMinX - this.puck.radius - 2;
        this.puck.vx = -Math.abs(this.puck.vx);
      } else if (minOverlap === overlapRight) {
        this.puck.x = rMaxX + this.puck.radius + 2;
        this.puck.vx = Math.abs(this.puck.vx);
      } else if (minOverlap === overlapTop) {
        this.puck.y = rMinY - this.puck.radius - 2;
        this.puck.vy = -Math.abs(this.puck.vy);
      } else {
        this.puck.y = rMaxY + this.puck.radius + 2;
        this.puck.vy = Math.abs(this.puck.vy);
      }

      soundFx.playWallHit();
      effects.addHitSparks(this.puck.x, this.puck.y, 0, 0, '#c8965a', false);
    }
  }

  // ============ ABILITY UPDATES ============

  updateAbilities() {
    // Cooldowns
    if (this.p1AbilityCooldown > 0) this.p1AbilityCooldown--;
    if (this.p2AbilityCooldown > 0) this.p2AbilityCooldown--;
    if (this.p1Ability2Cooldown > 0) this.p1Ability2Cooldown--;
    if (this.p2Ability2Cooldown > 0) this.p2Ability2Cooldown--;

    // Freeze timers
    if (this.p1FreezeTimer > 0) this.p1FreezeTimer--;
    if (this.p2FreezeTimer > 0) this.p2FreezeTimer--;

    // Stun timers
    if (this.p1StunTimer > 0) this.p1StunTimer--;
    if (this.p2StunTimer > 0) this.p2StunTimer--;

    // Shock timers (Azula electrical static disruption)
    if (this.p1ShockTimer > 0) this.p1ShockTimer--;
    if (this.p2ShockTimer > 0) this.p2ShockTimer--;

    // Puck Lightning Supercharge Boost Timer
    if (this.puckLightningBoostTimer > 0) {
      this.puckLightningBoostTimer--;
      if (Math.random() < 0.4) {
        effects.addHitSparks(this.puck.x, this.puck.y, (Math.random() - 0.5), (Math.random() - 0.5), '#00f5ff', false);
      }
    }

    // Update Azula Lightning Bolts (1st Ability)
    const border = this.table.border;
    for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
      const bolt = this.lightningBolts[i];
      bolt.x += bolt.vx;
      bolt.distTraveled += Math.abs(bolt.vx);

      if (Math.random() < 0.6) {
        effects.addHitSparks(bolt.x, bolt.y, bolt.vx > 0 ? 1 : -1, (Math.random() - 0.5) * 0.5, '#00f5ff', false);
      }

      // Check collision with puck
      const distToPuck = Math.hypot(this.puck.x - bolt.x, this.puck.y - bolt.y);
      if (distToPuck < bolt.width / 2 + this.puck.radius) {
        const dirX = bolt.isP1 ? 1 : -1;
        const launchSpeed = 17.2;
        const zapY = (Math.random() - 0.5) * 5.0;
        this.puck.vx = dirX * launchSpeed;
        this.puck.vy = zapY;
        this.puck.lastHitBy = bolt.isP1 ? 'p1' : 'p2';
        this.puckLightningBoostTimer = 140;
        soundFx.playLightning();
        effects.addHitSparks(this.puck.x, this.puck.y, dirX, zapY * 0.3, '#c084fc', true);
        effects.addGoalBurst(this.puck.x, this.puck.y, '#00f5ff');
        this.updateHitSpeedMeter(launchSpeed, '⚡ YILDIRIM OKU VURUŞU!');
        this.lightningBolts.splice(i, 1);
        continue;
      }

      // Check collision with opponent paddle (shock stun & knockback)
      const opponent = bolt.isP1 ? this.p2 : this.p1;
      const oMinX = opponent.x - opponent.width / 2;
      const oMaxX = opponent.x + opponent.width / 2;
      const oMinY = opponent.y - opponent.height / 2;
      const oMaxY = opponent.y + opponent.height / 2;

      if (bolt.x >= oMinX && bolt.x <= oMaxX && bolt.y >= oMinY && bolt.y <= oMaxY) {
        if (bolt.isP1) this.p2ShockTimer = 90;
        else this.p1ShockTimer = 90;

        const knockback = bolt.isP1 ? 40 : -40;
        opponent.x = Math.max(border + 35, Math.min(this.width - border - 35, opponent.x + knockback));

        soundFx.playShock();
        soundFx.playLightning();
        effects.addHitSparks(opponent.x, opponent.y, bolt.isP1 ? 1 : -1, 0, '#a855f7', true);
        this.updateHitSpeedMeter(0, `⚡ AZULA: RAKİP ELEKTRİKLENDİ!`);
        this.lightningBolts.splice(i, 1);
        continue;
      }

      if (bolt.distTraveled >= bolt.maxDist || bolt.x < 0 || bolt.x > this.width) {
        this.lightningBolts.splice(i, 1);
      }
    }

    // Update Azula Static Pulses (2nd Ability: EMP Shockwave)
    for (let i = this.staticPulses.length - 1; i >= 0; i--) {
      const pulse = this.staticPulses[i];
      pulse.timer--;
      pulse.radius += 7.5;

      // Check puck collision with pulse wavefront / inside shockwave
      const distPuck = Math.hypot(this.puck.x - pulse.x, this.puck.y - pulse.y);
      if (!pulse.hasHitPuck && (Math.abs(distPuck - pulse.radius) < 28 || distPuck <= pulse.radius)) {
        pulse.hasHitPuck = true;

        // Fling puck directly in the opposite direction of where the character is standing
        const player = pulse.isP1 ? this.p1 : this.p2;
        const dx = this.puck.x - player.x;
        const dy = this.puck.y - player.y;
        const dist = Math.hypot(dx, dy);

        // Normalized launch vector radiating outward from Azula
        const normX = dist > 1 ? dx / dist : (pulse.isP1 ? 1 : -1);
        const normY = dist > 1 ? dy / dist : 0;

        const blastSpeed = 17.5;
        this.puck.vx = normX * blastSpeed;
        this.puck.vy = normY * blastSpeed;
        this.puck.lastHitBy = pulse.isP1 ? 'p1' : 'p2';
        this.puckLightningBoostTimer = 110;

        soundFx.playLightning();
        effects.addHitSparks(this.puck.x, this.puck.y, normX, normY, '#a855f7', true);
        effects.addHitSparks(this.puck.x, this.puck.y, normX, normY, '#00f5ff', true);
        this.updateHitSpeedMeter(blastSpeed, '⚡ STATİK İTİŞ (TERS YÖNE FIRLATILDI)!');
      }

      // Check opponent paddle contact with shockwave
      const opponent = pulse.isP1 ? this.p2 : this.p1;
      const distOpp = Math.hypot(opponent.x - pulse.x, opponent.y - pulse.y);
      if (!pulse.hasHitOpponent && Math.abs(distOpp - pulse.radius) < 30) {
        pulse.hasHitOpponent = true;
        if (pulse.isP1) this.p2ShockTimer = 90;
        else this.p1ShockTimer = 90;

        soundFx.playShock();
        effects.addHitSparks(opponent.x, opponent.y, pulse.isP1 ? 1 : -1, 0, '#c084fc', true);
        this.updateHitSpeedMeter(0, '⚡ RAKİP STATİK ŞOKA YAKALANDI!');
      }

      if (pulse.timer <= 0 || pulse.radius >= pulse.maxRadius) {
        this.staticPulses.splice(i, 1);
      }
    }

    // Update Katara Water Whips
    for (let i = this.waterWhips.length - 1; i >= 0; i--) {
      const whip = this.waterWhips[i];
      whip.timer--;

      const wMinX = whip.x - whip.width / 2;
      const wMaxX = whip.x + whip.width / 2;
      const wMinY = whip.y - whip.height / 2;
      const wMaxY = whip.y + whip.height / 2;

      if (!whip.hasHitPuck && this.puck.x >= wMinX && this.puck.x <= wMaxX && Math.abs(this.puck.y - whip.y) < 28) {
        whip.hasHitPuck = true;
        const dirX = whip.isP1 ? 1 : -1;
        const launchSpeed = 15.5;
        this.puck.vx = dirX * launchSpeed;
        this.puck.vy = (Math.random() - 0.5) * 4;
        this.puck.lastHitBy = whip.isP1 ? 'p1' : 'p2';
        this.puck.isWhipped = whip.isP1 ? 'p1' : 'p2';
        soundFx.playHit(true, 1.5);
        effects.addHitSparks(this.puck.x, this.puck.y, dirX, 0, '#00ccff', true);
        this.updateHitSpeedMeter(launchSpeed, '🌊 SU KIRBACI VURUŞU!');
      }

      const target = whip.isP1 ? this.p2 : this.p1;
      if (!whip.hasHitOpponent && target.x >= wMinX && target.x <= wMaxX && Math.abs(target.y - whip.y) < 32) {
        whip.hasHitOpponent = true;
        if (whip.isP1) this.p2FreezeTimer = this.FREEZE_DURATION; // 2 seconds freeze!
        else this.p1FreezeTimer = this.FREEZE_DURATION;
        
        soundFx.playHit(true, 1.2);
        effects.addHitSparks(target.x, target.y, whip.isP1 ? 1 : -1, 0, '#00ccff', true);
        this.updateHitSpeedMeter(0, `🌊 KATARA: RAKİP KISKAÇLANDI & DONDURULDU! ❄️`);
      }

      if (whip.timer <= 0) {
        this.waterWhips.splice(i, 1);
      }
    }

    // Update Zuko Flame Wall (Step-by-step auto growing & reflection)
    if (this.flameWallActive) {
      const border = this.table.border;
      const stepH = (this.height - border * 2) / 8; // ~57.5px per block

      if (this.flameWallBuilding) {
        this.flameWallStepTimer++;
        if (this.flameWallStepTimer >= 14) { // Builds slightly slower: ignites a new step pair every 14 frames (~0.23s per step)!
          this.flameWallStepTimer = 0;
          if (this.flameWallStepCount < this.flameWallMaxSteps) {
            this.flameWallStepCount++;
            soundFx.playHit(true, 1.3);

            const centerY = this.height / 2;
            const offsetY = (this.flameWallStepCount - 0.5) * stepH;
            effects.addHitSparks(this.width / 2, centerY - offsetY, 0, 0, '#ff4400', false);
            effects.addHitSparks(this.width / 2, centerY + offsetY, 0, 0, '#ff4400', false);
          } else {
            this.flameWallBuilding = false;
          }
        }
        this.updateHitSpeedMeter(0, `🔥 ZUKO: ALEV DUVARI ÖRÜLÜYOR (${this.flameWallStepCount * 2}/8)...`);
      } else {
        this.flameWallActiveTimer--;
        if (this.flameWallActiveTimer <= 0) {
          this.flameWallActive = false;
          this.flameWallStepCount = 0;
        }
      }

      this.flameWallH = this.flameWallStepCount * stepH * 2;

      // Check puck collision with active Flame Wall blocks (Impassable Barrier + Flame Speed Boost)
      const centerX = this.width / 2;
      const centerY = this.height / 2;
      const wallMinY = centerY - this.flameWallH / 2;
      const wallMaxY = centerY + this.flameWallH / 2;

      if (Math.abs(this.puck.x - centerX) < this.puck.radius + 12 && this.puck.y >= wallMinY - 10 && this.puck.y <= wallMaxY + 10) {
        // Boost puck speed just like passing over flames (fire map hazard)
        this.puckFireBoostTimer = 140; // ~2.3 seconds continuous flame boost!
        const boostSpeed = 19.5;

        // Bounce puck back to whichever side it came from (cannot cross wall)
        if (this.puck.x < centerX) {
          this.puck.vx = -boostSpeed;
          this.puck.x = centerX - this.puck.radius - 14;
        } else {
          this.puck.vx = boostSpeed;
          this.puck.x = centerX + this.puck.radius + 14;
        }

        this.puck.lastHitBy = this.flameWallPlayer || (this.puck.x < centerX ? 'p2' : 'p1');
        soundFx.playHit(true, 2.0);
        soundFx.playWallHit();
        soundFx.playBurn();
        effects.addHitSparks(this.puck.x, this.puck.y, this.puck.vx > 0 ? 1 : -1, 0, '#ff4400', true);
        effects.addHitSparks(this.puck.x, this.puck.y, this.puck.vx > 0 ? 1 : -1, 0, '#ffcc00', true);
        this.screenShakeTimer = 8;
        this.updateHitSpeedMeter(boostSpeed, '🔥 ALEV DUVARI BOOSTU (SÜPER HIZLA SEKTİ)!');
      }
    }

    // Update Toph Flying Boulders & Grounded Rock Obstacles
    for (let i = this.boulders.length - 1; i >= 0; i--) {
      const b = this.boulders[i];

      if (!b.isStopped) {
        b.x += b.vx;
        b.distTraveled += Math.abs(b.vx);

        const border = this.table.border;

        // Check if boulder hits opponent paddle -> KNOCKBACK OPPONENT!
        const opponent = b.isP1 ? this.p2 : this.p1;
        const distToOpponent = Math.hypot(opponent.x - b.x, opponent.y - b.y);
        if (!b.hasHitOpponent && distToOpponent < b.radius + opponent.width / 2) {
          b.hasHitOpponent = true;
          b.isStopped = true;
          b.vx = 0;

          // Push opponent back towards their wall!
          const knockbackDist = 110;
          if (b.isP1) {
            this.p2.x = Math.min(this.width - border - 35, this.p2.x + knockbackDist);
          } else {
            this.p1.x = Math.max(border + 35, this.p1.x - knockbackDist);
          }

          soundFx.playHit(true, 1.8);
          effects.addHitSparks(opponent.x, opponent.y, b.isP1 ? 1 : -1, 0, '#c8965a', true);
          this.updateHitSpeedMeter(0, '🪨 KAYA RAKİBİ GERİ İTTİ!');
        }

        // Check if boulder hits puck while moving
        const distToPuck = Math.hypot(this.puck.x - b.x, this.puck.y - b.y);
        if (distToPuck < b.radius + this.puck.radius) {
          const dirX = b.isP1 ? 1 : -1;
          const launchSpeed = 16.0;
          this.puck.vx = dirX * launchSpeed;
          this.puck.vy = (Math.random() - 0.5) * 5;
          this.puck.lastHitBy = b.isP1 ? 'p1' : 'p2';
          soundFx.playHit(true, 1.7);
          effects.addHitSparks(this.puck.x, this.puck.y, dirX, 0, '#ffaa00', true);
          this.updateHitSpeedMeter(launchSpeed, '🪨 KAYA BLASTI!');
        }

        // Check max range limit (half field width) or border wall hit -> Stop on ground as obstacle!
        if (b.distTraveled >= b.maxDist || b.x < border + 25 || b.x > this.width - border - 25) {
          b.isStopped = true;
          b.vx = 0;
          soundFx.playHit(false, 0.8);
          effects.addHitSparks(b.x, b.y, 0, 1, '#c8965a', true);
        }

      } else {
        // Grounded rock obstacle phase
        b.stoppedTimer--;
        if (b.stoppedTimer <= 0) {
          this.boulders.splice(i, 1);
          continue;
        }

        // Check puck collision with grounded rock obstacle
        const dx = this.puck.x - b.x;
        const dy = this.puck.y - b.y;
        const dist = Math.hypot(dx, dy) || 1;
        const minDist = b.radius + this.puck.radius;

        if (dist < minDist) {
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          this.puck.x += nx * (overlap + 2);
          this.puck.y += ny * (overlap + 2);

          const curSpeed = Math.max(6.5, Math.hypot(this.puck.vx, this.puck.vy));
          this.puck.vx = nx * curSpeed;
          this.puck.vy = ny * curSpeed;

          soundFx.playWallHit();
          effects.addHitSparks(this.puck.x, this.puck.y, nx, ny, '#c8965a', false);
        }
      }
    }

    // Wind catch timers & Vacuum Suction check (175px suction range)
    if (this.p1WindCatchActive) {
      if (!this.goalScored && Math.hypot(this.puck.x - this.p1.x, this.puck.y - this.p1.y) <= 175) {
        this.executeAangWindFling(true);
      } else {
        this.p1WindCatchTimer--;
        if (this.p1WindCatchTimer <= 0) this.p1WindCatchActive = false;
      }
    }
    if (this.p2WindCatchActive) {
      if (!this.goalScored && Math.hypot(this.puck.x - this.p2.x, this.puck.y - this.p2.y) <= 175) {
        this.executeAangWindFling(false);
      } else {
        this.p2WindCatchTimer--;
        if (this.p2WindCatchTimer <= 0) this.p2WindCatchActive = false;
      }
    }

    // Earth wall timers
    if (this.p1EarthWallTimer > 0) this.p1EarthWallTimer--;
    if (this.p2EarthWallTimer > 0) this.p2EarthWallTimer--;

    // Wind timer for Air map (Cycles between diagonal wind blowing and calm pauses)
    if (this.selectedMap === 'air') {
      if (!this.windTimer) this.windTimer = 240;
      this.windTimer--;
      if (this.windTimer <= 0) {
        if (this.windState === 'active') {
          this.windState = 'calm';
          this.windTimer = 150; // 2.5 seconds pause
        } else {
          this.windState = 'active';
          this.windTimer = 240; // 4 seconds active wind
          // Randomize diagonal direction
          this.windDirX = Math.random() < 0.5 ? 1 : -1;
          this.windDirY = Math.random() < 0.5 ? 0.6 : -0.6;
        }
      }

      // Air Map Hazard: Ground Tornado Puck Launcher
      if (this.airTornadoActive) {
        this.airTornadoDuration--;
        if (this.airTornadoDuration <= 0) this.airTornadoActive = false;

        // Check puck collision with tornado
        const dx = this.puck.x - this.airTornadoX;
        const dy = this.puck.y - this.airTornadoY;
        if (Math.hypot(dx, dy) < this.airTornadoRadius + this.puck.radius) {
          const randomAngle = Math.random() * Math.PI * 2;
          const launchSpeed = 15.0;
          this.puck.vx = launchSpeed * Math.cos(randomAngle);
          this.puck.vy = launchSpeed * Math.sin(randomAngle);
          
          this.airTornadoActive = false; // Deactivate upon puck trigger!
          soundFx.playHit(true, 1.7);
          effects.addHitSparks(this.puck.x, this.puck.y, Math.cos(randomAngle), Math.sin(randomAngle), '#00ffcc', true);
          this.updateHitSpeedMeter(launchSpeed, '🌪️ HORTUM SAVURMASI!');
        }
      } else {
        if (!this.airTornadoTimer) this.airTornadoTimer = 450;
        this.airTornadoTimer--;
        if (this.airTornadoTimer <= 0) {
          const border = this.table.border;
          this.airTornadoX = border + 120 + Math.random() * (this.width - border * 2 - 240);
          this.airTornadoY = border + 60 + Math.random() * (this.height - border * 2 - 120);
          this.airTornadoRadius = 42;
          this.airTornadoDuration = 300; // 5 seconds duration
          this.airTornadoActive = true;
          this.airTornadoTimer = 500 + Math.random() * 250;
        }
      }
    }

    // Flame Boost: Maintain super speed while timer active (from Fire Map Hazard or Zuko Flame Wall)
    if (this.puckFireBoostTimer > 0) {
      this.puckFireBoostTimer--;
      const currentSpeed = Math.hypot(this.puck.vx, this.puck.vy);
      if (currentSpeed > 0 && currentSpeed < 18.5) {
        const scale = 18.5 / currentSpeed;
        this.puck.vx *= scale;
        this.puck.vy *= scale;
      }
      if (Math.random() < 0.45) {
        effects.addHitSparks(this.puck.x, this.puck.y, (Math.random() - 0.5), (Math.random() - 0.5), '#ff6600', false);
      }
    }

    // Aang Wind Catch Timers
    if (this.p1WindCatchActive) {
      this.p1WindCatchTimer--;
      if (this.p1WindCatchTimer <= 0) this.p1WindCatchActive = false;
    }
    if (this.p2WindCatchActive) {
      this.p2WindCatchTimer--;
      if (this.p2WindCatchTimer <= 0) this.p2WindCatchActive = false;
    }

    // Fire Map Hazard: Flame Patch & Puck Speed Boost
    if (this.selectedMap === 'fire') {

      if (this.fireFlameActive) {
        this.fireFlameDuration--;
        if (this.fireFlameDuration <= 0) this.fireFlameActive = false;

        // Check player collision with ground flame hazard (Zuko is immune!)
        if (this.p1CharKey !== 'zuko' && this.p1StunTimer <= 0) {
          const p1Dist = Math.hypot(this.p1.x - this.fireFlameX, this.p1.y - this.fireFlameY);
          if (p1Dist < this.fireFlameRadius + this.p1.width / 2) {
            this.p1StunTimer = 55;
            this.p1.moveVx = 0;
            this.p1.moveVy = 0;
            soundFx.playBurn();
            effects.addHitSparks(this.p1.x, this.p1.y, 0, -1, '#ff3300', true);
            this.updateHitSpeedMeter(0, '🔥 P1 ALEVLERE BASTI VE YANDI (STUN)!');
          }
        }
        if (this.p2CharKey !== 'zuko' && this.p2StunTimer <= 0) {
          const p2Dist = Math.hypot(this.p2.x - this.fireFlameX, this.p2.y - this.fireFlameY);
          if (p2Dist < this.fireFlameRadius + this.p2.width / 2) {
            this.p2StunTimer = 55;
            this.p2.moveVx = 0;
            this.p2.moveVy = 0;
            soundFx.playBurn();
            effects.addHitSparks(this.p2.x, this.p2.y, 0, -1, '#ff3300', true);
            this.updateHitSpeedMeter(0, '🔥 P2 ALEVLERE BASTI VE YANDI (STUN)!');
          }
        }

        // Check puck collision with flame patch (Super Blazing Acceleration!)
        const dx = this.puck.x - this.fireFlameX;
        const dy = this.puck.y - this.fireFlameY;
        if (Math.hypot(dx, dy) < this.fireFlameRadius + this.puck.radius) {
          this.puckFireBoostTimer = 140; // ~2.3 seconds super speed boost
          this.fireFlameActive = false;
          const currentSpd = Math.hypot(this.puck.vx, this.puck.vy) || 1;
          const boostedSpd = Math.min(22.0, Math.max(19.0, currentSpd * 1.5));
          this.puck.vx = (this.puck.vx / currentSpd) * boostedSpd;
          this.puck.vy = (this.puck.vy / currentSpd) * boostedSpd;
          soundFx.playHit(true, 2.0);
          soundFx.playBurn();
          effects.addHitSparks(this.puck.x, this.puck.y, 0, 0, '#ff3300', true);
          effects.addHitSparks(this.puck.x, this.puck.y, 0, 0, '#ffcc00', true);
          this.screenShakeTimer = 8;
          this.updateHitSpeedMeter(boostedSpd, '🔥 SÜPER ALEV BOOSTU (+%50 HIZ)!');
        }
      } else {
        if (!this.fireFlameTimer) this.fireFlameTimer = 300;
        this.fireFlameTimer--;
        if (this.fireFlameTimer <= 0) {
          const border = this.table.border;
          this.fireFlameX = border + 100 + Math.random() * (this.width - border * 2 - 200);
          this.fireFlameY = border + 60 + Math.random() * (this.height - border * 2 - 120);
          this.fireFlameRadius = 38;
          this.fireFlameDuration = 360; // 6 seconds
          this.fireFlameActive = true;
          this.fireFlameTimer = 400 + Math.random() * 200;
        }
      }
    }

    // Ice Map Hazard: Center Tidal Wave Sweeping Paddles
    if (this.selectedMap === 'ice') {
      if (this.iceWaveActive) {
        const waveSpeed = 6.5;
        this.iceWaveXLeft -= waveSpeed;
        this.iceWaveXRight += waveSpeed;

        const border = this.table.border;

        // P1 Paddle: continuous push along with left wave towards left goal (Katara immune!)
        if (this.p1CharKey !== 'katara') {
          if (this.p1.x >= this.iceWaveXLeft - 20 && this.p1.x > border + 35) {
            this.p1.x = Math.max(border + 35, this.iceWaveXLeft - 10);
            if (Math.random() < 0.25) {
              effects.addHitSparks(this.p1.x, this.p1.y, -1, (Math.random() - 0.5), '#00e5ff', false);
            }
          }
        }

        // P2 Paddle: continuous push along with right wave towards right goal (Katara immune!)
        if (this.p2CharKey !== 'katara') {
          if (this.p2.x <= this.iceWaveXRight + 20 && this.p2.x < this.width - border - 35) {
            this.p2.x = Math.min(this.width - border - 35, this.iceWaveXRight + 10);
            if (Math.random() < 0.25) {
              effects.addHitSparks(this.p2.x, this.p2.y, 1, (Math.random() - 0.5), '#00e5ff', false);
            }
          }
        }

        if (this.iceWaveXLeft < border - 30 && this.iceWaveXRight > this.width - border + 30) {
          this.iceWaveActive = false;
        }
      } else {
        if (!this.iceWaveTimer) this.iceWaveTimer = 450;
        this.iceWaveTimer--;
        if (this.iceWaveTimer <= 0) {
          this.iceWaveActive = true;
          this.iceWaveXLeft = this.width / 2;
          this.iceWaveXRight = this.width / 2;
          this.iceWaveTimer = 550 + Math.random() * 200;
          soundFx.playOceanWave();
        }
      }
    }

    // Earth Map Hazard: Rising Rock Obstacle
    if (this.selectedMap === 'earth') {
      if (this.earthRockActive) {
        this.earthRockDuration--;
        if (this.earthRockDuration <= 0) this.earthRockActive = false;

        // Check puck collision with rock obstacle
        this.checkRockObstacleCollision();
      } else {
        if (!this.earthRockTimer) this.earthRockTimer = 250;
        this.earthRockTimer--;
        if (this.earthRockTimer <= 0) {
          const tile = this.getRandomGroundTileCoords();
          this.earthRockX = tile.x;
          this.earthRockY = tile.y;
          this.earthRockW = tile.w;
          this.earthRockH = tile.h;
          this.earthRockDuration = 360; // 6 seconds active
          this.earthRockActive = true;
          this.earthRockTimer = 450 + Math.random() * 200;
          soundFx.playHit(true, 1.5);
          effects.addHitSparks(this.earthRockX, this.earthRockY, 0, -1, '#aa7733', true);
        }
      }
    }

    // Storm Map Hazard: Lightning Strike & Plasma Orb
    if (this.selectedMap === 'storm') {
      if (this.stormLightningActive > 0) {
        this.stormLightningActive--;

        // Check if puck is in strike zone
        const distPuck = Math.hypot(this.puck.x - this.stormLightningX, this.puck.y - this.stormLightningY);
        if (distPuck < this.stormLightningRadius + this.puck.radius) {
          const launchAng = (Math.random() - 0.5) * Math.PI * 0.8 + (this.puck.x < this.width / 2 ? 0 : Math.PI);
          const launchSpd = 18.0;
          this.puck.vx = launchSpd * Math.cos(launchAng);
          this.puck.vy = launchSpd * Math.sin(launchAng);
          this.puckLightningBoostTimer = 160;
          soundFx.playLightning();
          effects.addGoalBurst(this.puck.x, this.puck.y, '#00f5ff');
          effects.addGoalBurst(this.puck.x, this.puck.y, '#c084fc');
          this.updateHitSpeedMeter(launchSpd, '⚡ YILDIRIM ÇARPMASI & PLAZMA TOPU!');
        }

        // Check paddles in strike zone (Azula absorbs/grounds, others get shocked!)
        [
          { p: this.p1, charKey: this.p1CharKey, isP1: true },
          { p: this.p2, charKey: this.p2CharKey, isP1: false }
        ].forEach(({ p, charKey, isP1 }) => {
          const distPad = Math.hypot(p.x - this.stormLightningX, p.y - this.stormLightningY);
          if (distPad < this.stormLightningRadius + p.width / 2) {
            if (charKey === 'azula') {
              if (isP1) this.p1AbilityCooldown = 0;
              else this.p2AbilityCooldown = 0;
              if (Math.random() < 0.2) effects.addHitSparks(p.x, p.y, 0, 0, '#00f5ff', true);
            } else {
              if (isP1) this.p1ShockTimer = 90;
              else this.p2ShockTimer = 90;
              const pushX = p.x < this.stormLightningX ? -35 : 35;
              p.x = Math.max(border + 35, Math.min(this.width - border - 35, p.x + pushX));
              effects.addHitSparks(p.x, p.y, pushX > 0 ? 1 : -1, 0, '#a855f7', true);
            }
          }
        });
      } else if (this.stormLightningTelegraph > 0) {
        this.stormLightningTelegraph--;
        if (this.stormLightningTelegraph <= 0) {
          // Strike happens now!
          this.stormLightningActive = 18;
          soundFx.playLightning();
          soundFx.playShock();
          effects.addGoalBurst(this.stormLightningX, this.stormLightningY, '#ffffff');
          effects.addGoalBurst(this.stormLightningX, this.stormLightningY, '#a855f7');
        }
      } else {
        if (!this.stormLightningTimer) this.stormLightningTimer = 360;
        this.stormLightningTimer--;
        if (this.stormLightningTimer <= 0) {
          const border = this.table.border;
          this.stormLightningX = border + 130 + Math.random() * (this.width - border * 2 - 260);
          this.stormLightningY = border + 60 + Math.random() * (this.height - border * 2 - 120);
          this.stormLightningRadius = 55;
          this.stormLightningTelegraph = 70; // ~1.15 seconds warning circle
          this.stormLightningTimer = 440 + Math.random() * 220;
        }
      }
    }

    // Update ice funnel timers
    if (this.p1IceFunnelTimer > 0) {
      this.p1IceFunnelTimer--;
      this.checkIceFunnelCollision(true);
    }
    if (this.p2IceFunnelTimer > 0) {
      this.p2IceFunnelTimer--;
      this.checkIceFunnelCollision(false);
    }

    // Update ice beams (Katara 1st ability: Buz Hunisi Fırlatma)
    for (let i = this.iceBeams.length - 1; i >= 0; i--) {
      const beam = this.iceBeams[i];
      beam.x += beam.vx;

      // Check if beam is blocked by opponent paddle
      const target = beam.isP1 ? this.p2 : this.p1;
      const tMinX = target.x - target.width / 2;
      const tMaxX = target.x + target.width / 2;
      const tMinY = target.y - target.height / 2;
      const tMaxY = target.y + target.height / 2;

      const bMinX = beam.x - beam.width / 2;
      const bMaxX = beam.x + beam.width / 2;
      const bMinY = beam.y - beam.height / 2;
      const bMaxY = beam.y + beam.height / 2;

      if (bMaxX > tMinX && bMinX < tMaxX && bMaxY > tMinY && bMinY < tMaxY) {
        // BLOCKED! Opponent intercepted in mid-air (does NOT freeze!)
        effects.addHitSparks(beam.x, beam.y, 0, 0, '#00ccff', true);
        soundFx.playHit(false, 1.0);
        this.updateHitSpeedMeter(0, `🧊 ${beam.isP1 ? 'P2' : 'P1'} BUZU BLOKLADI!`);
        this.iceBeams.splice(i, 1);
        continue;
      }

      // Unblocked: Check if beam reaches opponent's ACTUAL GOAL opening (not side walls)!
      const goalCenterY = this.height / 2;
      const goalHalf = (this.table.goalSize + 20) / 2;
      const isGoalY = (beam.y >= goalCenterY - goalHalf && beam.y <= goalCenterY + goalHalf);

      if (isGoalY && ((beam.isP1 && beam.x >= this.width - border - 25) || (!beam.isP1 && beam.x <= border + 25))) {
        if (beam.isP1) this.p2IceFunnelTimer = 420; // 7 seconds active on P2 goal!
        else this.p1IceFunnelTimer = 420; // 7 seconds active on P1 goal!

        soundFx.playHit(true, 1.6);
        effects.addHitSparks(beam.x, beam.y, 0, 0, '#00e5ff', true);
        this.updateHitSpeedMeter(0, `🧊 BUZ HUNİSİ OLUŞTU! (7 SN KALEYE YÖNLENDİRİYOR)`);
        this.iceBeams.splice(i, 1);
        continue;
      }

      if (beam.x < 0 || beam.x > this.width) {
        this.iceBeams.splice(i, 1);
      }
    }

    // Earth wall collision checks
    const goalCenterY = this.height / 2;
    if (this.p1EarthWallTimer > 0) {
      this.checkEarthWallCollision(border + 35, goalCenterY, 18, this.table.goalSize + 20);
    }
    if (this.p2EarthWallTimer > 0) {
      this.checkEarthWallCollision(this.width - border - 35, goalCenterY, 18, this.table.goalSize + 20);
    }
  }

  // ============ HUD ============

  updateHitSpeedMeter(speed, customText = '') {
    if (this.elHitSpeed) {
      if (customText) {
        this.elHitSpeed.innerText = customText;
        this.elHitSpeed.style.borderColor = '#ffe600';
        this.elHitSpeed.style.color = '#ffe600';
      } else {
        const displayKm = Math.round(speed * 4.4);
        this.elHitSpeed.innerText = `Vuruş Hızı: ${displayKm} km/h`;
        this.elHitSpeed.style.borderColor = 'rgba(255, 230, 0, 0.3)';
        this.elHitSpeed.style.color = '#f0f4f8';
      }
    }
  }

  updateCooldowns() {
    this.updateHUDMeters();
  }

  updateHUDMeters() {
    if (this.elP1Energy) {
      const cd = this.champions[this.p1CharKey].abilityCooldown;
      const ready = this.p1AbilityCooldown <= 0;
      this.elP1Energy.style.width = ready ? '100%' : `${Math.round(((cd - this.p1AbilityCooldown) / cd) * 100)}%`;
      this.elP1Energy.innerText = ready ? `⚡ YETENEK HAZIR (Q)` : 'BEKLEME...';
    }
    if (this.elP2Energy) {
      const cd = this.champions[this.p2CharKey].abilityCooldown;
      const ready = this.p2AbilityCooldown <= 0;
      this.elP2Energy.style.width = ready ? '100%' : `${Math.round(((cd - this.p2AbilityCooldown) / cd) * 100)}%`;
      this.elP2Energy.innerText = ready ? `⚡ YETENEK HAZIR (RSHIFT)` : 'BEKLEME...';
    }
  }

  // ============ PHYSICS ============

  updatePhysics() {
    this.animTime = (this.animTime || 0) + 0.04;
    this.gameFrame = (this.gameFrame || 0) + 1;
    if (this.screenShakeTimer > 0) this.screenShakeTimer--;

    if (this.p1StrikeAnim > 0) this.p1StrikeAnim = Math.max(0, this.p1StrikeAnim - 0.05);
    if (this.p2StrikeAnim > 0) this.p2StrikeAnim = Math.max(0, this.p2StrikeAnim - 0.05);

    this.updateCooldowns();
    this.updateAbilities();
    this.handlePlayerMovement();

    // Don't process ball if goal was just scored (BUG FIX)
    if (this.goalScored) return;

    // If serving, ball follows server's paddle
    if (this.servingPlayer && this.serveReady) {
      const paddle = this.servingPlayer === 'p1' ? this.p1 : this.p2;
      if (this.servingPlayer === 'p1') {
        this.puck.x = paddle.x + paddle.width / 2 + this.puck.radius + 5;
      } else {
        this.puck.x = paddle.x - paddle.width / 2 - this.puck.radius - 5;
      }
      this.puck.y = paddle.y;
      this.puck.vx = 0;
      this.puck.vy = 0;
      return;
    }

    // Decay rally count if no paddle hit for over 300 frames (5 seconds)
    if (this.lastHitFrame && (this.gameFrame - this.lastHitFrame > 300)) {
      this.rallyCount = 0;
      this.rallyHeat = 0;
    }

    // Dynamic puck update: Dynamic decay based on rally heat
    this.puck.currentSpeed = Math.hypot(this.puck.vx, this.puck.vy);
    
    // When in a heated rally, preserve momentum longer, but decay faster overall for balanced reaction windows
    const decayRate = 0.972 + (this.rallyHeat || 0) * 0.008;
    
    if (this.puck.currentSpeed > this.baseSpeed) {
      const targetSpeed = Math.max(this.baseSpeed, this.puck.currentSpeed * decayRate);
      const scale = targetSpeed / this.puck.currentSpeed;
      this.puck.vx *= scale;
      this.puck.vy *= scale;
      this.puck.currentSpeed = targetSpeed;
    } else if (this.puck.currentSpeed > 0.5 && this.puck.currentSpeed < this.baseSpeed) {
      const scale = this.baseSpeed / this.puck.currentSpeed;
      this.puck.vx *= scale;
      this.puck.vy *= scale;
      this.puck.currentSpeed = this.baseSpeed;
    }
    
    const dynamicMax = Math.min(21.5, 15.0 + Math.min(6.5, (this.rallyCount || 1) * 0.7));
    if (this.puck.currentSpeed > dynamicMax) {
      const scale = dynamicMax / this.puck.currentSpeed;
      this.puck.vx *= scale;
      this.puck.vy *= scale;
      this.puck.currentSpeed = dynamicMax;
    }
    
    // Anti-tunneling continuous collision sub-stepping for supersonic speeds
    const subSteps = this.puck.currentSpeed > 15.0 ? 2 : 1;
    const stepVx = this.puck.vx / subSteps;
    const stepVy = this.puck.vy / subSteps;

    for (let s = 0; s < subSteps; s++) {
      this.puck.x += stepVx;
      this.puck.y += stepVy;

      // Paddle-Puck blocking on each sub-step
      this.checkPaddlePuckBlock(this.p1, 'p1');
      this.checkPaddlePuckBlock(this.p2, 'p2');
    }

    const border = this.table.border;
    const r = this.puck.radius;

    // Wall bounces (perfect, no energy loss, electric boost on storm map)
    if (this.puck.y - r < border) {
      this.puck.y = border + r;
      this.puck.vy = -this.puck.vy;
      if (this.selectedMap === 'storm') {
        const curSpd = Math.hypot(this.puck.vx, this.puck.vy) || 1;
        const boostSpd = Math.min(this.puck.maxSpeed, Math.max(8.5, curSpd * 1.18));
        this.puck.vx = (this.puck.vx / curSpd) * boostSpd;
        this.puck.vy = (this.puck.vy / curSpd) * boostSpd;
        this.puckLightningBoostTimer = 90;
        soundFx.playShock();
        effects.addHitSparks(this.puck.x, this.puck.y, 0, 1, '#c084fc', true);
        this.updateHitSpeedMeter(boostSpd, '⚡ ELEKTRİKLİ BANTTAN SEKTİ (+%18 HIZ)!');
      } else {
        soundFx.playWallHit();
      }
    }
    if (this.puck.y + r > this.height - border) {
      this.puck.y = this.height - border - r;
      this.puck.vy = -this.puck.vy;
      if (this.selectedMap === 'storm') {
        const curSpd = Math.hypot(this.puck.vx, this.puck.vy) || 1;
        const boostSpd = Math.min(this.puck.maxSpeed, Math.max(8.5, curSpd * 1.18));
        this.puck.vx = (this.puck.vx / curSpd) * boostSpd;
        this.puck.vy = (this.puck.vy / curSpd) * boostSpd;
        this.puckLightningBoostTimer = 90;
        soundFx.playShock();
        effects.addHitSparks(this.puck.x, this.puck.y, 0, -1, '#c084fc', true);
        this.updateHitSpeedMeter(boostSpd, '⚡ ELEKTRİKLİ BANTTAN SEKTİ (+%18 HIZ)!');
      } else {
        soundFx.playWallHit();
      }
    }

    // Left wall / goal (Requires puck to travel deep into recessed 3D goal pocket)
    const isInsideGoalY = (this.puck.y > this.table.goalYStart + 4 && this.puck.y < this.table.goalYEnd - 4);
    
    if (this.puck.x - r < border) {
      if (isInsideGoalY) {
        if (this.puck.x < border - 12) {
          this.handleGoal(2);
          return;
        }
      } else {
        this.puck.x = border + r;
        this.puck.vx = Math.abs(this.puck.vx);
        soundFx.playWallHit();
      }
    }

    // Right wall / goal (Requires puck to travel deep into recessed 3D goal pocket)
    if (this.puck.x + r > this.width - border) {
      if (isInsideGoalY) {
        if (this.puck.x > this.width - border + 12) {
          this.handleGoal(1);
          return;
        }
      } else {
        this.puck.x = this.width - border - r;
        this.puck.vx = -Math.abs(this.puck.vx);
        soundFx.playWallHit();
      }
    }

    // Trail
    const speedRatio = this.puck.currentSpeed / 12;
    if (speedRatio > 0.3) {
      effects.addPuckTrailPoint(this.puck.x, this.puck.y, speedRatio);
    }
  }

  // ============ GOALS ============

  handleGoal(scoringPlayer) {
    // Prevent multiple goals (BUG FIX)
    if (this.goalScored) return;
    this.goalScored = true;

    const charKey = scoringPlayer === 1 ? this.p1CharKey : this.p2CharKey;
    const charConfig = this.champions[charKey];

    if (scoringPlayer === 1) {
      this.scoreP1++;
      effects.addGoalBurst(this.width - this.table.border, this.height / 2, charConfig.color);
    } else {
      this.scoreP2++;
      effects.addGoalBurst(this.table.border, this.height / 2, charConfig.color);
    }

    // Stop the ball immediately and reset rally tracking
    this.puck.vx = 0;
    this.puck.vy = 0;
    this.rallyCount = 0;
    this.rallyHeat = 0;

    soundFx.playGoal();
    this.updateScoreDisplay();

    // Goal celebration animation on scoring player's HUD avatar
    const scoringAvatar = scoringPlayer === 1 ? document.getElementById('p1Avatar') : document.getElementById('p2Avatar');
    if (scoringAvatar) {
      scoringAvatar.classList.remove('avatar-score-pop');
      void scoringAvatar.offsetWidth;
      scoringAvatar.classList.add('avatar-score-pop');
      setTimeout(() => scoringAvatar.classList.remove('avatar-score-pop'), 650);
    }

    if (this.scoreP1 >= this.targetScore || this.scoreP2 >= this.targetScore) {
      this.handleWin(this.scoreP1 >= this.targetScore ? 1 : 2);
    } else {
      const whoServes = scoringPlayer === 1 ? 'p2' : 'p1';
      setTimeout(() => {
        if (this.isPlaying) this.setupServe(whoServes);
      }, 800);
    }
  }

  handleWin(winnerPlayer) {
    this.winner = winnerPlayer;
    this.isPlaying = false;
    soundFx.playWin();

    const charKey = winnerPlayer === 1 ? this.p1CharKey : this.p2CharKey;
    const charConfig = this.champions[charKey];

    if (this.winChampionImg) {
      this.winChampionImg.src = `assets/characters/${charKey}.jpg`;
      this.winChampionImg.style.borderColor = charConfig.color;
      this.winChampionImg.style.boxShadow = `0 0 35px ${charConfig.glow}`;
    }
    if (this.winElementHalo) {
      this.winElementHalo.style.borderColor = charConfig.color;
    }

    if (this.winnerText) {
      this.winnerText.innerText = winnerPlayer === 1 
        ? `${charConfig.icon} ${charConfig.name.toUpperCase()} (P1) KAZANDI!` 
        : (this.isAiMode ? `${charConfig.icon} ${charConfig.name.toUpperCase()} (BOT) KAZANDI!` : `${charConfig.icon} ${charConfig.name.toUpperCase()} (P2) KAZANDI!`);
      this.winnerText.className = `winner-banner ${winnerPlayer === 1 ? 'winner-p1' : 'winner-p2'}`;
    }
    this.winModal?.classList.add('active');
  }

  updateScoreDisplay() {
    if (this.elScoreP1) this.elScoreP1.innerText = this.scoreP1;
    if (this.elScoreP2) this.elScoreP2.innerText = this.scoreP2;
  }

  // ============ RENDERING ============

  drawCharacterBehindPaddle(paddle, charKey, isP1) {
    const char = this.champions[charKey];
    if (!char) return;
    const ctx = this.ctx;
    const offsetX = isP1 ? -28 : 28;
    
    // Dynamic floating / breathing motion
    const floatOffset = Math.sin((this.animTime || 0) * 3.2 + (isP1 ? 0 : Math.PI)) * 2.8;
    let cx = paddle.x + offsetX;
    let cy = paddle.y + floatOffset;

    const isFrozen = isP1 ? this.p1FreezeTimer > 0 : this.p2FreezeTimer > 0;
    const isShocked = isP1 ? this.p1ShockTimer > 0 : this.p2ShockTimer > 0;
    const isStunned = isP1 ? this.p1StunTimer > 0 : this.p2StunTimer > 0;

    // High-voltage shock or stun jitter displacement
    if (isShocked || isStunned) {
      cx += (Math.random() - 0.5) * 3.5;
      cy += (Math.random() - 0.5) * 3.5;
    }

    ctx.save();
    const tokenR = 24;

    // Apply Dynamic Inertia Tilt / Lean
    const tilt = paddle.tiltAngle || 0;
    if (tilt !== 0) {
      ctx.translate(cx, cy);
      ctx.rotate(tilt);
      ctx.translate(-cx, -cy);
    }

    // Outer glow aura
    ctx.shadowBlur = 18;
    ctx.shadowColor = isFrozen ? '#00ccff' : (isShocked ? '#00f5ff' : char.glow);

    // Render character portrait inside circular clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, tokenR, 0, Math.PI * 2);
    ctx.clip();
    const img = this.characterImages ? this.characterImages[charKey] : null;
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, cx - tokenR, cy - tokenR, tokenR * 2, tokenR * 2);
    } else {
      ctx.fillStyle = char.color + '44';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(char.icon, cx, cy);
    }
    ctx.restore();

    // Token Border Ring
    ctx.strokeStyle = isFrozen ? '#00e5ff' : (isShocked ? '#00f5ff' : char.color);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, tokenR, 0, Math.PI * 2);
    ctx.stroke();

    // Elemental Orbiting Particles (Water, Fire, Air, Earth, Lightning)
    const t = this.animTime || 0;
    if (!isFrozen) {
      if (charKey === 'katara') {
        // 4 glowing water beads orbiting with radial pulsation
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00ccff';
        ctx.shadowBlur = 10;
        for (let i = 0; i < 4; i++) {
          const ang = t * 2.8 + i * (Math.PI / 2);
          const r = tokenR + 6 + Math.sin(t * 4.5 + i * 1.5) * 2;
          const px = cx + Math.cos(ang) * r;
          const py = cy + Math.sin(ang) * r;
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (charKey === 'zuko') {
        // Flickering flame embers rising and dancing around rim
        ctx.shadowBlur = 12;
        for (let i = 0; i < 4; i++) {
          const ang = -Math.PI / 2 + Math.sin(t * 3.5 + i * 1.6) * 1.1;
          const r = tokenR + 5 + Math.sin(t * 5 + i * 2) * 3;
          const px = cx + Math.cos(ang) * r;
          const py = cy + Math.sin(ang) * r;
          ctx.fillStyle = i % 2 === 0 ? '#ff3300' : '#ffcc00';
          ctx.shadowColor = '#ff6600';
          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (charKey === 'aang') {
        // Rotating air vortex arcs wrapping around the token
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.75)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 10;
        for (let i = 0; i < 2; i++) {
          const startAng = t * 3.5 + i * Math.PI;
          ctx.beginPath();
          ctx.arc(cx, cy, tokenR + 5, startAng, startAng + Math.PI * 0.6);
          ctx.stroke();
        }
      } else if (charKey === 'toph') {
        // 3 floating jade stone shards orbiting in a 3D tilted ellipse
        ctx.fillStyle = '#55ff77';
        ctx.shadowColor = '#00cc44';
        ctx.shadowBlur = 10;
        for (let i = 0; i < 3; i++) {
          const ang = t * 2.2 + i * (Math.PI * 2 / 3);
          const px = cx + Math.cos(ang) * (tokenR + 7);
          const py = cy + Math.sin(ang) * (tokenR * 0.55);
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(ang);
          ctx.fillRect(-2.5, -2.5, 5, 5);
          ctx.restore();
        }
      } else if (charKey === 'azula') {
        // Crackling purple & cyan lightning sparks arcing along rim
        ctx.strokeStyle = (Math.floor(t * 22) % 2 === 0) ? '#a855f7' : '#00f5ff';
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2;
        const baseAng = (t * 5.5) % (Math.PI * 2);
        ctx.beginPath();
        const r1 = tokenR + 4;
        const r2 = tokenR + 9;
        ctx.moveTo(cx + Math.cos(baseAng) * r1, cy + Math.sin(baseAng) * r1);
        ctx.lineTo(cx + Math.cos(baseAng + 0.3) * r2, cy + Math.sin(baseAng + 0.3) * r2);
        ctx.lineTo(cx + Math.cos(baseAng + 0.6) * r1, cy + Math.sin(baseAng + 0.6) * r1);
        ctx.stroke();
      }
    }

    // Strike Shockwave Ring Burst
    const strikeVal = isP1 ? this.p1StrikeAnim : this.p2StrikeAnim;
    if (strikeVal > 0) {
      const strikeR = tokenR + (1 - strikeVal) * 32;
      ctx.save();
      ctx.strokeStyle = char.color;
      ctx.shadowColor = char.glow;
      ctx.shadowBlur = 16;
      ctx.globalAlpha = strikeVal;
      ctx.lineWidth = 3.5 * strikeVal;
      ctx.beginPath();
      ctx.arc(cx, cy, strikeR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Frozen ice encasement overlay
    if (isFrozen) {
      ctx.fillStyle = 'rgba(0, 190, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(cx, cy, tokenR + 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy);
      ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8);
      ctx.moveTo(cx - 6, cy - 6); ctx.lineTo(cx + 6, cy + 6);
      ctx.moveTo(cx - 6, cy + 6); ctx.lineTo(cx + 6, cy - 6);
      ctx.stroke();
    }

    // Shocked electric aura
    if (isShocked) {
      ctx.strokeStyle = '#00f5ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(cx, cy, tokenR + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Wind catch indicator
    const windActive = isP1 ? this.p1WindCatchActive : this.p2WindCatchActive;
    if (windActive) {
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(paddle.x, paddle.y, paddle.height / 2 + 15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Stunned dizzy stars effect
    if (isStunned) {
      ctx.save();
      const starCount = 3;
      const starRadius = tokenR + 8;
      const starCenterY = cy - tokenR * 0.75;
      for (let i = 0; i < starCount; i++) {
        const starAng = t * 6.5 + i * ((Math.PI * 2) / starCount);
        const sx = cx + Math.cos(starAng) * (starRadius * 0.75);
        const sy = starCenterY + Math.sin(starAng) * 6;
        ctx.fillStyle = '#ffea00';
        ctx.shadowColor = '#ffff55';
        ctx.shadowBlur = 9;
        ctx.beginPath();
        // 4-pointed star
        ctx.moveTo(sx, sy - 5);
        ctx.lineTo(sx + 2, sy - 1);
        ctx.lineTo(sx + 5, sy);
        ctx.lineTo(sx + 2, sy + 1);
        ctx.moveTo(sx, sy + 5);
        ctx.lineTo(sx - 2, sy + 1);
        ctx.lineTo(sx - 5, sy);
        ctx.lineTo(sx - 2, sy - 1);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  drawIceBeams() {
    const ctx = this.ctx;
    this.iceBeams.forEach(beam => {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 200, 255, 0.7)';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#00ccff';
      ctx.fillRect(beam.x - beam.width / 2, beam.y - beam.height / 2, beam.width, beam.height);
      // Ice crystal details
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('❄', beam.x, beam.y);
      ctx.restore();
    });
  }

  drawWaterWhips() {
    const ctx = this.ctx;
    const t = Date.now() / 1000;

    this.waterWhips.forEach(whip => {
      ctx.save();
      const startX = whip.isP1 ? whip.x - whip.width / 2 : whip.x + whip.width / 2;
      const endX = whip.isP1 ? whip.x + whip.width / 2 : whip.x - whip.width / 2;
      const length = whip.width;
      const dir = whip.isP1 ? 1 : -1;

      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00e1ff';

      // 1. Fluid Water Whip Outer Body
      ctx.beginPath();
      ctx.lineWidth = whip.height;
      ctx.lineCap = 'round';

      const grad = ctx.createLinearGradient(startX, 0, endX, 0);
      grad.addColorStop(0, 'rgba(0, 140, 255, 0.2)');
      grad.addColorStop(0.3, 'rgba(0, 210, 255, 0.85)');
      grad.addColorStop(0.8, 'rgba(100, 240, 255, 0.95)');
      grad.addColorStop(1, '#ffffff');

      ctx.strokeStyle = grad;
      ctx.moveTo(startX, whip.y);

      const segments = 12;
      for (let i = 1; i <= segments; i++) {
        const progress = i / segments;
        const currX = startX + dir * length * progress;
        const wave = Math.sin(progress * Math.PI * 3.5 - t * 20) * 14 * (1 - progress * 0.3);
        ctx.lineTo(currX, whip.y + wave);
      }
      ctx.stroke();

      // 2. Pure White Core Liquid Stream
      ctx.beginPath();
      ctx.lineWidth = whip.height * 0.4;
      ctx.strokeStyle = '#ffffff';
      ctx.moveTo(startX, whip.y);
      for (let i = 1; i <= segments; i++) {
        const progress = i / segments;
        const currX = startX + dir * length * progress;
        const wave = Math.sin(progress * Math.PI * 3.5 - t * 20) * 14 * (1 - progress * 0.3);
        ctx.lineTo(currX, whip.y + wave);
      }
      ctx.stroke();

      // 3. Water Splash Head at Whip Tip
      const tipX = endX;
      const tipY = whip.y + Math.sin(Math.PI * 3.5 - t * 20) * 8;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(tipX, tipY, 11, 0, Math.PI * 2);
      ctx.fill();

      // Water droplets spray
      ctx.fillStyle = 'rgba(180, 245, 255, 0.9)';
      for (let d = 0; d < 5; d++) {
        const dropX = tipX + (Math.random() - 0.5) * 26;
        const dropY = tipY + (Math.random() - 0.5) * 26;
        ctx.beginPath();
        ctx.arc(dropX, dropY, 2 + Math.random() * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  drawFlameWall() {
    if (!this.flameWallActive || this.flameWallStepCount <= 0) return;
    const ctx = this.ctx;
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const border = this.table.border;
    const totalH = this.height - border * 2;
    const stepH = totalH / 8;
    const t = Date.now() / 1000;

    ctx.save();

    // Fast Layered Fiery Aura Glow (No expensive shadowBlur = 0ms CPU lag!)
    ctx.fillStyle = 'rgba(255, 68, 0, 0.35)';
    const totalWallHeight = this.flameWallStepCount * stepH * 2;
    ctx.fillRect(centerX - 20, centerY - totalWallHeight / 2, 40, totalWallHeight);

    ctx.fillStyle = 'rgba(255, 200, 0, 0.4)';
    ctx.fillRect(centerX - 12, centerY - totalWallHeight / 2, 24, totalWallHeight);

    for (let s = 0; s < this.flameWallStepCount; s++) {
      const yOffsets = s === 0 ? [0] : [s * stepH, -s * stepH];

      yOffsets.forEach(offset => {
        const blockY = centerY + offset - stepH / 2;

        // 1. Magma Block Segment Base
        const blockGrad = ctx.createLinearGradient(centerX - 12, 0, centerX + 12, 0);
        blockGrad.addColorStop(0, '#590000');
        blockGrad.addColorStop(0.3, '#d92600');
        blockGrad.addColorStop(0.5, '#ff6600');
        blockGrad.addColorStop(0.7, '#d92600');
        blockGrad.addColorStop(1, '#590000');

        ctx.fillStyle = blockGrad;
        ctx.beginPath();
        ctx.roundRect(centerX - 12, blockY + 2, 24, stepH - 4, 6);
        ctx.fill();

        // 2. Inner Golden Fiery Core
        ctx.fillStyle = '#ffea00';
        ctx.beginPath();
        ctx.roundRect(centerX - 4, blockY + 6, 8, stepH - 12, 3);
        ctx.fill();

        // 3. Dancing Flame Embers on sides
        ctx.fillStyle = '#ff3300';
        const fx = centerX + (Math.sin(t * 12 + s) * 10);
        const fy = blockY + stepH / 2;
        ctx.beginPath();
        ctx.arc(fx, fy, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    ctx.restore();
  }

  drawFlyingBoulders() {
    const ctx = this.ctx;
    this.boulders.forEach(b => {
      ctx.save();
      const alpha = b.isStopped && b.stoppedTimer < 60 ? b.stoppedTimer / 60 : 1;
      ctx.globalAlpha = alpha;

      // Ground shadow if stopped
      if (b.isStopped) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(b.x, b.y + b.radius * 0.6, b.radius * 1.1, b.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8c6542';
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      } else {
        ctx.fillStyle = '#b88456';
        ctx.shadowBlur = 16;
        ctx.shadowColor = '#ffaa00';
      }

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#5a3d24';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#d9b38c';
      ctx.beginPath();
      ctx.arc(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Rock crack details
      ctx.strokeStyle = '#3d2614';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(b.x - b.radius * 0.4, b.y + b.radius * 0.2);
      ctx.lineTo(b.x + b.radius * 0.2, b.y - b.radius * 0.1);
      ctx.stroke();

      ctx.restore();
    });
  }

  drawLightningBolts() {
    const ctx = this.ctx;
    const t = Date.now() / 1000;

    this.lightningBolts.forEach(bolt => {
      ctx.save();
      const dir = bolt.isP1 ? 1 : -1;
      const startX = bolt.x - dir * bolt.width;
      const endX = bolt.x;

      ctx.shadowBlur = 22;
      ctx.shadowColor = '#00f5ff';

      // 1. Outer Neon Violet Aura
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.75)';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startX, bolt.y);

      const segments = 6;
      for (let s = 1; s <= segments; s++) {
        const segX = startX + (dir * (bolt.width / segments) * s);
        const zigzag = s === segments ? 0 : (s % 2 === 0 ? 8 : -8) * Math.sin(t * 30 + s);
        ctx.lineTo(segX, bolt.y + zigzag);
      }
      ctx.stroke();

      // 2. Pure White/Cyan Core Jagged Bolt
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(startX, bolt.y);
      for (let s = 1; s <= segments; s++) {
        const segX = startX + (dir * (bolt.width / segments) * s);
        const zigzag = s === segments ? 0 : (s % 2 === 0 ? 8 : -8) * Math.sin(t * 30 + s);
        ctx.lineTo(segX, bolt.y + zigzag);
      }
      ctx.stroke();

      // 3. Lightning Spear Head Tip
      ctx.fillStyle = '#00f5ff';
      ctx.beginPath();
      ctx.arc(endX, bolt.y, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(endX, bolt.y, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  drawStaticPulses() {
    const ctx = this.ctx;
    const t = Date.now() / 1000;

    this.staticPulses.forEach(pulse => {
      ctx.save();
      const lifeRatio = Math.max(0, 1 - pulse.radius / pulse.maxRadius);
      ctx.globalAlpha = lifeRatio;

      ctx.shadowBlur = 25;
      ctx.shadowColor = '#c084fc';

      // Outer EMP Ring
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner Sharp Electric Ring
      ctx.strokeStyle = '#00f5ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, Math.max(1, pulse.radius - 6), 0, Math.PI * 2);
      ctx.stroke();

      // Radial Lightning Tendrils
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (let a = 0; a < 8; a++) {
        const ang = a * (Math.PI / 4) + t * 6;
        const r1 = Math.max(5, pulse.radius - 16);
        const r2 = pulse.radius + 6;
        const midR = (r1 + r2) / 2;
        const offset = Math.sin(t * 20 + a) * 6;
        ctx.beginPath();
        ctx.moveTo(pulse.x + Math.cos(ang) * r1, pulse.y + Math.sin(ang) * r1);
        ctx.lineTo(pulse.x + Math.cos(ang + 0.15) * midR + offset, pulse.y + Math.sin(ang + 0.15) * midR);
        ctx.lineTo(pulse.x + Math.cos(ang) * r2, pulse.y + Math.sin(ang) * r2);
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  drawEarthWalls() {
    const ctx = this.ctx;
    const border = this.table.border;
    const goalH = this.table.goalSize + 20;

    if (this.p1EarthWallTimer > 0) {
      ctx.save();
      const alpha = this.p1EarthWallTimer < 60 ? this.p1EarthWallTimer / 60 : 1;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#8B6914';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ffaa00';
      ctx.fillRect(border + 26, this.height / 2 - goalH / 2, 18, goalH);
      // Rock texture lines
      ctx.strokeStyle = '#664400';
      ctx.lineWidth = 2;
      for (let oy = -goalH / 2 + 10; oy < goalH / 2; oy += 18) {
        ctx.beginPath();
        ctx.moveTo(border + 28, this.height / 2 + oy);
        ctx.lineTo(border + 42, this.height / 2 + oy);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (this.p2EarthWallTimer > 0) {
      ctx.save();
      const alpha = this.p2EarthWallTimer < 60 ? this.p2EarthWallTimer / 60 : 1;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#8B6914';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ffaa00';
      ctx.fillRect(this.width - border - 44, this.height / 2 - goalH / 2, 18, goalH);
      ctx.strokeStyle = '#664400';
      ctx.lineWidth = 2;
      for (let oy = -goalH / 2 + 10; oy < goalH / 2; oy += 18) {
        ctx.beginPath();
        ctx.moveTo(this.width - border - 42, this.height / 2 + oy);
        ctx.lineTo(this.width - border - 28, this.height / 2 + oy);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  checkIceFunnelCollision(isP1Goal) {
    const border = this.table.border;
    const goalSize = this.table.goalSize;
    const centerY = this.height / 2;
    const goalTop = centerY - goalSize / 2;
    const goalBottom = centerY + goalSize / 2;

    const puck = this.puck;
    const funnelWidth = 100;

    if (isP1Goal) {
      if (puck.x >= border + 10 && puck.x <= border + funnelWidth) {
        if (puck.y < goalTop + 15 && puck.y > goalTop - 50) {
          puck.vy = Math.abs(puck.vy) + 4.5;
          puck.vx = -Math.abs(puck.vx);
          soundFx.playHit(true, 1.2);
          effects.addHitSparks(puck.x, puck.y, 0, 1, '#00e5ff', true);
        } else if (puck.y > goalBottom - 15 && puck.y < goalBottom + 50) {
          puck.vy = -Math.abs(puck.vy) - 4.5;
          puck.vx = -Math.abs(puck.vx);
          soundFx.playHit(true, 1.2);
          effects.addHitSparks(puck.x, puck.y, 0, -1, '#00e5ff', true);
        }
      }
    } else {
      if (puck.x >= this.width - border - funnelWidth && puck.x <= this.width - border - 10) {
        if (puck.y < goalTop + 15 && puck.y > goalTop - 50) {
          puck.vy = Math.abs(puck.vy) + 4.5;
          puck.vx = Math.abs(puck.vx);
          soundFx.playHit(true, 1.2);
          effects.addHitSparks(puck.x, puck.y, 0, 1, '#00e5ff', true);
        } else if (puck.y > goalBottom - 15 && puck.y < goalBottom + 50) {
          puck.vy = -Math.abs(puck.vy) - 4.5;
          puck.vx = Math.abs(puck.vx);
          soundFx.playHit(true, 1.2);
          effects.addHitSparks(puck.x, puck.y, 0, -1, '#00e5ff', true);
        }
      }
    }
  }

  drawIceFunnels() {
    const ctx = this.ctx;
    const border = this.table.border;
    const goalSize = this.table.goalSize;
    const centerY = this.height / 2;
    const goalTop = centerY - goalSize / 2;
    const goalBottom = centerY + goalSize / 2;

    const drawFunnelPair = (isP1, timer) => {
      ctx.save();
      const alpha = timer < 60 ? timer / 60 : 1;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#00e5ff';

      const startX = isP1 ? border + 105 : this.width - border - 105;
      const endX = isP1 ? border + 15 : this.width - border - 15;

      ctx.beginPath();
      ctx.moveTo(startX, goalTop - 45);
      ctx.lineTo(endX, goalTop + 10);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(startX, goalBottom + 45);
      ctx.lineTo(endX, goalBottom - 10);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;

      ctx.beginPath();
      ctx.moveTo(startX, goalTop - 45);
      ctx.lineTo(endX, goalTop + 10);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(startX, goalBottom + 45);
      ctx.lineTo(endX, goalBottom - 10);
      ctx.stroke();

      ctx.restore();
    };

    if (this.p1IceFunnelTimer > 0) drawFunnelPair(true, this.p1IceFunnelTimer);
    if (this.p2IceFunnelTimer > 0) drawFunnelPair(false, this.p2IceFunnelTimer);
  }

  drawServeIndicator() {
    if (!this.servingPlayer || !this.serveReady) return;
    const ctx = this.ctx;
    const char = this.champions[this.servingPlayer === 'p1' ? this.p1CharKey : this.p2CharKey];
    
    ctx.save();
    const pulse = 0.5 + Math.sin(Date.now() / 200) * 0.5;
    ctx.globalAlpha = 0.4 + pulse * 0.4;
    ctx.fillStyle = char.color;
    ctx.font = 'bold 16px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const textX = this.servingPlayer === 'p1' ? this.p1.x + 80 : this.p2.x - 80;
    ctx.fillText(this.servingPlayer === 'p1' ? '▶ SPACE' : 'ENTER ◀', textX, this.puck.y - 30);
    
    ctx.strokeStyle = char.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.puck.x, this.puck.y, this.puck.radius + 6 + pulse * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  render() {
    const ctx = this.ctx;
    const b = this.table.border;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    if (this.screenShakeTimer > 0) {
      const shakeMag = this.screenShakeTimer * 0.8;
      ctx.translate((Math.random() - 0.5) * shakeMag, (Math.random() - 0.5) * shakeMag);
    }

    // Map themes (Rich Aesthetics)
    const rinkW = this.width - b * 2;
    const rinkH = this.height - b * 2;
    const t = Date.now() / 1000;

    if (this.selectedMap === 'ice') {
      if (!this.iceMapCanvas) this.createIceMapCache();
      ctx.drawImage(this.iceMapCanvas, 0, 0);

      // Subtle Floating Frost Particles
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      for (let i = 0; i < 12; i++) {
        const px = b + ((i * 87 + t * 20) % rinkW);
        const py = b + ((i * 53 + Math.sin(t + i) * 15) % rinkH);
        ctx.beginPath();
        ctx.arc(px, py, 1.5 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

    } else if (this.selectedMap === 'fire') {
      if (!this.fireMapCanvas) this.createFireMapCache();
      ctx.drawImage(this.fireMapCanvas, 0, 0);

      // Restricted Center Zone Pulsing Hazard Glow
      const zoneW = 280;
      const zoneX = (this.width / 2) - (zoneW / 2);
      const pulse = 0.2 + Math.sin(t * 4) * 0.1;

      ctx.save();
      ctx.fillStyle = `rgba(255, 100, 0, ${pulse})`;
      ctx.fillRect(zoneX, b, zoneW, rinkH);

      // Warning Hatching Lines inside Zone
      ctx.strokeStyle = 'rgba(255, 230, 0, 0.2)';
      ctx.lineWidth = 2;
      for (let hy = b - 40; hy < b + rinkH + 40; hy += 30) {
        ctx.beginPath();
        ctx.moveTo(zoneX, hy);
        ctx.lineTo(zoneX + zoneW, hy + 40);
        ctx.stroke();
      }

      // Rising Embers
      ctx.fillStyle = '#ffcc00';
      for (let i = 0; i < 15; i++) {
        const ex = zoneX + ((i * 23) % zoneW);
        const ey = b + rinkH - ((t * 80 + i * 40) % rinkH);
        ctx.beginPath();
        ctx.arc(ex, ey, 1 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

    } else if (this.selectedMap === 'air') {
      if (!this.airMapCanvas) this.createAirMapCache();
      ctx.drawImage(this.airMapCanvas, 0, 0);

      // Floating Wind Particles
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 240, 0.6)';
      for (let i = 0; i < 12; i++) {
        let px = b + ((i * 71 + t * 60) % rinkW);
        let py = b + ((i * 47 + Math.sin(t + i) * 15) % rinkH);
        ctx.beginPath();
        ctx.arc(px, py, 1.5 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

    } else if (this.selectedMap === 'earth') {
      if (!this.earthMapCanvas) this.createEarthMapCache();
      ctx.drawImage(this.earthMapCanvas, 0, 0);

    } else if (this.selectedMap === 'storm') {
      if (!this.stormMapCanvas) this.createStormMapCache();
      ctx.drawImage(this.stormMapCanvas, 0, 0);

      // Ambient Electric Sparks & Arc Currents
      ctx.save();
      const pulse = 0.35 + Math.sin(t * 6) * 0.2;
      ctx.strokeStyle = `rgba(192, 132, 252, ${pulse})`;
      ctx.lineWidth = 2.2;
      // Flickering lightning arcs along rails
      for (let i = 0; i < 4; i++) {
        const arcX = b + ((i * 220 + t * 90) % (rinkW - 60));
        const isTop = i % 2 === 0;
        const arcY = isTop ? b + 5 : b + rinkH - 5;
        ctx.beginPath();
        ctx.moveTo(arcX, arcY);
        ctx.lineTo(arcX + 14, arcY + (isTop ? 6 : -6));
        ctx.lineTo(arcX + 28, arcY);
        ctx.stroke();
      }
      ctx.restore();

    } else {
      ctx.fillStyle = '#0d0f18';
      ctx.fillRect(b, b, rinkW, rinkH);
    }

    this.table.draw(ctx, this.selectedMap);
    effects.updateAndDraw(ctx);

    // Ability visuals
    this.drawEarthWalls();
    this.drawIceFunnels();
    this.drawIceBeams();
    this.drawWaterWhips();
    this.drawFlameWall();
    this.drawFlyingBoulders();
    this.drawLightningBolts();
    this.drawStaticPulses();

    // Map Hazard Visuals (Flames, Ice Waves, Tornados, Lightning)
    this.drawMapHazards();

    // Characters behind paddles
    this.drawCharacterBehindPaddle(this.p1, this.p1CharKey, true);
    this.drawCharacterBehindPaddle(this.p2, this.p2CharKey, false);

    // Paddles
    this.p1.draw(ctx);
    this.p2.draw(ctx);

    // Puck
    this.puck.draw(ctx);

    // Whipped Puck Water Aura Visual
    if (this.puck.isWhipped) {
      ctx.save();
      const t = Date.now() / 1000;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00ccff';
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(this.puck.x, this.puck.y, this.puck.radius + 5 + Math.sin(t * 14) * 2.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(0, 220, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(this.puck.x, this.puck.y, this.puck.radius + 4, 0, Math.PI * 2);
      ctx.fill();

      // Droplet particles
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 3; i++) {
        const ang = t * 8 + i * 2.1;
        const dx = this.puck.x + Math.cos(ang) * (this.puck.radius + 7);
        const dy = this.puck.y + Math.sin(ang) * (this.puck.radius + 7);
        ctx.beginPath();
        ctx.arc(dx, dy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Electrified Puck Lightning Aura Visual
    if (this.puckLightningBoostTimer > 0) {
      ctx.save();
      const t = Date.now() / 1000;
      ctx.shadowBlur = 24;
      ctx.shadowColor = '#c084fc';
      ctx.strokeStyle = '#00f5ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.puck.x, this.puck.y, this.puck.radius + 5 + Math.sin(t * 24) * 2.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.beginPath();
      ctx.arc(this.puck.x, this.puck.y, this.puck.radius + 4, 0, Math.PI * 2);
      ctx.fill();

      // Mini zigzag lightning sparks around puck
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      for (let i = 0; i < 4; i++) {
        const ang = t * 14 + i * (Math.PI / 2);
        const r1 = this.puck.radius + 4;
        const r2 = this.puck.radius + 11;
        ctx.beginPath();
        ctx.moveTo(this.puck.x + Math.cos(ang) * r1, this.puck.y + Math.sin(ang) * r1);
        ctx.lineTo(this.puck.x + Math.cos(ang + 0.3) * (r1 + 4), this.puck.y + Math.sin(ang + 0.3) * (r1 + 4));
        ctx.lineTo(this.puck.x + Math.cos(ang) * r2, this.puck.y + Math.sin(ang) * r2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Blazing Fire Aura Visual (from Fire Map Hazard or Zuko Flame Wall)
    if (this.puckFireBoostTimer > 0) {
      ctx.save();
      const t = Date.now() / 1000;
      ctx.shadowBlur = 24;
      ctx.shadowColor = '#ff4400';
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.puck.x, this.puck.y, this.puck.radius + 5 + Math.sin(t * 18) * 2.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 68, 0, 0.35)';
      ctx.beginPath();
      ctx.arc(this.puck.x, this.puck.y, this.puck.radius + 4, 0, Math.PI * 2);
      ctx.fill();

      // Rising flame embers around puck
      ctx.fillStyle = '#ffeedd';
      for (let i = 0; i < 4; i++) {
        const ang = -Math.PI / 2 + Math.sin(t * 12 + i * 1.8) * 1.3;
        const dist = this.puck.radius + 6 + Math.sin(t * 8 + i) * 4;
        const ex = this.puck.x + Math.cos(ang) * dist;
        const ey = this.puck.y + Math.sin(ang) * dist;
        ctx.beginPath();
        ctx.arc(ex, ey, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Dynamic Rally Heat Aura around puck (when rallyCount >= 3)
    if (this.rallyCount >= 3) {
      ctx.save();
      const count = this.rallyCount;
      const auraColor = count >= 7 ? '#ff0055' : (count >= 5 ? '#00f5ff' : '#ffaa00');
      const strokeColor = count >= 7 ? '#ffe600' : (count >= 5 ? '#ffffff' : '#ff4400');

      ctx.shadowBlur = Math.min(32, 16 + count * 2.2);
      ctx.shadowColor = auraColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = Math.min(4.5, 2.0 + count * 0.35);

      const pulseR = this.puck.radius + 4 + Math.sin(t * (10 + count * 2)) * 3;
      ctx.beginPath();
      ctx.arc(this.puck.x, this.puck.y, pulseR, 0, Math.PI * 2);
      ctx.stroke();

      if (count >= 5) {
        // Sonic shockwave ring
        ctx.strokeStyle = auraColor;
        ctx.lineWidth = 1.8;
        const outerR = this.puck.radius + 10 + (Math.sin(t * 16) * 4);
        ctx.beginPath();
        ctx.arc(this.puck.x, this.puck.y, outerR, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Top Floating Rally Combo Badge
      ctx.save();
      const badgeY = 32;
      const badgeText = count >= 7 ? `💥 HİPER RALLİ X${count}` : (count >= 5 ? `⚡ SONİK RALLİ X${count}` : `🔥 RALLİ X${count}`);
      ctx.font = 'bold 15px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const tw = ctx.measureText(badgeText).width + 36;
      ctx.fillStyle = 'rgba(14, 17, 29, 0.75)';
      ctx.shadowBlur = 15;
      ctx.shadowColor = auraColor;
      ctx.strokeStyle = auraColor;
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect((this.width - tw) / 2, badgeY - 14, tw, 28, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = strokeColor;
      ctx.fillText(badgeText, this.width / 2, badgeY);
      ctx.restore();
    }

    // Serve indicator
    this.drawServeIndicator();

    // Live WebRTC Network Diagnostic HUD
    const isOnline = (this.isOnlineMode) || (window.onlineManager && window.onlineManager.isConnected);
    if (isOnline && window.onlineManager) {
      ctx.save();
      ctx.font = 'bold 13px Outfit, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';

      if (window.onlineManager.isHost) {
        ctx.fillStyle = '#00ffcc';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffcc';
        ctx.fillText(`🌐 ONLINE HOST | Sent: ${window.onlineManager.sentFrameCount} f`, this.width - 25, 20);
      } else if (window.onlineManager.isGuest) {
        ctx.fillStyle = '#ffcc00';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffcc00';
        ctx.fillText(`🌐 ONLINE GUEST | Recv: ${window.onlineManager.receivedFrameCount} f`, this.width - 25, 20);
      }
      ctx.restore();
    }

    // Restore screen shake offset
    ctx.restore();
  }

  updateChampionConfigs() {
    const p1Char = this.champions[this.p1CharKey] || this.champions['katara'];
    const p2Char = this.champions[this.p2CharKey] || this.champions['zuko'];
    this.p1.color = p1Char.color;
    this.p1.height = p1Char.paddleHeight;
    this.p2.color = p2Char.color;
    this.p2.height = p2Char.paddleHeight;
  }

  getNetworkState() {
    return {
      p1CharKey: this.p1CharKey,
      p2CharKey: this.p2CharKey,
      selectedMap: this.selectedMap,
      p1: { x: Math.round(this.p1.x), y: Math.round(this.p1.y), vx: this.p1.vx, vy: this.p1.vy },
      p2: { x: Math.round(this.p2.x), y: Math.round(this.p2.y), vx: this.p2.vx, vy: this.p2.vy },
      puck: {
        x: Math.round(this.puck.x),
        y: Math.round(this.puck.y),
        vx: this.puck.vx,
        vy: this.puck.vy,
        lastHitBy: this.puck.lastHitBy,
        isWhipped: this.puck.isWhipped
      },
      scoreP1: this.scoreP1,
      scoreP2: this.scoreP2,
      servingPlayer: this.servingPlayer,
      serveReady: this.serveReady,
      goalScored: this.goalScored,
      winner: this.winner,
      rallyCount: this.rallyCount || 0,
      rallyHeat: this.rallyHeat || 0,

      // Ability Cooldowns & Timers
      p1AbilityCooldown: this.p1AbilityCooldown,
      p2AbilityCooldown: this.p2AbilityCooldown,
      p1Ability2Cooldown: this.p1Ability2Cooldown,
      p2Ability2Cooldown: this.p2Ability2Cooldown,
      p1FreezeTimer: this.p1FreezeTimer,
      p2FreezeTimer: this.p2FreezeTimer,
      p1StunTimer: this.p1StunTimer,
      p2StunTimer: this.p2StunTimer,
      p1IceFunnelTimer: this.p1IceFunnelTimer,
      p2IceFunnelTimer: this.p2IceFunnelTimer,
      p1EarthWallTimer: this.p1EarthWallTimer,
      p2EarthWallTimer: this.p2EarthWallTimer,
      p1WindCatchActive: this.p1WindCatchActive,
      p2WindCatchActive: this.p2WindCatchActive,
      flameWallActive: this.flameWallActive,
      flameWallStepCount: this.flameWallStepCount,
      flameWallH: this.flameWallH,

      // Map Hazards Sync
      fireFlameActive: this.fireFlameActive,
      fireFlameX: Math.round(this.fireFlameX),
      fireFlameY: Math.round(this.fireFlameY),
      fireFlameRadius: this.fireFlameRadius,
      puckFireBoostTimer: this.puckFireBoostTimer,

      iceWaveActive: this.iceWaveActive,
      iceWaveXLeft: Math.round(this.iceWaveXLeft),
      iceWaveXRight: Math.round(this.iceWaveXRight),

      airTornadoActive: this.airTornadoActive,
      airTornadoX: Math.round(this.airTornadoX),
      airTornadoY: Math.round(this.airTornadoY),
      airTornadoRadius: this.airTornadoRadius,
      windState: this.windState,
      windDirX: this.windDirX,
      windDirY: this.windDirY,

      earthRockActive: this.earthRockActive,
      earthRockX: Math.round(this.earthRockX),
      earthRockY: Math.round(this.earthRockY),
      earthRockW: this.earthRockW,
      earthRockH: this.earthRockH,

      // Storm Map Hazards Sync
      stormLightningActive: this.stormLightningActive,
      stormLightningTelegraph: this.stormLightningTelegraph,
      stormLightningX: Math.round(this.stormLightningX),
      stormLightningY: Math.round(this.stormLightningY),
      stormLightningRadius: this.stormLightningRadius,
      p1ShockTimer: this.p1ShockTimer,
      p2ShockTimer: this.p2ShockTimer,
      puckLightningBoostTimer: this.puckLightningBoostTimer,

      // Ability Entities
      iceBeams: this.iceBeams ? this.iceBeams.map(b => ({ x: Math.round(b.x), y: Math.round(b.y), width: b.width, height: b.height, isP1: b.isP1 })) : [],
      waterWhips: this.waterWhips ? this.waterWhips.map(w => ({ x: Math.round(w.x), y: Math.round(w.y), width: w.width, height: w.height, isP1: w.isP1 })) : [],
      boulders: this.boulders ? this.boulders.map(b => ({ x: Math.round(b.x), y: Math.round(b.y), radius: b.radius, isP1: b.isP1, isStopped: b.isStopped })) : [],
      lightningBolts: this.lightningBolts ? this.lightningBolts.map(b => ({ x: Math.round(b.x), y: Math.round(b.y), vx: b.vx, width: b.width, height: b.height, isP1: b.isP1 })) : [],
      staticPulses: this.staticPulses ? this.staticPulses.map(p => ({ x: Math.round(p.x), y: Math.round(p.y), radius: Math.round(p.radius), maxRadius: p.maxRadius, isP1: p.isP1 })) : [],

      hitSpeedMeterText: this.elHitSpeed ? this.elHitSpeed.innerText : ''
    };
  }

  applyNetworkState(state) {
    if (!state) return;

    // Ensure online guest mode is active and modals are hidden
    this.isOnlineMode = true;
    this.isGuest = true;
    this.isHost = false;
    this.isPlaying = true;
    this.isPaused = false;

    if (this.startModal && this.startModal.classList.contains('active')) {
      this.startModal.classList.remove('active');
    }
    const onlineModal = document.getElementById('onlineStartModal');
    if (onlineModal && onlineModal.classList.contains('active')) {
      onlineModal.classList.remove('active');
    }

    // Sync selected characters & map
    if (state.p1CharKey && this.p1CharKey !== state.p1CharKey) {
      this.p1CharKey = state.p1CharKey;
    }
    if (state.p2CharKey && this.p2CharKey !== state.p2CharKey) {
      this.p2CharKey = state.p2CharKey;
    }
    if (state.selectedMap && this.selectedMap !== state.selectedMap) {
      this.selectedMap = state.selectedMap;
      this.iceMapCanvas = null;
      this.fireMapCanvas = null;
      this.airMapCanvas = null;
      this.earthMapCanvas = null;
      this.stormMapCanvas = null;
    }
    this.updateChampionConfigs();

    // Sync Player & Puck positions
    if (state.p1) {
      this.p1.x = state.p1.x;
      this.p1.y = state.p1.y;
      this.p1.vx = state.p1.vx;
      this.p1.vy = state.p1.vy;
    }
    if (state.p2) {
      this.p2.x = state.p2.x;
      this.p2.y = state.p2.y;
      this.p2.vx = state.p2.vx;
      this.p2.vy = state.p2.vy;
    }
    if (state.puck) {
      this.puck.x = state.puck.x;
      this.puck.y = state.puck.y;
      this.puck.vx = state.puck.vx;
      this.puck.vy = state.puck.vy;
      this.puck.lastHitBy = state.puck.lastHitBy;
      this.puck.isWhipped = state.puck.isWhipped;
    }

    // Match Status
    if (this.scoreP1 !== state.scoreP1 || this.scoreP2 !== state.scoreP2) {
      this.scoreP1 = state.scoreP1;
      this.scoreP2 = state.scoreP2;
      this.updateScoreDisplay();
    }

    this.servingPlayer = state.servingPlayer;
    this.serveReady = state.serveReady;
    this.goalScored = state.goalScored;

    if (state.winner && !this.winner) {
      this.handleWin(state.winner);
    }

    this.rallyCount = state.rallyCount || 0;
    this.rallyHeat = state.rallyHeat || 0;

    // Ability Cooldowns & Timers
    this.p1AbilityCooldown = state.p1AbilityCooldown;
    this.p2AbilityCooldown = state.p2AbilityCooldown;
    this.p1Ability2Cooldown = state.p1Ability2Cooldown;
    this.p2Ability2Cooldown = state.p2Ability2Cooldown;
    this.p1FreezeTimer = state.p1FreezeTimer;
    this.p2FreezeTimer = state.p2FreezeTimer;
    this.p1StunTimer = state.p1StunTimer || 0;
    this.p2StunTimer = state.p2StunTimer || 0;
    this.p1IceFunnelTimer = state.p1IceFunnelTimer;
    this.p2IceFunnelTimer = state.p2IceFunnelTimer;
    this.p1EarthWallTimer = state.p1EarthWallTimer;
    this.p2EarthWallTimer = state.p2EarthWallTimer;
    this.p1WindCatchActive = state.p1WindCatchActive;
    this.p2WindCatchActive = state.p2WindCatchActive;
    this.flameWallActive = state.flameWallActive;
    this.flameWallStepCount = state.flameWallStepCount;
    this.flameWallH = state.flameWallH;
    this.p1ShockTimer = state.p1ShockTimer || 0;
    this.p2ShockTimer = state.p2ShockTimer || 0;
    this.puckLightningBoostTimer = state.puckLightningBoostTimer || 0;

    // Map Hazards Sync
    this.fireFlameActive = !!state.fireFlameActive;
    this.fireFlameX = state.fireFlameX || 0;
    this.fireFlameY = state.fireFlameY || 0;
    this.fireFlameRadius = state.fireFlameRadius || 38;
    this.puckFireBoostTimer = state.puckFireBoostTimer || 0;

    this.iceWaveActive = !!state.iceWaveActive;
    this.iceWaveXLeft = state.iceWaveXLeft || 0;
    this.iceWaveXRight = state.iceWaveXRight || 0;

    this.airTornadoActive = !!state.airTornadoActive;
    this.airTornadoX = state.airTornadoX || 0;
    this.airTornadoY = state.airTornadoY || 0;
    this.airTornadoRadius = state.airTornadoRadius || 42;
    this.windState = state.windState || 'active';
    this.windDirX = state.windDirX || 1;
    this.windDirY = state.windDirY || 0.5;

    this.earthRockActive = !!state.earthRockActive;
    this.earthRockX = state.earthRockX || 0;
    this.earthRockY = state.earthRockY || 0;
    this.earthRockW = state.earthRockW || 64;
    this.earthRockH = state.earthRockH || 64;

    this.stormLightningActive = state.stormLightningActive || 0;
    this.stormLightningTelegraph = state.stormLightningTelegraph || 0;
    this.stormLightningX = state.stormLightningX || 0;
    this.stormLightningY = state.stormLightningY || 0;
    this.stormLightningRadius = state.stormLightningRadius || 55;

    // Ability Entities
    if (state.iceBeams) this.iceBeams = state.iceBeams;
    if (state.waterWhips) this.waterWhips = state.waterWhips;
    if (state.boulders) this.boulders = state.boulders;
    if (state.lightningBolts) this.lightningBolts = state.lightningBolts;
    if (state.staticPulses) this.staticPulses = state.staticPulses;

    if (state.hitSpeedMeterText && this.elHitSpeed) {
      this.elHitSpeed.innerText = state.hitSpeedMeterText;
    }
    this.updateHUDMeters();
  }

  step() {
    if (this.isPlaying && !this.isPaused) {
      const isOnlineGuest = (this.isOnlineMode && this.isGuest) || (window.onlineManager && window.onlineManager.isGuest && window.onlineManager.isConnected);
      if (isOnlineGuest) {
        this.isOnlineMode = true;
        this.isGuest = true;
        this.isHost = false;
        this.isAiMode = false;

        // Guest sends local key states & receives network state from Host
        this.handlePlayerMovement();
      } else {
        // Single player, local 2P, or online Host updates physics loop
        this.updatePhysics();
        const isOnlineHost = (this.isOnlineMode && this.isHost) || (window.onlineManager && window.onlineManager.isHost && window.onlineManager.isConnected);
        if (isOnlineHost && window.onlineManager) {
          window.onlineManager.sendGameState(this.getNetworkState());
        }
      }
    }
    this.render();
  }

  drawMapHazards() {
    const ctx = this.ctx;
    const t = Date.now() / 1000;

    // Fire Map: Volcanic Ground Flame Eruption
    if (this.selectedMap === 'fire' && this.fireFlameActive) {
      ctx.save();
      const fx = this.fireFlameX;
      const fy = this.fireFlameY;
      const r = this.fireFlameRadius;
      const pulse = 0.9 + Math.sin(t * 7) * 0.1;

      // 1. Ground Heat Aura / Scorched Floor Glow
      const groundGlow = ctx.createRadialGradient(fx, fy, 5, fx, fy, r * 1.55);
      groundGlow.addColorStop(0, 'rgba(255, 80, 0, 0.45)');
      groundGlow.addColorStop(0.5, 'rgba(255, 30, 0, 0.22)');
      groundGlow.addColorStop(1, 'rgba(20, 0, 0, 0)');
      ctx.fillStyle = groundGlow;
      ctx.beginPath();
      ctx.ellipse(fx, fy, r * 1.55 * pulse, r * 0.95 * pulse, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Scorched Volcanic Basalt Crater / Earth Crack Rim
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(fx, fy, r * 1.08, r * 0.62, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#1c0803';
      ctx.strokeStyle = '#4a1506';
      ctx.lineWidth = 3.5;
      ctx.fill();
      ctx.stroke();

      // Radiating Jagged Magma Fissures
      ctx.strokeStyle = '#ff4400';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ff5500';
      ctx.shadowBlur = 10;
      for (let crack = 0; crack < 5; crack++) {
        const crackAngle = crack * (Math.PI * 2 / 5) + 0.3;
        const cLen = r * 1.35;
        const midX = fx + Math.cos(crackAngle) * (cLen * 0.5) + (Math.sin(crack * 3) * 6);
        const midY = fy + Math.sin(crackAngle) * (cLen * 0.35) + (Math.cos(crack * 2) * 4);
        const endX = fx + Math.cos(crackAngle) * cLen;
        const endY = fy + Math.sin(crackAngle) * (cLen * 0.65);
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(midX, midY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Molten Magma Reservoir
      ctx.save();
      const magmaGrad = ctx.createRadialGradient(fx, fy, 2, fx, fy, r * 0.85);
      magmaGrad.addColorStop(0, '#fff4cc');
      magmaGrad.addColorStop(0.3, '#ffaa00');
      magmaGrad.addColorStop(0.7, '#ff3300');
      magmaGrad.addColorStop(1, '#660a00');
      ctx.fillStyle = magmaGrad;
      ctx.shadowColor = '#ff7700';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(fx, fy, r * 0.82, r * 0.44, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 4. Dynamic Rising Licking Flame Tongues (Yerden Yükselen Alev Dilleri)
      ctx.save();
      const numFlames = 7;
      for (let i = 0; i < numFlames; i++) {
        const norm = (i / (numFlames - 1)) * 2 - 1; // -1 to 1 across crater width
        const flameBaseX = fx + norm * (r * 0.65);
        const flameBaseY = fy + (1 - Math.abs(norm)) * 5;

        // Fluctuating height & horizontal wind sway
        const speedMultiplier = 11 + i * 2.3;
        const heightWave = Math.sin(t * speedMultiplier + i * 1.7);
        const flameHeight = 32 + heightWave * 12 + Math.abs(norm) * -8;
        const swayX = Math.sin(t * 9 + i * 2.1) * 7;

        // Outer Flame (Crimson-Orange)
        ctx.fillStyle = 'rgba(255, 60, 0, 0.88)';
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(flameBaseX - 7, flameBaseY);
        ctx.quadraticCurveTo(flameBaseX - 9 + swayX * 0.5, flameBaseY - flameHeight * 0.55, flameBaseX + swayX, flameBaseY - flameHeight);
        ctx.quadraticCurveTo(flameBaseX + 9 + swayX * 0.5, flameBaseY - flameHeight * 0.55, flameBaseX + 7, flameBaseY);
        ctx.closePath();
        ctx.fill();

        // Inner Flame Core (Golden Amber)
        ctx.fillStyle = 'rgba(255, 200, 30, 0.92)';
        ctx.beginPath();
        ctx.moveTo(flameBaseX - 4, flameBaseY);
        ctx.quadraticCurveTo(flameBaseX - 5 + swayX * 0.4, flameBaseY - flameHeight * 0.5, flameBaseX + swayX * 0.7, flameBaseY - flameHeight * 0.75);
        ctx.quadraticCurveTo(flameBaseX + 5 + swayX * 0.4, flameBaseY - flameHeight * 0.5, flameBaseX + 4, flameBaseY);
        ctx.closePath();
        ctx.fill();

        // White-Hot Base Core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(flameBaseX, flameBaseY - 2, 3, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 5. Ascending Glowing Ember Sparks (Havaya Yükselen Kıvılcımlar)
      ctx.save();
      for (let e = 0; e < 8; e++) {
        const emberCycle = (t * 55 + e * 23) % 65;
        const emberX = fx + Math.sin(e * 3.7 + t * 4) * (r * 0.8);
        const emberY = fy - emberCycle;
        const emberAlpha = Math.max(0, 1 - (emberCycle / 65));
        const emberSize = 1.8 + Math.sin(t * 8 + e) * 0.8;

        ctx.fillStyle = e % 2 === 0 ? `rgba(255, 220, 100, ${emberAlpha})` : `rgba(255, 90, 0, ${emberAlpha})`;
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(emberX, emberY, emberSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.restore();
    }

    // Ice Map: Center Tidal Wave Sweeping Paddles (100% Match to Reference Wave Image)
    if (this.selectedMap === 'ice' && this.iceWaveActive) {
      ctx.save();
      const border = this.table.border;
      const rinkH = this.height - border * 2;

      const drawSingleAvatarWave = (waveX, isLeft) => {
        const dir = isLeft ? -1 : 1;
        const totalW = 90; // Wave depth width

        // Front edge X (where white foam crest is)
        const frontX = waveX;
        // Back edge X (where scalloped foam is)
        const backX = waveX - totalW * dir;

        ctx.save();

        // 1. LAYER 1: Trailing Light Sky Blue Scalloped Layer (#9ec4e5)
        ctx.fillStyle = '#9ec4e5';
        ctx.beginPath();
        const archH = 65; // Height of each scalloped arch
        const archDepth = 18 * dir; // Depth of scalloped arch bulge

        ctx.moveTo(backX, border);
        // Scalloped back edge: draw repeating circular arches
        for (let y = border; y <= border + rinkH; y += archH) {
          const midY = y + archH / 2;
          const endY = Math.min(border + rinkH, y + archH);
          const curveX = backX - archDepth;
          ctx.quadraticCurveTo(curveX, midY, backX, endY);
        }
        // Front edge of Layer 1
        ctx.lineTo(frontX, border + rinkH);
        ctx.lineTo(frontX, border);
        ctx.closePath();
        ctx.fill();

        // 2. LAYER 2: Main Deep Ocean Blue Water Body (#5278a5)
        ctx.fillStyle = '#5278a5';
        ctx.beginPath();
        const layer2BackX = backX + 24 * dir;
        ctx.moveTo(layer2BackX, border);
        for (let y = border; y <= border + rinkH; y += 12) {
          const waveCurve = Math.sin(y * 0.035 + t * 6) * 10 * dir;
          ctx.lineTo(layer2BackX + waveCurve, y);
        }
        ctx.lineTo(frontX, border + rinkH);
        ctx.lineTo(frontX, border);
        ctx.closePath();
        ctx.fill();

        // White Water Swirl Detail Ripples inside Layer 2 (as seen in screenshot)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';

        const swirlYOffsets = [0.18, 0.42, 0.68, 0.88];
        swirlYOffsets.forEach((ratio, i) => {
          const sy = border + rinkH * ratio + Math.sin(t * 4 + i) * 6;
          const sx = layer2BackX + (isLeft ? 25 : -25) + Math.cos(t * 3 + i) * 10;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.bezierCurveTo(sx + 8 * dir, sy - 4, sx + 18 * dir, sy + 4, sx + 26 * dir, sy - 2);
          ctx.stroke();
        });

        // 3. LAYER 3: Medium Bright Ice Blue Accent Layer (#6ea7d2)
        ctx.fillStyle = '#6ea7d2';
        ctx.beginPath();
        const layer3BackX = frontX - 22 * dir;
        ctx.moveTo(layer3BackX, border);
        for (let y = border; y <= border + rinkH; y += 10) {
          const waveCurve = Math.sin(y * 0.035 + t * 6) * 12 * dir;
          ctx.lineTo(layer3BackX + waveCurve, y);
        }
        ctx.lineTo(frontX, border + rinkH);
        ctx.lineTo(frontX, border);
        ctx.closePath();
        ctx.fill();

        // 4. LAYER 4: Leading Edge Crisp White Foam Crest (#ffffff)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        const layer4BackX = frontX - 10 * dir;
        ctx.moveTo(layer4BackX, border);
        for (let y = border; y <= border + rinkH; y += 8) {
          const waveCurve = Math.sin(y * 0.035 + t * 6) * 12 * dir;
          ctx.lineTo(layer4BackX + waveCurve, y);
        }
        for (let y = border + rinkH; y >= border; y -= 8) {
          const waveCurve = Math.sin(y * 0.035 + t * 6) * 12 * dir;
          ctx.lineTo(frontX + waveCurve + 2 * dir, y);
        }
        ctx.closePath();
        ctx.fill();

        // Crisp White Contour Line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let y = border; y <= border + rinkH; y += 8) {
          const waveCurve = Math.sin(y * 0.035 + t * 6) * 12 * dir;
          if (y === border) ctx.moveTo(frontX + waveCurve + 2 * dir, y);
          else ctx.lineTo(frontX + waveCurve + 2 * dir, y);
        }
        ctx.stroke();

        ctx.restore();
      };

      drawSingleAvatarWave(this.iceWaveXLeft, true);
      drawSingleAvatarWave(this.iceWaveXRight, false);

      ctx.restore();
    }

    // Air Map: Ground Tornado Funnel Vortex (100% Match to Reference Image)
    if (this.selectedMap === 'air' && this.airTornadoActive) {
      ctx.save();
      const tx = this.airTornadoX;
      const ty = this.airTornadoY;
      const rot = t * 12;

      // Outer Wind Breeze Aura
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.beginPath();
      ctx.arc(tx, ty, 48, 0, Math.PI * 2);
      ctx.fill();

      // Funnel Tornado Rings (Wide at top, narrow at bottom like reference screenshot!)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';

      const funnelRings = [
        { yOff: -32, rx: 28, ry: 10 },
        { yOff: -20, rx: 22, ry: 8 },
        { yOff: -8, rx: 17, ry: 6 },
        { yOff: 4, rx: 12, ry: 4.5 },
        { yOff: 16, rx: 7, ry: 3 },
        { yOff: 26, rx: 3, ry: 2 }
      ];

      funnelRings.forEach((ring, i) => {
        const ringY = ty + ring.yOff;
        const angleShift = rot + i * 0.7;
        ctx.beginPath();
        ctx.ellipse(tx + Math.sin(angleShift) * 3, ringY, ring.rx, ring.ry, 0, 0, Math.PI * 1.6);
        ctx.stroke();
      });

      // Funnel Tail Swirl (Bottom Spout)
      ctx.beginPath();
      ctx.moveTo(tx, ty + 26);
      ctx.bezierCurveTo(tx - 6, ty + 34, tx + 4, ty + 40, tx - 2, ty + 46);
      ctx.stroke();

      ctx.restore();
    }

    // Earth Map: 3D Tile Elevation from Floor Grid (100% Grid Match)
    if (this.selectedMap === 'earth' && this.earthRockActive) {
      ctx.save();
      const rW = this.earthRockW;
      const rH = this.earthRockH;
      const rx = this.earthRockX - rW / 2;
      const ry = this.earthRockY - rH / 2;

      // 3D Base Drop Shadow (elevated off floor)
      ctx.fillStyle = 'rgba(25, 18, 12, 0.65)';
      ctx.fillRect(rx + 8, ry + 10, rW, rH);

      // 3D Dark Under-Wall Faces
      ctx.fillStyle = '#3a291b';
      ctx.fillRect(rx, ry + rH - 10, rW, 10);
      ctx.fillRect(rx + rW - 10, ry, 10, rH);

      // Rising Sandstone Slab Surface (Matching ground tiles 100%)
      const slabGrad = ctx.createLinearGradient(rx, ry, rx + rW, ry + rH);
      slabGrad.addColorStop(0, '#f0d9b5');
      slabGrad.addColorStop(0.5, '#dbc29a');
      slabGrad.addColorStop(1, '#c5a981');
      ctx.fillStyle = slabGrad;

      const drawRoundedSlab = (x, y, w, h, rad) => {
        ctx.beginPath();
        ctx.moveTo(x + rad, y);
        ctx.lineTo(x + w - rad, y);
        ctx.arcTo(x + w, y, x + w, y + rad, rad);
        ctx.lineTo(x + w, y + h - rad);
        ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
        ctx.lineTo(x + rad, y + h);
        ctx.arcTo(x, y + h, x, y + h - rad, rad);
        ctx.lineTo(x, y + rad);
        ctx.arcTo(x, y, x + rad, y, rad);
        ctx.closePath();
      };

      drawRoundedSlab(rx, ry, rW, rH - 4, 7);
      ctx.fill();

      // Dark brown grout seam border
      ctx.strokeStyle = '#4e3a29';
      ctx.lineWidth = 3.5;
      drawRoundedSlab(rx, ry, rW, rH - 4, 7);
      ctx.stroke();

      // Top & Left 3D Elevation Bevel Highlights
      ctx.fillStyle = '#fff0d6';
      ctx.fillRect(rx + 8, ry + 4, rW - 16, 4);
      ctx.fillRect(rx + 4, ry + 8, 4, rH - 16);

      // Corner Notch Dot (matching ground tiles)
      ctx.fillStyle = '#3a291b';
      ctx.beginPath();
      ctx.arc(rx + 4, ry + 4, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Storm Map Hazard: Telegraph Warning Circle & Celestial Lightning Bolt Strike
    if (this.selectedMap === 'storm') {
      const border = this.table.border;

      // 1. Telegraph Warning Indicator
      if (this.stormLightningTelegraph > 0) {
        ctx.save();
        const pulse = 0.5 + Math.sin(t * 14) * 0.5;
        const progress = 1 - (this.stormLightningTelegraph / 70);

        // Outer pulsing hazard circle
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.4 + pulse * 0.5})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(this.stormLightningX, this.stormLightningY, this.stormLightningRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Converging warning circle
        ctx.strokeStyle = '#00f5ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.stormLightningX, this.stormLightningY, Math.max(8, this.stormLightningRadius * (1 - progress)), 0, Math.PI * 2);
        ctx.stroke();

        // Warning core
        ctx.fillStyle = `rgba(192, 132, 252, ${0.2 + pulse * 0.3})`;
        ctx.beginPath();
        ctx.arc(this.stormLightningX, this.stormLightningY, this.stormLightningRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Mini crackling ground arcs in warning area
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
          const a1 = (i / 3) * Math.PI * 2 + t * 8;
          const a2 = a1 + 0.5;
          const r1 = 10;
          const r2 = this.stormLightningRadius * 0.85;
          ctx.beginPath();
          ctx.moveTo(this.stormLightningX + Math.cos(a1) * r1, this.stormLightningY + Math.sin(a1) * r1);
          ctx.lineTo(this.stormLightningX + Math.cos(a1 + 0.2) * (r1 + 15), this.stormLightningY + Math.sin(a1 + 0.2) * (r1 + 15));
          ctx.lineTo(this.stormLightningX + Math.cos(a2) * r2, this.stormLightningY + Math.sin(a2) * r2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // 2. Active Lightning Bolt Strike
      if (this.stormLightningActive > 0) {
        ctx.save();
        const flashAlpha = this.stormLightningActive / 18;
        ctx.globalAlpha = flashAlpha;

        // Ground shockwave disk
        ctx.fillStyle = 'rgba(0, 245, 255, 0.45)';
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#00f5ff';
        ctx.beginPath();
        ctx.arc(this.stormLightningX, this.stormLightningY, this.stormLightningRadius * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Main Sky-to-Ground Lightning Bolt
        const topY = border;
        const botY = this.stormLightningY;
        const boltX = this.stormLightningX;

        // Wide Purple Aura Beam
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.85)';
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(boltX, topY);

        const boltSegments = 8;
        const segH = (botY - topY) / boltSegments;
        for (let s = 1; s <= boltSegments; s++) {
          const sy = topY + s * segH;
          const sx = s === boltSegments ? boltX : boltX + (s % 2 === 0 ? 18 : -18) * Math.sin(t * 20 + s);
          ctx.lineTo(sx, sy);
        }
        ctx.stroke();

        // Bright Cyan & Pure White Core Bolt
        ctx.strokeStyle = '#00f5ff';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(boltX, topY);
        for (let s = 1; s <= boltSegments; s++) {
          const sy = topY + s * segH;
          const sx = s === boltSegments ? boltX : boltX + (s % 2 === 0 ? 18 : -18) * Math.sin(t * 20 + s);
          ctx.lineTo(sx, sy);
        }
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(boltX, topY);
        for (let s = 1; s <= boltSegments; s++) {
          const sy = topY + s * segH;
          const sx = s === boltSegments ? boltX : boltX + (s % 2 === 0 ? 18 : -18) * Math.sin(t * 20 + s);
          ctx.lineTo(sx, sy);
        }
        ctx.stroke();

        // Impact Ground Blast Starburst
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(boltX, botY, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }
  }

  createEarthMapCache() {
    this.earthMapCanvas = document.createElement('canvas');
    this.earthMapCanvas.width = this.width;
    this.earthMapCanvas.height = this.height;
    const ctx = this.earthMapCanvas.getContext('2d');
    const b = this.table.border;
    const rinkW = this.width - b * 2;
    const rinkH = this.height - b * 2;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // 1. Base Grey Granite Background outside arena (from reference image)
    ctx.fillStyle = '#6e7379';
    ctx.fillRect(0, 0, this.width, this.height);

    // Granite texture noise
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i < 80; i++) {
      const gx = (i * 37) % this.width;
      const gy = (i * 23) % this.height;
      ctx.fillRect(gx, gy, 3, 3);
    }

    // 2. Sandstone Floor Tiles (Left & Right Areas - Matching Reference Image Colors)
    const slabW = 105;
    const slabH = 90;

    // Base Sandstone Fill
    const bgGrad = ctx.createLinearGradient(b, b, this.width - b, this.height - b);
    bgGrad.addColorStop(0, '#a8784b');
    bgGrad.addColorStop(0.5, '#ba895a');
    bgGrad.addColorStop(1, '#a8784b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(b, b, rinkW, rinkH);

    const drawRoundedSlab = (x, y, w, h, rad) => {
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.lineTo(x + w - rad, y);
      ctx.arcTo(x + w, y, x + w, y + rad, rad);
      ctx.lineTo(x + w, y + h - rad);
      ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
      ctx.lineTo(x + rad, y + h);
      ctx.arcTo(x, y + h, x, y + h - rad, rad);
      ctx.lineTo(x, y + rad);
      ctx.arcTo(x, y, x + rad, y, rad);
      ctx.closePath();
    };

    // Draw Sandstone Tile Grid
    for (let col = -1; col < Math.ceil(rinkW / slabW) + 1; col++) {
      const colX = b + col * slabW;
      const offsetY = (col % 2 === 0) ? 0 : slabH / 2;

      for (let row = -1; row < Math.ceil(rinkH / slabH) + 1; row++) {
        const rowY = b + row * slabH + offsetY;

        // Warm Terracotta/Sandstone Tile Surface Gradient (from reference image)
        const slabGrad = ctx.createLinearGradient(colX, rowY, colX + slabW, rowY + slabH);
        slabGrad.addColorStop(0, '#c79465');
        slabGrad.addColorStop(0.5, '#b88456');
        slabGrad.addColorStop(1, '#a67246');

        ctx.fillStyle = slabGrad;
        drawRoundedSlab(colX + 3, rowY + 3, slabW - 6, slabH - 6, 7);
        ctx.fill();

        // Dark Brown Grout Seam Line
        ctx.strokeStyle = '#4e331c';
        ctx.lineWidth = 3.5;
        drawRoundedSlab(colX + 3, rowY + 3, slabW - 6, slabH - 6, 7);
        ctx.stroke();

        // Corner Notch Dot (matching reference image)
        ctx.fillStyle = '#3a2312';
        ctx.beginPath();
        ctx.arc(colX + 7, rowY + 7, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Center Dark Soil / Earth Strip (280px wide - Matching Reference Image)
    const zoneW = 280;
    const zoneX = centerX - zoneW / 2;

    const soilGrad = ctx.createLinearGradient(zoneX, b, zoneX + zoneW, b);
    soilGrad.addColorStop(0, '#422a18');
    soilGrad.addColorStop(0.5, '#4f331d');
    soilGrad.addColorStop(1, '#422a18');
    ctx.fillStyle = soilGrad;
    ctx.fillRect(zoneX, b, zoneW, rinkH);

    // Soil Texture Speckles
    ctx.fillStyle = 'rgba(25, 14, 8, 0.45)';
    for (let i = 0; i < 70; i++) {
      const sx = zoneX + ((i * 37) % zoneW);
      const sy = b + ((i * 23) % rinkH);
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }

    // Dark Borders on Soil Strip Edges
    ctx.strokeStyle = '#2b190d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(zoneX, b);
    ctx.lineTo(zoneX, b + rinkH);
    ctx.moveTo(zoneX + zoneW, b);
    ctx.lineTo(zoneX + zoneW, b + rinkH);
    ctx.stroke();

    // 4. Center Markings & Earth Kingdom Coin Emblem (100% Match to Reference Image)
    ctx.strokeStyle = '#d9c9b0';
    ctx.lineWidth = 4;

    // Vertical Center Line
    ctx.beginPath();
    ctx.moveTo(centerX, b);
    ctx.lineTo(centerX, b + rinkH);
    ctx.stroke();

    // Center Circle
    const circleRadius = 56;
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Square inside Center Circle (Earth Kingdom Coin motif)
    const sqSize = 28;
    ctx.beginPath();
    ctx.rect(centerX - sqSize / 2, centerY - sqSize / 2, sqSize, sqSize);
    ctx.stroke();

    // 5. 3D Granite Corner Pillars (Top, Bottom & Goals)
    const gY = this.table.goalYStart;
    const gH = this.table.goalSize;

    // Top & Bottom Granite Rails
    ctx.fillStyle = '#62676d';
    ctx.fillRect(0, 0, this.width, b);
    ctx.fillRect(0, this.height - b, this.width, b);

    // Left Goal Granite Pillars (Top & Bottom of Left Goal)
    ctx.fillStyle = '#8f949a';
    ctx.fillRect(0, 0, b + 30, gY);
    ctx.fillStyle = '#595d63';
    ctx.fillRect(b + 6, 0, 24, gY);

    ctx.fillStyle = '#8f949a';
    ctx.fillRect(0, gY + gH, b + 30, this.height - (gY + gH));
    ctx.fillStyle = '#595d63';
    ctx.fillRect(b + 6, gY + gH, 24, this.height - (gY + gH));

    // Left Goal Recessed Shadow
    ctx.fillStyle = '#2b190d';
    ctx.fillRect(0, gY, b, gH);

    // Right Goal Granite Pillars (Top & Bottom of Right Goal)
    ctx.fillStyle = '#8f949a';
    ctx.fillRect(this.width - b - 30, 0, b + 30, gY);
    ctx.fillStyle = '#595d63';
    ctx.fillRect(this.width - b - 30, 0, 24, gY);

    ctx.fillStyle = '#8f949a';
    ctx.fillRect(this.width - b - 30, gY + gH, b + 30, this.height - (gY + gH));
    ctx.fillStyle = '#595d63';
    ctx.fillRect(this.width - b - 30, gY + gH, 24, this.height - (gY + gH));

    // Right Goal Recessed Shadow
    ctx.fillStyle = '#2b190d';
    ctx.fillRect(this.width - b, gY, b, gH);
  }

  getRandomGroundTileCoords() {
    const b = this.table.border;
    const rinkW = this.width - b * 2;
    const rinkH = this.height - b * 2;
    const slabW = 105;
    const slabH = 90;

    const validTiles = [];

    const zoneW = 280;
    const zoneMinX = (this.width / 2) - (zoneW / 2);
    const zoneMaxX = (this.width / 2) + (zoneW / 2);

    for (let col = 0; col < Math.floor(rinkW / slabW); col++) {
      const colX = b + col * slabW;
      const tileCenterX = colX + slabW / 2;

      // Skip tiles inside center soil zone or too close to goals
      if (tileCenterX >= zoneMinX - 20 && tileCenterX <= zoneMaxX + 20) continue;
      if (tileCenterX < b + 110 || tileCenterX > this.width - b - 110) continue;

      const offsetY = (col % 2 === 0) ? 0 : slabH / 2;

      for (let row = 0; row < Math.floor(rinkH / slabH); row++) {
        const rowY = b + row * slabH + offsetY;
        const tileCenterY = rowY + slabH / 2;

        if (tileCenterY > b + 40 && tileCenterY < this.height - b - 40) {
          validTiles.push({
            x: colX + 3 + (slabW - 6) / 2,
            y: rowY + 3 + (slabH - 6) / 2,
            w: slabW - 6,
            h: slabH - 6
          });
        }
      }
    }

    if (validTiles.length === 0) {
      return { x: this.width * 0.25, y: this.height * 0.5, w: 99, h: 84 };
    }
    return validTiles[Math.floor(Math.random() * validTiles.length)];
  }

  createIceMapCache() {
    this.iceMapCanvas = document.createElement('canvas');
    this.iceMapCanvas.width = this.width;
    this.iceMapCanvas.height = this.height;
    const ctx = this.iceMapCanvas.getContext('2d');
    const b = this.table.border;
    const rinkW = this.width - b * 2;
    const rinkH = this.height - b * 2;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // 0. Fill Outer Canvas Background (Prevents black background bug!)
    ctx.fillStyle = '#2c5a7d';
    ctx.fillRect(0, 0, this.width, this.height);

    // 1. Ice Rink Base Surface (Clean Pale Ice Blue Gradient matching reference image)
    const bgGrad = ctx.createLinearGradient(0, b, 0, b + rinkH);
    bgGrad.addColorStop(0, '#b8e3fc');
    bgGrad.addColorStop(0.2, '#d6f0ff');
    bgGrad.addColorStop(0.5, '#eef9ff');
    bgGrad.addColorStop(0.8, '#d6f0ff');
    bgGrad.addColorStop(1, '#b8e3fc');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(b, b, rinkW, rinkH);

    // 2. Vertical Glossy Light Rays (Left & Right Sheen Bands matching reference image)
    const drawSheenBeam = (beamX) => {
      const bGrad = ctx.createLinearGradient(beamX - 60, 0, beamX + 60, 0);
      bGrad.addColorStop(0, 'rgba(255, 255, 255, 0.0)');
      bGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.35)');
      bGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.65)');
      bGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.35)');
      bGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
      ctx.fillStyle = bGrad;
      ctx.fillRect(beamX - 60, b, 120, rinkH);
    };

    drawSheenBeam(b + rinkW * 0.26);
    drawSheenBeam(b + rinkW * 0.74);

    // 3. Center Ice Pipe (Vertical 3D Center Line matching reference image)
    const pipeW = 24;
    const pipeGrad = ctx.createLinearGradient(centerX - pipeW / 2, 0, centerX + pipeW / 2, 0);
    pipeGrad.addColorStop(0, '#75b3dc');
    pipeGrad.addColorStop(0.3, '#bde3fa');
    pipeGrad.addColorStop(0.5, '#ffffff');
    pipeGrad.addColorStop(0.8, '#a3d4f5');
    pipeGrad.addColorStop(1, '#629fc9');

    ctx.fillStyle = pipeGrad;
    ctx.fillRect(centerX - pipeW / 2, b, pipeW, rinkH);

    // Pipe outer borders
    ctx.strokeStyle = '#5a96be';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - pipeW / 2, b);
    ctx.lineTo(centerX - pipeW / 2, b + rinkH);
    ctx.moveTo(centerX + pipeW / 2, b);
    ctx.lineTo(centerX + pipeW / 2, b + rinkH);
    ctx.stroke();

    // 4. Center Emblem (Official Water Tribe Symbol - Pixel-perfect match to Reference Image)
    const outerRadius = 76;
    const innerRadius = 62;

    // Outer 3D Metallic Ice Ring Frame
    const ringGrad = ctx.createLinearGradient(centerX - outerRadius, centerY - outerRadius, centerX + outerRadius, centerY + outerRadius);
    ringGrad.addColorStop(0, '#5a97c2');
    ringGrad.addColorStop(0.3, '#c2e5fb');
    ringGrad.addColorStop(0.5, '#ffffff');
    ringGrad.addColorStop(0.85, '#91c4e8');
    ringGrad.addColorStop(1, '#4a82ab');

    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#3d729a';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner Ring Groove / Shadow Inset
    ctx.strokeStyle = 'rgba(30, 70, 110, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius + 2, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Emblem Base Disk
    const innerGrad = ctx.createRadialGradient(centerX - 10, centerY - 10, 5, centerX, centerY, innerRadius);
    innerGrad.addColorStop(0, '#ffffff');
    innerGrad.addColorStop(0.65, '#dcf1ff');
    innerGrad.addColorStop(1, '#bde0f7');

    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#528cb6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Official Water Tribe Symbol Drawing
    ctx.save();

    // A. White Crescent Moon (Left Side)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#437aa5';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(centerX - 2, centerY, 46, Math.PI * 0.42, Math.PI * 1.58, false); // Outer left arc
    ctx.arc(centerX + 22, centerY, 48, Math.PI * 1.35, Math.PI * 0.65, true); // Inner right arc (crescent cut)
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // B. 3 Wavy Water Streams inside Emblem
    ctx.strokeStyle = '#3d79a8';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';

    const drawWaterWave = (waveY, scale = 1.0) => {
      ctx.beginPath();
      const sx = centerX - 18 * scale;
      const ex = centerX + 24 * scale;
      ctx.moveTo(sx, waveY);
      ctx.bezierCurveTo(
        sx + 12, waveY - 7, 
        sx + 26, waveY + 7, 
        ex, waveY
      );
      ctx.stroke();
    };

    drawWaterWave(centerY - 15, 0.9);
    drawWaterWave(centerY, 1.1);
    drawWaterWave(centerY + 15, 0.9);

    ctx.restore();

    // 5. 3D Ice Wall Blocks & Goal Alcove Cutouts (100% Match to Reference Image)
    const gY = this.table.goalYStart;
    const gH = this.table.goalSize;

    // Top & Bottom 3D Ice Rails
    const railGrad = ctx.createLinearGradient(0, 0, 0, b);
    railGrad.addColorStop(0, '#b8e3fb');
    railGrad.addColorStop(0.5, '#e4f5ff');
    railGrad.addColorStop(1, '#94c7ec');

    ctx.fillStyle = railGrad;
    ctx.fillRect(0, 0, this.width, b);
    ctx.fillRect(0, this.height - b, this.width, b);

    // Left Goal Alcove 3D Ice Blocks (Top & Bottom of Left Goal)
    ctx.fillStyle = '#a6d5f7';
    ctx.fillRect(0, 0, b + 28, gY);
    ctx.fillStyle = '#7ebdcf';
    ctx.fillRect(b + 4, 0, 24, gY);

    ctx.fillStyle = '#a6d5f7';
    ctx.fillRect(0, gY + gH, b + 28, this.height - (gY + gH));
    ctx.fillStyle = '#7ebdcf';
    ctx.fillRect(b + 4, gY + gH, 24, this.height - (gY + gH));

    // Left Goal Alcove Recessed Dark Shadow
    ctx.fillStyle = '#163554';
    ctx.fillRect(0, gY, b, gH);

    // Right Goal Alcove 3D Ice Blocks (Top & Bottom of Right Goal)
    ctx.fillStyle = '#a6d5f7';
    ctx.fillRect(this.width - b - 28, 0, b + 28, gY);
    ctx.fillStyle = '#7ebdcf';
    ctx.fillRect(this.width - b - 28, 0, 24, gY);

    ctx.fillStyle = '#a6d5f7';
    ctx.fillRect(this.width - b - 28, gY + gH, b + 28, this.height - (gY + gH));
    ctx.fillStyle = '#7ebdcf';
    ctx.fillRect(this.width - b - 28, gY + gH, 24, this.height - (gY + gH));

    // Right Goal Alcove Recessed Dark Shadow
    ctx.fillStyle = '#163554';
    ctx.fillRect(this.width - b, gY, b, gH);
  }

  createFireMapCache() {
    this.fireMapCanvas = document.createElement('canvas');
    this.fireMapCanvas.width = this.width;
    this.fireMapCanvas.height = this.height;
    const ctx = this.fireMapCanvas.getContext('2d');
    const b = this.table.border;
    const rinkW = this.width - b * 2;
    const rinkH = this.height - b * 2;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // 0. Fill Outer Canvas Background (Prevents black background bug!)
    ctx.fillStyle = '#4a0404';
    ctx.fillRect(0, 0, this.width, this.height);

    // 1. Base Crimson Red Metallic Steel Plates
    const bgGrad = ctx.createLinearGradient(b, b, this.width - b, this.height - b);
    bgGrad.addColorStop(0, '#660404');
    bgGrad.addColorStop(0.3, '#940909');
    bgGrad.addColorStop(0.5, '#b00c0c');
    bgGrad.addColorStop(0.7, '#940909');
    bgGrad.addColorStop(1, '#660404');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(b, b, rinkW, rinkH);

    // Dark Curved Spotlight Arches on Left & Right Sides (matching reference image)
    ctx.fillStyle = 'rgba(45, 0, 0, 0.42)';
    ctx.beginPath();
    ctx.arc(b, centerY, 340, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.width - b, centerY, 340, Math.PI / 2, 3 * Math.PI / 2);
    ctx.fill();

    // Riveted Steel Plate Seams (Horizontal & Vertical Lines with Rivet Dots)
    ctx.strokeStyle = '#380202';
    ctx.lineWidth = 2.5;

    const panelW = 160;
    const panelH = 135;

    for (let x = b + panelW; x < this.width - b; x += panelW) {
      ctx.beginPath();
      ctx.moveTo(x, b);
      ctx.lineTo(x, b + rinkH);
      ctx.stroke();

      ctx.fillStyle = '#220000';
      for (let ry = b + 15; ry < b + rinkH; ry += 20) {
        ctx.beginPath();
        ctx.arc(x - 6, ry, 1.5, 0, Math.PI * 2);
        ctx.arc(x + 6, ry, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let y = b + panelH; y < b + rinkH; y += panelH) {
      ctx.beginPath();
      ctx.moveTo(b, y);
      ctx.lineTo(this.width - b, y);
      ctx.stroke();

      ctx.fillStyle = '#220000';
      for (let rx = b + 15; rx < this.width - b; rx += 20) {
        ctx.beginPath();
        ctx.arc(rx, y - 6, 1.5, 0, Math.PI * 2);
        ctx.arc(rx, y + 6, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. Center Lava/Magma Restricted Zone (Matching Reference Image)
    const zoneW = 280;
    const zoneX = centerX - zoneW / 2;

    const magmaGrad = ctx.createLinearGradient(zoneX, b, zoneX + zoneW, b);
    magmaGrad.addColorStop(0, '#c73200');
    magmaGrad.addColorStop(0.3, '#e65c00');
    magmaGrad.addColorStop(0.5, '#ff8000');
    magmaGrad.addColorStop(0.7, '#e65c00');
    magmaGrad.addColorStop(1, '#c73200');

    ctx.fillStyle = magmaGrad;
    ctx.fillRect(zoneX, b, zoneW, rinkH);

    // Mottled Magma Noise Texture
    ctx.fillStyle = 'rgba(70, 10, 0, 0.45)';
    for (let i = 0; i < 90; i++) {
      const mx = zoneX + ((i * 37) % zoneW);
      const my = b + ((i * 23) % rinkH);
      const mr = 3 + (i % 6);
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glowing Golden Border Lines framing Center Magma Zone
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(zoneX, b);
    ctx.lineTo(zoneX, b + rinkH);
    ctx.moveTo(zoneX + zoneW, b);
    ctx.lineTo(zoneX + zoneW, b + rinkH);
    ctx.stroke();

    // Inner Orange Glow Lines
    ctx.strokeStyle = '#ff5500';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(zoneX + 4, b);
    ctx.lineTo(zoneX + 4, b + rinkH);
    ctx.moveTo(zoneX + zoneW - 4, b);
    ctx.lineTo(zoneX + zoneW - 4, b + rinkH);
    ctx.stroke();

    // 3. Center Golden Vertical Line & Fire Nation Emblem (100% Match to Reference Image)
    ctx.strokeStyle = '#ffe600';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX, b);
    ctx.lineTo(centerX, b + rinkH);
    ctx.stroke();

    const outerRadius = 76;
    const innerRadius = 62;

    // Golden Outer Emblem Ring
    const ringGrad = ctx.createLinearGradient(centerX - outerRadius, centerY - outerRadius, centerX + outerRadius, centerY + outerRadius);
    ringGrad.addColorStop(0, '#d49b00');
    ringGrad.addColorStop(0.3, '#ffea66');
    ringGrad.addColorStop(0.5, '#ffffff');
    ringGrad.addColorStop(0.8, '#ffd700');
    ringGrad.addColorStop(1, '#b37700');

    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#996600';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner Disk (Warm Orange Magma Fill)
    const innerGrad = ctx.createRadialGradient(centerX - 10, centerY - 10, 5, centerX, centerY, innerRadius);
    innerGrad.addColorStop(0, '#ffaa00');
    innerGrad.addColorStop(0.6, '#ff5500');
    innerGrad.addColorStop(1, '#991100');

    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffe600';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Official Fire Nation Flame Symbol (Stylized 3-pronged Flame with Bottom Swirl)
    ctx.save();
    ctx.fillStyle = '#210202';
    ctx.strokeStyle = '#470505';
    ctx.lineWidth = 2;

    ctx.beginPath();
    // Center top flame tip
    ctx.moveTo(centerX, centerY - 38);
    // Right curve down
    ctx.bezierCurveTo(centerX + 16, centerY - 20, centerX + 24, centerY - 8, centerX + 24, centerY + 6);
    // Right outer prong
    ctx.bezierCurveTo(centerX + 24, centerY + 24, centerX + 12, centerY + 36, centerX, centerY + 36);
    // Left outer prong & bottom swirl
    ctx.bezierCurveTo(centerX - 16, centerY + 36, centerX - 24, centerY + 20, centerX - 24, centerY + 4);
    ctx.bezierCurveTo(centerX - 24, centerY - 12, centerX - 12, centerY - 24, centerX, centerY - 38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner Flame Cutout Swirl
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.arc(centerX + 2, centerY + 14, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 4. Top & Bottom Crimson Steel Rails
    ctx.fillStyle = '#4a0404';
    ctx.fillRect(0, 0, this.width, b);
    ctx.fillRect(0, this.height - b, this.width, b);
  }

  createAirMapCache() {
    this.airMapCanvas = document.createElement('canvas');
    this.airMapCanvas.width = this.width;
    this.airMapCanvas.height = this.height;
    const ctx = this.airMapCanvas.getContext('2d');
    const b = this.table.border;
    const rinkW = this.width - b * 2;
    const rinkH = this.height - b * 2;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // 0. Fill Outer Canvas Background (Prevents black background bug!)
    ctx.fillStyle = '#686d49';
    ctx.fillRect(0, 0, this.width, this.height);

    // 1. Base Sage/Olive Green Marble Courtyard Floor (100% Match to Reference Image)
    const bgGrad = ctx.createLinearGradient(b, b, this.width - b, this.height - b);
    bgGrad.addColorStop(0, '#929965');
    bgGrad.addColorStop(0.3, '#9d9f6d');
    bgGrad.addColorStop(0.5, '#a6a778');
    bgGrad.addColorStop(0.7, '#9d9f6d');
    bgGrad.addColorStop(1, '#929965');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(b, b, rinkW, rinkH);

    // Marble noise texture
    ctx.fillStyle = 'rgba(255, 255, 230, 0.12)';
    for (let i = 0; i < 100; i++) {
      const mx = b + ((i * 47) % rinkW);
      const my = b + ((i * 31) % rinkH);
      ctx.beginPath();
      ctx.arc(mx, my, 4 + (i % 6), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(70, 75, 45, 0.12)';
    for (let i = 0; i < 100; i++) {
      const mx = b + ((i * 61) % rinkW);
      const my = b + ((i * 37) % rinkH);
      ctx.beginPath();
      ctx.arc(mx, my, 3 + (i % 5), 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Translucent Cream Marble Center Band & Cross Lines (from Reference Image)
    ctx.fillStyle = 'rgba(240, 237, 218, 0.42)';
    // Horizontal Center Band
    ctx.fillRect(b, centerY - 18, rinkW, 36);
    // Vertical Center Band
    ctx.fillRect(centerX - 18, b, 36, rinkH);

    // 3. Center Ring & Air Nomad Triple-Spiral Emblem (100% Match to Reference Image)
    const outerR = 82;
    const innerR = 66;

    // Outer Cream Ring
    ctx.fillStyle = 'rgba(240, 237, 218, 0.48)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(240, 237, 218, 0.65)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerR, 0, Math.PI * 2);
    ctx.fill();

    // Air Nomad Triple Spiral Emblem Drawing
    ctx.save();
    ctx.strokeStyle = 'rgba(245, 243, 230, 0.9)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    // 3 Spiral Arms curving outwards from center
    for (let arm = 0; arm < 3; arm++) {
      const baseAngle = arm * (Math.PI * 2 / 3);
      ctx.beginPath();
      for (let t = 0; t <= 1; t += 0.05) {
        const r = 8 + t * 44;
        const angle = baseAngle + t * Math.PI * 1.3;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();



    // 5. 3D Air Temple White Marble Pillars (Top, Bottom & Corner Columns)
    const gY = this.table.goalYStart;
    const gH = this.table.goalSize;

    // Top & Bottom Ivory Rails
    const railGrad = ctx.createLinearGradient(0, 0, 0, b);
    railGrad.addColorStop(0, '#eae6d3');
    railGrad.addColorStop(0.5, '#f5f2e4');
    railGrad.addColorStop(1, '#d0ccb0');

    ctx.fillStyle = railGrad;
    ctx.fillRect(0, 0, this.width, b);
    ctx.fillRect(0, this.height - b, this.width, b);

    // Left Goal 3D Marble Pillars (Top & Bottom Columns from Reference Image)
    ctx.fillStyle = '#eae6d3';
    ctx.fillRect(0, 0, b + 32, gY);
    ctx.fillStyle = '#c7c29e';
    ctx.fillRect(b + 12, 0, 20, gY);
    ctx.fillStyle = '#a6a180';
    ctx.fillRect(b + 28, 0, 4, gY);

    ctx.fillStyle = '#eae6d3';
    ctx.fillRect(0, gY + gH, b + 32, this.height - (gY + gH));
    ctx.fillStyle = '#c7c29e';
    ctx.fillRect(b + 12, gY + gH, 20, this.height - (gY + gH));
    ctx.fillStyle = '#a6a180';
    ctx.fillRect(b + 28, gY + gH, 4, this.height - (gY + gH));

    // Left Goal Alcove Recessed Dark Shadow
    ctx.fillStyle = '#4e5235';
    ctx.fillRect(0, gY, b, gH);

    // Right Goal 3D Marble Pillars (Top & Bottom Columns from Reference Image)
    ctx.fillStyle = '#eae6d3';
    ctx.fillRect(this.width - b - 32, 0, b + 32, gY);
    ctx.fillStyle = '#c7c29e';
    ctx.fillRect(this.width - b - 32, 0, 20, gY);
    ctx.fillStyle = '#a6a180';
    ctx.fillRect(this.width - b - 12, 0, 4, gY);

    ctx.fillStyle = '#eae6d3';
    ctx.fillRect(this.width - b - 32, gY + gH, b + 32, this.height - (gY + gH));
    ctx.fillStyle = '#c7c29e';
    ctx.fillRect(this.width - b - 32, gY + gH, 20, this.height - (gY + gH));
    ctx.fillStyle = '#a6a180';
    ctx.fillRect(this.width - b - 12, gY + gH, 4, this.height - (gY + gH));

    // Right Goal Alcove Recessed Dark Shadow
    ctx.fillStyle = '#4e5235';
    ctx.fillRect(this.width - b, gY, b, gH);
  }

  createStormMapCache() {
    this.stormMapCanvas = document.createElement('canvas');
    this.stormMapCanvas.width = this.width;
    this.stormMapCanvas.height = this.height;
    const ctx = this.stormMapCanvas.getContext('2d');
    const b = this.table.border;
    const rinkW = this.width - b * 2;
    const rinkH = this.height - b * 2;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // 0. Fill Outer Canvas Background (Dark Stormy Night / Obsidian)
    ctx.fillStyle = '#100d1a';
    ctx.fillRect(0, 0, this.width, this.height);

    // 1. Base Obsidian / Charcoal Slate Floor with Subtle Midnight Purple Gradient
    const bgGrad = ctx.createLinearGradient(b, b, this.width - b, this.height - b);
    bgGrad.addColorStop(0, '#151224');
    bgGrad.addColorStop(0.25, '#1d1833');
    bgGrad.addColorStop(0.5, '#261f42');
    bgGrad.addColorStop(0.75, '#1d1833');
    bgGrad.addColorStop(1, '#151224');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(b, b, rinkW, rinkH);

    // Interlocking Hexagonal / Square Tile Grout Seams
    ctx.strokeStyle = '#0b0914';
    ctx.lineWidth = 2.5;

    const tileW = 120;
    const tileH = 95;

    for (let x = b + tileW; x < this.width - b; x += tileW) {
      ctx.beginPath();
      ctx.moveTo(x, b);
      ctx.lineTo(x, b + rinkH);
      ctx.stroke();

      // Metallic corner rivets
      ctx.fillStyle = '#2d244a';
      for (let ry = b + 15; ry < b + rinkH; ry += tileH) {
        ctx.beginPath();
        ctx.arc(x, ry, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let y = b + tileH; y < b + rinkH; y += tileH) {
      ctx.beginPath();
      ctx.moveTo(b, y);
      ctx.lineTo(this.width - b, y);
      ctx.stroke();
    }

    // 2. Neon Violet & Cyan Power Conduit Grooves running across field
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.28)';
    ctx.lineWidth = 3;
    const conduitOffset = 110;

    // Horizontal Upper Conduit
    ctx.beginPath();
    ctx.moveTo(b + 40, b + conduitOffset);
    ctx.lineTo(this.width - b - 40, b + conduitOffset);
    ctx.stroke();

    // Horizontal Lower Conduit
    ctx.beginPath();
    ctx.moveTo(b + 40, this.height - b - conduitOffset);
    ctx.lineTo(this.width - b - 40, this.height - b - conduitOffset);
    ctx.stroke();

    // Cyan High-Voltage Core Lines
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(b + 40, b + conduitOffset);
    ctx.lineTo(this.width - b - 40, b + conduitOffset);
    ctx.moveTo(b + 40, this.height - b - conduitOffset);
    ctx.lineTo(this.width - b - 40, this.height - b - conduitOffset);
    ctx.stroke();

    // 3. Center Lightning Trigram & Royal Fire Nation Lightning Emblem
    const centerLineGrad = ctx.createLinearGradient(0, b, 0, b + rinkH);
    centerLineGrad.addColorStop(0, '#7c3aed');
    centerLineGrad.addColorStop(0.5, '#00f5ff');
    centerLineGrad.addColorStop(1, '#7c3aed');

    ctx.strokeStyle = centerLineGrad;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(centerX, b);
    ctx.lineTo(centerX, b + rinkH);
    ctx.stroke();

    const outerR = 78;
    const innerR = 64;

    // Outer 3D Metallic Ring with Golden & Violet Bevel
    const ringGrad = ctx.createLinearGradient(centerX - outerR, centerY - outerR, centerX + outerR, centerY + outerR);
    ringGrad.addColorStop(0, '#581c87');
    ringGrad.addColorStop(0.3, '#a855f7');
    ringGrad.addColorStop(0.5, '#ffffff');
    ringGrad.addColorStop(0.8, '#c084fc');
    ringGrad.addColorStop(1, '#3b0764');

    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#2e1065';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner Disk (Deep Midnight Electric Plate)
    const diskGrad = ctx.createRadialGradient(centerX - 8, centerY - 8, 6, centerX, centerY, innerR);
    diskGrad.addColorStop(0, '#2e1065');
    diskGrad.addColorStop(0.65, '#1e1b4b');
    diskGrad.addColorStop(1, '#0f0c1d');

    ctx.fillStyle = diskGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Iconic Lightning Bending Trigram / 3-Pronged Celestial Lightning Symbol
    ctx.save();
    ctx.fillStyle = '#00f5ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;

    for (let bolt = 0; bolt < 3; bolt++) {
      const baseAng = bolt * (Math.PI * 2 / 3) - Math.PI / 2;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(baseAng);

      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(8, -24);
      ctx.lineTo(2, -24);
      ctx.lineTo(12, -46);
      ctx.lineTo(-2, -30);
      ctx.lineTo(4, -30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    // Central Luminous Core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. 3D Tesla Coil Conductor Rails & Goal Pillars
    const gY = this.table.goalYStart;
    const gH = this.table.goalSize;

    // Top & Bottom Rails (Dark Titanium Gunmetal with Purple Linear Conductor)
    const railGrad = ctx.createLinearGradient(0, 0, 0, b);
    railGrad.addColorStop(0, '#1a1829');
    railGrad.addColorStop(0.4, '#2e284a');
    railGrad.addColorStop(0.7, '#483d73');
    railGrad.addColorStop(1, '#1e1a33');

    ctx.fillStyle = railGrad;
    ctx.fillRect(0, 0, this.width, b);
    ctx.fillRect(0, this.height - b, this.width, b);

    // Glowing Conductor Core in Rails
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(b + 30, 4, rinkW - 60, 3);
    ctx.fillRect(b + 30, this.height - 7, rinkW - 60, 3);

    ctx.fillStyle = '#00f5ff';
    ctx.fillRect(b + 30, 5, rinkW - 60, 1);
    ctx.fillRect(b + 30, this.height - 6, rinkW - 60, 1);

    // Left Goal 3D Tesla Conductor Pillars (Top & Bottom of Left Goal)
    const drawTeslaPillar = (px, py, pw, ph) => {
      ctx.fillStyle = '#312b4f';
      ctx.fillRect(px, py, pw, ph);

      const ringSpacing = 16;
      for (let ry = py + 6; ry < py + ph - 8; ry += ringSpacing) {
        ctx.fillStyle = '#7c3aed';
        ctx.fillRect(px, ry, pw, 6);
        ctx.fillStyle = '#00f5ff';
        ctx.fillRect(px + 4, ry + 2, pw - 8, 2);
      }

      ctx.strokeStyle = '#1a162b';
      ctx.lineWidth = 2;
      ctx.strokeRect(px, py, pw, ph);
    };

    drawTeslaPillar(0, 0, b + 30, gY);
    drawTeslaPillar(0, gY + gH, b + 30, this.height - (gY + gH));

    // Left Goal Alcove Recessed Dark Shadow
    ctx.fillStyle = '#090712';
    ctx.fillRect(0, gY, b, gH);

    // Right Goal 3D Tesla Conductor Pillars (Top & Bottom of Right Goal)
    drawTeslaPillar(this.width - b - 30, 0, b + 30, gY);
    drawTeslaPillar(this.width - b - 30, gY + gH, b + 30, this.height - (gY + gH));

    // Right Goal Alcove Recessed Dark Shadow
    ctx.fillStyle = '#090712';
    ctx.fillRect(this.width - b, gY, b, gH);
  }
}

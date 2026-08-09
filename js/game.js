class HockeyHubManager {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.game = new AvatarElementGame(this.canvas);

    // Modal references
    this.avatarStartModal = document.getElementById('avatarStartModal');
    this.onlineStartModal = document.getElementById('onlineStartModal');
    this.pauseModal = document.getElementById('pauseModal');
    this.winModal = document.getElementById('winModal');

    // Online view references
    this.onlineChoiceView = document.getElementById('onlineModeChoiceView');
    this.onlineHostView = document.getElementById('onlineHostView');
    this.onlineGuestView = document.getElementById('onlineGuestView');

    this.setupHubEvents();
    this.setupOnlineEvents();
    requestAnimationFrame(this.masterLoop.bind(this));
  }

  setupHubEvents() {
    // Blur any clicked button so SPACE key doesn't trigger focused buttons
    document.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.currentTarget.blur();
      });
    });

    // Settings / Controls Modal
    const settingsModal = document.getElementById('settingsModal');
    document.querySelectorAll('.btnSettingsToggle').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.currentTarget.blur();
        settingsModal?.classList.add('active');
      });
    });

    document.getElementById('btnCloseSettings')?.addEventListener('click', (e) => {
      e.currentTarget.blur();
      settingsModal?.classList.remove('active');
    });

    // Return to Avatar Character & Map Selection Menu button
    document.querySelectorAll('.btnReturnHub').forEach((btn) => {
      btn.addEventListener('click', () => {
        settingsModal?.classList.remove('active');
        this.openMenuHub();
      });
    });

    // ESC key toggle pause for active game
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.game.isPlaying && !this.game.winner) {
          this.togglePauseActiveGame();
        }
      }
    });

    document.getElementById('btnResume')?.addEventListener('click', () => {
      this.togglePauseActiveGame();
    });

    document.getElementById('btnRestart')?.addEventListener('click', () => {
      if (this.game.isOnlineMode) {
        if (this.game.isHost) {
          this.game.startOnlineGame(true);
        }
      } else {
        this.game.startGame();
      }
    });
  }

  hideAllStartModals() {
    this.avatarStartModal?.classList.remove('active');
    this.onlineStartModal?.classList.remove('active');
    this.pauseModal?.classList.remove('active');
    this.winModal?.classList.remove('active');
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  }

  setupOnlineEvents() {
    // Open Online Modal
    document.getElementById('btnAvatarStartOnline')?.addEventListener('click', () => {
      this.avatarStartModal?.classList.remove('active');
      this.onlineStartModal?.classList.add('active');
      this.showOnlineView('choice');
    });

    // Create Room (Host)
    document.getElementById('btnOnlineCreateRoom')?.addEventListener('click', () => {
      this.showOnlineView('host');
      const pinDisplay = document.getElementById('hostPinDisplay');
      const statusBadge = document.getElementById('hostStatusBadge');
      const startBtn = document.getElementById('btnHostStartMatch');

      if (pinDisplay) pinDisplay.innerText = '....';
      if (statusBadge) {
        statusBadge.innerText = '⏳ Oda kodu oluşturuluyor...';
        statusBadge.className = 'online-status-badge';
      }
      if (startBtn) startBtn.disabled = true;

      window.onlineManager.createRoom(
        (pin) => {
          if (pinDisplay) pinDisplay.innerText = pin;
          if (statusBadge) statusBadge.innerText = '⏳ Misafir oyuncu bekleniyor...';
        },
        (err) => {
          if (statusBadge) {
            statusBadge.innerText = '❌ ' + err;
            statusBadge.className = 'online-status-badge error';
          }
        }
      );
    });

    // Host Start Match button click
    document.getElementById('btnHostStartMatch')?.addEventListener('click', () => {
      if (window.onlineManager.isHost && window.onlineManager.canSend()) {
        window.onlineManager.sendStartGame();
        this.hideAllStartModals();
        this.game.startOnlineGame(true);
        window.onlineManager.startHostBroadcasting(() => this.game.getNetworkState());
      }
    });

    // Join Room (Guest view)
    document.getElementById('btnOnlineJoinRoom')?.addEventListener('click', () => {
      this.showOnlineView('guest');
      const pinInput = document.getElementById('guestPinInput');
      if (pinInput) pinInput.value = '';
      const statusBadge = document.getElementById('guestStatusBadge');
      if (statusBadge) {
        statusBadge.innerText = '🔑 4 haneli kodu girin ve Katıl butonuna basın.';
        statusBadge.className = 'online-status-badge';
      }
      const previewBox = document.getElementById('guestConfigPreview');
      if (previewBox) previewBox.style.display = 'none';
    });

    // Guest Join Submit
    document.getElementById('btnGuestJoinSubmit')?.addEventListener('click', () => {
      const pinInput = document.getElementById('guestPinInput');
      const pin = pinInput?.value?.trim() || '';
      const statusBadge = document.getElementById('guestStatusBadge');

      if (pin.length !== 4 || isNaN(pin)) {
        if (statusBadge) {
          statusBadge.innerText = '⚠️ Lütfen 4 haneli sayısal oda kodunu girin.';
          statusBadge.className = 'online-status-badge error';
        }
        return;
      }

      if (statusBadge) {
        statusBadge.innerText = '⏳ Odaya bağlanılıyor...';
        statusBadge.className = 'online-status-badge';
      }

      window.onlineManager.joinRoom(
        pin,
        () => {
          if (statusBadge) {
            statusBadge.innerText = '✅ Odaya bağlandınız! Hostun maçı başlatması bekleniyor...';
            statusBadge.className = 'online-status-badge connected';
          }
          const previewBox = document.getElementById('guestConfigPreview');
          if (previewBox) previewBox.style.display = 'block';
        },
        (err) => {
          if (statusBadge) {
            statusBadge.innerText = '❌ ' + err;
            statusBadge.className = 'online-status-badge error';
          }
        }
      );
    });

    // Online Manager Callbacks
    window.onlineManager.onPlayerConnected = () => {
      if (window.onlineManager.isHost) {
        const statusBadge = document.getElementById('hostStatusBadge');
        const startBtn = document.getElementById('btnHostStartMatch');
        if (statusBadge) {
          statusBadge.innerText = '✅ Misafir Oyuncu Bağlandı! Maçı başlatabilirsiniz.';
          statusBadge.className = 'online-status-badge connected';
        }
        if (startBtn) startBtn.disabled = false;

        // Broadcast host's current character and map selections to guest
        window.onlineManager.sendRoomConfig({
          p1Char: this.game.p1CharKey,
          p2Char: this.game.p2CharKey,
          map: this.game.selectedMap
        });
      }
    };

    window.onlineManager.onPlayerDisconnected = () => {
      const hostStatus = document.getElementById('hostStatusBadge');
      const guestStatus = document.getElementById('guestStatusBadge');
      if (hostStatus) {
        hostStatus.innerText = '⚠️ Misafir oyuncunun bağlantısı koptu.';
        hostStatus.className = 'online-status-badge error';
      }
      if (guestStatus) {
        guestStatus.innerText = '⚠️ Host ile bağlantı koptu.';
        guestStatus.className = 'online-status-badge error';
      }
      const startBtn = document.getElementById('btnHostStartMatch');
      if (startBtn) startBtn.disabled = true;

      if (this.game.isPlaying && this.game.isOnlineMode) {
        alert('Online rakibin bağlantısı koptu.');
        this.openMenuHub();
      }
    };

    window.onlineManager.onRoomConfigReceived = (config) => {
      if (!config) return;
      this.game.p1CharKey = config.p1Char || 'katara';
      this.game.p2CharKey = config.p2Char || 'zuko';
      this.game.selectedMap = config.map || 'ice';

      const charMap = { katara: 'Katara (Su 🌊)', zuko: 'Zuko (Ateş 🔥)', aang: 'Aang (Hava 🌪️)', toph: 'Toph (Toprak 🪨)' };
      const mapMap = { ice: 'Buz ❄️', fire: 'Ateş 🌋', air: 'Hava 💨', earth: 'Toprak 🪨' };

      const elP1 = document.getElementById('prevP1Char');
      const elP2 = document.getElementById('prevP2Char');
      const elMap = document.getElementById('prevMap');

      if (elP1) elP1.innerText = charMap[config.p1Char] || config.p1Char;
      if (elP2) elP2.innerText = charMap[config.p2Char] || config.p2Char;
      if (elMap) elMap.innerText = mapMap[config.map] || config.map;
    };

    window.onlineManager.onStartGameSignal = () => {
      this.hideAllStartModals();
      this.game.startOnlineGame(false); // Guest mode
    };

    window.onlineManager.onGameStateReceived = (state) => {
      if (window.onlineManager.isGuest) {
        if (!this.game.isOnlineMode || !this.game.isPlaying) {
          this.hideAllStartModals();
          this.game.startOnlineGame(false);
        }
        this.game.applyNetworkState(state);
      }
    };
  }

  showOnlineView(viewName) {
    if (this.onlineChoiceView) this.onlineChoiceView.style.display = viewName === 'choice' ? 'block' : 'none';
    if (this.onlineHostView) this.onlineHostView.style.display = viewName === 'host' ? 'block' : 'none';
    if (this.onlineGuestView) this.onlineGuestView.style.display = viewName === 'guest' ? 'block' : 'none';
  }

  openMenuHub() {
    this.game.isPlaying = false;
    this.game.isOnlineMode = false;

    if (window.onlineManager) {
      window.onlineManager.destroy();
    }

    this.avatarStartModal?.classList.add('active');
    this.onlineStartModal?.classList.remove('active');
    this.pauseModal?.classList.remove('active');
    this.winModal?.classList.remove('active');
  }

  togglePauseActiveGame() {
    this.game.isPaused = !this.game.isPaused;
    if (this.game.isPaused) {
      this.pauseModal?.classList.add('active');
    } else {
      this.pauseModal?.classList.remove('active');
    }
  }

  masterLoop() {
    this.game.step();
    requestAnimationFrame(this.masterLoop.bind(this));
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.hub = new HockeyHubManager();
});

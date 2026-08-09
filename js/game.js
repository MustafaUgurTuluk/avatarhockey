class HockeyHubManager {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.game = new AvatarElementGame(this.canvas);

    // Modal references
    this.avatarStartModal = document.getElementById('avatarStartModal');
    this.pauseModal = document.getElementById('pauseModal');
    this.winModal = document.getElementById('winModal');

    this.setupHubEvents();
    requestAnimationFrame(this.masterLoop.bind(this));
  }

  setupHubEvents() {
    // Blur any clicked button so SPACE key doesn't trigger focused buttons
    document.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.currentTarget.blur();
      });
    });

    // Return to Avatar Character & Map Selection Menu button
    document.querySelectorAll('.btnReturnHub').forEach((btn) => {
      btn.addEventListener('click', () => {
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
      this.game.startGame();
    });
  }

  openMenuHub() {
    this.game.isPlaying = false;

    // Show Avatar Start Modal, Hide pause and win modals
    this.avatarStartModal?.classList.add('active');
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

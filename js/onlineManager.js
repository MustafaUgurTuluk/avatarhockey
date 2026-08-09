/**
 * Avatar Element Hockey - WebRTC Online Manager (PeerJS)
 * 
 * Handles 4-digit room creation (Host) and room joining (Guest).
 * Synchronizes host character/map selection, player inputs, and 60 FPS state snapshots.
 * Uses native JSON stringification over WebRTC DataChannel to bypass PeerJS binarypack bottleneck.
 * Features high-precision background timer broadcasting to prevent tab focus throttling.
 */
class OnlineManager {
  constructor() {
    this.peer = null;
    this.conn = null;
    this.isHost = false;
    this.isGuest = false;
    this.roomPin = null;
    this.isConnected = false;

    // Frame counters for live HUD diagnostics
    this.sentFrameCount = 0;
    this.receivedFrameCount = 0;

    this.hostBroadcastInterval = null;

    // Latest inputs received from Guest (when Host)
    this.guestInput = {
      up: false,
      down: false,
      left: false,
      right: false,
      serve: false,
      ability1: false,
      ability2: false
    };

    // Event Callbacks
    this.onRoomConfigReceived = null;
    this.onGameStateReceived = null;
    this.onPlayerConnected = null;
    this.onPlayerDisconnected = null;
    this.onStartGameSignal = null;
    this.onError = null;
  }

  generatePin() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  getPeerId(pin) {
    return `avatar-hockey-room-${pin}`;
  }

  /**
   * Host creates a new online room with a 4-digit code.
   */
  createRoom(onSuccess, onError) {
    this.destroy();
    this.isHost = true;
    this.isGuest = false;
    this.roomPin = this.generatePin();

    const peerId = this.getPeerId(this.roomPin);

    try {
      this.peer = new Peer(peerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        }
      });
    } catch (e) {
      if (onError) onError('PeerJS kütüphanesi yüklenemedi.');
      return;
    }

    this.peer.on('open', (id) => {
      if (onSuccess) onSuccess(this.roomPin);
    });

    this.peer.on('connection', (connection) => {
      this.conn = connection;
      this.setupConnectionListeners();
    });

    this.peer.on('error', (err) => {
      console.error('Host Peer Error:', err);
      if (onError) onError('Oda oluşturulurken bir hata oluştu: ' + (err.type || err.message));
      if (this.onError) this.onError(err);
    });
  }

  /**
   * Guest joins an existing room with a 4-digit code.
   */
  joinRoom(pin, onSuccess, onError) {
    this.destroy();
    this.isHost = false;
    this.isGuest = true;
    this.roomPin = pin.trim();

    const hostPeerId = this.getPeerId(this.roomPin);

    try {
      this.peer = new Peer({
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        }
      });
    } catch (e) {
      if (onError) onError('PeerJS kütüphanesi yüklenemedi.');
      return;
    }

    this.peer.on('open', () => {
      this.conn = this.peer.connect(hostPeerId, { reliable: true, serialization: 'json' });
      this.setupConnectionListeners(onSuccess, onError);
    });

    this.peer.on('error', (err) => {
      console.error('Guest Peer Error:', err);
      if (onError) onError('Odaya bağlanılamadı. Kodun doğru olduğundan emin olun.');
      if (this.onError) this.onError(err);
    });
  }

  setupConnectionListeners(onConnectSuccess, onConnectError) {
    if (!this.conn) return;

    const handleOpen = () => {
      this.isConnected = true;
      if (onConnectSuccess) onConnectSuccess();
      if (this.onPlayerConnected) this.onPlayerConnected();
    };

    if (this.conn.open) {
      handleOpen();
    } else {
      this.conn.on('open', handleOpen);
    }

    this.conn.on('data', (rawData) => {
      this.handleIncomingMessage(rawData);
    });

    this.conn.on('close', () => {
      this.isConnected = false;
      this.stopHostBroadcasting();
      if (this.onPlayerDisconnected) this.onPlayerDisconnected();
    });

    this.conn.on('error', (err) => {
      console.error('DataChannel Error:', err);
      if (onConnectError) onConnectError('Bağlantı hatası oluştu.');
      if (this.onError) this.onError(err);
    });
  }

  handleIncomingMessage(rawData) {
    if (!rawData) return;

    let data = rawData;
    if (typeof rawData === 'string') {
      try {
        data = JSON.parse(rawData);
      } catch (e) {
        return;
      }
    }

    if (!data || !data.type) return;

    switch (data.type) {
      case 'ROOM_CONFIG':
        if (this.onRoomConfigReceived) {
          this.onRoomConfigReceived(data.config);
        }
        break;

      case 'GUEST_INPUT':
        if (this.isHost && data.input) {
          this.guestInput = data.input;
        }
        break;

      case 'START_GAME':
        if (this.onStartGameSignal) {
          this.onStartGameSignal();
        }
        break;

      case 'GAME_STATE':
        if (this.isGuest) {
          this.receivedFrameCount++;
          if (this.onGameStateReceived) {
            this.onGameStateReceived(data.state);
          }
        }
        break;
    }
  }

  canSend() {
    return !!(this.conn && (this.isConnected || this.conn.open));
  }

  sendPayload(payload) {
    if (!this.canSend()) return;
    try {
      const channel = this.conn._channel || (this.conn.dataChannel ? this.conn.dataChannel : null);
      if (channel && channel.bufferedAmount > 65536) {
        return; // Skip packet if DataChannel buffer is congested (>64KB)
      }
      const str = JSON.stringify(payload);
      this.conn.send(str);
    } catch (e) {
      console.error('Failed to send WebRTC payload:', e);
    }
  }

  sendRoomConfig(config) {
    if (this.isHost) {
      this.sendPayload({
        type: 'ROOM_CONFIG',
        config: config
      });
    }
  }

  sendStartGame() {
    if (this.isHost) {
      this.sendPayload({ type: 'START_GAME' });
      setTimeout(() => {
        this.sendPayload({ type: 'START_GAME' });
      }, 100);
    }
  }

  sendGuestInput(input) {
    if (this.isGuest) {
      this.sendPayload({
        type: 'GUEST_INPUT',
        input: input
      });
    }
  }

  sendGameState(state) {
    if (this.isHost && this.canSend()) {
      this.sentFrameCount++;
      this.sendPayload({
        type: 'GAME_STATE',
        state: state
      });
    }
  }

  startHostBroadcasting(getStateFn) {
    this.stopHostBroadcasting();
    this.sentFrameCount = 0;
    this.hostBroadcastInterval = setInterval(() => {
      if (this.isHost && this.canSend() && getStateFn) {
        this.sendGameState(getStateFn());
      }
    }, 16); // ~60 FPS continuous streaming
  }

  stopHostBroadcasting() {
    if (this.hostBroadcastInterval) {
      clearInterval(this.hostBroadcastInterval);
      this.hostBroadcastInterval = null;
    }
  }

  destroy() {
    this.stopHostBroadcasting();
    if (this.conn) {
      try { this.conn.close(); } catch (e) {}
      this.conn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
    this.isHost = false;
    this.isGuest = false;
    this.roomPin = null;
    this.isConnected = false;
    this.sentFrameCount = 0;
    this.receivedFrameCount = 0;
    this.guestInput = {
      up: false, down: false, left: false, right: false, serve: false, ability1: false, ability2: false
    };
  }
}

// Global instance
window.onlineManager = new OnlineManager();

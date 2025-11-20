import { Room, Client } from 'colyseus';
import { GameState, PlayerState } from '../schema/GameState';

const PLAYER_CONFIGS = [
  { id: 'player1', keyLeft: 65, keyRight: 68, keySuperpower: 83 }, // A, D, S (middle)
  { id: 'player2', keyLeft: 74, keyRight: 76, keySuperpower: 75 }, // J, L, K (middle)
  { id: 'player3', keyLeft: 37, keyRight: 39, keySuperpower: 38 }, // Left, Right, Up (middle)
  { id: 'player4', keyLeft: 89, keyRight: 67, keySuperpower: 88 }, // Y, C, X (middle)
  { id: 'player5', keyLeft: 78, keyRight: 188, keySuperpower: 77 }, // N, Comma, M (middle)
  { id: 'player6', keyLeft: 103, keyRight: 105, keySuperpower: 104 } // Numpad 7, 9, 8 (middle)
];

const PLAYER_COLORS = [
  '#1abc9c', '#3498db', '#9b59b6', '#e74c3c', '#f39c12', '#2ecc71'
];

export class KurveRoom extends Room<GameState> {
  maxClients = 6;
  private gameLoopInterval?: NodeJS.Timeout;
  private fps = 60;
  private intervalTimeout = Math.round(1000 / this.fps);

  onCreate(options: any) {
    this.setState(new GameState());

    // Enable reconnection with 30 second timeout
    this.setSeatReservationTime(30);

    console.log('KurveRoom created!', options);

    // Handle player input
    this.onMessage('keyDown', (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player && this.state.isRunning) {
        this.broadcast('playerKeyDown', {
          playerId: client.sessionId,
          keyCode: message.keyCode
        }, { except: client });
      }
    });

    this.onMessage('keyUp', (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player && this.state.isRunning) {
        this.broadcast('playerKeyUp', {
          playerId: client.sessionId,
          keyCode: message.keyCode
        }, { except: client });
      }
    });

    // Handle player position updates
    this.onMessage('updatePosition', (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.positionX = message.positionX;
        player.positionY = message.positionY;
        player.nextPositionX = message.nextPositionX;
        player.nextPositionY = message.nextPositionY;
        player.angle = message.angle;
        player.isInvisible = message.isInvisible;
      }
    });

    // Handle player death
    this.onMessage('playerDied', (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.isAlive = false;
        this.checkRoundEnd();
      }
    });

    // Handle game state changes
    this.onMessage('startRound', (client) => {
      // Check if there are at least 2 players
      if (this.state.players.size < 2) {
        client.send('startError', { message: 'Need at least 2 players to start' });
        return;
      }

      if (!this.state.isRoundStarted) {
        this.state.isRoundStarted = true;
        this.state.currentFrameId = 0;

        // Reset all players and set random starting positions
        this.state.players.forEach((player) => {
          player.isAlive = true;

          // Generate random starting position (field size is approximately 900x700)
          const fieldWidth = 900;
          const fieldHeight = 700;
          const minDistanceFromBorder = 50;

          player.positionX = minDistanceFromBorder + Math.random() * (fieldWidth - 2 * minDistanceFromBorder);
          player.positionY = minDistanceFromBorder + Math.random() * (fieldHeight - 2 * minDistanceFromBorder);
          player.nextPositionX = player.positionX;
          player.nextPositionY = player.positionY;
          player.angle = 2 * Math.PI * Math.random();
          player.isInvisible = false;
        });

        // Send countdown 3, 2, 1
        this.broadcast('countdown', { count: 3 });
        setTimeout(() => {
          this.broadcast('countdown', { count: 2 });
        }, 1000);
        setTimeout(() => {
          this.broadcast('countdown', { count: 1 });
        }, 2000);

        // Start game after countdown
        setTimeout(() => {
          this.broadcast('roundStarted', {});
          this.state.isRunning = true;
          this.startGameLoop();
        }, 3000);
      }
    });

    this.onMessage('pauseGame', (client) => {
      this.state.isPaused = !this.state.isPaused;
      if (this.state.isPaused) {
        this.stopGameLoop();
      } else {
        this.startGameLoop();
      }
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, 'joined!');

    const playerIndex = this.state.players.size;
    if (playerIndex >= PLAYER_CONFIGS.length) {
      client.leave(1000, 'Room is full');
      return;
    }

    const config = PLAYER_CONFIGS[playerIndex];
    const player = new PlayerState();
    player.id = config.id;
    player.nickname = options.nickname || config.id;
    player.color = PLAYER_COLORS[playerIndex];
    player.keyLeft = config.keyLeft;
    player.keyRight = config.keyRight;
    player.keySuperpower = config.keySuperpower;
    player.isAlive = true;
    player.points = 0;

    console.log('Assigning player:', {
      sessionId: client.sessionId,
      playerIndex: playerIndex,
      playerId: player.id,
      nickname: player.nickname,
      color: player.color
    });

    this.state.players.set(client.sessionId, player);

    // Calculate max points based on number of players
    this.state.maxPoints = (this.state.players.size - 1) * 10;
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, 'left!');

    const player = this.state.players.get(client.sessionId);
    if (player) {
      this.state.players.delete(client.sessionId);

      // Recalculate max points
      this.state.maxPoints = Math.max(1, this.state.players.size - 1) * 10;

      // Check if round should end
      this.checkRoundEnd();
    }
  }

  onDispose() {
    console.log('room', this.roomId, 'disposing...');
    this.stopGameLoop();
  }

  private startGameLoop() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }

    this.gameLoopInterval = setInterval(() => {
      if (this.state.isRunning && !this.state.isPaused) {
        this.state.currentFrameId++;
      }
    }, this.intervalTimeout);
  }

  private stopGameLoop() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = undefined;
    }
    this.state.isRunning = false;
  }

  private checkRoundEnd() {
    const alivePlayers = Array.from(this.state.players.values()).filter(p => p.isAlive);

    if (alivePlayers.length <= 1 && this.state.isRunning) {
      this.stopGameLoop();
      this.state.isRoundStarted = false;

      // Award points to survivors
      alivePlayers.forEach(player => {
        player.points++;
      });

      // Determine round winner (survivor)
      const roundWinner = alivePlayers.length > 0 ? alivePlayers[0] : null;

      // Check for game winner
      const gameWinner = Array.from(this.state.players.values()).find(
        p => p.points >= this.state.maxPoints
      );

      if (gameWinner) {
        this.state.isGameOver = true;
        this.state.winnerId = gameWinner.id;
        this.broadcast('gameOver', { winnerId: gameWinner.id });
      } else {
        // Send round winner in roundEnded message
        this.broadcast('roundEnded', {
          roundWinnerId: roundWinner ? roundWinner.id : null
        });
      }
    }
  }
}

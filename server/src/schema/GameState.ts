import { Schema, type, MapSchema } from '@colyseus/schema';

export class PlayerState extends Schema {
  @type('string') id: string = '';
  @type('string') nickname: string = '';
  @type('string') color: string = '';
  @type('number') positionX: number = 0;
  @type('number') positionY: number = 0;
  @type('number') nextPositionX: number = 0;
  @type('number') nextPositionY: number = 0;
  @type('number') angle: number = 0;
  @type('number') points: number = 0;
  @type('boolean') isAlive: boolean = true;
  @type('boolean') isInvisible: boolean = false;
  @type('number') keyLeft: number = 0;
  @type('number') keyRight: number = 0;
  @type('number') keySuperpower: number = 0;
  @type('string') superpowerType: string = 'NO_SUPERPOWER';
  @type('number') superpowerCount: number = 0;
}

export class GameState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type('boolean') isRunning: boolean = false;
  @type('boolean') isRoundStarted: boolean = false;
  @type('boolean') isPaused: boolean = false;
  @type('boolean') isGameOver: boolean = false;
  @type('boolean') deathMatch: boolean = false;
  @type('number') currentFrameId: number = 0;
  @type('string') winnerId: string = '';
  @type('number') maxPoints: number = 0;
}

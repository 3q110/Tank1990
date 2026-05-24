export const enum Tile {
  EMPTY = 0,
  BRICK = 1,
  STEEL = 2,
  FOREST = 3,
  WATER = 4,
  BASE = 5,
  BASE_WALL = 6,
  SNOW = 7,
  DESERT = 8
}

export const enum Dir {
  UP = 0,
  RIGHT = 1,
  DOWN = 2,
  LEFT = 3
}

export const enum State {
  MENU = 0,
  PLAYING = 1,
  LEVEL_COMPLETE = 2,
  GAME_OVER = 3,
  PAUSED = 4
}

export const enum EnemyType {
  NORMAL = 0,
  FAST = 1,
  ARMOR = 2
}

export const enum PowerupType {
  LIGHTNING = 'lightning',
  SUPER_BULLET = 'superBullet',
  STAR = 'star',
  BOMB = 'bomb',
  TIMER = 'timer',
  HORN = 'horn'
}

export interface GameTheme {
  name: string;
  bg: string;
  wallColor: string;
  forestColor: string;
  waterColor: string;
  floorColor: string;
  brickAlt: string;
}

export interface LevelDef {
  map: number[][];
  theme: number;
  totalEnemies: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface SpawnAnim {
  x: number;
  y: number;
  timer: number;
}

export interface Powerup {
  x: number;
  y: number;
  type: PowerupType;
  blinking: boolean;
  blinkTimer: number;
}

export interface TankData {
  x: number;
  y: number;
  size: number;
  dir: Dir;
  speed: number;
  alive: boolean;
  isPlayer: boolean;
  playerIndex: number;
  fireCooldown: number;
  invincible: number;
  spawning: boolean;
  spawnTimer: number;
  superBullet: boolean;
  shieldTimer: number;
  hp: number;
  enemyType?: EnemyType;
  moveTimer?: number;
  shootTimer?: number;
}

export interface BulletData {
  x: number;
  y: number;
  dir: Dir;
  owner: TankData;
  speed: number;
  size: number;
  superBullet: boolean;
  alive: boolean;
}

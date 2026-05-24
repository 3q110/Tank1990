import { CELL, W, H, DX, DY } from './constants';

export class Tank {
  x: number;
  y: number;
  size = 26;
  dir: number;
  speed: number;
  alive: boolean;
  isPlayer: boolean;
  playerIndex: number;
  fireCooldown = 0;
  invincible = 0;
  spawning = false;
  spawnTimer = 0;
  superBullet = false;
  shieldTimer = 0;
  hp = 1;
  enemyType = 0;
  moveTimer = 60;
  shootTimer = 60;

  constructor(x: number, y: number, dir: number, isPlayer: boolean, playerIndex = 0) {
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.isPlayer = isPlayer;
    this.playerIndex = playerIndex;
    this.speed = isPlayer ? 2 : 1;
    this.alive = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.spawning || (!this.alive && this.spawning)) return;
    const s = this.size;
    const cx = this.x + s / 2;
    const cy = this.y + s / 2;

    if (this.invincible > 0 && Math.floor(this.invincible / 3) % 2 === 0) {
      ctx.globalAlpha = 0.6;
    }

    let bodyColor = '#5B8C5A';
    let trackColor = '#3D6B3C';
    let turretColor = '#7AB87A';

    if (!this.isPlayer) {
      bodyColor = '#8B4513';
      trackColor = '#5C2E0A';
      turretColor = '#A0522D';
    }

    if (this.shieldTimer > 0) {
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, s / 2 + 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = trackColor;
    const tw = 4;
    if (this.dir === 0 || this.dir === 2) {
      ctx.fillRect(this.x, this.y, tw, s);
      ctx.fillRect(this.x + s - tw, this.y, tw, s);
    } else {
      ctx.fillRect(this.x, this.y, s, tw);
      ctx.fillRect(this.x, this.y + s - tw, s, tw);
    }

    ctx.fillStyle = bodyColor;
    ctx.fillRect(this.x + 3, this.y + 3, s - 6, s - 6);

    ctx.fillStyle = turretColor;
    const tx = cx - 3;
    const ty = cy - 3;
    ctx.fillRect(tx, ty, 6, 6);

    ctx.fillStyle = '#333';
    const bLen = 10;
    const bWid = 3;
    ctx.fillRect(cx - bWid / 2, cy - bWid / 2, bWid, bWid);
    switch (this.dir) {
      case 0: ctx.fillRect(cx - bWid / 2, cy - s / 2 - 2, bWid, bLen); break;
      case 1: ctx.fillRect(cx + s / 2 - bLen + 2, cy - bWid / 2, bLen, bWid); break;
      case 2: ctx.fillRect(cx - bWid / 2, cy + s / 2 - bLen + 2, bWid, bLen); break;
      case 3: ctx.fillRect(cx - s / 2 + 2, cy - bWid / 2, bLen, bWid); break;
    }

    ctx.globalAlpha = 1;
  }

  canMove(nx: number, ny: number, map: number[][]): boolean {
    if (nx < 0 || ny < 0 || nx + this.size > W || ny + this.size > H) return false;
    const s = this.size - 1;
    const r1 = Math.floor(ny / CELL);
    const r2 = Math.floor((ny + s) / CELL);
    const c1 = Math.floor(nx / CELL);
    const c2 = Math.floor((nx + s) / CELL);
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        if (r >= 0 && r < map.length && c >= 0 && c < map[0].length) {
          const tile = map[r][c];
          if (tile === 1 || tile === 2 || tile === 4 || tile === 5 || tile === 6) return false;
          if (tile >= 7) return false;
        }
      }
    }
    return true;
  }

  checkCollision(other: Tank): boolean {
    return this.x < other.x + other.size &&
      this.x + this.size > other.x &&
      this.y < other.y + other.size &&
      this.y + this.size > other.y;
  }
}

export class Bullet {
  x: number;
  y: number;
  dir: number;
  owner: Tank;
  speed: number;
  size = 6;
  superBullet = false;
  alive = true;

  constructor(x: number, y: number, dir: number, owner: Tank, speed = 4) {
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.owner = owner;
    this.speed = speed;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.alive) return;
    if (this.superBullet) {
      ctx.fillStyle = '#FF4500';
      ctx.fillRect(this.x - 1, this.y - 1, this.size + 2, this.size + 2);
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(this.x, this.y, this.size, this.size);
    } else {
      ctx.fillStyle = '#fff';
      ctx.fillRect(this.x - 1, this.y - 1, this.size + 2, this.size + 2);
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(this.x, this.y, this.size, this.size);
    }
  }

  update(map: number[][]): { hitBrick?: boolean; hitSteel?: boolean; hitBase?: boolean; bx?: number; by?: number } {
    if (!this.alive) return {};
    this.x += DX[this.dir] * this.speed;
    this.y += DY[this.dir] * this.speed;

    if (this.x < 0 || this.y < 0 || this.x > W - this.size || this.y > H - this.size) {
      this.alive = false;
      return {};
    }

    const cx = Math.floor((this.x + this.size / 2) / CELL);
    const cy = Math.floor((this.y + this.size / 2) / CELL);
    if (cy >= 0 && cy < map.length && cx >= 0 && cx < map[0].length) {
      const tile = map[cy][cx];
      if (tile === 1 || tile === 6) {
        if (!this.superBullet) this.alive = false;
        map[cy][cx] = 0;
        return { hitBrick: true, bx: cx, by: cy };
      } else if (tile === 2) {
        this.alive = false;
        return { hitSteel: true, bx: cx, by: cy };
      } else if (tile === 5) {
        this.alive = false;
        return { hitBase: true, bx: cx, by: cy };
      }
    }
    return {};
  }

  hitsTank(tank: Tank): boolean {
    if (!this.alive || !tank.alive || tank.spawning) return false;
    if (this.owner === tank) return false;
    return this.x < tank.x + tank.size &&
      this.x + this.size > tank.x &&
      this.y < tank.y + tank.size &&
      this.y + this.size > tank.y;
  }
}

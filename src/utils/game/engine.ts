import { COLS, ROWS, CELL, W, H, DX, DY, ENEMY_SPEEDS, ENEMY_HP, ENEMY_COLORS } from './constants';
import { LEVELS, getLevelTheme } from './levels';
import { Tank, Bullet } from './entities';
import { sound } from './sound';

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; color: string; size: number;
}

interface SpawnAnim {
  x: number; y: number; timer: number;
}

interface PowerupItem {
  x: number; y: number;
  type: string;
  blinking: boolean;
  blinkTimer: number;
}

export class GameEngine {
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  state = 0; // 0=menu,1=playing,2=levelComplete,3=gameOver,4=paused
  level = 0;
  score = 0;
  lives = 3;
  doubleMode = false;
  map: number[][] = [];
  theme: any = null;
  player1: Tank | null = null;
  player2: Tank | null = null;
  enemies: Tank[] = [];
  bullets: Bullet[] = [];
  particles: Particle[] = [];
  powerups: PowerupItem[] = [];
  keys: Record<string, boolean> = {};
  frameCount = 0;
  enemySpawnTimer = 30;
  maxEnemies = 4;
  totalEnemies = 0;
  enemiesSpawned = 0;
  enemySpawnPoints = [{x:0,y:0},{x:12,y:0},{x:24,y:0}];
  powerupTimer = 200;
  powerupInterval = 400;
  spawnAnimations: SpawnAnim[] = [];
  freezeTimer = 0;
  hornTimer = 0;
  timerItemActive = false;
  lastTime = 0;
  animFrameId: number | null = null;
  onStateChange?: (state: number, data?: any) => void;

  start(level: number, doubleMode: boolean) {
    this.doubleMode = doubleMode;
    this.score = 0;
    this.lives = 3;
    this.resetLevel(level);
    sound.init();
  }

  resetLevel(level: number) {
    this.level = level;
    const src = LEVELS[Math.min(level, LEVELS.length - 1)];
    this.theme = getLevelTheme(level);
    this.map = [];
    for (let r = 0; r < ROWS; r++) {
      this.map[r] = [];
      for (let c = 0; c < COLS; c++) this.map[r][c] = src.map[r][c];
    }
    this.bullets = [];
    this.particles = [];
    this.powerups = [];
    this.enemies = [];
    this.enemiesSpawned = 0;
    this.totalEnemies = src.totalEnemies || 20;
    this.enemySpawnTimer = 30;
    this.powerupTimer = 200;
    this.spawnAnimations = [];
    this.freezeTimer = 0;
    this.hornTimer = 0;
    this.timerItemActive = false;

    this.player1 = new Tank(8 * CELL + 1, 24 * CELL + 1, 0, true, 0);
    this.player1.speed = 2;
    if (this.doubleMode) {
      this.player2 = new Tank(17 * CELL + 1, 24 * CELL + 1, 0, true, 1);
      this.player2.speed = 2;
    }
    this.lives = 3;
    this.state = 1;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  gameLoop(time: number) {
    this.lastTime = time;
    this.frameCount++;
    if (this.state === 1) this.update();
    this.render();
    if (this.state === 4) this.drawPauseOverlay();
    this.animFrameId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  stop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  update() {
    if (this.freezeTimer > 0) {
      this.freezeTimer--;
      if (this.freezeTimer <= 0) this.timerItemActive = false;
    }
    if (this.hornTimer > 0) this.hornTimer--;

    if (this.player1 && this.player1.alive) {
      this.updatePlayer(this.player1, this.keys, { up:'w', down:'s', left:'a', right:'d', fire:'j' });
    } else if (this.player1 && !this.player1.alive && !this.player1.spawning && this.lives > 0) {
      this.lives--;
      this.respawnPlayer(this.player1, 8);
    }

    if (this.doubleMode && this.player2) {
      if (this.player2.alive) {
        this.updatePlayer(this.player2, this.keys, { up:'ArrowUp', down:'ArrowDown', left:'ArrowLeft', right:'ArrowRight', fire:'0' });
      } else if (!this.player2.alive && !this.player2.spawning && this.lives > 0) {
        this.lives--;
        this.respawnPlayer(this.player2, 17);
      }
    }

    if (this.freezeTimer <= 0) {
      this.updateEnemies();
      this.trySpawnEnemy();
    }
    this.updateBullets();
    this.updateParticles();
    this.updatePowerups();
    this.checkGameOver();
  }

  updatePlayer(player: Tank, keys: Record<string, boolean>, controls: { up:string; down:string; left:string; right:string; fire:string }) {
    if (player.spawning) {
      player.spawnTimer--;
      if (player.spawnTimer <= 0) {
        player.spawning = false;
        player.alive = true;
        player.invincible = 90;
      }
      return;
    }
    if (!player.alive) return;

    let dx = 0, dy = 0, newDir = player.dir;
    if (keys[controls.up]) { dy = -1; newDir = 0; }
    else if (keys[controls.down]) { dy = 1; newDir = 2; }
    else if (keys[controls.left]) { dx = -1; newDir = 3; }
    else if (keys[controls.right]) { dx = 1; newDir = 1; }

    if (dx !== 0 || dy !== 0) {
      player.dir = newDir;
      const nx = player.x + dx * player.speed;
      const ny = player.y + dy * player.speed;
      if (player.canMove(nx, ny, this.map) && !this.tankCollides(nx, ny, player)) {
        player.x = nx; player.y = ny;
      } else {
        if (dx !== 0 && player.canMove(nx, player.y, this.map) && !this.tankCollides(nx, player.y, player)) player.x = nx;
        if (dy !== 0 && player.canMove(player.x, ny, this.map) && !this.tankCollides(player.x, ny, player)) player.y = ny;
      }
    }

    player.x = Math.max(0, Math.min(W - player.size, player.x));
    player.y = Math.max(0, Math.min(H - player.size, player.y));

    if (keys[controls.fire] && player.fireCooldown <= 0) {
      this.fireBullet(player);
      player.fireCooldown = player.superBullet ? 8 : 20;
    }
    if (player.fireCooldown > 0) player.fireCooldown--;
    if (player.invincible > 0) player.invincible--;
    if (player.shieldTimer > 0) player.shieldTimer--;
  }

  private tankCollides(x: number, y: number, self: Tank): boolean {
    const allTanks = [this.player1, this.player2, ...this.enemies].filter(t => t && t.alive && !t.spawning && t !== self);
    for (const t of allTanks) {
      if (x < t.x + t.size && x + self.size > t.x && y < t.y + t.size && y + self.size > t.y) return true;
    }
    return false;
  }

  respawnPlayer(player: Tank, col: number) {
    player.x = col * CELL + 1;
    player.y = 24 * CELL + 1;
    player.dir = 0;
    player.spawning = true;
    player.spawnTimer = 60;
    player.alive = false;
    player.invincible = 120;
    player.superBullet = false;
    player.shieldTimer = 0;
    this.spawnAnimations.push({ x: player.x, y: player.y, timer: 60 });
  }

  fireBullet(tank: Tank) {
    const size = 6;
    let bx = tank.x + tank.size / 2 - size / 2;
    let by = tank.y + tank.size / 2 - size / 2;
    switch (tank.dir) {
      case 0: by = tank.y - size - 1; break;
      case 2: by = tank.y + tank.size + 1; break;
      case 3: bx = tank.x - size - 1; break;
      case 1: bx = tank.x + tank.size + 1; break;
    }
    const bSpeed = tank.superBullet ? 6 : 4;
    const b = new Bullet(bx, by, tank.dir, tank, bSpeed);
    b.superBullet = !!tank.superBullet;
    this.bullets.push(b);
    sound.play(tank.superBullet ? 'superShoot' as any : 'shoot' as any);
  }

  updateEnemies() {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.alive) { this.enemies.splice(i, 1); continue; }

      if (e.spawning) {
        e.spawnTimer--;
        if (e.spawnTimer <= 0) { e.spawning = false; e.alive = true; }
        continue;
      }

      if (e.invincible > 0) e.invincible--;

      e.moveTimer--;
      if (e.moveTimer <= 0) {
        e.moveTimer = 60 + Math.floor(Math.random() * 120);
        let target = this.player1;
        if (this.doubleMode && this.player2 && this.player2.alive && Math.random() < 0.5) target = this.player2;
        if (Math.random() < 0.35 && target && target.alive) {
          const dx = target.x - e.x, dy = target.y - e.y;
          if (Math.abs(dx) > Math.abs(dy)) e.dir = dx > 0 ? 1 : 3;
          else e.dir = dy > 0 ? 2 : 0;
        } else {
          e.dir = Math.floor(Math.random() * 4);
        }
      }

      const nx = e.x + DX[e.dir] * e.speed;
      const ny = e.y + DY[e.dir] * e.speed;
      if (e.canMove(nx, ny, this.map) && !this.tankCollides(nx, ny, e)) { e.x = nx; e.y = ny; }
      else { e.moveTimer = 0; }

      e.x = Math.max(0, Math.min(W - e.size, e.x));
      e.y = Math.max(0, Math.min(H - e.size, e.y));

      e.shootTimer--;
      if (e.shootTimer <= 0) {
        if (Math.random() < 0.5) this.fireBullet(e);
        e.shootTimer = 60 + Math.floor(Math.random() * 120);
      }
    }
  }

  trySpawnEnemy() {
    if (this.enemiesSpawned >= this.totalEnemies) return;
    if (this.enemies.filter(e => e.alive || e.spawning).length >= this.maxEnemies) return;
    this.enemySpawnTimer--;
    if (this.enemySpawnTimer <= 0) {
      this.enemySpawnTimer = 120 + Math.floor(Math.random() * 60);
      const spawnIdx = Math.floor(Math.random() * 3);
      const pt = this.enemySpawnPoints[spawnIdx];
      const ex = pt.x * CELL + 1;
      const ey = pt.y * CELL + 1;

      const blocking = this.enemies.some(e => e.alive && !e.spawning &&
        Math.abs(e.x - ex) < CELL && Math.abs(e.y - ey) < CELL);
      if (blocking) return;

      const src = LEVELS[Math.min(this.level, LEVELS.length - 1)];
      const typeList = src.enemyTypes || [];
      const type = typeList[this.enemiesSpawned] || 0;

      const enemy = new Tank(ex, ey, 2, false);
      enemy.enemyType = type;
      enemy.speed = ENEMY_SPEEDS[type] || 1;
      enemy.hp = ENEMY_HP[type] || 1;
      enemy.spawning = true;
      enemy.spawnTimer = 60;
      enemy.alive = false;
      enemy.shootTimer = 60 + Math.floor(Math.random() * 120);
      enemy.moveTimer = 30 + Math.floor(Math.random() * 60);
      this.enemies.push(enemy);
      this.enemiesSpawned++;
      this.spawnAnimations.push({ x: ex, y: ey, timer: 60 });
    }
  }

  updateBullets() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      if (!b.alive) { this.bullets.splice(i, 1); continue; }

      const result = b.update(this.map);
      if (result.hitBrick || result.hitSteel) {
        this.spawnBrickParticles(result.bx!, result.by!);
        if (result.hitSteel) sound.play('hit' as any);
      }
      if (result.hitBase) {
        this.state = 3;
        this.onStateChange?.(3, { score: this.score, level: this.level });
        sound.play('gameOver' as any);
        return;
      }

      if (!b.alive) { this.bullets.splice(i, 1); continue; }

      const allTanks = [this.player1, this.player2, ...this.enemies].filter(t => t && t !== b.owner);
      for (const tank of allTanks) {
        if (b.hitsTank(tank)) {
          b.alive = false;
          this.hitTank(tank, b);
          this.bullets.splice(i, 1);
          break;
        }
      }
    }
  }

  private hitTank(tank: Tank, bullet: Bullet) {
    if (tank.invincible > 0 || tank.spawning) return;
    if (tank.shieldTimer > 0 && tank.isPlayer) {
      tank.shieldTimer = 0;
      sound.play('hit' as any);
      return;
    }
    tank.hp--;
    if (tank.hp <= 0) {
      tank.alive = false;
      this.spawnExplosion(tank.x + tank.size / 2, tank.y + tank.size / 2);
      sound.play('explosion' as any);
      if (tank.isPlayer) {
        if (!this.player1?.alive && !this.player2?.alive && this.lives <= 0) {
          this.state = 3;
          this.onStateChange?.(3, { score: this.score, level: this.level });
          sound.play('gameOver' as any);
        }
      } else {
        this.score += 100;
        if (Math.random() < 0.15) this.spawnPowerup(tank.x, tank.y);
        if (this.enemies.filter(e => e.alive || e.spawning).length === 0 && this.enemiesSpawned >= this.totalEnemies) {
          this.state = 2;
          this.onStateChange?.(2, { score: this.score, level: this.level });
          sound.play('levelComplete' as any);
        }
      }
    } else {
      sound.play('hit' as any);
    }
  }

  private spawnBrickParticles(cx: number, cy: number) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: cx * CELL + 4, y: cy * CELL + 4,
        vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
        life: 20 + Math.random() * 10, maxLife: 30,
        color: '#8B4513', size: 4 + Math.random() * 3
      });
    }
  }

  spawnExplosion(x: number, y: number) {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * (2 + Math.random() * 2),
        vy: Math.sin(angle) * (2 + Math.random() * 2),
        life: 20 + Math.random() * 15, maxLife: 35,
        color: ['#ff6b35', '#ffd700', '#ff4444', '#ff8c00'][Math.floor(Math.random() * 4)],
        size: 4 + Math.random() * 4
      });
    }
  }

  private spawnPowerup(x: number, y: number) {
    const types = ['lightning', 'superBullet', 'star', 'bomb', 'timer', 'horn'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.powerups.push({
      x: Math.floor(x / CELL) * CELL + 2,
      y: Math.floor(y / CELL) * CELL + 2,
      type, blinking: false, blinkTimer: 0
    });
  }

  updatePowerups() {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      if (p.blinking) {
        p.blinkTimer--;
        if (p.blinkTimer <= 0) { this.powerups.splice(i, 1); continue; }
      }
      const players = [this.player1, this.player2].filter(p => p && p.alive);
      for (const player of players) {
        if (!player) continue;
        if (player.x < p.x + 26 && player.x + player.size > p.x &&
          player.y < p.y + 26 && player.y + player.size > p.y) {
          this.applyPowerup(player, p.type);
          this.powerups.splice(i, 1);
          sound.play('powerup' as any);
          break;
        }
      }
      if (this.powerups[i] && !this.powerups[i].blinking) {
        p.blinkTimer++;
        if (p.blinkTimer > 600) {
          p.blinking = true;
          p.blinkTimer = 60;
        }
      }
    }
  }

  private applyPowerup(player: Tank, type: string) {
    switch (type) {
      case 'lightning':
        player.shieldTimer = 600;
        break;
      case 'superBullet':
        player.superBullet = true;
        break;
      case 'star':
        player.speed = Math.min(3, player.speed + 0.5);
        break;
      case 'bomb':
        for (const e of this.enemies) {
          if (e.alive) {
            e.alive = false;
            this.spawnExplosion(e.x + e.size / 2, e.y + e.size / 2);
          }
        }
        break;
      case 'timer':
        this.freezeTimer = 300;
        this.timerItemActive = true;
        break;
      case 'horn':
        this.hornTimer = 300;
        const remaining = this.totalEnemies - this.enemiesSpawned;
        this.totalEnemies -= Math.min(remaining, Math.floor(remaining * 0.5) + 1);
        break;
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.spawnAnimations.length - 1; i >= 0; i--) {
      this.spawnAnimations[i].timer--;
      if (this.spawnAnimations[i].timer <= 0) this.spawnAnimations.splice(i, 1);
    }
  }

  checkGameOver() {
    if (this.state !== 1) return;
    if (this.player1) {
      const baseDestroyed = (this.map[24]?.[12] === 0 && this.map[24]?.[13] === 0);
      if (baseDestroyed) {
        this.state = 3;
        this.onStateChange?.(3, { score: this.score, level: this.level });
        sound.play('gameOver' as any);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    if (!ctx) return;
    if (this.map.length === 0) {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, W, H);
      return;
    }

    const bg = this.theme?.bg || '#1a1a1a';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    this.drawMap(ctx);
    this.drawPowerups(ctx);

    for (const s of this.spawnAnimations) {
      if (s.timer > 0) {
        const alpha = Math.sin(s.timer * 0.3) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
        ctx.fillRect(s.x, s.y, CELL, CELL);
      }
    }

    if (this.player1 && this.player1.alive) this.player1.draw(ctx);
    if (this.player2 && this.player2.alive && this.doubleMode) this.player2.draw(ctx);
    for (const e of this.enemies) { if (e.alive || e.spawning) e.draw(ctx); }
    for (const b of this.bullets) b.draw(ctx);

    for (const p of this.particles) {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  private drawMap(ctx: CanvasRenderingContext2D) {
    const t = this.theme;
    const fg = t?.floorColor || '#1a1a1a';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = this.map[r][c];
        if (tile === 0) {
          ctx.fillStyle = fg;
          ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
          continue;
        }
        const x = c * CELL, y = r * CELL;
        switch (tile) {
          case 1: case 6: this.drawBrick(ctx, x, y, t); break;
          case 2: this.drawSteel(ctx, x, y); break;
          case 3: this.drawForest(ctx, x, y, t); break;
          case 4: this.drawWater(ctx, x, y, t); break;
          case 5: this.drawBase(ctx, x, y); break;
        }
      }
    }
  }

  private drawBrick(ctx: CanvasRenderingContext2D, x: number, y: number, t: any) {
    const wc = t?.wallColor || '#8B4513';
    const ba = t?.brickAlt || '#A0522D';
    ctx.fillStyle = wc;
    ctx.fillRect(x, y, CELL, CELL);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    const half = CELL / 2;
    ctx.strokeRect(x, y, half, half);
    ctx.strokeRect(x + half + 1, y, half - 1, half);
    ctx.strokeRect(x, y + half + 1, half, half - 1);
    ctx.strokeRect(x + half + 1, y + half + 1, half - 1, half - 1);
    ctx.fillStyle = ba;
    ctx.fillRect(x + 2, y + 2, 3, 3);
    ctx.fillRect(x + half + 3, y + 2, 3, 3);
    ctx.fillRect(x + 2, y + half + 3, 3, 3);
    ctx.fillRect(x + half + 3, y + half + 3, 3, 3);
  }

  private drawSteel(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = '#666';
    ctx.fillRect(x, y, CELL, CELL);
    ctx.fillStyle = '#808080';
    ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
    ctx.fillStyle = '#999';
    ctx.fillRect(x + 3, y + 3, CELL - 6, CELL - 6);
    ctx.fillStyle = '#555';
    ctx.fillRect(x + 5, y + 5, CELL - 10, CELL - 10);
    ctx.fillStyle = '#aaa';
    ctx.fillRect(x + 2, y + 2, 3, 3);
    ctx.fillRect(x + CELL - 5, y + 2, 3, 3);
    ctx.fillRect(x + 2, y + CELL - 5, 3, 3);
    ctx.fillRect(x + CELL - 5, y + CELL - 5, 3, 3);
  }

  private drawForest(ctx: CanvasRenderingContext2D, x: number, y: number, t: any) {
    const fc = t?.forestColor || '#228B22';
    const bg = t?.bg || '#1a1a1a';
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, CELL, CELL);
    ctx.fillStyle = fc;
    for (let i = 0; i < 4; i++) {
      const tx = x + (i % 2) * 14 + 3;
      const ty = y + Math.floor(i / 2) * 14 + 3;
      ctx.beginPath();
      ctx.arc(tx + 6, ty + 6, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#1a5a1a';
    ctx.beginPath();
    ctx.arc(x + 8, y + 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 22, y + 22, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawWater(ctx: CanvasRenderingContext2D, x: number, y: number, t: any) {
    const wc = t?.waterColor || '#1E90FF';
    const bg = t?.bg || '#1a1a1a';
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, CELL, CELL);
    ctx.fillStyle = wc;
    ctx.fillRect(x + 3, y + 3, CELL - 6, CELL - 6);
    const wave = Math.sin(this.frameCount * 0.04 + x * 0.1) * 2;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x + 6, y + 8 + wave, 7, 2);
    ctx.fillRect(x + 17, y + 18 - wave, 7, 2);
  }

  private drawBase(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x, y, CELL, CELL);
    ctx.fillStyle = '#FFD700';
    const cx = x + CELL / 2, cy = y + CELL / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 8); ctx.lineTo(cx + 6, cy + 2);
    ctx.lineTo(cx + 3, cy + 2); ctx.lineTo(cx + 3, cy + 8);
    ctx.lineTo(cx - 3, cy + 8); ctx.lineTo(cx - 3, cy + 2);
    ctx.lineTo(cx - 6, cy + 2); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(cx - 2, cy - 2, 4, 4);
  }

  drawPowerups(ctx: CanvasRenderingContext2D) {
    for (const p of this.powerups) {
      if (p.blinking && Math.floor(p.blinkTimer / 5) % 2 === 0) continue;
      const px = p.x, py = p.y;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, 26, 26);
      ctx.fillStyle = '#222';
      ctx.fillRect(px + 1, py + 1, 24, 24);
      ctx.fillStyle = '#FFD700';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      const symbols: Record<string, string> = {
        lightning: '⚡', superBullet: '🔥', star: '★',
        bomb: '💣', timer: '⏰', horn: '📯'
      };
      ctx.fillText(symbols[p.type] || '?', px + 13, py + 18);
    }
  }

  drawPauseOverlay() {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', W / 2, H / 2 - 10);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText('DOUBLE TAP JOYSTICK TO CONTINUE', W / 2, H / 2 + 20);
  }

  getScore() { return this.score; }
  getLevel() { return this.level; }
  getLives() { return this.lives; }
}

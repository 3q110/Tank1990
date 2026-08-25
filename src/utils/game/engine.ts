import { COLS, ROWS, CELL, W, H, DX, DY, ENEMY_SPEEDS, ENEMY_HP } from './constants';
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

// 兼容微信小游戏和 H5 的 requestAnimationFrame / cancelAnimationFrame
const rAF = (typeof wx !== 'undefined' && wx.requestAnimationFrame)
  ? wx.requestAnimationFrame.bind(wx)
  : (typeof window !== 'undefined' ? window.requestAnimationFrame.bind(window) : (cb: FrameRequestCallback) => setTimeout(cb, 16));
const cAF = (typeof wx !== 'undefined' && wx.cancelAnimationFrame)
  ? wx.cancelAnimationFrame.bind(wx)
  : (typeof window !== 'undefined' ? window.cancelAnimationFrame.bind(window) : clearTimeout);

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
  // 屏幕震动（视觉反馈）
  shakeX = 0; shakeY = 0; shakeT = 0; shakeMax = 1; shakeAmp = 0;
  triggerShake(amp: number, ms: number) { this.shakeAmp = amp; this.shakeMax = ms; this.shakeT = ms; }
  updateShake(dt: number) {
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      const k = Math.max(0, this.shakeT / this.shakeMax);
      this.shakeX = (Math.random() * 2 - 1) * this.shakeAmp * k;
      this.shakeY = (Math.random() * 2 - 1) * this.shakeAmp * k;
    } else { this.shakeX = 0; this.shakeY = 0; }
  }

  // ========== 难度与单人闯关模式 ==========
  // difficulty: 'easy' | 'medium' | 'hard'（单人闯关模式的难度档位）
  difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  // campaignMode: 单人闯关模式（从第 1 关连续打到最后一关，生命/洋枪/星级跨关保留）
  campaignMode = false;
  // 跨关保留的进度
  private campaignScore = 0;
  private campaignLives = 3;
  private campaignP1Super = false;
  private campaignP2Super = false;
  private campaignP1Speed = 2;
  private campaignP2Speed = 2;

  /** 难度对应的参数配置 */
  private get diffConfig() {
    switch (this.difficulty) {
      case 'easy':
        return { lives: 5, totalDelta: -4, maxEnemies: 3, spawnTimer: 90, speedMul: 0.7, playerSpeed: 2.5, enemyHp: 0.8 };
      case 'hard':
        return { lives: 2, totalDelta: 8, maxEnemies: 6, spawnTimer: 30, speedMul: 1.3, playerSpeed: 1.7, enemyHp: 1.25 };
      default:
        return { lives: 3, totalDelta: 0, maxEnemies: 4, spawnTimer: 60, speedMul: 1.0, playerSpeed: 2.0, enemyHp: 1.0 };
    }
  }

  /**
   * 开始一局（单人闯关模式）。
   * @param doubleMode 是否双人
   * @param difficulty 难度（easy/medium/hard）
   * @param campaign 是否单人闯关模式（从第 1 关连续打到最后一关，进度跨关保留）
   */
  startCampaign(doubleMode: boolean, difficulty: 'easy' | 'medium' | 'hard', campaign: boolean) {
    this.doubleMode = doubleMode;
    this.difficulty = difficulty || 'medium';
    this.campaignMode = !!campaign;
    this.campaignScore = 0;
    this.campaignLives = this.diffConfig.lives;
    this.campaignP1Super = false;
    this.campaignP2Super = false;
    this.campaignP1Speed = this.diffConfig.playerSpeed;
    this.campaignP2Speed = this.diffConfig.playerSpeed;
    this.initLevel(0, doubleMode);
    sound.init();
  }

  /**
   * 进入下一关（保留闯关模式下的生命/洋枪/星级进度）。
   */
  nextLevel() {
    if (this.campaignMode) {
      // 保留进度
      this.campaignScore = this.score;
      this.campaignLives = Math.max(0, this.lives);
      this.campaignP1Super = !!(this.player1 && this.player1.superBullet);
      this.campaignP2Super = !!(this.player2 && this.player2.superBullet);
      this.campaignP1Speed = this.player1 ? this.player1.speed : this.campaignP1Speed;
      this.campaignP2Speed = this.player2 ? this.player2.speed : this.campaignP2Speed;
    } else {
      this.campaignScore = 0;
      this.campaignLives = this.diffConfig.lives;
      this.campaignP1Super = false;
      this.campaignP2Super = false;
      this.campaignP1Speed = this.diffConfig.playerSpeed;
      this.campaignP2Speed = this.diffConfig.playerSpeed;
    }
    this.initLevel(this.level + 1, this.doubleMode);
  }

  /**
   * 初始化关卡（不启动内部循环，由外部主循环驱动 update/render）
   */
  initLevel(level: number, doubleMode: boolean) {
    this.doubleMode = doubleMode;
    // 闯关模式下保留分数与生命，否则重置
    this.score = this.campaignMode ? this.campaignScore : 0;
    this.lives = this.campaignMode ? this.campaignLives : this.diffConfig.lives;
    this.resetLevel(level);
    sound.init();
  }

  resetLevel(level: number) {
    this.level = level;
    const src = LEVELS[Math.min(level, LEVELS.length - 1)];
    this.theme = getLevelTheme(level);
    const cfg = this.diffConfig;
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
    // 难度影响敌人总数与同屏数量
    this.totalEnemies = Math.max(8, (src.totalEnemies || 20) + cfg.totalDelta);
    this.maxEnemies = cfg.maxEnemies;
    this.enemySpawnTimer = cfg.spawnTimer;
    this.powerupTimer = 200;
    this.spawnAnimations = [];
    this.freezeTimer = 0;
    this.hornTimer = 0;
    this.timerItemActive = false;
    this.frameCount = 0;

    this.player1 = new Tank(8 * CELL + 1, 24 * CELL + 1, 0, true, 0);
    // 闯关模式保留玩家进度（洋枪/速度），否则用难度配置
    this.player1.speed = this.campaignMode ? this.campaignP1Speed : cfg.playerSpeed;
    this.player1.superBullet = this.campaignMode && this.campaignP1Super;
    if (this.doubleMode) {
      this.player2 = new Tank(17 * CELL + 1, 24 * CELL + 1, 0, true, 1);
      this.player2.speed = this.campaignMode ? this.campaignP2Speed : cfg.playerSpeed;
      this.player2.superBullet = this.campaignMode && this.campaignP2Super;
    }
    this.lives = this.campaignMode ? this.campaignLives : cfg.lives;
    this.state = 1;
  }

  /**
   * 引擎自身的游戏循环（用于 Taro GameCanvas 等场景）。
   * 注意：若由外部主循环驱动 update/render（如微信小游戏入口 src/game.ts），
   * 则不要调用本方法，直接调用 update()/render() 即可。
   */
  gameLoop(time: number) {
    const dt = this.lastTime ? time - this.lastTime : 16;
    this.lastTime = time;
    this.frameCount++;
    this.updateShake(Math.min(dt, 250));
    if (this.state === 1) this.update();
    this.render();
    if (this.state === 4) this.drawPauseOverlay();
    this.animFrameId = rAF((t: number) => this.gameLoop(t));
  }

  stop() {
    if (this.animFrameId !== null) {
      cAF(this.animFrameId);
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
    } else if (this.player1 && !this.player1.alive && !this.player1.spawning) {
      // 仅当 P2 未存活（或单人模式）且还有生命时才重生成 P1；
      // 否则等待 checkGameOver 判定，避免两人同时阵亡后反复重生。
      if ((!this.doubleMode || !this.player2 || (!this.player2.alive && !this.player2.spawning)) && this.lives > 0) {
        this.lives--;
        this.respawnPlayer(this.player1, 8);
      }
    }

    if (this.doubleMode && this.player2) {
      if (this.player2.alive) {
        this.updatePlayer(this.player2, this.keys, { up:'ArrowUp', down:'ArrowDown', left:'ArrowLeft', right:'ArrowRight', fire:'0' });
      } else if (!this.player2.alive && !this.player2.spawning) {
        // 仅当 P1 仍存活且还有生命时才重生成 P2
        if (this.player1 && this.player1.alive && this.lives > 0) {
          this.lives--;
          this.respawnPlayer(this.player2, 17);
        }
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

  /**
   * 供外部主循环在状态切换后调用：若当前关卡已全部清完，返回 true。
   * （引擎内部 checkGameOver 也会自动触发 state=2，这里作为兜底查询。）
   */
  isLevelCleared(): boolean {
    if (this.state !== 1) return this.state === 2;
    return this.enemiesSpawned >= this.totalEnemies &&
      this.enemies.filter(e => e.alive || e.spawning).length === 0;
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
    const allTanks: Tank[] = [];
    if (this.player1 && this.player1.alive && !this.player1.spawning && this.player1 !== self) allTanks.push(this.player1);
    if (this.player2 && this.player2.alive && !this.player2.spawning && this.player2 !== self) allTanks.push(this.player2);
    for (const e of this.enemies) {
      if (e.alive && !e.spawning && e !== self) allTanks.push(e);
    }
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
    sound.play('spawn');
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
    sound.play(tank.superBullet ? 'superShoot' : 'shoot');
  }

  updateEnemies() {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      // 出生中的敌人（alive=false, spawning=true）不能被移除，等待出生完成
      if (!e.alive && !e.spawning) { this.enemies.splice(i, 1); continue; }

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
      // 难度影响敌人速度与血量
      const cfg = this.diffConfig;
      enemy.speed = (ENEMY_SPEEDS[type] || 1) * cfg.speedMul;
      enemy.hp = Math.max(1, Math.round((ENEMY_HP[type] || 1) * cfg.enemyHp));
      enemy.spawning = true;
      enemy.spawnTimer = 60;
      enemy.alive = false;
      enemy.shootTimer = 60 + Math.floor(Math.random() * 120);
      enemy.moveTimer = 30 + Math.floor(Math.random() * 60);
      this.enemies.push(enemy);
      this.enemiesSpawned++;
      this.spawnAnimations.push({ x: ex, y: ey, timer: 60 });
      if (this.enemiesSpawned <= 3) sound.play('spawn');
    }
  }

  updateBullets() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      if (!b.alive) { this.bullets.splice(i, 1); continue; }

      const result = b.update(this.map);
      if (result.hitBrick || result.hitSteel) {
        this.spawnBrickParticles(result.bx!, result.by!);
        sound.play('hit');
      }
      if (result.hitBase) {
        // 基地被炸毁：清空基地格子，判负逻辑交给 checkGameOver 统一处理
        this.destroyBaseTiles();
        if (!b.alive) { this.bullets.splice(i, 1); continue; }
      }

      if (!b.alive) { this.bullets.splice(i, 1); continue; }

      const allTanks: Tank[] = [];
      if (this.player1 && this.player1 !== b.owner) allTanks.push(this.player1);
      if (this.player2 && this.player2 !== b.owner) allTanks.push(this.player2);
      for (const e of this.enemies) if (e !== b.owner) allTanks.push(e);
      for (const tank of allTanks) {
        if (b.hitsTank(tank)) {
          this.hitTank(tank, b);
          // 超级子弹可穿透敌人，普通子弹被消灭
          if (!b.superBullet) {
            b.alive = false;
            this.bullets.splice(i, 1);
          }
          break;
        }
      }
    }
  }

  private hitTank(tank: Tank, _bullet: Bullet) {
    if (tank.invincible > 0 || tank.spawning) return;
    if (tank.shieldTimer > 0 && tank.isPlayer) {
      tank.shieldTimer = 0;
      sound.play('hit');
      return;
    }
    tank.hp--;
    if (tank.hp <= 0) {
      tank.alive = false;
      this.spawnExplosion(tank.x + tank.size / 2, tank.y + tank.size / 2);
      sound.play('explosion');
      this.triggerShake(tank.isPlayer ? 7 : 4, tank.isPlayer ? 260 : 160);
      if (tank.isPlayer) {
        // 生命耗尽判负统一由 checkGameOver 处理
      } else {
        this.score += 100;
        if (Math.random() < 0.15) this.spawnPowerup(tank.x, tank.y);
        // 过关判定统一由 checkGameOver 处理
      }
    } else {
      sound.play('hit');
    }
  }

  /** 清空基地的 4 个格子（基地被摧毁时调用） */
  private destroyBaseTiles() {
    for (const r of [24, 25]) {
      for (const c of [12, 13]) {
        if (this.map[r] && this.map[r][c] === 5) this.map[r][c] = 0;
      }
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
    // 定时掉落道具
    this.powerupTimer--;
    if (this.powerupTimer <= 0) {
      this.powerupTimer = this.powerupInterval + Math.floor(Math.random() * 200);
      const col = 1 + Math.floor(Math.random() * (COLS - 2));
      const row = 4 + Math.floor(Math.random() * (ROWS - 12));
      const tile = this.map[row]?.[col];
      // 避免掉在墙/钢/水/基地上
      if (tile !== 1 && tile !== 2 && tile !== 4 && tile !== 5 && tile !== 6) {
        this.spawnPowerup(col * CELL, row * CELL);
      }
    }

    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      if (p.blinking) {
        p.blinkTimer--;
        if (p.blinkTimer <= 0) { this.powerups.splice(i, 1); continue; }
      }
      const players = [this.player1, this.player2].filter(pl => pl && pl.alive);
      let picked = false;
      for (const player of players) {
        if (!player) continue;
        if (player.x < p.x + 26 && player.x + player.size > p.x &&
          player.y < p.y + 26 && player.y + player.size > p.y) {
          this.applyPowerup(player, p.type);
          this.powerups.splice(i, 1);
          sound.play('powerup');
          picked = true;
          break;
        }
      }
      if (picked) continue;
      if (!p.blinking) {
        p.blinkTimer++;
        if (p.blinkTimer > 600) {
          p.blinking = true;
          p.blinkTimer = 90;
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
        // 冻结全场敌人约 8 秒（300 帧）
        this.freezeTimer = Math.max(this.freezeTimer, 300);
        this.timerItemActive = true;
        sound.play('hit');
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

    // 基地被摧毁 → 立即判负（基地格子 24/25 行 × 12/13 列被清空）
    const baseDestroyed =
      (this.map[24]?.[12] === 0 && this.map[24]?.[13] === 0) ||
      (this.map[25]?.[12] === 0 && this.map[25]?.[13] === 0);
    if (baseDestroyed) {
      this.state = 3;
      this.onStateChange?.(3, { score: this.score, level: this.level, baseDestroyed: true });
      sound.play('gameOver');
      return;
    }

    // 全部敌人消灭 → 过关
    if (this.enemiesSpawned >= this.totalEnemies &&
        this.enemies.filter(e => e.alive || e.spawning).length === 0) {
      this.state = 2;
      this.onStateChange?.(2, { score: this.score, level: this.level });
      sound.play('levelComplete');
      return;
    }

    // 生命耗尽 → 判负
    const p1Dead = !this.player1 || (!this.player1.alive && !this.player1.spawning);
    const p2Dead = !this.player2 || (!this.player2.alive && !this.player2.spawning);
    const allDead = this.doubleMode ? (p1Dead && p2Dead) : p1Dead;
    if (this.lives <= 0 && allDead) {
      this.state = 3;
      this.onStateChange?.(3, { score: this.score, level: this.level });
      sound.play('gameOver');
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
    ctx.save();
    if (this.shakeX || this.shakeY) ctx.translate(this.shakeX, this.shakeY);
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
    ctx.restore(); // end screen shake
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

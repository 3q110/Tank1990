import { GameEngine } from './utils/game/engine';
import { W, H, initResponsiveSize } from './utils/game/constants';
import { sound } from './utils/game/sound';
import { LEVELS, THEMES, MAP_OPTIONS } from './utils/game/levels';

// 兼容微信小游戏和 H5 的 requestAnimationFrame
const rAF = typeof wx !== 'undefined' && typeof wx.requestAnimationFrame === 'function'
  ? wx.requestAnimationFrame.bind(wx)
  : (typeof window !== 'undefined' ? window.requestAnimationFrame.bind(window) : (cb: FrameRequestCallback) => setTimeout(cb, 16));

// 游戏场景状态
type Scene = 'menu' | 'difficulty' | 'mapselect' | 'game' | 'records' | 'gameover' | 'levelComplete';

// 难度
type Difficulty = 'easy' | 'medium' | 'hard';
const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: '简单', medium: '普通', hard: '困难' };

// 游戏全局状态
interface GameState {
  scene: Scene;
  level: number;
  doubleMode: boolean;
  score: number;
  selectedLevel: number;
  difficulty: Difficulty;
  // 本局配置（从菜单确定后保持不变，直到重开）
  sessionDouble: boolean;
  sessionDifficulty: Difficulty;
}

// 获取系统信息（微信小游戏）
function getSystemInfo(): { windowWidth: number; windowHeight: number } {
  if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
    try {
      return wx.getSystemInfoSync();
    } catch (e) {
      console.warn('[game] Failed to get system info:', e);
    }
  }
  return { windowWidth: 375, windowHeight: 667 };
}

interface Btn { x: number; y: number; w: number; h: number; text: string; color?: string; }

class MiniGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private engine: GameEngine | null = null;
  private state: GameState = {
    scene: 'menu',
    level: 0,
    doubleMode: false,
    score: 0,
    selectedLevel: 0,
    difficulty: 'medium',
    sessionDouble: false,
    sessionDifficulty: 'medium'
  };

  // 屏幕尺寸
  private screenWidth = 375;
  private screenHeight = 667;

  // 游戏画面缩放和位置
  private gameScale = 1;
  private gameOffsetX = 0;
  private gameOffsetY = 0;

  // 触控相关
  private joystickTouchId: number | null = null;
  private fireTouchId: number | null = null;
  private lastTapTime = 0;
  private joystickCenter = { x: 70, y: 0 };
  private joystickPos = { x: 0, y: 0 };
  private J_RADIUS = 35;
  private KNOB_RADIUS = 12;

  // 按钮区域
  private buttons: { [key: string]: Btn } = {};

  constructor() {
    this.init();
  }

  private init() {
    const sysInfo = getSystemInfo();
    this.screenWidth = sysInfo.windowWidth;
    this.screenHeight = sysInfo.windowHeight;
    console.log(`[MiniGame] Screen: ${this.screenWidth}x${this.screenHeight}`);

    initResponsiveSize();
    this.calculateGameLayout();

    const canvas = wx.createCanvas();
    canvas.width = this.screenWidth;
    canvas.height = this.screenHeight;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.joystickCenter = { x: 70, y: this.screenHeight - 70 };
    this.joystickPos = { ...this.joystickCenter };

    sound.init();
    this.bindEvents();
    this.loop();
  }

  private calculateGameLayout() {
    const hudHeight = 50;
    const controlsHeight = 120;
    const padding = 10;

    const availableWidth = this.screenWidth - padding * 2;
    const availableHeight = this.screenHeight - hudHeight - controlsHeight - padding * 2;

    const scaleX = availableWidth / W;
    const scaleY = availableHeight / H;
    this.gameScale = Math.min(scaleX, scaleY, 1);

    const scaledWidth = W * this.gameScale;
    const scaledHeight = H * this.gameScale;
    this.gameOffsetX = (this.screenWidth - scaledWidth) / 2;
    this.gameOffsetY = hudHeight + (availableHeight - scaledHeight) / 2;
    console.log(`[MiniGame] Layout: scale=${this.gameScale.toFixed(3)}`);
  }

  private bindEvents() {
    wx.onTouchStart((e: any) => {
      for (const touch of e.touches) {
        this.handleTouchStart(touch.identifier, touch.clientX, touch.clientY);
      }
    });
    wx.onTouchMove((e: any) => {
      for (const touch of e.touches) {
        this.handleTouchMove(touch.identifier, touch.clientX, touch.clientY);
      }
    });
    wx.onTouchEnd((e: any) => {
      for (const touch of e.changedTouches) {
        this.handleTouchEnd(touch.identifier);
      }
    });
    wx.onTouchCancel((e: any) => {
      for (const touch of e.changedTouches) {
        this.handleTouchEnd(touch.identifier);
      }
    });
  }

  private handleTouchStart(id: number, x: number, y: number) {
    // 菜单 / 难度选择 / 战绩 / 结算 等场景：命中按钮
    if (['menu', 'difficulty', 'mapselect', 'records', 'gameover', 'levelComplete'].includes(this.state.scene)) {
      for (const [key, btn] of Object.entries(this.buttons)) {
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
          this.handleMenuButton(key);
          return;
        }
      }
      // 结算类场景点空白处也返回菜单
      if (['gameover', 'allClear'].includes(this.state.scene)) this.state.scene = 'menu';
      return;
    }

    // 游戏场景
    if (this.state.scene === 'game' && this.engine) {
      const dx = x - this.joystickCenter.x;
      const dy = y - this.joystickCenter.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.J_RADIUS * 2.5) {
        this.joystickTouchId = id;
        this.updateJoystick(x, y);

        const now = Date.now();
        if (now - this.lastTapTime < 350) {
          if (this.engine.state === 1) this.engine.state = 4;
          else if (this.engine.state === 4) this.engine.state = 1;
        }
        this.lastTapTime = now;
        return;
      }

      const fireBtnX = this.screenWidth - 70;
      const fireBtnY = this.screenHeight - 70;
      const fireDist = Math.sqrt((x - fireBtnX) ** 2 + (y - fireBtnY) ** 2);
      if (fireDist < 55) {
        this.fireTouchId = id;
        this.engine.keys['j'] = true;
        return;
      }
    }
  }

  private handleTouchMove(id: number, x: number, y: number) {
    if (this.state.scene === 'game' && this.engine && this.joystickTouchId === id) {
      this.updateJoystick(x, y);
    }
  }

  private handleTouchEnd(id: number) {
    if (this.joystickTouchId === id) {
      this.joystickTouchId = null;
      this.joystickPos = { ...this.joystickCenter };
      this.clearDirection();
    }
    if (this.fireTouchId === id) {
      this.fireTouchId = null;
      if (this.engine) this.engine.keys['j'] = false;
    }
  }

  private updateJoystick(x: number, y: number) {
    const dx = x - this.joystickCenter.x;
    const dy = y - this.joystickCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.J_RADIUS) {
      const ratio = this.J_RADIUS / dist;
      this.joystickPos.x = this.joystickCenter.x + dx * ratio;
      this.joystickPos.y = this.joystickCenter.y + dy * ratio;
    } else {
      this.joystickPos.x = x;
      this.joystickPos.y = y;
    }

    if (dist > 8 && this.engine) {
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      this.setDirectionFromAngle(angle);
    } else {
      this.clearDirection();
    }
  }

  private setDirectionFromAngle(angle: number) {
    if (!this.engine) return;
    this.clearDirection();
    if (angle >= -45 && angle < 45) this.engine.keys['d'] = true;
    else if (angle >= 45 && angle < 135) this.engine.keys['s'] = true;
    else if (angle >= -135 && angle < -45) this.engine.keys['w'] = true;
    else this.engine.keys['a'] = true;
  }

  private clearDirection() {
    if (!this.engine) return;
    this.engine.keys['w'] = false;
    this.engine.keys['s'] = false;
    this.engine.keys['a'] = false;
    this.engine.keys['d'] = false;
  }

  private handleMenuButton(key: string) {
    switch (key) {
      case '1p':
        this.state.sessionDouble = false;
        this.state.scene = 'difficulty';
        break;
      case '2p':
        this.state.sessionDouble = true;
        this.state.scene = 'difficulty';
        break;
      case 'prev':
        this.state.selectedLevel = Math.max(0, this.state.selectedLevel - 1);
        break;
      case 'next':
        this.state.selectedLevel = Math.min(LEVELS.length - 1, this.state.selectedLevel + 1);
        break;
      case 'records':
        this.state.scene = 'records';
        break;
      case 'map':
        this.state.scene = 'mapselect';
        break;
      case 'map0':
      case 'map1':
      case 'map2': {
        const opt = MAP_OPTIONS[Number(key.slice(3))];
        this.state.selectedLevel = opt.levelIdx;
        this.state.scene = 'difficulty';
        break;
      }
      case 'mapback':
        this.state.scene = 'menu';
        break;
      case 'back':
        this.state.scene = 'menu';
        break;
      case 'easy':
        this.startWithDifficulty('easy');
        break;
      case 'medium':
        this.startWithDifficulty('medium');
        break;
      case 'hard':
        this.startWithDifficulty('hard');
        break;
      case 'nextLevel':
        // 单人闯关：进入下一关（保留进度）
        if (this.engine) {
          this.engine.nextLevel();
          this.state.level = this.engine.level;
          this.state.scene = 'game';
        }
        break;
      case 'menu':
        this.state.scene = 'menu';
        break;
    }
  }

  private startWithDifficulty(difficulty: Difficulty) {
    this.state.sessionDifficulty = difficulty;
    this.state.level = this.state.selectedLevel;
    this.state.doubleMode = this.state.sessionDouble;
    this.state.scene = 'game';
    this.state.score = 0;

    if (this.engine) this.engine.stop();

    this.engine = new GameEngine();
    this.engine.canvas = this.canvas;
    this.engine.ctx = this.ctx;

    this.engine.onStateChange = (state, data) => {
      if (state === 2) {
        // 过关
        this.state.score = data?.score || 0;
        this.state.scene = 'levelComplete';
      } else if (state === 3) {
        // 游戏结束（生命耗尽或基地被摧毁）
        this.state.score = data?.score || 0;
        // 若已是最后一关且是基地被摧毁 → 仍算失败
        this.state.scene = 'gameover';
      }
    };

    // 单人闯关模式：从所选关卡连续打到最后一关，保留生命/洋枪
    this.engine.startCampaign(this.state.doubleMode, difficulty, true);
    // 若菜单中选择了非第 1 关，则从该关开始（后续仍可连续通关）
    if (this.state.selectedLevel > 0) {
      this.engine.initLevel(this.state.selectedLevel, this.state.doubleMode);
    }
  }

  // ========== 唯一主循环 ==========
  private loop() {
    this.update();
    this.render();
    rAF(() => this.loop());
  }

  private update() {
    if (this.state.scene === 'game' && this.engine && this.engine.state === 1) {
      this.engine.update();
    }
  }

  private render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
    this.buttons = {};

    switch (this.state.scene) {
      case 'menu': this.renderMenu(ctx); break;
      case 'difficulty': this.renderDifficulty(ctx); break;
      case 'mapselect': this.renderMapSelect(ctx); break;
      case 'game': this.renderGame(ctx); break;
      case 'records': this.renderRecords(ctx); break;
      case 'gameover': this.renderGameOver(ctx); break;
      case 'levelComplete': this.renderLevelComplete(ctx); break;
    }
  }

  // ========== 渲染方法 ==========

  private renderMenu(ctx: CanvasRenderingContext2D) {
    const centerX = this.screenWidth / 2;
    const topY = this.screenHeight * 0.12;

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('坦克大战', centerX, topY);

    ctx.fillStyle = '#888';
    ctx.font = '16px sans-serif';
    ctx.fillText('BATTLE CITY', centerX, topY + 28);

    // 关卡选择
    const levelY = topY + 70;
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`选择关卡 ${this.state.selectedLevel + 1} / ${LEVELS.length}  ·  ${THEMES[LEVELS[this.state.selectedLevel].theme].name}`, centerX, levelY);

    const btnY = levelY + 25;
    const btnW = 70, btnH = 44, gap = 15;
    this.buttons['prev'] = { x: centerX - btnW - gap, y: btnY, w: btnW, h: btnH, text: '<' };
    this.buttons['next'] = { x: centerX + gap, y: btnY, w: btnW, h: btnH, text: '>' };
    this.drawButton(ctx, this.buttons['prev']);
    this.drawButton(ctx, this.buttons['next']);

    // 模式按钮
    const modeY = btnY + 80;
    const modeW = 130, modeH = 50;
    this.buttons['1p'] = { x: centerX - modeW - 10, y: modeY, w: modeW, h: modeH, text: '单人闯关' };
    this.buttons['2p'] = { x: centerX + 10, y: modeY, w: modeW, h: modeH, text: '双人合作' };
    this.drawButton(ctx, this.buttons['1p']);
    this.drawButton(ctx, this.buttons['2p']);

    this.buttons['map'] = { x: centerX - 70, y: modeY + 80, w: 140, h: 44, text: '选择地图 (3张新图)' };
    this.drawButton(ctx, this.buttons['map']);

    this.buttons['records'] = { x: centerX - 60, y: modeY + 140, w: 120, h: 44, text: '战绩' };
    this.drawButton(ctx, this.buttons['records']);

    ctx.fillStyle = '#666';
    ctx.font = '13px sans-serif';
    ctx.fillText('左下角摇杆移动 · 右下角射击 · 双击摇杆暂停', centerX, this.screenHeight - 40);
  }

  private renderDifficulty(ctx: CanvasRenderingContext2D) {
    const centerX = this.screenWidth / 2;
    const topY = this.screenHeight * 0.15;

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('选择难度', centerX, topY);

    ctx.fillStyle = '#888';
    ctx.font = '15px sans-serif';
    ctx.fillText(`单人闯关 · 从第 ${this.state.selectedLevel + 1} 关开始`, centerX, topY + 30);

    const y = topY + 70;
    const w = 170, h = 54;
    this.buttons['easy'] = { x: centerX - w / 2, y: y, w, h, text: '简单  (5条命)' };
    this.buttons['medium'] = { x: centerX - w / 2, y: y + 70, w, h, text: '普通  (3条命)' };
    this.buttons['hard'] = { x: centerX - w / 2, y: y + 140, w, h, text: '困难  (2条命)' };
    this.drawButton(ctx, this.buttons['easy']);
    this.drawButton(ctx, this.buttons['medium']);
    this.drawButton(ctx, this.buttons['hard']);

    this.buttons['back'] = { x: centerX - 60, y: y + 220, w: 120, h: 44, text: '返回' };
    this.drawButton(ctx, this.buttons['back']);
  }

  private renderMapSelect(ctx: CanvasRenderingContext2D) {
    const centerX = this.screenWidth / 2;
    const topY = this.screenHeight * 0.07;

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('选择地图', centerX, topY);
    ctx.fillStyle = '#888';
    ctx.font = '14px sans-serif';
    ctx.fillText('SELECT MAP · 自由选择 3 张地图', centerX, topY + 26);

    const cardW = 100, cardH = 150, gap = 12;
    const totalW = cardW * 3 + gap * 2;
    const x0 = centerX - totalW / 2;
    const cardY = topY + 48;
    const cell = 7; // 13 格 * 7px = 91px 预览

    MAP_OPTIONS.forEach((opt, i) => {
      const def = LEVELS[opt.levelIdx];
      const theme = THEMES[def.theme];
      const cx = x0 + i * (cardW + gap);

      // 卡片底
      ctx.fillStyle = '#1f1f1f';
      ctx.fillRect(cx, cardY, cardW, cardH);
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx, cardY, cardW, cardH);

      // 预览（26x26 地图按 2 倍下采样为 13x13）
      const px0 = cx + (cardW - cell * 13) / 2;
      const py0 = cardY + 8;
      for (let r = 0; r < 13; r++) {
        for (let c = 0; c < 13; c++) {
          const tile = (def.map[r * 2] && def.map[r * 2][c * 2]) || 0;
          let color = theme.floorColor;
          if (tile === 1 || tile === 6) color = theme.wallColor;
          else if (tile === 2) color = '#999';
          else if (tile === 3) color = theme.forestColor;
          else if (tile === 4) color = theme.waterColor;
          else if (tile === 5) color = '#FFD700';
          ctx.fillStyle = color;
          ctx.fillRect(px0 + c * cell, py0 + r * cell, cell, cell);
        }
      }

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(opt.name, cx + cardW / 2, py0 + cell * 13 + 20);
      ctx.fillStyle = '#888';
      ctx.font = '11px sans-serif';
      ctx.fillText(`第 ${opt.levelIdx + 1} 关`, cx + cardW / 2, py0 + cell * 13 + 38);

      this.buttons[`map${i}`] = { x: cx, y: cardY, w: cardW, h: cardH, text: '' };
    });

    this.buttons['mapback'] = { x: centerX - 60, y: cardY + cardH + 24, w: 120, h: 44, text: '返回' };
    this.drawButton(ctx, this.buttons['mapback']);
  }

  private drawButton(ctx: CanvasRenderingContext2D, btn: Btn) {
    ctx.fillStyle = '#333';
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
    ctx.fillStyle = btn.color || '#FFD700';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2);
    ctx.textBaseline = 'alphabetic';
  }

  private renderGame(ctx: CanvasRenderingContext2D) {
    if (!this.engine) return;

    // HUD
    const diffLabel = DIFFICULTY_LABEL[this.state.sessionDifficulty] || '普通';
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`关卡 ${this.engine.level + 1}`, 15, 25);
    ctx.textAlign = 'center';
    ctx.fillText(`得分 ${this.engine.score}`, this.screenWidth / 2, 25);
    ctx.textAlign = 'right';
    const remaining = Math.max(0, this.engine.totalEnemies - this.engine.enemiesSpawned + this.engine.enemies.filter((e: any) => e.alive || e.spawning).length);
    ctx.fillText(`生命 ${Math.max(0, this.engine.lives)}  敌 ${remaining}`, this.screenWidth - 15, 25);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText(`${this.state.doubleMode ? '双人' : '单人'} · ${diffLabel}`, this.screenWidth - 15, 44);
    ctx.textBaseline = 'alphabetic';

    // 游戏画面
    ctx.save();
    ctx.translate(this.gameOffsetX, this.gameOffsetY);
    ctx.scale(this.gameScale, this.gameScale);
    this.engine.render();
    ctx.restore();

    // 冻结效果提示
    if ((this.engine as any).freezeTimer > 0) {
      ctx.fillStyle = 'rgba(100, 180, 255, 0.08)';
      ctx.fillRect(this.gameOffsetX, this.gameOffsetY, W * this.gameScale, H * this.gameScale);
    }

    // 暂停遮罩
    if (this.engine.state === 4) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PAUSED', this.screenWidth / 2, this.screenHeight / 2 - 10);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#888';
      ctx.fillText('双击摇杆继续', this.screenWidth / 2, this.screenHeight / 2 + 25);
      ctx.textBaseline = 'alphabetic';
    }

    this.renderJoystick(ctx);
    this.renderFireButton(ctx);
  }

  private renderJoystick(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.joystickCenter.x, this.joystickCenter.y, this.J_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.joystickPos.x, this.joystickPos.y, this.KNOB_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private renderFireButton(ctx: CanvasRenderingContext2D) {
    const x = this.screenWidth - 70, y = this.screenHeight - 70, r = 35;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = this.fireTouchId !== null ? 'rgba(255, 68, 68, 0.9)' : 'rgba(255, 68, 68, 0.7)';
    ctx.fill();
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FIRE', x, y);
    ctx.textBaseline = 'alphabetic';
  }

  private renderRecords(ctx: CanvasRenderingContext2D) {
    const centerX = this.screenWidth / 2;
    const topY = this.screenHeight * 0.15;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('战绩', centerX, topY);
    ctx.fillStyle = '#888';
    ctx.font = '16px sans-serif';
    ctx.fillText('功能开发中...', centerX, topY + 50);
    this.buttons['back'] = { x: centerX - 60, y: topY + 100, w: 120, h: 44, text: '返回' };
    this.drawButton(ctx, this.buttons['back']);
  }

  private renderGameOver(ctx: CanvasRenderingContext2D) {
    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('GAME OVER', centerX, centerY - 40);

    ctx.fillStyle = '#FFD700';
    ctx.font = '20px sans-serif';
    ctx.fillText(`最终得分: ${this.state.score}`, centerX, centerY + 10);
    ctx.fillText(`到达关卡: ${(this.engine ? this.engine.level : this.state.level) + 1}`, centerX, centerY + 45);

    this.buttons['menu'] = { x: centerX - 60, y: centerY + 80, w: 120, h: 48, text: '返回菜单' };
    this.drawButton(ctx, this.buttons['menu']);
  }

  private renderLevelComplete(ctx: CanvasRenderingContext2D) {
    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);

    const isLast = this.engine && this.engine.level >= LEVELS.length - 1;
    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(isLast ? '恭喜通关全部关卡!' : '关卡完成!', centerX, centerY - 50);

    ctx.fillStyle = '#FFD700';
    ctx.font = '18px sans-serif';
    ctx.fillText(`当前得分: ${this.state.score}`, centerX, centerY - 10);
    ctx.fillText(`剩余生命: ${this.engine ? Math.max(0, this.engine.lives) : 0}（将带入下一关）`, centerX, centerY + 20);

    if (!isLast && this.engine) {
      this.buttons['nextLevel'] = { x: centerX - 70, y: centerY + 60, w: 140, h: 50, text: '下一关' };
      this.drawButton(ctx, this.buttons['nextLevel']);
    }
    this.buttons['menu'] = { x: centerX - 70, y: isLast ? centerY + 60 : centerY + 125, w: 140, h: 48, text: '返回菜单' };
    this.drawButton(ctx, this.buttons['menu']);
  }

}


// 启动游戏
new MiniGame();

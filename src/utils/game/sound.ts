export class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private initialized = false;
  private isMiniGame = false;
  muted = false;

  init() {
    if (this.initialized) return;

    // 微信小游戏环境：无法实时合成，保持静默降级
    this.isMiniGame = typeof (globalThis as any).wx !== 'undefined' && (globalThis as any).wx.createInnerAudioContext;
    if (this.isMiniGame) {
      this.initialized = true;
      return;
    }

    try {
      const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      // 主增益 -> 压缩器 -> 输出（防止大量音效叠加时削波）
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.knee.value = 24; comp.ratio.value = 6;
      comp.attack.value = 0.003; comp.release.value = 0.2;
      this.master.connect(comp);
      comp.connect(this.ctx.destination);
      // 预生成 1.2s 白噪声缓冲，供爆炸/撞击复用
      const len = Math.floor(this.ctx.sampleRate * 1.2);
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.initialized = true;
    } catch {
      console.warn('[Sound] Web Audio API not available');
    }
  }

  resume() {
    if (this.isMiniGame || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(m: boolean) {
    this.muted = !!m;
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(m ? 0 : 0.9, this.ctx.currentTime + 0.05);
    }
  }

  // --- 底层合成工具 -------------------------------------------------------
  private tone(opts: {
    type?: OscillatorType; freq: number; freqEnd?: number;
    start?: number; dur?: number; vol?: number;
  }) {
    if (!this.ctx || !this.master) return;
    const { type = 'square', freq, freqEnd, start = 0, dur = 0.1, vol = 0.1 } = opts;
    const t0 = this.ctx.currentTime + start;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
    o.connect(g); g.connect(this.master);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  private noise(opts: {
    start?: number; dur?: number; vol?: number;
    filter?: BiquadFilterType; filterFreq?: number; sweepTo?: number;
  }) {
    if (!this.ctx || !this.master || !this.noiseBuf) return;
    const { start = 0, dur = 0.3, vol = 0.2, filter = 'lowpass', filterFreq = 800, sweepTo } = opts;
    const t0 = this.ctx.currentTime + start;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = filter; f.frequency.setValueAtTime(filterFreq, t0);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(Math.max(20, sweepTo), t0 + dur);
    const g = this.ctx.createGain();
    s.connect(f); f.connect(g); g.connect(this.master);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.start(t0); s.stop(t0 + dur + 0.05);
  }

  private ready(): boolean {
    if (!this.ctx || !this.master || this.muted) return false;
    this.resume();
    return true;
  }

  // --- 各音效 -------------------------------------------------------------
  shoot() {
    if (!this.ready()) return;
    this.tone({ type: 'square', freq: 900, freqEnd: 180, dur: 0.09, vol: 0.11 });
    this.noise({ dur: 0.05, vol: 0.05, filter: 'highpass', filterFreq: 2500 });
  }

  superShoot() {
    if (!this.ready()) return;
    this.tone({ type: 'sawtooth', freq: 1400, freqEnd: 320, dur: 0.13, vol: 0.12 });
    this.tone({ type: 'square', freq: 2100, freqEnd: 700, dur: 0.09, vol: 0.06 });
    this.noise({ dur: 0.08, vol: 0.06, filter: 'bandpass', filterFreq: 3000 });
  }

  explosion() {
    if (!this.ready()) return;
    this.noise({ dur: 0.45, vol: 0.4, filter: 'lowpass', filterFreq: 1200, sweepTo: 120 });
    this.tone({ type: 'sine', freq: 120, freqEnd: 40, dur: 0.4, vol: 0.3 });
    this.tone({ type: 'triangle', freq: 60, freqEnd: 30, dur: 0.5, vol: 0.18 });
  }

  hit() {
    if (!this.ready()) return;
    this.tone({ type: 'sawtooth', freq: 500, freqEnd: 120, dur: 0.09, vol: 0.09 });
    this.noise({ dur: 0.05, vol: 0.05, filter: 'lowpass', filterFreq: 2000 });
  }

  powerup() {
    if (!this.ready()) return;
    this.tone({ type: 'sine', freq: 500, freqEnd: 1600, dur: 0.28, vol: 0.08 });
    this.tone({ type: 'square', freq: 700, freqEnd: 2000, dur: 0.28, vol: 0.04, start: 0.02 });
    this.tone({ type: 'sine', freq: 1600, freqEnd: 2400, dur: 0.18, vol: 0.05, start: 0.18 });
  }

  gameOver() {
    if (!this.ready()) return;
    [392, 330, 262, 196].forEach((f, i) => {
      this.tone({ type: 'square', freq: f, dur: 0.22, vol: 0.1, start: i * 0.22 });
      this.tone({ type: 'sawtooth', freq: f / 2, dur: 0.22, vol: 0.05, start: i * 0.22 });
    });
  }

  levelComplete() {
    if (!this.ready()) return;
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      this.tone({ type: 'sine', freq: f, dur: 0.14, vol: 0.08, start: i * 0.09 });
      this.tone({ type: 'triangle', freq: f * 1.5, dur: 0.1, vol: 0.03, start: i * 0.09 });
    });
  }

  spawn() {
    if (!this.ready()) return;
    this.tone({ type: 'square', freq: 200, freqEnd: 800, dur: 0.15, vol: 0.05 });
  }

  select() {
    if (!this.ready()) return;
    this.tone({ type: 'square', freq: 660, dur: 0.05, vol: 0.06 });
  }

  play(type: 'shoot' | 'explosion' | 'powerup' | 'gameOver' | 'levelComplete' | 'hit' | 'superShoot' | 'spawn' | 'select') {
    switch (type) {
      case 'shoot': this.shoot(); break;
      case 'explosion': this.explosion(); break;
      case 'powerup': this.powerup(); break;
      case 'gameOver': this.gameOver(); break;
      case 'levelComplete': this.levelComplete(); break;
      case 'hit': this.hit(); break;
      case 'superShoot': this.superShoot(); break;
      case 'spawn': this.spawn(); break;
      case 'select': this.select(); break;
    }
  }
}

export const sound = new SoundEngine();

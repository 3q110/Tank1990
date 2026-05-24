export class SoundEngine {
  private ctx: AudioContext | null = null;
  private initialized = false;

  init() {
    if (this.initialized) return;
    try {
      const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (Ctor) {
        this.ctx = new Ctor();
        this.initialized = true;
      }
    } catch {
      console.warn('[Sound] Web Audio API not available');
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private play(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.06) {
    if (!this.ctx) return;
    this.resume();
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.connect(g);
    g.connect(this.ctx.destination);
    o.frequency.setValueAtTime(freq, this.ctx.currentTime);
    g.gain.setValueAtTime(volume, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    o.start();
    o.stop(this.ctx.currentTime + duration);
  }

  private playFreqs(freqs: number[], durations: number[], type: OscillatorType = 'square', volume = 0.06) {
    if (!this.ctx) return;
    this.resume();
    let t = this.ctx.currentTime;
    for (let i = 0; i < freqs.length; i++) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.connect(g);
      g.connect(this.ctx.destination);
      o.frequency.setValueAtTime(freqs[i], t);
      g.gain.setValueAtTime(volume, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + durations[i]);
      o.start(t);
      o.stop(t + durations[i]);
      t += durations[i];
    }
  }

  shoot() {
    this.play(800, 0.08);
  }

  explosion() {
    this.play(100, 0.2, 'sawtooth', 0.08);
    this.play(60, 0.3, 'sawtooth', 0.06);
  }

  powerup() {
    this.playFreqs([600, 800, 1000], [0.08, 0.08, 0.1], 'square', 0.05);
  }

  gameOver() {
    this.playFreqs([400, 300, 200, 100], [0.2, 0.2, 0.2, 0.4], 'square', 0.06);
  }

  levelComplete() {
    this.playFreqs([400, 500, 600, 800], [0.1, 0.1, 0.1, 0.2], 'square', 0.05);
  }

  hit() {
    this.play(300, 0.1, 'triangle', 0.04);
  }

  superShoot() {
    this.play(1000, 0.1, 'sine', 0.05);
    this.play(1200, 0.08, 'sine', 0.04);
  }
}

export const sound = new SoundEngine();

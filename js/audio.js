'use strict';
/* =====================================================================
   音效與配樂：全部用 WebAudio 即時合成，不需要任何音檔
   ===================================================================== */
const SND = {
  ac: null, master: null, sfxG: null, musG: null, noiseBuf: null,
  musicName: null, timer: null, step: 0, nextT: 0, pending: null, bar: 0,

  unlock() {
    if (!this.ac) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ac = new AC();
        this.master = this.ac.createGain(); this.master.gain.value = .9; this.master.connect(this.ac.destination);
        this.sfxG = this.ac.createGain(); this.sfxG.gain.value = .8; this.sfxG.connect(this.master);
        this.musG = this.ac.createGain(); this.musG.gain.value = .5; this.musG.connect(this.master);
        const len = this.ac.sampleRate * 1.5, buf = this.ac.createBuffer(1, len, this.ac.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      } catch (e) { this.ac = null; return; }
    }
    if (this.ac.state === 'suspended') this.ac.resume();
    if (this.pending) { const m = this.pending; this.pending = null; this.music(m); }
  },
  now() { return this.ac ? this.ac.currentTime : 0; },
  tone(f, dur, type = 'square', vol = .15, slide = 0, delay = 0, dest) {
    if (!this.ac) return;
    const t = this.ac.currentTime + delay, o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfxG); o.start(t); o.stop(t + dur + .03);
  },
  noise(dur, vol = .2, lp = 6000, hp = 0, delay = 0, sweep = 0, dest) {
    if (!this.ac) return;
    const t = this.ac.currentTime + delay, s = this.ac.createBufferSource(), g = this.ac.createGain();
    s.buffer = this.noiseBuf;
    const f = this.ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(lp, t);
    if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(60, lp + sweep), t + dur);
    let last = f;
    s.connect(f);
    if (hp) { const h = this.ac.createBiquadFilter(); h.type = 'highpass'; h.frequency.value = hp; f.connect(h); last = h; }
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    last.connect(g); g.connect(dest || this.sfxG);
    s.start(t, Math.random() * .5); s.stop(t + dur + .03);
  },
  play(n) {
    if (!this.ac || !Save.d || !Save.d.sound) return;
    const T = (f, d, ty, v, sl, dl) => this.tone(f, d, ty, v, sl, dl);
    switch (n) {
      case 'hop': T(380, .09, 'triangle', .16, 380); this.noise(.04, .03, 3000, 800); break;
      case 'bump': T(140, .09, 'square', .12, -50); break;
      case 'coin': T(988, .07, 'square', .1); T(1319, .14, 'square', .1, 0, .06); break;
      case 'gem': T(1175, .08, 'triangle', .14); T(1568, .08, 'triangle', .14, 0, .07); T(2093, .22, 'triangle', .14, 0, .14); break;
      case 'heart': [523, 659, 784, 1047].forEach((f, i) => T(f, .12, 'triangle', .15, 0, i * .07)); break;
      case 'crate': T(300, .06, 'square', .12, 300); T(600, .12, 'square', .12, 500, .06); break;
      case 'power': [392, 523, 659, 784, 1047, 1319].forEach((f, i) => T(f, .12, 'square', .1, 0, i * .05)); break;
      case 'weapon': T(220, .08, 'sawtooth', .12, 220); T(440, .1, 'sawtooth', .12, 440, .07); T(880, .18, 'square', .1, 0, .15); break;
      case 'hit': this.noise(.22, .3, 2400, 0, 0, -1800); T(160, .25, 'sawtooth', .2, -110); break;
      case 'splash': this.noise(.5, .28, 5000, 500, 0, -3500); T(500, .18, 'sine', .12, -350); break;
      case 'squash': this.noise(.12, .25, 1200); T(120, .22, 'square', .16, -70); break;
      case 'shoot': T(900, .12, 'square', .09, -600); break;
      case 'fire': this.noise(.2, .12, 3000, 400, 0, -2000); T(300, .18, 'sawtooth', .1, 300); break;
      case 'ice': T(1500, .2, 'triangle', .1, -800); T(2100, .18, 'sine', .08, -900, .04); break;
      case 'zap': this.noise(.2, .18, 8000, 1500, 0, -5000); T(1200, .16, 'sawtooth', .1, -900); break;
      case 'boom': this.noise(.55, .38, 1800, 0, 0, -1500); T(90, .45, 'sawtooth', .22, -55); break;
      case 'pop': T(700, .08, 'triangle', .14, 500); break;
      case 'click': T(660, .05, 'square', .09); break;
      case 'back': T(440, .07, 'square', .08, -120); break;
      case 'buy': T(784, .07, 'square', .1); T(1047, .07, 'square', .1, 0, .07); T(1568, .18, 'square', .1, 0, .14); break;
      case 'deny': T(180, .14, 'square', .12, -40); T(150, .2, 'square', .12, -40, .12); break;
      case 'warn': T(880, .08, 'square', .1); T(880, .08, 'square', .1, 0, .14); break;
      case 'strike': this.noise(.3, .3, 3000, 0, 0, -2500); T(110, .3, 'sawtooth', .16, -60); break;
      case 'swoosh': this.noise(.3, .12, 3000, 600, 0, 2500); break;
      case 'roar': T(110, .6, 'sawtooth', .22, -50); T(165, .6, 'square', .1, -60); this.noise(.5, .15, 800); break;
      case 'star': T(784, .14, 'triangle', .18); break;
      case 'star2': T(988, .14, 'triangle', .18); break;
      case 'star3': T(1319, .3, 'triangle', .2); T(1760, .4, 'triangle', .14, 0, .1); break;
      case 'win': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => T(f, i === 6 ? .5 : .13, 'square', .12, 0, i * .11)); break;
      case 'lose': [523, 466, 415, 392, 311].forEach((f, i) => T(f, .22, 'triangle', .18, 0, i * .18)); break;
      case 'revive': [392, 523, 659, 784].forEach((f, i) => T(f, .12, 'triangle', .16, 0, i * .08)); break;
      case 'slide': this.noise(.35, .1, 4000, 1500, 0, -2500); break;
      case 'tick': T(1200, .03, 'square', .06); break;
    }
  },

  /* ----- 配樂 ----- */
  themes: {
    cover: { bpm: 118, root: 60, sc: [0, 2, 4, 7, 9], prog: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]], lead: 'triangle', bass: 'square', arp: 'triangle', leadP: .55 },
    w0: { bpm: 124, root: 60, sc: [0, 2, 4, 7, 9], prog: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]], lead: 'triangle', bass: 'square', arp: 'square', leadP: .5 },
    w1: { bpm: 134, root: 57, sc: [0, 3, 5, 7, 10], prog: [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -2, 2]], lead: 'sawtooth', bass: 'sawtooth', arp: 'square', leadP: .45 },
    w2: { bpm: 104, root: 64, sc: [0, 2, 4, 6, 7, 9, 11], prog: [[0, 4, 7], [-1, 2, 7], [-3, 0, 4], [-7, -3, 0]], lead: 'sine', bass: 'triangle', arp: 'sine', leadP: .6 },
    w3: { bpm: 140, root: 50, sc: [0, 2, 3, 5, 7, 8, 11], prog: [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-7, -4, 0]], lead: 'sawtooth', bass: 'sawtooth', arp: 'square', leadP: .5 },
    w4: { bpm: 108, root: 53, sc: [0, 2, 4, 7, 9, 11], prog: [[0, 4, 7, 11], [-3, 0, 4, 7], [-5, -1, 2, 7], [-8, -5, -1, 4]], lead: 'sine', bass: 'triangle', arp: 'triangle', leadP: .4 },
    w5: { bpm: 128, root: 62, sc: [0, 2, 4, 5, 7, 9, 11], prog: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]], lead: 'square', bass: 'triangle', arp: 'square', leadP: .6 },
    boss: { bpm: 152, root: 45, sc: [0, 3, 5, 6, 7, 10], prog: [[0, 3, 7], [-2, 1, 5], [-4, 0, 3], [-5, -2, 2]], lead: 'sawtooth', bass: 'sawtooth', arp: 'square', leadP: .65 },
    shop: { bpm: 112, root: 65, sc: [0, 2, 4, 7, 9], prog: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]], lead: 'triangle', bass: 'triangle', arp: 'sine', leadP: .4 },
  },
  mf(n) { return 440 * Math.pow(2, (n - 69) / 12); },
  music(name) {
    if (!this.ac) { this.pending = name; return; }
    if (this.musicName === name && this.timer) return;
    this.stopMusic();
    this.musicName = name;
    if (!Save.d.music || !this.themes[name]) return;
    this.step = 0; this.bar = 0; this.nextT = this.ac.currentTime + .1;
    this.musG.gain.cancelScheduledValues(this.ac.currentTime);
    this.musG.gain.setValueAtTime(0.0001, this.ac.currentTime);
    this.musG.gain.exponentialRampToValueAtTime(.5, this.ac.currentTime + .8);
    this.timer = setInterval(() => this.sched(), 90);
  },
  stopMusic() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.musicName = null;
  },
  refreshMusic() { // 設定切換後呼叫
    const n = this.musicName || this.pending; this.stopMusic(); this.pending = null; if (n && Save.d.music) this.music(n);
  },
  sched() {
    const th = this.themes[this.musicName]; if (!th || !this.ac) return;
    const spb = 60 / th.bpm / 2; // 八分音符
    while (this.nextT < this.ac.currentTime + .35) {
      const s = this.step % 8, bar = Math.floor(this.step / 8);
      const chord = th.prog[bar % th.prog.length];
      const t = this.nextT - this.ac.currentTime;
      const rnd = mulberry32((bar % 8) * 977 + s * 31 + th.root);
      const M = this.musG;
      // bass
      if (s === 0 || s === 4 || (s === 6 && rnd() < .5)) this.tone(this.mf(th.root + chord[0] - 24), spb * 1.7, th.bass, .13, 0, t, M);
      // arp
      if (s % 2 === 0 || rnd() < .3) this.tone(this.mf(th.root + chord[(s >> 1) % chord.length] + 12), spb * 1.2, th.arp, .045, 0, t, M);
      // lead
      if (rnd() < th.leadP && (s % 2 === 0 || rnd() < .4)) {
        const deg = th.sc[Math.floor(rnd() * th.sc.length)] + (rnd() < .3 ? 12 : 0);
        this.tone(this.mf(th.root + 12 + deg), spb * (rnd() < .4 ? 2.4 : 1.3), th.lead, .055, 0, t, M);
      }
      // drums
      if (s === 0 || s === 4) { this.tone(130, .12, 'sine', .22, -90, t, M); }
      if (s === 2 || s === 6) this.noise(.09, .06, 5000, 1500, t, 0, M);
      if (s % 2 === 1) this.noise(.03, .035, 9000, 6000, t, 0, M);
      this.nextT += spb; this.step++;
    }
  },
};

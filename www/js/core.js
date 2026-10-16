'use strict';
/* =====================================================================
   青蛙過河：蛙蛙大冒險  —  核心引擎
   作者：ArchieKUO
   ===================================================================== */
const VERSION = 'v1.0';
const AUTHOR = '作者：ArchieKUO';
const W = 450, H = 920, TILE = 50, COLS = 9;
const FIELD_ROWS = 13, FIELD_TOP = 80, FIELD_BOTTOM = FIELD_TOP + FIELD_ROWS * TILE; // 730
const FONT = "'Noto Sans TC','Noto Sans CJK TC','Microsoft JhengHei','PingFang TC','Heiti TC',system-ui,sans-serif";
const PI = Math.PI, TAU = Math.PI * 2;

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let DPR = 1, SC = 1, OX = 0, OY = 0, winW = 0, winH = 0, QUAL = 1; // QUAL：畫質係數，太卡時由 main.js 自動調低

function resize() {
  DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, 2) * QUAL);
  winW = window.innerWidth; winH = window.innerHeight;
  canvas.width = Math.round(winW * DPR);
  canvas.height = Math.round(winH * DPR);
  SC = Math.min(winW / W, winH / H);
  OX = (winW - W * SC) / 2; OY = (winH - H * SC) / 2;
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 120));
resize();

/* ---------- 小工具 ---------- */
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function rand(a, b) { return a + Math.random() * (b - a); }
function randi(a, b) { return Math.floor(rand(a, b + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const ease = {
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inCubic: t => t * t * t,
  inOut: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outElastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (TAU / 3)) + 1,
  sine: t => .5 - Math.cos(t * PI) / 2,
};
function hex2rgb(h) {
  if (h[0] === '#') h = h.slice(1);
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgb2hex(r, g, b) {
  return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}
function mix(c1, c2, t) {
  const a = hex2rgb(c1), b = hex2rgb(c2);
  return rgb2hex(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));
}
function shade(c, amt) { return amt >= 0 ? mix(c, '#ffffff', amt) : mix(c, '#000000', -amt); }
function rgba(c, a) { const [r, g, b] = hex2rgb(c); return `rgba(${r},${g},${b},${a})`; }
function hsl(h, s, l, a = 1) { return `hsla(${h},${s}%,${l}%,${a})`; }
function fmt(n) { return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

/* ---------- 存檔 ---------- */
const SAVE_KEY = 'frogcross_save_v1';
const Save = {
  d: null,
  def() {
    return {
      coins: 0, gems: 0, stars: {}, best: {},
      up: { hearts: 0, magnet: 0, power: 0, ammo: 0, luck: 0 },
      skins: ['green'], hats: ['none'], skin: 'green', hat: 'none',
      sound: true, music: true, vib: true, dpad: true,
      played: 0, totalCoins: 0, kills: 0, hops: 0, seenTut: false,
      weaponsSeen: [], mutsSeen: [], bossKills: 0,
      lastLevel: 0, world: 0, // 上次玩到哪一關、地圖停在哪個世界（下次接續）
    };
  },
  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { }
    const def = this.def();
    this.d = Object.assign(def, d || {});
    this.d.up = Object.assign(def.up, (d && d.up) || {});
    return this.d;
  },
  write() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.d)); } catch (e) { } },
  starsOf(id) { return this.d.stars[id] || 0; },
  totalStars() { let n = 0; for (const k in this.d.stars) n += this.d.stars[k]; return n; },
  unlocked(id) { return id === 0 || (this.d.stars[id - 1] || 0) > 0; },
  /* 下一個該玩的關卡 = 第一個還沒通關的關卡（全破則回傳最後一關） */
  nextLevel() { for (let i = 0; i < TOTAL_LEVELS; i++) if (!(this.d.stars[i] > 0)) return i; return TOTAL_LEVELS - 1; },
  clearedCount() { let n = 0; for (let i = 0; i < TOTAL_LEVELS; i++) if (this.d.stars[i] > 0) n++; return n; },
};

/* ---------- 輸入 ---------- */
const Input = {
  keys: {}, pointers: new Map(),
  toLogical(e) { return { x: (e.clientX - OX) / SC, y: (e.clientY - OY) / SC }; },
};
canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  try { canvas.setPointerCapture(e.pointerId); } catch (_) { }
  const p = Input.toLogical(e);
  Input.pointers.set(e.pointerId, { x: p.x, y: p.y, sx: p.x, sy: p.y, t: performance.now() });
  SND.unlock();
  Game.onDown(p.x, p.y, e.pointerId);
}, { passive: false });
canvas.addEventListener('pointermove', e => {
  e.preventDefault();
  const p = Input.toLogical(e);
  const rec = Input.pointers.get(e.pointerId);
  if (rec) { rec.x = p.x; rec.y = p.y; }
  Game.onMove(p.x, p.y, e.pointerId);
}, { passive: false });
const upHandler = e => {
  e.preventDefault();
  const p = Input.toLogical(e);
  Game.onUp(p.x, p.y, e.pointerId);
  Input.pointers.delete(e.pointerId);
};
canvas.addEventListener('pointerup', upHandler, { passive: false });
canvas.addEventListener('pointercancel', upHandler, { passive: false });
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('wheel', e => { e.preventDefault(); Game.onWheel && Game.onWheel(e.deltaY); }, { passive: false });
window.addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Tab'].includes(e.key)) e.preventDefault();
  if (e.repeat) return;
  Input.keys[e.key] = true;
  SND.unlock();
  Game.onKey(e.key, e);
});
window.addEventListener('keyup', e => { Input.keys[e.key] = false; Game.onKeyUp && Game.onKeyUp(e.key); });
window.addEventListener('blur', () => { Input.keys = {}; Game.onBlur && Game.onBlur(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) Game.onBlur && Game.onBlur(); });
/* Android 返回鍵 */
window.onAndroidBack = function () { return Game.onBack ? Game.onBack() : false; };
function vibrate(ms) {
  if (!Save.d || !Save.d.vib) return;
  try { if (window.AndroidBridge && AndroidBridge.vibrate) AndroidBridge.vibrate(ms); else if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { }
}

/* ---------- 特效粒子（世界座標：x 向右，y 向上） ---------- */
const FX = {
  list: [], shake: 0, flash: 0, flashColor: '#fff',
  add(p) { p.age = 0; p.life = p.life || 1; this.list.push(p); return p; },
  burst(x, y, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = o.angle !== undefined ? o.angle + rand(-(o.spread || PI), (o.spread || PI)) : rand(0, TAU);
      const s = rand(o.min || 40, o.max || 180);
      this.add({
        type: o.type || 'dot', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s + (o.up || 0),
        g: o.g === undefined ? 520 : o.g, size: rand(o.s0 || 3, o.s1 || 6), life: rand(o.l0 || .4, o.l1 || .9),
        color: Array.isArray(o.color) ? pick(o.color) : (o.color || '#fff'), rot: rand(0, TAU), vr: rand(-8, 8),
        shrink: o.shrink === undefined ? true : o.shrink, glow: o.glow,
      });
    }
  },
  ring(x, y, color = '#fff', r1 = 40, life = .5, width = 4) {
    this.add({ type: 'ring', x, y, r0: 4, r1, color, life, width });
  },
  text(x, y, str, color = '#fff', size = 22, life = 1) {
    this.add({ type: 'text', x, y, vx: 0, vy: 60, g: 0, str, color, size, life });
  },
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.age += dt;
      if (p.age >= p.life) { this.list.splice(i, 1); continue; }
      if (p.type !== 'ring') {
        p.vy -= (p.g || 0) * dt; p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt;
        if (p.rot !== undefined) p.rot += (p.vr || 0) * dt;
      }
    }
    this.shake = Math.max(0, this.shake - dt * 30);
    this.flash = Math.max(0, this.flash - dt * 2.5);
  },
  draw(c, sy) { // sy: (wy)=>screen y
    for (const p of this.list) {
      const k = p.age / p.life, a = 1 - k;
      const x = p.x, y = sy(p.y);
      c.save();
      if (p.type === 'dot') {
        c.globalAlpha = Math.min(1, a * 1.6);
        c.fillStyle = p.color;
        const r = p.size * (p.shrink ? (1 - k * .7) : 1);
        if (p.glow) { c.shadowColor = p.color; c.shadowBlur = 8; }
        c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      } else if (p.type === 'sq') {
        c.globalAlpha = Math.min(1, a * 2); c.translate(x, y); c.rotate(p.rot);
        c.fillStyle = p.color; const s = p.size; c.fillRect(-s, -s * .6, s * 2, s * 1.2);
      } else if (p.type === 'star') {
        c.globalAlpha = Math.min(1, a * 1.5); c.translate(x, y); c.rotate(p.rot);
        c.fillStyle = p.color; Icons.starPath(c, 0, 0, p.size * (1 - k * .5), p.size * .45 * (1 - k * .5)); c.fill();
      } else if (p.type === 'ring') {
        const r = lerp(p.r0, p.r1, ease.outCubic(k));
        c.globalAlpha = a; c.strokeStyle = p.color; c.lineWidth = p.width * a + .5;
        c.beginPath(); c.ellipse(x, y, r, r * .55, 0, 0, TAU); c.stroke();
      } else if (p.type === 'text') {
        c.globalAlpha = Math.min(1, a * 2.2);
        const sc = k < .15 ? ease.outBack(k / .15) : 1;
        c.translate(x, y); c.scale(sc, sc);
        UI.text(c, p.str, 0, 0, { size: p.size, color: p.color, stroke: '#2a1a0a', strokeW: 5, weight: 900, align: 'center' });
      } else if (p.type === 'smoke') {
        c.globalAlpha = a * .55; c.fillStyle = p.color;
        c.beginPath(); c.arc(x, y, p.size * (1 + k * 1.6), 0, TAU); c.fill();
      } else if (p.type === 'leaf') {
        c.globalAlpha = Math.min(1, a * 2); c.translate(x, y); c.rotate(p.rot); c.fillStyle = p.color;
        c.beginPath(); c.ellipse(0, 0, p.size, p.size * .5, 0, 0, TAU); c.fill();
      }
      c.restore();
    }
  },
  clear() { this.list.length = 0; this.shake = 0; this.flash = 0; },
};

/* ---------- 圖形小幫手 ---------- */
function rr(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function vgrad(c, y0, y1, stops) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  stops.forEach((s, i) => { if (Array.isArray(s)) g.addColorStop(s[0], s[1]); else g.addColorStop(i / (stops.length - 1), s); });
  return g;
}
function grad(c, x0, y0, x1, y1, cols) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col));
  return g;
}
function radial(c, x, y, r0, r1, cols) {
  const g = c.createRadialGradient(x, y, r0, x, y, r1);
  cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col));
  return g;
}
function ell(c, x, y, rx, ry, fill, stroke, lw) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1; c.stroke(); }
}
function circ(c, x, y, r, fill, stroke, lw) {
  c.beginPath(); c.arc(x, y, r, 0, TAU);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1; c.stroke(); }
}
function poly(c, pts, fill, stroke, lw) {
  c.beginPath(); c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1; c.lineJoin = 'round'; c.stroke(); }
}
function shadowEll(c, x, y, rx, ry, a = .28) {
  c.save(); c.fillStyle = `rgba(0,0,0,${a})`; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); c.restore();
}

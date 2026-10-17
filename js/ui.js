'use strict';
/* =====================================================================
   介面工具：立即模式按鈕 / 面板 / 文字（全部畫在 canvas 上）
   ===================================================================== */
const BTN_STYLES = {
  green: ['#9bea5c', '#43b52c', '#287a1a'],
  orange: ['#ffcf5c', '#ff8d22', '#b5540c'],
  blue: ['#7ad6ff', '#3392ea', '#1b58a8'],
  red: ['#ff9985', '#e8452f', '#9c2012'],
  purple: ['#cfa6ff', '#8d58e3', '#56309d'],
  gold: ['#fff08a', '#f4b92c', '#a8720c'],
  dark: ['#6a7b8c', '#3b4856', '#222b34'],
  white: ['#ffffff', '#dde8ef', '#9aaebd'],
  pink: ['#ffb3dd', '#f0599f', '#a52a68'],
  teal: ['#8ff2e0', '#25b9a5', '#157569'],
};

const UI = {
  hits: [], prev: [], down: null, downPos: null, clickId: null, moved: false, t: 0,
  frame(dt) {
    this.t += dt;
    this.prev = this.hits; this.hits = [];
    this.cur = this.clickId; this.clickId = null;
  },
  clearHits() { this.hits.length = 0; },
  hitAt(x, y) {
    for (let i = this.prev.length - 1; i >= 0; i--) {
      const h = this.prev[i];
      if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h;
    }
    return null;
  },
  pointerDown(x, y) {
    const h = this.hitAt(x, y);
    this.down = h ? h.id : null; this.downPos = { x, y }; this.moved = false;
    return !!h;
  },
  pointerMove(x, y) {
    if (this.downPos && Math.hypot(x - this.downPos.x, y - this.downPos.y) > 14) this.moved = true;
  },
  pointerUp(x, y) {
    const h = this.hitAt(x, y);
    let fired = false;
    if (h && this.down === h.id && !this.moved) { this.clickId = h.id; fired = true; }
    this.down = null; this.downPos = null;
    return fired;
  },
  clicked(id) { return this.cur === id; },

  /* ----- 文字 ----- */
  text(c, str, x, y, o = {}) {
    const size = o.size || 20;
    c.save();
    c.font = `${o.italic ? 'italic ' : ''}${o.weight || 700} ${size}px ${o.font || FONT}`;
    c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'middle';
    if (o.maxW) {
      const w = c.measureText(str).width;
      if (w > o.maxW) { c.font = `${o.italic ? 'italic ' : ''}${o.weight || 700} ${Math.floor(size * o.maxW / w)}px ${o.font || FONT}`; }
    }
    if (o.shadow) { c.fillStyle = o.shadow; c.fillText(str, x + (o.sx || 0), y + (o.sy || 2)); }
    if (o.stroke) { c.lineJoin = 'round'; c.lineWidth = o.strokeW || 4; c.strokeStyle = o.stroke; c.strokeText(str, x, y); }
    c.fillStyle = o.color || '#fff';
    if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = o.glowR || 10; }
    c.fillText(str, x, y);
    c.restore();
  },
  measure(c, str, size, weight = 700) {
    c.save(); c.font = `${weight} ${size}px ${FONT}`; const w = c.measureText(str).width; c.restore(); return w;
  },

  /* ----- 面板 ----- */
  panel(c, x, y, w, h, o = {}) {
    const r = o.r === undefined ? 16 : o.r;
    c.save();
    if (o.shadow !== false) { c.fillStyle = 'rgba(0,0,0,.28)'; rr(c, x + 2, y + 6, w, h, r); c.fill(); }
    rr(c, x, y, w, h, r);
    c.fillStyle = o.edge || '#1d2c3a'; c.fill();
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, o.top || '#fff6dc'); g.addColorStop(1, o.bot || '#f3dca8');
    rr(c, x + 3, y + 3, w - 6, h - 6, Math.max(2, r - 3)); c.fillStyle = g; c.fill();
    if (o.gloss !== false) {
      c.save(); rr(c, x + 3, y + 3, w - 6, h - 6, Math.max(2, r - 3)); c.clip();
      c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(x, y, w, h * .38); c.restore();
    }
    c.restore();
  },
  glass(c, x, y, w, h, o = {}) { // 半透明深色面板
    c.save();
    rr(c, x, y, w, h, o.r === undefined ? 14 : o.r);
    c.fillStyle = o.fill || 'rgba(8,20,30,.55)'; c.fill();
    c.lineWidth = 2; c.strokeStyle = o.border || 'rgba(255,255,255,.28)'; c.stroke();
    c.restore();
  },

  /* ----- 按鈕 ----- */
  button(c, id, x, y, w, h, label, o = {}) {
    const st = BTN_STYLES[o.style || 'green'];
    const dis = !!o.disabled;
    if (!o.noHit) this.hits.push({ id, x, y, w, h });
    const pressed = this.down === id && !dis;
    let sc = 1;
    if (o.pulse) sc = 1 + Math.sin(this.t * 4) * .03;
    const cx = x + w / 2, cy = y + h / 2;
    c.save();
    c.translate(cx, cy); c.scale(sc * (pressed ? .96 : 1), sc * (pressed ? .96 : 1)); c.translate(-cx, -cy);
    const dy = pressed ? 3 : 0, depth = pressed ? 2 : 5, r = o.r === undefined ? Math.min(16, h / 2.4) : o.r;
    if (!pressed) { c.fillStyle = 'rgba(0,0,0,.3)'; rr(c, x, y + depth + 4, w, h, r); c.fill(); }
    const top = dis ? '#b7c0c8' : st[0], bot = dis ? '#8e9aa4' : st[1], edge = dis ? '#5f6a73' : st[2];
    rr(c, x, y + dy + depth, w, h, r); c.fillStyle = edge; c.fill();
    const g = c.createLinearGradient(0, y + dy, 0, y + dy + h);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    rr(c, x, y + dy, w, h, r); c.fillStyle = g; c.fill();
    c.lineWidth = 2.5; c.strokeStyle = 'rgba(20,30,40,.55)'; c.stroke();
    // 高光
    c.save(); rr(c, x + 3, y + dy + 3, w - 6, h - 6, Math.max(2, r - 3)); c.clip();
    const g2 = c.createLinearGradient(0, y + dy, 0, y + dy + h * .55);
    g2.addColorStop(0, 'rgba(255,255,255,.55)'); g2.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g2; c.fillRect(x, y + dy, w, h * .55);
    if (o.shine) { // 掃光
      const sx = x + ((this.t * 90) % (w + 80)) - 40;
      c.fillStyle = 'rgba(255,255,255,.35)';
      c.beginPath(); c.moveTo(sx, y + dy); c.lineTo(sx + 18, y + dy); c.lineTo(sx - 6, y + dy + h); c.lineTo(sx - 24, y + dy + h); c.closePath(); c.fill();
    }
    c.restore();
    // 內容
    const fs = o.size || Math.min(26, h * .46);
    if (o.icon) {
      const iw = o.iconSize || h * .6;
      if (label) {
        const tw = this.measure(c, label, fs, 900);
        const total = iw + 8 + tw, sx = cx - total / 2;
        o.icon(c, sx + iw / 2, cy + dy, iw, this.t);
        this.text(c, label, sx + iw + 8, cy + dy + 1, { size: fs, weight: 900, color: dis ? '#e8edf1' : '#fff', stroke: 'rgba(20,30,40,.75)', strokeW: 5 });
      } else o.icon(c, cx, cy + dy, iw, this.t);
    } else if (label) {
      this.text(c, label, cx, cy + dy + 1, { size: fs, weight: 900, align: 'center', color: dis ? '#e8edf1' : (o.color || '#fff'), stroke: 'rgba(20,30,40,.75)', strokeW: 5, maxW: w - 16 });
    }
    if (o.badge) {
      circ(c, x + w - 4, y + 4, 11, '#ff3b3b', '#fff', 2.5);
      this.text(c, String(o.badge), x + w - 4, y + 5, { size: 13, weight: 900, align: 'center' });
    }
    c.restore();
    return this.cur === id;
  },
  roundIcon(c, id, x, y, r, iconFn, o = {}) { // 圓形小按鈕
    return this.button(c, id, x - r, y - r, r * 2, r * 2, '', Object.assign({ r: r, icon: iconFn, iconSize: r * 1.15 }, o));
  },
  stars(c, cx, cy, n, size = 22, max = 3, gap = 4, anim = 1) { // 星星列
    const total = max * size + (max - 1) * gap;
    for (let i = 0; i < max; i++) {
      const x = cx - total / 2 + size / 2 + i * (size + gap);
      const on = i < n;
      c.save();
      if (on) { const k = clamp(anim * max - i, 0, 1); const s = ease.outBack(k); c.translate(x, cy); c.scale(s, s); Icons.star(c, 0, 0, size * .56, true); }
      else { Icons.star(c, x, cy, size * .5, false); }
      c.restore();
    }
  },
  counter(c, x, y, w, h, icon, val, color = '#ffe27a') { // 計數膠囊
    this.glass(c, x, y, w, h, { r: h / 2, fill: 'rgba(8,20,30,.62)' });
    icon(c, x + h / 2, y + h / 2, h * .78, this.t);
    this.text(c, val, x + w - 10, y + h / 2 + 1, { size: h * .56, weight: 900, color, align: 'right', stroke: 'rgba(0,0,0,.6)', strokeW: 4 });
  },
};

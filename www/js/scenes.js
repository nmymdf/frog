'use strict';
/* =====================================================================
   封面 / 選關地圖 / 蛙蛙商店 / 結算畫面 / 設定
   ===================================================================== */

/* ---------- 共用小工具 ---------- */
function credit(c, x, y, o = {}) { // 作者署名：金色斜體 + 版本
  UI.text(c, AUTHOR + '  ' + VERSION, x, y, { size: o.size || 13, color: o.color || '#ffd24a', stroke: o.stroke === undefined ? 'rgba(0,0,0,.55)' : o.stroke, strokeW: 3.5, italic: true, align: o.align || 'center', weight: 800 });
}
function checkMark(c, x, y, s, ok) {
  c.save();
  circ(c, x, y, s / 2, ok ? '#3fc02f' : '#6b7885', ok ? '#1b6e12' : '#3a444e', 2);
  c.strokeStyle = '#fff'; c.lineWidth = s * .14; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
  if (ok) { c.moveTo(x - s * .22, y + s * .02); c.lineTo(x - s * .05, y + s * .2); c.lineTo(x + s * .25, y - s * .17); }
  else { c.moveTo(x - s * .17, y - s * .17); c.lineTo(x + s * .17, y + s * .17); c.moveTo(x + s * .17, y - s * .17); c.lineTo(x - s * .17, y + s * .17); }
  c.stroke(); c.restore();
}
function sunburst(c, cx, cy, R, t, col, n = 14) {
  c.save(); c.translate(cx, cy); c.rotate(t * .25);
  for (let i = 0; i < n; i++) { const a = i * TAU / n; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, a, a + TAU / n / 2); c.closePath(); c.fillStyle = col; c.fill(); }
  c.restore();
}
function topBar(c, title, opts = {}) { // 地圖/商店共用頂端列
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, W, 64);
  c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(0, 62, W, 2);
  UI.roundIcon(c, opts.backId || 'back', 34, 32, 22, Icons.back, { style: 'orange' });
  UI.text(c, title, opts.titleX || 226, 33, { size: 26, color: '#fff', stroke: 'rgba(0,0,0,.6)', strokeW: 6, align: 'center', weight: 900 });
}
function wallet(c, x, y) {
  UI.counter(c, x, y, 112, 28, Icons.coin, fmt(Save.d.coins));
  UI.counter(c, x + 118, y, 84, 28, (cc, a, b, s, t) => Icons.gem(cc, a, b, s, t), fmt(Save.d.gems), '#9defff');
}

/* ---------- 設定視窗 ---------- */
/* 畫面方向：橫式／直式／自動。手機（APK）會通知外殼旋轉畫面，網頁版則直接換版面 */
const ORIENTS = [['land', '橫式'], ['port', '直式'], ['auto', '自動']];
function setOrient(m) {
  Save.d.orient = m; Save.write();
  try { if (window.AndroidBridge && AndroidBridge.setOrientation) AndroidBridge.setOrientation(m); } catch (e) { }
  resize();
}
const SettingsPanel = {
  open: false, confirm: false,
  show() { this.open = true; this.confirm = false; SND.play('click'); },
  update() {
    if (!this.open) return false;
    if (this.confirm) {
      if (UI.clicked('s_no')) { this.confirm = false; SND.play('back'); }
      if (UI.clicked('s_yes')) { Save.d = Save.def(); Save.write(); setOrient(Save.d.orient); this.confirm = false; this.open = false; SND.play('lose'); SND.refreshMusic(); resize(); Game.go('cover'); }
      return true;
    }
    if (UI.clicked('s_close')) { this.open = false; SND.play('back'); }
    if (UI.clicked('s_snd')) { Save.d.sound = !Save.d.sound; Save.write(); SND.play('click'); }
    if (UI.clicked('s_mus')) { Save.d.music = !Save.d.music; Save.write(); SND.refreshMusic(); SND.play('click'); }
    if (UI.clicked('s_vib')) { Save.d.vib = !Save.d.vib; Save.write(); vibrate(60); SND.play('click'); }
    if (UI.clicked('s_dpad')) { Save.d.dpad = !Save.d.dpad; Save.write(); SND.play('click'); }
    for (const [m] of ORIENTS) if (UI.clicked('s_o_' + m) && orientMode() !== m) { setOrient(m); SND.play('click'); }
    if (UI.clicked('s_reset')) { this.confirm = true; SND.play('click'); }
    return true;
  },
  back() { if (!this.open) return false; if (this.confirm) this.confirm = false; else this.open = false; SND.play('back'); return true; },
  /* 三段式選擇器（橫式／直式／自動） */
  orientRow(c, x, y, w, h, size) {
    const cur = orientMode(), gap = 4, bw = (w - gap * 2) / 3;
    ORIENTS.forEach(([m, label], i) => UI.button(c, 's_o_' + m, x + i * (bw + gap), y, bw, h, label, { style: cur === m ? 'orange' : 'dark', size, noHit: false }));
  },
  draw(c) {
    if (!this.open) return;
    c.fillStyle = 'rgba(0,0,0,.62)'; c.fillRect(0, 0, SW, SH);
    UI.clearHits();
    const rows = [['音效', 'sound', 's_snd', '開', '關'], ['背景音樂', 'music', 's_mus', '開', '關'], ['震動', 'vib', 's_vib', '開', '關'], ['螢幕方向鍵', 'dpad', 's_dpad', '顯示', '隱藏']];
    if (LAND) {
      const pw = 660, ph = 368, px = (SW - pw) / 2, py = (SH - ph) / 2;
      UI.panel(c, px, py, pw, ph, { r: 28 });
      UI.text(c, '設定', SW / 2, py + 34, { size: 34, color: '#8a4a10', align: 'center', weight: 900 });
      const cw = 296, gx = 28, x0 = px + (pw - 2 * cw - gx) / 2;
      rows.forEach((r, i) => {
        const cx = x0 + (i % 2) * (cw + gx), y = py + 66 + Math.floor(i / 2) * 62, on = Save.d[r[1]];
        UI.text(c, r[0], cx + 4, y + 25, { size: 21, color: '#6b4318', weight: 900 });
        UI.button(c, r[2], cx + cw - 112, y, 112, 50, on ? r[3] : r[4], { style: on ? 'green' : 'dark', size: 21 });
      });
      const oy = py + 196;
      UI.text(c, '畫面方向', x0 + 4, oy + 25, { size: 21, color: '#6b4318', weight: 900 });
      this.orientRow(c, x0 + cw + gx - 70, oy, cw + 70, 50, 20);
      UI.text(c, '「自動」會跟著手機轉；「橫式」是建議的玩法', x0 + 4, oy + 62, { size: 12.5, color: '#8a6a3a', weight: 700 });
      UI.button(c, 's_reset', x0, py + 290, 220, 52, '清除所有進度', { style: 'red', size: 19 });
      UI.button(c, 's_close', x0 + 2 * cw + gx - 250, py + 286, 250, 58, '完成', { style: 'blue', size: 26 });
      credit(c, SW / 2, py + ph - 13, { size: 12.5, stroke: null, color: '#b87a0c' });
    } else {
      UI.panel(c, 36, 110, W - 72, 700, { r: 28 });
      UI.text(c, '設定', W / 2, 166, { size: 38, color: '#8a4a10', align: 'center', weight: 900 });
      rows.forEach((r, i) => {
        const y = 206 + i * 70, on = Save.d[r[1]];
        UI.text(c, r[0], 66, y + 26, { size: 23, color: '#6b4318', weight: 900 });
        UI.button(c, r[2], 270, y, 118, 52, on ? r[3] : r[4], { style: on ? 'green' : 'dark', size: 22 });
        if (i === 3 && !on) UI.text(c, '隱藏後在畫面滑動或點一下來跳', 66, y + 60, { size: 11.5, color: '#8a6a3a', weight: 700 });
      });
      const oy = 206 + 4 * 70;
      UI.text(c, '畫面方向', 66, oy + 26, { size: 23, color: '#6b4318', weight: 900 });
      this.orientRow(c, 190, oy, 198, 52, 19);
      UI.text(c, '「自動」會跟著手機轉；「橫式」是建議的玩法', 66, oy + 66, { size: 11.5, color: '#8a6a3a', weight: 700 });
      UI.button(c, 's_reset', 66, 596, W - 132, 52, '清除所有進度', { style: 'red', size: 20 });
      UI.button(c, 's_close', 100, 676, W - 200, 60, '完成', { style: 'blue', size: 26 });
      credit(c, W / 2, 776, { size: 14, stroke: null });
    }
    if (this.confirm) {
      c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, 0, SW, SH); UI.clearHits();
      const pw = LAND ? 500 : W - 100, ph = LAND ? 250 : 250, px = (SW - pw) / 2, py = LAND ? (SH - ph) / 2 : 330;
      UI.panel(c, px, py, pw, ph, { r: 26 });
      UI.text(c, '確定要清除嗎？', SW / 2, py + 52, { size: 30, color: '#a02a1a', align: 'center', weight: 900 });
      UI.text(c, '所有關卡、金幣、造型都會歸零', SW / 2, py + 98, { size: 16, color: '#6b4318', align: 'center', weight: 800, maxW: pw - 60 });
      UI.text(c, '此動作無法復原', SW / 2, py + 124, { size: 16, color: '#a02a1a', align: 'center', weight: 800 });
      UI.button(c, 's_no', px + 26, py + 154, (pw - 76) / 2, 56, '取消', { style: 'blue', size: 22 });
      UI.button(c, 's_yes', px + pw - 26 - (pw - 76) / 2, py + 154, (pw - 76) / 2, 56, '確定清除', { style: 'red', size: 22 });
    }
  },
};

/* =====================================================================
   封面
   ===================================================================== */
class CoverScene {
  constructor() {
    this.t = 0; this.hop = { k: 1, next: 1.2, dir: 1 }; this.blinkT = 2;
    this.minis = [
      { x: 64, y: 438, skin: 'pink', hat: 'flower', ph: 0, s: 1.1 },
      { x: 388, y: 452, skin: 'blue', hat: 'cowboy', ph: 2.1, s: 1.1 },
    ];
    SND.music('cover'); Weather.init('pollen', SW, 0, SH); FX.clear();
  }
  onBack() { return SettingsPanel.back(); }
  onDown(x, y) { UI.pointerDown(x, y); }
  onMove(x, y) { UI.pointerMove(x, y); }
  onUp(x, y) { UI.pointerUp(x, y); }
  onKey(k) {
    if (SettingsPanel.open) { if (k === 'Escape') SettingsPanel.back(); return; }
    if (k === 'Enter' || k === ' ') this.start();
    if (k === 'm' || k === 'M') Game.go('map');
  }
  start() { SND.play('click'); Game.go('play', Save.nextLevel()); }
  update(dt) {
    UI.frame(dt); this.t += dt; FX.update(dt); Weather.update(dt);
    if (SettingsPanel.update()) return;
    // 主角偶爾跳一下
    const h = this.hop; h.next -= dt;
    if (h.k < 1) h.k += dt / .55;
    else if (h.next <= 0) { h.k = 0; h.next = 2.4 + Math.random() * 1.6; h.dir = -h.dir; SND.play('hop'); }
    this.blinkT -= dt; if (this.blinkT < -.14) this.blinkT = 2 + Math.random() * 2.5;
    if (UI.clicked('c_play')) this.start();
    if (UI.clicked('c_map')) { SND.play('click'); Game.go('map'); }
    if (UI.clicked('c_shop')) { SND.play('click'); Game.go('shop', 'cover'); }
    if (UI.clicked('c_set')) SettingsPanel.show();
    if (UI.clicked('c_snd')) { Save.d.sound = !Save.d.sound; Save.write(); SND.play('click'); }
    if (UI.clicked('c_mus')) { Save.d.music = !Save.d.music; Save.write(); SND.refreshMusic(); }
  }

  background(c, t) {
    c.fillStyle = vgrad(c, 0, 420, ['#4fb6ff', '#a6e4ff', '#e9fbff']); c.fillRect(0, 0, W, 430);
    // 太陽
    circ(c, 350, 168, 74, radial(c, 350, 168, 10, 80, ['rgba(255,244,170,.95)', 'rgba(255,230,120,0)']));
    circ(c, 350, 168, 30, '#fff3a0'); circ(c, 350, 168, 24, '#ffe55a');
    Scenes.cloud(c, (t * 7) % (W + 140) - 90, 230, 1.15, 'rgba(255,255,255,.96)');
    Scenes.cloud(c, (t * 4.5 + 240) % (W + 140) - 90, 290, .8);
    Scenes.cloud(c, (t * 9 + 120) % (W + 140) - 90, 120, .6, 'rgba(255,255,255,.85)');
    Scenes.hills(c, W, 330, 16, '#9fd9ad', 2); Scenes.hills(c, W, 360, 14, '#62c05c', 5, .03);
    for (let i = 0; i < 10; i++) { const tx = 14 + i * 46 + (i % 2) * 6, ty = 386 + Math.sin(i * 2.1) * 5; Props.draw(c, i % 3 === 1 ? 'bush' : 'tree', tx, ty, t, i / 10, 0); }
    // 池塘
    c.fillStyle = vgrad(c, 392, SH, ['#46b4ea', '#2284c6', '#0f4f86']); c.fillRect(0, 396, W, SH);
    c.fillStyle = vgrad(c, 392, 470, ['rgba(255,255,255,.35)', 'rgba(255,255,255,0)']); c.fillRect(0, 396, W, 80);
    c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 2; c.lineCap = 'round';
    for (let i = 0; i < 16; i++) { const yy = 420 + i * 32 + Math.sin(i) * 6, xx = ((t * (10 + i % 4 * 4) + i * 83) % (W + 120)) - 60; c.beginPath(); c.moveTo(xx, yy); c.quadraticCurveTo(xx + 20, yy - 5, xx + 40, yy); c.stroke(); }
    // 荷葉、蓮花
    const pads = [[40, 800, 1], [160, 860, .8], [390, 820, 1.1], [300, 880, .7], [96, 700, .75], [420, 700, .8], [30, 600, .6], [430, 590, .7]];
    for (const [px, py, s] of pads) { const bob = Math.sin(t * 1.4 + px) * 1.5; this.lily(c, px, py + bob, 38 * s, px % 3 === 0); }
    // 蘆葦
    for (const [rx, ry] of [[10, 760], [438, 775], [22, 640], [430, 640]]) this.reed(c, rx, ry, t);
  }
  lily(c, x, y, r, flower) {
    c.save(); c.translate(x, y);
    shadowEll(c, 2, r * .22 + 4, r, r * .42, .22);
    c.beginPath(); c.moveTo(0, 0); c.ellipse(0, 0, r, r * .42, 0, .22, TAU - .22); c.closePath();
    c.fillStyle = grad(c, 0, -r * .4, 0, r * .4, ['#7edc5a', '#37a63a', '#1f7a2a']); c.fill(); c.strokeStyle = '#17591f'; c.lineWidth = 2; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1.4; for (let i = 0; i < 6; i++) { const a = .6 + i * 1; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r * .86, Math.sin(a) * r * .34); c.stroke(); }
    if (flower) { for (let i = 0; i < 8; i++) { const a = i * TAU / 8; ell(c, Math.cos(a) * r * .22, -r * .14 + Math.sin(a) * r * .1, r * .17, r * .07, i % 2 ? '#ff9ccc' : '#ffc4e1', '#d4569a', 1); } circ(c, 0, -r * .14, r * .08, '#ffe14a'); }
    c.restore();
  }
  reed(c, x, y, t) {
    c.save(); c.translate(x, y);
    for (let i = 0; i < 4; i++) { const sw = Math.sin(t * 1.2 + i + x) * 4, hh = 70 + i * 14; c.strokeStyle = '#2f7a2d'; c.lineWidth = 3.2; c.beginPath(); c.moveTo(i * 7 - 10, 0); c.quadraticCurveTo(i * 7 - 10 + sw, -hh * .5, i * 7 - 10 + sw * 1.6, -hh); c.stroke(); if (i % 2 === 0) { rr(c, i * 7 - 13 + sw * 1.5, -hh - 16, 7, 22, 3); c.fillStyle = '#7a4a1e'; c.fill(); } }
    c.restore();
  }

  draw(c) { if (LAND) this.drawL(c); else this.drawP(c); }
  drawP(c) {
    const t = this.t;
    this.background(c, t);
    // 蜜蜂飛過
    Fly.draw(c, 'bee', ((t * 48) % (W + 120)) - 60, 215 + Math.sin(t * 3) * 14, 1, t, 1.05);
    Fly.draw(c, 'bee', W + 60 - ((t * 36 + 200) % (W + 120)), 300 + Math.sin(t * 2.4) * 10, -1, t + 1, .85);
    // 小青蛙
    for (const m of this.minis) {
      this.lily(c, m.x, m.y + 22, 40, false);
      const k = (t * .8 + m.ph) % 4, hop = k < .5 ? Math.sin(k / .5 * PI) : 0;
      FrogArt.front(c, m.x, m.y + 20, { s: .72, t, skin: m.skin, hat: m.hat, hop, z: hop * 26, mood: 'happy', blink: 0, sy: 1 + Math.sin(t * 2 + m.ph) * .02, look: [Math.sin(t + m.ph), 0] });
    }
    // 主角
    const h = this.hop, hk = h.k < 1 ? Math.sin(h.k * PI) : 0;
    this.lily(c, 225, 432, 96, true);
    FrogArt.front(c, 225, 427, {
      s: 1.65, t, skin: Save.d.skin, hat: Save.d.hat, hop: hk, z: hk * 80,
      sx: 1 - hk * .05 + Math.sin(t * 2) * .012, sy: 1 + hk * .07 + Math.sin(t * 2 + 1) * .02, mood: 'happy', blink: this.blinkT < 0 ? 1 : 0, look: [Math.sin(t * .8) * .7, 0],
    });
    Weather.draw(c, t);

    // 標題
    const letters = ['青', '蛙', '過', '河'], cols = [['#d8ff8a', '#7be04b', '#3fa02a'], ['#fff3a0', '#ffd23a', '#e89a10'], ['#ffd0a0', '#ff8a2e', '#d4500c'], ['#c8f0ff', '#4cc6ff', '#1c86d4']];
    letters.forEach((ch, i) => {
      const bx = 225 + (i - 1.5) * 92, by = 108 + Math.sin(t * 2.2 + i * .9) * 5, rot = Math.sin(t * 1.6 + i) * .05;
      c.save(); c.translate(bx, by); c.rotate(rot - 0.04 + i * .02);
      UI.text(c, ch, 0, 10, { size: 100, color: 'rgba(0,0,0,.28)', align: 'center', weight: 900 });
      UI.text(c, ch, 0, 0, { size: 100, color: grad(c, 0, -46, 0, 50, cols[i]), stroke: '#173a14', strokeW: 17, align: 'center', weight: 900 });
      c.save(); c.globalAlpha = .5; UI.text(c, ch, -1, -3, { size: 100, color: 'rgba(255,255,255,0)', stroke: 'rgba(255,255,255,.7)', strokeW: 1.4, align: 'center', weight: 900 }); c.restore();
      c.restore();
    });
    // 副標題緞帶
    c.save(); c.translate(225, 196);
    poly(c, [-134, -4, -170, 16, -134, 36, -114, 12], '#b0420c', '#6a1e04', 2); poly(c, [134, -4, 170, 16, 134, 36, 114, 12], '#b0420c', '#6a1e04', 2);
    rr(c, -140, -12, 280, 44, 10); c.fillStyle = grad(c, 0, -12, 0, 32, ['#ffb066', '#ff7a1c', '#d8530a']); c.fill(); c.lineWidth = 3; c.strokeStyle = '#7a2a04'; c.stroke();
    c.save(); rr(c, -137, -9, 274, 20, 8); c.fillStyle = 'rgba(255,255,255,.28)'; c.fill(); c.restore();
    UI.text(c, '超級蛙蛙大冒險', 0, 11, { size: 24, color: '#fff', stroke: '#7a2a04', strokeW: 6, align: 'center', weight: 900 });
    c.restore();
    // 閃爍星星
    for (let i = 0; i < 6; i++) { const sx = [60, 390, 110, 340, 36, 420][i], sy2 = [64, 70, 168, 168, 140, 150][i]; c.save(); c.globalAlpha = .5 + Math.sin(t * 3 + i * 1.7) * .5; Icons.sparkle(c, sx, sy2, 7 + (i % 3) * 2); c.restore(); }

    // 按鈕
    const cleared = Save.clearedCount(), nl = Save.nextLevel(), nd = levelDef(nl);
    UI.button(c, 'c_play', 62, 506, 326, 76, cleared > 0 ? '繼續冒險' : '開始冒險', { style: 'green', icon: Icons.play, size: 32, pulse: true, shine: true });
    UI.text(c, `${nd.world.name} · 第 ${nd.li + 1} 關「${nd.def.name}」`, 225, 604, { size: 14, color: '#fff', stroke: 'rgba(0,30,60,.75)', strokeW: 4, align: 'center', weight: 800, maxW: 340 });
    UI.button(c, 'c_map', 62, 630, 326, 58, '選擇關卡', { style: 'blue', icon: Icons.map, size: 25 });
    UI.button(c, 'c_shop', 62, 700, 158, 56, '蛙蛙商店', { style: 'orange', icon: Icons.shop, size: 20 });
    UI.button(c, 'c_set', 230, 700, 158, 56, '設定', { style: 'purple', icon: Icons.gear, size: 22 });
    // 進度
    const pk = cleared / TOTAL_LEVELS;
    UI.glass(c, 62, 778, 326, 22, { r: 11, fill: 'rgba(0,20,50,.55)' });
    c.save(); rr(c, 65, 781, Math.max(10, 320 * pk), 16, 8); c.fillStyle = grad(c, 0, 781, 0, 797, ['#c4f58a', '#43b52c']); c.fill(); c.restore();
    UI.text(c, `冒險進度 ${cleared}/${TOTAL_LEVELS} 關`, 225, 790, { size: 12.5, color: '#fff', stroke: 'rgba(0,0,0,.6)', strokeW: 3.5, align: 'center', weight: 900 });
    Icons.star(c, 232 - 108, 822, 10, true); UI.text(c, `${Save.totalStars()} / ${TOTAL_LEVELS * 3}`, 232 - 94, 822, { size: 15, color: '#ffe27a', stroke: 'rgba(0,0,0,.6)', strokeW: 4, weight: 900 });
    Icons.crown(c, 232 + 40, 822, 22); UI.text(c, `魔王 ${Save.d.bossKills}/${WORLDS.length}`, 232 + 56, 822, { size: 15, color: '#fff', stroke: 'rgba(0,0,0,.6)', strokeW: 4, weight: 900 });
    // 角落
    wallet(c, 10, 10);
    UI.roundIcon(c, 'c_snd', 372, 24, 17, (cc, x, y, s) => Icons.speaker(cc, x, y, s, Save.d.sound), { style: Save.d.sound ? 'teal' : 'dark' });
    UI.roundIcon(c, 'c_mus', 416, 24, 17, (cc, x, y, s) => Icons.note(cc, x, y, s, Save.d.music), { style: Save.d.music ? 'purple' : 'dark' });
    credit(c, 225, 880, { size: 16 });
    UI.text(c, '把青蛙平安送到對岸吧!', 225, 902, { size: 12, color: 'rgba(255,255,255,.8)', stroke: 'rgba(0,30,60,.6)', strokeW: 3, align: 'center', weight: 700 });
    SettingsPanel.draw(c);
  }
}

/* =====================================================================
   選關地圖：6 個世界 × 8 關，自動記住上次玩到哪
   ===================================================================== */
const NODES = [[72, 745], [176, 705], [282, 742], [376, 692], [334, 614], [226, 572], [116, 516], [226, 405]];
class MapScene {
  constructor() {
    this.t = 0; this.swap = 1; this.shake = 0; this.toast = null; this.sw = null;
    let wi = Save.d.world; if (!(wi >= 0 && wi < WORLDS.length)) wi = Math.floor(Save.nextLevel() / LEVELS_PER_WORLD);
    this.wi = wi; this.pickDefault();
    SND.music('cover');
  }
  pickDefault() {
    const ll = Save.d.lastLevel || 0;
    if (Math.floor(ll / LEVELS_PER_WORLD) === this.wi) { this.sel = ll % LEVELS_PER_WORLD; return; }
    let s = 0; for (let li = 0; li < LEVELS_PER_WORLD; li++) { if (Save.unlocked(levelId(this.wi, li))) s = li; if (!(Save.starsOf(levelId(this.wi, li)) > 0)) break; }
    this.sel = s;
  }
  worldOpen(wi) { return Save.unlocked(levelId(wi, 0)); }
  changeWorld(d) {
    const nw = this.wi + d; if (nw < 0 || nw >= WORLDS.length) { SND.play('bump'); return; }
    this.wi = nw; this.swap = 0; Save.d.world = nw; Save.write(); this.pickDefault(); SND.play('swoosh');
  }
  start() {
    const lid = levelId(this.wi, this.sel);
    if (!Save.unlocked(lid)) { SND.play('deny'); this.say('先通關上一關才能解鎖喔!'); return; }
    Save.d.lastLevel = lid; Save.d.world = this.wi; Save.write(); SND.play('click'); Game.go('play', lid);
  }
  say(s) { this.toast = { s, t: 0 }; }
  onBack() { if (SettingsPanel.back()) return true; Game.go('cover'); return true; }
  onDown(x, y) { UI.pointerDown(x, y); this.sw = { x, y }; }
  onMove(x, y) { UI.pointerMove(x, y); }
  onUp(x, y) {
    UI.pointerUp(x, y);
    if (this.sw && !SettingsPanel.open && !(LAND && this.sw.x > 324)) { const dx = x - this.sw.x, dy = y - this.sw.y; if (Math.abs(dx) > 70 && Math.abs(dy) < 70) this.changeWorld(dx < 0 ? 1 : -1); }
    this.sw = null;
  }
  onKey(k) {
    if (SettingsPanel.open) { if (k === 'Escape') SettingsPanel.back(); return; }
    if (k === 'ArrowRight') this.changeWorld(1); else if (k === 'ArrowLeft') this.changeWorld(-1);
    else if (k === 'ArrowUp') { if (this.sel < 7) this.sel++; SND.play('click'); } else if (k === 'ArrowDown') { if (this.sel > 0) this.sel--; SND.play('click'); }
    else if (k === 'Enter' || k === ' ') this.start();
    else if (k === 'Escape') this.onBack();
  }
  update(dt) {
    UI.frame(dt); this.t += dt; this.swap = Math.min(1, this.swap + dt * 4.5);
    if (this.toast) { this.toast.t += dt; if (this.toast.t > 2) this.toast = null; }
    if (SettingsPanel.update()) return;
    if (UI.clicked('m_home')) { SND.play('back'); Game.go('cover'); }
    if (UI.clicked('m_shop')) { SND.play('click'); Game.go('shop', 'map'); }
    if (UI.clicked('m_gear')) SettingsPanel.show();
    if (UI.clicked('m_prev')) this.changeWorld(-1);
    if (UI.clicked('m_next')) this.changeWorld(1);
    if (UI.clicked('m_go')) this.start();
    for (let i = 0; i < WORLDS.length; i++) if (UI.clicked('wd' + i)) { if (i !== this.wi) this.changeWorld(i - this.wi); }
    for (let li = 0; li < LEVELS_PER_WORLD; li++) if (UI.clicked('n' + li)) {
      const lid = levelId(this.wi, li);
      if (!Save.unlocked(lid)) { SND.play('deny'); this.say('先通關前一關,這一關才會解鎖!'); this.shake = .4; this.shakeNode = li; }
      else if (this.sel === li) this.start();
      else { this.sel = li; SND.play('click'); }
    }
    this.shake = Math.max(0, this.shake - dt);
  }

  draw(c) { if (LAND) this.drawL(c); else this.drawP(c); }
  drawP(c) {
    const w = WORLDS[this.wi], t = this.t, acc = w.accent, wi = this.wi;
    c.fillStyle = vgrad(c, 0, SH, [shade(acc, -.62), shade(acc, -.86)]); c.fillRect(0, 0, W, SH);
    c.save(); c.strokeStyle = 'rgba(255,255,255,.045)'; c.lineWidth = 18; for (let x = -SH; x < W + 40; x += 52) { c.beginPath(); c.moveTo(x, SH); c.lineTo(x + SH, 0); c.stroke(); } c.restore();
    // 兩旁的裝飾
    const deco = [[28, 340, 0], [424, 360, 1], [30, 470, 2], [420, 520, 3], [34, 620, 4], [418, 745, 0], [30, 780, 1], [300, 345, 2]];
    c.save(); c.globalAlpha = .55;
    for (const [dx, dy, di] of deco) Props.draw(c, w.props[di % w.props.length], dx, dy, t, di / 5, wi);
    c.restore();
    // 世界卡片
    const k = ease.outCubic(this.swap);
    c.save(); rr(c, 14, 72, W - 28, 226, 22); c.clip();
    c.globalAlpha = .35 + .65 * k; Scenes.draw(c, wi, 14, 72, W - 28, 226, t); c.globalAlpha = 1;
    c.fillStyle = vgrad(c, 190, 298, ['rgba(0,0,0,0)', 'rgba(0,0,0,.72)']); c.fillRect(14, 150, W - 28, 148);
    const open = this.worldOpen(wi);
    if (!open) { c.fillStyle = 'rgba(10,14,24,.62)'; c.fillRect(14, 72, W - 28, 226); Icons.lock(c, 225, 168, 64); UI.text(c, `通關「${WORLDS[wi - 1].lv[7]}」解鎖`, 225, 222, { size: 17, color: '#fff', stroke: 'rgba(0,0,0,.7)', strokeW: 4, align: 'center', weight: 900 }); }
    c.restore();
    rr(c, 14, 72, W - 28, 226, 22); c.lineWidth = 4; c.strokeStyle = acc; c.stroke(); rr(c, 17, 75, W - 34, 220, 20); c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,.35)'; c.stroke();
    const dx = (1 - k) * 30;
    UI.text(c, w.name, 34 + dx, 252, { size: 38, color: '#fff', stroke: shade(acc, -.7), strokeW: 9, weight: 900 });
    UI.text(c, w.sub, 36 + dx, 280, { size: 14, color: '#fff', stroke: 'rgba(0,0,0,.6)', strokeW: 4, weight: 800, italic: true });
    let ws = 0, wc = 0; for (let li = 0; li < LEVELS_PER_WORLD; li++) { const s = Save.starsOf(levelId(wi, li)); ws += s; if (s > 0) wc++; }
    Icons.star(c, 300, 256, 11, true); UI.text(c, `${ws}/24`, 316, 256, { size: 17, color: '#ffe27a', stroke: 'rgba(0,0,0,.65)', strokeW: 4, weight: 900 });
    Icons.flag(c, 372, 256, 24, t); UI.text(c, `${wc}/8`, 388, 256, { size: 17, color: '#fff', stroke: 'rgba(0,0,0,.65)', strokeW: 4, weight: 900 });
    if (wi > 0) UI.roundIcon(c, 'm_prev', 40, 186, 20, Icons.back, { style: 'dark' });
    if (wi < WORLDS.length - 1) UI.roundIcon(c, 'm_next', 410, 186, 20, Icons.next, { style: 'dark' });
    for (let i = 0; i < WORLDS.length; i++) { // 世界小圓點
      const px = 225 + (i - 2.5) * 22, on = i === wi, ok = this.worldOpen(i);
      UI.hits.push({ id: 'wd' + i, x: px - 11, y: 300, w: 22, h: 22 });
      circ(c, px, 311, on ? 6.5 : 4.5, on ? WORLDS[i].accent : (ok ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.2)'), on ? '#fff' : null, 2);
    }
    topBar(c, '選擇關卡', { backId: 'm_home', titleX: 118 });
    wallet(c, 178, 18); UI.roundIcon(c, 'm_gear', 425, 32, 17, Icons.gear, { style: 'purple' });

    // 路徑
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    for (let i = 0; i < 7; i++) {
      const a = NODES[i], b = NODES[i + 1], done = Save.starsOf(levelId(wi, i)) > 0;
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 16; c.setLineDash([]); c.stroke();
      if (done) { c.strokeStyle = shade(acc, .35); c.lineWidth = 9; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 3; c.stroke(); }
      else { c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 6; c.setLineDash([1, 14]); c.stroke(); c.setLineDash([]); }
    }
    c.restore();
    // 關卡節點
    const nextId = Save.nextLevel();
    for (let li = 0; li < LEVELS_PER_WORLD; li++) this.node(c, li, levelId(wi, li), NODES[li], nextId, acc);
    // 青蛙位置標記
    const ll = Save.d.lastLevel || 0;
    if (Math.floor(ll / LEVELS_PER_WORLD) === wi) {
      const [fx, fy] = NODES[ll % LEVELS_PER_WORLD], boss = ll % LEVELS_PER_WORLD === 7, hh = Math.abs(Math.sin(t * 3.2)) * 10;
      FrogArt.front(c, fx + (boss ? 58 : 46), fy + 8, { s: .5, t, skin: Save.d.skin, hat: Save.d.hat, hop: hh / 10, z: hh * 1.6, mood: 'happy', look: [-.5, 0] });
    }

    // 下方資訊列
    c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, 812, W, SH - 812); c.fillStyle = acc; c.fillRect(0, 810, W, 3);
    const sd = levelDef(levelId(wi, this.sel)), lid = levelId(wi, this.sel), unl = Save.unlocked(lid), st = Save.starsOf(lid);
    UI.text(c, `第 ${this.sel + 1} 關 · ${sd.def.name}`, 18, 832, { size: 21, color: '#fff', stroke: 'rgba(0,0,0,.6)', strokeW: 5, weight: 900, maxW: 270 });
    UI.stars(c, 384, 832, st, 24, 3, 3, 1);
    UI.text(c, sd.def.boss ? '魔王關 · 打倒牠才能前進' : '難度', 18, 855, { size: 13, color: '#d8e6f0', weight: 800 });
    if (!sd.def.boss) for (let i = 0; i < 5; i++) { const on = i < Math.ceil(sd.def.d * 5 - .001); circ(c, 70 + i * 17, 855, 5.5, on ? '#ff5a3a' : 'rgba(255,255,255,.22)', on ? '#8a1e10' : null, 1.5); }
    UI.button(c, 'm_shop', 18, 868, 64, 38, '', { style: 'orange', icon: Icons.shop, iconSize: 24, r: 14 });
    UI.button(c, 'm_go', 94, 866, 338, 44, unl ? (st > 0 ? '再玩一次' : '出發!') : '尚未解鎖', { style: unl ? 'green' : 'dark', icon: unl ? Icons.play : (cc, x, y, s) => Icons.lock(cc, x, y, s), size: 24, pulse: unl && lid === nextId, shine: unl && lid === nextId, disabled: !unl });
    UI.text(c, AUTHOR + '  ' + VERSION, W - 8, 914, { size: 10, color: '#ffd24a', italic: true, align: 'right', weight: 700 });
    if (this.toast) { const a = clamp(Math.min(this.toast.t * 6, (2 - this.toast.t) * 3), 0, 1); c.save(); c.globalAlpha = a; UI.glass(c, 40, 330, W - 80, 44, { r: 22, fill: 'rgba(8,16,28,.88)', border: '#ffd24a' }); UI.text(c, this.toast.s, W / 2, 352, { size: 16, color: '#ffe27a', align: 'center', weight: 900, maxW: W - 110 }); c.restore(); }
    SettingsPanel.draw(c);
  }

  node(c, li, lid, p, nextId, acc) {
    const t = this.t, boss = li === 7, unl = Save.unlocked(lid), st = Save.starsOf(lid), sel = this.sel === li, cur = lid === nextId;
    const r = boss ? 38 : 28;
    let [x, y] = p; if (this.shake > 0 && this.shakeNode === li) x += Math.sin(this.shake * 60) * 5;
    UI.hits.push({ id: 'n' + li, x: x - r - 8, y: y - r - 8, w: r * 2 + 16, h: r * 2 + 16 });
    const pressed = UI.down === 'n' + li, pulse = cur && unl ? 1 + Math.sin(t * 5) * .06 : 1;
    c.save(); c.translate(x, y); c.scale(pulse * (pressed ? .93 : 1), pulse * (pressed ? .93 : 1));
    shadowEll(c, 3, r * .72, r * 1.02, r * .38, .35);
    // 選取光圈
    if (sel) { c.save(); c.rotate(t * .8); c.setLineDash([9, 7]); c.lineWidth = 3.4; c.strokeStyle = '#fff'; c.beginPath(); c.arc(0, 0, r + 9, 0, TAU); c.stroke(); c.restore(); circ(c, 0, 0, r + 12, radial(c, 0, 0, r, r + 18, ['rgba(255,255,255,.3)', 'rgba(255,255,255,0)'])); }
    let c0, c1, ed;
    if (!unl) { c0 = '#aab4be'; c1 = '#5d6a76'; ed = '#2c353d'; }
    else if (boss) { c0 = st > 0 ? '#ffe27a' : '#ff9a86'; c1 = st > 0 ? '#e8a318' : '#d8301c'; ed = st > 0 ? '#8c5a06' : '#6a0e06'; }
    else if (st >= 3) { c0 = '#fff08a'; c1 = '#f0b020'; ed = '#8c5a06'; }
    else if (st > 0) { c0 = '#b5f27e'; c1 = '#43b52c'; ed = '#1b6e12'; }
    else { c0 = '#ffd27a'; c1 = '#ff8d22'; ed = '#9a4a08'; }
    circ(c, 0, 5, r, ed); circ(c, 0, 0, r, grad(c, 0, -r, 0, r, [c0, c1]), 'rgba(15,25,35,.7)', 3);
    c.save(); ell(c, 0, -r * .5, r * .66, r * .34, 'rgba(255,255,255,.36)'); c.restore();
    if (!unl) Icons.lock(c, 0, 0, r * 1.0);
    else if (boss) { if (st > 0) Icons.crown(c, 0, -1, r * 1.15); else Icons.skull(c, 0, 0, r * 1.15); }
    else UI.text(c, String(li + 1), 0, 1, { size: 29, color: '#fff', stroke: ed, strokeW: 6, align: 'center', weight: 900 });
    c.restore();
    if (st > 0) UI.stars(c, x, y + r + 11, st, 15, 3, 1, 1);
    else if (unl && cur) { c.save(); c.globalAlpha = .8 + Math.sin(t * 6) * .2; UI.text(c, boss ? '魔王!' : '新!', x, y - r - 12 - Math.abs(Math.sin(t * 4)) * 4, { size: 14, color: '#fff', stroke: '#c01010', strokeW: 5, align: 'center', weight: 900 }); c.restore(); }
  }
}

/* =====================================================================
   蛙蛙商店：升級 / 造型 / 帽子
   ===================================================================== */
class ShopScene {
  constructor(from) {
    this.from = from || 'map'; this.t = 0; this.tab = 0; this.toast = null; this.coinShake = 0;
    this.pSkin = Save.d.skin; this.pHat = Save.d.hat; this.bounce = 0;
    SND.music('shop'); FX.clear();
  }
  onBack() { if (SettingsPanel.back()) return true; this.exit(); return true; }
  exit() { SND.play('back'); Game.go(this.from === 'cover' ? 'cover' : 'map'); }
  onDown(x, y) { UI.pointerDown(x, y); }
  onMove(x, y) { UI.pointerMove(x, y); }
  onUp(x, y) { UI.pointerUp(x, y); }
  onKey(k) { if (k === 'Escape') this.onBack(); if (k === 'ArrowRight' && this.tab < 2) this.tab++; if (k === 'ArrowLeft' && this.tab > 0) this.tab--; }
  say(s, col = '#ffe27a') { this.toast = { s, col, t: 0 }; }
  spend(cost) {
    if (Save.d.coins < cost) { SND.play('deny'); this.coinShake = .5; this.say('金幣不夠喔!去多跑幾關吧', '#ff9a86'); return false; }
    Save.d.coins -= cost; return true;
  }
  update(dt) {
    UI.frame(dt); this.t += dt; FX.update(dt); this.bounce = Math.max(0, this.bounce - dt * 2); this.coinShake = Math.max(0, this.coinShake - dt);
    if (this.toast) { this.toast.t += dt; if (this.toast.t > 2) this.toast = null; }
    if (SettingsPanel.update()) return;
    if (UI.clicked('sh_back')) this.exit();
    for (let i = 0; i < 3; i++) if (UI.clicked('sh_t' + i)) { this.tab = i; SND.play('click'); }
    if (this.tab === 0) {
      for (const u of UPGRADES) if (UI.clicked('up_' + u.id)) {
        const lv = Save.d.up[u.id] || 0;
        if (lv >= u.max) continue;
        if (!this.spend(u.cost[lv])) continue;
        Save.d.up[u.id] = lv + 1; Save.write(); SND.play('buy'); this.bounce = 1; this.say(`${u.name} 升到 Lv.${lv + 1}!`, '#9bff7a');
        FX.burst(LAND ? 131 : 225, LAND ? SH - 250 : SH - 205, 18, { type: 'star', color: ['#ffe14a', '#fff'], min: 80, max: 240, g: 300, s0: 5, s1: 9, l0: .5, l1: 1 });
      }
      if (UI.clicked('sh_gem')) {
        if (Save.d.gems < 1) { SND.play('deny'); this.say('還沒有寶石:打倒魔王或拿三顆星就有', '#ff9a86'); }
        else { Save.d.gems--; Save.d.coins += 200; Save.write(); SND.play('coin'); this.say('兌換成功:+200 金幣', '#9bff7a'); }
      }
    } else {
      const list = this.tab === 1 ? SKINS : HATS, ownedKey = this.tab === 1 ? 'skins' : 'hats', eqKey = this.tab === 1 ? 'skin' : 'hat';
      for (const it of list) if (UI.clicked('it_' + it.id)) { if (this.tab === 1) this.pSkin = it.id; else this.pHat = it.id; SND.play('click'); this.bounce = .6; }
      if (UI.clicked('sh_act')) {
        const id = this.tab === 1 ? this.pSkin : this.pHat, it = list.find(x => x.id === id);
        if (!Save.d[ownedKey].includes(id)) {
          if (this.spend(it.cost)) { Save.d[ownedKey].push(id); Save.d[eqKey] = id; Save.write(); SND.play('buy'); this.bounce = 1; this.say(`買到「${it.name}」並已穿上!`, '#9bff7a'); FX.burst(LAND ? 131 : 225, LAND ? SH - 250 : SH - 640, 20, { type: 'star', color: ['#ffe14a', '#fff', '#ff8fc4'], min: 80, max: 260, g: 300, s0: 5, s1: 9, l0: .5, l1: 1.1 }); }
        } else if (Save.d[eqKey] !== id) { Save.d[eqKey] = id; Save.write(); SND.play('power'); this.bounce = 1; this.say(`已換上「${it.name}」`, '#9bff7a'); }
      }
    }
  }

  draw(c) { if (LAND) this.drawL(c); else this.drawP(c); }
  drawP(c) {
    const t = this.t;
    c.fillStyle = vgrad(c, 0, SH, ['#2b6f4a', '#123a2a']); c.fillRect(0, 0, W, SH);
    // 展示台
    c.save(); c.beginPath(); c.rect(0, 64, W, 252); c.clip();
    c.fillStyle = vgrad(c, 64, 316, ['#74d6a0', '#2f8d62']); c.fillRect(0, 64, W, 252);
    sunburst(c, 225, 250, 360, t, 'rgba(255,255,255,.1)', 16);
    c.restore();
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, 314, W, 4);
    ell(c, 225, 282, 112, 24, 'rgba(0,0,0,.25)'); ell(c, 225, 276, 108, 22, '#d9b46a', '#8c6a22', 3); ell(c, 225, 270, 108, 22, '#f2d28a', '#8c6a22', 3);
    const bn = this.bounce > 0 ? Math.abs(Math.sin(this.bounce * 8)) * 18 * this.bounce : 0;
    FrogArt.front(c, 225, 268, { s: 1.5, t, skin: this.pSkin, hat: this.pHat, mood: 'happy', blink: (t % 3.3) < .12 ? 1 : 0, sy: 1 + Math.sin(t * 2.4) * .015, z: bn, look: [Math.sin(t * .9) * .6, 0] });
    FX.draw(c, y => SH - y);
    const ps = skinOf(this.pSkin), ph = HATS.find(h => h.id === this.pHat);
    UI.text(c, `${ps.name}${ph && ph.id !== 'none' ? ' + ' + ph.name : ''}`, 225, 304, { size: 19, color: '#fff', stroke: 'rgba(0,0,0,.65)', strokeW: 5, align: 'center', weight: 900, maxW: 380 });
    topBar(c, '蛙蛙商店', { backId: 'sh_back', titleX: 118 });
    const cs = this.coinShake > 0 ? Math.sin(this.coinShake * 70) * 4 : 0;
    UI.counter(c, 178 + cs, 18, 112, 28, Icons.coin, fmt(Save.d.coins), this.coinShake > 0 ? '#ff9a86' : '#ffe27a');
    UI.counter(c, 296, 18, 84, 28, (cc, a, b, s, tt) => Icons.gem(cc, a, b, s, tt), fmt(Save.d.gems), '#9defff');
    // 分頁
    const tabs = ['升級', '造型', '帽子'], tw = 138;
    for (let i = 0; i < 3; i++) {
      const x = 15 + i * (tw + 7), on = this.tab === i;
      UI.button(c, 'sh_t' + i, x, 328, tw, 44, tabs[i], { style: on ? 'orange' : 'dark', size: 21, icon: i === 0 ? Icons.flame : i === 1 ? Icons.frogHead : Icons.crown, iconSize: 24 });
    }
    if (this.tab === 0) this.drawUpgrades(c); else this.drawGrid(c);
    if (this.toast) { const a = clamp(Math.min(this.toast.t * 6, (2 - this.toast.t) * 3), 0, 1); c.save(); c.globalAlpha = a; UI.glass(c, 36, 120, W - 72, 44, { r: 22, fill: 'rgba(8,16,28,.9)', border: this.toast.col }); UI.text(c, this.toast.s, W / 2, 142, { size: 17, color: this.toast.col, align: 'center', weight: 900, maxW: W - 110 }); c.restore(); }
    credit(c, 225, 912, { size: 12 });
    SettingsPanel.draw(c);
  }

  drawUpgrades(c) {
    const t = this.t;
    UPGRADES.forEach((u, i) => {
      const y = 384 + i * 78, lv = Save.d.up[u.id] || 0, maxed = lv >= u.max;
      UI.panel(c, 14, y, W - 28, 70, { r: 16, top: '#fff9e6', bot: '#f6e2b0' });
      circ(c, 50, y + 35, 25, grad(c, 0, y + 10, 0, y + 60, ['#5a7a98', '#2b3f55']), '#16222e', 2.5);
      u.icon(c, 50, y + 35, 32, t);
      UI.text(c, u.name, 88, y + 22, { size: 19, color: '#6b3d0c', weight: 900 });
      UI.text(c, u.desc, 88, y + 43, { size: 12, color: '#8a6a3a', weight: 700, maxW: 160 });
      for (let k = 0; k < u.max; k++) { const px = 96 + k * 22; circ(c, px, y + 58, 6, k < lv ? '#43b52c' : 'rgba(0,0,0,.18)', k < lv ? '#1b6e12' : 'rgba(0,0,0,.3)', 1.6); }
      if (maxed) UI.button(c, 'up_' + u.id, 292, y + 12, 130, 46, '已滿級', { style: 'teal', size: 19, disabled: false, noHit: true });
      else {
        const cost = u.cost[lv], can = Save.d.coins >= cost;
        UI.button(c, 'up_' + u.id, 292, y + 12, 130, 46, '', { style: can ? 'gold' : 'dark', icon: (cc, x, yy, s) => { Icons.coin(cc, x - 20, yy, s * .9, t); UI.text(cc, fmt(cost), x - 6, yy + 1, { size: 20, color: '#fff', stroke: 'rgba(20,30,40,.75)', strokeW: 5, weight: 900 }); }, iconSize: 26 });
      }
    });
    // 寶石兌換
    const y = 384 + 5 * 78;
    UI.panel(c, 14, y, W - 28, 62, { r: 16, top: '#e3fbff', bot: '#b3e9f5' });
    Icons.gem(c, 48, y + 31, 34, t);
    UI.text(c, '寶石兌換金幣', 78, y + 22, { size: 18, color: '#0e5a70', weight: 900 });
    UI.text(c, '1 顆寶石 = 200 金幣', 78, y + 44, { size: 12.5, color: '#2a7a90', weight: 700 });
    UI.button(c, 'sh_gem', 292, y + 8, 130, 46, '兌換', { style: Save.d.gems > 0 ? 'blue' : 'dark', size: 21 });
  }

  drawGrid(c) {
    const t = this.t, list = this.tab === 1 ? SKINS : HATS, ownedKey = this.tab === 1 ? 'skins' : 'hats', eqKey = this.tab === 1 ? 'skin' : 'hat', pv = this.tab === 1 ? this.pSkin : this.pHat;
    const cw = 132, ch = 108, gx = 8, x0 = (W - (3 * cw + 2 * gx)) / 2, y0 = 382;
    list.forEach((it, i) => {
      const col = i % 3, row = Math.floor(i / 3), x = x0 + col * (cw + gx), y = y0 + row * (ch + 6);
      const owned = Save.d[ownedKey].includes(it.id), eq = Save.d[eqKey] === it.id, sel = pv === it.id;
      UI.hits.push({ id: 'it_' + it.id, x, y, w: cw, h: ch });
      const pressed = UI.down === 'it_' + it.id;
      c.save(); if (pressed) { c.translate(x + cw / 2, y + ch / 2); c.scale(.96, .96); c.translate(-x - cw / 2, -y - ch / 2); }
      UI.panel(c, x, y, cw, ch, { r: 16, top: sel ? '#fffbd0' : '#fff6dc', bot: sel ? '#ffe27a' : '#efd9a4', edge: sel ? '#ff8d22' : '#1d2c3a' });
      if (sel) { c.save(); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,.9)'; rr(c, x + 1, y + 1, cw - 2, ch - 2, 16); c.stroke(); c.restore(); }
      if (this.tab === 1) FrogArt.front(c, x + cw / 2, y + 68, { s: .58, t, skin: it.id, hat: 'none', mood: 'happy', blink: 0 });
      else FrogArt.front(c, x + cw / 2, y + 70, { s: .58, t, skin: this.pSkin, hat: it.id, mood: 'happy', blink: 0 });
      UI.text(c, it.name, x + cw / 2, y + 82, { size: 14.5, color: '#6b3d0c', align: 'center', weight: 900, maxW: cw - 12 });
      if (eq) { rr(c, x + 20, y + 89, cw - 40, 16, 8); c.fillStyle = '#43b52c'; c.fill(); UI.text(c, '使用中', x + cw / 2, y + 97, { size: 11.5, color: '#fff', align: 'center', weight: 900 }); }
      else if (owned) UI.text(c, '已擁有', x + cw / 2, y + 97, { size: 12.5, color: '#2b8a22', align: 'center', weight: 900 });
      else { Icons.coin(c, x + cw / 2 - 26, y + 97, 14, t); UI.text(c, fmt(it.cost), x + cw / 2 - 14, y + 97, { size: 14, color: Save.d.coins >= it.cost ? '#a45d06' : '#c0392b', weight: 900 }); }
      c.restore();
    });
    // 動作按鈕
    const it = list.find(x => x.id === pv) || list[0], owned = Save.d[ownedKey].includes(it.id), eq = Save.d[eqKey] === it.id;
    const barY = 852;
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, barY - 8, W, SH - barY + 8);
    if (!owned) { const can = Save.d.coins >= it.cost; UI.button(c, 'sh_act', 70, barY, 310, 52, '', { style: can ? 'gold' : 'dark', size: 22, icon: (cc, x, yy, s) => { UI.text(cc, '購買', x - 56, yy + 1, { size: 22, color: '#fff', stroke: 'rgba(20,30,40,.75)', strokeW: 5, weight: 900 }); Icons.coin(cc, x + 10, yy, s * .9, t); UI.text(cc, fmt(it.cost), x + 26, yy + 1, { size: 22, color: '#fff', stroke: 'rgba(20,30,40,.75)', strokeW: 5, weight: 900 }); }, iconSize: 28 }); }
    else if (!eq) UI.button(c, 'sh_act', 70, barY, 310, 52, '穿上', { style: 'green', size: 24 });
    else UI.button(c, 'sh_act', 70, barY, 310, 52, '使用中', { style: 'teal', size: 24, noHit: true });
  }
}

/* =====================================================================
   結算畫面
   ===================================================================== */
class ResultScene {
  constructor(r) {
    this.r = r; this.t = 0; this.starShown = 0; this.coinShown = 0; this.said = 0; this.nxt = r.id + 1 < TOTAL_LEVELS ? r.id + 1 : null;
    const ld = levelDef(r.id); this.ld = ld;
    SND.music(r.isBoss ? 'cover' : 'cover'); SND.play('win'); FX.clear(); this.conf = 0;
    Weather.init('');
  }
  onBack() { Game.go('map'); return true; }
  onDown(x, y) { UI.pointerDown(x, y); }
  onMove(x, y) { UI.pointerMove(x, y); }
  onUp(x, y) { UI.pointerUp(x, y); }
  onKey(k) { if (k === 'Enter' || k === ' ') this.next(); if (k === 'Escape') this.onBack(); }
  starPos(said) { return LAND ? [(SW - 700) / 2 + 190 + (said - 2) * 68, SH - (54 + 106)] : [225 + (said - 2) * 62, SH - 300]; }
  next() {
    if (this.nxt === null) { Game.go('map'); return; }
    SND.play('click'); Game.go('play', this.nxt);
  }
  update(dt) {
    UI.frame(dt); this.t += dt; FX.update(dt);
    const r = this.r, t = this.t;
    while (this.said < r.stars && t > .7 + this.said * .5) { SND.play(['star', 'star2', 'star3'][this.said]); this.said++; FX.burst(...this.starPos(this.said), 14, { type: 'star', color: ['#ffe14a', '#fff'], min: 60, max: 220, g: 260, s0: 5, s1: 9, l0: .5, l1: 1 }); }
    this.starShown = clamp((t - .6) / 1.6, 0, 1);
    this.coinShown = clamp((t - 1.6) / 1, 0, 1);
    this.conf -= dt; if (this.conf <= 0 && t < 4.5) { this.conf = .12; FX.burst(rand(40, SW - 40), SH - 40, 4, { type: 'sq', color: ['#ff5a5a', '#ffd23a', '#4cc6ff', '#7be04b', '#ff8fc4'], angle: PI / 2, spread: .7, min: 380, max: 620, g: 700, s0: 3, s1: 5, l0: 1.2, l1: 1.8, shrink: false }); }
    if (UI.clicked('r_next')) this.next();
    if (UI.clicked('r_retry')) { SND.play('click'); Game.go('play', this.r.id); }
    if (UI.clicked('r_map')) { SND.play('back'); Game.go('map'); }
  }
  draw(c) { if (LAND) this.drawL(c); else this.drawP(c); }
  drawP(c) {
    const r = this.r, t = this.t, wi = this.ld.wi, w = this.ld.world;
    Scenes.draw(c, wi, 0, 0, W, SH, t);
    c.fillStyle = 'rgba(8,14,24,.58)'; c.fillRect(0, 0, W, SH);
    sunburst(c, 225, 300, 520, t, 'rgba(255,230,120,.08)', 18);
    FX.draw(c, y => SH - y);
    // 標題
    const k = ease.outBack(clamp(t / .5, 0, 1));
    c.save(); c.translate(225, 118); c.scale(k, k);
    UI.text(c, r.isBoss ? '魔王擊敗!' : '過關了!', 0, 0, { size: 62, color: grad(c, 0, -30, 0, 30, ['#fff6a0', '#ffd23a', '#ff9a1c']), stroke: '#6a2c04', strokeW: 13, align: 'center', weight: 900, glow: '#ffb300', glowR: 22 });
    c.restore();
    UI.text(c, `${w.name} · 第 ${this.ld.li + 1} 關「${this.ld.def.name}」`, 225, 176, { size: 16, color: '#fff', stroke: 'rgba(0,0,0,.65)', strokeW: 4.5, align: 'center', weight: 800, maxW: 400 });
    if (r.stars > r.oldStars && r.oldStars > 0) UI.text(c, '新紀錄!', 225, 200, { size: 17, color: '#9bff7a', stroke: '#14501a', strokeW: 5, align: 'center', weight: 900 });
    // 面板
    UI.panel(c, 28, 218, W - 56, 394, { r: 26 });
    UI.stars(c, 225, 282, r.stars, 62, 3, 10, this.starShown);
    // 勳章條件
    const conds = r.isBoss
      ? [['擊敗魔王', true], ['受傷不超過 1 次', r.hurt <= 1], ['完全沒有受傷', r.hurt === 0]]
      : [['順利抵達終點', true], [`收集 ${r.starCoins} 枚以上金幣 (${r.coins})`, r.coins >= r.starCoins], ['完全沒有受傷', r.hurt === 0]];
    conds.forEach((cd, i) => {
      const y = 350 + i * 34, a = clamp((t - .8 - i * .25) * 4, 0, 1);
      c.save(); c.globalAlpha = a; checkMark(c, 66, y, 24, cd[1]);
      UI.text(c, cd[0], 88, y + 1, { size: 18, color: cd[1] ? '#2a6a1a' : '#7a6a58', weight: 900, maxW: 300 }); c.restore();
    });
    c.fillStyle = 'rgba(120,80,20,.2)'; c.fillRect(50, 462, W - 100, 2);
    // 獎勵
    const ca = clamp((t - 1.5) * 3, 0, 1);
    c.save(); c.globalAlpha = ca;
    Icons.coin(c, 70, 494, 28, t); UI.text(c, '通關獎勵', 96, 494, { size: 18, color: '#6b3d0c', weight: 900 });
    UI.text(c, '+' + Math.round(r.bonus * this.coinShown), W - 58, 494, { size: 28, color: '#d98a06', stroke: '#fff7d6', strokeW: 6, align: 'right', weight: 900 });
    Icons.coin(c, 70, 534, 22, t + 1); UI.text(c, `關卡中拿到 ${r.coins} 枚 · 打倒 ${r.kills} 隻敵人`, 96, 534, { size: 14.5, color: '#7a5a2a', weight: 800, maxW: 330 });
    if (r.gems > 0) { Icons.gem(c, 70, 574, 30, t); UI.text(c, '寶石', 96, 574, { size: 18, color: '#0e5a70', weight: 900 }); UI.text(c, '+' + r.gems, W - 58, 574, { size: 28, color: '#16a5c8', stroke: '#e3fbff', strokeW: 6, align: 'right', weight: 900 }); }
    else UI.text(c, `目前金幣 ${fmt(Save.d.coins)}`, 225, 576, { size: 15, color: '#8a6a3a', align: 'center', weight: 800 });
    c.restore();
    // 青蛙慶祝
    const hp = Math.abs(Math.sin(t * 4));
    FrogArt.front(c, 70, 700, { s: .85, t, skin: Save.d.skin, hat: Save.d.hat, hop: hp, z: hp * 26, mood: 'happy', blink: 0 });
    FrogArt.front(c, 380, 700, { s: .72, t, skin: 'pink', hat: 'flower', hop: hp, z: Math.abs(Math.sin(t * 4 + 1.2)) * 26, mood: 'happy', blink: 0 });
    // 按鈕
    const newWorld = this.nxt !== null && Math.floor(this.nxt / LEVELS_PER_WORLD) !== wi;
    const label = this.nxt === null ? '回到地圖' : newWorld ? '前往下個世界' : '下一關';
    UI.button(c, 'r_next', 62, 726, 326, 72, label, { style: 'green', icon: Icons.next, size: 30, pulse: true, shine: true });
    UI.button(c, 'r_retry', 62, 812, 158, 54, '重玩', { style: 'orange', icon: Icons.retry, size: 22 });
    UI.button(c, 'r_map', 230, 812, 158, 54, '地圖', { style: 'blue', icon: Icons.map, size: 22 });
    credit(c, 225, 896, { size: 13 });
    if (this.nxt === null) UI.text(c, '恭喜你完成了全部 48 關!', 225, 702, { size: 18, color: '#ffe27a', stroke: 'rgba(0,0,0,.7)', strokeW: 5, align: 'center', weight: 900 });
  }
}

'use strict';
/* =====================================================================
   橫式版面：封面 / 選關地圖 / 蛙蛙商店 / 結算
   （直式版面在 scenes.js；橫式畫面邏輯尺寸高 450、寬 800~1050，用 SW / SH）
   作者：ArchieKUO
   ===================================================================== */

/* 橫式頂端列：返回鍵 + 標題（右側由各畫面自己放錢包等） */
function topBarL(c, title, backId) {
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, SW, 46);
  c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(0, 44, SW, 2);
  UI.roundIcon(c, backId, 28, 23, 18, Icons.back, { style: 'orange' });
  UI.text(c, title, 58, 24, { size: 24, color: '#fff', stroke: 'rgba(0,0,0,.6)', strokeW: 6, weight: 900 });
}
function stripesBg(c, top, bot, step = 46) {
  c.fillStyle = vgrad(c, 0, SH, [top, bot]); c.fillRect(0, 0, SW, SH);
  c.save(); c.strokeStyle = 'rgba(255,255,255,.045)'; c.lineWidth = 16; for (let x = -SH; x < SW + 40; x += step) { c.beginPath(); c.moveTo(x, SH); c.lineTo(x + SH, 0); c.stroke(); } c.restore();
}

/* =====================================================================
   封面（橫式）：左邊標題＋主角，右邊按鈕
   ===================================================================== */
CoverScene.prototype.onResize = function () { Weather.init('pollen', SW, 0, SH); };

CoverScene.prototype.backgroundL = function (c, t) {
  const hz = 296;
  c.fillStyle = vgrad(c, 0, hz + 8, ['#4fb6ff', '#a6e4ff', '#e9fbff']); c.fillRect(0, 0, SW, hz + 10);
  const sx = SW * .56, sy = 96;
  circ(c, sx, sy, 70, radial(c, sx, sy, 8, 76, ['rgba(255,244,170,.95)', 'rgba(255,230,120,0)']));
  circ(c, sx, sy, 28, '#fff3a0'); circ(c, sx, sy, 22, '#ffe55a');
  Scenes.cloud(c, (t * 7) % (SW + 140) - 90, 170, 1.15, 'rgba(255,255,255,.96)');
  Scenes.cloud(c, (t * 4.5 + 300) % (SW + 140) - 90, 224, .8);
  Scenes.cloud(c, (t * 9 + 160) % (SW + 140) - 90, 70, .6, 'rgba(255,255,255,.85)');
  Scenes.hills(c, SW, 232, 14, '#9fd9ad', 2); Scenes.hills(c, SW, 262, 12, '#62c05c', 5, .03);
  const n = Math.ceil(SW / 46) + 1;
  for (let i = 0; i < n; i++) { const tx = 14 + i * 46 + (i % 2) * 6, ty = 288 + Math.sin(i * 2.1) * 4; Props.draw(c, i % 3 === 1 ? 'bush' : 'tree', tx, ty, t, i / 10, 0); }
  // 池塘
  c.fillStyle = vgrad(c, hz - 4, SH, ['#46b4ea', '#2284c6', '#0f4f86']); c.fillRect(0, hz, SW, SH - hz);
  c.fillStyle = vgrad(c, hz - 4, hz + 70, ['rgba(255,255,255,.35)', 'rgba(255,255,255,0)']); c.fillRect(0, hz, SW, 74);
  c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 2; c.lineCap = 'round';
  for (let i = 0; i < 14; i++) { const yy = hz + 16 + i * 11 + Math.sin(i) * 3, xx = ((t * (10 + i % 4 * 4) + i * 97) % (SW + 120)) - 60; c.beginPath(); c.moveTo(xx, yy); c.quadraticCurveTo(xx + 20, yy - 4, xx + 40, yy); c.stroke(); }
  // 荷葉、蓮花
  const pads = [[.03, 410, 1], [.17, 432, .8], [.52, 424, 1.05], [.6, 440, .7], [.08, 335, .7], [.42, 330, .6], [.97, 340, .8], [.95, 420, 1], [.7, 436, .8]];
  for (const [fx, py, s] of pads) { const px = SW * fx, bob = Math.sin(t * 1.4 + px) * 1.5; this.lily(c, px, py + bob, 36 * s, Math.round(px) % 3 === 0); }
  for (const [rx, ry] of [[8, 392], [SW - 10, 400], [SW * .46, 318]]) this.reed(c, rx, ry, t);
};

CoverScene.prototype.drawL = function (c) {
  const t = this.t, lx = SW * .27, cx = SW * .745;
  this.backgroundL(c, t);
  Fly.draw(c, 'bee', ((t * 48) % (SW + 120)) - 60, 150 + Math.sin(t * 3) * 14, 1, t, 1.05);
  Fly.draw(c, 'bee', SW + 60 - ((t * 36 + 200) % (SW + 120)), 232 + Math.sin(t * 2.4) * 10, -1, t + 1, .85);
  // 小青蛙
  const minis = [{ x: Math.max(52, lx - 180), y: 372, skin: 'pink', hat: 'flower', ph: 0 }, { x: lx + 184, y: 384, skin: 'blue', hat: 'cowboy', ph: 2.1 }];
  for (const m of minis) {
    this.lily(c, m.x, m.y + 18, 38, false);
    const k = (t * .8 + m.ph) % 4, hop = k < .5 ? Math.sin(k / .5 * PI) : 0;
    FrogArt.front(c, m.x, m.y + 16, { s: .68, t, skin: m.skin, hat: m.hat, hop, z: hop * 22, mood: 'happy', blink: 0, sy: 1 + Math.sin(t * 2 + m.ph) * .02, look: [Math.sin(t + m.ph), 0] });
  }
  // 作者署名（v1.2.1：放大，放在標題緞帶正下方；畫在青蛙後面，青蛙跳起來會從字前面過）
  credit(c, lx, 238, { size: 26, stroke: 'rgba(0,0,0,.7)', strokeW: 6 });
  // 主角（v1.2.1：往下挪 10、跳高收到 36，讓跳起來也碰不到上面的作者字樣）
  const h = this.hop, hk = h.k < 1 ? Math.sin(h.k * PI) : 0;
  this.lily(c, lx, 412, 86, true);
  FrogArt.front(c, lx, 396, {
    s: 1.4, t, skin: Save.d.skin, hat: Save.d.hat, hop: hk, z: hk * 36,
    sx: 1 - hk * .05 + Math.sin(t * 2) * .012, sy: 1 + hk * .07 + Math.sin(t * 2 + 1) * .02, mood: 'happy', blink: this.blinkT < 0 ? 1 : 0, look: [Math.sin(t * .8) * .7, 0],
  });
  Weather.draw(c, t);

  // 標題
  const letters = ['青', '蛙', '過', '河'], cols = [['#d8ff8a', '#7be04b', '#3fa02a'], ['#fff3a0', '#ffd23a', '#e89a10'], ['#ffd0a0', '#ff8a2e', '#d4500c'], ['#c8f0ff', '#4cc6ff', '#1c86d4']];
  const FS = 88;
  letters.forEach((ch, i) => {
    const bx = lx + (i - 1.5) * 82, by = 92 + Math.sin(t * 2.2 + i * .9) * 5, rot = Math.sin(t * 1.6 + i) * .05;
    c.save(); c.translate(bx, by); c.rotate(rot - 0.04 + i * .02);
    UI.text(c, ch, 0, 9, { size: FS, color: 'rgba(0,0,0,.28)', align: 'center', weight: 900 });
    UI.text(c, ch, 0, 0, { size: FS, color: grad(c, 0, -40, 0, 44, cols[i]), stroke: '#173a14', strokeW: 15, align: 'center', weight: 900 });
    c.save(); c.globalAlpha = .5; UI.text(c, ch, -1, -3, { size: FS, color: 'rgba(255,255,255,0)', stroke: 'rgba(255,255,255,.7)', strokeW: 1.4, align: 'center', weight: 900 }); c.restore();
    c.restore();
  });
  // 副標題緞帶
  c.save(); c.translate(lx, 172);
  poly(c, [-122, -4, -156, 14, -122, 32, -104, 10], '#b0420c', '#6a1e04', 2); poly(c, [122, -4, 156, 14, 122, 32, 104, 10], '#b0420c', '#6a1e04', 2);
  rr(c, -128, -11, 256, 40, 10); c.fillStyle = grad(c, 0, -11, 0, 29, ['#ffb066', '#ff7a1c', '#d8530a']); c.fill(); c.lineWidth = 3; c.strokeStyle = '#7a2a04'; c.stroke();
  c.save(); rr(c, -125, -8, 250, 18, 8); c.fillStyle = 'rgba(255,255,255,.28)'; c.fill(); c.restore();
  UI.text(c, '超級蛙蛙大冒險', 0, 10, { size: 22, color: '#fff', stroke: '#7a2a04', strokeW: 6, align: 'center', weight: 900 });
  c.restore();
  // 閃爍星星
  for (let i = 0; i < 6; i++) { const sx = [lx - 170, lx + 170, lx - 120, lx + 130, lx - 195, lx + 205][i], sy2 = [40, 52, 150, 150, 110, 120][i]; c.save(); c.globalAlpha = .5 + Math.sin(t * 3 + i * 1.7) * .5; Icons.sparkle(c, sx, sy2, 7 + (i % 3) * 2); c.restore(); }

  // 右側按鈕區
  UI.glass(c, cx - 176, 66, 352, 378, { r: 30, fill: 'rgba(5,36,74,.30)', border: 'rgba(255,255,255,.4)' });
  const cleared = Save.clearedCount(), nl = Save.nextLevel(), nd = levelDef(nl);
  UI.button(c, 'c_play', cx - 150, 82, 300, 68, cleared > 0 ? '繼續冒險' : '開始冒險', { style: 'green', icon: Icons.play, size: 30, pulse: true, shine: true });
  UI.text(c, `${nd.world.name} · 第 ${nd.li + 1} 關「${nd.def.name}」`, cx, 168, { size: 13.5, color: '#fff', stroke: 'rgba(0,30,60,.75)', strokeW: 4, align: 'center', weight: 800, maxW: 320 });
  UI.button(c, 'c_map', cx - 150, 184, 300, 56, '選擇關卡', { style: 'blue', icon: Icons.map, size: 24 });
  UI.button(c, 'c_shop', cx - 150, 254, 144, 52, '蛙蛙商店', { style: 'orange', icon: Icons.shop, size: 19 });
  UI.button(c, 'c_set', cx + 6, 254, 144, 52, '設定', { style: 'purple', icon: Icons.gear, size: 21 });
  const pk = cleared / TOTAL_LEVELS;
  UI.glass(c, cx - 150, 326, 300, 22, { r: 11, fill: 'rgba(0,20,50,.55)' });
  c.save(); rr(c, cx - 147, 329, Math.max(10, 294 * pk), 16, 8); c.fillStyle = grad(c, 0, 329, 0, 345, ['#c4f58a', '#43b52c']); c.fill(); c.restore();
  UI.text(c, `冒險進度 ${cleared}/${TOTAL_LEVELS} 關`, cx, 338, { size: 12.5, color: '#fff', stroke: 'rgba(0,0,0,.6)', strokeW: 3.5, align: 'center', weight: 900 });
  Icons.star(c, cx - 112, 376, 10, true); UI.text(c, `${Save.totalStars()} / ${TOTAL_LEVELS * 3}`, cx - 98, 376, { size: 15, color: '#ffe27a', stroke: 'rgba(0,0,0,.6)', strokeW: 4, weight: 900 });
  Icons.crown(c, cx + 36, 376, 22); UI.text(c, `魔王 ${Save.d.bossKills}/${WORLDS.length}`, cx + 52, 376, { size: 15, color: '#fff', stroke: 'rgba(0,0,0,.6)', strokeW: 4, weight: 900 });
  // 角落
  wallet(c, 10, 10);
  UI.roundIcon(c, 'c_snd', SW - 70, 24, 17, (cc, x, y, s) => Icons.speaker(cc, x, y, s, Save.d.sound), { style: Save.d.sound ? 'teal' : 'dark' });
  UI.roundIcon(c, 'c_mus', SW - 26, 24, 17, (cc, x, y, s) => Icons.note(cc, x, y, s, Save.d.music), { style: Save.d.music ? 'purple' : 'dark' });
  if (canExit()) UI.button(c, 'c_exit', cx - 85, 398, 170, 38, '離開遊戲', { style: 'dark', icon: Icons.exit, size: 17 });
  if (false) UI.text(c, '把青蛙平安送到對岸吧!', cx, 434, { size: 12,  color: 'rgba(255,255,255,.85)', stroke: 'rgba(0,30,60,.6)', strokeW: 3, align: 'center', weight: 700 });
  SettingsPanel.draw(c);
  ExitDialog.draw(c);
};

/* =====================================================================
   選關地圖（橫式）：左邊世界卡片＋關卡資訊，右邊 8 個關卡節點的路線板
   ===================================================================== */
MapScene.prototype.nodePosL = function (li) {
  const bx = 324, bw = SW - 12 - bx, by = 52, bh = 386;
  const ys = [.72, .45, .68, .40, .64, .37, .60, .36];
  return [bx + bw * (.075 + li * .1155), by + bh * ys[li]];
};

MapScene.prototype.drawL = function (c) {
  const w = WORLDS[this.wi], t = this.t, acc = w.accent, wi = this.wi;
  stripesBg(c, shade(acc, -.62), shade(acc, -.86), 52);
  topBarL(c, '選擇關卡', 'm_home');
  UI.roundIcon(c, 'm_gear', SW - 26, 23, 17, Icons.gear, { style: 'purple' });
  wallet(c, SW - 26 - 17 - 10 - 202, 9);

  // ---- 左：世界卡片 ----
  const X = 12, Y = 54, CW = 300, CH = 196, k = ease.outCubic(this.swap);
  c.save(); rr(c, X, Y, CW, CH, 22); c.clip();
  c.globalAlpha = .35 + .65 * k; Scenes.draw(c, wi, X, Y, CW, CH, t); c.globalAlpha = 1;
  c.fillStyle = vgrad(c, Y + 100, Y + CH, ['rgba(0,0,0,0)', 'rgba(0,0,0,.74)']); c.fillRect(X, Y + 90, CW, CH - 90);
  const open = this.worldOpen(wi);
  if (!open) { c.fillStyle = 'rgba(10,14,24,.62)'; c.fillRect(X, Y, CW, CH); Icons.lock(c, X + CW / 2, Y + 78, 58); UI.text(c, `通關「${WORLDS[wi - 1].lv[7]}」解鎖`, X + CW / 2, Y + 128, { size: 16, color: '#fff', stroke: 'rgba(0,0,0,.7)', strokeW: 4, align: 'center', weight: 900, maxW: CW - 24 }); }
  c.restore();
  rr(c, X, Y, CW, CH, 22); c.lineWidth = 4; c.strokeStyle = acc; c.stroke(); rr(c, X + 3, Y + 3, CW - 6, CH - 6, 20); c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,.35)'; c.stroke();
  const dx = (1 - k) * 30;
  UI.text(c, w.name, X + 16 + dx, Y + CH - 48, { size: 34, color: '#fff', stroke: shade(acc, -.7), strokeW: 8, weight: 900, maxW: 170 });
  UI.text(c, w.sub, X + 18 + dx, Y + CH - 20, { size: 13, color: '#fff', stroke: 'rgba(0,0,0,.6)', strokeW: 4, weight: 800, italic: true, maxW: 176 });
  let ws = 0, wc = 0; for (let li = 0; li < LEVELS_PER_WORLD; li++) { const s = Save.starsOf(levelId(wi, li)); ws += s; if (s > 0) wc++; }
  Icons.star(c, X + 206, Y + CH - 52, 10, true); UI.text(c, `${ws}/24`, X + 220, Y + CH - 52, { size: 16, color: '#ffe27a', stroke: 'rgba(0,0,0,.65)', strokeW: 4, weight: 900 });
  Icons.flag(c, X + 208, Y + CH - 24, 22, t); UI.text(c, `${wc}/8`, X + 220, Y + CH - 24, { size: 16, color: '#fff', stroke: 'rgba(0,0,0,.65)', strokeW: 4, weight: 900 });
  if (wi > 0) UI.roundIcon(c, 'm_prev', X + 24, Y + 70, 17, Icons.back, { style: 'dark' });
  if (wi < WORLDS.length - 1) UI.roundIcon(c, 'm_next', X + CW - 24, Y + 70, 17, Icons.next, { style: 'dark' });
  for (let i = 0; i < WORLDS.length; i++) {
    const px = X + CW / 2 + (i - 2.5) * 22, on = i === wi, ok = this.worldOpen(i);
    UI.hits.push({ id: 'wd' + i, x: px - 11, y: Y + CH + 4, w: 22, h: 22 });
    circ(c, px, Y + CH + 15, on ? 6.5 : 4.5, on ? WORLDS[i].accent : (ok ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.2)'), on ? '#fff' : null, 2);
  }
  // ---- 左：選到的關卡資訊 ----
  const lid = levelId(wi, this.sel), sd = levelDef(lid), unl = Save.unlocked(lid), st = Save.starsOf(lid), nextId = Save.nextLevel();
  UI.text(c, `第 ${this.sel + 1} 關 · ${sd.def.name}`, X + 4, 292, { size: 19, color: '#fff', stroke: 'rgba(0,0,0,.6)', strokeW: 5, weight: 900, maxW: 218 });
  UI.stars(c, X + CW - 42, 291, st, 22, 3, 3, 1);
  UI.text(c, sd.def.boss ? '魔王關 · 打倒牠才能前進' : '難度', X + 4, 316, { size: 13, color: '#d8e6f0', weight: 800 });
  if (!sd.def.boss) for (let i = 0; i < 5; i++) { const on = i < Math.ceil(sd.def.d * 5 - .001); circ(c, X + 56 + i * 17, 316, 5.5, on ? '#ff5a3a' : 'rgba(255,255,255,.22)', on ? '#8a1e10' : null, 1.5); }
  UI.button(c, 'm_shop', X, 336, 64, 54, '', { style: 'orange', icon: Icons.shop, iconSize: 28, r: 16 });
  UI.button(c, 'm_go', X + 74, 336, CW - 74, 54, unl ? (st > 0 ? '再玩一次' : '出發!') : '尚未解鎖', { style: unl ? 'green' : 'dark', icon: unl ? Icons.play : (cc, x, y, s) => Icons.lock(cc, x, y, s), size: 24, pulse: unl && lid === nextId, shine: unl && lid === nextId, disabled: !unl });
  credit(c, X + CW / 2, 426, { size: 12 });

  // ---- 右：路線板 ----
  const BX = 324, BW = SW - 12 - BX, BY = 52, BH = 386;
  c.save(); rr(c, BX, BY, BW, BH, 22); c.fillStyle = 'rgba(0,0,0,.24)'; c.fill(); c.clip();
  c.fillStyle = vgrad(c, BY, BY + BH, ['rgba(255,255,255,.07)', 'rgba(255,255,255,0)']); c.fillRect(BX, BY, BW, BH);
  c.globalAlpha = .55;
  [[.06, .2, 0], [.24, .88, 1], [.42, .16, 2], [.58, .9, 3], [.76, .13, 4], [.93, .82, 0], [.96, .2, 1], [.13, .56, 2], [.5, .55, 3]].forEach(([fx, fy, di], i) => Props.draw(c, w.props[di % w.props.length], BX + BW * fx, BY + BH * fy, t, i / 9, wi));
  c.globalAlpha = 1;
  // 路徑（平滑的 S 曲線）
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (let i = 0; i < 7; i++) {
    const a = this.nodePosL(i), b = this.nodePosL(i + 1), done = Save.starsOf(levelId(wi, i)) > 0, mx = (a[0] + b[0]) / 2;
    const path = () => { c.beginPath(); c.moveTo(a[0], a[1]); c.bezierCurveTo(mx, a[1], mx, b[1], b[0], b[1]); };
    path(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 16; c.setLineDash([]); c.stroke();
    if (done) { path(); c.strokeStyle = shade(acc, .35); c.lineWidth = 9; c.stroke(); path(); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 3; c.stroke(); }
    else { path(); c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 6; c.setLineDash([1, 14]); c.stroke(); c.setLineDash([]); }
  }
  c.restore();
  rr(c, BX, BY, BW, BH, 22); c.lineWidth = 3; c.strokeStyle = acc; c.stroke();
  // 關卡節點
  for (let li = 0; li < LEVELS_PER_WORLD; li++) this.node(c, li, levelId(wi, li), this.nodePosL(li), nextId, acc);
  // 青蛙位置標記
  const ll = Save.d.lastLevel || 0;
  if (Math.floor(ll / LEVELS_PER_WORLD) === wi) {
    const [fx, fy] = this.nodePosL(ll % LEVELS_PER_WORLD), boss = ll % LEVELS_PER_WORLD === 7, hh = Math.abs(Math.sin(t * 3.2)) * 10;
    FrogArt.front(c, fx + (boss ? 58 : 46), fy + 8, { s: .5, t, skin: Save.d.skin, hat: Save.d.hat, hop: hh / 10, z: hh * 1.6, mood: 'happy', look: [-.5, 0] });
  }
  if (this.toast) { const a = clamp(Math.min(this.toast.t * 6, (2 - this.toast.t) * 3), 0, 1); c.save(); c.globalAlpha = a; UI.glass(c, BX + BW / 2 - 200, BY + 12, 400, 42, { r: 21, fill: 'rgba(8,16,28,.88)', border: '#ffd24a' }); UI.text(c, this.toast.s, BX + BW / 2, BY + 33, { size: 16, color: '#ffe27a', align: 'center', weight: 900, maxW: 370 }); c.restore(); }
  SettingsPanel.draw(c);
};

/* 地圖：橫式時左右滑動切換世界的手勢（保持跟直式一樣可用） */

/* =====================================================================
   蛙蛙商店（橫式）：左邊展示台＋動作按鈕，右邊分頁內容
   ===================================================================== */
ShopScene.prototype.drawL = function (c) {
  const t = this.t;
  stripesBg(c, '#2b6f4a', '#123a2a', 50);
  topBarL(c, '蛙蛙商店', 'sh_back');
  const cs = this.coinShake > 0 ? Math.sin(this.coinShake * 70) * 4 : 0;
  UI.counter(c, SW - 12 - 202 + cs, 9, 112, 28, Icons.coin, fmt(Save.d.coins), this.coinShake > 0 ? '#ff9a86' : '#ffe27a');
  UI.counter(c, SW - 12 - 84, 9, 84, 28, (cc, a, b, s, tt) => Icons.gem(cc, a, b, s, tt), fmt(Save.d.gems), '#9defff');

  // ---- 左：展示台 ----
  const X = 12, Y = 54, PW = 238, PH = 384;
  c.save(); rr(c, X, Y, PW, PH, 22); c.clip();
  c.fillStyle = vgrad(c, Y, Y + PH, ['#74d6a0', '#2f8d62', '#1f6a48']); c.fillRect(X, Y, PW, PH);
  sunburst(c, X + PW / 2, Y + 160, 300, t, 'rgba(255,255,255,.12)', 16);
  c.restore();
  rr(c, X, Y, PW, PH, 22); c.lineWidth = 4; c.strokeStyle = '#173d2a'; c.stroke(); rr(c, X + 3, Y + 3, PW - 6, PH - 6, 20); c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,.3)'; c.stroke();
  const px = X + PW / 2;
  ell(c, px, 252, 90, 20, 'rgba(0,0,0,.25)'); ell(c, px, 246, 86, 18, '#d9b46a', '#8c6a22', 3); ell(c, px, 240, 86, 18, '#f2d28a', '#8c6a22', 3);
  const bn = this.bounce > 0 ? Math.abs(Math.sin(this.bounce * 8)) * 18 * this.bounce : 0;
  FrogArt.front(c, px, 238, { s: 1.3, t, skin: this.pSkin, hat: this.pHat, mood: 'happy', blink: (t % 3.3) < .12 ? 1 : 0, sy: 1 + Math.sin(t * 2.4) * .015, z: bn, look: [Math.sin(t * .9) * .6, 0] });
  FX.draw(c, y => SH - y);
  const ps = skinOf(this.pSkin), ph = HATS.find(h => h.id === this.pHat);
  UI.text(c, `${ps.name}${ph && ph.id !== 'none' ? ' + ' + ph.name : ''}`, px, 284, { size: 18, color: '#fff', stroke: 'rgba(0,0,0,.65)', strokeW: 5, align: 'center', weight: 900, maxW: PW - 24 });

  // 動作按鈕（造型／帽子）或升級總覽
  if (this.tab === 0) {
    let tot = 0, mx = 0; for (const u of UPGRADES) { tot += Save.d.up[u.id] || 0; mx += u.max; }
    UI.text(c, `升級總等級 ${tot} / ${mx}`, px, 326, { size: 16, color: '#fff', stroke: 'rgba(0,0,0,.6)', strokeW: 4, align: 'center', weight: 900 });
    UI.glass(c, px - 90, 342, 180, 18, { r: 9, fill: 'rgba(0,20,30,.5)' });
    c.save(); rr(c, px - 87, 345, Math.max(10, 174 * tot / mx), 12, 6); c.fillStyle = grad(c, 0, 345, 0, 357, ['#ffe27a', '#f4b92c']); c.fill(); c.restore();
    UI.text(c, `最大生命 ${3 + (Save.d.up.hearts || 0)} 顆愛心`, px, 380, { size: 13, color: 'rgba(255,255,255,.85)', align: 'center', weight: 800 });
  } else {
    const list = this.tab === 1 ? SKINS : HATS, ownedKey = this.tab === 1 ? 'skins' : 'hats', eqKey = this.tab === 1 ? 'skin' : 'hat', pv = this.tab === 1 ? this.pSkin : this.pHat;
    const it = list.find(x => x.id === pv) || list[0], owned = Save.d[ownedKey].includes(it.id), eq = Save.d[eqKey] === it.id;
    const bx = X + 18, bw = PW - 36, byy = 318, bh = 56;
    if (!owned) { const can = Save.d.coins >= it.cost; UI.button(c, 'sh_act', bx, byy, bw, bh, '', { style: can ? 'gold' : 'dark', size: 21, icon: (cc, x, yy, s) => { UI.text(cc, '購買', x - 52, yy + 1, { size: 21, color: '#fff', stroke: 'rgba(20,30,40,.75)', strokeW: 5, weight: 900 }); Icons.coin(cc, x + 8, yy, s * .9, t); UI.text(cc, fmt(it.cost), x + 24, yy + 1, { size: 21, color: '#fff', stroke: 'rgba(20,30,40,.75)', strokeW: 5, weight: 900 }); }, iconSize: 26 }); }
    else if (!eq) UI.button(c, 'sh_act', bx, byy, bw, bh, '穿上', { style: 'green', size: 24 });
    else UI.button(c, 'sh_act', bx, byy, bw, bh, '使用中', { style: 'teal', size: 24, noHit: true });
  }
  credit(c, px, 424, { size: 12 });

  // ---- 右：分頁 ----
  const RX = 262, RW = SW - 12 - RX, tabs = ['升級', '造型', '帽子'], tw = 148;
  for (let i = 0; i < 3; i++) {
    const on = this.tab === i;
    UI.button(c, 'sh_t' + i, RX + i * (tw + 8), 54, tw, 40, tabs[i], { style: on ? 'orange' : 'dark', size: 20, icon: i === 0 ? Icons.flame : i === 1 ? Icons.frogHead : Icons.crown, iconSize: 22 });
  }
  if (this.tab === 0) this.drawUpgradesL(c, RX, 104, RW); else this.drawGridL(c, RX, 104, RW);
  if (this.toast) { const a = clamp(Math.min(this.toast.t * 6, (2 - this.toast.t) * 3), 0, 1); c.save(); c.globalAlpha = a; UI.glass(c, RX + RW / 2 - 210, 56, 420, 38, { r: 19, fill: 'rgba(8,16,28,.92)', border: this.toast.col }); UI.text(c, this.toast.s, RX + RW / 2, 76, { size: 16, color: this.toast.col, align: 'center', weight: 900, maxW: 390 }); c.restore(); }
  SettingsPanel.draw(c);
};

ShopScene.prototype.drawUpgradesL = function (c, x0, y0, rw) {
  const t = this.t, gap = 10, cw = (rw - gap) / 2, ch = 104;
  const cards = UPGRADES.concat([{ gem: true }]);
  cards.forEach((u, i) => {
    const x = x0 + (i % 2) * (cw + gap), y = y0 + Math.floor(i / 2) * (ch + gap);
    if (u.gem) {
      UI.panel(c, x, y, cw, ch, { r: 16, top: '#e3fbff', bot: '#b3e9f5' });
      Icons.gem(c, x + 40, y + 38, 38, t);
      UI.text(c, '寶石兌換金幣', x + 74, y + 28, { size: 18, color: '#0e5a70', weight: 900, maxW: cw - 86 });
      UI.text(c, '1 顆寶石 = 200 金幣', x + 74, y + 52, { size: 12.5, color: '#2a7a90', weight: 700, maxW: cw - 86 });
      UI.text(c, `你有 ${Save.d.gems} 顆寶石`, x + 16, y + ch - 24, { size: 13, color: '#2a7a90', weight: 800 });
      UI.button(c, 'sh_gem', x + cw - 122, y + ch - 52, 110, 40, '兌換', { style: Save.d.gems > 0 ? 'blue' : 'dark', size: 20 });
      return;
    }
    const lv = Save.d.up[u.id] || 0, maxed = lv >= u.max;
    UI.panel(c, x, y, cw, ch, { r: 16, top: '#fff9e6', bot: '#f6e2b0' });
    circ(c, x + 38, y + 38, 26, grad(c, 0, y + 12, 0, y + 64, ['#5a7a98', '#2b3f55']), '#16222e', 2.5);
    u.icon(c, x + 38, y + 38, 32, t);
    UI.text(c, u.name, x + 74, y + 26, { size: 18, color: '#6b3d0c', weight: 900, maxW: cw - 86 });
    UI.text(c, u.desc, x + 74, y + 49, { size: 12, color: '#8a6a3a', weight: 700, maxW: cw - 86 });
    for (let k = 0; k < u.max; k++) circ(c, x + 82 + k * 20, y + ch - 20, 6, k < lv ? '#43b52c' : 'rgba(0,0,0,.18)', k < lv ? '#1b6e12' : 'rgba(0,0,0,.3)', 1.6);
    if (maxed) UI.button(c, 'up_' + u.id, x + cw - 122, y + ch - 52, 110, 40, '已滿級', { style: 'teal', size: 17, noHit: true });
    else {
      const cost = u.cost[lv], can = Save.d.coins >= cost;
      UI.button(c, 'up_' + u.id, x + cw - 122, y + ch - 52, 110, 40, '', { style: can ? 'gold' : 'dark', icon: (cc, xx, yy, s) => { Icons.coin(cc, xx - 20, yy, s * .9, t); UI.text(cc, fmt(cost), xx - 6, yy + 1, { size: 18, color: '#fff', stroke: 'rgba(20,30,40,.75)', strokeW: 5, weight: 900 }); }, iconSize: 24 });
    }
  });
};

ShopScene.prototype.drawGridL = function (c, x0, y0, rw) {
  const t = this.t, list = this.tab === 1 ? SKINS : HATS, ownedKey = this.tab === 1 ? 'skins' : 'hats', eqKey = this.tab === 1 ? 'skin' : 'hat', pv = this.tab === 1 ? this.pSkin : this.pHat;
  const gx = 8, cols = 4, cw = (rw - gx * (cols - 1)) / cols, ch = 104;
  list.forEach((it, i) => {
    const col = i % cols, row = Math.floor(i / cols), x = x0 + col * (cw + gx), y = y0 + row * (ch + gx);
    const owned = Save.d[ownedKey].includes(it.id), eq = Save.d[eqKey] === it.id, sel = pv === it.id;
    UI.hits.push({ id: 'it_' + it.id, x, y, w: cw, h: ch });
    const pressed = UI.down === 'it_' + it.id;
    c.save(); if (pressed) { c.translate(x + cw / 2, y + ch / 2); c.scale(.96, .96); c.translate(-x - cw / 2, -y - ch / 2); }
    UI.panel(c, x, y, cw, ch, { r: 16, top: sel ? '#fffbd0' : '#fff6dc', bot: sel ? '#ffe27a' : '#efd9a4', edge: sel ? '#ff8d22' : '#1d2c3a' });
    if (sel) { c.save(); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,.9)'; rr(c, x + 1, y + 1, cw - 2, ch - 2, 16); c.stroke(); c.restore(); }
    if (this.tab === 1) FrogArt.front(c, x + cw / 2, y + 62, { s: .55, t, skin: it.id, hat: 'none', mood: 'happy', blink: 0 });
    else FrogArt.front(c, x + cw / 2, y + 64, { s: .55, t, skin: this.pSkin, hat: it.id, mood: 'happy', blink: 0 });
    UI.text(c, it.name, x + cw / 2, y + 77, { size: 14, color: '#6b3d0c', align: 'center', weight: 900, maxW: cw - 12 });
    if (eq) { rr(c, x + cw / 2 - 36, y + 84, 72, 15, 7.5); c.fillStyle = '#43b52c'; c.fill(); UI.text(c, '使用中', x + cw / 2, y + 91.5, { size: 11, color: '#fff', align: 'center', weight: 900 }); }
    else if (owned) UI.text(c, '已擁有', x + cw / 2, y + 91, { size: 12, color: '#2b8a22', align: 'center', weight: 900 });
    else { Icons.coin(c, x + cw / 2 - 26, y + 91, 13, t); UI.text(c, fmt(it.cost), x + cw / 2 - 14, y + 91, { size: 13.5, color: Save.d.coins >= it.cost ? '#a45d06' : '#c0392b', weight: 900 }); }
    c.restore();
  });
};

/* =====================================================================
   結算（橫式）：左邊星星／條件／獎勵，右邊慶祝青蛙＋按鈕
   ===================================================================== */
ResultScene.prototype.drawL = function (c) {
  const r = this.r, t = this.t, wi = this.ld.wi, w = this.ld.world;
  Scenes.draw(c, wi, 0, 0, SW, SH, t);
  c.fillStyle = 'rgba(8,14,24,.58)'; c.fillRect(0, 0, SW, SH);
  sunburst(c, SW / 2, 230, 620, t, 'rgba(255,230,120,.08)', 18);
  FX.draw(c, y => SH - y);
  const pw = 700, ph = 388, px = (SW - pw) / 2, py = 54;
  UI.panel(c, px, py, pw, ph, { r: 28 });
  // 標題（壓在面板上緣）
  const k = ease.outBack(clamp(t / .5, 0, 1));
  c.save(); c.translate(SW / 2, 38); c.scale(k, k);
  UI.text(c, r.isBoss ? '魔王擊敗!' : '過關了!', 0, 0, { size: 54, color: grad(c, 0, -26, 0, 26, ['#fff6a0', '#ffd23a', '#ff9a1c']), stroke: '#6a2c04', strokeW: 12, align: 'center', weight: 900, glow: '#ffb300', glowR: 20 });
  c.restore();
  // 左半
  const lx = px + 190;
  UI.text(c, `${w.name} · 第 ${this.ld.li + 1} 關「${this.ld.def.name}」`, lx, py + 40, { size: 15, color: '#7a5a2a', align: 'center', weight: 800, maxW: 330 });
  if (r.stars > r.oldStars && r.oldStars > 0) UI.text(c, '新紀錄!', lx, py + 62, { size: 16, color: '#2b8a22', align: 'center', weight: 900 });
  UI.stars(c, lx, py + 106, r.stars, 58, 3, 10, this.starShown);
  const conds = r.isBoss
    ? [['擊敗魔王', true], ['受傷不超過 1 次', r.hurt <= 1], ['完全沒有受傷', r.hurt === 0]]
    : [['順利抵達終點', true], [`收集 ${r.starCoins} 枚以上金幣 (${r.coins})`, r.coins >= r.starCoins], ['完全沒有受傷', r.hurt === 0]];
  conds.forEach((cd, i) => {
    const y = py + 166 + i * 34, a = clamp((t - .8 - i * .25) * 4, 0, 1);
    c.save(); c.globalAlpha = a; checkMark(c, px + 44, y, 24, cd[1]);
    UI.text(c, cd[0], px + 66, y + 1, { size: 17, color: cd[1] ? '#2a6a1a' : '#7a6a58', weight: 900, maxW: 290 }); c.restore();
  });
  c.fillStyle = 'rgba(120,80,20,.2)'; c.fillRect(px + 30, py + 274, 322, 2);
  const ca = clamp((t - 1.5) * 3, 0, 1);
  c.save(); c.globalAlpha = ca;
  Icons.coin(c, px + 46, py + 304, 26, t); UI.text(c, '通關獎勵', px + 70, py + 304, { size: 17, color: '#6b3d0c', weight: 900 });
  UI.text(c, '+' + Math.round(r.bonus * this.coinShown), px + 346, py + 304, { size: 26, color: '#d98a06', stroke: '#fff7d6', strokeW: 6, align: 'right', weight: 900 });
  Icons.coin(c, px + 46, py + 338, 20, t + 1); UI.text(c, `關卡中拿到 ${r.coins} 枚 · 打倒 ${r.kills} 隻敵人`, px + 70, py + 338, { size: 14, color: '#7a5a2a', weight: 800, maxW: 280 });
  if (r.gems > 0) { Icons.gem(c, px + 46, py + 368, 28, t); UI.text(c, '寶石', px + 70, py + 368, { size: 17, color: '#0e5a70', weight: 900 }); UI.text(c, '+' + r.gems, px + 346, py + 368, { size: 26, color: '#16a5c8', stroke: '#e3fbff', strokeW: 6, align: 'right', weight: 900 }); }
  else UI.text(c, `目前金幣 ${fmt(Save.d.coins)}`, lx, py + 368, { size: 14, color: '#8a6a3a', align: 'center', weight: 800 });
  c.restore();
  // 分隔線
  c.fillStyle = 'rgba(120,80,20,.25)'; c.fillRect(px + 372, py + 30, 2, ph - 60);
  // 右半
  const rx = px + 372 + (pw - 372) / 2;
  const hp = Math.abs(Math.sin(t * 4));
  FrogArt.front(c, rx - 66, py + 118, { s: .88, t, skin: Save.d.skin, hat: Save.d.hat, hop: hp, z: hp * 24, mood: 'happy', blink: 0 });
  FrogArt.front(c, rx + 78, py + 126, { s: .72, t, skin: 'pink', hat: 'flower', hop: hp, z: Math.abs(Math.sin(t * 4 + 1.2)) * 24, mood: 'happy', blink: 0 });
  if (this.nxt === null) UI.text(c, '恭喜你完成了全部 48 關!', rx, py + 188, { size: 17, color: '#d98a06', stroke: '#fff7d6', strokeW: 5, align: 'center', weight: 900, maxW: 300 });
  const newWorld = this.nxt !== null && Math.floor(this.nxt / LEVELS_PER_WORLD) !== wi;
  const label = this.nxt === null ? '回到地圖' : newWorld ? '前往下個世界' : '下一關';
  UI.button(c, 'r_next', rx - 140, py + 206, 280, 68, label, { style: 'green', icon: Icons.next, size: 28, pulse: true, shine: true });
  UI.button(c, 'r_retry', rx - 140, py + 292, 134, 54, '重玩', { style: 'orange', icon: Icons.retry, size: 21 });
  UI.button(c, 'r_map', rx + 6, py + 292, 134, 54, '地圖', { style: 'blue', icon: Icons.map, size: 21 });
  credit(c, rx, py + 366, { size: 13, stroke: null, color: '#b87a0c' });
};

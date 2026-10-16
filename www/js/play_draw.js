'use strict';
/* =====================================================================
   遊戲畫面繪製：場地、物件、青蛙、HUD、控制區、各種彈出視窗
   ===================================================================== */
const Panels = {
  strips: {}, ctrl: {}, vigs: {}, sideKey: '', sideCv: null,
  /* 直式：上方 80px 標題條 */
  worldStrip(wi) {
    if (this.strips[wi]) return this.strips[wi];
    const cv = document.createElement('canvas'); cv.width = W * 2; cv.height = 80 * 2;
    const g = cv.getContext('2d'); g.scale(2, 2);
    Scenes.draw(g, wi, 0, -20, W, 80 + 20 + 30, 0);
    g.fillStyle = vgrad(g, 0, 80, ['rgba(0,0,0,.25)', 'rgba(0,0,0,.55)']); g.fillRect(0, 0, W, 80);
    g.fillStyle = WORLDS[wi].accent; g.fillRect(0, 76, W, 4); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 79, W, 1);
    return this.strips[wi] = cv;
  },
  /* 直式：下方控制區（730~920） */
  controls(wi) {
    if (this.ctrl[wi]) return this.ctrl[wi];
    const h = 190, w = WORLDS[wi];
    const cv = document.createElement('canvas'); cv.width = W * 2; cv.height = h * 2;
    const g = cv.getContext('2d'); g.scale(2, 2);
    g.fillStyle = vgrad(g, 0, h, [shade(w.accent, -.7), shade(w.accent, -.88)]); g.fillRect(0, 0, W, h);
    g.strokeStyle = 'rgba(255,255,255,.04)'; g.lineWidth = 12; for (let x = -h; x < W + h; x += 34) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + h, 0); g.stroke(); }
    g.fillStyle = w.accent; g.fillRect(0, 0, W, 4); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, 4, W, 2);
    g.fillStyle = radial(g, W / 2, h, 0, 260, [rgba(w.accent, .25), rgba(w.accent, 0)]); g.fillRect(0, 0, W, h);
    return this.ctrl[wi] = cv;
  },
  /* 橫式：整個畫面的側邊背景（場地會蓋在中間；只快取目前這一張） */
  side(wi) {
    const key = wi + '_' + SW;
    if (this.sideKey === key) return this.sideCv;
    const S = 2, cv = document.createElement('canvas'); cv.width = SW * S; cv.height = SH * S;
    const g = cv.getContext('2d'); g.scale(S, S);
    const w = WORLDS[wi];
    Scenes.draw(g, wi, 0, 0, SW, SH, 0);
    g.fillStyle = vgrad(g, 0, SH, ['rgba(4,10,18,.5)', 'rgba(4,10,18,.84)']); g.fillRect(0, 0, SW, SH);
    g.strokeStyle = 'rgba(255,255,255,.035)'; g.lineWidth = 14; for (let x = -SH; x < SW + SH; x += 38) { g.beginPath(); g.moveTo(x, SH); g.lineTo(x + SH, 0); g.stroke(); }
    g.fillStyle = radial(g, SW / 2, SH, 0, SW * .55, [rgba(w.accent, .3), rgba(w.accent, 0)]); g.fillRect(0, 0, SW, SH);
    this.sideKey = key; this.sideCv = cv;
    return cv;
  },
  vignette(rows) {
    if (this.vigs[rows]) return this.vigs[rows];
    const hh = rows * TILE;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = hh;
    const g = cv.getContext('2d');
    g.fillStyle = radial(g, W / 2, hh / 2, hh * .35, hh * .78, ['rgba(0,0,0,0)', 'rgba(0,0,0,.34)']); g.fillRect(0, 0, W, hh);
    return this.vigs[rows] = cv;
  },
};

/* 火車 */
function drawTrain(c, lane, yc, wi, t) {
  const R_ = lane.rail, d = R_.dirv, n = Math.round(R_.len / 140);
  const col = [0, '#3b82f6', 0, '#6a5058', '#e8eefc', 0][wi] || '#3b82f6';
  for (let i = 0; i < n; i++) {
    const cx = d > 0 ? R_.x + 70 + i * 140 : R_.x - 70 - i * 140;
    c.save(); c.translate(cx, yc); c.scale(d, 1);
    shadowEll(c, 0, 20, 62, 5, .3);
    const head = i === 0;
    c.beginPath(); if (head) { c.moveTo(-68, 18); c.lineTo(-68, -18); c.lineTo(40, -22); c.quadraticCurveTo(72, -18, 70, 18); } else { c.moveTo(-68, 18); c.lineTo(-68, -20); c.lineTo(68, -20); c.lineTo(68, 18); } c.closePath();
    c.fillStyle = grad(c, 0, -22, 0, 18, [shade(col, .35), col, shade(col, -.25)]); c.fill(); c.lineWidth = 2.4; c.strokeStyle = shade(col, -.65); c.lineJoin = 'round'; c.stroke();
    c.fillStyle = wi === 3 ? '#ff7a2a' : '#ffd23a'; c.fillRect(-68, 6, head ? 128 : 136, 3.5);
    for (let k = 0; k < 4; k++) Obj.glass(c, -58 + k * 28, -15, 20, 16, 3);
    if (head) { Obj.glass(c, 44, -16, 16, 16, 3); c.globalAlpha = .45; circ(c, 76, 4, 24, radial(c, 76, 4, 0, 24, ['rgba(255,250,200,.95)', 'rgba(255,250,200,0)'])); c.globalAlpha = 1; circ(c, 66, 6, 3.4, '#fffbd0'); }
    for (const x of [-46, -22, 22, 46]) { circ(c, x, 20, 5.5, '#222'); circ(c, x, 20, 2.4, '#999'); }
    c.restore();
  }
}

/* ------------------------------------------------------------------ */
PlayScene.prototype.draw = function (c) {
  this.layout();
  const t = this.t, v = this.view, wi = this.wi;
  if (LAND) c.drawImage(Panels.side(wi), 0, 0, SW, SH);
  else c.drawImage(Panels.worldStrip(wi), 0, 0, W, 80);
  // ---- 場地（虛擬場地座標 → 螢幕）----
  c.save();
  c.translate(v.x, v.y); c.scale(v.k, v.k);
  c.beginPath(); c.rect(0, 0, W, FIELD_BOTTOM); c.clip();
  const shk = FX.shake; if (shk > 0) c.translate(rand(-shk, shk) * .4, rand(-shk, shk) * .4);
  this.drawLanes(c);
  this.drawEnts(c);
  FX.draw(c, wy => this.sy(wy));
  Weather.draw(c, t);
  this.drawLighting(c);
  c.restore();
  if (LAND) this.drawFrame(c);
  // 場地上方的提示（提示訊息、新手提示）
  c.save(); c.translate(v.x, v.y); c.scale(v.k, v.k); c.beginPath(); c.rect(0, 0, W, FIELD_BOTTOM); c.clip();
  this.drawFieldTexts(c);
  c.restore();
  if (LAND) { this.drawHUDL(c); this.drawControlsL(c); } else { this.drawHUD(c); this.drawControls(c); }
  this.drawOverlays(c);
  if (FX.flash > 0) { c.save(); c.globalAlpha = FX.flash * .8; c.fillStyle = FX.flashColor; c.fillRect(0, 0, SW, SH); c.restore(); }
};

/* 橫式：場地左右的金屬邊框與陰影 */
PlayScene.prototype.drawFrame = function (c) {
  const v = this.view, fw = W * v.k, x1 = v.x + fw, acc = this.world.accent;
  for (const [x, dir] of [[v.x, -1], [x1, 1]]) {
    c.fillStyle = grad(c, x, 0, x + dir * 34, 0, ['rgba(0,0,0,.45)', 'rgba(0,0,0,0)']); c.fillRect(dir < 0 ? x - 34 : x, 0, 34, SH);
    c.fillStyle = acc; c.fillRect(dir < 0 ? x - 5 : x, 0, 5, SH);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(dir < 0 ? x - 5 : x + 3, 0, 2, SH);
    c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(dir < 0 ? x - 7 : x + 5, 0, 2, SH);
  }
};

PlayScene.prototype.drawLighting = function (c) {
  const wi = this.wi, fh = FIELD_BOTTOM - FIELD_TOP;
  c.drawImage(Panels.vignette(FIELD_ROWS), 0, FIELD_TOP);
  const tint = [0, 'rgba(30,0,80,.20)', 0, 'rgba(120,20,0,.10)', 'rgba(0,0,50,.14)', 0][wi];
  if (tint) { c.fillStyle = tint; c.fillRect(0, FIELD_TOP, W, fh); }
  if (this.hurtFlash > 0) { c.save(); c.globalAlpha = this.hurtFlash * .45; c.fillStyle = radial(c, W / 2, (FIELD_TOP + FIELD_BOTTOM) / 2, 160, 440, ['rgba(255,0,0,0)', 'rgba(255,0,0,.9)']); c.fillRect(0, FIELD_TOP, W, fh); c.restore(); }
  if (this.idle > 8 && this.state === 'play') { c.save(); c.globalAlpha = .12 + Math.sin(this.t * 12) * .08; c.strokeStyle = '#ff3030'; c.lineWidth = 14; c.strokeRect(0, FIELD_TOP, W, fh); c.restore(); }
};

PlayScene.prototype.frogPass = function () { const f = this.f; return clamp(Math.round(f.wy / TILE - .5), 0, this.rows - 1); };

PlayScene.prototype.drawLanes = function (c) {
  const camY = this.camY, base = Math.floor(this.camRow), t = this.t, wi = this.wi;
  const rMax = Math.min(this.rows - 1, base + FIELD_ROWS + 2), rMin = Math.max(0, base - 1);
  const fp = this.frogPass();
  for (let r = rMax; r >= rMin; r--) {
    const lane = this.lanes[r], y0 = FIELD_BOTTOM - (r + 1) * TILE + camY, yc = y0 + TILE / 2;
    c.drawImage(LaneArt.get(this.lvl, lane), 0, y0, W, TILE);
    switch (lane.type) {
      case 'water': LaneArt.waterFX(c, lane, wi, y0, t); this.drawPlatforms(c, lane, yc); break;
      case 'road': this.drawVehicles(c, lane, yc); break;
      case 'rail': this.drawRail(c, lane, y0, yc); break;
      case 'goal': this.drawGoal(c, lane, y0, yc); break;
      case 'bossfloor': if (!lane.top) this.drawBoss(c); break;
    }
    if (lane.type !== 'water') this.drawItems(c, lane, yc);
    if (lane.type === 'safe') this.drawVehicles(c, lane, yc);
    if (lane.type === 'rail' && lane.rail.state === 'run') drawTrain(c, lane, yc, wi, t);
    if (fp === r) this.drawFrog(c);
    for (const k in lane.blocks) { const col = +k; if (!isNaN(col)) Props.draw(c, lane.blocks[k], cellX(col), yc, t, ((col * 13 + r * 7) % 10) / 10, wi); }
  }
};

PlayScene.prototype.drawItems = function (c, lane, yc) {
  const t = this.t;
  for (const it of lane.items) {
    if (it.got) continue;
    const x = cellX(it.col);
    switch (it.kind) {
      case 'coin': shadowEll(c, x, yc + 11, 9, 3, .22); Icons.coin(c, x, yc - 3 + Math.sin(t * 4 + it.col) * 2, 21, t + it.col); break;
      case 'gem': shadowEll(c, x, yc + 13, 10, 3.4, .25); Icons.gem(c, x, yc - 2 + Math.sin(t * 3) * 2, 26, t, '#44e0ff'); break;
      case 'heart': shadowEll(c, x, yc + 13, 10, 3.4, .25); Icons.heart(c, x, yc - 3 + Math.sin(t * 5) * 2.4, 27 + Math.sin(t * 5) * 1.5, true); break;
      case 'crate': shadowEll(c, x, yc + 15, 14, 4, .28); Icons.crate(c, x, yc - 3, 34, t); break;
    }
  }
};

PlayScene.prototype.drawVehicles = function (c, lane, yc) {
  const tmp = [], t = this.t;
  for (const o of lane.objs) {
    if (o.dead || !o.harm) continue;
    for (const ix of laneInst(lane, o, tmp)) Obj.vehicle(c, o, ix, yc, lane.dir || 1, t, { frozen: o.frozen > 0, flash: o.hitT > 0 ? .6 : 0 });
  }
};

PlayScene.prototype.drawPlatforms = function (c, lane, yc) {
  const tmp = [], t = this.t;
  for (const o of lane.objs) {
    if (!o.plat) continue;
    const st = this.platState(o);
    if (o.broken && !(o.sink)) { /* 冰塊碎掉：不畫 */ continue; }
    for (const ix of laneInst(lane, o, tmp)) {
      Plat.draw(c, o, ix, yc, { dir: lane.dir || 1, t, alpha: st.blink !== undefined ? st.blink : st.alpha, sink: st.sink, crack: st.crack, dive: st.dive, warn: st.warn, shake: st.shake, blink: st.blink });
      if (o.item === 'coin') Icons.coin(c, ix, yc - 22 + Math.sin(t * 4 + ix * .05) * 2, 21, t);
      if (o.head) { /* 危險標示 */ }
    }
  }
  if (lane.temps) for (const tp of lane.temps) { const a = Math.min(1, tp.ttl); Plat.draw(c, { kind: 'floe', w: tp.w, x0: tp.x, ph: 0 }, tp.x, yc, { dir: 1, t, alpha: a, sink: 0, crack: tp.ttl < 1.5 ? 1 : 0 }); }
};

PlayScene.prototype.drawRail = function (c, lane, y0, yc) {
  const R_ = lane.rail, t = this.t;
  const on = R_.state === 'warn' && Math.floor(t * 6) % 2 === 0;
  for (const x of [22, W - 22]) {
    rr(c, x - 3, yc - 22, 6, 30, 2); c.fillStyle = '#4a5160'; c.fill();
    circ(c, x - 7, yc - 17, 5.5, on ? '#ff3b3b' : '#6a1c1c', '#222', 1.4); circ(c, x + 7, yc - 17, 5.5, !on && R_.state === 'warn' ? '#ff3b3b' : '#6a1c1c', '#222', 1.4);
    if (on) { c.globalAlpha = .5; circ(c, x - 7, yc - 17, 18, radial(c, x - 7, yc - 17, 0, 18, ['rgba(255,60,60,.9)', 'rgba(255,60,60,0)'])); c.globalAlpha = 1; }
  }
  if (R_.state === 'warn') { c.save(); c.globalAlpha = .1 + (on ? .1 : 0); c.fillStyle = '#ff2b2b'; c.fillRect(0, y0, W, TILE); c.restore(); UI.text(c, '火車來了!', W / 2, yc, { size: 20, color: '#fff', stroke: '#c01010', strokeW: 5, align: 'center', weight: 900 }); }
};

PlayScene.prototype.drawGoal = function (c, lane, y0, yc) {
  const t = this.t;
  for (const col of [2, 6]) { const x = cellX(col); rr(c, x - 4, y0 - 36, 8, 74, 3); c.fillStyle = grad(c, x - 4, 0, x + 4, 0, ['#f4f4f4', '#b8b8b8']); c.fill(); c.strokeStyle = '#555'; c.lineWidth = 1.6; c.stroke(); circ(c, x, y0 - 38, 6, '#ffd23a', '#8c5a06', 1.6); }
  c.beginPath(); c.moveTo(cellX(2), y0 - 18); c.quadraticCurveTo(W / 2, y0 + 6 + Math.sin(t * 2) * 3, cellX(6), y0 - 18); c.lineTo(cellX(6), y0 + 8); c.quadraticCurveTo(W / 2, y0 + 32 + Math.sin(t * 2) * 3, cellX(2), y0 + 8); c.closePath();
  c.fillStyle = '#ff4b3c'; c.fill(); c.strokeStyle = '#8a1e14'; c.lineWidth = 2.4; c.stroke();
  UI.text(c, '終 點', W / 2, y0 + 7 + Math.sin(t * 2) * 3, { size: 20, color: '#fff', stroke: '#8a1e14', strokeW: 5, align: 'center', weight: 900 });
  for (const col of [0, 8]) Icons.flag(c, cellX(col), y0 + 14, 54, t + col);
};

PlayScene.prototype.drawBoss = function (c) {
  const b = this.boss; if (!b) return;
  const sy = this.sy(b.y);
  let k = 1;
  if (b.state === 'dead') {
    k = Math.max(0, 1 - Math.max(0, b.deathT - 1.4) / 1.2);
    if (k <= 0) return;
  }
  c.save();
  if (b.state === 'dead') { c.globalAlpha = k; c.translate(Math.sin(b.deathT * 40) * 4, 0); }
  if (b.state === 'windup') { c.translate(Math.sin(b.t * 50) * 1.4 * b.open, 0); }
  c.translate(b.x, sy); c.scale(.8, .8); c.translate(-b.x, -sy);
  BossArt.draw(c, b.kind, b.x, sy, { t: b.t, flash: b.state === 'dead' ? (Math.sin(b.deathT * 30) > 0 ? 1 : 0) : b.flash, open: b.open, hpk: b.hp / b.maxhp, rage: b.rage });
  if (b.frozen > 0) { c.globalAlpha = .45; rr(c, b.x - 92, sy - 52, 184, 108, 14); c.fillStyle = 'rgba(170,235,255,.7)'; c.fill(); c.strokeStyle = '#eaffff'; c.lineWidth = 3; c.stroke(); }
  c.restore();
};

/* ---------- 青蛙 ---------- */
PlayScene.prototype.drawFrog = function (c) {
  const f = this.f, t = this.t;
  const sy = this.sy(f.wy);
  const giantTarget = this.mut.giant > 0 ? 1.85 : 1;
  this.gs = (this.gs || 1) + (giantTarget - (this.gs || 1)) * .15;
  let o = {
    s: this.gs, ang: f.ang, hop: f.hopT < 1 ? Math.sin(f.hopT * PI) : 0, z: f.z, sx: f.sx, sy: f.sy, t,
    skin: Save.d.skin, hat: Save.d.hat, blink: f.blink, mouth: f.mouth, mood: f.mood, mut: this.mut, look: f.look, alpha: 1,
  };
  if (f.invul > 0 && !f.dead) o.alpha = Math.floor(t * 16) % 2 ? .35 : 1;
  if (f.dead) {
    const d = f.dead, k = clamp(d.t / .9, 0, 1);
    switch (d.kind) {
      case 'hit': o.sy = .16; o.sx = 1.75; o.z = 0; o.mood = 'dead'; o.hideHat = false; break;
      case 'drown': o.alpha = 1 - k; o.s *= 1 - k * .35; o.z = -k * 10; o.mood = 'dizzy'; o.mut = {}; break;
      case 'burn': o.alpha = 1 - k * .9; o.mood = 'dead'; o.mut = {}; o.s *= 1 - k * .2; break;
      case 'void': o.alpha = 1 - k; o.s *= 1 - k * .9; o.ang += k * 14; o.mood = 'dizzy'; o.mut = {}; break;
    }
  }
  const sc = c;
  if (f.dead && f.dead.kind === 'burn') c.filter = `grayscale(${f.dead.t}) brightness(${1 - f.dead.t * .4})`;
  FrogArt.draw(c, f.x, sy, o);
  c.filter = 'none';
  if (f.dead && f.dead.kind === 'hit') { // 頭上轉圈的星星
    for (let i = 0; i < 3; i++) { const a = t * 6 + i * TAU / 3; Icons.star(c, f.x + Math.cos(a) * 20, sy - 14 + Math.sin(a) * 6, 6, true); }
  }
  if (f.sparkle > 0) { c.save(); c.globalAlpha = f.sparkle; for (let i = 0; i < 5; i++) { const a = t * 3 + i * TAU / 5; Icons.sparkle(c, f.x + Math.cos(a) * 30, sy - 8 + Math.sin(a) * 22, 5); } c.restore(); }
  if (this.mut.fly > 0 && this.mut.fly < 2 && Math.floor(t * 10) % 2 === 0) UI.text(c, '!', f.x, sy - 40, { size: 22, color: '#fff', stroke: '#c01010', strokeW: 5, align: 'center', weight: 900 });
};

/* ---------- 實體：飛行怪、天降、子彈 ---------- */
PlayScene.prototype.drawEnts = function (c) {
  const t = this.t;
  // 天降攻擊的預警圈（貼在地面上，所以畫在最前面但在實體底下）
  for (const e of this.ents) {
    if (e.type !== 'strike') continue;
    const y = e.kind === 'laser' ? 0 : this.sy(e.y);
    if (e.kind === 'laser') {
      const x = e.x;
      if (!e.hit) { c.save(); const k = 1 - e.warn / 1.2; c.globalAlpha = .2 + .35 * k + Math.sin(t * 24) * .1; c.fillStyle = '#ff2b2b'; c.fillRect(x - 24, FIELD_TOP, 48, FIELD_BOTTOM - FIELD_TOP); c.globalAlpha = .9; c.strokeStyle = '#ff6a6a'; c.lineWidth = 2; c.strokeRect(x - 24, FIELD_TOP, 48, FIELD_BOTTOM - FIELD_TOP); ctxText(c, '!', x, FIELD_TOP + 40, 26, '#fff', '#c01010'); c.restore(); }
      else { StrikeArt.laser(c, x, FIELD_TOP, FIELD_BOTTOM, e.hitT, t); }
      continue;
    }
    if (!e.hit) {
      const k = 1 - e.warn / 1.15;
      StrikeArt.warn(c, e.kind, e.x, y, k, t);
      if (k > .15) StrikeArt.fall(c, e.kind, e.x, y, clamp((k - .15) / .85, 0, 1) * clamp((k - .15) / .85, 0, 1));
    } else {
      if (e.kind === 'geyser') StrikeArt.geyser(c, e.x, y, e.hitT, t);
      StrikeArt.impact(c, e.kind, e.x, y, e.hitT);
    }
  }
  for (const e of this.ents) {
    switch (e.type) {
      case 'flyer': {
        const sy = this.sy(e.y);
        if (e.warn > 0) { // 邊緣預警
          const x = e.sideL ? 22 : W - 22; c.save(); const a = Math.floor(t * 8) % 2 ? 1 : .55; c.globalAlpha = a;
          poly(c, e.sideL ? [x - 10, sy - 14, x + 12, sy, x - 10, sy + 14] : [x + 10, sy - 14, x - 12, sy, x + 10, sy + 14], '#ff3b3b', '#fff', 2); ctxText(c, '!', x + (e.sideL ? -2 : 2), sy, 16, '#fff'); c.restore();
          c.save(); c.globalAlpha = .12; c.fillStyle = '#ff2b2b'; c.fillRect(0, sy - 22, W, 44); c.restore();
        } else Fly.draw(c, e.kind, e.x, sy, e.vx > 0 ? 1 : -1, t + e.ph, 1);
        if (e.frozen > 0) { c.save(); c.globalAlpha = .6; circ(c, e.x, this.sy(e.y), 22, 'rgba(170,235,255,.7)', '#eaffff', 2); c.restore(); }
        break;
      }
      case 'hawk': {
        const sy = this.sy(e.y);
        if (e.warn > 0) { const x = e.vx > 0 ? 22 : W - 22; c.save(); c.globalAlpha = Math.floor(t * 10) % 2 ? 1 : .5; poly(c, e.vx > 0 ? [x - 12, sy - 16, x + 14, sy, x - 12, sy + 16] : [x + 12, sy - 16, x - 14, sy, x + 12, sy + 16], '#ff3b3b', '#fff', 2); ctxText(c, '!', x, sy, 18, '#fff'); c.restore(); }
        else Fly.draw(c, 'hawk', e.x, sy, e.vx > 0 ? 1 : -1, t, 1.15);
        break;
      }
      case 'minion': Obj.vehicle(c, { kind: e.kind, w: VEH[e.kind].w, h: VEH[e.kind].h, x0: 0, walker: true }, e.x, this.sy(e.y), e.vx > 0 ? 1 : -1, t, { frozen: e.frozen > 0 }); break;
      case 'coinfx': Icons[e.gem ? 'gem' : 'coin'](c, e.x, this.sy(e.y), e.gem ? 24 : 20, t * 2); break;
      case 'bolt': {
        const k = e.t / e.life; c.save(); c.globalAlpha = 1 - k; c.lineJoin = 'round'; c.lineCap = 'round';
        c.beginPath(); e.pts.forEach((p, i) => i ? c.lineTo(p[0], this.sy(p[1])) : c.moveTo(p[0], this.sy(p[1])));
        c.shadowColor = '#ffe93a'; c.shadowBlur = 16; c.strokeStyle = '#ffe93a'; c.lineWidth = 9; c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = 3.4; c.stroke(); c.restore(); break;
      }
    }
  }
  for (const p of this.projs) ProjArt.draw(c, p, p.x, this.sy(p.y), t + p.t);
};

/* ---------- HUD：直式（上方 80px） ---------- */
PlayScene.prototype.drawHUD = function (c) {
  const t = this.t;
  // 愛心
  const sz = this.maxHearts > 5 ? 22 : 25, gap = this.maxHearts > 5 ? 22 : 26;
  for (let i = 0; i < this.maxHearts; i++) {
    const full = i < this.hearts, pulse = full && i === this.hearts - 1 && this.hearts === 1 ? 1 + Math.sin(t * 10) * .12 : 1;
    Icons.heart(c, 22 + i * gap, 25, sz * pulse, full);
  }
  // 金幣
  const txt = this.isBoss ? fmt(Save.d.coins) : this.coinsGot + '/' + this.lvl.starCoins;
  UI.counter(c, 232, 10, 116, 30, Icons.coin, txt, this.isBoss || this.coinsGot < this.lvl.starCoins ? '#ffe27a' : '#9bff7a');
  UI.roundIcon(c, 'pause', 412, 26, 19, Icons.pause, { style: 'blue' });
  // 進度條 / 魔王血條
  const y = 58, x0 = 20, x1 = 430;
  if (this.isBoss && this.boss) this.drawBossBar(c, x0, x1, y, 18, true);
  else {
    this.drawProgress(c, x0, x1, y);
    UI.text(c, `${this.world.name}  ${this.lvl.li + 1}/${LEVELS_PER_WORLD}`, x0, y + 18, { size: 11, color: '#fff', stroke: 'rgba(0,0,0,.65)', strokeW: 3, weight: 800 });
  }
};
/* 魔王血條（直式在上方、橫式在左側面板） */
PlayScene.prototype.drawBossBar = function (c, x0, x1, y, h, withName) {
  const b = this.boss, k = clamp(b.hp / b.maxhp, 0, 1);
  this.bossBarShown = (this.bossBarShown === undefined ? 1 : this.bossBarShown); this.bossBarShown += (k - this.bossBarShown) * .08;
  const bx = x0 + 22, bw = x1 - x0 - 22, ih = h - 4;
  UI.glass(c, bx, y - h / 2 + 1, bw, h, { r: h / 2, fill: 'rgba(0,0,0,.6)', border: 'rgba(255,255,255,.35)' });
  c.save(); rr(c, bx + 2, y - ih / 2 + 1, (bw - 4) * this.bossBarShown, ih, ih / 2); c.fillStyle = '#ffd23a'; c.fill(); c.restore();
  c.save(); rr(c, bx + 2, y - ih / 2 + 1, Math.max(8, (bw - 4) * k), ih, ih / 2); c.fillStyle = grad(c, 0, y - ih / 2, 0, y + ih / 2, ['#ff8a7a', '#e8352b', '#a01208']); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(bx + 6, y - ih / 2 + 3, Math.max(0, (bw - 12) * k), 3); c.restore();
  Icons.skull(c, x0 + 8, y + 1, 26);
  if (withName) UI.text(c, BossArt.names[b.kind], (bx + x1) / 2, y + 1, { size: 12, color: '#fff', stroke: 'rgba(0,0,0,.7)', strokeW: 3.5, align: 'center', weight: 900 });
};
PlayScene.prototype.drawProgress = function (c, x0, x1, y) {
  const t = this.t;
  UI.glass(c, x0, y - 6, x1 - x0, 14, { r: 7, fill: 'rgba(0,0,0,.5)', border: 'rgba(255,255,255,.3)' });
  const prog = clamp(this.bestRow / (this.rows - 1), 0, 1);
  this.progShown = (this.progShown || 0) + (prog - (this.progShown || 0)) * .12;
  c.save(); rr(c, x0 + 2, y - 4, Math.max(10, (x1 - x0 - 4) * this.progShown), 10, 5); c.fillStyle = grad(c, 0, y - 4, 0, y + 6, ['#b5f27e', '#43b52c']); c.fill(); c.restore();
  Icons.frogHead(c, x0 + 6 + (x1 - x0 - 24) * this.progShown, y + 1, 22, skinOf(Save.d.skin).body);
  Icons.flag(c, x1 - 8, y - 2, 28, t);
};

/* ---------- HUD：橫式（左側：生命／關卡／進度／變種；右側：金幣、暫停） ---------- */
PlayScene.prototype.drawHUDL = function (c) {
  const t = this.t, lw = this.sideW, rx = SW - lw;
  // 愛心
  const n = this.maxHearts, gap = Math.min(28, (lw - 28) / n), sz = Math.min(26, gap * 1.0);
  UI.glass(c, 8, 8, lw - 16, 38, { r: 19, fill: 'rgba(8,16,28,.45)', border: 'rgba(255,255,255,.18)' });
  const hx0 = lw / 2 - (n - 1) * gap / 2;
  for (let i = 0; i < n; i++) {
    const full = i < this.hearts, pulse = full && i === this.hearts - 1 && this.hearts === 1 ? 1 + Math.sin(t * 10) * .12 : 1;
    Icons.heart(c, hx0 + i * gap, 27, sz * pulse, full);
  }
  // 關卡資訊
  if (this.isBoss && this.boss) {
    UI.text(c, `${this.world.name} · 魔王關`, lw / 2, 62, { size: 13, color: '#fff', stroke: 'rgba(0,0,0,.65)', strokeW: 3, align: 'center', weight: 800, maxW: lw - 16 });
    UI.text(c, BossArt.names[this.boss.kind], lw / 2, 82, { size: 16, color: '#ffe27a', stroke: 'rgba(0,0,0,.7)', strokeW: 4, align: 'center', weight: 900, maxW: lw - 16 });
    this.drawBossBar(c, 12, lw - 12, 106, 20, false);
  } else {
    UI.text(c, `${this.world.name}  ${this.lvl.li + 1}/${LEVELS_PER_WORLD}`, lw / 2, 62, { size: 13, color: '#fff', stroke: 'rgba(0,0,0,.65)', strokeW: 3, align: 'center', weight: 800, maxW: lw - 16 });
    UI.text(c, this.lvl.name, lw / 2, 82, { size: 14, color: '#ffe27a', stroke: 'rgba(0,0,0,.65)', strokeW: 3.5, align: 'center', weight: 900, maxW: lw - 16 });
    this.drawProgress(c, 14, lw - 14, 106);
  }
  // 變種能力晶片
  this.drawMuts(c, lw / 2 - (Math.min(4, Math.floor((lw - 8) / 40)) * 40) / 2 + 20, 144, 40, Math.min(4, Math.floor((lw - 8) / 40)));
  // 右側：金幣＋暫停
  const txt = this.isBoss ? fmt(Save.d.coins) : this.coinsGot + '/' + this.lvl.starCoins;
  const cw = Math.min(124, lw - 16 - 46);
  UI.counter(c, rx + 8, 10, cw, 30, Icons.coin, txt, this.isBoss || this.coinsGot < this.lvl.starCoins ? '#ffe27a' : '#9bff7a');
  UI.roundIcon(c, 'pause', SW - 8 - 19, 26, 19, Icons.pause, { style: 'blue' });
};

/* ---------- 控制元件（直式、橫式共用） ---------- */
PlayScene.prototype.drawMuts = function (c, x0, y0, step, cols) {
  const t = this.t; let i = 0;
  for (const k of MUT_IDS) {
    if (this.mut[k] <= 0) continue;
    const m = MUTS[k], frac = clamp(this.mut[k] / m.dur, 0, 1);
    const blink = this.mut[k] < 2 && Math.floor(t * 8) % 2 === 0;
    const cx = x0 + (i % cols) * step, cy = y0 + Math.floor(i / cols) * step; i++;
    c.save(); c.globalAlpha = blink ? .4 : 1;
    circ(c, cx, cy, 17, 'rgba(0,0,0,.55)', null);
    c.strokeStyle = m.col; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.arc(cx, cy, 15, -PI / 2, -PI / 2 + TAU * frac); c.stroke();
    Icons['m_' + k](c, cx, cy, 20, t); c.restore();
  }
};
PlayScene.prototype.drawDpad = function (c) {
  const PAD = this.dpad;
  if (!Save.d.dpad) {
    UI.text(c, '在畫面上滑動', PAD.cx, PAD.cy - 10, { size: 15, color: 'rgba(255,255,255,.78)', align: 'center', weight: 800, maxW: 170 });
    UI.text(c, LAND ? '或點中間場地往前跳' : '或點一下來跳躍', PAD.cx, PAD.cy + 12, { size: 15, color: 'rgba(255,255,255,.78)', align: 'center', weight: 800, maxW: 170 });
    return;
  }
  for (let d = 0; d < 4; d++) {
    const px = PAD.cx + (d === 1 ? PAD.off : d === 3 ? -PAD.off : 0), py = PAD.cy + (d === 0 ? -PAD.off : d === 2 ? PAD.off : 0);
    const pr = this.hold === d || Input.keys[['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][d]];
    c.save(); c.translate(px, py + (pr ? 2 : 0));
    circ(c, 0, 5, PAD.r, 'rgba(0,0,0,.4)');
    circ(c, 0, 0, PAD.r, grad(c, 0, -PAD.r, 0, PAD.r, pr ? ['#4a5a6c', '#2a3644'] : ['#8fa0b4', '#4a5a6c']), '#141c26', 2.4);
    circ(c, 0, -3, PAD.r - 8, 'rgba(255,255,255,.1)');
    Icons.dir(c, 0, 0, PAD.r * 1.15, d);
    c.restore();
  }
};
PlayScene.prototype.drawWeaponBox = function (c, wx, wy) {
  const t = this.t, w = this.weapon, def = w ? WEAPONS[w.id] : null;
  UI.glass(c, wx - 46, wy - 54, 92, 108, { r: 16, fill: 'rgba(0,0,0,.35)', border: def ? rgba(def.col, .8) : 'rgba(255,255,255,.2)' });
  if (def && w.ammo > 0) {
    c.save(); c.globalAlpha = .4; circ(c, wx, wy - 12, 34, radial(c, wx, wy - 12, 0, 34, [rgba(def.col, .8), rgba(def.col, 0)])); c.restore();
    Icons['w_' + w.id](c, wx, wy - 12, 44, t);
    UI.text(c, '× ' + w.ammo, wx, wy + 24, { size: 20, color: '#fff', stroke: 'rgba(0,0,0,.7)', strokeW: 4, align: 'center', weight: 900 });
    UI.text(c, def.name, wx, wy + 44, { size: 12, color: def.col, align: 'center', weight: 900, maxW: 84 });
  } else {
    UI.text(c, '沒有武器', wx, wy - 4, { size: 15, color: 'rgba(255,255,255,.6)', align: 'center', weight: 800 });
    UI.text(c, '找補給箱', wx, wy + 18, { size: 12, color: 'rgba(255,255,255,.45)', align: 'center', weight: 700 });
  }
};
PlayScene.prototype.drawFireBtn = function (c) {
  const FIRE = this.fbtn, w = this.weapon, def = w ? WEAPONS[w.id] : null;
  const fd = def && w.ammo > 0, pr = [...this.ptrs.values()].some(p => p.role === 'fire'), k = FIRE.r / 54;
  c.save(); c.translate(FIRE.cx, FIRE.cy + (pr ? 3 : 0));
  circ(c, 0, 6, FIRE.r, 'rgba(0,0,0,.4)');
  circ(c, 0, 0, FIRE.r, grad(c, 0, -FIRE.r, 0, FIRE.r, fd ? [shade(def.col, .2), def.col, shade(def.col, -.4)] : ['#7a8694', '#4a5560', '#2a323a']), '#141c26', 3);
  c.beginPath(); c.arc(0, 0, FIRE.r - 7, 0, TAU); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.stroke();
  if (this.cd > 0 && def) { c.beginPath(); c.arc(0, 0, FIRE.r - 3, -PI / 2, -PI / 2 + TAU * (1 - this.cd / def.cd)); c.strokeStyle = '#fff'; c.lineWidth = 5; c.stroke(); }
  c.save(); c.globalAlpha = .5; ell(c, -12 * k, -26 * k, 26 * k, 14 * k, '#fff'); c.restore();
  Icons.fireBtn(c, 0, 0, 52 * k);
  c.restore();
  UI.text(c, '發射', FIRE.cx, FIRE.cy + FIRE.r + 15, { size: 12, color: 'rgba(255,255,255,.6)', align: 'center', weight: 800 });
};

/* 直式：下方控制區 */
PlayScene.prototype.drawControls = function (c) {
  c.drawImage(Panels.controls(this.wi), 0, 730, W, 190);
  this.drawMuts(c, 24, 754, 40, 99);
  this.drawDpad(c);
  this.drawWeaponBox(c, 232, this.dpad.cy);
  this.drawFireBtn(c);
  UI.text(c, AUTHOR + '  ' + VERSION, W / 2, SH - 8, { size: 11, color: '#f2c14a', italic: true, align: 'center', weight: 700 });
};
/* 橫式：左＝方向鍵，右＝武器＋發射 */
PlayScene.prototype.drawControlsL = function (c) {
  const lw = this.sideW, rx = SW - lw;
  this.drawDpad(c);
  this.drawWeaponBox(c, rx + lw / 2, 156);
  this.drawFireBtn(c);
  UI.text(c, AUTHOR + '  ' + VERSION, lw / 2, SH - 9, { size: 11, color: '#f2c14a', italic: true, align: 'center', weight: 700, stroke: 'rgba(0,0,0,.6)', strokeW: 3 });
};

/* ---------- 場地上的提示文字（用場地座標畫，直式橫式都一樣） ---------- */
PlayScene.prototype.drawFieldTexts = function (c) {
  const t = this.t;
  // 提示訊息
  if (this.banner && this.state !== 'lost') {
    const b = this.banner, k = b.t < .25 ? ease.outBack(b.t / .25) : b.t > 2.0 ? 1 - (b.t - 2) / .4 : 1;
    c.save(); c.globalAlpha = clamp(k, 0, 1); c.translate(W / 2, 70 + (1 - clamp(k, 0, 1)) * -20); c.scale(.6 + .4 * clamp(k, 0, 1), .6 + .4 * clamp(k, 0, 1));
    const w = Math.min(W - 16, Math.max(220, UI.measure(c, b.text, 24, 900) + 60)), h = b.sub ? 62 : 44;
    UI.glass(c, -w / 2, -h / 2, w, h, { r: 18, fill: 'rgba(8,16,28,.82)', border: b.col });
    UI.text(c, b.text, 0, b.sub ? -9 : 0, { size: 24, color: b.col, stroke: 'rgba(0,0,0,.7)', strokeW: 5, align: 'center', weight: 900, maxW: w - 24 });
    if (b.sub) UI.text(c, b.sub, 0, 16, { size: 13, color: '#fff', align: 'center', weight: 700, maxW: w - 24 });
    c.restore();
  }
  // 新手提示
  if (this.hint && this.state === 'play' && !this.paused) {
    const n = this.hint.t, msg = n < 1 ? '往上滑、點一下，或按 ↑ 往前跳！' : n < 4 ? '避開車子，一直往上跳到終點旗子!' : '站上木頭可以過河 · 按「發射」打敵人';
    const a = .75 + Math.sin(t * 4) * .2;
    c.save(); c.globalAlpha = a; UI.glass(c, 30, FIELD_BOTTOM - 130, W - 60, 40, { r: 20, fill: 'rgba(8,16,28,.78)', border: '#ffe14a' });
    UI.text(c, msg, W / 2, FIELD_BOTTOM - 110, { size: 16, color: '#ffe14a', align: 'center', weight: 900, maxW: W - 90 }); c.restore();
    if (n < 1) { const hy = FIELD_BOTTOM - 190 - ((t * 60) % 60); c.save(); c.globalAlpha = 1 - ((t * 60) % 60) / 60; Icons.dir(c, W / 2, hy, 44, 0); c.restore(); }
  }
};

/* ---------- 彈出視窗（螢幕座標） ---------- */
PlayScene.prototype.drawOverlays = function (c) {
  const cy = LAND ? SH * .42 : 330;
  if (this.state === 'intro') this.drawIntro(c, cy);
  if (this.state === 'won') {
    const k = clamp(this.stT / .4, 0, 1);
    c.save(); c.translate(SW / 2, cy); const s = ease.outBack(k); c.scale(s, s);
    UI.text(c, this.isBoss ? '魔王已擊敗!' : '過關了!', 0, 0, { size: LAND ? 64 : 60, color: '#ffe14a', stroke: '#8c3a05', strokeW: 12, align: 'center', weight: 900, glow: '#ffb300', glowR: 20 });
    c.restore();
  }
  if (this.paused) this.drawPause(c);
  if (this.state === 'lost') this.drawLost(c);
};

PlayScene.prototype.drawIntro = function (c, cy) {
  const k = this.introT, boss = this.isBoss, total = boss ? 3.2 : 2.2;
  const a = k < .3 ? k / .3 : k > total - .4 ? (total - k) / .4 : 1;
  const v = this.view;
  c.save(); c.globalAlpha = clamp(a, 0, 1) * .55; c.fillStyle = '#000';
  if (LAND) c.fillRect(0, 0, SW, SH); else c.fillRect(0, v.y, W, FIELD_BOTTOM);
  c.restore();
  c.save(); c.globalAlpha = clamp(a, 0, 1);
  const slide = (1 - ease.outCubic(clamp(k / .6, 0, 1))) * 80, mx = SW / 2;
  c.translate(0, cy);
  c.fillStyle = rgba(this.world.accent, .92); c.fillRect(0, -64, SW, 128); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, 54, SW, 10); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(0, -64, SW, 4);
  if (boss) {
    UI.text(c, '魔王來襲!', -slide + mx, -30, { size: 24, color: '#ffe14a', stroke: '#5a0c0c', strokeW: 6, align: 'center', weight: 900 });
    UI.text(c, BossArt.names[this.lvl.boss.kind], slide + mx, 14, { size: 46, color: '#fff', stroke: '#2a0a0a', strokeW: 9, align: 'center', weight: 900 });
  } else {
    UI.text(c, `${this.world.name}  第 ${this.lvl.li + 1} 關`, -slide + mx, -26, { size: 22, color: '#fff', stroke: 'rgba(0,0,0,.6)', strokeW: 5, align: 'center', weight: 900 });
    UI.text(c, this.lvl.name, slide + mx, 14, { size: 44, color: '#fff', stroke: 'rgba(0,0,0,.65)', strokeW: 9, align: 'center', weight: 900, maxW: Math.min(SW, 640) - 40 });
  }
  UI.text(c, boss ? '用「發射」打倒牠，小心彈幕!' : (this.lvl.li === 0 ? this.world.intro : '收集金幣、不受傷，就能拿滿三顆星!'), mx, 46, { size: 13, color: '#fff', align: 'center', weight: 700, maxW: Math.min(SW, 700) - 50 });
  c.restore();
};

PlayScene.prototype.drawPause = function (c) {
  c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, 0, SW, SH);
  UI.clearHits();
  const snd = Save.d.sound, mus = Save.d.music;
  const sndIcon = (cc, x, y, s) => Icons.speaker(cc, x, y, s, snd), musIcon = (cc, x, y, s) => Icons.note(cc, x, y, s, mus);
  if (LAND) {
    const pw = 600, ph = 306, px = (SW - pw) / 2, py = (SH - ph) / 2;
    UI.panel(c, px, py, pw, ph, { r: 26 });
    UI.text(c, '暫停', SW / 2, py + 42, { size: 38, color: '#8a4a10', align: 'center', weight: 900 });
    UI.text(c, `${this.world.name} · ${this.lvl.name}`, SW / 2, py + 78, { size: 15, color: '#7a5a2a', align: 'center', weight: 800, maxW: pw - 80 });
    UI.button(c, 'p_resume', SW / 2 - 175, py + 100, 350, 58, '繼續遊戲', { style: 'green', icon: Icons.play, size: 24 });
    const bw = 130, gp = 12, x0 = SW / 2 - (4 * bw + 3 * gp) / 2, by = py + 176;
    UI.button(c, 'p_retry', x0, by, bw, 54, '重玩', { style: 'orange', icon: Icons.retry, size: 19 });
    UI.button(c, 'p_map', x0 + (bw + gp), by, bw, 54, '回地圖', { style: 'blue', icon: Icons.map, size: 19 });
    UI.button(c, 'p_snd', x0 + 2 * (bw + gp), by, bw, 54, snd ? '音效 開' : '音效 關', { style: snd ? 'teal' : 'dark', icon: sndIcon, size: 17 });
    UI.button(c, 'p_mus', x0 + 3 * (bw + gp), by, bw, 54, mus ? '音樂 開' : '音樂 關', { style: mus ? 'purple' : 'dark', icon: musIcon, size: 17 });
    UI.text(c, AUTHOR + '  ' + VERSION, SW / 2, py + 266, { size: 13, color: '#c98a10', italic: true, align: 'center', weight: 700 });
    return;
  }
  UI.panel(c, 50, 230, W - 100, 400, { r: 26 });
  UI.text(c, '暫停', W / 2, 282, { size: 40, color: '#8a4a10', align: 'center', weight: 900 });
  UI.text(c, `${this.world.name} · ${this.lvl.name}`, W / 2, 322, { size: 15, color: '#7a5a2a', align: 'center', weight: 800, maxW: W - 140 });
  UI.button(c, 'p_resume', 90, 350, W - 180, 58, '繼續遊戲', { style: 'green', icon: Icons.play, size: 24 });
  UI.button(c, 'p_retry', 90, 424, (W - 190) / 2, 52, '重玩', { style: 'orange', icon: Icons.retry, size: 20 });
  UI.button(c, 'p_map', 100 + (W - 190) / 2, 424, (W - 190) / 2, 52, '回地圖', { style: 'blue', icon: Icons.map, size: 20 });
  UI.button(c, 'p_snd', 90, 500, (W - 190) / 2, 52, snd ? '音效 開' : '音效 關', { style: snd ? 'teal' : 'dark', icon: sndIcon, size: 17 });
  UI.button(c, 'p_mus', 100 + (W - 190) / 2, 500, (W - 190) / 2, 52, mus ? '音樂 開' : '音樂 關', { style: mus ? 'purple' : 'dark', icon: musIcon, size: 17 });
  UI.text(c, AUTHOR + '  ' + VERSION, W / 2, 596, { size: 13, color: '#c98a10', italic: true, align: 'center', weight: 700 });
};

PlayScene.prototype.drawLost = function (c) {
  const k = clamp(this.stT / .5, 0, 1);
  c.fillStyle = `rgba(0,0,0,${.6 * k})`; c.fillRect(0, 0, SW, SH);
  UI.clearHits();
  const cost = this.reviveCost(), can = Save.d.coins >= cost;
  const heartIcon = (cc, x, y, s) => Icons.heart(cc, x, y, s, true);
  const stat = `本關獲得 ${this.coinsGot} 枚金幣，打倒 ${this.kills} 個敵人`;
  if (LAND) {
    const pw = 660, ph = 322, px = (SW - pw) / 2, py = (SH - ph) / 2;
    c.save(); c.translate(SW / 2, SH / 2); const s = ease.outBack(k); c.scale(s, s); c.translate(-SW / 2, -SH / 2);
    UI.panel(c, px, py, pw, ph, { r: 28 });
    const lx = px + 170, rx = px + 335 + 150;
    UI.text(c, '挑戰失敗…', lx, py + 52, { size: 38, color: '#a02a1a', align: 'center', weight: 900 });
    FrogArt.front(c, lx, py + 170, { s: 1.2, t: this.t, skin: Save.d.skin, hat: Save.d.hat, mood: 'dizzy', blink: 0 });
    UI.text(c, stat, lx, py + 262, { size: 14, color: '#6a4a1a', align: 'center', weight: 800, maxW: 300 });
    c.fillStyle = 'rgba(120,80,20,.25)'; c.fillRect(px + 337, py + 32, 2, ph - 64);
    UI.button(c, 'l_revive', px + 360, py + 64, 270, 70, `復活 · ${cost} 金幣`, { style: can ? 'gold' : 'dark', icon: heartIcon, size: 22, color: can ? '#fff' : '#ddd' });
    UI.button(c, 'l_retry', px + 360, py + 162, 129, 56, '再試一次', { style: 'orange', icon: Icons.retry, size: 17 });
    UI.button(c, 'l_map', px + 501, py + 162, 129, 56, '回地圖', { style: 'blue', icon: Icons.map, size: 17 });
    UI.text(c, '你的金幣：' + fmt(Save.d.coins), rx - 5, py + 248, { size: 14, color: '#8a5a1a', align: 'center', weight: 800 });
    UI.text(c, AUTHOR + '  ' + VERSION, rx - 5, py + 284, { size: 12, color: '#c98a10', italic: true, align: 'center', weight: 700 });
    c.restore();
    return;
  }
  c.save(); c.translate(W / 2, 430); const s = ease.outBack(k); c.scale(s, s); c.translate(-W / 2, -430);
  UI.panel(c, 45, 210, W - 90, 440, { r: 28 });
  UI.text(c, '挑戰失敗…', W / 2, 262, { size: 40, color: '#a02a1a', align: 'center', weight: 900 });
  FrogArt.front(c, W / 2, 408, { s: 1.35, t: this.t, skin: Save.d.skin, hat: Save.d.hat, mood: 'dizzy', blink: 0 });
  UI.text(c, stat, W / 2, 432, { size: 15, color: '#6a4a1a', align: 'center', weight: 800, maxW: W - 140 });
  UI.button(c, 'l_revive', 80, 458, W - 160, 62, `復活 · ${cost} 金幣`, { style: can ? 'gold' : 'dark', icon: heartIcon, size: 22, disabled: false, color: can ? '#fff' : '#ddd' });
  UI.button(c, 'l_retry', 80, 534, (W - 170) / 2, 54, '再試一次', { style: 'orange', icon: Icons.retry, size: 19 });
  UI.button(c, 'l_map', 90 + (W - 170) / 2, 534, (W - 170) / 2, 54, '回地圖', { style: 'blue', icon: Icons.map, size: 19 });
  UI.text(c, '你的金幣：' + fmt(Save.d.coins), W / 2, 616, { size: 13, color: '#8a5a1a', align: 'center', weight: 800 });
  c.restore();
};

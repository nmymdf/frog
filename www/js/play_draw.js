'use strict';
/* =====================================================================
   遊戲畫面繪製：場地、物件、青蛙、HUD、控制區、各種彈出視窗
   ===================================================================== */
const Panels = {
  strips: {}, ctrl: {}, vig: null,
  worldStrip(wi) {
    if (this.strips[wi]) return this.strips[wi];
    const cv = document.createElement('canvas'); cv.width = W * 2; cv.height = FIELD_TOP * 2;
    const g = cv.getContext('2d'); g.scale(2, 2);
    Scenes.draw(g, wi, 0, -20, W, FIELD_TOP + 20 + 30, 0);
    g.fillStyle = vgrad(g, 0, FIELD_TOP, ['rgba(0,0,0,.25)', 'rgba(0,0,0,.55)']); g.fillRect(0, 0, W, FIELD_TOP);
    g.fillStyle = WORLDS[wi].accent; g.fillRect(0, FIELD_TOP - 4, W, 4); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, FIELD_TOP - 1, W, 1);
    return this.strips[wi] = cv;
  },
  controls(wi) {
    if (this.ctrl[wi]) return this.ctrl[wi];
    const h = H - FIELD_BOTTOM, w = WORLDS[wi];
    const cv = document.createElement('canvas'); cv.width = W * 2; cv.height = h * 2;
    const g = cv.getContext('2d'); g.scale(2, 2);
    g.fillStyle = vgrad(g, 0, h, [shade(w.accent, -.7), shade(w.accent, -.88)]); g.fillRect(0, 0, W, h);
    g.strokeStyle = 'rgba(255,255,255,.04)'; g.lineWidth = 12; for (let x = -h; x < W + h; x += 34) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + h, 0); g.stroke(); }
    g.fillStyle = w.accent; g.fillRect(0, 0, W, 4); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, 4, W, 2);
    g.fillStyle = radial(g, W / 2, h, 0, 260, [rgba(w.accent, .25), rgba(w.accent, 0)]); g.fillRect(0, 0, W, h);
    return this.ctrl[wi] = cv;
  },
  vignette() {
    if (this.vig) return this.vig;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = FIELD_BOTTOM - FIELD_TOP;
    const g = cv.getContext('2d');
    g.fillStyle = radial(g, W / 2, cv.height / 2, cv.height * .35, cv.height * .78, ['rgba(0,0,0,0)', 'rgba(0,0,0,.34)']); g.fillRect(0, 0, W, cv.height);
    return this.vig = cv;
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
  const t = this.t;
  c.drawImage(this.bg, 0, 0, W, FIELD_TOP);
  c.save();
  c.beginPath(); c.rect(0, FIELD_TOP, W, FIELD_BOTTOM - FIELD_TOP); c.clip();
  const shk = FX.shake; if (shk > 0) c.translate(rand(-shk, shk) * .4, rand(-shk, shk) * .4);
  this.drawLanes(c);
  this.drawEnts(c);
  FX.draw(c, wy => this.sy(wy));
  Weather.draw(c, t);
  this.drawLighting(c);
  c.restore();
  this.drawHUD(c);
  this.drawControls(c);
  this.drawOverlays(c);
  if (FX.flash > 0) { c.save(); c.globalAlpha = FX.flash * .8; c.fillStyle = FX.flashColor; c.fillRect(0, 0, W, H); c.restore(); }
};

PlayScene.prototype.drawLighting = function (c) {
  const wi = this.wi;
  c.drawImage(Panels.vignette(), 0, FIELD_TOP);
  const tint = [0, 'rgba(30,0,80,.20)', 0, 'rgba(120,20,0,.10)', 'rgba(0,0,50,.14)', 0][wi];
  if (tint) { c.fillStyle = tint; c.fillRect(0, FIELD_TOP, W, FIELD_BOTTOM - FIELD_TOP); }
  if (this.hurtFlash > 0) { c.save(); c.globalAlpha = this.hurtFlash * .45; c.fillStyle = radial(c, W / 2, (FIELD_TOP + FIELD_BOTTOM) / 2, 160, 440, ['rgba(255,0,0,0)', 'rgba(255,0,0,.9)']); c.fillRect(0, FIELD_TOP, W, FIELD_BOTTOM - FIELD_TOP); c.restore(); }
  if (this.idle > 8 && this.state === 'play') { c.save(); c.globalAlpha = .12 + Math.sin(this.t * 12) * .08; c.strokeStyle = '#ff3030'; c.lineWidth = 14; c.strokeRect(0, FIELD_TOP, W, FIELD_BOTTOM - FIELD_TOP); c.restore(); }
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
  c.translate(b.x, sy); c.scale(.9, .9); c.translate(-b.x, -sy);
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

/* ---------- HUD ---------- */
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
  if (this.isBoss && this.boss) {
    const b = this.boss, k = clamp(b.hp / b.maxhp, 0, 1);
    this.bossBarShown = (this.bossBarShown === undefined ? 1 : this.bossBarShown); this.bossBarShown += (k - this.bossBarShown) * .08;
    UI.glass(c, x0 + 22, y - 8, x1 - x0 - 22, 18, { r: 9, fill: 'rgba(0,0,0,.6)', border: 'rgba(255,255,255,.35)' });
    c.save(); rr(c, x0 + 24, y - 6, (x1 - x0 - 26) * this.bossBarShown, 14, 7); c.fillStyle = '#ffd23a'; c.fill(); c.restore();
    c.save(); rr(c, x0 + 24, y - 6, Math.max(8, (x1 - x0 - 26) * k), 14, 7); c.fillStyle = grad(c, 0, y - 6, 0, y + 8, ['#ff8a7a', '#e8352b', '#a01208']); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x0 + 28, y - 4, Math.max(0, (x1 - x0 - 34) * k), 3); c.restore();
    Icons.skull(c, x0 + 8, y + 1, 26);
    UI.text(c, BossArt.names[b.kind], (x0 + x1) / 2 + 10, y + 1, { size: 12, color: '#fff', stroke: 'rgba(0,0,0,.7)', strokeW: 3.5, align: 'center', weight: 900 });
  } else {
    UI.glass(c, x0, y - 6, x1 - x0, 14, { r: 7, fill: 'rgba(0,0,0,.5)', border: 'rgba(255,255,255,.3)' });
    const prog = clamp(this.bestRow / (this.rows - 1), 0, 1);
    this.progShown = (this.progShown || 0) + (prog - (this.progShown || 0)) * .12;
    c.save(); rr(c, x0 + 2, y - 4, Math.max(10, (x1 - x0 - 4) * this.progShown), 10, 5); c.fillStyle = grad(c, 0, y - 4, 0, y + 6, ['#b5f27e', '#43b52c']); c.fill(); c.restore();
    Icons.frogHead(c, x0 + 6 + (x1 - x0 - 24) * this.progShown, y + 1, 22, skinOf(Save.d.skin).body);
    Icons.flag(c, x1 - 8, y - 2, 28, t);
    UI.text(c, `${this.world.name}  ${this.lvl.li + 1}/${LEVELS_PER_WORLD}`, x0, y + 18, { size: 11, color: '#fff', stroke: 'rgba(0,0,0,.65)', strokeW: 3, weight: 800 });
  }
};

/* ---------- 控制區 ---------- */
PlayScene.prototype.drawControls = function (c) {
  c.drawImage(this.panel, 0, FIELD_BOTTOM, W, H - FIELD_BOTTOM);
  const t = this.t;
  // 變種能力晶片
  let cx = 24; const cy = FIELD_BOTTOM + 24;
  for (const k of MUT_IDS) {
    if (this.mut[k] <= 0) continue;
    const m = MUTS[k], frac = clamp(this.mut[k] / m.dur, 0, 1);
    const blink = this.mut[k] < 2 && Math.floor(t * 8) % 2 === 0;
    c.save(); c.globalAlpha = blink ? .4 : 1;
    circ(c, cx, cy, 17, 'rgba(0,0,0,.55)', null);
    c.strokeStyle = m.col; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.arc(cx, cy, 15, -PI / 2, -PI / 2 + TAU * frac); c.stroke();
    Icons['m_' + k](c, cx, cy, 20, t); c.restore();
    cx += 40;
  }
  // 方向鍵
  if (Save.d.dpad) {
    const pressed = d => this.hold === d;
    for (let d = 0; d < 4; d++) {
      const px = PAD.cx + (d === 1 ? PAD.off : d === 3 ? -PAD.off : 0), py = PAD.cy + (d === 0 ? -PAD.off : d === 2 ? PAD.off : 0);
      const pr = pressed(d) || (Input.keys[['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][d]]);
      c.save(); c.translate(px, py + (pr ? 2 : 0));
      circ(c, 0, 5, PAD.r, 'rgba(0,0,0,.4)');
      circ(c, 0, 0, PAD.r, grad(c, 0, -PAD.r, 0, PAD.r, pr ? ['#4a5a6c', '#2a3644'] : ['#8fa0b4', '#4a5a6c']), '#141c26', 2.4);
      circ(c, 0, -3, PAD.r - 8, 'rgba(255,255,255,.1)');
      Icons.dir(c, 0, 0, PAD.r * 1.15, d);
      c.restore();
    }
  } else {
    UI.text(c, '在畫面上滑動或點一下來跳躍', 120, PAD.cy, { size: 14, color: 'rgba(255,255,255,.75)', align: 'center', weight: 800, maxW: 190 });
  }
  // 武器框
  const wx = 232, wy = PAD.cy, w = this.weapon, def = w ? WEAPONS[w.id] : null;
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
  // 開火鈕
  const fd = def && w.ammo > 0, pr = [...this.ptrs.values()].some(p => p.role === 'fire');
  c.save(); c.translate(FIRE.cx, FIRE.cy + (pr ? 3 : 0));
  circ(c, 0, 6, FIRE.r, 'rgba(0,0,0,.4)');
  circ(c, 0, 0, FIRE.r, grad(c, 0, -FIRE.r, 0, FIRE.r, fd ? [shade(def.col, .2), def.col, shade(def.col, -.4)] : ['#7a8694', '#4a5560', '#2a323a']), '#141c26', 3);
  c.beginPath(); c.arc(0, 0, FIRE.r - 7, 0, TAU); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.stroke();
  if (this.cd > 0 && def) { c.beginPath(); c.arc(0, 0, FIRE.r - 3, -PI / 2, -PI / 2 + TAU * (1 - this.cd / def.cd)); c.strokeStyle = '#fff'; c.lineWidth = 5; c.stroke(); }
  c.save(); c.globalAlpha = .5; ell(c, -12, -26, 26, 14, '#fff'); c.restore();
  Icons.fireBtn(c, 0, 0, 52);
  c.restore();
  UI.text(c, '發射', FIRE.cx, FIRE.cy + FIRE.r + 16, { size: 12, color: 'rgba(255,255,255,.6)', align: 'center', weight: 800 });
  // 版本 / 作者
  UI.text(c, AUTHOR + '  ' + VERSION, W / 2, H - 8, { size: 11, color: '#f2c14a', italic: true, align: 'center', weight: 700 });
};

/* ---------- 彈出視窗 / 提示 ---------- */
PlayScene.prototype.drawOverlays = function (c) {
  const t = this.t;
  // 提示訊息
  if (this.banner && this.state !== 'lost') {
    const b = this.banner, k = b.t < .25 ? ease.outBack(b.t / .25) : b.t > 2.0 ? 1 - (b.t - 2) / .4 : 1;
    c.save(); c.globalAlpha = clamp(k, 0, 1); c.translate(W / 2, 150 + (1 - clamp(k, 0, 1)) * -20); c.scale(.6 + .4 * clamp(k, 0, 1), .6 + .4 * clamp(k, 0, 1));
    const w = Math.max(220, UI.measure(c, b.text, 24, 900) + 60), h = b.sub ? 62 : 44;
    UI.glass(c, -w / 2, -h / 2, w, h, { r: 18, fill: 'rgba(8,16,28,.82)', border: b.col });
    UI.text(c, b.text, 0, b.sub ? -9 : 0, { size: 24, color: b.col, stroke: 'rgba(0,0,0,.7)', strokeW: 5, align: 'center', weight: 900 });
    if (b.sub) UI.text(c, b.sub, 0, 16, { size: 13, color: '#fff', align: 'center', weight: 700, maxW: w - 24 });
    c.restore();
  }
  // 新手提示
  if (this.hint && this.state === 'play' && !this.paused) {
    const n = this.hint.t, msg = n < 1 ? '往上滑、點一下，或按 ↑ 往前跳！' : n < 4 ? '避開車子，一直往上跳到終點旗子!' : '站上木頭可以過河 · 按「發射」打敵人';
    const a = .75 + Math.sin(t * 4) * .2;
    c.save(); c.globalAlpha = a; UI.glass(c, 30, FIELD_BOTTOM - 70, W - 60, 40, { r: 20, fill: 'rgba(8,16,28,.78)', border: '#ffe14a' });
    UI.text(c, msg, W / 2, FIELD_BOTTOM - 50, { size: 16, color: '#ffe14a', align: 'center', weight: 900, maxW: W - 90 }); c.restore();
    if (n < 1) { const hy = FIELD_BOTTOM - 150 - ((t * 60) % 60); c.save(); c.globalAlpha = 1 - ((t * 60) % 60) / 60; Icons.dir(c, W / 2, hy, 44, 0); c.restore(); }
  }
  // 開場
  if (this.state === 'intro') this.drawIntro(c);
  if (this.state === 'won') {
    const k = clamp(this.stT / .4, 0, 1);
    c.save(); c.translate(W / 2, 330); const s = ease.outBack(k); c.scale(s, s);
    UI.text(c, this.isBoss ? '魔王已擊敗!' : '過關了!', 0, 0, { size: 60, color: '#ffe14a', stroke: '#8c3a05', strokeW: 12, align: 'center', weight: 900, glow: '#ffb300', glowR: 20 });
    c.restore();
  }
  if (this.state === 'bossdead' && this.banner == null) { /* 魔王倒下中 */ }
  if (this.paused) this.drawPause(c);
  if (this.state === 'lost') this.drawLost(c);
};

PlayScene.prototype.drawIntro = function (c) {
  const k = this.introT, boss = this.isBoss, total = boss ? 3.2 : 2.2;
  const a = k < .3 ? k / .3 : k > total - .4 ? (total - k) / .4 : 1;
  c.save(); c.globalAlpha = clamp(a, 0, 1) * .55; c.fillStyle = '#000'; c.fillRect(0, FIELD_TOP, W, FIELD_BOTTOM - FIELD_TOP); c.restore();
  c.save(); c.globalAlpha = clamp(a, 0, 1);
  const slide = (1 - ease.outCubic(clamp(k / .6, 0, 1))) * 80;
  c.translate(0, 330);
  c.fillStyle = rgba(this.world.accent, .92); c.fillRect(0, -64, W, 128); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, 54, W, 10); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(0, -64, W, 4);
  if (boss) {
    UI.text(c, '魔王來襲!', -slide + W / 2, -30, { size: 24, color: '#ffe14a', stroke: '#5a0c0c', strokeW: 6, align: 'center', weight: 900 });
    UI.text(c, BossArt.names[this.lvl.boss.kind], slide + W / 2, 14, { size: 46, color: '#fff', stroke: '#2a0a0a', strokeW: 9, align: 'center', weight: 900 });
  } else {
    UI.text(c, `${this.world.name}  第 ${this.lvl.li + 1} 關`, -slide + W / 2, -26, { size: 22, color: '#fff', stroke: 'rgba(0,0,0,.6)', strokeW: 5, align: 'center', weight: 900 });
    UI.text(c, this.lvl.name, slide + W / 2, 14, { size: 44, color: '#fff', stroke: 'rgba(0,0,0,.65)', strokeW: 9, align: 'center', weight: 900, maxW: W - 40 });
  }
  UI.text(c, boss ? '用「發射」打倒牠，小心彈幕!' : (this.lvl.li === 0 ? this.world.intro : '收集金幣、不受傷，就能拿滿三顆星!'), W / 2, 46, { size: 13, color: '#fff', align: 'center', weight: 700, maxW: W - 50 });
  c.restore();
};

PlayScene.prototype.drawPause = function (c) {
  c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, 0, W, H);
  UI.clearHits();
  UI.panel(c, 50, 230, W - 100, 400, { r: 26 });
  UI.text(c, '暫停', W / 2, 282, { size: 40, color: '#8a4a10', align: 'center', weight: 900 });
  UI.text(c, `${this.world.name} · ${this.lvl.name}`, W / 2, 322, { size: 15, color: '#7a5a2a', align: 'center', weight: 800, maxW: W - 140 });
  UI.button(c, 'p_resume', 90, 350, W - 180, 58, '繼續遊戲', { style: 'green', icon: Icons.play, size: 24 });
  UI.button(c, 'p_retry', 90, 424, (W - 190) / 2, 52, '重玩', { style: 'orange', icon: Icons.retry, size: 20 });
  UI.button(c, 'p_map', 100 + (W - 190) / 2, 424, (W - 190) / 2, 52, '回地圖', { style: 'blue', icon: Icons.map, size: 20 });
  UI.button(c, 'p_snd', 90, 500, (W - 190) / 2, 52, Save.d.sound ? '音效 開' : '音效 關', { style: Save.d.sound ? 'teal' : 'dark', icon: (cc, x, y, s) => Icons.speaker(cc, x, y, s, Save.d.sound), size: 17 });
  UI.button(c, 'p_mus', 100 + (W - 190) / 2, 500, (W - 190) / 2, 52, Save.d.music ? '音樂 開' : '音樂 關', { style: Save.d.music ? 'purple' : 'dark', icon: (cc, x, y, s) => Icons.note(cc, x, y, s, Save.d.music), size: 17 });
  UI.text(c, AUTHOR + '  ' + VERSION, W / 2, 596, { size: 13, color: '#c98a10', italic: true, align: 'center', weight: 700 });
};

PlayScene.prototype.drawLost = function (c) {
  const k = clamp(this.stT / .5, 0, 1);
  c.fillStyle = `rgba(0,0,0,${.6 * k})`; c.fillRect(0, 0, W, H);
  UI.clearHits();
  c.save(); c.translate(W / 2, 430); const s = ease.outBack(k); c.scale(s, s); c.translate(-W / 2, -430);
  UI.panel(c, 45, 210, W - 90, 440, { r: 28 });
  UI.text(c, '挑戰失敗…', W / 2, 262, { size: 40, color: '#a02a1a', align: 'center', weight: 900 });
  FrogArt.front(c, W / 2, 408, { s: 1.35, t: this.t, skin: Save.d.skin, hat: Save.d.hat, mood: 'dizzy', blink: 0 });
  UI.text(c, `本關獲得 ${this.coinsGot} 枚金幣，打倒 ${this.kills} 個敵人`, W / 2, 432, { size: 15, color: '#6a4a1a', align: 'center', weight: 800, maxW: W - 140 });
  const cost = this.reviveCost(), can = Save.d.coins >= cost;
  UI.button(c, 'l_revive', 80, 458, W - 160, 62, `復活 · ${cost} 金幣`, { style: can ? 'gold' : 'dark', icon: (cc, x, y, s) => Icons.heart(cc, x, y, s, true), size: 22, disabled: false, color: can ? '#fff' : '#ddd' });
  UI.button(c, 'l_retry', 80, 534, (W - 170) / 2, 54, '再試一次', { style: 'orange', icon: Icons.retry, size: 19 });
  UI.button(c, 'l_map', 90 + (W - 170) / 2, 534, (W - 170) / 2, 54, '回地圖', { style: 'blue', icon: Icons.map, size: 19 });
  UI.text(c, '你的金幣：' + fmt(Save.d.coins), W / 2, 616, { size: 13, color: '#8a5a1a', align: 'center', weight: 800 });
  c.restore();
};

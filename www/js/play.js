'use strict';
/* =====================================================================
   遊戲主體：移動、碰撞、道具、武器、變種、魔王
   世界座標：x 向右 (0..450)，y 向上 (row*50 + 25 為第 row 排的中心)
   ===================================================================== */
const HOP_DUR = .125;
const DIRV = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // 上 右 下 左 (世界座標 y 向上)
const colOf = x => clamp(Math.round((x - 25) / TILE), 0, COLS - 1);
const cellX = c => c * TILE + TILE / 2;
const rowY = r => r * TILE + TILE / 2;


class PlayScene {
  constructor(id, opts = {}) {
    this.id = id;
    this.lvl = buildLevel(id);
    this.lanes = this.lvl.lanes; this.rows = this.lvl.rows; this.wi = this.lvl.wi; this.world = this.lvl.world;
    this.isBoss = !!this.lvl.boss;
    this.t = 0; this.time = 0;
    this.maxHearts = 3 + Save.d.up.hearts;
    this.hearts = this.maxHearts;
    this.mut = {}; MUT_IDS.forEach(k => this.mut[k] = 0);
    this.weapon = { id: 'bubble', ammo: this.isBoss ? 30 : 10 };
    this.cd = 0;
    this.camRow = 0; this.camY = 0;
    this.projs = []; this.ents = [];
    this.coinsGot = 0; this.gemsGot = 0; this.kills = 0; this.hurtCount = 0; this.hopCount = 0; this.revives = 0;
    this.state = 'intro'; this.introT = 0; this.stT = 0;
    this.bestRow = 0; this.idle = 0; this.hawkT = 0;
    this.flyT = 7 + Math.random() * 4; this.strikeT = 6 + Math.random() * 3;
    this.ptrs = new Map(); this.hold = null; this.holdT = 0;
    this.banner = null; this.hint = this.lvl.tutorial ? { t: 0 } : null;
    this.pauseMenu = false; this.paused = false;
    this.shakeAmt = 0;
    this.f = {
      row: 0, x: cellX(4), wy: rowY(0), hopT: 1, fromX: 0, toX: 0, fromRow: 0, toRow: 0, dur: HOP_DUR, jump: 1,
      ang: 0, angT: 0, z: 0, sx: 1, sy: 1, ride: null, dead: null, invul: 0, blink: 0, blinkT: 2, mouth: 0, tongue: 0, mood: 'normal', look: [0, -1], sparkle: 0,
    };
    // 起點選一個沒被擋住的格子
    let c0 = 4; const l0 = this.lanes[0]; if (l0.blocks[c0] !== undefined) { for (let d = 1; d < 5; d++) { if (l0.blocks[4 + d] === undefined) { c0 = 4 + d; break; } if (l0.blocks[4 - d] === undefined) { c0 = 4 - d; break; } } }
    this.f.x = cellX(c0);
    this.layout();
    FX.clear();
    SND.music(this.isBoss ? 'boss' : this.world.music);
    this.initBoss();
    this.dispCoins = Save.d.coins;
  }

  /* ------------------------------------------------------------------
     版面：場地一律畫在「虛擬場地座標」(寬 450、高 FIELD_ROWS×50) 裡，再用 view 平移＋縮放放到螢幕上
       直式：13 列、k=1，場地在上方 80px 下面；方向鍵／發射鈕在下方控制區
       橫式：一次顯示 7～9 列（k=9/列數≥1，魔王關的場地排數跟著，絕不縮小）；場地置中，左右是側邊面板
     ------------------------------------------------------------------ */
  layout() {
    const key = (LAND ? 'L' : 'P') + SW + 'x' + SH;
    if (this.lkey === key) return;
    this.lkey = key;
    // 橫式一次顯示 7～9 排（依螢幕寬度，見 landRows）、k≥1：魔王關也不縮小；魔王場比螢幕短時放大填滿，比螢幕長時鏡頭跟著走
    const rows = LAND ? (this.isBoss ? Math.min(landRows(), this.rows) : landRows()) : 13;
    FIELD_ROWS = rows; FIELD_TOP = 0; FIELD_BOTTOM = rows * TILE;
    if (!LAND) {
      this.view = { x: 0, y: 80, k: 1 };
      this.dpad = { cx: 92, cy: 836, off: 50, r: 30 };
      this.fbtn = { cx: 366, cy: 836, r: 54 };
      this.sideW = 0;
    } else {
      const k = SH / (rows * TILE), x0 = (SW - W * k) / 2;
      this.view = { x: x0, y: 0, k };
      this.sideW = x0; // 左右側邊面板寬度（800 寬螢幕時最少 175）
      const ps = clamp(x0 / 175, 1, 1.3); // 側邊面板越寬，按鈕越大
      const off = 46 * ps, r = 28 * ps, fr = 50 * ps;
      this.dpad = { cx: x0 / 2, cy: SH - 22 - off - r, off, r };
      this.fbtn = { cx: SW - x0 / 2, cy: SH - 30 - fr, r: fr };
    }
    Weather.init(this.world.weather);
  }
  onResize() { this.layout(); }
  /* 螢幕座標 → 場地座標 */
  toField(x, y) { const v = this.view; return { x: (x - v.x) / v.k, y: (y - v.y) / v.k }; }
  inField(x, y) { const v = this.view; return x >= v.x && x <= v.x + W * v.k && y >= v.y && y <= v.y + FIELD_BOTTOM * v.k; }

  get lane() { return this.lanes[this.f.row]; }
  sy(wy) { return FIELD_BOTTOM - (wy - this.camY); }
  fy() { return this.f.wy; }
  ts() { return this.mut.slow > 0 ? .5 : 1; }
  banner_(text, sub, col = '#fff') { this.banner = { text, sub, col, t: 0 }; }

  /* ---------- 輸入 ---------- */
  onDown(x, y, id) {
    if (UI.pointerDown(x, y)) { this.ptrs.set(id, { role: 'ui' }); return; }
    if (this.paused) return;
    if (this.state === 'intro') { this.introT = Math.max(this.introT, 1.6); }
    if (this.state !== 'play') return;
    // 方向鍵
    if (Save.d.dpad) {
      for (let d = 0; d < 4; d++) {
        const PAD = this.dpad, px = PAD.cx + (d === 1 ? PAD.off : d === 3 ? -PAD.off : 0), py = PAD.cy + (d === 0 ? -PAD.off : d === 2 ? PAD.off : 0);
        if (Math.hypot(x - px, y - py) < PAD.r + 10) { this.ptrs.set(id, { role: 'dpad', dir: d }); this.hold = d; this.holdT = .22; this.tryHop(d); return; }
      }
    }
    const FIRE = this.fbtn;
    if (Math.hypot(x - FIRE.cx, y - FIRE.cy) < FIRE.r + 12) { this.ptrs.set(id, { role: 'fire' }); this.fire(); return; }
    if (LAND || this.inField(x, y)) this.ptrs.set(id, { role: 'field', sx: x, sy: y, t: performance.now(), fired: false });
  }
  onMove(x, y, id) {
    UI.pointerMove(x, y);
    const p = this.ptrs.get(id);
    if (p && p.role === 'field' && !p.fired && this.state === 'play') {
      const dx = x - p.sx, dy = y - p.sy;
      if (Math.hypot(dx, dy) > 28) { p.fired = true; this.tryHop(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy < 0 ? 0 : 2)); }
    }
  }
  onUp(x, y, id) {
    UI.pointerUp(x, y);
    const p = this.ptrs.get(id);
    if (p) {
      if (p.role === 'dpad') this.hold = null;
      if (p.role === 'field' && !p.fired && this.state === 'play' && performance.now() - p.t < 380 && Math.hypot(x - p.sx, y - p.sy) < 22 && this.inField(p.sx, p.sy)) this.tryHop(0); // 橫式時側邊面板可以滑動，但只點一下不會跳（避免點歪按鍵就往前衝）
    }
    this.ptrs.delete(id);
  }
  onKey(k) {
    if (k === 'Escape' || k === 'p' || k === 'P') { this.togglePause(); return; }
    if (this.paused || this.state !== 'play') { if (this.state === 'intro') this.introT = Math.max(this.introT, 1.6); return; }
    const m = { ArrowUp: 0, w: 0, W: 0, ArrowRight: 1, d: 1, D: 1, ArrowDown: 2, s: 2, S: 2, ArrowLeft: 3, a: 3, A: 3 }[k];
    if (m !== undefined) { this.tryHop(m); this.keyHold = { d: m, t: .24 }; return; }
    if (k === ' ' || k === 'z' || k === 'Z' || k === 'j' || k === 'J' || k === 'Enter') this.fire();
  }
  onKeyUp(k) { if (this.keyHold) { const m = { ArrowUp: 0, w: 0, W: 0, ArrowRight: 1, d: 1, D: 1, ArrowDown: 2, s: 2, S: 2, ArrowLeft: 3, a: 3, A: 3 }[k]; if (m === this.keyHold.d) this.keyHold = null; } }
  onBlur() { if (this.state === 'play' && !this.paused) this.togglePause(true); }
  onBack() { if (this.state === 'lost') return false; this.togglePause(); return true; }
  togglePause(force) {
    if (this.state !== 'play' && this.state !== 'intro') return;
    this.paused = force !== undefined ? force : !this.paused;
    SND.play('click');
  }

  /* ---------- 跳躍 ---------- */
  tryHop(dir) {
    if (this.state !== 'play' || this.f.dead) return;
    const f = this.f;
    if (f.hopT < 1) { this.queue = dir; return; }
    const jump = this.mut.jump > 0 ? 2 : 1;
    let nrow = f.row, nx = f.x;
    if (dir === 0) nrow += jump; else if (dir === 2) nrow -= jump; else nx += (dir === 1 ? 1 : -1) * TILE * jump;
    f.angT = dir * PI / 2;
    const minRow = Math.floor(this.camRow + .001);
    const bump = () => { f.sy = .85; f.sx = 1.1; f.mood = 'normal'; SND.play('bump'); f.ang = f.angT; };
    if (nrow >= this.rows || nrow < minRow) return bump();
    if (nx < TILE / 2 - 8 || nx > W - TILE / 2 + 8) return bump();
    const lane = this.lanes[nrow];
    if (lane.blockAll) return bump();
    const col = colOf(nx);
    if (lane.blocks[col] !== undefined && !(this.mut.fly > 0)) { if (!lane.blocks[col + 'x']) return bump(); }
    // 落點：靜止地面就吸附到格子中心
    if (lane.type !== 'water') nx = cellX(col);
    else if (dir === 0 || dir === 2) nx = f.x;
    this.startHop(nx, nrow, dir);
  }
  startHop(nx, nrow, dir) {
    const f = this.f;
    f.fromX = f.x; f.toX = nx; f.fromRow = f.row; f.toRow = nrow; f.hopT = 0; f.ride = null;
    f.dur = this.mut.speed > 0 ? HOP_DUR * .6 : HOP_DUR;
    f.jump = Math.abs(nrow - f.row) + Math.abs(nx - f.x) / TILE > 1.2 ? 2 : 1;
    f.dir = dir; f.mouth = 0;
    this.hopCount++; Save.d.hops++;
    SND.play('hop');
    FX.burst(f.x, f.wy - 6, 4, { color: ['#fff', '#d9f2c4'], min: 20, max: 60, g: 0, l0: .2, l1: .35, s0: 1.4, s1: 2.6 });
    if (this.hint) this.hint.t += 1;
    if (this.mut.fly > 0) this.f.z = Math.max(this.f.z, 8);
  }

  /* ---------- 武器 ---------- */
  fire() {
    if (this.state !== 'play' || this.f.dead || this.paused) return;
    if (this.cd > 0) return;
    const w = this.weapon;
    if (!w || w.ammo <= 0) { SND.play('deny'); this.cd = .25; FX.text(this.f.x, this.f.wy + 30, '沒子彈了!', '#ffb3b3', 18, .8); return; }
    const def = WEAPONS[w.id], f = this.f;
    const ang = (f.dir === undefined ? 0 : f.dir) * PI / 2; // 上=0
    const dx = Math.sin(ang), dy = Math.cos(ang);
    const dmg = def.dmg + Save.d.up.power;
    w.ammo--; this.cd = def.cd * (this.mut.speed > 0 ? .7 : 1);
    f.mouth = 1; f.angT = ang;
    SND.play(def.snd);
    vibrate(8);
    const mk = (type, a, extra) => this.projs.push(Object.assign({ owner: 'frog', type, x: f.x + Math.sin(a) * 16, y: f.wy + Math.cos(a) * 16, vx: Math.sin(a) * def.speed, vy: Math.cos(a) * def.speed, dmg, pierce: def.pierce, hits: new Set(), life: 620, t: 0, freeze: def.freeze || 0, col: def.col }, extra || {}));
    if (w.id === 'bubble' || w.id === 'fire' || w.id === 'ice') mk(w.id, ang);
    else if (w.id === 'spread') { for (const da of [-.26, 0, .26]) mk('spread', ang + da); }
    else if (w.id === 'boomerang') mk('boomerang', ang, { out: true, dist: 0, life: 99999, maxDist: 270 });
    else if (w.id === 'bolt') this.zap(f.x, f.wy, dx, dy, dmg);
    if (w.ammo <= 0) { setTimeout(() => { }, 0); }
  }
  zap(x, y, dx, dy, dmg) {
    const len = 7 * TILE, pts = [[x, y]]; let cx = x, cy = y;
    const steps = 9;
    for (let i = 1; i <= steps; i++) { cx = x + dx * len * i / steps + (dy ? rand(-9, 9) : 0); cy = y + dy * len * i / steps + (dx ? rand(-9, 9) : 0); pts.push([cx, cy]); }
    this.ents.push({ type: 'bolt', pts, t: 0, life: .28 });
    FX.flash = .25; FX.flashColor = '#fff8b0';
    // 傷害判定
    const hitRect = { x0: Math.min(x, x + dx * len) - 24, x1: Math.max(x, x + dx * len) + 24, y0: Math.min(y, y + dy * len) - 24, y1: Math.max(y, y + dy * len) + 24 };
    this.damageRect(hitRect, dmg, 'bolt');
  }
  /* 範圍傷害：打所有在矩形內的敵人 */
  damageRect(r, dmg, how) {
    const tmp = [];
    const rmin = Math.max(0, Math.floor(r.y0 / TILE)), rmax = Math.min(this.rows - 1, Math.floor(r.y1 / TILE));
    for (let row = rmin; row <= rmax; row++) {
      const lane = this.lanes[row];
      for (const o of lane.objs) {
        if (!o.harm || o.dead) continue;
        for (const ix of laneInst(lane, o, tmp).slice()) { if (ix + o.w / 2 > r.x0 && ix - o.w / 2 < r.x1) { this.hurtObj(o, lane, ix, dmg, null, how); break; } }
      }
    }
    for (const e of this.ents) {
      if ((e.type === 'flyer' || e.type === 'minion') && !e.dead && e.x > r.x0 && e.x < r.x1 && e.y > r.y0 && e.y < r.y1) this.hurtEnt(e, dmg, how);
    }
    if (this.boss && this.boss.state !== 'dead') {
      const b = this.boss; if (b.x + 90 > r.x0 && b.x - 90 < r.x1 && b.y + 45 > r.y0 && b.y - 45 < r.y1) this.hurtBoss(dmg, how);
    }
    this.projs.forEach(p => { if (p.owner === 'boss' && p.x > r.x0 && p.x < r.x1 && p.y > r.y0 && p.y < r.y1) p.dead = true; });
  }
  hurtObj(o, lane, ix, dmg, proj, how) {
    if (proj && proj.freeze) { o.frozen = proj.freeze; FX.burst(ix, rowY(lane.row), 10, { color: ['#dff8ff', '#7fd8ff'], type: 'star', min: 30, max: 90, g: 0, l0: .3, l1: .6, s0: 3, s1: 5 }); SND.play('ice'); return; }
    o.hp -= dmg; o.hitT = .18;
    FX.burst(ix, rowY(lane.row), 6, { color: ['#fff', '#ffe14a'], min: 40, max: 120, l0: .2, l1: .4 });
    if (o.hp <= 0) this.killObj(o, lane, ix);
    else SND.play('pop');
  }
  killObj(o, lane, ix) {
    o.dead = true; this.kills++; Save.d.kills++;
    const y = rowY(lane.row);
    SND.play('boom'); FX.shake = Math.max(FX.shake, 6);
    FX.burst(ix, y, 18, { color: ['#ffd27a', '#ff7a2a', '#fff3a0', '#ffffff'], min: 60, max: 220, l0: .3, l1: .7, s0: 3, s1: 7, glow: true });
    FX.add({ type: 'smoke', x: ix, y, vx: 0, vy: 30, g: 0, size: 14, color: '#555', life: .7 });
    FX.ring(ix, y, '#ffcf6a', 46, .45, 5);
    const n = o.maxhp >= 3 ? 4 : o.maxhp === 2 ? 2 : 1;
    for (let i = 0; i < n; i++) this.dropCoin(ix + rand(-18, 18), y + rand(-4, 12));
  }
  hurtEnt(e, dmg, how) {
    e.hp -= dmg; FX.burst(e.x, e.y, 6, { color: ['#fff', '#ffe14a'], l0: .2, l1: .4 });
    if (e.hp <= 0 && !e.dead) {
      e.dead = true; this.kills++; Save.d.kills++; SND.play('boom');
      FX.burst(e.x, e.y, 16, { color: ['#ffd27a', '#ff7a2a', '#fff'], min: 50, max: 200, glow: true }); FX.ring(e.x, e.y, '#ffcf6a', 40, .4, 4);
      this.dropCoin(e.x, e.y); if (e.type === 'minion') this.dropCoin(e.x + 10, e.y);
    }
  }
  dropCoin(x, y) { // 掉出金幣，飛向青蛙
    this.ents.push({ type: 'coinfx', x, y, t: 0, vx: rand(-40, 40), vy: rand(60, 140) });
  }

  /* ---------- 道具 ---------- */
  pickup(it, lane) {
    it.got = true; const x = cellX(it.col), y = rowY(lane.row);
    this.collect(it.kind, x, y);
  }
  collect(kind, x, y) {
    switch (kind) {
      case 'coin': this.addCoins(1, x, y); SND.play('coin'); FX.burst(x, y, 6, { color: ['#ffe14a', '#fff3a0'], type: 'star', min: 30, max: 100, g: 0, l0: .3, l1: .5, s0: 3, s1: 5 }); break;
      case 'gem': this.gemsGot++; Save.d.gems++; Save.write(); SND.play('gem'); FX.text(x, y + 30, '+1 寶石', '#7fe8ff', 22, 1.1); FX.burst(x, y, 16, { color: ['#7fe8ff', '#fff', '#44e0ff'], type: 'star', min: 40, max: 160, g: 0, l0: .4, l1: .8, s0: 3, s1: 6 }); FX.ring(x, y, '#7fe8ff', 44, .5, 4); break;
      case 'heart':
        if (this.hearts < this.maxHearts) { this.hearts++; FX.text(x, y + 30, '+1 生命', '#ff8aa0', 24, 1.1); } else { this.addCoins(10, x, y); FX.text(x, y + 30, '+10 金幣', '#ffe14a', 20, 1); }
        SND.play('heart'); FX.burst(x, y, 12, { color: ['#ff5a7a', '#ffb3c4'], min: 30, max: 120, g: -60, l0: .5, l1: .9 }); FX.ring(x, y, '#ff8aa0', 40, .5, 4); break;
      case 'crate': this.openCrate(x, y); break;
    }
  }
  addCoins(n, x, y) { this.coinsGot += n; Save.d.coins += n; Save.d.totalCoins += n; }
  openCrate(x, y) {
    SND.play('crate'); FX.ring(x, y, '#fff3a0', 56, .5, 5);
    FX.burst(x, y, 20, { color: ['#ffe14a', '#fff', '#ff9a3a'], type: 'sq', min: 60, max: 200, l0: .5, l1: 1 });
    const r = Math.random();
    const boss = this.isBoss;
    if (r < (boss ? .85 : .42)) { // 武器
      let id; do { id = pick(WEAPON_IDS); } while (id === 'bubble' && Math.random() < .6);
      const ammo = Math.round(WEAPONS[id].ammo * (1 + .3 * Save.d.up.ammo));
      if (this.weapon && this.weapon.id === id) this.weapon.ammo += ammo; else this.weapon = { id, ammo };
      if (!Save.d.weaponsSeen.includes(id)) Save.d.weaponsSeen.push(id);
      SND.play('weapon');
      this.banner_('獲得 ' + WEAPONS[id].name, WEAPONS[id].desc, WEAPONS[id].col);
      FX.text(x, y + 34, '+' + ammo + ' 發', WEAPONS[id].col, 20, 1);
    } else if (r < (boss ? .93 : .78)) { // 變種
      const id = pick(MUT_IDS); this.giveMut(id, x, y);
    } else if (r < .92) { const n = randi(6, 12); for (let i = 0; i < n; i++) this.dropCoin(x + rand(-12, 12), y + rand(-6, 10)); FX.text(x, y + 34, '金幣雨!', '#ffe14a', 22, 1); }
    else { if (this.hearts < this.maxHearts) { this.hearts++; SND.play('heart'); FX.text(x, y + 34, '+1 生命', '#ff8aa0', 24, 1.1); } else { this.giveMut('shield', x, y); } }
  }
  giveMut(id, x, y) {
    const m = MUTS[id]; this.mut[id] = m.dur * (id === 'shield' ? 1 : 1);
    if (!Save.d.mutsSeen.includes(id)) Save.d.mutsSeen.push(id);
    SND.play('power'); FX.ring(this.f.x, this.f.wy, m.col, 70, .6, 6);
    FX.burst(this.f.x, this.f.wy, 24, { color: [m.col, '#fff'], type: 'star', min: 60, max: 220, g: 0, l0: .5, l1: 1, s0: 4, s1: 8 });
    this.banner_('變身！' + m.name, m.desc, m.col);
    this.f.sparkle = 1;
  }

  /* ---------- 傷害 / 死亡 ---------- */
  hurt(kind, ix, iy) {
    const f = this.f;
    if (this.state !== 'play' || f.dead || f.invul > 0) return;
    if (this.mut.shield > 0) {
      this.mut.shield = 0; f.invul = 1.1; SND.play('pop');
      FX.ring(f.x, f.wy, '#8fd0ff', 60, .5, 5); FX.burst(f.x, f.wy, 14, { color: ['#bfe9ff', '#fff'], min: 60, max: 180, g: 0, l0: .3, l1: .6 });
      FX.text(f.x, f.wy + 34, '護盾擋住!', '#8fd0ff', 20, 1); return;
    }
    this.hearts--; this.hurtCount++; this.hurtFlash = 1;
    FX.shake = 12; vibrate(40);
    const deadlyKinds = { drown: 'drown', burn: 'burn', void: 'void' };
    f.dead = { kind: deadlyKinds[kind] || 'hit', t: 0, why: kind };
    f.mood = 'dead'; f.ride = null; this.queue = null;
    if (kind === 'drown') { SND.play('splash'); FX.burst(f.x, f.wy, 22, { color: ['#cfeeff', '#7fc8ff', '#fff'], min: 80, max: 260, up: 160, l0: .4, l1: .9 }); FX.ring(f.x, f.wy, '#fff', 60, .7, 4); FX.ring(f.x, f.wy, '#bfe9ff', 40, .6, 3); }
    else if (kind === 'burn') { SND.play('hit'); FX.burst(f.x, f.wy, 26, { color: ['#ffe14a', '#ff7a2a', '#ff3b1a'], min: 60, max: 240, up: 120, l0: .4, l1: .9, glow: true }); }
    else if (kind === 'void') { SND.play('splash'); }
    else { SND.play(kind === 'hit' ? 'squash' : 'hit'); FX.burst(f.x, f.wy, 14, { color: ['#7be04b', '#fff', '#ffe14a'], min: 60, max: 200, l0: .3, l1: .7 }); FX.ring(f.x, f.wy, '#ffd27a', 50, .5, 5); }
    if (this.hearts <= 0) { this.state = 'dying'; this.stT = 0; this.finalDeath = true; }
    else { this.state = 'dying'; this.stT = 0; this.finalDeath = false; }
  }
  respawn() {
    const f = this.f, minRow = Math.floor(this.camRow + .001);
    let target = -1;
    for (let r = Math.min(this.rows - 1, f.row); r >= minRow; r--) { if (this.lanes[r].type === 'safe' || this.lanes[r].type === 'goal') { target = r; break; } }
    if (target < 0) for (let r = minRow; r < this.rows; r++) { if (this.lanes[r].type === 'safe') { target = r; break; } }
    if (target < 0) target = minRow;
    const lane = this.lanes[target];
    let col = colOf(f.x), best = -1, bd = 99;
    for (let c = 0; c < COLS; c++) { if (lane.blocks[c] === undefined && Math.abs(c - col) < bd) { bd = Math.abs(c - col); best = c; } }
    if (best < 0) best = 4;
    f.row = target; f.x = cellX(best); f.wy = rowY(target); f.hopT = 1; f.dead = null; f.invul = 2.2; f.mood = 'normal'; f.z = 0; f.sx = 1; f.sy = 1; f.ride = null;
    f.ang = 0; f.angT = 0; f.dir = 0;
    this.state = 'play'; this.idle = Math.min(this.idle, 5);
    FX.ring(f.x, f.wy, '#fff', 54, .5, 4); FX.burst(f.x, f.wy, 12, { color: ['#fff', '#b5f27e'], type: 'star', min: 50, max: 140, g: 0, l0: .4, l1: .8, s0: 3, s1: 6 });
    SND.play('revive'); this.checkItems();
  }

  /* ---------- 水面 ---------- */
  platState(o) {
    const s = { solid: true, sink: 0, alpha: 1, warn: false, dive: 0, crack: 0, shake: false, blink: undefined };
    if (o.broken) { s.solid = false; s.sink = 1; s.alpha = 0; return s; }
    if (o.dive) { const p = ((this.time + o.ph) % o.cyc) / o.cyc; if (p < .55) s.dive = 0; else if (p < .68) { s.warn = true; s.dive = .12 + (p - .55) * 2; } else if (p < .92) { s.dive = 1; s.solid = false; } else s.dive = 1 - (p - .92) / .08; }
    if (o.blink) { const p = ((this.time + o.ph) % o.cyc) / o.cyc; if (p < .62) s.blink = 1; else if (p < .78) { s.blink = .45 + Math.sin(this.time * 30) * .25; } else if (p < .95) { s.blink = .1; s.solid = false; } else s.blink = .5; }
    if (o.crack || o.sink) { const k = clamp((o.stand - .5) / 1.7, 0, 1); s.crack = o.crack ? k : 0; s.sink = o.sink ? k * .6 : 0; s.shake = k > 0 && k < 1 && o.stand > .5; if (o.sink) s.alpha = 1 - k * .3; }
    return s;
  }
  platformAt(lane, x) {
    const tmp = [];
    for (const o of lane.objs) {
      if (!o.plat) continue;
      const st = this.platState(o); if (!st.solid) continue;
      for (const ix of laneInst(lane, o, tmp)) if (Math.abs(x - ix) <= o.w / 2 - 1) return { o, ix };
    }
    if (lane.temps) for (const tp of lane.temps) if (Math.abs(x - tp.x) <= tp.w / 2) return { o: tp, ix: tp.x, temp: true };
    return null;
  }
  fallKind() { return this.world.fall; }

  /* ---------- 著地 ---------- */
  land() {
    const f = this.f, lane = this.lanes[f.toRow];
    f.row = f.toRow; f.x = f.toX; f.wy = rowY(f.row); f.hopT = 1; f.z = this.mut.fly > 0 ? 10 : 0;
    f.sx = 1.2; f.sy = .8; f.ang = f.angT;
    if (f.row > this.bestRow) { this.bestRow = f.row; this.idle = 0; this.hawkT = 0; }
    FX.burst(f.x, f.wy - 8, 5, { color: lane.type === 'water' ? ['#cfeeff', '#fff'] : ['#d8c8a0', '#e8dcc0'], min: 20, max: 70, g: 120, l0: .2, l1: .4, s0: 1.5, s1: 3 });
    if (lane.type === 'water') {
      if (this.mut.fly > 0) { /* 飛行中 */ }
      else if (this.mut.giant > 0) { FX.ring(f.x, f.wy, '#fff', 80, .6, 5); SND.play('splash'); }
      else {
        const p = this.platformAt(lane, f.x);
        if (p) { f.ride = { lane, o: p.o, temp: p.temp }; this.onBoard(p.o, p.ix, lane); }
        else if (this.mut.freeze > 0) { this.makeIce(lane); }
        else { this.hurt(this.fallKind() === 'splash' ? 'drown' : this.fallKind()); return; }
      }
      FX.ring(f.x, f.wy - 6, 'rgba(255,255,255,.9)', 34, .4, 3);
    } else { SND.play('tick'); }
    this.checkItems();
    if (f.row >= this.rows - 1 && !this.isBoss) this.win();
  }
  onBoard(o, ix, lane) {
    if (o.head) { // 鱷魚頭
      const d = lane.dir, headStart = d > 0 ? ix + o.w / 2 - o.head : ix - o.w / 2;
      const hx0 = Math.min(headStart, headStart + o.head), hx1 = Math.max(headStart, headStart + o.head);
      if (this.f.x >= hx0 && this.f.x <= hx1) { this.hurt('bite'); return; }
    }
    SND.play('tick');
  }
  makeIce(lane) {
    lane.temps = lane.temps || [];
    lane.temps.push({ x: this.f.x, w: 52, ttl: 5, plat: true, kind: 'ice', temp: true, vx: lane.vx });
    this.f.ride = { lane, o: lane.temps[lane.temps.length - 1], temp: true };
    SND.play('ice'); FX.burst(this.f.x, this.f.wy, 14, { color: ['#dff8ff', '#7fd8ff'], type: 'star', min: 30, max: 110, g: 0, l0: .4, l1: .8, s0: 3, s1: 5 });
  }
  checkItems() {
    const f = this.f, lane = this.lane; if (!lane) return;
    const col = colOf(f.x);
    for (const it of lane.items) if (!it.got && it.col === col) this.pickup(it, lane);
  }

  /* ---------- 勝利 / 失敗 ---------- */
  win() {
    if (this.state === 'won') return;
    this.state = 'won'; this.stT = 0;
    SND.play('win'); SND.stopMusic();
    const f = this.f;
    for (let i = 0; i < 70; i++) FX.add({ type: 'sq', x: rand(20, W - 20), y: this.camY + FIELD_BOTTOM - FIELD_TOP + rand(-40, 40), vx: rand(-90, 90), vy: rand(-80, 160), g: 160, size: rand(3, 6), life: rand(1.4, 2.4), color: pick(['#ff4b6e', '#ffe14a', '#4bd1ff', '#8bf05a', '#b07bff', '#ff9a3a']), rot: rand(0, 6), vr: rand(-10, 10), shrink: false });
    f.mood = 'happy';
  }
  lose() {
    this.state = 'lost'; this.stT = 0; SND.play('lose'); SND.stopMusic();
  }

  /* 結算：寫入存檔，回傳結果給 Result 畫面 */
  finish() {
    const L = this.lvl, d = L.d;
    let stars = 1;
    if (this.isBoss) { if (this.hurtCount <= 1) stars++; if (this.hurtCount === 0) stars++; }
    else { if (this.coinsGot >= L.starCoins) stars++; if (this.hurtCount === 0) stars++; }
    const old = Save.d.stars[this.id] || 0;
    const first = old === 0;
    const bonus = 20 + Math.floor(d * 40) + stars * 10 + (this.isBoss ? 120 : 0);
    Save.d.coins += bonus; Save.d.totalCoins += bonus;
    let gems = 0;
    if (first && this.isBoss) gems += 3;
    if (stars === 3 && old < 3) gems += 1;
    Save.d.gems += gems;
    if (stars > old) Save.d.stars[this.id] = stars;
    if (this.isBoss) Save.d.bossKills++;
    Save.d.played++;
    const nxt = Math.min(TOTAL_LEVELS - 1, this.id + 1);
    Save.d.lastLevel = Save.unlocked(nxt) ? nxt : this.id; Save.d.world = Math.floor(Save.d.lastLevel / LEVELS_PER_WORLD);
    Save.write();
    return { id: this.id, stars, oldStars: old, first, coins: this.coinsGot, totalCoins: L.totalCoins, starCoins: L.starCoins, bonus, gems, hurt: this.hurtCount, kills: this.kills, isBoss: this.isBoss };
  }

  /* ------------------------------------------------------------------ */
  update(dt) {
    UI.frame(dt);
    this.layout();
    this.t += dt;
    FX.update(dt);
    if (this.hurtFlash) this.hurtFlash = Math.max(0, this.hurtFlash - dt * 2);
    Weather.update(dt);
    if (this.banner) { this.banner.t += dt; if (this.banner.t > 2.4) this.banner = null; }
    // UI 按鈕
    if (this.state === 'play' && this.paused) {
      if (UI.clicked('p_resume')) { this.paused = false; SND.play('click'); }
      if (UI.clicked('p_retry')) { SND.play('click'); Game.go('play', this.id); return; }
      if (UI.clicked('p_map')) { SND.play('back'); Game.go('map'); return; }
      if (UI.clicked('p_snd')) { Save.d.sound = !Save.d.sound; Save.write(); }
      if (UI.clicked('p_mus')) { Save.d.music = !Save.d.music; Save.write(); SND.refreshMusic(); }
      return;
    }
    if (UI.clicked('pause')) { this.togglePause(); return; }
    switch (this.state) {
      case 'intro': this.introT += dt; if (this.introT > (this.isBoss ? 3.2 : 2.2)) { this.state = 'play'; if (this.isBoss) this.banner_('開戰!', '用武器打倒魔王!', '#ffe14a'); } this.updateCam(dt, true); return;
      case 'dying': {
        this.stT += dt; this.f.dead.t += dt; this.updateWorld(dt * .3);
        this.updateCam(dt);
        const need = this.f.dead.kind === 'hit' ? 1.0 : 0.95;
        if (this.stT > need) { if (this.finalDeath) this.lose(); else this.respawn(); }
        return;
      }
      case 'won': this.stT += dt; this.updateWorld(dt * .5); if (this.stT > 2.3 && !this.resDone) { this.resDone = true; Game.go('result', this.finish()); } return;
      case 'lost': this.stT += dt; if (UI.clicked('l_retry')) { SND.play('click'); Game.go('play', this.id); return; } if (UI.clicked('l_map')) { SND.play('back'); Game.go('map'); return; }
        if (UI.clicked('l_revive')) { const cost = this.reviveCost(); if (Save.d.coins >= cost) { Save.d.coins -= cost; Save.write(); this.revives++; this.hearts = Math.min(this.maxHearts, 2); this.respawn(); SND.music(this.isBoss ? 'boss' : this.world.music); } else SND.play('deny'); }
        this.updateWorld(dt * .2); return;
      case 'bossdead': this.stT += dt; this.updateWorld(dt); this.updateBossDeath(dt); this.updateCam(dt); return;
    }
    // ---------- 遊戲中 ----------
    this.time += dt;
    const ts = this.ts();
    // 長按連續移動
    if (this.hold !== null) { this.holdT -= dt; if (this.holdT <= 0) { this.tryHop(this.hold); this.holdT = .13; } }
    if (this.keyHold) { this.keyHold.t -= dt; if (this.keyHold.t <= 0) { this.tryHop(this.keyHold.d); this.keyHold.t = .12; } }
    for (const [id, p] of this.ptrs) if (p.role === 'fire') this.fire();
    if (Input.keys[' '] || Input.keys['z'] || Input.keys['j']) this.fire();
    for (const k of MUT_IDS) if (this.mut[k] > 0) { this.mut[k] -= dt; if (this.mut[k] <= 0) this.mutEnd(k); }
    this.cd = Math.max(0, this.cd - dt);
    this.updateFrog(dt);
    this.updateWorld(dt);
    this.updateHazards(dt);
    this.updateCam(dt);
    this.updateSpawns(dt);
    if (this.isBoss) this.updateBoss(dt);
    if (this.hint && this.hint.t > 5) this.hint = null;
  }
  reviveCost() { return 60 + 60 * this.revives; }
  mutEnd(k) {
    this.mut[k] = 0;
    if (k === 'fly' && this.state === 'play') this.landFromFly();
    if (k === 'giant') { FX.ring(this.f.x, this.f.wy, '#7be04b', 80, .5, 6); }
  }
  landFromFly() { // 飛行結束時如果在水上，安全送回最近的陸地
    const f = this.f, lane = this.lane;
    f.z = 0;
    if (f.hopT < 1) return;
    if (lane.type === 'water') {
      const p = this.platformAt(lane, f.x);
      if (p) { f.ride = { lane, o: p.o, temp: p.temp }; return; }
      this.respawnSoft();
    } else if (lane.type === 'road' || lane.type === 'rail') { /* 平常的馬路：繼續玩 */ }
  }
  respawnSoft() { // 不扣血的送回
    const f = this.f; const h = this.hearts; this.hearts = h; f.dead = null;
    let target = -1; const minRow = Math.floor(this.camRow + .001);
    for (let r = f.row; r >= minRow; r--) if (this.lanes[r].type === 'safe') { target = r; break; }
    if (target < 0) for (let r = f.row; r < this.rows; r++) if (this.lanes[r].type === 'safe') { target = r; break; }
    const lane = this.lanes[target]; let best = 4, bd = 99, col = colOf(f.x);
    for (let c = 0; c < COLS; c++) if (lane.blocks[c] === undefined && Math.abs(c - col) < bd) { bd = Math.abs(c - col); best = c; }
    f.row = target; f.x = cellX(best); f.wy = rowY(target); f.invul = 1; f.ride = null;
    FX.ring(f.x, f.wy, '#fff', 54, .5, 4); SND.play('revive');
  }

  updateFrog(dt) {
    const f = this.f;
    f.invul = Math.max(0, f.invul - dt);
    f.blinkT -= dt; if (f.blinkT < 0) { f.blinkT = rand(1.6, 4); f.blink = 1; } if (f.blink > 0) f.blink = Math.max(0, f.blink - dt * 7);
    f.mouth = Math.max(0, f.mouth - dt * 5);
    f.sparkle = Math.max(0, f.sparkle - dt);
    // 角度平滑
    let da = f.angT - f.ang; while (da > PI) da -= TAU; while (da < -PI) da += TAU;
    f.ang += da * Math.min(1, dt * 22);
    f.sx += (1 - f.sx) * Math.min(1, dt * 14); f.sy += (1 - f.sy) * Math.min(1, dt * 14);
    if (f.dead) return;
    if (f.hopT < 1) {
      f.hopT = Math.min(1, f.hopT + dt / f.dur);
      const k = f.hopT;
      f.x = lerp(f.fromX, f.toX, k); f.wy = lerp(rowY(f.fromRow), rowY(f.toRow), k);
      const dist = Math.hypot(f.toX - f.fromX, rowY(f.toRow) - rowY(f.fromRow)) / TILE;
      f.z = Math.sin(k * PI) * (14 * Math.sqrt(dist)) + (this.mut.fly > 0 ? 10 : 0);
      f.sx = 1 - .1 * Math.sin(k * PI); f.sy = 1 + .22 * Math.sin(k * PI);
      if (k >= 1) { this.land(); if (this.queue !== null && this.queue !== undefined && this.state === 'play') { const q = this.queue; this.queue = null; this.tryHop(q); } }
      return;
    }
    // 搭乘平台
    const lane = this.lane;
    if (this.mut.fly > 0) { f.z = 10 + Math.sin(this.t * 8) * 2.5; }
    if (lane.type === 'water' && this.mut.fly <= 0 && this.mut.giant <= 0) {
      f.x += lane.vx * dt * this.ts();
      const p = this.platformAt(lane, f.x);
      if (!p) { this.hurt(this.fallKind() === 'splash' ? 'drown' : this.fallKind()); return; }
      f.ride = { lane, o: p.o, temp: p.temp };
      if (p.o.crack || p.o.sink) {
        p.o.stand += dt;
        if (p.o.stand > 2.4 && !p.o.broken) { p.o.broken = true; p.o.brokenUntil = this.time + 4.5; SND.play('splash'); FX.burst(p.ix, f.wy, 16, { color: p.o.sink ? ['#ff9a3a', '#6a5058'] : ['#fff', '#cfeeff', '#9fd0ee'], min: 60, max: 220, up: 100, l0: .4, l1: .9 }); this.hurt(this.fallKind() === 'splash' ? 'drown' : this.fallKind()); return; }
      }
      // 不能被帶出畫面
      if (f.x < -6 || f.x > W + 6) { this.hurt('drown'); return; }
      if (p.o.item) { this.collect(p.o.item, f.x, f.wy); p.o.item = null; }
    } else if (lane.type === 'water' && this.mut.giant > 0) {
      f.x += lane.vx * dt * this.ts() * .3; f.x = clamp(f.x, 20, W - 20);
    }
    // 吃金幣的磁力
    this.magnet(dt);
    if (this.mut.giant <= 0) { /* 其它 */ }
    // 站在平台上的待機姿勢
    if (f.z > 0 && this.mut.fly <= 0) f.z = Math.max(0, f.z - dt * 120);
    // 眼睛看向前進方向
    f.look = [Math.sin(f.ang), -Math.cos(f.ang)];
  }
  magnet(dt) {
    const f = this.f;
    const R = (this.mut.magnet > 0 ? 130 + Save.d.up.magnet * 34 : Save.d.up.magnet * 30);
    if (R <= 0) return;
    const r0 = Math.max(0, f.row - 3), r1 = Math.min(this.rows - 1, f.row + 3);
    for (let r = r0; r <= r1; r++) {
      const lane = this.lanes[r];
      for (const it of lane.items) {
        if (it.got || (it.kind !== 'coin' && it.kind !== 'gem')) continue;
        const x = cellX(it.col), y = rowY(r);
        if (Math.hypot(x - f.x, y - f.wy) < R) { it.got = true; this.ents.push({ type: 'coinfx', x, y, t: 0, vx: 0, vy: 0, gem: it.kind === 'gem' }); }
      }
    }
  }

  /* ---------- 世界更新（車、平台、火車） ---------- */
  updateWorld(dt) {
    const ts = this.ts(), time = this.time;
    const r0 = Math.max(0, Math.floor(this.camRow) - 2), r1 = Math.min(this.rows - 1, Math.floor(this.camRow) + FIELD_ROWS + 2);
    for (let r = r0; r <= r1; r++) {
      const lane = this.lanes[r];
      if (lane.vx) lane.off += lane.vx * dt * ts;
      for (const o of lane.objs) {
        if (o.frozen > 0) o.frozen -= dt; if (o.hitT > 0) o.hitT -= dt;
        if (o.broken && time > o.brokenUntil) { o.broken = false; o.stand = 0; }
        else if (!o.broken && (o.crack || o.sink) && this.f.ride && this.f.ride.o === o) { /* 站著計時在 updateFrog */ }
        else if ((o.crack || o.sink) && o.stand > 0) o.stand = Math.max(0, o.stand - dt * .5);
      }
      if (lane.temps) { for (let i = lane.temps.length - 1; i >= 0; i--) { const tp = lane.temps[i]; tp.ttl -= dt; tp.x += tp.vx * dt * ts; if (tp.ttl <= 0) { lane.temps.splice(i, 1); FX.burst(tp.x, rowY(r), 8, { color: ['#dff8ff', '#7fd8ff'], l0: .3, l1: .6 }); } } }
      if (lane.rail) this.updateRail(lane, dt * ts);
    }
  }
  updateRail(lane, dt) {
    const R_ = lane.rail;
    R_.t += dt;
    if (R_.state === 'idle') { if (R_.t >= R_.period) { R_.state = 'warn'; R_.t = 0; SND.play('warn'); } }
    else if (R_.state === 'warn') {
      if (Math.floor(R_.t * 6) !== Math.floor((R_.t - dt) * 6) && Math.floor(R_.t * 6) % 3 === 0) SND.play('warn');
      if (R_.t >= 1.7) { R_.state = 'run'; R_.t = 0; R_.dirv = lane.dir || 1; R_.x = R_.dirv > 0 ? -R_.len : W + R_.len; SND.play('swoosh'); FX.shake = 6; }
    } else if (R_.state === 'run') {
      R_.x += R_.dirv * 720 * dt;
      if ((R_.dirv > 0 && R_.x > W + 40) || (R_.dirv < 0 && R_.x < -40)) { R_.state = 'idle'; R_.t = 0; }
    }
  }
  trainRect(lane) { const R_ = lane.rail; if (!R_ || R_.state !== 'run') return null; return R_.dirv > 0 ? [R_.x, R_.x + R_.len] : [R_.x - R_.len, R_.x]; }

  /* ---------- 危險判定 ---------- */
  updateHazards(dt) {
    const f = this.f;
    if (f.dead) return;
    // 在哪一排判定？
    let lane;
    if (f.hopT < 1) lane = this.lanes[f.hopT < .5 ? f.fromRow : f.toRow]; else lane = this.lane;
    const giant = this.mut.giant > 0, ghost = this.mut.ghost > 0, fly = this.mut.fly > 0;
    const tmp = [];
    const rowsToCheck = [lane];
    if (f.hopT < 1 && f.toRow !== f.fromRow) rowsToCheck.push(this.lanes[f.hopT < .5 ? f.toRow : f.fromRow]);
    for (const ln of rowsToCheck) {
      if (ln !== lane && f.hopT > .3 && f.hopT < .7) continue;
      for (const o of ln.objs) {
        if (!o.harm || o.dead) continue;
        for (const ix of laneInst(ln, o, tmp)) {
          if (Math.abs(f.x - ix) < o.w / 2 + 7 - (o.walker ? 2 : 0)) {
            if (giant) { o.hp = 0; FX.shake = 10; this.killObj(o, ln, ix); continue; }
            if (o.frozen > 0 || ghost || fly || f.invul > 0) continue;
            this.hurt('hit'); return;
          }
        }
      }
      // 火車
      const tr = this.trainRect(ln);
      if (tr && !ghost && !fly && !giant && f.invul <= 0 && f.x > tr[0] - 8 && f.x < tr[1] + 8) { this.hurt('hit'); return; }
      if (tr && giant && f.x > tr[0] - 8 && f.x < tr[1] + 8) { FX.shake = 6; }
    }
  }

  /* ---------- 敵人生成 ---------- */
  updateSpawns(dt) {
    if (this.f.dead) return;
    const d = this.lvl.d, ts = this.ts();
    if (!this.isBoss) {
      // 發呆老鷹
      this.idle += dt;
      if (this.idle > 8 && !this.warnedHawk) { this.warnedHawk = true; SND.play('warn'); this.banner_('快往前跳!', '老鷹要來了!', '#ffb3b3'); }
      if (this.idle > 10.2) { this.idle = 6; this.warnedHawk = false; this.spawnHawk(); }
      if (this.idle < 6) this.warnedHawk = false;
      if (d >= .15 && this.time > 8) { this.flyT -= dt * ts; if (this.flyT <= 0) { this.flyT = lerp(15, 6.5, d) + rand(0, 4); this.spawnFlyer(); } }
      if (d >= .3 && this.time > 6) { this.strikeT -= dt * ts; if (this.strikeT <= 0) { this.strikeT = lerp(9, 3.8, d) + rand(0, 2.5); this.spawnStrikes(d > .6 && Math.random() < .5 ? 2 : 1); } }
    }
    // 更新實體
    for (const e of this.ents) this.updateEnt(e, dt, ts);
    this.ents = this.ents.filter(e => !e.remove);
    this.updateProjs(dt);
  }
  visRows() { return [Math.max(0, Math.floor(this.camRow) + 1), Math.min(this.rows - 2, Math.floor(this.camRow) + FIELD_ROWS - 2)]; }
  spawnFlyer(rowPref) {
    const [a, b] = this.visRows();
    let r = rowPref !== undefined ? rowPref : clamp(this.f.row + randi(-2, 4), a, b);
    const left = Math.random() < .5;
    this.ents.push({ type: 'flyer', kind: this.world.flyer, x: left ? -40 : W + 40, y: rowY(r), y0: rowY(r), vx: (left ? 1 : -1) * (170 + this.lvl.d * 120), warn: 1.3, hp: 1, t: 0, row: r, ph: rand(0, 6), sideL: left });
    SND.play('warn');
  }
  spawnHawk() {
    const f = this.f, left = f.x > W / 2;
    this.ents.push({ type: 'hawk', x: left ? -60 : W + 60, y: f.wy, vx: (left ? 1 : -1) * 330, warn: 1.1, t: 0, row: f.row });
    SND.play('roar');
  }
  spawnStrikes(n) {
    const kind = this.world.strike;
    const [a, b] = this.visRows();
    for (let i = 0; i < n; i++) {
      let col, row;
      if (kind === 'laser') { col = i === 0 ? colOf(this.f.x) + randi(-1, 1) : randi(0, 8); col = clamp(col, 0, 8); row = this.rows; this.ents.push({ type: 'strike', kind, col, row: Math.floor(this.camRow) + FIELD_ROWS - 1, x: cellX(col), warn: 1.2, t: 0, hit: false, hitT: 0 }); SND.play('warn'); continue; }
      for (let tries = 0; tries < 12; tries++) {
        row = clamp(this.f.row + randi(-1, 3), a, b); col = i === 0 && Math.random() < .7 ? colOf(this.f.x) + randi(-1, 1) : randi(0, 8); col = clamp(col, 0, 8);
        const ln = this.lanes[row]; if (ln.type === 'water' || ln.blocks[col] !== undefined || ln.type === 'goal' || ln.type === 'bossfloor') continue;
        this.ents.push({ type: 'strike', kind, col, row, x: cellX(col), y: rowY(row), warn: 1.15, t: 0, hit: false, hitT: 0 }); SND.play('warn'); break;
      }
    }
  }
  updateEnt(e, dt, ts) {
    const f = this.f;
    e.t += dt;
    switch (e.type) {
      case 'flyer': {
        if (e.dead) { e.remove = true; return; }
        if (e.warn > 0) { e.warn -= dt * ts; return; }
        e.x += e.vx * dt * ts; e.y = e.y0 + Math.sin(e.t * 4 + e.ph) * 10;
        if (e.x < -80 || e.x > W + 80) { e.remove = true; return; }
        if (!f.dead && Math.abs(f.x - e.x) < 22 && Math.abs(f.wy - e.y) < 24) {
          if (this.mut.giant > 0) { this.hurtEnt(e, 99); } else if (this.mut.ghost <= 0 && f.invul <= 0) { this.hurt('bird'); }
        }
        break;
      }
      case 'hawk': {
        if (e.warn > 0) { e.warn -= dt; return; }
        e.x += e.vx * dt;
        if (e.x < -90 || e.x > W + 90) { e.remove = true; return; }
        if (!f.dead && f.hopT >= 1 && Math.abs(f.x - e.x) < 26 && Math.abs(f.wy - e.y) < 26 && f.invul <= 0 && this.mut.ghost <= 0) { this.hurt('bird'); }
        break;
      }
      case 'minion': {
        if (e.dead) { e.remove = true; return; }
        e.x += e.vx * dt * ts;
        if (e.x < -80 || e.x > W + 80) { e.remove = true; return; }
        if (e.frozen > 0) { e.frozen -= dt; return; }
        const sp = VEH[e.kind];
        if (!f.dead && Math.abs(f.x - e.x) < sp.w / 2 + 8 && f.row === Math.round((e.y - 25) / TILE) && f.hopT >= 1) {
          if (this.mut.giant > 0) this.hurtEnt(e, 99); else if (this.mut.ghost <= 0 && this.mut.fly <= 0 && f.invul <= 0) this.hurt('hit');
        }
        break;
      }
      case 'strike': {
        if (e.hit) { e.hitT += dt * 2; if (e.hitT >= 1) e.remove = true; return; }
        e.warn -= dt * ts;
        if (e.warn <= 0) {
          e.hit = true; e.hitT = 0;
          const isLaser = e.kind === 'laser';
          SND.play(isLaser ? 'zap' : 'strike'); FX.shake = Math.max(FX.shake, isLaser ? 5 : 9);
          if (!isLaser) { const y = rowY(e.row); FX.burst(e.x, y, 14, { color: ['#fff', '#ffd27a', '#ff9a3a'], min: 60, max: 200, up: 80, l0: .3, l1: .7 }); }
          if (!f.dead && f.invul <= 0 && this.mut.ghost <= 0) {
            const onCell = isLaser ? Math.abs(f.x - e.x) < 24 : (Math.abs(f.x - e.x) < 26 && Math.abs(f.wy - rowY(e.row)) < 28);
            if (onCell && !(e.kind === 'geyser' && this.mut.fly > 0)) {
              if (this.mut.giant > 0) { FX.ring(f.x, f.wy, '#fff', 70, .4, 5); } else this.hurt('zap');
            }
          }
        }
        break;
      }
      case 'coinfx': {
        // 往青蛙飛
        e.vy = (e.vy || 0) - 300 * dt; e.x += (e.vx || 0) * dt; e.y += e.vy * dt;
        if (e.t > .25) {
          const dx = f.x - e.x, dy = f.wy - e.y, dist = Math.hypot(dx, dy) || 1, sp = 520 + (e.t - .25) * 900;
          e.x += dx / dist * sp * dt; e.y += dy / dist * sp * dt;
          if (dist < 18) { e.remove = true; if (e.gem) this.collect('gem', f.x, f.wy); else { this.addCoins(1, f.x, f.wy); SND.play('coin'); FX.burst(f.x, f.wy + 10, 4, { color: ['#ffe14a', '#fff3a0'], type: 'star', min: 20, max: 70, g: 0, l0: .25, l1: .4, s0: 2.4, s1: 4 }); } }
        }
        if (e.t > 3) e.remove = true;
        break;
      }
      case 'bolt': if (e.t > e.life) e.remove = true; break;
    }
  }
  updateProjs(dt) {
    const f = this.f, ts = this.ts();
    const tmp = [];
    for (const p of this.projs) {
      p.t += dt;
      if (p.owner === 'frog') {
        if (p.type === 'boomerang') {
          if (p.out) { p.x += p.vx * dt; p.y += p.vy * dt; p.dist += Math.hypot(p.vx, p.vy) * dt; if (p.dist > p.maxDist) { p.out = false; p.hits.clear(); } }
          else { const dx = f.x - p.x, dy = f.wy - p.y, d = Math.hypot(dx, dy) || 1; p.x += dx / d * 480 * dt; p.y += dy / d * 480 * dt; if (d < 22) p.dead = true; }
        } else {
          p.x += p.vx * dt; p.y += p.vy * dt; p.life -= Math.hypot(p.vx, p.vy) * dt; if (p.life <= 0) p.dead = true;
        }
        if (p.x < -20 || p.x > W + 20 || p.y > (this.camY + FIELD_BOTTOM - FIELD_TOP + 40) || p.y < this.camY - 40) { if (p.type === 'boomerang' && p.out) { p.out = false; p.hits.clear(); } else p.dead = true; }
        if (p.dead) continue;
        // 打敵人
        const row = Math.floor(p.y / TILE);
        if (row >= 0 && row < this.rows) {
          const lane = this.lanes[row];
          for (const o of lane.objs) {
            if (!o.harm || o.dead || p.hits.has(o)) continue;
            for (const ix of laneInst(lane, o, tmp)) {
              if (Math.abs(p.x - ix) < o.w / 2 + 6 && Math.abs(p.y - rowY(row)) < 22) {
                p.hits.add(o); this.hurtObj(o, lane, ix, p.dmg, p, 'proj');
                if (p.pierce <= 0 || (p.pierce < 90 && p.hits.size > p.pierce)) p.dead = true;
                break;
              }
            }
            if (p.dead) break;
          }
        }
        if (p.dead) { FX.burst(p.x, p.y, 4, { color: [p.col, '#fff'], min: 20, max: 80, g: 0, l0: .15, l1: .3 }); continue; }
        for (const e of this.ents) {
          if ((e.type === 'flyer' || e.type === 'minion') && !e.dead && !p.hits.has(e) && Math.abs(p.x - e.x) < 22 && Math.abs(p.y - e.y) < 22) {
            p.hits.add(e);
            if (p.freeze) { e.frozen = p.freeze; e.vx *= .2; } else this.hurtEnt(e, p.dmg, 'proj');
            if (p.pierce <= 0 || (p.pierce < 90 && p.hits.size > p.pierce)) { p.dead = true; break; }
          }
        }
        if (p.dead) continue;
        if (this.boss && this.boss.state !== 'dead' && !p.hits.has('boss')) {
          const b = this.boss;
          if (Math.abs(p.x - b.x) < 92 && p.y > b.y - 48 && p.y < b.y + 52) {
            p.hits.add('boss');
            this.hurtBoss(p.freeze ? 1 : p.dmg, 'proj', p.freeze);
            if (p.type === 'boomerang') { if (p.out) { p.out = false; p.hits.clear(); p.hits.add('boss'); } } else if (p.pierce <= 0 || (p.pierce < 90 && p.hits.size > p.pierce)) p.dead = true;
          }
        }
        // 打掉魔王的子彈
        for (const q of this.projs) { if (q.owner === 'boss' && !q.dead && Math.hypot(q.x - p.x, q.y - p.y) < q.r + 8) { q.dead = true; FX.burst(q.x, q.y, 8, { color: [q.col, '#fff'], min: 40, max: 120, l0: .2, l1: .4 }); SND.play('pop'); if (p.type !== 'boomerang' && p.pierce <= 0) p.dead = true; } }
      } else { // 魔王子彈
        p.x += p.vx * dt * ts; p.y += p.vy * dt * ts; p.life -= dt;
        if (p.life <= 0 || p.y < this.camY - 30) { p.dead = true; continue; }
        if (!f.dead && f.invul <= 0 && this.mut.ghost <= 0 && Math.hypot(p.x - f.x, p.y - f.wy) < p.r + 11) {
          p.dead = true; FX.burst(p.x, p.y, 10, { color: [p.col, '#fff'], l0: .2, l1: .5 });
          if (this.mut.giant > 0) { FX.ring(p.x, p.y, '#fff', 40, .3, 4); } else this.hurt('bossball');
        }
      }
    }
    this.projs = this.projs.filter(p => !p.dead);
  }

  /* ---------- 攝影機 ---------- */
  updateCam(dt, snap) {
    const maxCam = Math.max(0, this.rows - FIELD_ROWS);
    const target = clamp(this.f.row - (FIELD_ROWS >= 13 ? 3.2 : 2.4), 0, maxCam);
    if (this.camRow < target) this.camRow += (target - this.camRow) * Math.min(1, dt * 7);
    if (snap) this.camRow = Math.max(this.camRow, 0);
    this.camRow = clamp(this.camRow, 0, maxCam);
    this.camY = this.camRow * TILE;
  }

  /* ---------- 魔王 ---------- */
  initBoss() {
    if (!this.isBoss) { this.boss = null; return; }
    const B = this.lvl.boss;
    const hp = B.maxhp;
    this.boss = { kind: B.kind, x: W / 2, y: LAND ? this.rows * TILE - 78 : 580, hp, maxhp: hp, dir: 1, state: 'idle', cd: 3.2, atk: null, windup: 0, open: 0, flash: 0, t: 0, phase: 0, frozen: 0, shown: 0, deathT: 0, ammoT: 5 };
  }
  hurtBoss(dmg, how, freeze) {
    const b = this.boss; if (!b || b.state === 'dead') return;
    if (this.state !== 'play') return;
    b.hp -= dmg; b.flash = 1; this.bossHitFx(b);
    if (freeze) { b.frozen = 1.8; }
    SND.play('hit');
    if (b.hp <= 0) this.bossDie();
  }
  bossHitFx(b) { FX.burst(b.x + rand(-60, 60), b.y + rand(-30, 30), 8, { color: ['#fff', '#ffe14a', '#ff9a3a'], min: 60, max: 200, l0: .3, l1: .6 }); FX.shake = Math.max(FX.shake, 4); }
  updateBoss(dt) {
    const b = this.boss, ts = this.ts(), f = this.f;
    b.t += dt; b.shown = Math.min(1, b.shown + dt * .8);
    b.flash = Math.max(0, b.flash - dt * 4);
    if (b.state === 'dead') return;
    const hk = b.hp / b.maxhp; b.phase = hk > .66 ? 0 : hk > .33 ? 1 : 2; b.rage = b.phase === 2;
    if (b.frozen > 0) { b.frozen -= dt; b.open = Math.max(0, b.open - dt * 3); return; }
    const spd = (38 + b.phase * 22) * ts;
    b.x += b.dir * spd * dt; if (b.x > 340) b.dir = -1; if (b.x < 110) b.dir = 1;
    b.cd -= dt * ts;
    if (b.state === 'idle' && b.cd <= 0) {
      const opts = ['volley', 'volley', 'strike', 'summon'];
      if (b.phase >= 1) opts.push('volley', 'strike'); if (b.phase >= 2) opts.push('strike', 'volley');
      b.atk = pick(opts); b.state = 'windup'; b.windup = .85 - b.phase * .1; SND.play('roar');
    } else if (b.state === 'windup') {
      b.windup -= dt * ts; b.open = Math.min(1, b.open + dt * 3.2);
      if (b.windup <= 0) { this.bossAttack(b.atk); b.state = 'idle'; b.cd = 3.4 - b.phase * .75 + rand(0, .6); }
    } else b.open = Math.max(0, b.open - dt * 3);
    if (b.state === 'idle') b.open = Math.max(0, b.open - dt * 3);
    // 補給
    b.ammoT -= dt;
    if (b.ammoT <= 0 && !f.dead) {
      b.ammoT = 8 + rand(0, 3);
      const crates = this.lanes.reduce((n, l) => n + l.items.filter(i => !i.got && i.kind === 'crate').length, 0);
      if (crates < 2) this.dropSupply();
    }
  }
  dropSupply() {
    const cands = this.lanes.filter(l => l.type === 'safe' && l.row >= 1 && l.row <= this.rows - 3);
    for (let tries = 0; tries < 10; tries++) {
      const l = pick(cands), c = randi(0, 8);
      if (l.blocks[c] !== undefined || l.items.some(i => i.col === c && !i.got)) continue;
      l.items.push({ col: c, kind: Math.random() < .25 ? 'heart' : 'crate', got: false, drop: 0 });
      FX.ring(cellX(c), rowY(l.row), '#fff3a0', 50, .6, 4); SND.play('crate');
      this.banner_('補給落下!', '去撿補給箱吧', '#ffe14a'); break;
    }
  }
  bossAttack(atk) {
    const b = this.boss, ph = b.phase, kind = b.kind, f = this.f;
    const cols = { toad: '#8fd860', robo: '#aab4c8', yeti: '#e8f6ff', dragon: '#ff7a2a', mother: '#ff4bd0', cake: '#ff6aa8' };
    const bcol = cols[kind];
    const my = b.y - 36;
    if (atk === 'volley') {
      const n = 3 + ph;
      for (let i = 0; i < n; i++) {
        const tx = i === 0 ? f.x : rand(30, W - 30);
        const dx = tx - b.x, dy = (f.wy - my), dist = Math.hypot(dx, dy) || 1, sp = 150 + ph * 25 + rand(-10, 15);
        this.projs.push({ owner: 'boss', type: 'boss', x: b.x + rand(-30, 30), y: my, vx: dx / dist * sp * .55, vy: -sp, r: 11, col: bcol, life: 8 });
      }
      SND.play('shoot');
    } else if (atk === 'strike') {
      const n = 3 + ph;
      const kindS = this.world.strike;
      for (let i = 0; i < n; i++) {
        let col, row;
        if (kindS === 'laser') { col = i === 0 ? colOf(f.x) : randi(0, 8); this.ents.push({ type: 'strike', kind: kindS, col, row: this.rows - 1, x: cellX(col), warn: 1.1, t: 0, hit: false, hitT: 0 }); continue; }
        for (let tries = 0; tries < 14; tries++) {
          row = randi(1, this.rows - 3); col = (i === 0 && tries < 8) ? colOf(f.x) : randi(0, 8);
          const ln = this.lanes[row]; if (ln.type === 'water' || ln.blocks[col] !== undefined) continue;
          this.ents.push({ type: 'strike', kind: kindS, col, row, x: cellX(col), y: rowY(row), warn: 1.1, t: 0, hit: false, hitT: 0 }); break;
        }
      }
      SND.play('warn');
    } else if (atk === 'summon') {
      const n = 1 + (ph >= 1 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const safe = this.lanes.filter(l => l.type === 'safe' && l.row >= 1 && l.row <= this.rows - 3);
        const l = pick(safe), left = Math.random() < .5, wk = pick(this.world.walker), sp = VEH[wk];
        this.ents.push({ type: 'minion', kind: wk, x: left ? -40 : W + 40, y: rowY(l.row), vx: (left ? 1 : -1) * (70 + ph * 20), hp: sp.hp, maxhp: sp.hp, t: 0 });
      }
      if (this.world.flyer && ph >= 1) this.spawnFlyer(randi(2, Math.max(2, this.rows - 4)));
      SND.play('swoosh');
    }
  }
  bossDie() {
    const b = this.boss; b.state = 'dead'; b.deathT = 0;
    this.state = 'bossdead'; this.stT = 0; this.f.mood = 'happy';
    this.projs = this.projs.filter(p => p.owner === 'frog');
    this.ents = this.ents.filter(e => e.type === 'coinfx');
    SND.play('boom'); SND.stopMusic(); FX.shake = 20; FX.flash = 1; FX.flashColor = '#ffffff';
    this.banner_('魔王被打倒了!', '', '#ffe14a');
  }
  updateBossDeath(dt) {
    const b = this.boss; b.deathT += dt;
    if (Math.floor(b.deathT * 8) !== Math.floor((b.deathT - dt) * 8) && b.deathT < 2.2) {
      const x = b.x + rand(-80, 80), y = b.y + rand(-40, 40);
      FX.burst(x, y, 16, { color: ['#ffd27a', '#ff7a2a', '#fff', '#ff4b6e'], min: 80, max: 260, l0: .4, l1: .9, s0: 3, s1: 8, glow: true });
      FX.ring(x, y, '#ffcf6a', 70, .5, 5); SND.play('boom'); FX.shake = 14;
      if (Math.random() < .6) this.dropCoin(x, y);
    }
    if (b.deathT > 2.6 && !this.done) { this.done = true; SND.play('win'); this.win(); this.stT = 1.2; }
  }
}

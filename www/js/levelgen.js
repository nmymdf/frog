'use strict';
/* =====================================================================
   關卡產生器：每一關都由「世界 + 難度」程序化組合，固定種子 → 每次相同
   ===================================================================== */
const MARGIN = 220;

/* 取得物件在這條路上目前所有可見的中心 x */
function laneInst(lane, o, out) {
  out.length = 0;
  let x = (o.x0 + lane.off) % lane.L; if (x < 0) x += lane.L;
  x -= MARGIN;
  const half = o.w / 2 + 12;
  for (let k = -1; k <= 2; k++) {
    const xx = x + k * lane.L;
    if (xx > -half && xx < W + half) out.push(xx);
  }
  return out;
}
const _tmpInst = [];

function roundTo(v, m) { return Math.round(v / m) * m; }

function buildLevel(id) {
  const { wi, li, world, def } = levelDef(id);
  const R = mulberry32(wi * 7919 + li * 104729 + 13);
  const lvl = { id, wi, li, world, def, name: def.name, lanes: [], rows: 0, boss: null, tutorial: id === 0, d: def.d };
  if (def.boss) { buildBossArena(lvl, R); }
  else { buildRunLevel(lvl, R); }
  // 鄰近關係
  lvl.lanes.forEach((l, i) => { l.below = lvl.lanes[i - 1] || null; l.above = lvl.lanes[i + 1] || null; });
  placeItems(lvl, R);
  // 統計金幣總數
  let total = 0;
  for (const l of lvl.lanes) {
    for (const it of l.items) if (it.kind === 'coin') total++;
    for (const o of l.objs) if (o.item === 'coin') total++;
  }
  lvl.totalCoins = total;
  lvl.starCoins = Math.max(8, Math.floor(total * .6));
  return lvl;
}

function newLane(type, row, extra) {
  return Object.assign({
    type, row, dir: 1, speed: 0, vx: 0, off: 0, L: 800, objs: [], blocks: {}, items: [],
    variant: Math.floor(Math.random() * 1000), safe: type === 'safe' || type === 'goal', group: 0, gpos: 0, gsize: 1,
  }, extra || {});
}

/* ---------------------------------------------------------------- */
function buildRunLevel(lvl, R) {
  const { world, def } = lvl, d = def.d, rows = def.rows;
  const lanes = lvl.lanes;
  const add = (type, extra) => { const l = newLane(type, lanes.length, extra); l.seed = Math.floor(R() * 1e6); lanes.push(l); return l; };
  // 起點 2 排草地
  for (let i = 0; i < 2; i++) add('safe', { start: true, gpos: i, gsize: 2, group: 0 });
  let gid = 1, lastHaz = '';
  const endAt = rows - 3;
  while (lanes.length < endAt) {
    const remain = endAt - lanes.length;
    // 選危險區型態
    const opts = [['road', .46], ['water', .4]];
    if (world.rail && d >= .2) opts.push(['rail', .16]);
    let tot = 0; opts.forEach(o => tot += o[1]);
    let r = R() * tot, type = 'road';
    for (const o of opts) { if ((r -= o[1]) <= 0) { type = o[0]; break; } }
    if (type === lastHaz && R() < .6) type = type === 'road' ? 'water' : 'road';
    lastHaz = type;
    let n;
    if (type === 'rail') n = 1 + (R() < .35 ? 1 : 0);
    else n = 1 + Math.floor(R() * (2 + d * 3));
    n = Math.min(n, 4, Math.max(1, remain - 1));
    const g = gid++;
    const kind = pickLaneKind(R, world, type, d);
    for (let i = 0; i < n; i++) {
      if (lanes.length >= endAt) break;
      const l = add(type, { group: g, gpos: i, gsize: n });
      l.dir = (i === 0 ? (R() < .5 ? 1 : -1) : -lanes[lanes.length - 2].dir);
      if (type === 'road') genRoad(R, l, world, d, kind, i);
      else if (type === 'water') genWater(R, l, world, d, kind, i);
      else genRail(R, l, d);
    }
    // 安全帶 1~3 排
    const room = endAt - lanes.length;
    if (room <= 0) break;
    const sg = Math.min(room, R() < .5 ? 1 : (R() < .55 ? 2 : 3));
    const gs = gid++;
    for (let i = 0; i < sg; i++) add('safe', { group: gs, gpos: i, gsize: sg });
  }
  while (lanes.length < rows - 2) add('safe', { group: gid, gpos: 0, gsize: 1 });
  add('safe', { group: 9999, gpos: 0, gsize: 2, prefinish: true });
  add('goal', { group: 10000, gpos: 0, gsize: 1 });
  lvl.rows = lanes.length;
  decorateSafe(lvl, R);
}

function pickLaneKind(R, world, type, d) {
  if (type === 'road') return pick2(R, world.road);
  if (type === 'water') {
    let ks = world.water.slice();
    if (d < .3) ks = ks.filter(k => k !== 'croc' && k !== 'narwhal');
    return pick2(R, ks);
  }
  return null;
}
function pick2(R, arr) { return arr[Math.floor(R() * arr.length)]; }

function genRoad(R, lane, world, d, mainKind, idx) {
  const spec = VEH[mainKind];
  lane.kind = mainKind;
  lane.speed = lerp(42, 100, d) * spec.sp * rand2(R, .85, 1.2);
  lane.vx = lane.dir * lane.speed;
  const gapBase = lerp(210, 125, d);
  let x = R() * 60;
  const objs = [];
  while (x < 640) {
    const k = R() < .78 ? mainKind : pick2(R, world.road);
    const sp = VEH[k];
    x += sp.w / 2;
    objs.push({ kind: k, x0: x, w: sp.w, h: sp.h, hp: sp.hp, maxhp: sp.hp, dead: false, deadUntil: 0, frozen: 0, harm: true });
    x += sp.w / 2 + gapBase * rand2(R, .8, 1.5);
  }
  lane.L = Math.max(640, x);
  lane.objs = objs;
  lane.off = R() * lane.L;
}
function genWater(R, lane, world, d, mainKind, idx) {
  const spec = PLAT[mainKind];
  lane.kind = mainKind;
  const slow = (mainKind === 'turtle' || mainKind === 'croc' || mainKind === 'narwhal') ? .9 : 1;
  lane.speed = lerp(30, 70, d) * rand2(R, .8, 1.2) * slow;
  lane.vx = lane.dir * lane.speed;
  const gapBase = lerp(64, 120, d);
  let x = R() * 60;
  const objs = [];
  let guard = 0;
  while (x < 680 && guard++ < 60) {
    // 偶爾夾雜其他平台
    let k = mainKind;
    if (R() < .14 && world.water.length > 1) { const alt = pick2(R, world.water); if (!(PLAT[alt].head && d < .35)) k = alt; }
    const sp = PLAT[k];
    let w, n = 1;
    if (sp.unit) { n = sp.n[0] + Math.floor(R() * (sp.n[1] - sp.n[0] + 1)); w = n * sp.unit; }
    else w = roundTo(rand2(R, sp.w[0], sp.w[1]), 10);
    x += w / 2;
    const o = { kind: k, x0: x, w, h: 40, plat: true, n, ph: R() * 6, cyc: 5.2 + R() * 1.6, state: 'up', breakT: 0, stand: 0, harm: false };
    if (sp.head) o.head = sp.head;
    if (sp.dive && d >= .2 && R() < (.35 + d * .5)) o.dive = true;
    if (sp.blink && d >= .3) o.blink = true;
    if (sp.crack && d >= .28) o.crack = true;
    if (sp.sink && d >= .4) o.sink = true;
    objs.push(o);
    x += w / 2 + gapBase * rand2(R, .8, 1.5);
  }
  lane.L = Math.max(680, x);
  lane.objs = objs;
  lane.off = R() * lane.L;
}
function genRail(R, lane, d) {
  lane.kind = 'train';
  lane.rail = { period: lerp(7.5, 4.6, d) + R() * 1.5, t: R() * 5, state: 'idle', x: 0, len: 560 + Math.floor(R() * 3) * 70, warn: 0 };
}
function rand2(R, a, b) { return a + R() * (b - a); }

/* 安全帶上的障礙物 / 敵人 */
function decorateSafe(lvl, R) {
  const { world, d } = lvl;
  for (const l of lvl.lanes) {
    if (l.type !== 'safe' || l.start) continue;
    // 同一組寬度 >=2 的安全帶，才放會擋路的障礙（保留一排完全空著）
    if (l.gsize >= 2 && l.gpos !== 0) {
      const n = 1 + Math.floor(R() * 3);
      for (let i = 0; i < n; i++) {
        const c = Math.floor(R() * COLS);
        if (l.blocks[c] === undefined && !l.prefinish) l.blocks[c] = pick2(R, world.props);
      }
    }
    // 巡邏怪
    if (Object.keys(l.blocks).length === 0 && !l.prefinish && R() < .12 + d * .32) {
      const kind = pick2(R, world.walker), sp = VEH[kind];
      const dir = R() < .5 ? 1 : -1;
      l.dir = dir; l.speed = lerp(32, 62, d) * sp.sp; l.vx = dir * l.speed;
      l.L = 760 + Math.floor(R() * 200);
      l.objs.push({ kind, x0: R() * l.L, w: sp.w, h: sp.h, hp: sp.hp, maxhp: sp.hp, dead: false, deadUntil: 0, frozen: 0, harm: true, walker: true });
      l.off = 0;
      if (d > .5 && R() < .4) l.objs.push({ kind, x0: (l.objs[0].x0 + l.L / 2) % l.L, w: sp.w, h: sp.h, hp: sp.hp, maxhp: sp.hp, dead: false, deadUntil: 0, frozen: 0, harm: true, walker: true });
    }
  }
  // 起點與終點兩側加一些樹，讓畫面不單調（不擋中間）
  for (const l of lvl.lanes) {
    if (l.start || l.prefinish || l.type === 'goal') {
      for (const c of [0, 8]) if (R() < .75) l.blocks[c] = pick2(R, world.props);
      if (R() < .6) l.blocks[R() < .5 ? 1 : 7] = pick2(R, world.props);
    }
  }
}

/* ---------------------------------------------------------------- */
function placeItems(lvl, R) {
  const { lanes, world, d } = lvl;
  const luck = Save.d.up.luck;
  const freeCols = (l) => { const a = []; for (let c = 0; c < COLS; c++) if (l.blocks[c] === undefined && !l.items.some(i => i.col === c)) a.push(c); return a; };
  const safeLanes = lanes.filter(l => l.type === 'safe' && !l.start && !l.prefinish);
  // 危險區的金幣縱列
  const groups = {};
  lanes.forEach(l => { if (l.type === 'road' || l.type === 'water' || l.type === 'rail') (groups[l.group] = groups[l.group] || []).push(l); });
  Object.values(groups).forEach(g => {
    if (R() < .7) {
      const c = 1 + Math.floor(R() * (COLS - 2));
      g.forEach(l => { if (l.type !== 'water') l.items.push({ col: c, kind: 'coin', got: false }); });
    }
    // 水面平台上的金幣
    g.forEach(l => {
      if (l.type !== 'water') return;
      l.objs.forEach(o => { if (R() < .34 && !o.dive && !o.crack && !o.sink && !o.head) o.item = 'coin'; });
    });
  });
  // 安全帶金幣
  safeLanes.forEach(l => {
    const fc = freeCols(l);
    const n = Math.floor(R() * (2 + luck * .7));
    for (let i = 0; i < n && fc.length; i++) { const c = fc.splice(Math.floor(R() * fc.length), 1)[0]; l.items.push({ col: c, kind: 'coin', got: false }); }
  });
  // 補給箱
  const crateN = 2 + (d > .45 ? 1 : 0) + (luck >= 2 ? 1 : 0);
  const cands = safeLanes.filter(l => l.row > 4);
  for (let i = 0; i < crateN && cands.length; i++) {
    const slot = Math.floor((i + .5) * cands.length / crateN);
    const l = cands[Math.min(cands.length - 1, slot)];
    const fc = freeCols(l); if (!fc.length) continue;
    l.items.push({ col: fc[Math.floor(R() * fc.length)], kind: 'crate', got: false });
  }
  // 愛心
  const hearts = lvl.rows > 24 ? 2 : 1;
  for (let i = 0; i < hearts; i++) {
    const l = safeLanes[Math.floor(safeLanes.length * (.35 + i * .35))];
    if (l) { const fc = freeCols(l); if (fc.length) l.items.push({ col: fc[Math.floor(R() * fc.length)], kind: 'heart', got: false }); }
  }
  // 寶石
  const gemN = 1 + Math.floor(d * 2) + (luck >= 1 ? 1 : 0);
  for (let i = 0; i < gemN; i++) {
    const l = safeLanes[Math.floor(R() * safeLanes.length)];
    if (l) { const fc = freeCols(l); if (fc.length) l.items.push({ col: fc[Math.floor(R() * fc.length)], kind: 'gem', got: false }); }
  }
  // 終點前一排的獎勵
  const pre = lanes.find(l => l.prefinish);
  if (pre) { [3, 4, 5].forEach(c => { if (pre.blocks[c] === undefined) pre.items.push({ col: c, kind: 'coin', got: false }); }); }
}

/* ---------------------------------------------------------------- */
/* 魔王關：固定 13 排的競技場，頂端兩排是魔王 */
const ARENA = {
  toad: ['road', 'safe', 'water', 'water', 'safe', 'road', 'safe', 'road', 'safe'],
  robo: ['road', 'road', 'safe', 'rail', 'safe', 'road', 'safe', 'road', 'safe'],
  yeti: ['road', 'safe', 'water', 'safe', 'water', 'safe', 'road', 'safe', 'safe'],
  dragon: ['road', 'safe', 'water', 'water', 'safe', 'rail', 'safe', 'water', 'safe'],
  mother: ['road', 'safe', 'water', 'safe', 'road', 'safe', 'water', 'safe', 'safe'],
  cake: ['road', 'safe', 'water', 'safe', 'road', 'safe', 'water', 'road', 'safe'],
};
function buildBossArena(lvl, R) {
  const { world, def, wi } = lvl;
  const d = clamp(def.d - .22, .15, .7);
  const lanes = lvl.lanes;
  const add = (type, extra) => { const l = newLane(type, lanes.length, extra); l.seed = Math.floor(R() * 1e6); lanes.push(l); return l; };
  add('safe', { start: true, gpos: 0, gsize: 2, group: 0 });
  const pat = ARENA[world.boss];
  let gid = 1;
  pat.forEach((type, i) => {
    const l = add(type, { group: gid++, gpos: 0, gsize: 1 });
    l.dir = i % 2 ? 1 : -1;
    if (type === 'road') genRoad(R, l, world, d, pick2(R, world.road.slice(0, 3)), 0);
    else if (type === 'water') genWater(R, l, world, d, pick2(R, world.water.filter(k => !PLAT[k].head)), 0);
    else if (type === 'rail') genRail(R, l, d);
    else { l.gsize = 1; }
  });
  add('safe', { group: gid++, gpos: 0, gsize: 2, bossFront: true });
  add('bossfloor', { group: gid++, safe: false, blockAll: true });
  add('bossfloor', { group: gid++, safe: false, blockAll: true, top: true });
  lvl.rows = lanes.length; // 13
  // 草地上的裝飾障礙
  lanes.forEach(l => {
    if (l.type === 'safe' && !l.start && !l.bossFront) {
      const n = R() < .5 ? 1 : 2;
      for (let i = 0; i < n; i++) { const c = [0, 8, 2, 6][Math.floor(R() * 4)]; if (R() < .8) l.blocks[c] = pick2(R, world.props); }
    }
    if (l.start) { [0, 8].forEach(c => l.blocks[c] = pick2(R, world.props)); }
  });
  lvl.boss = { kind: world.boss, maxhp: 22 + wi * 7 };
}

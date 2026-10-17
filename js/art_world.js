'use strict';
/* =====================================================================
   場景美術：每個世界的地面（快取）、水面動畫、障礙物、天氣
   ===================================================================== */
const LaneArt = {
  cache: new Map(),
  get(lvl, lane) {
    const key = lvl.id + ':' + lane.row;
    let cv = this.cache.get(key);
    if (!cv) { cv = this.make(lvl, lane); this.cache.set(key, cv); }
    return cv;
  },
  clearCache() { this.cache.clear(); },
  make(lvl, lane) {
    const cv = document.createElement('canvas'); cv.width = W * 2; cv.height = TILE * 2;
    const g = cv.getContext('2d'); g.scale(2, 2);
    const R = mulberry32(lane.seed || lane.variant || 7);
    const wi = lvl.wi;
    const fn = { safe: 'safe', road: 'road', water: 'water', rail: 'rail', goal: 'safe', bossfloor: 'floor' }[lane.type] || 'safe';
    this[fn](g, lane, R, wi, lvl);
    if (lane.type === 'goal') this.goalStripe(g, lane, R, wi);
    return cv;
  },
  /* ---------- 小工具 ---------- */
  nb(lane) { return { b: lane.below ? lane.below.type : null, a: lane.above ? lane.above.type : null }; },
  speck(g, R, n, cols, rmin, rmax, y0 = 0, y1 = TILE) {
    for (let i = 0; i < n; i++) { g.fillStyle = cols[Math.floor(R() * cols.length)]; g.beginPath(); g.arc(R() * W, y0 + R() * (y1 - y0), rmin + R() * (rmax - rmin), 0, TAU); g.fill(); }
  },
  /* ---------- 安全地面 ---------- */
  safe(g, lane, R, wi, lvl) {
    const odd = lane.row % 2;
    const nb = this.nb(lane);
    const base = [
      [odd ? '#7bcb52' : '#70c149', '#8fdc66'], [odd ? '#9aa1b0' : '#8e95a5', '#b2b9c8'], [odd ? '#f4f9ff' : '#e8f2fc', '#ffffff'],
      [odd ? '#3b2b30' : '#33262b', '#4d3a40'], [odd ? '#2b3252' : '#262c4a', '#3b4470'], [odd ? '#ffd0ea' : '#ffc3e3', '#ffe4f3'],
    ][wi];
    g.fillStyle = vgrad(g, 0, TILE, [base[1], base[0]]); g.fillRect(0, 0, W, TILE);
    switch (wi) {
      case 0: { // 青草 花朵
        for (let i = 0; i < 46; i++) { const x = R() * W, y = 4 + R() * 44; g.strokeStyle = R() < .5 ? '#5aa83a' : '#8fe068'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(x - 2, y + 3); g.lineTo(x, y - 2); g.lineTo(x + 2, y + 3); g.stroke(); }
        const fc = ['#ffffff', '#ffe14a', '#ff8fc4', '#c9a0ff', '#ff7a5a'];
        for (let i = 0; i < 7; i++) { const x = R() * W, y = 8 + R() * 34, c = fc[Math.floor(R() * 5)]; for (let k = 0; k < 5; k++) { const a = k * TAU / 5; circ(g, x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6, 2, c); } circ(g, x, y, 1.6, '#f2a400'); }
        this.speck(g, R, 4, ['#a8a090', '#bdb6a6'], 1.5, 3);
        break;
      }
      case 1: { // 人行道磚
        g.strokeStyle = 'rgba(0,0,0,.14)'; g.lineWidth = 1;
        const off = (lane.row % 2) * 25;
        for (let x = -off; x < W; x += 50) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, TILE); g.stroke(); }
        g.beginPath(); g.moveTo(0, 25); g.lineTo(W, 25); g.stroke();
        for (let i = 0; i < 12; i++) { g.fillStyle = `rgba(255,255,255,${R() * .08})`; g.fillRect(Math.floor(R() * 9) * 50, R() < .5 ? 0 : 25, 50, 25); }
        if (R() < .4) { const x = 40 + R() * 370; circ(g, x, 25, 9, '#6c717e', '#4b505c', 1.5); g.strokeStyle = '#4b505c'; g.beginPath(); g.moveTo(x - 6, 25); g.lineTo(x + 6, 25); g.moveTo(x, 19); g.lineTo(x, 31); g.stroke(); }
        if (R() < .5) { g.globalAlpha = .45; ell(g, 60 + R() * 330, 28, 34, 7, R() < .5 ? '#6af0ff' : '#ff6adf'); g.globalAlpha = 1; }
        this.speck(g, R, 8, ['rgba(0,0,0,.18)', 'rgba(255,255,255,.2)'], 1, 2);
        break;
      }
      case 2: { // 雪地
        for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(190,215,240,.55)'; g.beginPath(); g.ellipse(R() * W, 12 + R() * 28, 30 + R() * 50, 5 + R() * 5, 0, 0, TAU); g.fill(); }
        for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.ellipse(R() * W, 6 + R() * 30, 24 + R() * 40, 4 + R() * 3, 0, 0, TAU); g.fill(); }
        for (let i = 0; i < 26; i++) { const x = R() * W, y = R() * TILE; g.fillStyle = '#fff'; g.fillRect(x, y, 1.6, 1.6); g.fillStyle = 'rgba(120,190,255,.6)'; g.fillRect(x + 6, y + 3, 1.4, 1.4); }
        if (R() < .5) { const x = 60 + R() * 330; for (let k = 0; k < 4; k++) { ell(g, x + k * 14, 24 + (k % 2) * 6, 3, 5, 'rgba(120,150,190,.35)'); } }
        break;
      }
      case 3: { // 火山岩 + 發光裂縫
        this.speck(g, R, 22, ['#241a1e', '#4a373d', '#2b1f24'], 2, 6);
        for (let i = 0; i < 3; i++) {
          let x = R() * W, y = R() * TILE; g.beginPath(); g.moveTo(x, y);
          for (let k = 0; k < 6; k++) { x += (R() - .35) * 32; y = clamp(y + (R() - .5) * 22, 2, 48); g.lineTo(x, y); }
          g.strokeStyle = 'rgba(255,90,20,.35)'; g.lineWidth = 5; g.stroke();
          g.strokeStyle = '#ff9a3a'; g.lineWidth = 1.6; g.stroke();
        }
        for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,${120 + R() * 100 | 0},40,${R() * .6})`; g.fillRect(R() * W, R() * TILE, 1.4, 1.4); }
        break;
      }
      case 4: { // 太空站甲板
        g.strokeStyle = 'rgba(120,160,255,.22)'; g.lineWidth = 1.2;
        for (let x = 0; x <= W; x += 50) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, TILE); g.stroke(); }
        g.beginPath(); g.moveTo(0, 25); g.lineTo(W, 25); g.stroke();
        for (let x = 6; x < W; x += 50) for (const y of [6, 44]) circ(g, x, y, 1.5, 'rgba(180,200,255,.5)');
        for (let i = 0; i < 4; i++) { const x = Math.floor(R() * 9) * 50 + 12; g.fillStyle = R() < .5 ? 'rgba(49,214,192,.8)' : 'rgba(255,200,60,.8)'; g.fillRect(x, 22, 26, 3); }
        break;
      }
      case 5: { // 糖霜 + 彩色糖粒
        g.fillStyle = 'rgba(255,255,255,.35)';
        for (let i = 0; i < 8; i++) { g.beginPath(); g.ellipse(R() * W, 6 + R() * 38, 18 + R() * 28, 4 + R() * 3, R(), 0, TAU); g.fill(); }
        const sc = ['#ff4b8b', '#4bd1ff', '#ffe14a', '#8bf05a', '#b07bff', '#ff9a3a'];
        for (let i = 0; i < 40; i++) { g.save(); g.translate(R() * W, 4 + R() * 42); g.rotate(R() * PI); g.fillStyle = sc[Math.floor(R() * 6)]; rr(g, -3, -1, 6, 2.4, 1.2); g.fill(); g.restore(); }
        break;
      }
    }
    // 與水接壤的岸邊
    if (nb.b === 'water') this.bank(g, wi, 'bottom', R);
    if (nb.a === 'water') this.bank(g, wi, 'top', R);
    // 與馬路接壤的路緣
    if (nb.b === 'road' || nb.b === 'rail') this.curb(g, wi, 'bottom');
    if (nb.a === 'road' || nb.a === 'rail') this.curb(g, wi, 'top');
  },
  bank(g, wi, side, R) {
    const cols = ['#8b6a3e', '#c9d8e8', '#4a3a3e', '#5b6aa0', '#c8864a', '#9b5a30'][wi];
    const top = side === 'top';
    g.save(); if (top) { g.translate(0, TILE); g.scale(1, -1); }
    // 此時視為底部邊緣：y 在 0 的反向
    g.fillStyle = cols; g.beginPath(); g.moveTo(0, TILE);
    for (let x = 0; x <= W; x += 10) g.lineTo(x, TILE - 6 - Math.sin(x * .2 + R() * 2) * 2.5 - R() * 2);
    g.lineTo(W, TILE); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, TILE - 2.5, W, 2.5);
    for (let i = 0; i < 14; i++) circ(g, R() * W, TILE - 3 - R() * 3, 1 + R() * 2, shade(cols, R() < .5 ? .25 : -.25));
    g.restore();
  },
  curb(g, wi, side) {
    const top = side === 'top', y = top ? 0 : TILE - 4;
    const c1 = ['#d9c9a0', '#e8e8f0', '#e6f2ff', '#5a4046', '#6f7cc0', '#fff'][wi];
    g.fillStyle = c1; g.fillRect(0, y, W, 4);
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, top ? 4 : y - 1, W, 1);
    if (wi === 1) { g.fillStyle = '#ffd23a'; for (let x = 0; x < W; x += 24) g.fillRect(x, y + 1, 12, 2); }
    if (wi === 4) { g.fillStyle = '#ffcf33'; for (let x = 0; x < W; x += 20) { g.beginPath(); g.moveTo(x, y + 4); g.lineTo(x + 8, y + 4); g.lineTo(x + 14, y); g.lineTo(x + 6, y); g.closePath(); g.fill(); } }
  },
  /* ---------- 馬路 ---------- */
  road(g, lane, R, wi, lvl) {
    const bases = ['#c9a36b', '#3d404d', '#cfdbe8', '#2c2226', '#161b34', '#6e3b22'];
    g.fillStyle = vgrad(g, 0, TILE, [shade(bases[wi], .08), bases[wi], shade(bases[wi], -.08)]); g.fillRect(0, 0, W, TILE);
    const first = lane.gpos === 0, last = lane.gpos === lane.gsize - 1;
    switch (wi) {
      case 0: // 泥土路：輪胎痕 + 石頭
        g.fillStyle = 'rgba(120,80,40,.28)'; g.fillRect(0, 12, W, 6); g.fillRect(0, 32, W, 6);
        this.speck(g, R, 26, ['#a88650', '#e0c08a', '#8d6d3e'], 1, 3);
        for (let i = 0; i < 6; i++) { g.strokeStyle = 'rgba(100,70,30,.25)'; g.lineWidth = 1; const x = R() * W; g.beginPath(); g.moveTo(x, 8); g.lineTo(x + 20, 42); g.stroke(); }
        break;
      case 1: { // 柏油 + 標線 + 斑馬線
        this.speck(g, R, 20, ['rgba(255,255,255,.07)', 'rgba(0,0,0,.18)'], 1, 4);
        if (R() < .35) { const cx = 60 + R() * 330; g.fillStyle = 'rgba(255,255,255,.88)'; for (let k = 0; k < 6; k++) g.fillRect(cx + k * 9, 0, 5.5, TILE); }
        if (!last) { g.fillStyle = '#ffd23a'; for (let x = 0; x < W; x += 36) g.fillRect(x + (lane.row % 2) * 12, TILE - 2.5, 20, 2.5); }
        if (first) { g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(0, 0, W, 2); }
        if (last) { g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(0, TILE - 2, W, 2); }
        if (R() < .5) { g.globalAlpha = .5; ell(g, 40 + R() * 370, 25 + (R() - .5) * 10, 26, 7, 'rgba(10,10,20,.8)'); g.globalAlpha = 1; }
        break;
      }
      case 2: // 雪道：雪橇痕
        g.fillStyle = 'rgba(120,150,190,.3)'; g.fillRect(0, 14, W, 4); g.fillRect(0, 32, W, 4);
        g.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(R() * W, 6 + R() * 38, 20 + R() * 30, 3, 0, 0, TAU); g.fill(); }
        this.speck(g, R, 24, ['#fff', '#b8d0ea'], 1, 2);
        if (R() < .5) { g.globalAlpha = .6; ell(g, 60 + R() * 330, 25, 40, 9, '#9fdcff'); g.globalAlpha = 1; }
        break;
      case 3: // 火山道路
        this.speck(g, R, 30, ['#4a3a40', '#1f171b', '#5a4046'], 1, 4);
        for (let i = 0; i < 2; i++) { let x = R() * W, y = 10 + R() * 30; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += 14 + R() * 14; y = clamp(y + (R() - .5) * 18, 4, 46); g.lineTo(x, y); } g.strokeStyle = '#ff7a2a'; g.lineWidth = 1.5; g.stroke(); }
        g.fillStyle = '#e0b84a'; for (let x = 0; x < W; x += 40) g.fillRect(x, 24, 20, 2);
        break;
      case 4: // 磁浮軌道
        g.strokeStyle = 'rgba(49,214,192,.9)'; g.lineWidth = 2; g.shadowColor = '#31d6c0'; g.shadowBlur = 6;
        g.setLineDash([22, 14]); g.beginPath(); g.moveTo(0, 25); g.lineTo(W, 25); g.stroke(); g.setLineDash([]); g.shadowBlur = 0;
        g.fillStyle = 'rgba(49,214,192,.35)'; for (let x = 20; x < W; x += 80) { g.beginPath(); g.moveTo(x, 14); g.lineTo(x + 12, 25); g.lineTo(x, 36); g.lineTo(x + 4, 25); g.closePath(); g.fill(); }
        if (first) { g.fillStyle = '#ffcf33'; for (let x = 0; x < W; x += 20) g.fillRect(x, 0, 10, 2); }
        break;
      case 5: // 巧克力路
        g.fillStyle = 'rgba(255,255,255,.1)'; for (let x = 0; x < W; x += 25) g.fillRect(x, 0, 1, TILE); g.fillRect(0, 25, W, 1);
        g.fillStyle = '#f7dca8'; for (let x = 0; x < W; x += 44) g.fillRect(x + (lane.row % 2) * 14, 24, 22, 3);
        { const sc = ['#ff4b8b', '#4bd1ff', '#ffe14a', '#8bf05a']; for (let i = 0; i < 24; i++) { g.save(); g.translate(R() * W, R() * TILE); g.rotate(R() * PI); g.fillStyle = sc[Math.floor(R() * 4)]; rr(g, -3, -1, 6, 2.2, 1); g.fill(); g.restore(); } }
        break;
    }
  },
  /* ---------- 水面 ---------- */
  water(g, lane, R, wi) {
    const pal = [['#4cbcf0', '#2a8cd0'], ['#1f7a70', '#0f4c4c'], ['#58b8ee', '#2b86cc'], ['#ff7a22', '#d4330e'], ['#070a2a', '#150a3e'], ['#7b4424', '#563019']][wi];
    g.fillStyle = vgrad(g, 0, TILE, [pal[0], pal[1]]); g.fillRect(0, 0, W, TILE);
    switch (wi) {
      case 0: g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1.4; for (let i = 0; i < 9; i++) { const x = R() * W, y = 6 + R() * 38; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 10, y - 3, x + 20, y); g.stroke(); } break;
      case 1: for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(80,230,140,.28)'; g.beginPath(); g.ellipse(R() * W, 8 + R() * 34, 20 + R() * 30, 4 + R() * 4, 0, 0, TAU); g.fill(); } g.fillStyle = 'rgba(255,90,220,.18)'; g.fillRect(R() * 300, 10, 80, 3); g.fillStyle = 'rgba(80,240,255,.2)'; g.fillRect(R() * 300 + 60, 30, 100, 3); break;
      case 2: g.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(R() * W, R() * TILE, 10 + R() * 18, 3 + R() * 3, 0, 0, TAU); g.fill(); } g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1; for (let i = 0; i < 6; i++) { const x = R() * W; g.beginPath(); g.moveTo(x, 2); g.lineTo(x + 8, 14); g.lineTo(x + 2, 24); g.stroke(); } break;
      case 3: for (let i = 0; i < 7; i++) { g.fillStyle = 'rgba(70,20,10,.55)'; g.beginPath(); g.ellipse(R() * W, 8 + R() * 34, 18 + R() * 30, 5 + R() * 5, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,200,60,.8)'; g.lineWidth = 1.5; g.stroke(); } g.fillStyle = 'rgba(255,230,120,.35)'; for (let i = 0; i < 8; i++) g.fillRect(R() * W, R() * TILE, 18, 2); break;
      case 4: for (let i = 0; i < 40; i++) { const x = R() * W, y = R() * TILE, r = R() * 1.3 + .3; g.fillStyle = `rgba(255,255,255,${.3 + R() * .6})`; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } g.fillStyle = radial(g, R() * W, 25, 0, 90, ['rgba(120,60,220,.35)', 'rgba(120,60,220,0)']); g.fillRect(0, 0, W, TILE); break;
      case 5: g.strokeStyle = 'rgba(255,220,170,.25)'; g.lineWidth = 3; for (let i = 0; i < 5; i++) { const x = R() * W, y = 8 + R() * 34; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 20, y - 10, x + 40, y + 10, x + 60, y); g.stroke(); } g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(R() * W, 25, 30, 3, 0, 0, TAU); g.fill(); break;
    }
    g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, 0, W, 3); g.fillRect(0, TILE - 3, W, 3);
  },
  /* 水面動畫（每幀畫在 base 上面）。y = 這條路的上緣螢幕座標，off = 水流位移 */
  waterFX(c, lane, wi, y, t) {
    c.save(); c.beginPath(); c.rect(0, y, W, TILE); c.clip();
    const sp = lane.dir * 14;
    if (wi === 0 || wi === 1 || wi === 2 || wi === 5) {
      const col = wi === 5 ? 'rgba(255,230,190,.28)' : wi === 1 ? 'rgba(160,255,210,.22)' : 'rgba(255,255,255,.3)';
      c.strokeStyle = col; c.lineWidth = 1.6;
      for (let i = 0; i < 7; i++) {
        const x = ((i * 79 + lane.row * 37 + t * sp) % (W + 60) + W + 60) % (W + 60) - 30, yy = y + 8 + ((i * 53 + lane.row * 11) % 34);
        c.beginPath(); c.moveTo(x - 12, yy); c.quadraticCurveTo(x - 6, yy - 3 + Math.sin(t * 2 + i) * 1.5, x, yy); c.quadraticCurveTo(x + 6, yy + 3, x + 12, yy); c.stroke();
      }
      if (wi === 2) { c.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 6; i++) { const x = (i * 83 + lane.row * 29) % W, yy = y + (i * 37) % 46; const tw = (Math.sin(t * 3 + i * 2) + 1) / 2; c.globalAlpha = tw * .8; Icons.sparkle(c, x, yy, 3); } c.globalAlpha = 1; }
      if (wi === 1) { c.globalAlpha = .35 + Math.sin(t * 5 + lane.row) * .1; c.fillStyle = lane.row % 2 ? '#ff6adf' : '#6af0ff'; c.fillRect(((t * 20 * lane.dir + lane.row * 90) % W + W) % W, y + 20, 70, 2); c.globalAlpha = 1; }
    } else if (wi === 3) { // 熔岩：冒泡
      for (let i = 0; i < 5; i++) {
        const ph = (t * .6 + i * .37 + lane.row * .13) % 1, x = (i * 97 + lane.row * 41) % W, yy = y + 12 + (i * 29) % 26;
        const r = 2 + ph * 6; c.globalAlpha = 1 - ph; c.fillStyle = '#ffd27a'; c.beginPath(); c.arc(x, yy, r, 0, TAU); c.fill(); c.strokeStyle = '#ff5a14'; c.lineWidth = 1.5; c.stroke();
      }
      c.globalAlpha = .2 + Math.sin(t * 3 + lane.row) * .08; c.fillStyle = '#ffe9a0'; c.fillRect(0, y, W, TILE); c.globalAlpha = 1;
    } else if (wi === 4) { // 虛空：星星閃爍 + 流星
      for (let i = 0; i < 10; i++) {
        const x = (i * 71 + lane.row * 53) % W, yy = y + (i * 41) % 48, tw = (Math.sin(t * 2.4 + i * 1.7 + lane.row) + 1) / 2;
        c.globalAlpha = .3 + tw * .7; c.fillStyle = '#fff'; c.fillRect(x, yy, 1.8, 1.8);
      }
      c.globalAlpha = 1;
    }
    c.restore();
  },
  /* ---------- 軌道 ---------- */
  rail(g, lane, R, wi) {
    const bed = ['#8a7a66', '#5a5560', '#9fb4c8', '#3a2c30', '#202747', '#8a5a40'][wi];
    g.fillStyle = vgrad(g, 0, TILE, [shade(bed, .1), bed]); g.fillRect(0, 0, W, TILE);
    this.speck(g, R, 40, [shade(bed, .25), shade(bed, -.25)], .8, 2);
    g.fillStyle = wi === 4 ? '#1b2a52' : '#6b4a2a';
    for (let x = 4; x < W; x += 18) g.fillRect(x, 4, 8, 42);
    for (const y of [14, 34]) {
      g.fillStyle = wi === 4 ? '#31d6c0' : '#c9d3dc'; g.fillRect(0, y - 1.6, W, 3.2);
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, y + 1.6, W, 1.2);
      if (wi === 4) { g.shadowColor = '#31d6c0'; g.shadowBlur = 8; g.fillRect(0, y - 1, W, 2); g.shadowBlur = 0; }
    }
  },
  /* ---------- 終點花邊 ---------- */
  goalStripe(g, lane, R, wi) {
    for (let x = 0; x < W; x += 10) { g.fillStyle = (x / 10) % 2 ? '#fff' : '#222'; g.fillRect(x, 0, 10, 5); g.fillStyle = (x / 10) % 2 ? '#222' : '#fff'; g.fillRect(x, 5, 10, 5); }
    g.fillStyle = 'rgba(255,230,120,.22)'; g.fillRect(0, 10, W, TILE - 10);
  },
  /* ---------- 魔王地板 ---------- */
  floor(g, lane, R, wi) {
    const c1 = ['#2d4a1e', '#26263a', '#7aa6c8', '#3a1a1a', '#1a1f40', '#8a4a5a'][wi];
    g.fillStyle = vgrad(g, 0, TILE, [shade(c1, .15), c1]); g.fillRect(0, 0, W, TILE);
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1.5;
    for (let x = 0; x < W; x += 50) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, TILE); g.stroke(); }
    g.beginPath(); g.moveTo(0, 25); g.lineTo(W, 25); g.stroke();
  },
};

/* =====================================================================
   障礙物（會擋路的道具）。cx, cy = 格子中心。往上延伸，所以要由上往下畫。
   ===================================================================== */
const Props = {
  draw(c, kind, cx, cy, t, v = .5, wi = 0) {
    c.save(); c.translate(cx, cy);
    shadowEll(c, 0, 14, 19, 7, .26);
    const f = this[kind]; if (f) f.call(this, c, t, v); else { rr(c, -14, -14, 28, 28, 6); c.fillStyle = '#999'; c.fill(); }
    c.restore();
  },
  /* 池塘 */
  tree(c, t, v) {
    const sw = Math.sin(t * 1.3 + v * 9) * 1.5;
    rr(c, -5, -4, 10, 22, 3); c.fillStyle = grad(c, -5, 0, 5, 0, ['#8a5a30', '#6b4220']); c.fill(); c.strokeStyle = '#3d2410'; c.lineWidth = 1.6; c.stroke();
    const cols = ['#58b83a', '#47a02e', '#6ecb48'];
    circ(c, -11 + sw, -14, 15, cols[1], '#2a6a1c', 1.8); circ(c, 12 + sw, -13, 14, cols[1], '#2a6a1c', 1.8);
    circ(c, 0 + sw, -27, 17, cols[0], '#2a6a1c', 1.8); circ(c, 0 + sw, -12, 17, cols[0], null);
    circ(c, -5 + sw, -32, 7, cols[2]); circ(c, 8 + sw, -20, 4, '#ff5a5a', '#9a1c1c', 1); circ(c, -10 + sw, -10, 3.5, '#ff5a5a', '#9a1c1c', 1);
  },
  bush(c, t, v) {
    for (const [x, y, r] of [[-11, -2, 11], [11, -2, 11], [0, -8, 13]]) circ(c, x, y, r, '#4fb03a', '#26661a', 1.8);
    for (const [x, y, r] of [[-5, -13, 5], [9, -9, 4]]) circ(c, x, y, r, '#78d85a');
    circ(c, -10, 2, 2.2, '#ff4b6e'); circ(c, 8, 0, 2.2, '#ff4b6e'); circ(c, 0, -4, 2.2, '#ff4b6e');
  },
  rock(c, t, v) {
    c.beginPath(); c.moveTo(-17, 12); c.quadraticCurveTo(-20, -8, -6, -14); c.quadraticCurveTo(10, -18, 17, -2); c.quadraticCurveTo(21, 8, 15, 14); c.closePath();
    c.fillStyle = grad(c, -15, -15, 15, 15, ['#c4c9cf', '#8a9098']); c.fill(); c.strokeStyle = '#4b5057'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#6fae4c'; c.beginPath(); c.ellipse(-4, -12, 9, 3.5, -.2, 0, TAU); c.fill(); ell(c, -6, -4, 4, 2, 'rgba(255,255,255,.4)');
  },
  stump(c, t, v) {
    rr(c, -13, -6, 26, 22, 5); c.fillStyle = grad(c, -13, 0, 13, 0, ['#9a6a3a', '#6e4624']); c.fill(); c.strokeStyle = '#3d2410'; c.lineWidth = 1.8; c.stroke();
    ell(c, 0, -6, 13, 6, '#d9a870', '#3d2410', 1.8); ell(c, 0, -6, 8, 3.5, null, '#a8763e', 1.2); ell(c, 0, -6, 3.5, 1.7, null, '#a8763e', 1.2);
    circ(c, 9, -13, 3.5, '#ff5a5a', '#9a1c1c', 1); circ(c, 9, -12, 1, '#fff');
  },
  mushroom(c, t, v) {
    rr(c, -5, -4, 10, 18, 4); c.fillStyle = '#fff3d6'; c.fill(); c.strokeStyle = '#a89674'; c.lineWidth = 1.5; c.stroke();
    c.beginPath(); c.ellipse(0, -8, 19, 14, 0, PI, TAU); c.lineTo(19, -6); c.quadraticCurveTo(0, 0, -19, -6); c.closePath(); c.fillStyle = grad(c, 0, -22, 0, -4, ['#ff6a5a', '#d62f2f']); c.fill(); c.strokeStyle = '#7a1414'; c.lineWidth = 1.8; c.stroke();
    circ(c, -8, -14, 3.2, '#fff'); circ(c, 6, -17, 3.6, '#fff'); circ(c, 10, -9, 2.4, '#fff'); circ(c, -1, -9, 2.2, '#fff');
  },
  /* 都市 */
  lamp(c, t, v) {
    c.globalAlpha = .45 + Math.sin(t * 3 + v * 8) * .05; circ(c, 0, -36, 30, radial(c, 0, -36, 0, 30, ['rgba(255,230,140,.9)', 'rgba(255,230,140,0)'])); c.globalAlpha = 1;
    rr(c, -2.5, -34, 5, 48, 2); c.fillStyle = '#4a5160'; c.fill(); rr(c, -7, 8, 14, 8, 3); c.fill();
    rr(c, -8, -42, 16, 10, 5); c.fillStyle = '#ffe9a0'; c.fill(); c.strokeStyle = '#3b414d'; c.lineWidth = 2; c.stroke();
  },
  trash(c, t, v) {
    c.beginPath(); c.moveTo(-11, -6); c.lineTo(11, -6); c.lineTo(9, 14); c.lineTo(-9, 14); c.closePath(); c.fillStyle = grad(c, -11, 0, 11, 0, ['#4f9a68', '#337a4c']); c.fill(); c.strokeStyle = '#1d4a2c'; c.lineWidth = 1.8; c.stroke();
    rr(c, -13, -11, 26, 6, 3); c.fillStyle = '#5db077'; c.fill(); c.stroke(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.moveTo(-4, -3); c.lineTo(-3, 12); c.moveTo(4, -3); c.lineTo(3, 12); c.stroke();
    circ(c, 6, -15, 3, '#e8e0cc'); circ(c, -4, -14, 2.4, '#ff7a7a');
  },
  hydrant(c, t, v) {
    rr(c, -8, -10, 16, 24, 5); c.fillStyle = grad(c, -8, 0, 8, 0, ['#ff5a4a', '#c22a1c']); c.fill(); c.strokeStyle = '#6e1409'; c.lineWidth = 1.8; c.stroke();
    c.beginPath(); c.arc(0, -10, 8, PI, TAU); c.fillStyle = '#e8352b'; c.fill(); c.stroke(); circ(c, 0, -19, 2.5, '#e8352b', '#6e1409', 1.4);
    rr(c, -13, -3, 26, 7, 3); c.fillStyle = '#e8352b'; c.fill(); c.stroke(); circ(c, -14, 0, 3, '#ffd23a', '#6e1409', 1.2); circ(c, 14, 0, 3, '#ffd23a', '#6e1409', 1.2);
  },
  bench(c, t, v) {
    rr(c, -19, -10, 38, 8, 3); c.fillStyle = '#b3733a'; c.fill(); c.strokeStyle = '#4a2a10'; c.lineWidth = 1.6; c.stroke();
    rr(c, -19, -1, 38, 8, 3); c.fill(); c.stroke(); c.fillStyle = '#3b414d'; c.fillRect(-16, 7, 4, 8); c.fillRect(12, 7, 4, 8);
  },
  planter(c, t, v) {
    rr(c, -15, 2, 30, 14, 3); c.fillStyle = '#9a6a4a'; c.fill(); c.strokeStyle = '#4a2a18'; c.lineWidth = 1.8; c.stroke();
    circ(c, -7, -6, 10, '#49ab52', '#24662c', 1.6); circ(c, 8, -4, 9, '#49ab52', '#24662c', 1.6); circ(c, 0, -12, 10, '#62c76a', '#24662c', 1.6);
    circ(c, -3, -14, 2.4, '#ff6adf'); circ(c, 9, -7, 2.2, '#ffe14a');
  },
  /* 冰雪 */
  pine(c, t, v) {
    rr(c, -4, 6, 8, 12, 2); c.fillStyle = '#6b4220'; c.fill();
    for (let i = 0; i < 3; i++) {
      const y = 4 - i * 14, w = 19 - i * 4;
      poly(c, [-w, y, 0, y - 22, w, y], grad(c, 0, y - 22, 0, y, ['#3f9a58', '#256a3a']), '#14412a', 1.8);
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-w * .75, y - 5); c.quadraticCurveTo(-w * .3, y - 12, 0, y - 20); c.quadraticCurveTo(w * .3, y - 12, w * .75, y - 5); c.quadraticCurveTo(w * .3, y - 8, 0, y - 6); c.quadraticCurveTo(-w * .3, y - 8, -w * .75, y - 5); c.fill();
    }
  },
  igloo(c, t, v) {
    c.beginPath(); c.moveTo(-21, 14); c.arc(0, 14, 21, PI, TAU); c.closePath(); c.fillStyle = grad(c, 0, -8, 0, 14, ['#ffffff', '#d4e6f6']); c.fill(); c.strokeStyle = '#7a9cc0'; c.lineWidth = 2; c.stroke();
    c.save(); c.clip(); c.strokeStyle = 'rgba(120,160,200,.7)'; c.lineWidth = 1.2; for (let y = 10; y > -8; y -= 8) { c.beginPath(); c.moveTo(-22, y); c.lineTo(22, y); c.stroke(); } for (let x = -16; x <= 16; x += 10) { c.beginPath(); c.moveTo(x, 14); c.lineTo(x, -8); c.stroke(); } c.restore();
    c.beginPath(); c.arc(0, 14, 8, PI, TAU); c.fillStyle = '#35516e'; c.fill(); c.stroke();
  },
  snowman(c, t, v) {
    circ(c, 0, 5, 12, '#fff', '#8fb0d0', 1.8); circ(c, 0, -10, 9, '#fff', '#8fb0d0', 1.8);
    circ(c, -3, -12, 1.3, '#222'); circ(c, 3, -12, 1.3, '#222'); poly(c, [0, -10, 9, -8, 0, -7], '#ff8a2a', '#a8480a', 1);
    circ(c, 0, 3, 1.5, '#333'); circ(c, 0, 9, 1.5, '#333'); c.fillStyle = '#e8352b'; c.fillRect(-9, -3, 18, 3.5);
    rr(c, -7, -26, 14, 8, 2); c.fillStyle = '#2b2f3a'; c.fill(); c.fillRect(-10, -19, 20, 3);
  },
  crystal(c, t, v) {
    const g = .7 + Math.sin(t * 2.5 + v * 7) * .15;
    for (const [x, h, w, a] of [[-9, 22, 8, -.2], [9, 18, 7, .22], [0, 32, 10, 0]]) {
      c.save(); c.translate(x, 14); c.rotate(a);
      poly(c, [-w / 2, 0, -w / 2 + 1, -h * .75, 0, -h, w / 2 - 1, -h * .75, w / 2, 0], grad(c, -w, 0, w, -h, ['#7fd8ff', '#e8fbff', '#58b0f0']), '#2b78a3', 1.6);
      c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(-w / 4, -h * .7, 2, h * .45); c.restore();
    }
    c.globalAlpha = g * .3; circ(c, 0, -6, 28, radial(c, 0, -6, 0, 28, ['rgba(160,230,255,.9)', 'rgba(160,230,255,0)'])); c.globalAlpha = 1;
  },
  iceRock(c, t, v) {
    c.beginPath(); c.moveTo(-17, 13); c.quadraticCurveTo(-18, -6, -4, -13); c.quadraticCurveTo(10, -14, 17, 0); c.quadraticCurveTo(20, 8, 15, 13); c.closePath();
    c.fillStyle = grad(c, -15, -13, 15, 15, ['#a4b4c6', '#6d7f94']); c.fill(); c.strokeStyle = '#3d4b5c'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-13, -4); c.quadraticCurveTo(-4, -16, 8, -11); c.quadraticCurveTo(14, -8, 14, -2); c.quadraticCurveTo(4, -6, -3, -2); c.quadraticCurveTo(-8, 2, -13, -4); c.fill();
  },
  /* 火山 */
  spike(c, t, v) {
    const g = .6 + Math.sin(t * 3 + v * 6) * .2;
    for (const [x, h, w] of [[-11, 20, 9], [10, 16, 8], [0, 32, 12]]) {
      poly(c, [x - w, 14, x - 1, 14 - h, x + w, 14], grad(c, x - w, 14, x + w, 14 - h, ['#1f1418', '#4a3238']), '#0e080a', 1.6);
      c.strokeStyle = `rgba(255,120,40,${g})`; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x - 2, 12); c.lineTo(x, 14 - h * .6); c.stroke();
    }
  },
  deadtree(c, t, v) {
    c.strokeStyle = '#2b1f1a'; c.lineCap = 'round'; c.lineWidth = 7; c.beginPath(); c.moveTo(0, 16); c.quadraticCurveTo(-4, -4, 2, -18); c.stroke();
    c.lineWidth = 4; c.beginPath(); c.moveTo(0, -2); c.lineTo(-14, -14); c.moveTo(1, -10); c.lineTo(14, -22); c.moveTo(-1, 2); c.lineTo(12, -5); c.stroke();
    c.lineWidth = 2; c.beginPath(); c.moveTo(-14, -14); c.lineTo(-19, -22); c.moveTo(14, -22); c.lineTo(16, -30); c.stroke();
    c.strokeStyle = 'rgba(255,100,30,.7)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, 14); c.quadraticCurveTo(-3, -2, 1, -14); c.stroke();
  },
  redcrystal(c, t, v) {
    const g = .6 + Math.sin(t * 2.2 + v * 7) * .2;
    c.globalAlpha = g * .5; circ(c, 0, -4, 28, radial(c, 0, -4, 0, 28, ['rgba(255,80,60,.9)', 'rgba(255,80,60,0)'])); c.globalAlpha = 1;
    for (const [x, h, w, a] of [[-8, 20, 8, -.22], [9, 16, 7, .25], [0, 30, 10, 0]]) {
      c.save(); c.translate(x, 14); c.rotate(a); poly(c, [-w / 2, 0, -w / 2 + 1, -h * .75, 0, -h, w / 2 - 1, -h * .75, w / 2, 0], grad(c, -w, 0, w, -h, ['#ff6a5a', '#ffd0c0', '#c4281c']), '#6e1409', 1.6); c.restore();
    }
  },
  bones(c, t, v) {
    ell(c, 0, -4, 13, 11, '#f1ecdc', '#5b5546', 1.8); rr(c, -8, 4, 16, 8, 3); c.fillStyle = '#f1ecdc'; c.fill(); c.stroke();
    ell(c, -5, -4, 3.6, 4.2, '#2a2420'); ell(c, 5, -4, 3.6, 4.2, '#2a2420'); poly(c, [0, 0, -2, 4, 2, 4], '#2a2420');
    c.strokeStyle = '#5b5546'; c.lineWidth = 1.2; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 4, 6); c.lineTo(i * 4, 11); c.stroke(); }
    c.strokeStyle = '#f1ecdc'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-17, 14); c.lineTo(17, 10); c.stroke();
  },
  torch(c, t, v) {
    rr(c, -2.5, -4, 5, 20, 2); c.fillStyle = '#6b4a2a'; c.fill();
    poly(c, [-9, -6, 9, -6, 6, -14, -6, -14], '#4a4a54', '#22222a', 1.6);
    c.globalAlpha = .45; circ(c, 0, -26, 30, radial(c, 0, -26, 0, 30, ['rgba(255,170,60,.95)', 'rgba(255,170,60,0)'])); c.globalAlpha = 1;
    Icons.flame(c, 0, -23 + Math.sin(t * 12 + v * 5) * 1, 24);
  },
  /* 太空 */
  antenna(c, t, v) {
    rr(c, -9, 6, 18, 10, 3); c.fillStyle = '#7a86a8'; c.fill(); c.strokeStyle = '#2e3552'; c.lineWidth = 1.8; c.stroke();
    c.strokeStyle = '#8f9bbd'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 6); c.lineTo(0, -12); c.stroke();
    c.save(); c.translate(0, -12); c.rotate(-.5 + Math.sin(t * .8 + v * 5) * .25);
    c.beginPath(); c.ellipse(0, 0, 17, 8, 0, 0, PI); c.fillStyle = grad(c, 0, 0, 0, 8, ['#e8eefc', '#9aa8cc']); c.fill(); c.stroke();
    c.strokeStyle = '#8f9bbd'; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -12); c.stroke(); circ(c, 0, -13, 2.6, '#ff4b4b'); c.restore();
  },
  crate(c, t, v) {
    rr(c, -15, -14, 30, 30, 4); c.fillStyle = grad(c, -15, -14, 15, 16, ['#8f9bbd', '#5d6a90']); c.fill(); c.strokeStyle = '#2e3552'; c.lineWidth = 2; c.stroke();
    c.strokeStyle = '#2e3552'; c.beginPath(); c.moveTo(-15, -14); c.lineTo(15, 16); c.moveTo(15, -14); c.lineTo(-15, 16); c.stroke();
    c.fillStyle = '#ffcf33'; c.fillRect(-15, -4, 30, 8); c.fillStyle = '#222'; for (let x = -15; x < 15; x += 8) { c.beginPath(); c.moveTo(x, 4); c.lineTo(x + 4, -4); c.lineTo(x + 8, -4); c.lineTo(x + 4, 4); c.fill(); }
  },
  reactor(c, t, v) {
    rr(c, -12, -10, 24, 26, 5); c.fillStyle = grad(c, -12, 0, 12, 0, ['#8f9bbd', '#4d5a80']); c.fill(); c.strokeStyle = '#2e3552'; c.lineWidth = 2; c.stroke();
    const g = .6 + Math.sin(t * 4 + v * 5) * .3; c.globalAlpha = g; circ(c, 0, -22, 24, radial(c, 0, -22, 0, 24, ['rgba(49,214,192,.95)', 'rgba(49,214,192,0)'])); c.globalAlpha = 1;
    rr(c, -9, -30, 18, 22, 8); c.fillStyle = '#baf5ec'; c.fill(); c.strokeStyle = '#1d7a6c'; c.stroke(); rr(c, -5, -26 + (1 - g) * 6, 10, 14 - (1 - g) * 6, 4); c.fillStyle = '#31d6c0'; c.fill();
  },
  dome(c, t, v) {
    c.beginPath(); c.moveTo(-19, 14); c.arc(0, 14, 19, PI, TAU); c.closePath(); c.fillStyle = 'rgba(160,220,255,.45)'; c.fill(); c.strokeStyle = '#dff3ff'; c.lineWidth = 2.2; c.stroke();
    rr(c, -19, 11, 38, 5, 2); c.fillStyle = '#7a86a8'; c.fill(); circ(c, -5, 0, 3, '#49c56a'); circ(c, 6, 4, 2.4, '#49c56a'); rr(c, -1, 2, 2, 9, 1); c.fillStyle = '#49c56a'; c.fill();
    ell(c, -8, -4, 4, 8, 'rgba(255,255,255,.4)');
  },
  panel(c, t, v) {
    rr(c, -2, -2, 4, 18, 1); c.fillStyle = '#8f9bbd'; c.fill();
    c.save(); c.transform(1, 0, -.35, 1, 0, 0); rr(c, -19, -26, 38, 26, 3); c.fillStyle = grad(c, 0, -26, 0, 0, ['#3a6ee0', '#1c3a8a']); c.fill(); c.strokeStyle = '#cfe0ff'; c.lineWidth = 1.6; c.stroke();
    c.strokeStyle = 'rgba(200,225,255,.6)'; c.lineWidth = 1; for (let x = -19; x <= 19; x += 9.5) { c.beginPath(); c.moveTo(x, -26); c.lineTo(x, 0); c.stroke(); } c.beginPath(); c.moveTo(-19, -13); c.lineTo(19, -13); c.stroke(); c.restore();
  },
  /* 糖果 */
  lolly(c, t, v) {
    rr(c, -2.5, -2, 5, 20, 2); c.fillStyle = '#f2f2f2'; c.fill(); c.strokeStyle = '#a8a8a8'; c.lineWidth = 1.2; c.stroke();
    circ(c, 0, -17, 15, '#ff5fa8', '#a8266a', 2);
    c.save(); c.beginPath(); c.arc(0, -17, 14, 0, TAU); c.clip(); c.strokeStyle = '#fff'; c.lineWidth = 3.4; c.beginPath(); for (let a = 0; a < 14; a += .4) { const r = a * 1.05; c.lineTo(Math.cos(a) * r, -17 + Math.sin(a) * r); } c.stroke(); c.restore();
    ell(c, -5, -23, 4, 2.4, 'rgba(255,255,255,.7)');
  },
  cane(c, t, v) {
    c.lineCap = 'round'; c.lineWidth = 8; c.strokeStyle = '#a8264a'; c.beginPath(); c.moveTo(-6, 16); c.lineTo(-6, -14); c.arc(2, -14, 8, PI, 0); c.stroke();
    c.lineWidth = 5.5; c.strokeStyle = '#fff'; c.beginPath(); c.moveTo(-6, 16); c.lineTo(-6, -14); c.arc(2, -14, 8, PI, 0); c.stroke();
    c.strokeStyle = '#ff3b5c'; c.lineWidth = 5.5; c.setLineDash([5, 6]); c.beginPath(); c.moveTo(-6, 16); c.lineTo(-6, -14); c.arc(2, -14, 8, PI, 0); c.stroke(); c.setLineDash([]);
  },
  cupcake(c, t, v) {
    c.beginPath(); c.moveTo(-14, -2); c.lineTo(-10, 16); c.lineTo(10, 16); c.lineTo(14, -2); c.closePath(); c.fillStyle = grad(c, -14, 0, 14, 0, ['#ffd27a', '#e8a23a']); c.fill(); c.strokeStyle = '#8a5a14'; c.lineWidth = 1.8; c.stroke();
    c.strokeStyle = 'rgba(138,90,20,.5)'; c.lineWidth = 1.2; for (let x = -8; x <= 8; x += 4) { c.beginPath(); c.moveTo(x * 1.2, -1); c.lineTo(x, 15); c.stroke(); }
    circ(c, -8, -8, 9, '#ff8fc4', '#a8266a', 1.6); circ(c, 8, -8, 9, '#ff8fc4', '#a8266a', 1.6); circ(c, 0, -14, 10, '#ffb3dd', '#a8266a', 1.6); circ(c, 0, -23, 3.6, '#e8352b', '#7c140c', 1.2);
  },
  gumdrop(c, t, v) {
    const cols = ['#ff4b6e', '#4bd1ff', '#8bf05a', '#ffd23a'], col = cols[Math.floor(v * 4) % 4];
    c.beginPath(); c.moveTo(-15, 14); c.quadraticCurveTo(-16, -12, 0, -14); c.quadraticCurveTo(16, -12, 15, 14); c.closePath(); c.fillStyle = grad(c, -15, -14, 15, 14, [shade(col, .4), col, shade(col, -.2)]); c.fill(); c.strokeStyle = shade(col, -.5); c.lineWidth = 1.8; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 12; i++) { c.fillRect(-12 + (i % 4) * 7, -8 + Math.floor(i / 4) * 7, 2, 2); } ell(c, -6, -7, 3.4, 2, 'rgba(255,255,255,.85)');
  },
  cookie(c, t, v) {
    circ(c, 0, 0, 16, grad(c, -14, -14, 14, 14, ['#e8b878', '#b97a3a']), '#6e4010', 2);
    for (const [x, y] of [[-6, -6], [6, -3], [-2, 6], [8, 8], [-9, 4]]) { circ(c, x, y, 2.8, '#4a2410'); }
    ell(c, -6, -10, 6, 2.4, 'rgba(255,255,255,.4)');
  },
};

/* =====================================================================
   天氣 / 空氣粒子（螢幕座標）
   ===================================================================== */
const Weather = {
  parts: [], kind: '', x1: W, y0: 0, y1: 650,
  /* 範圍預設是場地；封面等畫面可以傳入自己的範圍 (寬, 上, 下) */
  init(kind, x1 = W, y0 = FIELD_TOP, y1 = FIELD_BOTTOM) {
    this.kind = kind; this.parts = []; this.x1 = x1; this.y0 = y0; this.y1 = y1;
    const n = { pollen: 30, rain: 90, snow: 80, embers: 50, stars: 30, sprinkles: 46 }[kind] || 0;
    for (let i = 0; i < n; i++) this.parts.push({ x: rand(0, x1), y: rand(y0, y1), p: rand(0, 9), s: rand(.6, 1.4), c: i });
  },
  update(dt, scrollDy = 0) {
    for (const p of this.parts) {
      switch (this.kind) {
        case 'pollen': p.x += Math.sin(p.p + performance.now() / 1200) * 10 * dt + 8 * dt; p.y -= 6 * p.s * dt; break;
        case 'rain': p.x -= 90 * dt; p.y += 620 * p.s * dt; break;
        case 'snow': p.x += Math.sin(p.p + performance.now() / 900) * 26 * dt; p.y += 46 * p.s * dt; break;
        case 'embers': p.x += Math.sin(p.p + performance.now() / 700) * 22 * dt; p.y -= 48 * p.s * dt; break;
        case 'stars': p.x -= 14 * p.s * dt; break;
        case 'sprinkles': p.x += Math.sin(p.p + performance.now() / 800) * 12 * dt; p.y += 38 * p.s * dt; p.p += dt; break;
      }
      p.y += scrollDy;
      if (p.y > this.y1 + 10) { p.y = this.y0 - 10; p.x = rand(0, this.x1); }
      if (p.y < this.y0 - 14) { p.y = this.y1 + 8; p.x = rand(0, this.x1); }
      if (p.x < -10) p.x = this.x1 + 8; if (p.x > this.x1 + 10) p.x = -8;
    }
  },
  draw(c, t) {
    c.save(); c.beginPath(); c.rect(0, this.y0, this.x1, this.y1 - this.y0); c.clip();
    switch (this.kind) {
      case 'pollen': for (const p of this.parts) { c.globalAlpha = .5 + Math.sin(t * 2 + p.p) * .3; circ(c, p.x, p.y, 2 * p.s, '#fff7b0'); } break;
      case 'rain': c.strokeStyle = 'rgba(190,220,255,.5)'; c.lineWidth = 1.2; c.beginPath(); for (const p of this.parts) { c.moveTo(p.x, p.y); c.lineTo(p.x + 4, p.y - 14); } c.stroke(); break;
      case 'snow': c.fillStyle = '#fff'; for (const p of this.parts) { c.globalAlpha = .55 + p.s * .3; c.beginPath(); c.arc(p.x, p.y, 1.6 * p.s + .6, 0, TAU); c.fill(); } break;
      case 'embers': for (const p of this.parts) { c.globalAlpha = .4 + Math.sin(t * 6 + p.p) * .3; c.fillStyle = p.c % 3 ? '#ff9a3a' : '#ffd27a'; c.fillRect(p.x, p.y, 2.4 * p.s, 2.4 * p.s); } break;
      case 'stars': for (const p of this.parts) { c.globalAlpha = .3 + (Math.sin(t * 3 + p.p) + 1) * .25; c.fillStyle = '#fff'; c.fillRect(p.x, p.y, 1.8, 1.8); } break;
      case 'sprinkles': { const sc = ['#ff4b8b', '#4bd1ff', '#ffe14a', '#8bf05a', '#b07bff']; for (const p of this.parts) { c.save(); c.translate(p.x, p.y); c.rotate(p.p); c.fillStyle = sc[p.c % 5]; c.globalAlpha = .85; rr(c, -3.5, -1.2, 7, 2.4, 1.2); c.fill(); c.restore(); } break; }
    }
    c.restore();
  },
};

/* =====================================================================
   整個世界的風景插畫（地圖卡片 / 封面 / 結算畫面用）
   ===================================================================== */
const Scenes = {
  /* 在矩形 (x,y,w,h) 內畫第 wi 個世界的風景 */
  draw(c, wi, x, y, w, h, t) {
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.translate(x, y);
    this['w' + wi](c, w, h, t);
    c.restore();
  },
  sky(c, w, h, a, b) { c.fillStyle = vgrad(c, 0, h, [a, b]); c.fillRect(0, 0, w, h); },
  cloud(c, x, y, s, col = 'rgba(255,255,255,.92)') {
    c.fillStyle = col; c.beginPath(); c.arc(x, y, 14 * s, 0, TAU); c.arc(x + 16 * s, y - 6 * s, 17 * s, 0, TAU); c.arc(x + 34 * s, y, 14 * s, 0, TAU); c.rect(x, y, 34 * s, 14 * s); c.fill();
  },
  hills(c, w, y, amp, col, seed = 1, f = .02) {
    c.fillStyle = col; c.beginPath(); c.moveTo(0, 2000);
    for (let x = 0; x <= w + 8; x += 8) c.lineTo(x, y + Math.sin(x * f + seed) * amp + Math.sin(x * f * 2.3 + seed * 2) * amp * .4);
    c.lineTo(w, 2000); c.closePath(); c.fill();
  },
  /* 0 池塘：晴天、遠山、森林、荷葉池塘 */
  w0(c, w, h, t) {
    this.sky(c, w, h, '#62c2ff', '#e4f8ff');
    circ(c, w * .78, h * .2, 26, radial(c, w * .78, h * .2, 4, 40, ['#fff7c0', 'rgba(255,240,150,0)'])); circ(c, w * .78, h * .2, 17, '#fff3a0');
    this.cloud(c, (t * 6) % (w + 80) - 60, h * .16, 1, 'rgba(255,255,255,.95)'); this.cloud(c, (t * 4 + 200) % (w + 80) - 60, h * .3, .7);
    this.hills(c, w, h * .52, 12, '#8fd0a0', 1); this.hills(c, w, h * .6, 14, '#5fb85a', 3, .03);
    for (let i = 0; i < 9; i++) { const tx = 20 + i * (w / 8.5), ty = h * .6 + Math.sin(i * 2) * 4; Props.draw(c, 'tree', tx, ty, t, i / 9); }
    c.fillStyle = vgrad(c, h * .66, h, ['#3aa6e0', '#1f78b8']); c.fillRect(0, h * .68, w, h);
    c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1.5; for (let i = 0; i < 8; i++) { const yy = h * .72 + i * 7, xx = ((t * 14 + i * 60) % (w + 40)) - 20; c.beginPath(); c.moveTo(xx, yy); c.quadraticCurveTo(xx + 10, yy - 3, xx + 20, yy); c.stroke(); }
    for (const [lx, ly] of [[.2, .8], [.55, .86], [.82, .76]]) { ell(c, w * lx, h * ly, 18, 8, '#4cbf4a', '#2a7a2a', 1.5); ell(c, w * lx - 3, h * ly - 2, 5, 2.5, '#ff8fc4'); }
  },
  /* 1 都市：霓虹夜景 */
  w1(c, w, h, t) {
    this.sky(c, w, h, '#150a3a', '#6a2a98');
    circ(c, w * .8, h * .18, 20, '#fff6d6'); circ(c, w * .8 - 6, h * .18 - 3, 20, '#1a0f48');
    c.fillStyle = '#fff'; for (let i = 0; i < 24; i++) { c.globalAlpha = .4 + .5 * Math.sin(t * 2 + i); c.fillRect((i * 53) % w, (i * 31) % (h * .4), 1.5, 1.5); } c.globalAlpha = 1;
    const bl = [[0, .46, 40, '#241447'], [34, .38, 36, '#2d1a58'], [66, .5, 44, '#1d1040'], [108, .32, 38, '#341d68'], [142, .44, 46, '#241447'], [186, .36, 40, '#2d1a58'], [222, .5, 36, '#1d1040'], [254, .4, 44, '#341d68'], [296, .34, 40, '#241447'], [334, .48, 46, '#2d1a58'], [376, .4, 40, '#1d1040']];
    for (const [bx, by, bw, col] of bl) { c.fillStyle = col; c.fillRect(bx * w / 420, h * by, bw * w / 420, h); for (let wy = h * by + 6; wy < h * .85; wy += 9) for (let wx = bx * w / 420 + 4; wx < (bx + bw) * w / 420 - 5; wx += 8) { if (((wx * 7 + wy * 3) | 0) % 5 < 2) { c.fillStyle = ((wx + wy) | 0) % 3 ? '#ffe28a' : '#6af0ff'; c.fillRect(wx, wy, 3.5, 4.5); } } }
    c.save(); c.shadowColor = '#ff2fd0'; c.shadowBlur = 12; UI.text(c, 'NEON', w * .3, h * .3, { size: 18, color: '#ff7ae8', weight: 900 }); c.restore();
    c.fillStyle = '#2a2d3c'; c.fillRect(0, h * .86, w, h); c.fillStyle = '#ffd23a'; for (let x = 0; x < w; x += 30) c.fillRect(x, h * .92, 16, 3);
    c.globalAlpha = .3; c.fillStyle = '#ff6adf'; c.fillRect(0, h * .86, w, 2); c.globalAlpha = 1;
  },
  /* 2 冰雪：極光 雪山 */
  w2(c, w, h, t) {
    this.sky(c, w, h, '#0e2a5e', '#8fd0ff');
    for (let k = 0; k < 3; k++) { c.globalAlpha = .28; c.fillStyle = ['#5dffb0', '#7ad0ff', '#c58bff'][k]; c.beginPath(); c.moveTo(0, h * .1 + k * 8); for (let x = 0; x <= w; x += 10) c.lineTo(x, h * (.12 + k * .05) + Math.sin(x * .03 + t * .8 + k) * 14); c.lineTo(w, h * .45); c.lineTo(0, h * .45); c.closePath(); c.fill(); } c.globalAlpha = 1;
    c.fillStyle = '#fff'; for (let i = 0; i < 20; i++) { c.globalAlpha = .4 + .5 * Math.sin(t * 2 + i * 2); c.fillRect((i * 67) % w, (i * 29) % (h * .35), 1.6, 1.6); } c.globalAlpha = 1;
    for (const [mx, mh, mw] of [[.2, .42, .34], [.52, .55, .4], [.84, .4, .3]]) { poly(c, [w * (mx - mw / 2), h * .72, w * mx, h * (.72 - mh * .8), w * (mx + mw / 2), h * .72], '#b4cce6', '#7a96b8', 1.5); poly(c, [w * mx - w * mw * .13, h * (.72 - mh * .8 + mh * .22), w * mx, h * (.72 - mh * .8), w * mx + w * mw * .13, h * (.72 - mh * .8 + mh * .22)], '#fff'); }
    this.hills(c, w, h * .74, 8, '#e8f4ff', 2); c.fillStyle = '#f4faff'; c.fillRect(0, h * .8, w, h);
    Props.draw(c, 'pine', w * .12, h * .8, t, .2); Props.draw(c, 'pine', w * .2, h * .84, t, .5); Props.draw(c, 'igloo', w * .55, h * .84, t, .1); Props.draw(c, 'snowman', w * .86, h * .86, t, .4); Props.draw(c, 'pine', w * .94, h * .8, t, .8);
  },
  /* 3 火山：噴發 */
  w3(c, w, h, t) {
    this.sky(c, w, h, '#2a0710', '#ff7a2a');
    this.cloud(c, (t * 5) % (w + 80) - 60, h * .2, 1.1, 'rgba(60,20,25,.8)'); this.cloud(c, (t * 3 + 120) % (w + 80) - 60, h * .1, .8, 'rgba(80,28,30,.7)');
    poly(c, [w * .15, h * .78, w * .5, h * .22, w * .85, h * .78], grad(c, 0, h * .22, 0, h * .78, ['#3a2428', '#1e1216']), '#0e080a', 2);
    const g = .6 + Math.sin(t * 3) * .2; c.save(); c.shadowColor = '#ff7a2a'; c.shadowBlur = 20 * g; poly(c, [w * .44, h * .27, w * .56, h * .27, w * .5, h * .24], '#ff9a3a'); c.restore();
    c.strokeStyle = '#ff7a2a'; c.lineWidth = 3; c.beginPath(); c.moveTo(w * .5, h * .27); c.quadraticCurveTo(w * .46, h * .45, w * .38, h * .78); c.moveTo(w * .5, h * .27); c.quadraticCurveTo(w * .56, h * .5, w * .62, h * .78); c.stroke();
    for (let i = 0; i < 12; i++) { const ph = (t * .5 + i * .31) % 1; c.globalAlpha = 1 - ph; circ(c, w * .5 + Math.sin(i * 7) * 30 + (ph * 30 * Math.cos(i * 3)), h * .26 - ph * h * .24, 2.4, i % 2 ? '#ffd27a' : '#ff6a2a'); } c.globalAlpha = 1;
    c.fillStyle = '#1e1216'; c.fillRect(0, h * .78, w, h); c.fillStyle = vgrad(c, h * .84, h, ['#ff8a2a', '#d4330e']); c.fillRect(0, h * .86, w, h);
    c.fillStyle = 'rgba(255,230,140,.4)'; for (let i = 0; i < 6; i++) c.fillRect(((t * 20 + i * 70) % (w + 40)) - 20, h * .9 + (i % 3) * 6, 20, 2);
    Props.draw(c, 'spike', w * .12, h * .8, t, .2); Props.draw(c, 'deadtree', w * .88, h * .8, t, .3); Props.draw(c, 'torch', w * .3, h * .82, t, .7);
  },
  /* 4 太空：行星 */
  w4(c, w, h, t) {
    this.sky(c, w, h, '#03041a', '#2a1470');
    c.fillStyle = radial(c, w * .3, h * .35, 0, 120, ['rgba(160,70,255,.35)', 'rgba(160,70,255,0)']); c.fillRect(0, 0, w, h);
    c.fillStyle = '#fff'; for (let i = 0; i < 50; i++) { c.globalAlpha = .3 + .6 * (Math.sin(t * 2 + i * 1.3) + 1) / 2; c.fillRect((i * 61) % w, (i * 37) % (h * .8), i % 7 ? 1.4 : 2.4, i % 7 ? 1.4 : 2.4); } c.globalAlpha = 1;
    circ(c, w * .72, h * .3, 34, radial(c, w * .6, h * .22, 4, 40, ['#ffd27a', '#e8793a', '#8a2a2a']), null);
    c.save(); c.translate(w * .72, h * .3); c.rotate(-.35); c.strokeStyle = 'rgba(255,230,180,.8)'; c.lineWidth = 5; c.beginPath(); c.ellipse(0, 0, 54, 12, 0, PI, TAU); c.stroke(); c.restore();
    circ(c, w * .72, h * .3, 34, null); c.save(); c.beginPath(); c.arc(w * .72, h * .3, 34, 0, TAU); c.clip(); c.fillStyle = radial(c, w * .6, h * .22, 4, 50, ['rgba(255,230,160,.9)', 'rgba(255,200,100,0)']); c.fillRect(0, 0, w, h); c.restore();
    c.save(); c.translate(w * .72, h * .3); c.rotate(-.35); c.strokeStyle = 'rgba(255,230,180,.8)'; c.lineWidth = 5; c.beginPath(); c.ellipse(0, 0, 54, 12, 0, 0, PI); c.stroke(); c.restore();
    circ(c, w * .14, h * .5, 16, radial(c, w * .12, h * .46, 2, 20, ['#9af0ff', '#2a8fd0']));
    const sx = ((t * 80) % (w + 160)) - 80; c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(sx, h * .12); c.lineTo(sx - 40, h * .12 - 14); c.stroke();
    c.fillStyle = '#2b3258'; c.fillRect(0, h * .84, w, h); c.fillStyle = '#31d6c0'; for (let x = 6; x < w; x += 40) c.fillRect(x, h * .88, 20, 2.5);
    Props.draw(c, 'antenna', w * .15, h * .84, t, .2); Props.draw(c, 'dome', w * .5, h * .86, t, .4); Props.draw(c, 'reactor', w * .84, h * .84, t, .6);
  },
  /* 5 糖果：棉花糖與彩虹 */
  w5(c, w, h, t) {
    this.sky(c, w, h, '#ff9ad8', '#fff2fb');
    const rc = ['#ff4b6e', '#ff9a3a', '#ffe14a', '#6edb4a', '#4bb8ff', '#a06bff'];
    rc.forEach((col, i) => { c.strokeStyle = col; c.lineWidth = 6; c.globalAlpha = .85; c.beginPath(); c.arc(w * .5, h * .78, w * .46 - i * 6, PI, TAU); c.stroke(); }); c.globalAlpha = 1;
    this.cloud(c, (t * 6) % (w + 80) - 60, h * .2, 1, 'rgba(255,255,255,.95)'); this.cloud(c, (t * 4 + 150) % (w + 80) - 60, h * .35, .8, 'rgba(255,230,250,.95)');
    this.hills(c, w, h * .68, 10, '#ffc2e6', 1); this.hills(c, w, h * .74, 12, '#ffa8d8', 3, .03);
    for (const [px, k] of [[.12, 'lolly'], [.3, 'cane'], [.52, 'cupcake'], [.74, 'lolly'], [.9, 'gumdrop']]) Props.draw(c, k, w * px, h * .78, t, px);
    c.fillStyle = vgrad(c, h * .84, h, ['#8a4a2a', '#5a2f18']); c.fillRect(0, h * .86, w, h);
    c.fillStyle = 'rgba(255,255,255,.25)'; for (let i = 0; i < 5; i++) c.fillRect(((t * 16 + i * 90) % (w + 60)) - 30, h * .92, 40, 2.5);
  },
};

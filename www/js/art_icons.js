'use strict';
/* =====================================================================
   圖示：星星、金幣、寶石、愛心、武器、變種能力…全部向量手繪
   所有圖示簽名： (c, cx, cy, size, t)
   ===================================================================== */
const Icons = {
  starPath(c, x, y, R, r) {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -PI / 2 + i * PI / 5, rad = i % 2 ? r : R;
      i ? c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad) : c.moveTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    c.closePath();
  },
  star(c, x, y, R, on = true) {
    c.save();
    this.starPath(c, x, y, R, R * .5);
    if (on) {
      c.fillStyle = grad(c, x, y - R, x, y + R, ['#fff7a8', '#ffd22e', '#f59a14']);
      c.fill(); c.lineWidth = Math.max(1.5, R * .14); c.strokeStyle = '#a65a06'; c.lineJoin = 'round'; c.stroke();
      c.globalAlpha = .7; this.starPath(c, x - R * .12, y - R * .15, R * .45, R * .2); c.fillStyle = '#fff'; c.fill();
    } else {
      c.fillStyle = 'rgba(20,30,40,.45)'; c.fill(); c.lineWidth = Math.max(1.5, R * .14); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineJoin = 'round'; c.stroke();
    }
    c.restore();
  },
  coin(c, x, y, s, t = 0) {
    const r = s / 2, k = Math.abs(Math.cos(t * 3.2));
    const rx = Math.max(r * .18, r * k);
    c.save();
    ell(c, x, y, rx, r, grad(c, x, y - r, x, y + r, ['#fff3a0', '#ffc933', '#e08a0f']), '#8c4b04', Math.max(1.2, s * .07));
    if (rx > r * .35) {
      ell(c, x, y, rx * .68, r * .68, null, 'rgba(160,90,10,.75)', Math.max(1, s * .06));
      ctxText(c, '$', x, y + 1, s * .5 * Math.min(1, rx / r + .2), '#a45d06');
      c.globalAlpha = .6; ell(c, x - rx * .3, y - r * .35, rx * .22, r * .12, '#fff');
    }
    c.restore();
  },
  gem(c, x, y, s, t = 0, col = '#44e0ff') {
    const r = s / 2;
    c.save();
    const dark = shade(col, -.45), light = shade(col, .6);
    poly(c, [x - r * .7, y - r * .25, x - r * .35, y - r * .8, x + r * .35, y - r * .8, x + r * .7, y - r * .25, x, y + r * .9], col, dark, Math.max(1.2, s * .07));
    poly(c, [x - r * .7, y - r * .25, x + r * .7, y - r * .25, x, y + r * .9], shade(col, -.15));
    poly(c, [x - r * .35, y - r * .8, x - r * .7, y - r * .25, x, y - r * .25], light);
    poly(c, [x + r * .35, y - r * .8, x + r * .7, y - r * .25, x, y - r * .25], shade(col, .25));
    c.strokeStyle = dark; c.lineWidth = 1; c.beginPath(); c.moveTo(x - r * .7, y - r * .25); c.lineTo(x + r * .7, y - r * .25); c.stroke();
    const tw = (Math.sin(t * 5) + 1) / 2;
    c.globalAlpha = .5 + tw * .5; this.sparkle(c, x - r * .35, y - r * .55, r * .3 * (.6 + tw * .5)); c.restore();
  },
  sparkle(c, x, y, r) {
    c.save(); c.fillStyle = '#fff';
    c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r);
    c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); c.restore();
  },
  heartPath(c, x, y, s) {
    c.beginPath(); c.moveTo(x, y + s * .42);
    c.bezierCurveTo(x - s * .75, y - s * .02, x - s * .5, y - s * .62, x, y - s * .22);
    c.bezierCurveTo(x + s * .5, y - s * .62, x + s * .75, y - s * .02, x, y + s * .42); c.closePath();
  },
  heart(c, x, y, s, full = true) {
    c.save(); this.heartPath(c, x, y, s);
    if (full) {
      c.fillStyle = grad(c, x, y - s * .5, x, y + s * .45, ['#ff8aa0', '#ff2e57', '#c4102f']); c.fill();
      c.lineWidth = Math.max(1.5, s * .09); c.strokeStyle = '#6e0a1c'; c.lineJoin = 'round'; c.stroke();
      ell(c, x - s * .22, y - s * .2, s * .12, s * .07, 'rgba(255,255,255,.85)');
    } else {
      c.fillStyle = 'rgba(10,20,30,.5)'; c.fill(); c.lineWidth = Math.max(1.5, s * .08); c.strokeStyle = 'rgba(255,255,255,.35)'; c.stroke();
    }
    c.restore();
  },
  crate(c, x, y, s, t = 0) { // 神祕補給箱
    const r = s / 2, bob = Math.sin(t * 3) * s * .04;
    c.save(); c.translate(x, y + bob);
    c.globalAlpha = .35 + Math.sin(t * 4) * .1; circ(c, 0, 0, r * 1.25, radial(c, 0, 0, 0, r * 1.25, ['rgba(255,240,140,.9)', 'rgba(255,240,140,0)'])); c.globalAlpha = 1;
    rr(c, -r * .8, -r * .75, r * 1.6, r * 1.5, r * .22); c.fillStyle = grad(c, 0, -r, 0, r, ['#ffd86b', '#e8941f']); c.fill();
    c.lineWidth = Math.max(1.5, s * .07); c.strokeStyle = '#7a3e05'; c.stroke();
    c.strokeStyle = 'rgba(120,60,5,.55)'; c.lineWidth = s * .05;
    c.beginPath(); c.moveTo(-r * .8, -r * .1); c.lineTo(r * .8, -r * .1); c.moveTo(-r * .8, r * .45); c.lineTo(r * .8, r * .45); c.stroke();
    ctxText(c, '?', 0, 0, s * .62, '#fff', '#7a3e05');
    c.restore();
  },
  potion(c, x, y, s, col = '#7cf', t = 0) {
    const r = s / 2, bob = Math.sin(t * 3 + x) * s * .04;
    c.save(); c.translate(x, y + bob);
    c.globalAlpha = .4; circ(c, 0, 0, r * 1.3, radial(c, 0, 0, 0, r * 1.3, [rgba(col, .9), rgba(col, 0)])); c.globalAlpha = 1;
    // 瓶身
    c.beginPath(); c.moveTo(-r * .2, -r * .75); c.lineTo(-r * .2, -r * .3); c.bezierCurveTo(-r * .85, -r * .1, -r * .85, r * .8, 0, r * .85);
    c.bezierCurveTo(r * .85, r * .8, r * .85, -r * .1, r * .2, -r * .3); c.lineTo(r * .2, -r * .75); c.closePath();
    c.fillStyle = 'rgba(230,245,255,.55)'; c.fill();
    c.save(); c.clip();
    c.fillStyle = grad(c, 0, -r * .1, 0, r, [shade(col, .35), col, shade(col, -.25)]);
    c.fillRect(-r, -r * .15 + Math.sin(t * 4) * 1.2, r * 2, r * 1.2);
    c.restore();
    c.lineWidth = Math.max(1.4, s * .07); c.strokeStyle = '#2d3b4a'; c.stroke();
    rr(c, -r * .3, -r * .95, r * .6, r * .28, 3); c.fillStyle = '#b87a3d'; c.fill(); c.stroke();
    circ(c, -r * .32, r * .2, r * .13, 'rgba(255,255,255,.8)'); circ(c, r * .22, r * .45, r * .08, 'rgba(255,255,255,.7)');
    c.restore();
  },
  lock(c, x, y, s) {
    const r = s / 2; c.save();
    c.strokeStyle = '#9aa6b2'; c.lineWidth = s * .13; c.beginPath(); c.arc(x, y - r * .2, r * .45, PI, 0); c.lineTo(x + r * .45, y + r * .1); c.moveTo(x - r * .45, y - r * .2); c.lineTo(x - r * .45, y + r * .1); c.stroke();
    rr(c, x - r * .75, y - r * .1, r * 1.5, r * 1.0, 4); c.fillStyle = grad(c, 0, y - r * .1, 0, y + r * .9, ['#ffd45a', '#d88a12']); c.fill(); c.lineWidth = s * .06; c.strokeStyle = '#6b3d05'; c.stroke();
    circ(c, x, y + r * .3, r * .15, '#5a3204'); c.fillStyle = '#5a3204'; c.fillRect(x - r * .06, y + r * .3, r * .12, r * .3); c.restore();
  },
  gear(c, x, y, s, t = 0) {
    const r = s / 2; c.save(); c.translate(x, y);
    c.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8;
      c.arc(0, 0, r * .95, a - .17, a + .17); c.arc(0, 0, r * .68, a + .17, a + TAU / 8 - .17);
    }
    c.closePath(); c.fillStyle = grad(c, 0, -r, 0, r, ['#f3f7fb', '#9fb1c2']); c.fill(); c.lineWidth = s * .07; c.strokeStyle = '#3b4a58'; c.lineJoin = 'round'; c.stroke();
    circ(c, 0, 0, r * .32, '#3b4a58'); circ(c, 0, 0, r * .18, '#cfd9e2'); c.restore();
  },
  speaker(c, x, y, s, on = true) {
    const r = s / 2; c.save(); c.translate(x, y);
    poly(c, [-r * .75, -r * .3, -r * .35, -r * .3, r * .05, -r * .7, r * .05, r * .7, -r * .35, r * .3, -r * .75, r * .3], '#fff', '#2b3a4a', s * .07);
    if (on) { c.strokeStyle = '#fff'; c.lineWidth = s * .09; c.lineCap = 'round'; c.beginPath(); c.arc(r * .1, 0, r * .45, -.8, .8); c.stroke(); c.beginPath(); c.arc(r * .1, 0, r * .8, -.8, .8); c.stroke(); }
    else { c.strokeStyle = '#ff5050'; c.lineWidth = s * .13; c.lineCap = 'round'; c.beginPath(); c.moveTo(r * .3, -r * .4); c.lineTo(r * .9, r * .4); c.moveTo(r * .9, -r * .4); c.lineTo(r * .3, r * .4); c.stroke(); }
    c.restore();
  },
  note(c, x, y, s, on = true) {
    const r = s / 2; c.save(); c.translate(x, y);
    c.fillStyle = '#fff'; c.strokeStyle = '#2b3a4a'; c.lineWidth = s * .06;
    ell(c, -r * .35, r * .5, r * .38, r * .28, '#fff', '#2b3a4a', s * .06);
    ell(c, r * .5, r * .3, r * .38, r * .28, '#fff', '#2b3a4a', s * .06);
    c.fillStyle = '#fff'; c.fillRect(-r * .05, -r * .7, r * .12, r * 1.2); c.fillRect(r * .8, -r * .9, r * .12, r * 1.2);
    poly(c, [-r * .05, -r * .7, r * .92, -r * .95, r * .92, -r * .55, -r * .05, -r * .3], '#fff', '#2b3a4a', s * .05);
    if (!on) { c.strokeStyle = '#ff5050'; c.lineWidth = s * .13; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * .8, r * .8); c.lineTo(r * .8, -r * .8); c.stroke(); }
    c.restore();
  },
  pause(c, x, y, s) { const r = s / 2; c.fillStyle = '#fff'; rr(c, x - r * .6, y - r * .65, r * .4, r * 1.3, 3); c.fill(); rr(c, x + r * .2, y - r * .65, r * .4, r * 1.3, 3); c.fill(); },
  play(c, x, y, s) { const r = s / 2; poly(c, [x - r * .5, y - r * .7, x + r * .75, y, x - r * .5, y + r * .7], '#fff', 'rgba(0,0,0,.25)', 2); },
  home(c, x, y, s) { const r = s / 2; c.save(); poly(c, [x - r * .85, y - r * .05, x, y - r * .85, x + r * .85, y - r * .05], '#fff'); c.fillStyle = '#fff'; c.fillRect(x - r * .6, y - r * .05, r * 1.2, r * .8); c.fillStyle = '#c97a34'; c.fillRect(x - r * .17, y + r * .18, r * .34, r * .57); c.restore(); },
  back(c, x, y, s) { const r = s / 2; c.save(); c.strokeStyle = '#fff'; c.lineWidth = s * .16; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(x + r * .4, y - r * .6); c.lineTo(x - r * .4, y); c.lineTo(x + r * .4, y + r * .6); c.stroke(); c.restore(); },
  next(c, x, y, s) { const r = s / 2; c.save(); c.strokeStyle = '#fff'; c.lineWidth = s * .16; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(x - r * .4, y - r * .6); c.lineTo(x + r * .4, y); c.lineTo(x - r * .4, y + r * .6); c.stroke(); c.restore(); },
  retry(c, x, y, s) { const r = s / 2; c.save(); c.strokeStyle = '#fff'; c.lineWidth = s * .14; c.lineCap = 'round'; c.beginPath(); c.arc(x, y, r * .55, -.4, TAU - 1.2); c.stroke(); poly(c, [x + r * .75, y - r * .25, x + r * .2, y - r * .25, x + r * .55, y - r * .8], '#fff'); c.restore(); },
  shop(c, x, y, s) {
    const r = s / 2; c.save();
    c.fillStyle = '#fff'; rr(c, x - r * .7, y - r * .3, r * 1.4, r * 1.0, 4); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = s * .09; c.beginPath(); c.arc(x, y - r * .3, r * .38, PI, 0); c.stroke();
    c.fillStyle = '#ff9a2e'; rr(c, x - r * .7, y - r * .3, r * 1.4, r * .3, 3); c.fill();
    Icons.star(c, x, y + r * .3, r * .28, true); c.restore();
  },
  map(c, x, y, s) { const r = s / 2; c.save(); poly(c, [x - r * .8, y - r * .6, x - r * .27, y - r * .75, x + r * .27, y - r * .6, x + r * .8, y - r * .75, x + r * .8, y + r * .6, x + r * .27, y + r * .75, x - r * .27, y + r * .6, x - r * .8, y + r * .75], '#fff', '#2b3a4a', s * .05); c.strokeStyle = '#ff5a3c'; c.lineWidth = s * .08; c.beginPath(); c.moveTo(x - r * .4, y + r * .2); c.lineTo(x - r * .05, y - r * .15); c.lineTo(x + r * .15, y + r * .2); c.lineTo(x + r * .5, y - r * .2); c.stroke(); c.restore(); },
  skull(c, x, y, s) {
    const r = s / 2; c.save(); ell(c, x, y - r * .1, r * .75, r * .7, '#f4f0e6', '#3b3a36', s * .06);
    rr(c, x - r * .4, y + r * .35, r * .8, r * .5, 4); c.fillStyle = '#f4f0e6'; c.fill(); c.stroke();
    ell(c, x - r * .3, y - r * .1, r * .22, r * .26, '#222'); ell(c, x + r * .3, y - r * .1, r * .22, r * .26, '#222');
    poly(c, [x, y + r * .1, x - r * .1, y + r * .3, x + r * .1, y + r * .3], '#222');
    c.strokeStyle = '#3b3a36'; c.lineWidth = 1.5; c.beginPath(); for (let i = -1; i <= 1; i++) { c.moveTo(x + i * r * .2, y + r * .45); c.lineTo(x + i * r * .2, y + r * .8); } c.stroke(); c.restore();
  },
  crown(c, x, y, s) {
    const r = s / 2; c.save();
    poly(c, [x - r * .85, y + r * .55, x - r * .9, y - r * .5, x - r * .4, y, x, y - r * .7, x + r * .4, y, x + r * .9, y - r * .5, x + r * .85, y + r * .55], grad(c, 0, y - r, 0, y + r * .6, ['#fff08a', '#f4b92c']), '#8c5a06', s * .06);
    circ(c, x, y - r * .72, r * .13, '#ff4b6e', '#8c5a06', 1.5); circ(c, x - r * .9, y - r * .55, r * .11, '#44e0ff', '#8c5a06', 1.5); circ(c, x + r * .9, y - r * .55, r * .11, '#44e0ff', '#8c5a06', 1.5);
    c.fillStyle = '#d4820d'; c.fillRect(x - r * .85, y + r * .35, r * 1.7, r * .2); c.restore();
  },
  flag(c, x, y, s, t = 0) {
    const r = s / 2; c.save(); c.fillStyle = '#e8eef3'; c.fillRect(x - r * .5, y - r * .85, s * .07, r * 1.75);
    c.beginPath(); c.moveTo(x - r * .5 + s * .07, y - r * .85);
    for (let i = 0; i <= 10; i++) c.lineTo(x - r * .5 + s * .07 + i * r * .09, y - r * .85 + Math.sin(i * .8 + t * 6) * 2);
    for (let i = 10; i >= 0; i--) c.lineTo(x - r * .5 + s * .07 + i * r * .09, y - r * .2 + Math.sin(i * .8 + t * 6) * 2);
    c.closePath(); c.fillStyle = '#ff4b3c'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#8a1e14'; c.stroke(); c.restore();
  },
  trophy(c, x, y, s) { const r = s / 2; c.save(); c.fillStyle = grad(c, 0, y - r, 0, y + r, ['#fff08a', '#e8a318']); c.strokeStyle = '#8c5a06'; c.lineWidth = s * .06; c.beginPath(); c.moveTo(x - r * .6, y - r * .7); c.lineTo(x + r * .6, y - r * .7); c.quadraticCurveTo(x + r * .6, y + r * .3, x, y + r * .35); c.quadraticCurveTo(x - r * .6, y + r * .3, x - r * .6, y - r * .7); c.fill(); c.stroke(); c.fillRect(x - r * .1, y + r * .3, r * .2, r * .3); rr(c, x - r * .4, y + r * .55, r * .8, r * .25, 3); c.fill(); c.stroke(); c.restore(); },
  dir(c, x, y, s, d) { // d: 0上 1右 2下 3左
    c.save(); c.translate(x, y); c.rotate(d * PI / 2);
    const r = s / 2; poly(c, [0, -r * .75, r * .7, r * .2, r * .25, r * .2, r * .25, r * .7, -r * .25, r * .7, -r * .25, r * .2, -r * .7, r * .2], 'rgba(255,255,255,.95)', 'rgba(20,40,60,.6)', s * .05);
    c.restore();
  },
  fireBtn(c, x, y, s) { // 準心
    const r = s / 2; c.save(); c.strokeStyle = '#fff'; c.lineWidth = s * .08; c.lineCap = 'round';
    c.beginPath(); c.arc(x, y, r * .55, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo(x, y - r * .95); c.lineTo(x, y - r * .3); c.moveTo(x, y + r * .95); c.lineTo(x, y + r * .3); c.moveTo(x - r * .95, y); c.lineTo(x - r * .3, y); c.moveTo(x + r * .95, y); c.lineTo(x + r * .3, y); c.stroke();
    circ(c, x, y, r * .12, '#fff'); c.restore();
  },
  frogHead(c, x, y, s, col = '#5ccf3a') { // 小青蛙頭（進度條 / 圖示）
    const r = s / 2; c.save();
    circ(c, x - r * .5, y - r * .45, r * .42, col, '#1d5a12', s * .06); circ(c, x + r * .5, y - r * .45, r * .42, col, '#1d5a12', s * .06);
    ell(c, x, y + r * .1, r * .9, r * .7, col, '#1d5a12', s * .06);
    circ(c, x - r * .5, y - r * .45, r * .26, '#fff'); circ(c, x + r * .5, y - r * .45, r * .26, '#fff');
    circ(c, x - r * .47, y - r * .42, r * .13, '#111'); circ(c, x + r * .53, y - r * .42, r * .13, '#111');
    c.strokeStyle = '#1d5a12'; c.lineWidth = s * .06; c.lineCap = 'round'; c.beginPath(); c.arc(x, y + r * .05, r * .45, .25, PI - .25); c.stroke(); c.restore();
  },
  bolt(c, x, y, s) { const r = s / 2; poly(c, [x + r * .2, y - r * .9, x - r * .55, y + r * .1, x - r * .05, y + r * .1, x - r * .25, y + r * .9, x + r * .6, y - r * .2, x + r * .05, y - r * .2], '#ffe93a', '#a86a00', s * .06); },
  flame(c, x, y, s, t = 0) {
    const r = s / 2; c.save();
    c.beginPath(); c.moveTo(x, y - r * .95); c.bezierCurveTo(x + r * .2, y - r * .5, x + r * .85, y - r * .2, x + r * .65, y + r * .35);
    c.bezierCurveTo(x + r * .55, y + r * .85, x - r * .55, y + r * .85, x - r * .65, y + r * .3); c.bezierCurveTo(x - r * .75, y - r * .1, x - r * .2, y - r * .3, x, y - r * .95);
    c.fillStyle = grad(c, 0, y - r, 0, y + r, ['#ffe44a', '#ff8a1a', '#e5341c']); c.fill(); c.lineWidth = s * .05; c.strokeStyle = '#8a2208'; c.stroke();
    c.beginPath(); c.moveTo(x, y - r * .25); c.bezierCurveTo(x + r * .35, y + r * .05, x + r * .4, y + r * .6, x, y + r * .65); c.bezierCurveTo(x - r * .4, y + r * .6, x - r * .35, y + r * .05, x, y - r * .25);
    c.fillStyle = '#fff3a0'; c.fill(); c.restore();
  },
  snow(c, x, y, s) {
    const r = s / 2; c.save(); c.strokeStyle = '#e8fbff'; c.lineWidth = s * .09; c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const a = i * PI / 3; c.beginPath(); c.moveTo(x + Math.cos(a) * r * .9, y + Math.sin(a) * r * .9); c.lineTo(x - Math.cos(a) * r * .9, y - Math.sin(a) * r * .9); c.stroke();
      for (const sg of [1, -1]) { const bx = x + Math.cos(a) * r * .55 * sg, by = y + Math.sin(a) * r * .55 * sg; c.beginPath(); c.moveTo(bx + Math.cos(a + 1) * r * .25, by + Math.sin(a + 1) * r * .25); c.lineTo(bx, by); c.lineTo(bx + Math.cos(a - 1) * r * .25, by + Math.sin(a - 1) * r * .25); c.stroke(); }
    }
    c.restore();
  },
  bubble(c, x, y, s) { const r = s / 2; c.save(); circ(c, x, y, r * .8, 'rgba(160,230,255,.45)', '#fff', s * .06); ell(c, x - r * .3, y - r * .3, r * .22, r * .12, 'rgba(255,255,255,.9)'); circ(c, x + r * .35, y + r * .3, r * .1, 'rgba(255,255,255,.7)'); c.restore(); },
  boomerang(c, x, y, s, t = 0) {
    const r = s / 2; c.save(); c.translate(x, y); c.rotate(t * 6);
    c.beginPath(); c.moveTo(-r * .8, -r * .5); c.quadraticCurveTo(r * .9, -r * .9, r * .8, r * .6); c.lineTo(r * .4, r * .45); c.quadraticCurveTo(r * .4, -r * .3, -r * .6, -r * .15); c.closePath();
    c.fillStyle = grad(c, -r, -r, r, r, ['#ffd27a', '#d97a1c']); c.fill(); c.lineWidth = s * .06; c.strokeStyle = '#6e3606'; c.lineJoin = 'round'; c.stroke(); c.restore();
  },
  spread(c, x, y, s) { const r = s / 2; c.save(); for (let i = -1; i <= 1; i++) { c.save(); c.translate(x, y + r * .6); c.rotate(i * .5); ell(c, 0, -r * .9, r * .17, r * .3, '#9fe9ff', '#1b6f95', s * .05); c.restore(); } circ(c, x, y + r * .6, r * .2, '#fff', '#1b6f95', s * .05); c.restore(); },
  /* ---- 變種能力圖示 ---- */
  m_jump(c, x, y, s) { const r = s / 2; c.save(); c.strokeStyle = '#7a8794'; c.lineWidth = s * .1; c.lineCap = 'round'; c.beginPath(); for (let i = 0; i < 4; i++) { c.moveTo(x - r * .5, y + r * .5 - i * r * .38); c.quadraticCurveTo(x, y + r * .7 - i * r * .38, x + r * .5, y + r * .5 - i * r * .38); } c.stroke(); poly(c, [x, y - r * .95, x + r * .5, y - r * .45, x - r * .5, y - r * .45], '#ffe93a', '#a86a00', s * .05); c.restore(); },
  m_fly(c, x, y, s) { const r = s / 2; c.save(); for (const sg of [-1, 1]) { c.beginPath(); c.moveTo(x, y + r * .2); c.bezierCurveTo(x + sg * r * .5, y - r * .9, x + sg * r * 1.1, y - r * .6, x + sg * r * .95, y - r * .1); c.bezierCurveTo(x + sg * r * .8, y + r * .05, x + sg * r * .7, y + r * .1, x + sg * r * .62, y + r * .3); c.bezierCurveTo(x + sg * r * .5, y + r * .3, x + sg * r * .3, y + r * .4, x, y + r * .2); c.fillStyle = '#fff'; c.fill(); c.lineWidth = s * .05; c.strokeStyle = '#7a9ab5'; c.stroke(); } c.restore(); },
  m_ghost(c, x, y, s) { const r = s / 2; c.save(); c.beginPath(); c.moveTo(x - r * .65, y + r * .75); c.lineTo(x - r * .65, y - r * .1); c.bezierCurveTo(x - r * .65, y - r * .95, x + r * .65, y - r * .95, x + r * .65, y - r * .1); c.lineTo(x + r * .65, y + r * .75); c.lineTo(x + r * .33, y + r * .5); c.lineTo(x, y + r * .75); c.lineTo(x - r * .33, y + r * .5); c.closePath(); c.fillStyle = 'rgba(245,250,255,.95)'; c.fill(); c.lineWidth = s * .05; c.strokeStyle = '#7a9ab5'; c.stroke(); circ(c, x - r * .27, y - r * .15, r * .13, '#223'); circ(c, x + r * .27, y - r * .15, r * .13, '#223'); ell(c, x, y + r * .12, r * .1, r * .14, '#223'); c.restore(); },
  m_giant(c, x, y, s) { const r = s / 2; c.save(); Icons.frogHead(c, x, y + r * .1, s * .95, '#7be04b'); ctxText(c, 'XL', x, y - r * .72, s * .38, '#ffe93a', '#7a3d05'); c.restore(); },
  m_speed(c, x, y, s) { const r = s / 2; c.save(); poly(c, [x - r * .3, y - r * .75, x + r * .35, y - r * .75, x + r * .35, y + r * .1, x + r * .85, y + r * .35, x + r * .85, y + r * .75, x - r * .3, y + r * .75], '#ff8a2e', '#7a3205', s * .06); c.strokeStyle = '#fff'; c.lineWidth = s * .07; c.lineCap = 'round'; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x - r * .5 - i * r * .12, y - r * .4 + i * r * .35); c.lineTo(x - r * .95, y - r * .4 + i * r * .35); c.stroke(); } c.restore(); },
  m_freeze(c, x, y, s) { const r = s / 2; c.save(); rr(c, x - r * .7, y - r * .7, r * 1.4, r * 1.4, r * .25); c.fillStyle = grad(c, x - r, y - r, x + r, y + r, ['#e9fbff', '#8fd8f5']); c.fill(); c.lineWidth = s * .06; c.strokeStyle = '#2b78a3'; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = s * .06; c.beginPath(); c.moveTo(x - r * .4, y - r * .35); c.lineTo(x - r * .1, y - r * .5); c.stroke(); c.restore(); },
  m_shield(c, x, y, s) { const r = s / 2; c.save(); c.beginPath(); c.moveTo(x, y - r * .9); c.lineTo(x + r * .75, y - r * .55); c.quadraticCurveTo(x + r * .75, y + r * .5, x, y + r * .95); c.quadraticCurveTo(x - r * .75, y + r * .5, x - r * .75, y - r * .55); c.closePath(); c.fillStyle = grad(c, x - r, y - r, x + r, y + r, ['#7fd0ff', '#2f6fe0']); c.fill(); c.lineWidth = s * .07; c.strokeStyle = '#173b86'; c.lineJoin = 'round'; c.stroke(); Icons.star(c, x, y, r * .35, true); c.restore(); },
  m_slow(c, x, y, s) { const r = s / 2; c.save(); circ(c, x, y, r * .8, '#fff', '#2b3a4a', s * .06); c.strokeStyle = '#2b3a4a'; c.lineWidth = s * .07; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - r * .5); c.moveTo(x, y); c.lineTo(x + r * .35, y + r * .2); c.stroke(); circ(c, x, y, r * .08, '#2b3a4a'); for (let i = 0; i < 12; i++) { const a = i * TAU / 12; c.beginPath(); c.moveTo(x + Math.cos(a) * r * .62, y + Math.sin(a) * r * .62); c.lineTo(x + Math.cos(a) * r * .7, y + Math.sin(a) * r * .7); c.stroke(); } c.restore(); },
  m_magnet(c, x, y, s) { const r = s / 2; c.save(); c.lineWidth = s * .26; c.lineCap = 'butt'; c.strokeStyle = '#e8352b'; c.beginPath(); c.arc(x, y + r * .05, r * .52, PI, 0); c.lineTo(x + r * .52, y + r * .6); c.moveTo(x - r * .52, y + r * .05); c.lineTo(x - r * .52, y + r * .6); c.stroke(); c.fillStyle = '#e8eef3'; c.fillRect(x - r * .65, y + r * .5, r * .26, r * .35); c.fillRect(x + r * .39, y + r * .5, r * .26, r * .35); c.restore(); },
};
Icons.clover = function (c, x, y, s) {
  const r = s / 2; c.save();
  for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4; const px = x + Math.cos(a) * r * .32, py = y + Math.sin(a) * r * .32; circ(c, px, py, r * .36, grad(c, px, py - r * .4, px, py + r * .4, ['#7be04b', '#2e9a2e']), '#1b5e1b', s * .05); }
  c.strokeStyle = '#1b5e1b'; c.lineWidth = s * .08; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + r * .1, y + r * .5, x + r * .35, y + r * .85); c.stroke(); c.restore();
};
Icons.w_bubble = Icons.bubble; Icons.w_fire = Icons.flame; Icons.w_ice = Icons.snow; Icons.w_bolt = Icons.bolt;
Icons.w_boomerang = Icons.boomerang; Icons.w_spread = Icons.spread;

/* 置中文字小工具（圖示內部用） */
function ctxText(c, str, x, y, size, color, stroke) {
  c.save(); c.font = `900 ${size}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  if (stroke) { c.lineWidth = size * .2; c.strokeStyle = stroke; c.lineJoin = 'round'; c.strokeText(str, x, y); }
  c.fillStyle = color; c.fillText(str, x, y); c.restore();
}

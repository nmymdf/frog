'use strict';
/* =====================================================================
   動態物件美術：載具、巡邏怪、水面平台、飛行怪、子彈、天降攻擊
   載具一律朝右畫，原點在物件中心，dir=-1 時水平翻轉
   ===================================================================== */
const Obj = {
  wheel(c, x, y, r, t, sp = 6, rim = '#c9d3dc') {
    circ(c, x, y, r, '#1c1f26'); circ(c, x, y, r * .62, rim, '#6b7480', 1);
    c.save(); c.translate(x, y); c.rotate(t * sp); c.strokeStyle = '#6b7480'; c.lineWidth = Math.max(1, r * .14);
    for (let i = 0; i < 4; i++) { c.rotate(PI / 2); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, r * .55); c.stroke(); } c.restore(); circ(c, x, y, r * .18, '#444');
  },
  glass(c, x, y, w, h, r = 3) { rr(c, x, y, w, h, r); c.fillStyle = grad(c, x, y, x + w, y + h, ['#d7f1ff', '#7fb9e0']); c.fill(); c.strokeStyle = 'rgba(30,50,70,.7)'; c.lineWidth = 1.2; c.stroke(); c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x + 2, y + 2, w * .25, h * .5); },
  light(c, x, y, r, col = '#fff6a8') { circ(c, x, y, r, col, 'rgba(90,70,0,.6)', 1); c.globalAlpha = .28; circ(c, x + r * 2, y, r * 3.2, radial(c, x + r * 2, y, 0, r * 3.2, [rgba(col, .9), rgba(col, 0)])); c.globalAlpha = 1; },
  body(c, x, y, w, h, col, r = 5) { rr(c, x, y, w, h, r); c.fillStyle = grad(c, 0, y, 0, y + h, [shade(col, .28), col, shade(col, -.18)]); c.fill(); c.lineWidth = 1.8; c.strokeStyle = shade(col, -.6); c.stroke(); },

  /* ---------- 主入口：載具 / 巡邏怪 ---------- */
  vehicle(c, o, x, y, dir, t, extra = {}) {
    const k = o.kind, w = o.w, h = o.h, f = this['v_' + k];
    c.save();
    shadowEll(c, x, y + h / 2 - 2, w * .46, 5, .26);
    c.translate(x, y); c.scale(dir, 1);
    const bob = o.walker ? 0 : Math.sin(t * 14 + o.x0) * .5; c.translate(0, bob);
    if (extra.frozen) { c.filter = 'saturate(.5) brightness(1.25)'; }
    if (f) f.call(this, c, w, h, t + o.x0 * .01, o); else { this.body(c, -w / 2, -h / 2, w, h, '#c33'); }
    c.filter = 'none';
    if (extra.frozen) { c.globalAlpha = .55; rr(c, -w / 2 - 2, -h / 2 - 2, w + 4, h + 4, 8); c.fillStyle = 'rgba(170,235,255,.6)'; c.fill(); c.strokeStyle = '#eaffff'; c.lineWidth = 2; c.stroke(); c.globalAlpha = 1; }
    if (extra.flash) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = extra.flash; c.fillStyle = '#fff'; rr(c, -w / 2, -h / 2, w, h, 6); c.fill(); }
    c.restore();
  },
  /* === 池塘 === */
  v_tractor(c, w, h, t) {
    const sm = (t * 2) % 1; for (let i = 0; i < 3; i++) { const p = (sm + i / 3) % 1; c.globalAlpha = (1 - p) * .5; circ(c, -w * .08 - p * 22, -h * .5 - 4 - p * 14, 3 + p * 5, '#d8d8d8'); } c.globalAlpha = 1;
    rr(c, -w * .1, -h * .5 - 2, 4, 10, 1); c.fillStyle = '#555'; c.fill();
    this.body(c, w * .02, -h * .18, w * .46, h * .46, '#3da83a'); this.body(c, -w * .4, -h * .42, w * .38, h * .55, '#2f8f2c', 6);
    this.glass(c, -w * .36, -h * .36, w * .26, h * .26); rr(c, w * .1, -h * .28, w * .3, 4, 2); c.fillStyle = '#1c6a1a'; c.fill();
    this.wheel(c, -w * .26, h * .16, h * .34, t, 5, '#f2c02e'); this.wheel(c, w * .34, h * .26, h * .2, t, 8, '#f2c02e');
    this.light(c, w * .49, -h * .02, 3);
  },
  v_pickup(c, w, h, t) {
    this.body(c, -w * .5, -h * .2, w * .98, h * .5, '#d9382c'); this.body(c, w * .0, -h * .46, w * .34, h * .3, '#c22f24', 5);
    this.glass(c, w * .04, -h * .42, w * .26, h * .22); c.fillStyle = '#8b5a2a'; c.fillRect(-w * .46, -h * .3, w * .44, h * .12);
    for (let i = 0; i < 4; i++) circ(c, -w * .4 + i * w * .1, -h * .32, 6, '#e8b14a', '#8a5a14', 1);
    this.wheel(c, -w * .28, h * .3, h * .22, t, 7); this.wheel(c, w * .28, h * .3, h * .22, t, 7); this.light(c, w * .48, -h * .02, 3);
  },
  v_beetle(c, w, h, t, o) {
    const cols = ['#ffd23a', '#ff6a8a', '#4cc0ff', '#8ee04a', '#ff9a3a'], col = cols[Math.floor((o.x0 || 0) / 10) % 5];
    c.beginPath(); c.moveTo(-w * .5, h * .25); c.quadraticCurveTo(-w * .52, -h * .55, -w * .05, -h * .5); c.quadraticCurveTo(w * .3, -h * .5, w * .42, -h * .1); c.quadraticCurveTo(w * .54, 0, w * .5, h * .25); c.closePath();
    c.fillStyle = grad(c, 0, -h * .5, 0, h * .3, [shade(col, .3), col, shade(col, -.2)]); c.fill(); c.lineWidth = 1.8; c.strokeStyle = shade(col, -.6); c.stroke();
    this.glass(c, -w * .12, -h * .4, w * .38, h * .3, 6); this.wheel(c, -w * .26, h * .26, h * .22, t, 7); this.wheel(c, w * .26, h * .26, h * .22, t, 7);
    circ(c, w * .44, -h * .02, 4.5, '#fff', '#333', 1); circ(c, w * .45, -h * .02, 2, '#222'); this.light(c, w * .5, h * .06, 2.4);
  },
  v_cart(c, w, h, t) {
    // 馬 + 乾草車
    const lg = Math.sin(t * 9) * 5;
    c.strokeStyle = '#7a4a22'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(w * .28, h * .15); c.lineTo(w * .3 + lg, h * .45); c.moveTo(w * .4, h * .15); c.lineTo(w * .38 - lg, h * .45); c.moveTo(w * .2, h * .15); c.lineTo(w * .17 - lg, h * .45); c.stroke();
    ell(c, w * .3, -h * .05, w * .15, h * .22, '#a8672e', '#5a3410', 1.6); c.beginPath(); c.moveTo(w * .4, -h * .15); c.lineTo(w * .46, -h * .45); c.lineTo(w * .54, -h * .35); c.lineTo(w * .5, -h * .08); c.closePath(); c.fillStyle = '#a8672e'; c.fill(); c.strokeStyle = '#5a3410'; c.stroke(); circ(c, w * .49, -h * .35, 1.5, '#111');
    this.body(c, -w * .5, -h * .1, w * .6, h * .3, '#b87a3d', 3); for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-w * .45 + i * w * .1, -h * .14, 8, PI, TAU); c.fillStyle = i % 2 ? '#f2d04a' : '#e6c13a'; c.fill(); }
    this.wheel(c, -w * .28, h * .3, h * .22, t, 3, '#b87a3d'); this.wheel(c, w * .02, h * .3, h * .22, t, 3, '#b87a3d');
  },
  v_bike(c, w, h, t) {
    this.wheel(c, -w * .28, h * .2, h * .28, t, 7, '#eee'); this.wheel(c, w * .28, h * .2, h * .28, t, 7, '#eee');
    c.strokeStyle = '#e8352b'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(-w * .28, h * .2); c.lineTo(0, -h * .05); c.lineTo(w * .28, h * .2); c.moveTo(0, -h * .05); c.lineTo(w * .15, -h * .22); c.stroke();
    const ped = Math.sin(t * 14) * 4; c.strokeStyle = '#9a9aa6'; c.lineWidth = 3; c.beginPath(); c.moveTo(-1, h * .05); c.lineTo(ped, h * .28); c.stroke();
    ell(c, -3, -h * .22, 8, 10, '#e8e8f2', '#7a7a8a', 1.4); circ(c, 6, -h * .46, 7, '#f2f2fa', '#7a7a8a', 1.4); ell(c, 4, -h * .75, 2.6, 8, '#f2f2fa', '#7a7a8a', 1.2); ell(c, 11, -h * .72, 2.4, 7, '#f2f2fa', '#7a7a8a', 1.2); circ(c, 9, -h * .46, 1.4, '#111');
  },
  /* === 都市 === */
  v_taxi(c, w, h, t) {
    this.body(c, -w * .5, -h * .12, w, h * .5, '#ffd21e'); this.body(c, -w * .26, -h * .5, w * .5, h * .4, '#f5c518', 6);
    this.glass(c, -w * .22, -h * .44, w * .18, h * .28); this.glass(c, 0, -h * .44, w * .18, h * .28);
    rr(c, -w * .1, -h * .62, w * .2, h * .14, 3); c.fillStyle = '#fff'; c.fill(); c.stroke(); c.fillStyle = '#222'; for (let i = 0; i < 4; i++) c.fillRect(-w * .5 + i * w * .26, h * .14, w * .13, 4);
    this.wheel(c, -w * .28, h * .36, h * .2, t, 8); this.wheel(c, w * .28, h * .36, h * .2, t, 8); this.light(c, w * .49, 0, 3.2);
  },
  v_bus(c, w, h, t) {
    this.body(c, -w * .5, -h * .45, w, h * .85, '#3b82f6', 7); c.fillStyle = '#fff'; c.fillRect(-w * .5, h * .02, w, 4);
    for (let i = 0; i < 6; i++) { this.glass(c, -w * .46 + i * w * .145, -h * .36, w * .115, h * .28, 3); circ(c, -w * .405 + i * w * .145, -h * .2, 3, 'rgba(40,50,70,.6)'); }
    this.glass(c, w * .36, -h * .36, w * .1, h * .4, 3); rr(c, w * .3, -h * .44, w * .18, 5, 2); c.fillStyle = '#ffd23a'; c.fill();
    this.wheel(c, -w * .3, h * .38, h * .2, t, 7); this.wheel(c, w * .3, h * .38, h * .2, t, 7); this.light(c, w * .49, h * .12, 3.5);
  },
  v_sports(c, w, h, t) {
    c.beginPath(); c.moveTo(-w * .5, h * .2); c.lineTo(-w * .5, -h * .05); c.lineTo(-w * .3, -h * .1); c.lineTo(-w * .12, -h * .42); c.lineTo(w * .2, -h * .42); c.lineTo(w * .36, -h * .08); c.lineTo(w * .5, h * .02); c.lineTo(w * .5, h * .25); c.closePath();
    c.fillStyle = grad(c, 0, -h * .4, 0, h * .3, ['#ff6a5a', '#e0281c', '#a01208']); c.fill(); c.lineWidth = 1.8; c.strokeStyle = '#500a04'; c.stroke();
    c.beginPath(); c.moveTo(-w * .1, -h * .36); c.lineTo(w * .17, -h * .36); c.lineTo(w * .28, -h * .1); c.lineTo(-w * .16, -h * .1); c.closePath(); c.fillStyle = '#9fd8f5'; c.fill(); c.strokeStyle = '#222'; c.stroke();
    c.fillStyle = '#ffd23a'; c.fillRect(-w * .46, h * .0, w * .8, 3); rr(c, -w * .52, -h * .22, w * .16, 4, 2); c.fillStyle = '#222'; c.fill();
    this.wheel(c, -w * .28, h * .3, h * .22, t, 10); this.wheel(c, w * .28, h * .3, h * .22, t, 10); this.light(c, w * .49, h * .02, 3);
  },
  v_police(c, w, h, t) {
    this.body(c, -w * .5, -h * .12, w, h * .5, '#f2f4f8'); this.body(c, -w * .26, -h * .5, w * .5, h * .4, '#e8ecf4', 6);
    c.fillStyle = '#1d2a4a'; c.fillRect(-w * .5, h * .06, w, h * .12); this.glass(c, -w * .22, -h * .44, w * .18, h * .28); this.glass(c, 0, -h * .44, w * .18, h * .28);
    const f = Math.floor(t * 8) % 2; rr(c, -w * .12, -h * .62, w * .12, h * .13, 2); c.fillStyle = f ? '#ff2b2b' : '#7a1a1a'; c.fill(); rr(c, 0, -h * .62, w * .12, h * .13, 2); c.fillStyle = f ? '#2b6bff' : '#1a2a7a'; c.fill();
    c.globalAlpha = .4; circ(c, -w * .06, -h * .55, 16, radial(c, -w * .06, -h * .55, 0, 16, [f ? 'rgba(255,40,40,.9)' : 'rgba(40,100,255,.9)', 'rgba(0,0,0,0)'])); c.globalAlpha = 1;
    this.wheel(c, -w * .28, h * .36, h * .2, t, 9); this.wheel(c, w * .28, h * .36, h * .2, t, 9); this.light(c, w * .49, 0, 3);
  },
  v_truck(c, w, h, t) {
    this.body(c, -w * .5, -h * .5, w * .68, h * .85, '#f4f4f0', 4); c.fillStyle = '#ff7a2a'; c.fillRect(-w * .5, -h * .08, w * .68, 5);
    ctxText(c, '快遞', -w * .16, -h * .28, h * .26, '#e8352b'); this.body(c, w * .2, -h * .3, w * .3, h * .65, '#ff7a2a', 5); this.glass(c, w * .3, -h * .24, w * .16, h * .28);
    this.wheel(c, -w * .34, h * .38, h * .2, t, 7); this.wheel(c, -w * .1, h * .38, h * .2, t, 7); this.wheel(c, w * .34, h * .38, h * .2, t, 7); this.light(c, w * .49, h * .12, 3);
  },
  v_scooter(c, w, h, t) {
    this.wheel(c, -w * .3, h * .22, h * .22, t, 9, '#ddd'); this.wheel(c, w * .3, h * .22, h * .22, t, 9, '#ddd');
    this.body(c, -w * .32, h * .0, w * .55, h * .16, '#9b5bff', 3); c.strokeStyle = '#555'; c.lineWidth = 3; c.beginPath(); c.moveTo(w * .26, h * .06); c.lineTo(w * .18, -h * .32); c.lineTo(w * .3, -h * .34); c.stroke();
    ell(c, -w * .08, -h * .22, 9, 10, '#ff9a3a', '#7a3a05', 1.4); circ(c, 0, -h * .5, 8, '#ffb866', '#7a3a05', 1.4); poly(c, [-6, -h * .54, -3, -h * .78, 0, -h * .55], '#ffb866', '#7a3a05', 1.2); poly(c, [2, -h * .55, 5, -h * .78, 8, -h * .54], '#ffb866', '#7a3a05', 1.2);
    c.beginPath(); c.arc(0, -h * .5, 8.4, PI, TAU); c.fillStyle = '#e8352b'; c.fill(); circ(c, 4, -h * .48, 1.3, '#111');
  },
  /* === 冰雪 === */
  v_sled(c, w, h, t) {
    const lg = Math.sin(t * 12) * 4;
    for (let i = 0; i < 2; i++) { const bx = w * (.32 + i * .15); ell(c, bx, 0, 10, 7, i ? '#c9a37a' : '#8c8c98', '#444', 1.2); circ(c, bx + 9, -5, 5.5, i ? '#c9a37a' : '#8c8c98', '#444', 1.2); poly(c, [bx + 6, -9, bx + 8, -15, bx + 11, -9], '#8c8c98', '#444', 1); circ(c, bx + 11, -5.5, 1, '#111'); c.strokeStyle = '#555'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(bx - 3, 4); c.lineTo(bx - 5 + lg, 14); c.moveTo(bx + 4, 4); c.lineTo(bx + 6 - lg, 14); c.stroke(); }
    c.strokeStyle = '#7a4a22'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(w * .06, 0); c.lineTo(w * .32, 0); c.stroke();
    this.body(c, -w * .5, -h * .3, w * .56, h * .42, '#c0392b', 5); c.fillStyle = '#ffd23a'; c.fillRect(-w * .46, -h * .05, w * .48, 3);
    rr(c, -w * .4, -h * .5, w * .28, h * .26, 3); c.fillStyle = '#6aa84f'; c.fill(); c.stroke(); c.strokeStyle = '#6a4a22'; c.lineWidth = 3; c.beginPath(); c.moveTo(-w * .5, h * .22); c.quadraticCurveTo(-w * .56, h * .22, -w * .54, h * .1); c.moveTo(-w * .5, h * .22); c.lineTo(w * .1, h * .22); c.stroke();
  },
  v_snowmobile(c, w, h, t) {
    c.strokeStyle = '#444'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-w * .4, h * .36); c.lineTo(w * .4, h * .36); c.quadraticCurveTo(w * .5, h * .34, w * .52, h * .22); c.stroke();
    c.fillStyle = '#2d2d3a'; rr(c, -w * .4, h * .12, w * .56, h * .26, 5); c.fill();
    this.body(c, -w * .42, -h * .15, w * .85, h * .36, '#2f87ff', 8); this.glass(c, w * .12, -h * .42, w * .18, h * .26, 4);
    ell(c, -w * .08, -h * .3, 8, 10, '#ff5a3c', '#7c1a08', 1.4); circ(c, 0, -h * .52, 7, '#ffd0a8', '#7a4a22', 1.2); c.beginPath(); c.arc(0, -h * .54, 7.4, PI, TAU); c.fillStyle = '#222'; c.fill(); c.fillStyle = '#ff5a3c'; c.fillRect(-7, -h * .5, 14, 3);
    this.light(c, w * .5, -h * .05, 3);
  },
  v_plow(c, w, h, t) {
    poly(c, [w * .32, h * .4, w * .5, h * .4, w * .54, -h * .35, w * .34, -h * .1], '#c0c8d0', '#4a5260', 1.8); c.strokeStyle = '#8a929c'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(w * .36, h * .3); c.lineTo(w * .5, h * .3); c.moveTo(w * .36, h * .1); c.lineTo(w * .52, h * .1); c.stroke();
    this.body(c, -w * .5, -h * .3, w * .8, h * .65, '#ff8a1e', 6); this.body(c, w * .06, -h * .5, w * .24, h * .4, '#e87a10', 5); this.glass(c, w * .1, -h * .45, w * .16, h * .28);
    c.fillStyle = '#222'; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-w * .48 + i * w * .14, h * .04); c.lineTo(-w * .42 + i * w * .14, -h * .04); c.lineTo(-w * .36 + i * w * .14, h * .04); c.closePath(); c.fill(); }
    const f = Math.floor(t * 6) % 2; circ(c, w * .18, -h * .58, 4, f ? '#ffd23a' : '#8a6a10'); c.globalAlpha = f ? .5 : 0; circ(c, w * .18, -h * .58, 14, radial(c, w * .18, -h * .58, 0, 14, ['rgba(255,220,60,.9)', 'rgba(255,220,60,0)'])); c.globalAlpha = 1;
    this.wheel(c, -w * .3, h * .38, h * .22, t, 6); this.wheel(c, w * .12, h * .38, h * .22, t, 6);
  },
  v_penguin(c, w, h, t) {
    ell(c, 0, h * .06, w * .42, h * .3, '#23272f', '#0c0e12', 1.6); ell(c, w * .04, h * .13, w * .32, h * .2, '#fff'); circ(c, w * .34, -h * .02, h * .24, '#23272f', '#0c0e12', 1.4);
    poly(c, [w * .44, -h * .04, w * .56, h * .02, w * .44, h * .06], '#ff9a2a', '#a8520a', 1.2); circ(c, w * .38, -h * .1, 2.6, '#fff'); circ(c, w * .39, -h * .1, 1.2, '#111');
    const fl = Math.sin(t * 10) * 5; poly(c, [w * .0, h * .0, -w * .14, -h * .06 + fl, -w * .02, h * .1], '#23272f', '#0c0e12', 1.2); poly(c, [-w * .4, h * .1, -w * .56, h * .0, -w * .44, h * .22], '#ff9a2a', '#a8520a', 1.2);
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-w * .5, h * .32); c.lineTo(-w * .8, h * .32); c.moveTo(-w * .46, h * .22); c.lineTo(-w * .7, h * .22); c.stroke();
  },
  v_skier(c, w, h, t) {
    c.strokeStyle = '#ffd23a'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-w * .5, h * .42); c.lineTo(w * .5, h * .42); c.quadraticCurveTo(w * .56, h * .42, w * .56, h * .34); c.stroke();
    c.strokeStyle = '#d33'; c.lineWidth = 4.5; c.beginPath(); c.moveTo(-w * .12, h * .36); c.lineTo(0, -h * .1); c.lineTo(w * .1, h * .36); c.stroke();
    ell(c, 0, -h * .18, 9, 12, '#e8352b', '#7c140c', 1.4); circ(c, 4, -h * .46, 7, '#ffd0a8', '#7a4a22', 1.2); c.beginPath(); c.arc(4, -h * .48, 7.4, PI, TAU); c.fillStyle = '#2f87ff'; c.fill(); circ(c, 4, -h * .66, 2.4, '#fff');
    c.strokeStyle = '#555'; c.lineWidth = 2; c.beginPath(); c.moveTo(7, -h * .2); c.lineTo(w * .46, h * .38); c.moveTo(-6, -h * .2); c.lineTo(-w * .44, h * .38); c.stroke();
  },
  /* === 火山 === */
  v_minecart(c, w, h, t) {
    c.beginPath(); c.moveTo(-w * .46, -h * .2); c.lineTo(w * .46, -h * .2); c.lineTo(w * .36, h * .3); c.lineTo(-w * .36, h * .3); c.closePath(); c.fillStyle = grad(c, 0, -h * .2, 0, h * .3, ['#7a7a88', '#4a4a58']); c.fill(); c.strokeStyle = '#1c1c24'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#9a9aa8'; c.fillRect(-w * .5, -h * .26, w, 5);
    for (let i = 0; i < 5; i++) { circ(c, -w * .3 + i * w * .15, -h * .28 - Math.abs(Math.sin(i * 2)) * 4, 5.5 + (i % 2) * 2, '#ff8a2a', '#8a2a08', 1.2); } c.globalAlpha = .4; circ(c, 0, -h * .36, 26, radial(c, 0, -h * .36, 0, 26, ['rgba(255,150,40,.9)', 'rgba(255,150,40,0)'])); c.globalAlpha = 1;
    this.wheel(c, -w * .26, h * .38, h * .15, t, 8); this.wheel(c, w * .26, h * .38, h * .15, t, 8);
  },
  v_buggy(c, w, h, t) {
    c.strokeStyle = '#666'; c.lineWidth = 3; c.beginPath(); c.moveTo(-w * .3, h * .1); c.lineTo(-w * .22, -h * .45); c.lineTo(w * .2, -h * .45); c.lineTo(w * .28, h * .1); c.stroke();
    this.body(c, -w * .46, -h * .05, w * .92, h * .32, '#ff5a1e', 6); ell(c, -w * .05, -h * .22, 8, 9, '#ffe14a', '#8a5a05', 1.2); circ(c, -w * .05, -h * .42, 6.5, '#ffd0a8', '#7a4a22', 1.2); c.beginPath(); c.arc(-w * .05, -h * .44, 7, PI, TAU); c.fillStyle = '#222'; c.fill();
    this.wheel(c, -w * .3, h * .3, h * .3, t, 7, '#ffb347'); this.wheel(c, w * .3, h * .3, h * .3, t, 7, '#ffb347');
    for (let i = 0; i < 3; i++) { const p = (t * 3 + i / 3) % 1; c.globalAlpha = 1 - p; circ(c, -w * .5 - p * 18, h * .12 - p * 6, 3 + p * 3, i % 2 ? '#ffd27a' : '#ff6a2a'); } c.globalAlpha = 1; this.light(c, w * .46, 0, 3);
  },
  v_boulder(c, w, h, t) {
    c.save(); c.rotate(t * 3 * (w / 58)); const r = Math.min(w, h) * .5;
    c.beginPath(); for (let i = 0; i < 12; i++) { const a = i * TAU / 12, rad = r * (.88 + .12 * Math.sin(i * 3.1)); i ? c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad) : c.moveTo(Math.cos(a) * rad, Math.sin(a) * rad); } c.closePath();
    c.fillStyle = grad(c, -r, -r, r, r, ['#6a5058', '#2a1c20']); c.fill(); c.lineWidth = 2; c.strokeStyle = '#0e080a'; c.stroke();
    c.strokeStyle = '#ff8a2a'; c.lineWidth = 2; c.shadowColor = '#ff7a2a'; c.shadowBlur = 6; c.beginPath(); c.moveTo(-r * .5, -r * .3); c.lineTo(-r * .1, 0); c.lineTo(-r * .3, r * .4); c.moveTo(-r * .1, 0); c.lineTo(r * .5, r * .1); c.stroke(); c.shadowBlur = 0; c.restore();
    circ(c, r * .2, -r * .15, 3.4, '#fff', '#222', 1); circ(c, r * .26, -r * .15, 1.4, '#222');
  },
  v_lizard(c, w, h, t) {
    const s = Math.sin(t * 14) * 3; c.strokeStyle = '#d4410f'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(-w * .5, h * .1); c.quadraticCurveTo(-w * .3, -h * .1 + s, -w * .1, h * .05); c.quadraticCurveTo(w * .1, h * .15, w * .3, 0); c.stroke();
    c.strokeStyle = '#ff7a2a'; c.lineWidth = 5; c.stroke();
    ell(c, w * .12, 0, w * .26, h * .26, '#ff5a1e', '#8a1e04', 1.6); ell(c, w * .38, -h * .04, w * .13, h * .2, '#ff7a2a', '#8a1e04', 1.6); circ(c, w * .4, -h * .12, 3, '#ffe14a', '#222', 1); circ(c, w * .41, -h * .12, 1.3, '#111');
    for (let i = 0; i < 4; i++) poly(c, [-w * .1 + i * w * .12, -h * .2, -w * .06 + i * w * .12, -h * .42, -w * .02 + i * w * .12, -h * .2], '#ffb347', '#8a1e04', 1);
    c.strokeStyle = '#d4410f'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(w * .02, h * .2); c.lineTo(w * .0 + s, h * .42); c.moveTo(w * .22, h * .2); c.lineTo(w * .24 - s, h * .42); c.stroke();
    const fl = (t * 6) % 1; c.globalAlpha = .9 - fl * .5; Icons.flame(c, w * .55 + fl * 4, -h * .02, 14 + fl * 6); c.globalAlpha = 1;
  },
  v_drillcar(c, w, h, t) {
    this.body(c, -w * .48, -h * .28, w * .66, h * .56, '#ffb81e', 5); this.glass(c, -w * .38, -h * .22, w * .22, h * .26);
    rr(c, -w * .48, h * .2, w * .72, h * .26, h * .13); c.fillStyle = '#2d2d38'; c.fill(); c.strokeStyle = '#0c0c12'; c.stroke(); for (let i = 0; i < 6; i++) circ(c, -w * .4 + i * w * .13, h * .33, 3.4, '#777');
    c.save(); c.translate(w * .18, -h * .02); poly(c, [0, -h * .28, w * .34, 0, 0, h * .28], '#b9c1cc', '#4a5260', 1.8); c.strokeStyle = '#6a7380'; c.lineWidth = 2; for (let i = 0; i < 4; i++) { const k = ((t * 4 + i / 4) % 1); c.beginPath(); c.moveTo(k * w * .3, -h * .24 * (1 - k)); c.lineTo(k * w * .3 + 5, h * .24 * (1 - k)); c.stroke(); } c.restore();
    circ(c, -w * .18, -h * .4, 3, '#ff4b4b');
  },
  /* === 太空 === */
  v_hover(c, w, h, t) {
    c.globalAlpha = .55; ell(c, 0, h * .38, w * .4, 4 + Math.sin(t * 12) * 1.2, '#31d6c0'); c.globalAlpha = 1;
    c.beginPath(); c.moveTo(-w * .5, h * .18); c.quadraticCurveTo(-w * .5, -h * .1, -w * .25, -h * .15); c.quadraticCurveTo(-w * .05, -h * .5, w * .22, -h * .15); c.quadraticCurveTo(w * .5, -h * .1, w * .5, h * .18); c.quadraticCurveTo(0, h * .38, -w * .5, h * .18); c.closePath();
    c.fillStyle = grad(c, 0, -h * .4, 0, h * .3, ['#e8f0ff', '#8fa6e0', '#4a5fa8']); c.fill(); c.lineWidth = 1.8; c.strokeStyle = '#1c2a5a'; c.stroke();
    c.beginPath(); c.moveTo(-w * .2, -h * .12); c.quadraticCurveTo(-w * .02, -h * .42, w * .18, -h * .12); c.closePath(); c.fillStyle = 'rgba(120,220,255,.8)'; c.fill(); c.stroke();
    c.fillStyle = '#31d6c0'; c.fillRect(-w * .4, h * .1, w * .8, 3); this.light(c, w * .46, h * .06, 2.6, '#9ff');
  },
  v_rover(c, w, h, t) {
    this.body(c, -w * .42, -h * .22, w * .84, h * .38, '#dfe6f4', 5); this.glass(c, w * .1, -h * .18, w * .24, h * .22, 4); c.fillStyle = '#ff8a2e'; c.fillRect(-w * .38, -h * .1, w * .34, 4);
    c.strokeStyle = '#8f9bbd'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-w * .2, -h * .22); c.lineTo(-w * .2, -h * .46); c.stroke(); c.save(); c.translate(-w * .2, -h * .48); c.rotate(-.5 + Math.sin(t) * .3); c.beginPath(); c.ellipse(0, 0, 10, 4, 0, 0, PI); c.fillStyle = '#e8eefc'; c.fill(); c.stroke(); c.restore();
    for (const x of [-.32, 0, .32]) this.wheel(c, w * x, h * .34, h * .17, t, 6, '#aab4d0');
  },
  v_rocket(c, w, h, t) {
    const fl = (t * 10) % 1; c.globalAlpha = .9; Icons.flame(c, -w * .56 - fl * 4, 0, 24 + fl * 6); c.globalAlpha = 1; c.save(); c.translate(-w * .5, 0); c.rotate(-PI / 2); c.restore();
    c.beginPath(); c.moveTo(-w * .46, -h * .3); c.lineTo(w * .2, -h * .34); c.quadraticCurveTo(w * .55, 0, w * .2, h * .34); c.lineTo(-w * .46, h * .3); c.closePath(); c.fillStyle = grad(c, 0, -h * .34, 0, h * .34, ['#ffffff', '#c9d3e8', '#8f9bbd']); c.fill(); c.lineWidth = 1.8; c.strokeStyle = '#2e3552'; c.stroke();
    poly(c, [-w * .46, -h * .3, -w * .56, -h * .55, -w * .3, -h * .3], '#e8352b', '#7c140c', 1.6); poly(c, [-w * .46, h * .3, -w * .56, h * .55, -w * .3, h * .3], '#e8352b', '#7c140c', 1.6);
    circ(c, w * .08, 0, h * .2, '#7fd8ff', '#2e3552', 1.6); ell(c, w * .04, -h * .06, 3.4, 2, 'rgba(255,255,255,.8)'); c.fillStyle = '#e8352b'; c.fillRect(-w * .1, -h * .32, 6, h * .64);
  },
  v_saucer(c, w, h, t) {
    ell(c, 0, h * .06, w * .5, h * .22, grad(c, 0, -h * .1, 0, h * .3, ['#e8eef8', '#8f9bbd']), '#2e3552', 1.8);
    c.beginPath(); c.arc(0, -h * .04, w * .22, PI, TAU); c.fillStyle = 'rgba(150,240,200,.65)'; c.fill(); c.strokeStyle = '#2e3552'; c.stroke(); circ(c, 0, -h * .14, 5, '#7ee05a', '#2a6a1c', 1.2); circ(c, -1.6, -h * .15, 1, '#111'); circ(c, 1.6, -h * .15, 1, '#111');
    for (let i = 0; i < 5; i++) { const on = Math.floor(t * 6 + i) % 2; circ(c, -w * .36 + i * w * .18, h * .1, 2.6, on ? '#ffe14a' : '#8a6a10'); }
    c.globalAlpha = .18; poly(c, [-w * .2, h * .28, w * .2, h * .28, w * .3, h * .55, -w * .3, h * .55], '#9fffe0'); c.globalAlpha = 1;
  },
  v_tram(c, w, h, t) {
    c.beginPath(); c.moveTo(-w * .5, h * .35); c.lineTo(-w * .5, -h * .3); c.quadraticCurveTo(-w * .5, -h * .5, -w * .3, -h * .5); c.lineTo(w * .2, -h * .5); c.quadraticCurveTo(w * .55, -h * .4, w * .5, h * .35); c.closePath();
    c.fillStyle = grad(c, 0, -h * .5, 0, h * .35, ['#f4f8ff', '#c4d0e8', '#8a9ac4']); c.fill(); c.lineWidth = 1.8; c.strokeStyle = '#2e3552'; c.stroke();
    for (let i = 0; i < 6; i++) this.glass(c, -w * .44 + i * w * .13, -h * .34, w * .09, h * .26, 3); c.beginPath(); c.moveTo(w * .22, -h * .42); c.lineTo(w * .46, -h * .3); c.lineTo(w * .44, -h * .06); c.lineTo(w * .22, -h * .06); c.closePath(); c.fillStyle = '#7fd8ff'; c.fill(); c.stroke();
    c.fillStyle = '#31d6c0'; c.fillRect(-w * .5, h * .12, w, 4); c.globalAlpha = .6; ell(c, 0, h * .42, w * .46, 3.5, '#31d6c0'); c.globalAlpha = 1; this.light(c, w * .5, h * .04, 3, '#9ff');
  },
  /* === 糖果 === */
  v_candycar(c, w, h, t, o) {
    const cols = ['#ff5fa8', '#4bd1ff', '#8bf05a', '#ffd23a', '#b07bff'], col = cols[Math.floor((o.x0 || 0) / 7) % 5];
    c.globalAlpha = .93; this.body(c, -w * .5, -h * .08, w, h * .46, col, h * .22); this.body(c, -w * .26, -h * .5, w * .5, h * .46, shade(col, .12), h * .2); c.globalAlpha = 1;
    this.glass(c, -w * .2, -h * .42, w * .38, h * .26, 6); c.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 6; i++) circ(c, -w * .4 + i * w * .16, h * .1, 2, '#fff');
    for (const x of [-.28, .28]) { circ(c, w * x, h * .32, h * .2, '#ff4b6e', '#7c1230', 1.4); c.save(); c.translate(w * x, h * .32); c.rotate(t * 6); c.strokeStyle = '#fff'; c.lineWidth = 3; for (let i = 0; i < 3; i++) { c.rotate(TAU / 3); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, h * .18); c.stroke(); } c.restore(); }
    this.light(c, w * .49, 0, 3);
  },
  v_icecream(c, w, h, t) {
    this.body(c, -w * .5, -h * .3, w * .72, h * .66, '#ff9ad0', 6); c.fillStyle = '#fff'; c.fillRect(-w * .5, -h * .02, w * .72, 4); rr(c, -w * .42, -h * .22, w * .36, h * .3, 3); c.fillStyle = '#fff3d6'; c.fill(); c.stroke();
    for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? '#ff4b6e' : '#fff'; c.beginPath(); c.moveTo(-w * .44 + i * w * .074, -h * .22); c.lineTo(-w * .4 + i * w * .074, -h * .22); c.lineTo(-w * .4 + i * w * .074, -h * .1); c.lineTo(-w * .44 + i * w * .074, -h * .1); c.fill(); }
    this.body(c, w * .2, -h * .18, w * .3, h * .54, '#ffd0ea', 5); this.glass(c, w * .27, -h * .12, w * .16, h * .24);
    poly(c, [-w * .1, -h * .34, w * .06, -h * .34, -w * .02, -h * .06], '#e8b86a', '#8a5a14', 1.3); circ(c, -w * .02, -h * .46, 8, '#ff8fc4', '#a8266a', 1.4); circ(c, -w * .02, -h * .56, 5.5, '#fff0f8', '#a8266a', 1.2); circ(c, -w * .02, -h * .65, 3, '#e8352b', '#7c140c', 1);
    this.wheel(c, -w * .3, h * .4, h * .18, t, 7, '#fff'); this.wheel(c, w * .34, h * .4, h * .18, t, 7, '#fff');
  },
  v_donutwheel(c, w, h, t) {
    const r = Math.min(w, h) * .5; c.save(); c.rotate(t * 3.4);
    circ(c, 0, 0, r, grad(c, -r, -r, r, r, ['#f0b868', '#c98a3a']), '#7a4a10', 2); circ(c, 0, 0, r * .86, grad(c, -r, -r, r, r, ['#ff9ad0', '#f0599f']), '#a8266a', 1.6);
    const sc = ['#fff', '#ffe14a', '#4bd1ff', '#8bf05a', '#b07bff']; for (let i = 0; i < 14; i++) { c.save(); c.rotate(i * TAU / 14 + .3); c.translate(r * (.52 + (i % 2) * .2), 0); c.fillStyle = sc[i % 5]; rr(c, -3.4, -1.1, 6.8, 2.2, 1.1); c.fill(); c.restore(); }
    circ(c, 0, 0, r * .3, '#5a2f18', '#7a4a10', 1.6); c.restore();
    circ(c, r * .35, -r * .3, 3.4, '#fff', '#222', 1); circ(c, r * .42, -r * .3, 1.4, '#222');
  },
  v_gingerbread(c, w, h, t) {
    const s = Math.sin(t * 16) * 6; c.strokeStyle = '#a8672e'; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-3, h * .15); c.lineTo(-8 + s, h * .45); c.moveTo(3, h * .15); c.lineTo(8 - s, h * .45); c.moveTo(-4, -h * .12); c.lineTo(-w * .42, -h * .25 + s); c.moveTo(4, -h * .12); c.lineTo(w * .42, -h * .25 - s); c.stroke();
    c.strokeStyle = '#fff'; c.lineWidth = 1.6; c.setLineDash([2, 3]); c.beginPath(); c.moveTo(-w * .42, -h * .25 + s); c.lineTo(-4, -h * .12); c.stroke(); c.setLineDash([]);
    ell(c, 0, 0, w * .26, h * .3, '#c98443', '#7a4a14', 1.6); circ(c, 0, -h * .36, w * .24, '#c98443', '#7a4a14', 1.6);
    circ(c, -4, -h * .4, 1.8, '#fff'); circ(c, 4, -h * .4, 1.8, '#fff'); circ(c, -4, -h * .4, .8, '#222'); circ(c, 4, -h * .4, .8, '#222'); c.strokeStyle = '#fff'; c.lineWidth = 1.4; c.beginPath(); c.arc(0, -h * .33, 4, .2, PI - .2); c.stroke();
    circ(c, 0, -h * .06, 2, '#ff4b6e'); circ(c, 0, h * .06, 2, '#4bd1ff');
  },
  v_lollitrain(c, w, h, t) {
    this.body(c, w * .14, -h * .28, w * .36, h * .56, '#ff4b6e', 6); c.strokeStyle = '#fff'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(w * .26, -h * .28); c.lineTo(w * .26, -h * .5); c.arc(w * .3, -h * .5, 4, PI, 0); c.stroke(); c.strokeStyle = '#ff4b6e'; c.setLineDash([3, 4]); c.stroke(); c.setLineDash([]);
    circ(c, w * .44, 0, 5, '#fff3a0', '#8a6a10', 1.2); this.glass(c, w * .2, -h * .2, w * .12, h * .22);
    for (let i = 0; i < 2; i++) { const bx = -w * .46 + i * w * .3; this.body(c, bx, -h * .22, w * .26, h * .5, ['#4bd1ff', '#8bf05a'][i], 5); circ(c, bx + w * .13, -h * .02, 7, ['#ffe14a', '#ff9ad0'][i], '#333', 1.2); circ(c, bx + w * .13, -h * .02, 3, '#fff'); c.strokeStyle = '#777'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx + w * .26, 0); c.lineTo(bx + w * .3, 0); c.stroke(); }
    c.strokeStyle = '#777'; c.beginPath(); c.moveTo(w * .1, 0); c.lineTo(w * .14, 0); c.stroke();
    for (const x of [-.36, -.1, .22, .4]) this.wheel(c, w * x, h * .36, h * .14, t, 6, '#fff');
  },
  /* === 巡邏怪 === */
  v_snake(c, w, h, t) {
    c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#1d5a12'; c.lineWidth = 12; c.beginPath(); for (let i = 0; i <= 12; i++) { const x = -w * .5 + i * w * .075, y = Math.sin(i * .9 + t * 8) * h * .28; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    c.strokeStyle = '#4fbf3a'; c.lineWidth = 9; c.stroke(); c.strokeStyle = '#e8f26a'; c.lineWidth = 2; c.setLineDash([3, 6]); c.stroke(); c.setLineDash([]);
    const hy = Math.sin(12 * .9 + t * 8) * h * .28; ell(c, w * .42, hy, 9, 7, '#4fbf3a', '#1d5a12', 1.6); circ(c, w * .46, hy - 3, 2.2, '#ffe14a', '#222', 1); circ(c, w * .47, hy - 3, 1, '#111');
    if ((t * 3) % 1 < .35) { c.strokeStyle = '#e8352b'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(w * .5, hy); c.lineTo(w * .58, hy); c.lineTo(w * .62, hy - 3); c.moveTo(w * .58, hy); c.lineTo(w * .62, hy + 3); c.stroke(); }
  },
  v_hedgehog(c, w, h, t) {
    const lg = Math.sin(t * 12) * 3; c.fillStyle = '#7a4a22'; c.fillRect(-w * .2, h * .18, 4, h * .26 + lg); c.fillRect(w * .1, h * .18, 4, h * .26 - lg);
    c.beginPath(); c.ellipse(-w * .06, 0, w * .4, h * .42, 0, 0, TAU); c.fillStyle = '#7a4a22'; c.fill(); c.strokeStyle = '#3b2310'; c.lineWidth = 1.6; c.stroke();
    c.strokeStyle = '#4a2c12'; c.lineWidth = 2; for (let i = 0; i < 16; i++) { const a = PI + i * PI / 15 * 1.1 - .2, x = -w * .06 + Math.cos(a) * w * .38, y = Math.sin(a) * h * .4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7); c.stroke(); }
    ell(c, w * .36, h * .08, w * .17, h * .22, '#e8c49a', '#7a4a22', 1.6); circ(c, w * .5, h * .06, 2.2, '#222'); circ(c, w * .4, -h * .02, 2, '#222');
  },
  v_rat(c, w, h, t) {
    const lg = Math.sin(t * 16) * 3; c.strokeStyle = '#d99aa6'; c.lineWidth = 2; c.beginPath(); c.moveTo(-w * .42, h * .1); c.quadraticCurveTo(-w * .6, -h * .2 + lg, -w * .52, -h * .35); c.stroke();
    ell(c, -w * .02, h * .02, w * .36, h * .3, '#8a8f9c', '#3b3f4a', 1.6); ell(c, w * .34, 0, w * .16, h * .22, '#9a9faa', '#3b3f4a', 1.6); circ(c, w * .28, -h * .22, 5, '#ffb3c4', '#3b3f4a', 1.2); circ(c, w * .4, -h * .2, 3.6, '#ffb3c4', '#3b3f4a', 1.2);
    circ(c, w * .44, -h * .04, 1.6, '#111'); circ(c, w * .5, h * .04, 1.6, '#ff5a7a'); c.fillStyle = '#4a4f5c'; c.fillRect(-w * .2, h * .24, 3, 6 + lg); c.fillRect(w * .1, h * .24, 3, 6 - lg);
  },
  v_robodog(c, w, h, t) {
    const lg = Math.sin(t * 12) * 4; c.fillStyle = '#6a7388'; c.fillRect(-w * .3, h * .1, 5, h * .34 + lg); c.fillRect(-w * .1, h * .1, 5, h * .34 - lg); c.fillRect(w * .1, h * .1, 5, h * .34 + lg); c.fillRect(w * .26, h * .1, 5, h * .34 - lg);
    this.body(c, -w * .4, -h * .2, w * .7, h * .38, '#aeb8cf', 4); this.body(c, w * .2, -h * .38, w * .26, h * .32, '#c4cde0', 4); circ(c, w * .38, -h * .22, 3, '#ff3b3b'); c.globalAlpha = .4; circ(c, w * .38, -h * .22, 8, radial(c, w * .38, -h * .22, 0, 8, ['rgba(255,60,60,.9)', 'rgba(255,60,60,0)'])); c.globalAlpha = 1;
    c.strokeStyle = '#6a7388'; c.lineWidth = 2; c.beginPath(); c.moveTo(w * .26, -h * .38); c.lineTo(w * .24, -h * .55); c.stroke(); circ(c, w * .24, -h * .56, 2, '#ffe14a'); c.fillStyle = '#31d6c0'; c.fillRect(-w * .3, -h * .06, w * .5, 3);
  },
  v_pengwalk(c, w, h, t) {
    c.save(); c.rotate(Math.sin(t * 8) * .12); ell(c, 0, 0, w * .38, h * .45, '#23272f', '#0c0e12', 1.6); ell(c, w * .04, h * .06, w * .26, h * .32, '#fff'); circ(c, w * .1, -h * .22, 2.6, '#fff'); circ(c, w * .12, -h * .22, 1.2, '#111'); circ(c, -w * .06, -h * .22, 2.6, '#fff'); circ(c, -w * .04, -h * .22, 1.2, '#111');
    poly(c, [w * .1, -h * .15, w * .3, -h * .1, w * .1, -h * .06], '#ff9a2a', '#a8520a', 1.2); const fl = Math.sin(t * 8) * 7; poly(c, [-w * .3, -h * .05, -w * .55, h * .05 + fl, -w * .26, h * .15], '#23272f', '#0c0e12', 1.2); c.restore();
    ell(c, -w * .1, h * .46, 6, 3, '#ff9a2a'); ell(c, w * .12, h * .46, 6, 3, '#ff9a2a');
  },
  v_polarbear(c, w, h, t) {
    const lg = Math.sin(t * 8) * 3; c.fillStyle = '#e8eef6'; for (const x of [-.3, -.12, .14, .3]) { rr(c, w * x - 5, h * .12, 10, h * .34 + (x < 0 ? lg : -lg), 4); c.fill(); c.strokeStyle = '#9fb0c4'; c.lineWidth = 1.4; c.stroke(); }
    ell(c, -w * .04, -h * .02, w * .4, h * .34, '#f4f8fc', '#9fb0c4', 1.8); ell(c, w * .38, -h * .06, w * .17, h * .22, '#f4f8fc', '#9fb0c4', 1.8); circ(c, w * .32, -h * .26, 4, '#f4f8fc', '#9fb0c4', 1.4); circ(c, w * .5, -h * .08, 3, '#222'); circ(c, w * .4, -h * .12, 2, '#222');
  },
  v_lavacrab(c, w, h, t) {
    const lg = Math.sin(t * 14) * 3; c.strokeStyle = '#a8240a'; c.lineWidth = 3; c.lineCap = 'round'; for (const sg of [-1, 1]) for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(sg * w * .2, h * .06); c.lineTo(sg * w * .4, h * .24 + (i % 2 ? lg : -lg)); c.lineTo(sg * w * .46, h * .4); c.stroke(); c.translate(0, -2); } c.translate(0, 6);
    ell(c, 0, 0, w * .3, h * .3, grad(c, 0, -h * .3, 0, h * .3, ['#ff7a3a', '#c4240a']), '#6e1409', 1.6); for (const sg of [-1, 1]) { circ(c, sg * w * .42, -h * .12, 7, '#ff5a2a', '#6e1409', 1.6); poly(c, [sg * w * .38, -h * .12, sg * w * .46, -h * .22, sg * w * .46, -h * .02], '#222'); circ(c, sg * w * .1, -h * .3, 3.4, '#ffe14a', '#222', 1); circ(c, sg * w * .1, -h * .3, 1.4, '#111'); }
  },
  v_imp(c, w, h, t) {
    const lg = Math.sin(t * 12) * 4; c.strokeStyle = '#a8240a'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-5, h * .2); c.lineTo(-6 + lg, h * .45); c.moveTo(5, h * .2); c.lineTo(6 - lg, h * .45); c.stroke();
    c.strokeStyle = '#a8240a'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-w * .26, h * .26); c.quadraticCurveTo(-w * .5, h * .3, -w * .46, h * .0); c.stroke(); poly(c, [-w * .46, 0, -w * .56, -h * .08, -w * .44, -h * .1], '#a8240a');
    ell(c, 0, 0, w * .3, h * .3, '#e8441c', '#6e1409', 1.6); circ(c, 0, -h * .3, w * .3, '#f2582a', '#6e1409', 1.6); poly(c, [-w * .22, -h * .46, -w * .3, -h * .74, -w * .08, -h * .52], '#ffe14a', '#6e1409', 1.2); poly(c, [w * .22, -h * .46, w * .3, -h * .74, w * .08, -h * .52], '#ffe14a', '#6e1409', 1.2);
    circ(c, -5, -h * .32, 3, '#ffe14a'); circ(c, 5, -h * .32, 3, '#ffe14a'); circ(c, -5, -h * .32, 1.2, '#111'); circ(c, 5, -h * .32, 1.2, '#111'); c.strokeStyle = '#6e1409'; c.lineWidth = 1.6; c.beginPath(); c.arc(0, -h * .2, 5, .3, PI - .3); c.stroke();
  },
  v_alien(c, w, h, t) {
    const sq = 1 + Math.sin(t * 8) * .08; c.save(); c.scale(1 / sq, sq);
    c.beginPath(); c.moveTo(-w * .4, h * .4); c.quadraticCurveTo(-w * .5, -h * .3, 0, -h * .4); c.quadraticCurveTo(w * .5, -h * .3, w * .4, h * .4); c.closePath(); c.fillStyle = grad(c, 0, -h * .4, 0, h * .4, ['#a8f06a', '#4cbf3a']); c.fill(); c.strokeStyle = '#1d5a12'; c.lineWidth = 1.8; c.stroke();
    ell(c, -6, -h * .08, 5.4, 7, '#fff', '#1d5a12', 1.2); ell(c, 6, -h * .08, 5.4, 7, '#fff', '#1d5a12', 1.2); circ(c, -5, -h * .06, 2.6, '#111'); circ(c, 7, -h * .06, 2.6, '#111'); c.restore();
    c.strokeStyle = '#3aa02a'; c.lineWidth = 2; c.beginPath(); c.moveTo(-5, -h * .4); c.lineTo(-8, -h * .62); c.moveTo(5, -h * .4); c.lineTo(8, -h * .62); c.stroke(); circ(c, -8, -h * .64, 3, '#ff6adf'); circ(c, 8, -h * .64, 3, '#ff6adf');
  },
  v_botwalk(c, w, h, t) {
    const lg = Math.sin(t * 8) * 5; c.fillStyle = '#6a7388'; rr(c, -w * .26, h * .18, 9, h * .3 + lg, 3); c.fill(); rr(c, w * .1, h * .18, 9, h * .3 - lg, 3); c.fill();
    this.body(c, -w * .3, -h * .22, w * .6, h * .45, '#aeb8cf', 6); this.body(c, -w * .2, -h * .5, w * .4, h * .3, '#c4cde0', 5);
    c.fillStyle = '#ff3b3b'; rr(c, -w * .14, -h * .4, w * .28, h * .08, 3); c.fill(); c.globalAlpha = .45; circ(c, 0, -h * .36, 14, radial(c, 0, -h * .36, 0, 14, ['rgba(255,60,60,.9)', 'rgba(255,60,60,0)'])); c.globalAlpha = 1;
    c.strokeStyle = '#6a7388'; c.lineWidth = 3; c.beginPath(); c.moveTo(-w * .3, -h * .1); c.lineTo(-w * .44, h * .1 - lg); c.moveTo(w * .3, -h * .1); c.lineTo(w * .44, h * .1 + lg); c.stroke(); c.fillStyle = '#31d6c0'; c.fillRect(-w * .2, -h * .02, w * .4, 3);
  },
  v_gummy(c, w, h, t) {
    const sq = 1 + Math.sin(t * 7) * .06; c.save(); c.scale(1 / sq, sq); c.globalAlpha = .93;
    circ(c, -w * .26, -h * .38, w * .14, '#ff6a8a'); circ(c, w * .26, -h * .38, w * .14, '#ff6a8a'); ell(c, 0, h * .04, w * .3, h * .32, '#ff4b6e', '#a8123a', 1.6); circ(c, 0, -h * .26, w * .3, '#ff6a8a', '#a8123a', 1.6);
    for (const sg of [-1, 1]) { ell(c, sg * w * .34, h * .0, w * .1, h * .17, '#ff4b6e', '#a8123a', 1.4); ell(c, sg * w * .16, h * .36, w * .1, h * .15, '#ff4b6e', '#a8123a', 1.4); }
    c.globalAlpha = 1; circ(c, -5, -h * .28, 2.4, '#fff'); circ(c, 5, -h * .28, 2.4, '#fff'); circ(c, -5, -h * .28, 1.1, '#111'); circ(c, 5, -h * .28, 1.1, '#111'); ell(c, 0, -h * .2, 3.4, 2.4, '#7a1230'); ell(c, -8, -h * .4, 5, 3, 'rgba(255,255,255,.6)'); c.restore();
  },
  v_jelly(c, w, h, t) {
    const sq = 1 + Math.sin(t * 6) * .08; c.save(); c.scale(1 / sq, sq);
    rr(c, -w * .42, -h * .4, w * .84, h * .84, h * .3); c.fillStyle = grad(c, 0, -h * .4, 0, h * .4, ['rgba(160,255,200,.95)', 'rgba(60,200,140,.9)']); c.fill(); c.strokeStyle = '#1d7a52'; c.lineWidth = 1.8; c.stroke();
    ell(c, -w * .2, -h * .22, w * .12, h * .08, 'rgba(255,255,255,.7)'); circ(c, -6, -h * .02, 3, '#fff'); circ(c, 8, -h * .02, 3, '#fff'); circ(c, -6, -h * .02, 1.3, '#111'); circ(c, 8, -h * .02, 1.3, '#111'); c.strokeStyle = '#1d7a52'; c.lineWidth = 1.6; c.beginPath(); c.arc(1, h * .08, 5, .2, PI - .2); c.stroke(); c.restore();
  },
};

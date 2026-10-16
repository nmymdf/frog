'use strict';
/* =====================================================================
   水面平台、飛行怪、子彈、天降攻擊 的美術
   ===================================================================== */
const Plat = {
  foam(c, x, y, w, h, a = .5, col = '255,255,255') {
    c.save(); c.globalAlpha = a; c.strokeStyle = `rgba(${col},.9)`; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y + 2, w / 2 + 3, h / 2 + 2, 0, 0, TAU); c.stroke(); c.restore();
  },
  /* o = 平台物件；st = {dir, t, alpha, sink, shake, crack, down} */
  draw(c, o, x, y, st) {
    const t = st.t, w = o.w, f = this['p_' + o.kind];
    const sink = st.sink || 0;
    c.save();
    c.globalAlpha = (st.alpha === undefined ? 1 : st.alpha) * (1 - sink * .85);
    const bob = Math.sin(t * 2.2 + o.x0 * .05) * 1.6 + (st.shake ? Math.sin(t * 60) * 1.8 : 0) + sink * 8;
    c.translate(x, y + bob);
    if (sink > 0) c.scale(1 - sink * .12, 1 - sink * .12);
    if (f) f.call(this, c, w, t, st, o); else { rr(c, -w / 2, -14, w, 28, 8); c.fillStyle = '#a66'; c.fill(); }
    if (st.crack > 0) { // 裂痕
      c.strokeStyle = 'rgba(30,60,90,.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-w * .2, -12); c.lineTo(-w * .05, -2); c.lineTo(-w * .18, 8); c.moveTo(w * .15, -10); c.lineTo(w * .05, 0); c.lineTo(w * .2, 10); c.stroke();
    }
    c.restore();
  },
  p_log(c, w, t) {
    shadowEll(c, 0, 14, w * .48, 6, .22); this.foam(c, 0, 8, w, 20, .35);
    rr(c, -w / 2, -14, w, 28, 13); c.fillStyle = grad(c, 0, -14, 0, 14, ['#c98a4a', '#9a6330', '#6b4220']); c.fill(); c.lineWidth = 2; c.strokeStyle = '#3d2410'; c.stroke();
    c.strokeStyle = 'rgba(60,35,15,.45)'; c.lineWidth = 1.3; for (let x = -w / 2 + 14; x < w / 2 - 8; x += 18) { c.beginPath(); c.moveTo(x, -9); c.quadraticCurveTo(x + 5, 0, x, 9); c.stroke(); }
    for (const sg of [-1, 1]) { ell(c, sg * (w / 2 - 8), 0, 8, 12, '#e6b878', '#3d2410', 1.8); ell(c, sg * (w / 2 - 8), 0, 4.6, 7.4, null, '#a8763e', 1.2); circ(c, sg * (w / 2 - 8), 0, 1.6, '#a8763e'); }
    circ(c, -w * .12, -3, 3, '#6b4220', '#3d2410', 1); c.fillStyle = '#6fae4c'; c.beginPath(); c.ellipse(w * .15, -12, 11, 3, 0, 0, TAU); c.fill();
  },
  p_turtle(c, w, t, st, o) {
    const n = o.n || Math.round(w / 50), dive = st.dive || 0, d = st.dir || 1;
    for (let i = 0; i < n; i++) {
      const cx = -w / 2 + 25 + i * 50, sw = Math.sin(t * 5 + i) * 3;
      c.save(); c.translate(cx, 0); c.scale(1 - dive * .15, 1 - dive * .15); c.globalAlpha *= (1 - dive * .6);
      shadowEll(c, 0, 13, 20, 6, .2); this.foam(c, 0, 4, 44, 32, .35 * (1 - dive));
      c.save(); c.scale(d, 1);
      c.strokeStyle = '#2d8a3a'; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.moveTo(14, -10); c.lineTo(22, -16 + sw); c.moveTo(14, 10); c.lineTo(22, 16 - sw); c.moveTo(-14, -10); c.lineTo(-20, -15 - sw); c.moveTo(-14, 10); c.lineTo(-20, 15 + sw); c.stroke();
      ell(c, 25, 0, 9, 7, '#5ccf3a', '#1d5a12', 1.6); circ(c, 28, -3, 2.2, '#fff'); circ(c, 28.6, -3, 1, '#111'); c.strokeStyle = '#1d5a12'; c.lineWidth = 1.2; c.beginPath(); c.arc(28, 1, 3, .2, 2.2); c.stroke();
      ell(c, 0, 0, 20, 16, grad(c, 0, -16, 0, 16, ['#8a6a2a', '#5a4418']), '#2d2209', 1.8);
      ell(c, 0, 0, 16, 12, grad(c, 0, -12, 0, 12, ['#9fdc58', '#3ea83a']), '#1d5a12', 1.4);
      c.strokeStyle = '#1d5a12'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-8, -9); c.lineTo(-4, 0); c.lineTo(-8, 9); c.moveTo(8, -9); c.lineTo(4, 0); c.lineTo(8, 9); c.moveTo(-4, 0); c.lineTo(4, 0); c.stroke();
      ell(c, -5, -6, 4, 2, 'rgba(255,255,255,.4)'); c.restore();
      if (dive > .3) { c.fillStyle = 'rgba(255,255,255,.7)'; for (let k = 0; k < 3; k++) circ(c, -8 + k * 8, -dive * 10 - k * 3, 2 + k * .4, 'rgba(255,255,255,.6)'); }
      c.restore();
    }
    if (st.warn) { c.fillStyle = '#ffe14a'; ctxText(c, '!', 0, -24, 16, '#ffe14a', '#7a3d05'); }
  },
  p_lily(c, w, t, st, o) {
    shadowEll(c, 0, 12, 20, 6, .2); this.foam(c, 0, 4, 44, 34, .3);
    c.save(); c.rotate(Math.sin(t + o.x0) * .08); c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 22, .3, TAU - .3); c.closePath();
    c.fillStyle = grad(c, 0, -22, 0, 22, ['#7be04b', '#38a838']); c.fill(); c.strokeStyle = '#1d6a2a'; c.lineWidth = 1.8; c.stroke();
    c.strokeStyle = 'rgba(30,120,50,.55)'; c.lineWidth = 1.1; for (let i = 0; i < 7; i++) { const a = .55 + i * .75; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 19, Math.sin(a) * 19); c.stroke(); }
    ell(c, -7, -8, 6, 2.6, 'rgba(255,255,255,.35)'); c.restore();
    if ((o.x0 | 0) % 3 === 0) { for (let k = 0; k < 6; k++) { const a = k * TAU / 6; ell(c, Math.cos(a) * 5, Math.sin(a) * 4 - 2, 5, 3, '#ff9ad0', '#c4337a', 1); } circ(c, 0, -2, 3, '#ffe14a', '#a87a05', 1); }
  },
  p_croc(c, w, t, st, o) {
    const d = st.dir || 1; c.save(); c.scale(d, 1); shadowEll(c, 0, 14, w * .48, 6, .22); this.foam(c, 0, 5, w, 28, .3);
    const jaw = 1 + Math.sin(t * 2.5) * .5;
    c.beginPath(); c.moveTo(-w / 2, 0); c.quadraticCurveTo(-w / 2 + 14, -14, -w * .25, -14); c.lineTo(w * .14, -13); c.lineTo(w / 2 - 2, -8); c.lineTo(w / 2, 2 + jaw); c.lineTo(w * .14, 7); c.lineTo(-w * .25, 14); c.quadraticCurveTo(-w / 2 + 14, 14, -w / 2, 0);
    c.fillStyle = grad(c, 0, -14, 0, 14, ['#6fc25a', '#3d8f3a', '#2a6a2a']); c.fill(); c.lineWidth = 2; c.strokeStyle = '#143d14'; c.stroke();
    c.fillStyle = '#2a6a2a'; for (let x = -w / 2 + 14; x < w * .1; x += 12) { poly(c, [x, -8, x + 5, -15, x + 9, -8], '#2f7a2f', '#143d14', 1.2); }
    c.fillStyle = '#fff'; for (let x = w * .18; x < w / 2 - 4; x += 7) { poly(c, [x, -8, x + 3, -3, x + 6, -8], '#fff', '#555', .8); poly(c, [x, 6, x + 3, 1, x + 6, 6], '#fff', '#555', .8); }
    circ(c, w * .08, -11, 5, '#ffe14a', '#143d14', 1.4); ell(c, w * .09, -11, 1.2, 3.4, '#111'); circ(c, w * .08, 11, 3, '#ffe14a'); circ(c, w * .4, -3, 1.4, '#143d14'); c.restore();
  },
  p_plank(c, w, t) {
    shadowEll(c, 0, 12, w * .46, 5, .25); this.foam(c, 0, 6, w, 18, .25, '180,255,220');
    rr(c, -w / 2, -13, w, 26, 3); c.fillStyle = grad(c, 0, -13, 0, 13, ['#b8854f', '#8a5a2a']); c.fill(); c.lineWidth = 2; c.strokeStyle = '#3d2410'; c.stroke();
    c.strokeStyle = 'rgba(60,35,15,.5)'; c.lineWidth = 1.3; for (let y of [-4, 4]) { c.beginPath(); c.moveTo(-w / 2, y); c.lineTo(w / 2, y); c.stroke(); } for (let x = -w / 2 + 16; x < w / 2; x += 28) { c.beginPath(); c.moveTo(x, -13); c.lineTo(x, 13); c.stroke(); }
    for (const sg of [-1, 1]) for (const y of [-8, 8]) circ(c, sg * (w / 2 - 6), y, 1.8, '#555');
  },
  p_barrel(c, w, t, st, o) {
    shadowEll(c, 0, 14, 20, 6, .25); this.foam(c, 0, 6, 44, 34, .3, '180,255,220');
    circ(c, 0, 0, 21, radial(c, -5, -5, 3, 22, ['#c98a4a', '#8a5a2a']), '#3d2410', 2);
    c.save(); c.rotate(t * 1.2 * (o.x0 % 2 ? 1 : -1)); c.strokeStyle = '#555'; c.lineWidth = 3; circ(c, 0, 0, 16, null, '#666', 3); c.strokeStyle = '#3d2410'; c.lineWidth = 1.3; for (let i = 0; i < 6; i++) { c.rotate(PI / 3); c.beginPath(); c.moveTo(0, -16); c.lineTo(0, 16); c.stroke(); } c.restore();
    for (let i = 0; i < 3; i++) { const a = i * TAU / 3 - PI / 2; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 8, a - .5, a + .5); c.closePath(); c.fillStyle = '#ffd23a'; c.fill(); } circ(c, 0, 0, 2, '#3a2a0a');
  },
  p_boat(c, w, t) {
    shadowEll(c, 0, 12, w * .46, 5, .25); this.foam(c, 0, 5, w, 24, .3);
    c.beginPath(); c.moveTo(-w / 2, -6); c.quadraticCurveTo(-w / 2 + 6, 14, -w / 2 + 22, 14); c.lineTo(w / 2 - 22, 14); c.quadraticCurveTo(w / 2 - 6, 14, w / 2, -6); c.closePath(); c.fillStyle = grad(c, 0, -6, 0, 14, ['#e8352b', '#a8201a']); c.fill(); c.lineWidth = 2; c.strokeStyle = '#4a0c08'; c.stroke();
    rr(c, -w / 2 + 4, -10, w - 8, 8, 4); c.fillStyle = '#f4f4f0'; c.fill(); c.stroke(); rr(c, -6, -6, 12, 6, 2); c.fillStyle = '#8a5a2a'; c.fill();
    c.strokeStyle = '#8a5a2a'; c.lineWidth = 3; c.beginPath(); c.moveTo(-w * .2, -2); c.lineTo(-w * .38, -16 + Math.sin(t * 3) * 3); c.moveTo(w * .2, -2); c.lineTo(w * .38, -16 - Math.sin(t * 3) * 3); c.stroke();
  },
  p_floe(c, w, t, st, o) {
    shadowEll(c, 0, 14, w * .46, 6, .2); this.foam(c, 0, 4, w, 28, .4);
    const n = 9; c.beginPath(); for (let i = 0; i < n; i++) { const a = i * TAU / n, rx = w / 2 * (.88 + .12 * Math.sin(i * 2.7 + o.x0)), ry = 17 * (.85 + .15 * Math.cos(i * 3.3)); const px = Math.cos(a) * rx, py = Math.sin(a) * ry; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath();
    c.fillStyle = grad(c, 0, -17, 0, 17, ['#ffffff', '#d2ecfa', '#9fd0ee']); c.fill(); c.lineWidth = 2; c.strokeStyle = '#5a9ac8'; c.lineJoin = 'round'; c.stroke();
    ell(c, -w * .12, -6, w * .22, 4, 'rgba(255,255,255,.9)'); c.strokeStyle = 'rgba(120,180,225,.6)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(w * .1, 2); c.lineTo(w * .22, 8); c.moveTo(-w * .25, 4); c.lineTo(-w * .12, 10); c.stroke();
    if ((o.x0 | 0) % 4 === 0) { ell(c, w * .15, -4, 5, 7, '#23272f', '#0c0e12', 1.2); ell(c, w * .15, -2, 3, 5, '#fff'); circ(c, w * .15, -11, 3.6, '#23272f'); poly(c, [w * .15 + 3, -11, w * .15 + 7, -10, w * .15 + 3, -9], '#ff9a2a'); }
  },
  p_iceberg(c, w, t, st, o) {
    shadowEll(c, 0, 14, w * .46, 6, .2); this.foam(c, 0, 5, w, 30, .4);
    c.beginPath(); c.moveTo(-w / 2, 8); c.lineTo(-w * .38, -6); c.lineTo(-w * .2, -2); c.lineTo(-w * .08, -22); c.lineTo(w * .06, -8); c.lineTo(w * .2, -16); c.lineTo(w * .36, -2); c.lineTo(w / 2, 8); c.quadraticCurveTo(w * .3, 18, 0, 17); c.quadraticCurveTo(-w * .3, 18, -w / 2, 8); c.closePath();
    c.fillStyle = grad(c, 0, -22, 0, 17, ['#ffffff', '#cfe9f8', '#86bfe6']); c.fill(); c.lineWidth = 2; c.strokeStyle = '#4a86b4'; c.lineJoin = 'round'; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.7)'; poly(c, [-w * .08, -22, w * .06, -8, -w * .02, 0, -w * .14, -6], 'rgba(255,255,255,.8)');
  },
  p_narwhal(c, w, t, st, o) {
    const d = st.dir || 1; c.save(); c.scale(d, 1); shadowEll(c, 0, 14, w * .46, 6, .2); this.foam(c, 0, 5, w, 26, .4);
    poly(c, [w * .46, -4, w * .6, -2, w * .46, 2], '#fff6c8', '#a8946a', 1.4); c.strokeStyle = '#a8946a'; c.lineWidth = 1.2; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(w * .5 + i * 3, -3); c.lineTo(w * .5 + i * 3 - 1, 3); c.stroke(); }
    c.beginPath(); c.moveTo(-w / 2, 4); c.quadraticCurveTo(-w * .45, -14, -w * .2, -15); c.quadraticCurveTo(w * .3, -17, w * .46, -4); c.quadraticCurveTo(w * .4, 12, w * .2, 14); c.quadraticCurveTo(-w * .3, 16, -w / 2, 4);
    c.fillStyle = grad(c, 0, -17, 0, 15, ['#8fb0d0', '#5a7ea4', '#3b5a80']); c.fill(); c.lineWidth = 2; c.strokeStyle = '#1d3350'; c.stroke();
    poly(c, [-w / 2, 4, -w / 2 - 14, -8 + Math.sin(t * 3) * 3, -w / 2 - 6, 8], '#5a7ea4', '#1d3350', 1.6);
    c.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 6; i++) circ(c, -w * .3 + i * w * .12, -3 + (i % 2) * 6, 2, 'rgba(255,255,255,.45)'); circ(c, w * .34, -6, 2.6, '#fff'); circ(c, w * .35, -6, 1.2, '#111'); c.restore();
  },
  p_rock(c, w, t, st, o) {
    shadowEll(c, 0, 14, w * .46, 6, .3); c.globalAlpha *= 1; c.beginPath(); const n = 8;
    for (let i = 0; i < n; i++) { const a = i * TAU / n, rx = w / 2 * (.86 + .14 * Math.sin(i * 2.1 + o.x0)), ry = 17 * (.84 + .16 * Math.cos(i * 2.9)); const px = Math.cos(a) * rx, py = Math.sin(a) * ry; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath();
    c.fillStyle = grad(c, 0, -17, 0, 17, ['#6a5058', '#3a2a30', '#241a1e']); c.fill(); c.lineWidth = 2.4; c.strokeStyle = '#ff7a2a'; c.shadowColor = '#ff7a2a'; c.shadowBlur = 8; c.lineJoin = 'round'; c.stroke(); c.shadowBlur = 0;
    c.strokeStyle = 'rgba(255,140,40,.7)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-w * .2, -4); c.lineTo(-w * .02, 4); c.lineTo(w * .15, -2); c.stroke();
  },
  p_bigrock(c, w, t, st, o) { this.p_rock(c, w, t, st, o); ell(c, w * .15, -8, 9, 4, 'rgba(255,255,255,.12)'); },
  p_skullraft(c, w, t) {
    shadowEll(c, 0, 14, w * .46, 6, .3); c.strokeStyle = '#f1ecdc'; c.lineWidth = 7; c.lineCap = 'round'; for (let y of [-8, 0, 8]) { c.beginPath(); c.moveTo(-w / 2 + 6, y); c.lineTo(w / 2 - 6, y); c.stroke(); } c.strokeStyle = '#5b5546'; c.lineWidth = 1.4; for (let y of [-8, 0, 8]) { c.beginPath(); c.moveTo(-w / 2 + 6, y + 3); c.lineTo(w / 2 - 6, y + 3); c.stroke(); }
    for (const sg of [-1, 1]) { circ(c, sg * (w / 2 - 6), -8, 4.4, '#f1ecdc', '#5b5546', 1.2); circ(c, sg * (w / 2 - 6), 8, 4.4, '#f1ecdc', '#5b5546', 1.2); }
    ell(c, 0, -2, 11, 10, '#f1ecdc', '#5b5546', 1.6); ell(c, -4, -3, 2.8, 3.4, '#2a2420'); ell(c, 4, -3, 2.8, 3.4, '#2a2420'); poly(c, [0, 1, -1.5, 4, 1.5, 4], '#2a2420'); const g = .5 + Math.sin(t * 4) * .3; circ(c, -4, -3, 1.2, `rgba(255,120,40,${g})`); circ(c, 4, -3, 1.2, `rgba(255,120,40,${g})`);
  },
  p_asteroid(c, w, t, st, o) {
    c.save(); c.rotate(Math.sin(t * .6 + o.x0) * .15); shadowEll(c, 0, 14, w * .44, 6, .25); c.beginPath(); const n = 10;
    for (let i = 0; i < n; i++) { const a = i * TAU / n, rx = w / 2 * (.84 + .16 * Math.sin(i * 3.7 + o.x0)), ry = 17 * (.8 + .2 * Math.cos(i * 2.3)); const px = Math.cos(a) * rx, py = Math.sin(a) * ry; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath();
    c.fillStyle = grad(c, -w / 2, -17, w / 2, 17, ['#a89cb4', '#6a5e7c', '#40384e']); c.fill(); c.lineWidth = 2; c.strokeStyle = '#201a2c'; c.lineJoin = 'round'; c.stroke();
    for (const [px, py, r] of [[-.2, -.2, 5], [.15, .1, 4], [-.05, .3, 3]]) { ell(c, w * px, 17 * py, r, r * .7, '#4a4058', '#201a2c', 1); ell(c, w * px - 1, 17 * py - 1, r * .6, r * .4, 'rgba(255,255,255,.18)'); }
    c.restore();
  },
  p_hoverpad(c, w, t, st, o) {
    c.globalAlpha *= st.blink === undefined ? 1 : st.blink; c.globalAlpha *= 1;
    c.globalAlpha *= .5; ell(c, 0, 16, w * .4, 4 + Math.sin(t * 10) * 1.2, '#31d6c0'); c.globalAlpha /= .5;
    rr(c, -w / 2, -13, w, 26, 8); c.fillStyle = grad(c, 0, -13, 0, 13, ['#6a7aa8', '#2e3a66']); c.fill(); c.lineWidth = 2; c.strokeStyle = '#141a38'; c.stroke();
    c.fillStyle = '#31d6c0'; c.shadowColor = '#31d6c0'; c.shadowBlur = 6; c.fillRect(-w / 2 + 8, -2, w - 16, 3); c.shadowBlur = 0;
    for (let i = 0; i < 4; i++) { const on = Math.floor(t * 5 + i) % 2; circ(c, -w / 2 + 10 + i * (w - 20) / 3, -8, 2, on ? '#ffe14a' : '#6a5a10'); circ(c, -w / 2 + 10 + i * (w - 20) / 3, 8, 2, on ? '#6a5a10' : '#ffe14a'); }
  },
  p_satellite(c, w, t) {
    shadowEll(c, 0, 14, w * .4, 5, .2);
    for (const sg of [-1, 1]) { c.save(); c.translate(sg * (w * .24), 0); rr(c, -w * .17, -12, w * .34, 24, 2); c.fillStyle = grad(c, 0, -12, 0, 12, ['#3a6ee0', '#1c3a8a']); c.fill(); c.strokeStyle = '#cfe0ff'; c.lineWidth = 1.4; c.stroke(); c.strokeStyle = 'rgba(200,225,255,.6)'; c.lineWidth = 1; for (let x = -w * .1; x <= w * .1; x += w * .068) { c.beginPath(); c.moveTo(x, -12); c.lineTo(x, 12); c.stroke(); } c.beginPath(); c.moveTo(-w * .17, 0); c.lineTo(w * .17, 0); c.stroke(); c.restore(); }
    rr(c, -w * .12, -12, w * .24, 24, 5); c.fillStyle = grad(c, 0, -12, 0, 12, ['#e8eefc', '#9aa8cc']); c.fill(); c.strokeStyle = '#2e3552'; c.lineWidth = 2; c.stroke(); circ(c, 0, 0, 5, '#31d6c0', '#1d7a6c', 1.4); const on = Math.floor(t * 4) % 2; circ(c, 0, -9, 1.8, on ? '#ff4b4b' : '#6a1c1c');
  },
  p_wafer(c, w, t) {
    shadowEll(c, 0, 14, w * .46, 6, .25); this.foam(c, 0, 6, w, 20, .3, '255,230,190');
    rr(c, -w / 2, -14, w, 28, 6); c.fillStyle = grad(c, 0, -14, 0, 14, ['#f2cf88', '#d9a84a', '#b5802a']); c.fill(); c.lineWidth = 2; c.strokeStyle = '#6e4510'; c.stroke();
    c.strokeStyle = 'rgba(138,90,20,.6)'; c.lineWidth = 1.2; for (let x = -w / 2 + 10; x < w / 2; x += 10) { c.beginPath(); c.moveTo(x, -13); c.lineTo(x, 13); c.stroke(); } for (let y of [-5, 5]) { c.beginPath(); c.moveTo(-w / 2, y); c.lineTo(w / 2, y); c.stroke(); }
    c.save(); rr(c, -w / 2, -14, w, 28, 6); c.clip(); c.fillStyle = '#5a2f18'; c.fillRect(-w / 2, -14, 16, 28); c.fillRect(w / 2 - 16, -14, 16, 28); c.restore();
  },
  p_donut(c, w, t, st, o) {
    shadowEll(c, 0, 14, 24, 6, .25); this.foam(c, 0, 4, 52, 38, .3, '255,230,190'); c.save(); c.rotate(Math.sin(t * .8 + o.x0) * .12);
    circ(c, 0, 0, 25, grad(c, -20, -20, 20, 20, ['#f0b868', '#c98a3a']), '#7a4a10', 2); circ(c, 0, 0, 22, grad(c, -20, -20, 20, 20, ['#ff9ad0', '#f0599f']), '#a8266a', 1.6);
    const sc = ['#fff', '#ffe14a', '#4bd1ff', '#8bf05a', '#b07bff']; for (let i = 0; i < 12; i++) { c.save(); c.rotate(i * TAU / 12 + .2); c.translate(14 + (i % 2) * 3, 0); c.fillStyle = sc[i % 5]; rr(c, -3.2, -1, 6.4, 2, 1); c.fill(); c.restore(); }
    circ(c, 0, 0, 8, radial(c, 0, 0, 2, 8, ['#5a2f18', '#7b4424']), '#7a4a10', 1.4); c.restore();
  },
  p_marshmallow(c, w, t, st, o) {
    shadowEll(c, 0, 14, w * .44, 6, .22); this.foam(c, 0, 5, w, 28, .3, '255,230,190');
    rr(c, -w / 2, -15, w, 30, 13); c.fillStyle = grad(c, 0, -15, 0, 15, ['#ffffff', '#ffe6f2', '#ffc2e0']); c.fill(); c.lineWidth = 2; c.strokeStyle = '#d98ab4'; c.stroke();
    ell(c, -w * .15, -8, w * .22, 4, 'rgba(255,255,255,.9)'); c.fillStyle = 'rgba(217,138,180,.4)'; c.fillRect(-w * .3, 4, 3, 5); c.fillRect(w * .2, 2, 3, 6);
  },
};

/* ---------------------------------------------------------------------
   飛行怪 (x,y 為中心，dx 為水平方向 ±1)
   --------------------------------------------------------------------- */
const Fly = {
  draw(c, kind, x, y, dx, t, scale = 1) {
    c.save(); c.translate(x, y); c.scale(dx * scale, scale);
    const fl = Math.sin(t * 40);
    switch (kind) {
      case 'bee': { // 蜜蜂
        shadowEll(c, 0, 24, 11, 4, .2);
        for (const sg of [-1, 1]) { c.save(); c.rotate(sg * (.5 + fl * .5)); ell(c, 0, -10, 6, 12, 'rgba(220,245,255,.85)', '#8fb4cc', 1.2); c.restore(); }
        ell(c, 0, 0, 11, 14, '#ffd21e', '#5a3a05', 1.6); c.fillStyle = '#2a1c05'; c.fillRect(-10, -2, 20, 4.5); c.fillRect(-9, 6, 18, 3.5);
        circ(c, 11, -4, 7, '#ffd21e', '#5a3a05', 1.6); circ(c, 13, -6, 2.4, '#fff'); circ(c, 14, -6, 1.1, '#111'); poly(c, [-9, 12, -15, 18, -6, 15], '#2a1c05');
        c.strokeStyle = '#2a1c05'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(12, -10); c.lineTo(16, -17); c.stroke(); break;
      }
      case 'pigeon': { // 鴿子 / 無人機
        shadowEll(c, 0, 24, 13, 4, .2);
        for (const sg of [-1, 1]) { c.save(); c.translate(0, -2); c.rotate(sg * (.3 + fl * .4)); poly(c, [0, 0, -16, -14 * sg, -22, -3 * sg, -6, 8 * sg], '#a8aec0', '#4a5060', 1.4); c.restore(); }
        ell(c, 0, 0, 14, 9, '#b8bece', '#4a5060', 1.6); circ(c, 13, -4, 6, '#c8cede', '#4a5060', 1.6); poly(c, [18, -5, 25, -3, 18, -1], '#ff9a2a', '#a8520a', 1); circ(c, 15, -6, 1.6, '#e8352b'); circ(c, 15.4, -6, .8, '#111');
        ell(c, -2, 1, 8, 4, '#8a90a4'); poly(c, [-13, 0, -24, -3, -24, 5], '#8a90a4', '#4a5060', 1.2); break;
      }
      case 'snowowl': { // 雪鴞
        shadowEll(c, 0, 26, 14, 4, .2);
        for (const sg of [-1, 1]) { c.save(); c.translate(0, -2); c.rotate(sg * (.25 + fl * .35)); poly(c, [0, 0, -4, -22 * sg, -16, -18 * sg, -22, -4 * sg, -8, 6 * sg], '#f4f8fc', '#8fa6bd', 1.4); c.restore(); }
        ell(c, 0, 0, 12, 14, '#fff', '#8fa6bd', 1.6); circ(c, 8, -10, 9, '#fff', '#8fa6bd', 1.6); poly(c, [3, -17, 5, -23, 8, -17], '#fff', '#8fa6bd', 1); circ(c, 11, -11, 3.6, '#ffe14a', '#8a6a10', 1); circ(c, 11.6, -11, 1.8, '#111'); poly(c, [14, -8, 18, -6, 14, -5], '#ff9a2a'); c.fillStyle = 'rgba(120,150,190,.35)'; for (let i = 0; i < 4; i++) c.fillRect(-6 + i * 4, 0 + (i % 2) * 4, 2, 4); break;
      }
      case 'firebat': { // 火蝙蝠
        c.globalAlpha = .55; circ(c, 0, 0, 26, radial(c, 0, 0, 0, 26, ['rgba(255,140,40,.8)', 'rgba(255,140,40,0)'])); c.globalAlpha = 1;
        for (const sg of [-1, 1]) { c.save(); c.translate(0, -2); c.rotate(sg * (.15 + fl * .45)); c.beginPath(); c.moveTo(0, 0); c.lineTo(-10, -22 * sg); c.quadraticCurveTo(-18, -12 * sg, -20, -20 * sg); c.quadraticCurveTo(-26, -6 * sg, -22, 0); c.quadraticCurveTo(-14, 2 * sg, -8, 8 * sg); c.closePath(); c.fillStyle = '#4a1c18'; c.fill(); c.strokeStyle = '#ff7a2a'; c.lineWidth = 1.6; c.stroke(); c.restore(); }
        ell(c, 0, 0, 9, 11, '#6a2420', '#ff7a2a', 1.6); circ(c, 7, -7, 7, '#7a2c26', '#ff7a2a', 1.6); poly(c, [3, -12, 4, -19, 8, -13], '#6a2420', '#ff7a2a', 1.2); poly(c, [9, -13, 13, -19, 12, -11], '#6a2420', '#ff7a2a', 1.2); circ(c, 10, -8, 2.2, '#ffe14a'); circ(c, 4, -8, 2.2, '#ffe14a'); poly(c, [7, -2, 9, 2, 11, -2], '#fff'); break;
      }
      case 'ufo': { // 小飛碟
        c.globalAlpha = .18; poly(c, [-8, 8, 8, 8, 16, 36, -16, 36], '#9fffe0'); c.globalAlpha = 1;
        ell(c, 0, 2, 18, 7, grad(c, 0, -5, 0, 9, ['#e8eef8', '#8f9bbd']), '#2e3552', 1.6); c.beginPath(); c.arc(0, -1, 9, PI, TAU); c.fillStyle = 'rgba(150,240,200,.7)'; c.fill(); c.stroke(); circ(c, 0, -6, 3.4, '#7ee05a', '#2a6a1c', 1); for (let i = 0; i < 4; i++) circ(c, -11 + i * 7.3, 4, 1.6, Math.floor(t * 8 + i) % 2 ? '#ffe14a' : '#6a5a10'); break;
      }
      case 'candybird': { // 糖果鳥
        shadowEll(c, 0, 24, 12, 4, .2);
        for (const sg of [-1, 1]) { c.save(); c.translate(0, -2); c.rotate(sg * (.3 + fl * .4)); poly(c, [0, 0, -4, -18 * sg, -16, -16 * sg, -18, -2 * sg, -6, 6 * sg], '#ff9ad0', '#a8266a', 1.4); circ(c, -10, -10 * sg, 2.4, '#fff'); c.restore(); }
        circ(c, 0, 0, 12, grad(c, 0, -12, 0, 12, ['#ff6aa8', '#c4337a']), '#7a1248', 1.6); circ(c, 8, -5, 8, '#ff6aa8', '#7a1248', 1.6); poly(c, [14, -6, 22, -4, 14, -2], '#ffe14a', '#a8780a', 1); circ(c, 11, -7, 2.2, '#fff'); circ(c, 11.6, -7, 1, '#111'); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(-1, 3, 6, 0, PI); c.stroke(); poly(c, [-11, 2, -22, -2, -20, 8], '#ff9ad0', '#a8266a', 1.2); break;
      }
      case 'hawk': { // 鷹（發呆時抓你）
        shadowEll(c, 0, 34, 20, 6, .25);
        for (const sg of [-1, 1]) { c.save(); c.translate(0, -2); c.rotate(sg * (.2 + fl * .3)); poly(c, [0, 0, -8, -30 * sg, -26, -26 * sg, -34, -6 * sg, -10, 8 * sg], '#8a5a30', '#3d2410', 1.8); for (let i = 0; i < 4; i++) { c.strokeStyle = '#3d2410'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-8 - i * 6, -8 * sg); c.lineTo(-12 - i * 6, -26 * sg + i * 2 * sg); c.stroke(); } c.restore(); }
        ell(c, 0, 0, 16, 12, '#a8703e', '#3d2410', 1.8); ell(c, 4, 3, 10, 6, '#f2e0c0'); circ(c, 16, -5, 8, '#fff', '#3d2410', 1.6); poly(c, [22, -6, 30, -2, 22, 0], '#ffd23a', '#8a6a10', 1.4); circ(c, 19, -7, 2.8, '#ffe14a', '#222', 1); circ(c, 19.6, -7, 1.2, '#111'); poly(c, [12, -13, 20, -11, 14, -9], '#3d2410'); poly(c, [-14, 0, -30, -4, -30, 8], '#8a5a30', '#3d2410', 1.4); break;
      }
    }
    c.restore();
  },
};

/* ---------------------------------------------------------------------
   子彈
   --------------------------------------------------------------------- */
const ProjArt = {
  draw(c, p, x, y, t) {
    c.save(); c.translate(x, y);
    switch (p.type) {
      case 'bubble': { const r = 7 + Math.sin(t * 20 + x) * .6; circ(c, 0, 0, r, 'rgba(160,230,255,.5)', '#fff', 1.8); ell(c, -2.4, -2.4, 2.4, 1.4, 'rgba(255,255,255,.95)'); break; }
      case 'spread': { circ(c, 0, 0, 6, 'rgba(200,180,255,.55)', '#fff', 1.6); ell(c, -2, -2, 2, 1.2, 'rgba(255,255,255,.95)'); break; }
      case 'fire': { c.rotate(Math.atan2(p.vy, p.vx) + PI / 2); c.globalAlpha = .5; circ(c, 0, 4, 16, radial(c, 0, 4, 0, 16, ['rgba(255,150,40,.9)', 'rgba(255,150,40,0)'])); c.globalAlpha = 1; Icons.flame(c, 0, 2, 24); break; }
      case 'ice': { c.rotate(Math.atan2(p.vy, p.vx) + PI / 2); c.globalAlpha = .5; circ(c, 0, 0, 14, radial(c, 0, 0, 0, 14, ['rgba(170,240,255,.9)', 'rgba(170,240,255,0)'])); c.globalAlpha = 1; poly(c, [0, -12, 6, 0, 0, 12, -6, 0], '#dff8ff', '#2b9ac8', 1.6); break; }
      case 'boomerang': { Icons.boomerang(c, 0, 0, 24, t * 1.2); break; }
      case 'boss': { c.globalAlpha = .45; circ(c, 0, 0, p.r + 8, radial(c, 0, 0, 0, p.r + 8, [rgba(p.col, .9), rgba(p.col, 0)])); c.globalAlpha = 1; circ(c, 0, 0, p.r, radial(c, -2, -2, 1, p.r, [shade(p.col, .6), p.col, shade(p.col, -.4)]), shade(p.col, -.6), 1.8); break; }
    }
    c.restore();
  },
};

/* ---------------------------------------------------------------------
   天降攻擊：預警圈與命中效果。k = 0..1 預警進度；hit = 命中時間 0..1
   --------------------------------------------------------------------- */
const StrikeArt = {
  warn(c, kind, x, y, k, t) { // 地面上的紅圈
    c.save(); c.translate(x, y);
    const pulse = .5 + Math.sin(t * 20) * .2;
    c.globalAlpha = .25 + .35 * k; ell(c, 0, 0, 24, 15, '#ff2b2b');
    c.globalAlpha = .9; c.strokeStyle = '#ff5a5a'; c.lineWidth = 2.6; c.beginPath(); c.ellipse(0, 0, 22 - 8 * k, 13.5 - 5 * k, 0, 0, TAU); c.stroke();
    c.globalAlpha = pulse + .3; ctxText(c, '!', 0, -2, 18, '#fff', '#c01010');
    c.restore();
  },
  fall(c, kind, x, y, k) { // 掉落中的物體（y 是目標點，k=0..1 到地）
    const h = (1 - k) * 260; c.save(); c.translate(x, y - h);
    switch (kind) {
      case 'acorn': ell(c, 0, 2, 11, 13, '#a8672e', '#5a3410', 1.8); c.beginPath(); c.ellipse(0, -8, 12, 8, 0, PI, TAU); c.fillStyle = '#6b4220'; c.fill(); c.stroke(); rr(c, -1.5, -20, 3, 6, 1); c.fillStyle = '#6b4220'; c.fill(); break;
      case 'icicle': poly(c, [-8, -26, 8, -26, 0, 20], grad(c, 0, -26, 0, 20, ['#ffffff', '#9fd8f5']), '#4a86b4', 1.8); ell(c, -2, -14, 1.6, 8, 'rgba(255,255,255,.8)'); break;
      case 'meteor': c.globalAlpha = .6; poly(c, [-10, -60, 10, -60, 7, -6, -7, -6], 'rgba(255,150,40,.6)'); c.globalAlpha = 1; circ(c, 0, 0, 13, radial(c, -3, -3, 2, 14, ['#c4a89a', '#6a4a42', '#3a2420']), '#201010', 1.8); Icons.flame(c, 0, -22, 26); break;
      case 'gumdrop': circ(c, 0, 0, 12, radial(c, -3, -3, 2, 13, ['#ffd0e8', '#ff4b8b', '#b0245a']), '#7c1248', 1.8); ell(c, -4, -5, 3, 2, 'rgba(255,255,255,.8)'); break;
      default: circ(c, 0, 0, 11, '#c33');
    }
    c.restore();
  },
  impact(c, kind, x, y, k) { // 命中閃光（k=0..1）
    c.save(); c.translate(x, y); const a = 1 - k; c.globalAlpha = a;
    const col = { acorn: '#ffd27a', icicle: '#bfefff', meteor: '#ff9a3a', gumdrop: '#ff9ad0', geyser: '#ff7a2a', laser: '#ff3b3b' }[kind] || '#fff';
    ell(c, 0, 0, 10 + 40 * k, 6 + 24 * k, rgba(col, .6), col, 3);
    for (let i = 0; i < 8; i++) { const ang = i * TAU / 8; circ(c, Math.cos(ang) * (10 + 40 * k), Math.sin(ang) * (6 + 22 * k) - k * 10, 3 * a + 1, col); }
    c.restore();
  },
  geyser(c, x, y, k, t) { // 岩漿 / 水柱噴發（站在 x,y 往上噴）
    const h = Math.sin(clamp(k, 0, 1) * PI) * 120 + 20;
    c.save(); c.translate(x, y);
    const g = c.createLinearGradient(0, 0, 0, -h); g.addColorStop(0, '#ffd27a'); g.addColorStop(.5, '#ff7a2a'); g.addColorStop(1, 'rgba(255,60,20,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(-16, 0); c.quadraticCurveTo(-10, -h * .6, -4, -h); c.lineTo(4, -h); c.quadraticCurveTo(10, -h * .6, 16, 0); c.closePath(); c.fill();
    for (let i = 0; i < 8; i++) { const p = ((t * 3 + i / 8) % 1); circ(c, Math.sin(i * 5) * 14, -p * h, 3 + (1 - p) * 3, i % 2 ? '#ffe9a0' : '#ff6a2a'); } c.restore();
  },
  laser(c, x, yTop, yBot, k, t) { // 垂直雷射
    c.save(); const w = 10 + Math.sin(t * 50) * 2.5;
    c.globalAlpha = .9; c.fillStyle = grad(c, x - w, 0, x + w, 0, ['rgba(255,40,40,0)', '#ff5a5a', '#fff', '#ff5a5a', 'rgba(255,40,40,0)']); c.fillRect(x - w, yTop, w * 2, yBot - yTop);
    c.shadowColor = '#ff3030'; c.shadowBlur = 14; c.fillStyle = '#fff'; c.fillRect(x - 2, yTop, 4, yBot - yTop); c.restore();
  },
};

'use strict';
/* =====================================================================
   六隻魔王：蟾蜍國王 / 垃圾車機器人 / 雪怪巨人 / 火龍 / 外星母艦 / 蛋糕怪獸
   座標：原點在魔王中心，寬約 ±100，高約 ±55
   st = {t, flash(0..1), open(0..1 蓄力張嘴), hpk(0..1), rage}
   ===================================================================== */
const BossArt = {
  names: { toad: '蟾蜍國王', robo: '垃圾車大王', yeti: '雪怪巨人', dragon: '火龍', mother: '外星母艦', cake: '蛋糕怪獸' },
  draw(c, kind, x, y, st) {
    c.save(); c.translate(x, y);
    const bob = Math.sin(st.t * 2) * 2.5; c.translate(0, bob);
    shadowEll(c, 0, 58 - bob, 96, 10, .3);
    if (st.flash > 0) c.filter = `brightness(${1 + st.flash * 1.6}) saturate(${1 - st.flash * .5})`;
    const f = this['b_' + kind]; if (f) f.call(this, c, st);
    c.filter = 'none';
    if (st.rage) { c.globalAlpha = .12 + Math.sin(st.t * 12) * .06; ell(c, 0, 0, 110, 66, '#ff2b2b'); c.globalAlpha = 1; }
    c.restore();
  },
  /* ---- 1 蟾蜍國王 ---- */
  b_toad(c, st) {
    const t = st.t, op = st.open, br = 1 + Math.sin(t * 3) * .02 + op * .06;
    // 後腿
    for (const sg of [-1, 1]) { ell(c, sg * 72, 30, 28, 22, '#4a9a34', '#1d4a14', 2.4); ell(c, sg * 84, 48, 24, 8, '#6cc04a', '#1d4a14', 2); }
    // 身體
    c.save(); c.scale(br, br);
    ell(c, 0, 18, 86, 42, grad(c, 0, -20, 0, 60, ['#78c850', '#4a9a34', '#2d6a22']), '#1d4a14', 3);
    ell(c, 0, 30, 54, 26, grad(c, 0, 10, 0, 56, ['#f2f7b8', '#d8e68a']), 'rgba(40,80,20,.5)', 1.6);
    for (const [wx, wy, r] of [[-56, 8, 5], [-40, -6, 4], [48, 2, 5], [62, 16, 4], [-64, 26, 4], [36, -10, 3.4]]) circ(c, wx, wy, r, '#3a8a2a', '#1d4a14', 1.2);
    // 披風領
    c.beginPath(); c.moveTo(-60, 4); c.quadraticCurveTo(0, 30, 60, 4); c.lineTo(70, 16); c.quadraticCurveTo(0, 44, -70, 16); c.closePath(); c.fillStyle = '#c0282f'; c.fill(); c.strokeStyle = '#6e0c12'; c.lineWidth = 2.4; c.stroke();
    c.fillStyle = '#fff'; for (let i = -5; i <= 5; i++) circ(c, i * 11, 14 + Math.abs(i) * 1.1 - Math.cos(i * .3) * -3, 3, '#f4efe0');
    // 頭
    ell(c, 0, -14, 62, 34, grad(c, 0, -46, 0, 18, ['#8fd860', '#5ab03e']), '#1d4a14', 3);
    // 眼睛
    for (const sg of [-1, 1]) { circ(c, sg * 34, -42, 17, '#6cc04a', '#1d4a14', 2.6); circ(c, sg * 34, -42, 13, '#fff', '#1d4a14', 1.6); const lx = Math.sin(t * .7) * 3; circ(c, sg * 34 + lx, -41, 7, '#ffd21e', '#1d1d1d', 1.2); ell(c, sg * 34 + lx, -41, 2.4, 6.4, '#111'); circ(c, sg * 34 + lx - 2, -45, 2, '#fff'); if (st.hpk < .35) { c.strokeStyle = '#c0282f'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(sg * 34 - 10, -46); c.lineTo(sg * 34 + 2, -40); c.stroke(); } }
    ell(c, -12, -14, 3, 2, '#1d4a14'); ell(c, 12, -14, 3, 2, '#1d4a14');
    // 嘴巴
    c.beginPath(); c.moveTo(-48, -2); c.quadraticCurveTo(0, 14 + op * 18, 48, -2); c.quadraticCurveTo(0, -4 + op * 30, -48, -2); c.fillStyle = op > .05 ? '#6e0c20' : '#1d4a14'; c.fill(); c.strokeStyle = '#1d4a14'; c.lineWidth = 2.6; c.stroke();
    if (op > .2) { ell(c, 0, 8 + op * 8, 26, 6 + op * 5, '#ff7a92'); c.fillStyle = '#fff'; for (let i = -3; i <= 3; i++) if (i) poly(c, [i * 12 - 3, 2, i * 12 + 3, 2, i * 12, 8], '#fff'); }
    ell(c, -42, 0, 8, 5, 'rgba(255,110,140,.5)'); ell(c, 42, 0, 8, 5, 'rgba(255,110,140,.5)'); c.restore();
    // 皇冠
    poly(c, [-28, -52, -32, -78, -16, -64, 0, -86, 16, -64, 32, -78, 28, -52], grad(c, 0, -86, 0, -52, ['#fff08a', '#f0a81c']), '#8c5a06', 2.6);
    circ(c, 0, -86, 4.4, '#ff4b6e', '#8c5a06', 1.4); circ(c, -32, -78, 3.4, '#44e0ff', '#8c5a06', 1.2); circ(c, 32, -78, 3.4, '#44e0ff', '#8c5a06', 1.2); c.fillStyle = '#d4820d'; c.fillRect(-28, -56, 56, 6);
    // 前腳
    for (const sg of [-1, 1]) { ell(c, sg * 44, 50, 22, 10, '#6cc04a', '#1d4a14', 2.2); for (let i = -1; i <= 1; i++) circ(c, sg * 44 + i * 9, 56, 4.4, '#8fd860', '#1d4a14', 1.2); }
  },
  /* ---- 2 垃圾車機器人 ---- */
  b_robo(c, st) {
    const t = st.t, op = st.open;
    for (let i = 0; i < 3; i++) { const p = (t * .8 + i / 3) % 1; c.globalAlpha = (1 - p) * .5; circ(c, 70 + p * 20, -54 - p * 30, 8 + p * 10, '#777'); } c.globalAlpha = 1;
    for (const x of [-64, -22, 24, 64]) { circ(c, x, 46, 16, '#1c1f26'); circ(c, x, 46, 9, '#aab4c0', '#555', 1.5); c.save(); c.translate(x, 46); c.rotate(t * 2); c.strokeStyle = '#555'; c.lineWidth = 2; for (let i = 0; i < 3; i++) { c.rotate(PI / 3); c.beginPath(); c.moveTo(-8, 0); c.lineTo(8, 0); c.stroke(); } c.restore(); }
    // 垃圾箱
    rr(c, -96, -34, 84, 74, 8); c.fillStyle = grad(c, 0, -34, 0, 40, ['#5aa86a', '#2f7a44']); c.fill(); c.lineWidth = 3; c.strokeStyle = '#143d20'; c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 2; for (let x = -80; x < -20; x += 16) { c.beginPath(); c.moveTo(x, -30); c.lineTo(x, 36); c.stroke(); }
    rr(c, -100, -42, 92, 12, 4); c.fillStyle = '#7ac88a'; c.fill(); c.stroke(); for (let i = 0; i < 4; i++) { circ(c, -80 + i * 16, -46 + Math.sin(i * 2 + t) * 2, 5 + i % 2 * 2, ['#ff7a7a', '#ffe14a', '#8ad0ff', '#e8e0cc'][i], '#333', 1); }
    // 駕駛艙 = 機器人頭
    rr(c, -16, -62, 104, 100, 10); c.fillStyle = grad(c, 0, -62, 0, 38, ['#c8d0e0', '#8a96b4']); c.fill(); c.lineWidth = 3.4; c.strokeStyle = '#2e3552'; c.stroke();
    rr(c, -6, -50, 84, 40, 6); c.fillStyle = '#10142a'; c.fill(); c.stroke();
    for (const sg of [-1, 1]) { const ex = 36 + sg * 20; circ(c, ex, -30, 12, '#ff3b3b'); c.globalAlpha = .5; circ(c, ex, -30, 22, radial(c, ex, -30, 0, 22, ['rgba(255,60,60,.9)', 'rgba(255,60,60,0)'])); c.globalAlpha = 1; circ(c, ex, -30, 5, '#fff3f3'); if (st.hpk < .35) poly(c, [ex - 14, -46, ex + 14, -38 * (sg < 0 ? 1 : 1), ex + 14, -44], '#10142a'); }
    // 嘴 / 垃圾口
    rr(c, 2, -2, 70, 22 + op * 12, 5); c.fillStyle = op > .05 ? '#ff7a2a' : '#4a5270'; c.fill(); c.stroke(); c.fillStyle = '#fff'; for (let x = 6; x < 70; x += 10) c.fillRect(x, -1, 5, 6 + op * 4);
    // 機械手臂
    c.strokeStyle = '#6a7388'; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.moveTo(80, 10); c.lineTo(100, -10 + Math.sin(t * 2) * 6); c.stroke(); poly(c, [100, -22, 112, -10, 100, 2], '#c8d0e0', '#2e3552', 2);
    circ(c, 68, -66, 5, Math.floor(t * 6) % 2 ? '#ffd23a' : '#7a5a10', '#333', 1.2);
  },
  /* ---- 3 雪怪 ---- */
  b_yeti(c, st) {
    const t = st.t, op = st.open;
    // 身體毛皮
    c.beginPath(); c.moveTo(-84, 46); for (let i = 0; i <= 12; i++) { const a = PI + i * PI / 12; c.lineTo(Math.cos(a) * 86 + (i % 2 ? 4 : -2), 46 + Math.sin(a) * 74 + (i % 2) * 5); } c.lineTo(84, 46); c.closePath();
    c.fillStyle = grad(c, 0, -30, 0, 56, ['#ffffff', '#dfeaf6', '#b6c8de']); c.fill(); c.lineWidth = 3; c.strokeStyle = '#6f87a6'; c.lineJoin = 'round'; c.stroke();
    // 手臂（高舉）
    for (const sg of [-1, 1]) { const raise = Math.sin(t * 2 + (sg > 0 ? 1 : 0)) * 6 + op * 18; c.save(); c.translate(sg * 74, 4); c.rotate(sg * (-.4 - op * .3)); ell(c, 0, -14 - raise * .3, 20, 38, '#f4f9ff', '#6f87a6', 2.6); for (let i = -1; i <= 1; i++) { poly(c, [i * 8 - 4, -48 - raise * .3, i * 8, -62 - raise * .3, i * 8 + 4, -48 - raise * .3], '#fff', '#6f87a6', 1.4); } c.restore(); }
    // 臉
    ell(c, 0, -8, 50, 44, '#f4f9ff', '#6f87a6', 2.8); ell(c, 0, -4, 34, 28, grad(c, 0, -30, 0, 22, ['#8fd0f2', '#5aa8dc']), '#2b6a9a', 2.2);
    for (const sg of [-1, 1]) { ell(c, sg * 15, -12, 8, 10, '#fff', '#2b6a9a', 1.6); circ(c, sg * 15 + Math.sin(t) * 1.4, -11, 4, '#1c2a4a'); circ(c, sg * 15 - 1, -13, 1.4, '#fff'); poly(c, [sg * 4, -26, sg * 28, -24 - (st.hpk < .35 ? -5 : 4) * sg * -0, sg * 26, -28], '#f4f9ff', '#6f87a6', 1.6); }
    ell(c, 0, -2, 4, 3, '#2b4a6a');
    c.beginPath(); c.moveTo(-22, 8); c.quadraticCurveTo(0, 14 + op * 22, 22, 8); c.quadraticCurveTo(0, 4 + op * 34, -22, 8); c.fillStyle = '#4a1c2a'; c.fill(); c.strokeStyle = '#2b4a6a'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#fff'; for (const sg of [-1, 1]) poly(c, [sg * 12 - 3, 8, sg * 12 + 3, 8, sg * 12, 18 + op * 5], '#fff', '#6f87a6', 1);
    // 冰角 / 冰冠
    for (const [x, h] of [[-36, 26], [-18, 36], [0, 44], [18, 36], [36, 26]]) poly(c, [x - 7, -42, x, -42 - h, x + 7, -42], grad(c, 0, -42 - h, 0, -42, ['#ffffff', '#8fd0f2']), '#2b78a3', 1.8);
    if (op > .2) for (let i = 0; i < 6; i++) { const p = ((t * 2 + i / 6) % 1); c.globalAlpha = (1 - p) * .6; circ(c, Math.sin(i * 5) * 12, 16 + p * 30, 4 + p * 8, '#e8fbff'); } c.globalAlpha = 1;
  },
  /* ---- 4 火龍 ---- */
  b_dragon(c, st) {
    const t = st.t, op = st.open, fl = Math.sin(t * 3) * .1;
    for (const sg of [-1, 1]) { c.save(); c.translate(sg * 40, -6); c.rotate(sg * (.1 + fl)); c.beginPath(); c.moveTo(0, 0); c.lineTo(sg * 60, -50); c.quadraticCurveTo(sg * 76, -20, sg * 90, -6); c.quadraticCurveTo(sg * 82, 6, sg * 94, 22); c.quadraticCurveTo(sg * 70, 20, sg * 66, 36); c.quadraticCurveTo(sg * 40, 26, 0, 30); c.closePath(); c.fillStyle = grad(c, 0, -50, 0, 36, ['#ff7a2a', '#8a1e14']); c.fill(); c.lineWidth = 2.8; c.strokeStyle = '#3d0a08'; c.stroke(); c.strokeStyle = '#3d0a08'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 4); c.lineTo(sg * 60, -50); c.moveTo(0, 8); c.lineTo(sg * 90, -6); c.moveTo(0, 12); c.lineTo(sg * 66, 36); c.stroke(); c.restore(); }
    ell(c, 0, 24, 62, 38, grad(c, 0, -10, 0, 60, ['#e8452a', '#a8240a']), '#3d0a08', 3); ell(c, 0, 30, 36, 28, grad(c, 0, 8, 0, 56, ['#ffe9a0', '#f0b84a']), 'rgba(90,40,10,.5)', 1.6); c.strokeStyle = 'rgba(138,90,20,.6)'; c.lineWidth = 1.4; for (let y = 16; y < 54; y += 8) { c.beginPath(); c.moveTo(-30, y); c.lineTo(30, y); c.stroke(); }
    // 頭
    c.beginPath(); c.moveTo(-34, -10); c.quadraticCurveTo(-48, -40, -30, -52); c.quadraticCurveTo(0, -64, 30, -52); c.quadraticCurveTo(48, -40, 34, -10); c.quadraticCurveTo(24, 14 + op * 8, 0, 14 + op * 8); c.quadraticCurveTo(-24, 14 + op * 8, -34, -10); c.closePath();
    c.fillStyle = grad(c, 0, -60, 0, 14, ['#ff6a3a', '#c4301a']); c.fill(); c.lineWidth = 3; c.strokeStyle = '#3d0a08'; c.stroke();
    for (const sg of [-1, 1]) { poly(c, [sg * 22, -52, sg * 34, -86, sg * 38, -50], '#f4e8c8', '#3d0a08', 2.2); poly(c, [sg * 34, -34, sg * 60, -40, sg * 40, -20], '#f4e8c8', '#3d0a08', 2); ell(c, sg * 20, -30, 11, 9, '#ffe14a', '#3d0a08', 2); ell(c, sg * 20, -30, 3, 8, '#111'); poly(c, [sg * 8, -40, sg * 32, -38, sg * 30, -44], '#c4301a'); ell(c, sg * 8, -8, 3, 2.4, '#3d0a08'); }
    c.beginPath(); c.moveTo(-26, -2); c.quadraticCurveTo(0, 4 + op * 30, 26, -2); c.quadraticCurveTo(0, -4 + op * 8, -26, -2); c.fillStyle = op > .05 ? '#ff9a2a' : '#3d0a08'; c.fill(); c.strokeStyle = '#3d0a08'; c.lineWidth = 2; c.stroke();
    if (op > .1) { c.globalAlpha = op; Icons.flame(c, 0, 14 + op * 6, 26 + op * 34); c.globalAlpha = 1; for (const sg of [-1, 1]) poly(c, [sg * 14 - 3, 0, sg * 14 + 3, 0, sg * 14, 9], '#fff'); }
    for (const sg of [-1, 1]) { c.globalAlpha = .6; Icons.flame(c, sg * 6, -16, 0); c.globalAlpha = 1; for (let i = 0; i < 2; i++) { const p = (t * 1.5 + i * .5) % 1; c.globalAlpha = 1 - p; circ(c, sg * 6 + sg * p * 6, -8 - p * 18, 3 + p * 3, '#aaa'); } c.globalAlpha = 1; }
  },
  /* ---- 5 外星母艦 ---- */
  b_mother(c, st) {
    const t = st.t, op = st.open;
    c.globalAlpha = .12 + op * .35; poly(c, [-20, 36, 20, 36, 70 + op * 20, 130, -70 - op * 20, 130], '#9fffe0'); c.globalAlpha = 1;
    ell(c, 0, 14, 98, 36, grad(c, 0, -22, 0, 50, ['#f0f4ff', '#a8b4d8', '#5a6a9a']), '#1c2448', 3.2);
    ell(c, 0, 28, 74, 18, grad(c, 0, 10, 0, 46, ['#6a7aa8', '#2e3a66']), '#1c2448', 2.4);
    for (let i = 0; i < 9; i++) { const lx = -78 + i * 19.5, on = Math.floor(t * 4 + i) % 3; circ(c, lx, 14 + Math.sin(i * .7) * 4 + 8, 4.4, ['#ff4b6e', '#ffe14a', '#31d6c0'][on], '#1c2448', 1.2); }
    c.beginPath(); c.arc(0, -4, 46, PI, TAU); c.closePath(); c.fillStyle = 'rgba(150,240,200,.55)'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#1c2448'; c.stroke(); ell(c, -16, -30, 14, 6, 'rgba(255,255,255,.55)');
    // 外星艦長
    const nod = Math.sin(t * 3) * 2; ell(c, 0, -18 + nod, 18, 22, grad(c, 0, -40, 0, 4, ['#b0f070', '#58bf3a']), '#1d5a12', 2.2); for (const sg of [-1, 1]) { ell(c, sg * 8, -22 + nod, 6, 9, '#111'); ell(c, sg * 8 - 1, -25 + nod, 1.8, 2.4, '#fff'); c.strokeStyle = '#3aa02a'; c.lineWidth = 2; c.beginPath(); c.moveTo(sg * 8, -38 + nod); c.lineTo(sg * 14, -54 + nod); c.stroke(); circ(c, sg * 14, -56 + nod, 3.4, '#ff6adf'); }
    ell(c, 0, -8 + nod, 5, 2.4, '#1d5a12');
    // 炮口
    rr(c, -14, 34, 28, 14, 4); c.fillStyle = '#2e3a66'; c.fill(); c.stroke(); circ(c, 0, 46, 5 + op * 8, op > .05 ? '#ff4b6e' : '#31d6c0'); c.globalAlpha = .4 + op * .5; circ(c, 0, 46, 18 + op * 14, radial(c, 0, 46, 0, 18 + op * 14, [op > .05 ? 'rgba(255,75,110,.9)' : 'rgba(49,214,192,.8)', 'rgba(0,0,0,0)'])); c.globalAlpha = 1;
  },
  /* ---- 6 蛋糕怪獸 ---- */
  b_cake(c, st) {
    const t = st.t, op = st.open, sq = 1 + Math.sin(t * 3) * .02;
    c.save(); c.scale(1 / sq, sq);
    // 下層
    rr(c, -94, 6, 188, 50, 14); c.fillStyle = grad(c, 0, 6, 0, 56, ['#8a4a2a', '#5a2f18']); c.fill(); c.lineWidth = 3; c.strokeStyle = '#2d1408'; c.stroke();
    c.beginPath(); c.moveTo(-96, 6); for (let x = -96; x <= 96; x += 16) { c.quadraticCurveTo(x + 4, 24 + (x % 32 ? 8 : 0), x + 8, 6); c.quadraticCurveTo(x + 12, 20, x + 16, 6); } c.lineTo(96, 0); c.lineTo(-96, 0); c.closePath(); c.fillStyle = '#ffd0ea'; c.fill(); c.strokeStyle = '#a8266a'; c.lineWidth = 2.2; c.stroke();
    const sc = ['#ff4b8b', '#4bd1ff', '#ffe14a', '#8bf05a']; for (let i = 0; i < 16; i++) { c.save(); c.translate(-84 + i * 11, 34 + Math.sin(i * 2.3) * 8); c.rotate(i); c.fillStyle = sc[i % 4]; rr(c, -3.4, -1.1, 6.8, 2.2, 1.1); c.fill(); c.restore(); }
    // 中層（臉）
    rr(c, -66, -26, 132, 40, 12); c.fillStyle = grad(c, 0, -26, 0, 14, ['#ffb3dd', '#ff7ac0']); c.fill(); c.strokeStyle = '#a8266a'; c.lineWidth = 3; c.stroke();
    for (const sg of [-1, 1]) { ell(c, sg * 26, -12, 13, 15, '#fff', '#a8266a', 2.2); circ(c, sg * 26 + Math.sin(t) * 2, -10, 6.4, '#3a1a2a'); circ(c, sg * 26 - 1, -14, 2.2, '#fff'); if (st.hpk < .35) poly(c, [sg * 12, -30, sg * 40, -22 * (sg), sg * 40, -26], '#ff7ac0'); }
    c.beginPath(); c.moveTo(-26, 2); c.quadraticCurveTo(0, 8 + op * 18, 26, 2); c.quadraticCurveTo(0, -2 + op * 24, -26, 2); c.fillStyle = '#7a1238'; c.fill(); c.strokeStyle = '#a8266a'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#fff'; for (let i = -2; i <= 2; i++) if (i) poly(c, [i * 9 - 3, 2, i * 9 + 3, 2, i * 9, 8 + op * 3], '#fff');
    // 上層
    rr(c, -40, -52, 80, 28, 10); c.fillStyle = grad(c, 0, -52, 0, -24, ['#fff6fb', '#ffd0ea']); c.fill(); c.strokeStyle = '#a8266a'; c.lineWidth = 3; c.stroke();
    for (let i = 0; i < 5; i++) { c.fillStyle = sc[i % 4]; circ(c, -28 + i * 14, -38, 3, sc[i % 4]); }
    // 蠟燭 = 角
    for (const sg of [-1, 1]) { const cx = sg * 22; rr(c, cx - 3.4, -76, 6.8, 26, 2); c.fillStyle = sg < 0 ? '#4bd1ff' : '#ffe14a'; c.fill(); c.strokeStyle = '#555'; c.lineWidth = 1.4; c.stroke(); Icons.flame(c, cx, -86 + Math.sin(t * 12 + sg) * 1.4, 16); }
    // 櫻桃
    circ(c, 0, -60, 9, radial(c, -3, -63, 1, 10, ['#ff8aa0', '#e8352b', '#8a0a1c']), '#6e0a1c', 1.8); c.strokeStyle = '#3a8a2a'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(0, -69); c.quadraticCurveTo(6, -80, 14, -78); c.stroke();
    // 叉子手臂
    for (const sg of [-1, 1]) { c.save(); c.translate(sg * 88, 10); c.rotate(sg * (.3 + Math.sin(t * 2 + sg) * .15)); c.strokeStyle = '#c0c8d0'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -34); c.stroke(); for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 5, -34); c.lineTo(i * 5, -52); c.stroke(); } c.restore(); }
    c.restore();
  },
};

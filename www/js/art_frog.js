'use strict';
/* =====================================================================
   主角青蛙：造型、帽子、變種特效
   ===================================================================== */
const SKINS = [
  { id: 'green', name: '綠寶寶', cost: 0, body: '#5ccf3a', light: '#b5f27e', dark: '#2d8f26', spot: '#2f9a28', belly: '#e8ffb8' },
  { id: 'pink', name: '粉紅花蛙', cost: 150, body: '#ff8fc4', light: '#ffd0e7', dark: '#d44f8f', spot: '#ff5fa8', belly: '#fff0f7' },
  { id: 'blue', name: '藍毒蛙', cost: 250, body: '#3d8dff', light: '#9dc8ff', dark: '#1b4fb3', spot: '#10286b', belly: '#dcecff' },
  { id: 'red', name: '草莓蛙', cost: 300, body: '#ff5a4a', light: '#ffa79d', dark: '#b82a1e', spot: '#7c140c', belly: '#ffe3de' },
  { id: 'panda', name: '熊貓蛙', cost: 600, body: '#f6f6f2', light: '#ffffff', dark: '#b9bdb8', spot: '#202326', belly: '#ffffff' },
  { id: 'purple', name: '紫晶蛙', cost: 400, body: '#a36bff', light: '#d3b4ff', dark: '#5f2fc2', spot: '#e9d6ff', belly: '#f1e6ff' },
  { id: 'gold', name: '黃金蛙', cost: 800, body: '#ffcf33', light: '#fff0a0', dark: '#c98a0b', spot: '#fff6c9', belly: '#fff6c9' },
  { id: 'night', name: '夜光蛙', cost: 1000, body: '#1f4a5e', light: '#3f8fa8', dark: '#0d2530', spot: '#52ffe0', belly: '#3f8fa8', glow: '#52ffe0' },
  { id: 'rainbow', name: '彩虹蛙', cost: 1500, body: '#ff6b6b', light: '#ffffff', dark: '#555', spot: '#ffffff', belly: '#ffffff', rainbow: true },
];
const HATS = [
  { id: 'none', name: '光頭', cost: 0 },
  { id: 'flower', name: '花冠', cost: 120 },
  { id: 'helmet', name: '安全帽', cost: 150 },
  { id: 'cat', name: '貓耳', cost: 180 },
  { id: 'chef', name: '廚師帽', cost: 200 },
  { id: 'cowboy', name: '牛仔帽', cost: 250 },
  { id: 'pirate', name: '海盜帽', cost: 300 },
  { id: 'santa', name: '聖誕帽', cost: 350 },
  { id: 'wizard', name: '巫師帽', cost: 400 },
  { id: 'ninja', name: '忍者頭巾', cost: 450 },
  { id: 'crown', name: '王冠', cost: 500 },
  { id: 'space', name: '太空頭盔', cost: 700 },
];
function skinOf(id) { return SKINS.find(s => s.id === id) || SKINS[0]; }

const FrogArt = {
  /* o: {s,ang,hop,z,sx,sy,t,skin,hat,blink,mouth,alpha,mood,mut,tongue} */
  draw(c, x, y, o) {
    const s = o.s || 1, t = o.t || 0, mut = o.mut || {};
    const skin0 = skinOf(o.skin);
    let skin = skin0;
    if (skin0.rainbow) {
      const h = (t * 90) % 360;
      skin = { body: hsl(h, 85, 60), light: hsl(h, 90, 80), dark: hsl(h, 70, 35), spot: hsl((h + 180) % 360, 90, 75), belly: '#fff' };
    }
    const z = o.z || 0, alpha = o.alpha === undefined ? 1 : o.alpha;
    const hop = o.hop || 0;
    c.save();
    c.globalAlpha = alpha;
    // 影子
    const shk = 1 - Math.min(.5, z / 80);
    shadowEll(c, x, y + 6 * s, 15 * s * shk, 9 * s * shk, .3 * shk);
    // 發光（夜光蛙 / 隱身）
    if (skin0.glow) { c.globalAlpha = alpha * (.35 + Math.sin(t * 3) * .1); circ(c, x, y - z, 30 * s, radial(c, x, y - z, 5, 30 * s, [rgba(skin0.glow, .8), rgba(skin0.glow, 0)])); c.globalAlpha = alpha; }
    if (mut.speed > 0) { // 速度殘影
      c.globalAlpha = alpha * .35;
      for (let i = 1; i <= 3; i++) { c.save(); c.translate(x - Math.sin(o.ang || 0) * -i * 7, y - z + Math.cos(o.ang || 0) * -i * 7); c.rotate(o.ang || 0); c.scale(s, s); ell(c, 0, 0, 12, 14, '#ffae3a'); c.restore(); }
      c.globalAlpha = alpha;
    }
    if (mut.freeze > 0) { c.globalAlpha = alpha * .5; circ(c, x, y - z, 26 * s, radial(c, x, y - z, 4, 26 * s, ['rgba(180,240,255,.9)', 'rgba(180,240,255,0)'])); c.globalAlpha = alpha; }
    if (mut.ghost > 0) c.globalAlpha = alpha * (.45 + Math.sin(t * 8) * .08);

    c.translate(x, y - z);
    // 飛行翅膀（在身體後面）
    if (mut.fly > 0) this.wings(c, s, t);
    c.rotate(o.ang || 0);
    const sx = (o.sx || 1) * s, sy = (o.sy || 1) * s;
    c.scale(sx, sy);
    if (mut.jump > 0 && !o.hide) this.spring(c, hop);
    this.body(c, skin, skin0, o, hop, t);
    c.restore();

    // 帽子（不跟著旋轉）
    if (o.hat && o.hat !== 'none' && !o.hideHat) {
      c.save(); c.globalAlpha = alpha * (mut.ghost > 0 ? .6 : 1);
      const ang = o.ang || 0;
      const hx = x + Math.sin(ang) * 11 * s, hy = y - z - Math.cos(ang) * 11 * s - 9 * s;
      this.hat(c, o.hat, hx, hy, s * (o.hatScale || 1), t);
      c.restore();
    }
    // 護盾
    if (mut.shield > 0) {
      c.save(); const r = 27 * s; const blink = mut.shield < 2 && Math.floor(t * 8) % 2 === 0;
      c.globalAlpha = blink ? .2 : .75;
      circ(c, x, y - z, r, radial(c, x, y - z, r * .5, r, ['rgba(120,200,255,.05)', 'rgba(120,200,255,.55)']), 'rgba(200,240,255,.95)', 2.5);
      ell(c, x - r * .35, y - z - r * .4, r * .22, r * .12, 'rgba(255,255,255,.9)');
      c.restore();
    }
    if (mut.magnet > 0) { c.save(); c.globalAlpha = .35; c.strokeStyle = '#ff5a5a'; c.lineWidth = 2; const k = (t * 1.5) % 1; c.beginPath(); c.arc(x, y - z, 20 + k * 36, 0, TAU); c.globalAlpha = .4 * (1 - k); c.stroke(); c.restore(); }
    if (mut.slow > 0) { c.save(); c.globalAlpha = .45; c.strokeStyle = '#c9a0ff'; c.lineWidth = 2.5; c.setLineDash([6, 6]); c.lineDashOffset = -t * 20; c.beginPath(); c.arc(x, y - z, 30 * s, 0, TAU); c.stroke(); c.restore(); }
  },

  spring(c, hop) { // 跳跳彈簧
    c.save(); c.strokeStyle = '#8a97a4'; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); const n = 4; for (let i = 0; i <= n; i++) { c.lineTo(i % 2 ? -9 : 9, 12 + i * 3 - hop * 4); } c.stroke(); c.restore();
  },
  wings(c, s, t) {
    const flap = Math.sin(t * 28) * .35;
    c.save(); c.scale(s, s);
    for (const sg of [-1, 1]) {
      c.save(); c.rotate(sg * (.35 + flap));
      c.beginPath(); c.moveTo(sg * 8, -2); c.bezierCurveTo(sg * 20, -30, sg * 44, -20, sg * 38, 4); c.bezierCurveTo(sg * 36, 10, sg * 22, 12, sg * 8, 6); c.closePath();
      c.fillStyle = 'rgba(255,255,255,.9)'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#9cc4de'; c.stroke();
      c.strokeStyle = 'rgba(150,190,220,.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(sg * 10, 0); c.quadraticCurveTo(sg * 28, -12, sg * 36, 0); c.stroke();
      c.restore();
    }
    c.restore();
  },

  body(c, sk, sk0, o, hop, t) {
    const blink = o.blink || 0, mood = o.mood || 'normal';
    const out = shade(sk.dark, -.35);
    c.lineJoin = 'round'; c.lineCap = 'round';
    // 後腿
    for (const sg of [-1, 1]) {
      const kx = sg * lerp(19, 14, hop), ky = lerp(7, 15, hop), fx = sg * lerp(14, 11, hop), fy = lerp(17, 31, hop);
      c.strokeStyle = out; c.lineWidth = 11; c.beginPath(); c.moveTo(sg * 9, 4); c.lineTo(kx, ky); c.lineTo(fx, fy); c.stroke();
      c.strokeStyle = sk.body; c.lineWidth = 8; c.beginPath(); c.moveTo(sg * 9, 4); c.lineTo(kx, ky); c.lineTo(fx, fy); c.stroke();
      c.strokeStyle = sk.light; c.lineWidth = 2.5; c.beginPath(); c.moveTo(sg * 10, 3); c.lineTo(kx - sg * 1, ky - 1); c.stroke();
      // 腳蹼
      for (let i = -1; i <= 1; i++) { circ(c, fx + i * 4.2 + sg * 1, fy + 3 + Math.abs(i) * -.8, 2.8, sk.light, out, 1.4); }
    }
    // 前腿
    for (const sg of [-1, 1]) {
      const hx = sg * lerp(15, 13, hop), hy = lerp(-5, -17, hop);
      c.strokeStyle = out; c.lineWidth = 8; c.beginPath(); c.moveTo(sg * 9, -4); c.lineTo(hx, hy); c.stroke();
      c.strokeStyle = sk.body; c.lineWidth = 5.5; c.beginPath(); c.moveTo(sg * 9, -4); c.lineTo(hx, hy); c.stroke();
      for (let i = -1; i <= 1; i++) circ(c, hx + i * 3.2 + sg * 1.5, hy - 2.5 + Math.abs(i) * .8, 2.2, sk.light, out, 1.2);
    }
    // 身體
    c.beginPath(); c.ellipse(0, 0, 15.5, 18, 0, 0, TAU); c.fillStyle = out; c.fill();
    c.beginPath(); c.ellipse(0, 0, 14, 16.5, 0, 0, TAU);
    c.fillStyle = grad(c, -14, -16, 14, 16, [sk.light, sk.body, sk.dark]); c.fill();
    // 頭
    c.beginPath(); c.ellipse(0, -9, 12.5, 10, 0, 0, TAU); c.fillStyle = grad(c, 0, -19, 0, 0, [sk.body, shade(sk.body, .1)]); c.fill();
    // 花紋
    c.save(); c.beginPath(); c.ellipse(0, 0, 14, 16.5, 0, 0, TAU); c.clip();
    c.fillStyle = sk.spot; c.globalAlpha = .75;
    const pat = sk0.id;
    if (pat === 'panda') { // 黑耳 黑手
      ell(c, -10, 4, 5.5, 7, sk.spot); ell(c, 10, 4, 5.5, 7, sk.spot);
    } else if (pat === 'blue' || pat === 'red') {
      [[-6, 5, 3.2], [6, 6, 2.8], [0, 11, 3], [-8, -2, 2.4], [8, -1, 2.6], [0, 2, 2.2]].forEach(a => circ(c, a[0], a[1], a[2], sk.spot));
    } else if (pat === 'night') {
      c.globalAlpha = .9; [[-6, 5, 2.6], [6, 6, 2.2], [0, 11, 2.6], [-8, -2, 2], [8, -1, 2.2], [0, 1, 2]].forEach(a => { circ(c, a[0], a[1], a[2] + 1.5, rgba(sk.spot, .25)); circ(c, a[0], a[1], a[2], sk.spot); });
    } else if (pat === 'gold') {
      c.globalAlpha = .8; [[-6, 5, 2.4], [6, 7, 2], [0, 12, 2.2], [-4, -2, 1.8], [7, -2, 2]].forEach(a => circ(c, a[0], a[1], a[2], sk.spot));
    } else {
      [[-6, 6, 3], [6, 7, 2.6], [0, 12, 2.8], [-9, 0, 2.2], [9, 1, 2.4]].forEach(a => circ(c, a[0], a[1], a[2], sk.dark));
    }
    c.globalAlpha = .5; c.strokeStyle = sk.light; c.lineWidth = 2.2; c.beginPath(); c.moveTo(0, -2); c.lineTo(0, 15); c.stroke();
    c.restore();
    // 臉頰 嘴巴
    c.globalAlpha *= 1;
    ell(c, -9.5, -8, 3.2, 2.2, 'rgba(255,110,140,.55)'); ell(c, 9.5, -8, 3.2, 2.2, 'rgba(255,110,140,.55)');
    c.strokeStyle = shade(sk.dark, -.4); c.lineWidth = 1.7;
    if (o.mouth) { c.beginPath(); c.ellipse(0, -14.5, 4.5, 3.4 * Math.min(1, o.mouth), 0, 0, TAU); c.fillStyle = '#7a1d2d'; c.fill(); c.stroke(); ell(c, 0, -13.2, 2.2, 1.4, '#ff8aa0'); }
    else if (mood === 'hurt' || mood === 'dead') { c.beginPath(); c.moveTo(-4, -14); c.quadraticCurveTo(0, -17, 4, -14); c.stroke(); }
    else { c.beginPath(); c.arc(0, -16, 5.5, .3, PI - .3); c.stroke(); }
    // 舌頭
    if (o.tongue > 0) {
      const L = o.tongue * 70;
      c.strokeStyle = '#ff6f8f'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -14); c.lineTo(0, -14 - L); c.stroke(); circ(c, 0, -14 - L, 4.5, '#ff6f8f');
    }
    // 眼睛
    for (const sg of [-1, 1]) {
      const ex = sg * 8.6, ey = -17.5;
      circ(c, ex, ey, 7.6, sk.body, out, 1.6);
      circ(c, ex, ey, 6, '#fff');
      if (mood === 'dead') {
        c.strokeStyle = '#222'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(ex - 3, ey - 3); c.lineTo(ex + 3, ey + 3); c.moveTo(ex + 3, ey - 3); c.lineTo(ex - 3, ey + 3); c.stroke();
      } else if (mood === 'dizzy') {
        c.strokeStyle = '#222'; c.lineWidth = 1.4; c.beginPath(); for (let a = 0; a < 12; a += .4) { const r = a * .35; c.lineTo(ex + Math.cos(a + t * 8) * r, ey + Math.sin(a + t * 8) * r); } c.stroke();
      } else {
        const lx = (o.look ? o.look[0] : 0) * 1.6, ly = (o.look ? o.look[1] : -1) * 1.6;
        circ(c, ex + lx, ey + ly - .5, 3.6, '#16181c'); circ(c, ex + lx - 1.2, ey + ly - 1.8, 1.3, '#fff');
        if (mood === 'happy') { c.strokeStyle = shade(sk.dark, -.4); c.lineWidth = 2; c.beginPath(); c.arc(ex, ey + 1, 4, PI + .3, TAU - .3); c.stroke(); c.fillStyle = sk.body; c.beginPath(); c.arc(ex, ey + 1.5, 6.2, PI, TAU); c.fill(); c.beginPath(); c.arc(ex, ey + 1, 4, PI + .3, TAU - .3); c.stroke(); }
      }
      if (blink > 0 && mood !== 'dead') { // 眼皮
        c.fillStyle = sk.body; c.beginPath(); c.arc(ex, ey, 6.3, PI - 0.2, TAU + .2); c.lineTo(ex, ey); c.globalAlpha *= 1; c.save(); c.beginPath(); c.arc(ex, ey, 6.2, 0, TAU); c.clip(); c.fillRect(ex - 8, ey - 8, 16, 16 * blink); c.restore();
        c.strokeStyle = shade(sk.dark, -.4); c.lineWidth = 1.5; c.beginPath(); c.moveTo(ex - 5, ey - 7 + 14 * blink); c.lineTo(ex + 5, ey - 7 + 14 * blink); c.stroke();
      }
    }
  },

  /* ---------- 帽子（畫在頭頂，s=縮放） ---------- */
  hat(c, id, x, y, s, t) {
    c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = 'round'; c.lineCap = 'round';
    switch (id) {
      case 'crown': {
        poly(c, [-13, 4, -15, -9, -7, -2, 0, -13, 7, -2, 15, -9, 13, 4], grad(c, 0, -13, 0, 4, ['#fff08a', '#f0a81c']), '#8c5a06', 1.8);
        circ(c, 0, -13, 2.4, '#ff4b6e', '#8c5a06', 1); circ(c, -15, -9, 2, '#44e0ff', '#8c5a06', 1); circ(c, 15, -9, 2, '#44e0ff', '#8c5a06', 1);
        c.fillStyle = '#d4820d'; c.fillRect(-13, 1, 26, 3.5); circ(c, 0, 2.5, 1.8, '#ff4b6e'); break;
      }
      case 'pirate': {
        c.fillStyle = '#23262e'; c.beginPath(); c.moveTo(-18, 5); c.quadraticCurveTo(-14, -14, 0, -14); c.quadraticCurveTo(14, -14, 18, 5); c.quadraticCurveTo(0, -1, -18, 5); c.fill(); c.strokeStyle = '#0c0d11'; c.lineWidth = 1.6; c.stroke();
        c.fillStyle = '#f3efe4'; circ(c, 0, -4, 3.2, '#f3efe4'); c.fillRect(-1.2, -2, 2.4, 3.5); c.strokeStyle = '#f3efe4'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-6, -2); c.lineTo(6, 3); c.moveTo(6, -2); c.lineTo(-6, 3); c.stroke();
        circ(c, -1.5, -4.6, .9, '#23262e'); circ(c, 1.5, -4.6, .9, '#23262e'); break;
      }
      case 'chef': {
        circ(c, -7, -9, 7, '#fff', '#c9cfd6', 1.6); circ(c, 7, -9, 7, '#fff', '#c9cfd6', 1.6); circ(c, 0, -13, 8, '#fff', '#c9cfd6', 1.6);
        rr(c, -11, -6, 22, 11, 3); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#c9cfd6'; c.stroke(); c.strokeStyle = '#e1e6ea'; c.beginPath(); c.moveTo(-4, -4); c.lineTo(-4, 4); c.moveTo(4, -4); c.lineTo(4, 4); c.stroke(); break;
      }
      case 'wizard': {
        poly(c, [-14, 4, 0, -30, 14, 4], grad(c, 0, -30, 0, 4, ['#8d5ae8', '#4b2bb0']), '#2a1670', 1.8);
        ell(c, 0, 4, 20, 5, '#5a37c4', '#2a1670', 1.8); Icons.star(c, 0, -10, 4.5, true); Icons.star(c, -5, -1, 2.5, true); circ(c, 6, -4, 1.6, '#ffe93a');
        c.strokeStyle = '#ffd34a'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-13, 0); c.quadraticCurveTo(0, 3, 13, 0); c.stroke(); break;
      }
      case 'space': {
        circ(c, 0, -2, 19, 'rgba(180,230,255,.38)', '#e8f2fa', 3); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2.5; c.beginPath(); c.arc(0, -2, 14, PI + .5, TAU - .9); c.stroke();
        rr(c, -12, 13, 24, 5, 2); c.fillStyle = '#c8d3dd'; c.fill(); c.strokeStyle = '#5d6b78'; c.lineWidth = 1.4; c.stroke(); circ(c, 15, 1, 2.4, '#ff4b4b', '#7a1c1c', 1); break;
      }
      case 'cowboy': {
        ell(c, 0, 3, 21, 5.5, '#b3733a', '#5a3210', 1.6);
        c.beginPath(); c.moveTo(-10, 3); c.quadraticCurveTo(-11, -12, -4, -11); c.quadraticCurveTo(0, -6, 4, -11); c.quadraticCurveTo(11, -12, 10, 3); c.closePath(); c.fillStyle = '#c98443'; c.fill(); c.stroke();
        c.fillStyle = '#5a3210'; c.fillRect(-10, -2, 20, 3.5); circ(c, 0, -.3, 1.8, '#ffd34a'); break;
      }
      case 'helmet': {
        c.beginPath(); c.moveTo(-14, 4); c.quadraticCurveTo(-14, -14, 0, -14); c.quadraticCurveTo(14, -14, 14, 4); c.closePath(); c.fillStyle = grad(c, 0, -14, 0, 4, ['#ffe45a', '#f2a812']); c.fill(); c.strokeStyle = '#8c5a06'; c.lineWidth = 1.8; c.stroke();
        rr(c, -17, 2, 34, 4.5, 2); c.fillStyle = '#f2a812'; c.fill(); c.stroke(); rr(c, -3, -14, 6, 14, 2); c.fillStyle = '#ffd22e'; c.fill(); c.stroke(); circ(c, 0, -5, 2.5, '#fff', '#8c5a06', 1); break;
      }
      case 'cat': {
        for (const sg of [-1, 1]) { poly(c, [sg * 4, 1, sg * 15, -14, sg * 14, 4], '#4a4f5c', '#1f232b', 1.6); poly(c, [sg * 6.5, 0, sg * 13, -9, sg * 12.5, 2], '#ff9fb8'); }
        break;
      }
      case 'flower': {
        const cols = ['#ff7aa8', '#ffd34a', '#fff', '#8ad0ff', '#ff9a4a'];
        c.strokeStyle = '#3ea83a'; c.lineWidth = 3; c.beginPath(); c.arc(0, 4, 15, PI + .4, TAU - .4); c.stroke();
        for (let i = 0; i < 5; i++) { const a = PI + .5 + i * (PI - 1) / 4; const fx = Math.cos(a) * 15, fy = 4 + Math.sin(a) * 15; for (let k = 0; k < 5; k++) { const aa = k * TAU / 5; circ(c, fx + Math.cos(aa) * 2.6, fy + Math.sin(aa) * 2.6, 2, cols[i % 5]); } circ(c, fx, fy, 1.7, '#ffcf33'); }
        break;
      }
      case 'santa': {
        poly(c, [-13, 3, -4, -16, 10, -17, 13, 3], '#e8352b', '#7c140c', 1.8); ell(c, 0, 3, 15, 4.5, '#fff', '#c9cfd6', 1.5); circ(c, 11, -18, 4.2, '#fff', '#c9cfd6', 1.3); break;
      }
      case 'ninja': {
        c.fillStyle = '#23262e'; c.beginPath(); c.moveTo(-15, 3); c.quadraticCurveTo(-14, -11, 0, -11); c.quadraticCurveTo(14, -11, 15, 3); c.closePath(); c.fill(); c.strokeStyle = '#0c0d11'; c.lineWidth = 1.6; c.stroke();
        c.fillStyle = '#c62828'; c.fillRect(-15, -4, 30, 4.5); poly(c, [15, -3, 24, -8, 22, -2, 26, 3, 15, 1], '#c62828', '#7c140c', 1.2); break;
      }
    }
    c.restore();
  },
};

/* =====================================================================
   正面坐姿青蛙（封面 / 商店 / 結算 / 標記用；原點在腳底中央，往上為負）
   o: {s, t, skin, hat, mood(happy|normal|dizzy|dead), blink, mouth, hop, z, sx, sy, look:[x,y], alpha}
   ===================================================================== */
FrogArt.front = function (c, x, y, o) {
  const s = o.s || 1, t = o.t || 0, skin0 = skinOf(o.skin);
  let sk = skin0;
  if (skin0.rainbow) { const h = (t * 90) % 360; sk = { body: hsl(h, 85, 60), light: hsl(h, 90, 80), dark: hsl(h, 70, 35), spot: hsl((h + 180) % 360, 90, 75), belly: '#fff' }; }
  const out = shade(sk.dark, -.38), mood = o.mood || 'happy', blink = o.blink || 0, z = o.z || 0, hop = o.hop || 0;
  c.save();
  c.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
  const sh = 1 - Math.min(.5, z / 220);
  shadowEll(c, x, y + 3 * s, 42 * s * sh, 9 * s * sh, .3 * sh);
  if (skin0.glow) { c.globalAlpha *= .4 + Math.sin(t * 3) * .1; circ(c, x, y - 34 * s, 62 * s, radial(c, x, y - 34 * s, 8, 62 * s, [rgba(skin0.glow, .8), rgba(skin0.glow, 0)])); c.globalAlpha = o.alpha === undefined ? 1 : o.alpha; }
  c.translate(x, y - z); c.scale(s * (o.sx || 1), s * (o.sy || 1));
  c.lineJoin = 'round'; c.lineCap = 'round';
  const body = (cx, cy, rx, ry, rot = 0) => { c.beginPath(); c.ellipse(cx, cy, rx, ry, rot, 0, TAU); c.fillStyle = grad(c, cx - rx, cy - ry, cx + rx, cy + ry, [sk.light, sk.body, sk.dark]); c.fill(); c.lineWidth = 3; c.strokeStyle = out; c.stroke(); };
  // 後腿 + 腳蹼
  for (const sg of [-1, 1]) {
    const fy = -4 - hop * 6;
    body(sg * 33, -17, 17, 14, sg * -.45);
    c.beginPath(); c.ellipse(sg * 41, fy, 19, 7, 0, 0, TAU); c.fillStyle = sk.body; c.fill(); c.lineWidth = 3; c.strokeStyle = out; c.stroke();
    for (let i = 0; i < 3; i++) circ(c, sg * (50 + i * 3) + (i - 1) * 0, fy - 4 + i * 3.2 - 3, 4.2, sk.light, out, 2);
  }
  // 身體
  body(0, -30, 35, 30);
  // 肚子
  c.beginPath(); c.ellipse(0, -22, 23, 22, 0, 0, TAU); c.fillStyle = grad(c, 0, -44, 0, 0, [sk.belly, shade(sk.belly, -.08)]); c.fill();
  c.strokeStyle = rgba(sk.dark, .25); c.lineWidth = 1.6; c.beginPath(); c.arc(0, -22, 23, .3, PI - .3); c.stroke();
  c.strokeStyle = rgba(sk.dark, .18); c.lineWidth = 1.5; for (let i = 0; i < 2; i++) { c.beginPath(); c.arc(0, -12 + i * 8, 15 - i * 3, .35, PI - .35); c.stroke(); }
  // 背上花紋
  c.save(); c.beginPath(); c.ellipse(0, -30, 34, 29, 0, 0, TAU); c.clip(); c.globalAlpha *= .8;
  const sp = skin0.id === 'panda' ? sk.spot : skin0.id === 'gold' || skin0.id === 'night' || skin0.id === 'purple' ? sk.spot : sk.dark;
  [[-24, -46, 5], [-12, -58, 4], [24, -46, 5], [12, -58, 4], [-30, -30, 4.4], [30, -30, 4.4], [0, -62, 3.4]].forEach(a => circ(c, a[0], a[1], a[2], sp));
  c.restore();
  // 前手
  for (const sg of [-1, 1]) {
    c.beginPath(); c.ellipse(sg * 23, -13, 8, 14, sg * .18, 0, TAU); c.fillStyle = grad(c, sg * 15, -27, sg * 31, 1, [sk.light, sk.body, sk.dark]); c.fill(); c.lineWidth = 2.6; c.strokeStyle = out; c.stroke();
    for (let i = -1; i <= 1; i++) circ(c, sg * 23 + i * 5.4 + sg * 1, -1 - Math.abs(i) * .8, 3.6, sk.light, out, 1.8);
  }
  // 眼睛
  const lk = o.look || [0, 0];
  for (const sg of [-1, 1]) {
    const ex = sg * 19, ey = -58;
    circ(c, ex, ey, 15.5, sk.body, out, 3); ell(c, ex - sg * 3, ey - 6, 7, 4, rgba(sk.light, .7));
    if (skin0.id === 'panda') ell(c, ex, ey + 1, 12.5, 14, 'rgba(30,34,38,.9)');
    circ(c, ex, ey + .5, 11.5, '#fff', 'rgba(0,0,0,.18)', 1.2);
    if (mood === 'dead') { c.strokeStyle = '#222'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(ex - 5, ey - 5); c.lineTo(ex + 5, ey + 5); c.moveTo(ex + 5, ey - 5); c.lineTo(ex - 5, ey + 5); c.stroke(); }
    else if (mood === 'dizzy') { c.strokeStyle = '#222'; c.lineWidth = 1.8; c.beginPath(); for (let a = 0; a < 14; a += .4) { const r = a * .55; c.lineTo(ex + Math.cos(a + t * 8) * r, ey + Math.sin(a + t * 8) * r); } c.stroke(); }
    else {
      const px = ex + lk[0] * 3.5, py = ey + 1 + lk[1] * 3;
      circ(c, px, py, 6.6, '#16181c'); circ(c, px - 2.2, py - 2.6, 2.4, '#fff'); circ(c, px + 2, py + 2.2, 1.1, 'rgba(255,255,255,.8)');
    }
    if (blink > 0 && mood !== 'dead') { c.save(); c.beginPath(); c.arc(ex, ey + .5, 11.6, 0, TAU); c.clip(); c.fillStyle = sk.body; c.fillRect(ex - 14, ey - 14, 28, 28 * Math.min(1, blink)); c.restore(); c.strokeStyle = out; c.lineWidth = 2.4; c.beginPath(); c.moveTo(ex - 9, ey - 12 + 24 * Math.min(1, blink)); c.lineTo(ex + 9, ey - 12 + 24 * Math.min(1, blink)); c.stroke(); }
  }
  // 臉頰 / 嘴巴
  ell(c, -25, -37, 6, 4, 'rgba(255,100,140,.5)'); ell(c, 25, -37, 6, 4, 'rgba(255,100,140,.5)');
  c.strokeStyle = shade(sk.dark, -.45); c.lineWidth = 2.8;
  if (o.mouth) { c.beginPath(); c.moveTo(-15, -40); c.quadraticCurveTo(0, -25 + o.mouth * 10, 15, -40); c.quadraticCurveTo(0, -38, -15, -40); c.fillStyle = '#7a1d2d'; c.fill(); c.stroke(); ell(c, 0, -33, 6, 3.4, '#ff8aa0'); }
  else if (mood === 'dead' || mood === 'dizzy') { c.beginPath(); c.moveTo(-8, -37); c.quadraticCurveTo(-3, -40, 0, -37); c.quadraticCurveTo(3, -34, 8, -37); c.stroke(); }
  else { c.beginPath(); c.moveTo(-16, -39); c.quadraticCurveTo(0, -27, 16, -39); c.stroke(); c.beginPath(); c.moveTo(-16, -39); c.lineTo(-18, -42); c.moveTo(16, -39); c.lineTo(18, -42); c.stroke(); }
  circ(c, -4, -45, 1.3, shade(sk.dark, -.4)); circ(c, 4, -45, 1.3, shade(sk.dark, -.4));
  // 帽子
  if (o.hat && o.hat !== 'none') this.hat(c, o.hat, 0, -66, o.hatScale || 1.75, t);
  c.restore();
};

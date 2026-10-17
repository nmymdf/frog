'use strict';
/* =====================================================================
   主程式：場景切換、遊戲迴圈
   作者：ArchieKUO
   ===================================================================== */
const Game = {
  scene: null, name: '', t: 0,
  fade: 0, fadeDir: 0, pending: null,
  factories: {
    cover: () => new CoverScene(),
    map: () => new MapScene(),
    shop: from => new ShopScene(from),
    play: id => new PlayScene(id),
    result: r => new ResultScene(r),
  },
  start() {
    Save.load();
    resize(); // 讀完存檔才知道畫面方向設定（橫式／直式／自動）
    try { if (window.AndroidBridge && AndroidBridge.setOrientation) AndroidBridge.setOrientation(orientMode()); } catch (e) { } // 讓手機外殼的方向跟存檔一致
    this.setScene('cover');
    let last = performance.now(), accT = 0, accN = 0;
    const loop = now => {
      const raw = Math.max(0, now - last), dt = Math.min(.05, raw / 1000); last = now;
      // 自動畫質：連續 60 幀平均超過 29ms（低於約 34fps）就降低解析度，最低降到 1 倍
      if (raw > 0 && raw < 120 && this.name !== 'cover') { accT += raw; accN++; if (accN >= 60) { if (accT / accN > 29 && QUAL > .5) { QUAL = Math.max(.5, QUAL - .25); resize(); } accT = 0; accN = 0; } }
      try { this.update(dt); this.draw(); } catch (e) { this.fail(e); }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },
  fail(e) { if (!this.err) { this.err = e; console.error(e); } },
  setScene(name, arg) { this.name = name; this.scene = this.factories[name](arg); UI.hits.length = 0; UI.prev = []; UI.down = null; UI.clickId = null; UI.cur = null; },
  go(name, arg) {
    if (this.pending) return;
    this.pending = { name, arg }; this.fadeDir = 1;
  },
  update(dt) {
    this.t += dt;
    if (this.fadeDir === 1) {
      this.fade = Math.min(1, this.fade + dt / .16);
      if (this.fade >= 1) { const p = this.pending; this.pending = null; this.setScene(p.name, p.arg); this.fadeDir = -1; }
    } else if (this.fadeDir === -1) {
      this.fade = Math.max(0, this.fade - dt / .22);
      if (this.fade <= 0) this.fadeDir = 0;
    }
    if (this.scene) this.scene.update(dt);
  },
  draw() {
    const g = ctx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#06110b'; g.fillRect(0, 0, canvas.width, canvas.height);
    g.setTransform(SC * DPR, 0, 0, SC * DPR, OX * DPR, OY * DPR);
    g.save(); g.beginPath(); g.rect(0, 0, SW, SH); g.clip();
    if (this.scene) this.scene.draw(g);
    if (this.fade > 0) { g.fillStyle = `rgba(6,17,11,${this.fade})`; g.fillRect(0, 0, SW, SH); }
    g.restore();
  },
  /* 視窗大小或畫面方向改變：場景自己重新排版 */
  onResize() { UI.hits.length = 0; UI.prev = []; UI.down = null; if (this.scene && this.scene.onResize) this.scene.onResize(); },
  live() { return this.scene && this.fadeDir !== 1; },
  onDown(x, y, id) { if (this.live() && this.scene.onDown) this.scene.onDown(x, y, id); },
  onMove(x, y, id) { if (this.live() && this.scene.onMove) this.scene.onMove(x, y, id); },
  onUp(x, y, id) { if (this.scene && this.scene.onUp) this.scene.onUp(x, y, id); },
  onKey(k, e) { if (this.live() && this.scene.onKey) this.scene.onKey(k, e); },
  onKeyUp(k) { if (this.scene && this.scene.onKeyUp) this.scene.onKeyUp(k); },
  onBlur() { if (this.scene && this.scene.onBlur) this.scene.onBlur(); },
  onBack() { return this.live() && this.scene.onBack ? !!this.scene.onBack() : false; },
  onWheel() { },
};
Game.start();

"""煙霧測試：用 headless Chromium 讓機器人亂跑 48 關，確認沒有程式錯誤。
需要：pip install playwright && playwright install chromium
用法：python3 tools/smoke_test.py [land|land8|land9|port]
  land  = 915×412（橫式 7 排）、land8 = 800×400（橫式 8 排）、land9 = 1280×720（橫式 9 排）、port = 450×920（直式）；預設全部都跑"""
import sys, json
from playwright.sync_api import sync_playwright
SAVE={'coins':9999,'gems':2,'stars':{str(i):3 for i in range(0,47)},'skins':['green'],'hats':['none'],'skin':'green','hat':'none','lastLevel':0,'world':0}
JS = """
(() => {
  const res = [];
  Game.fade = 0; Game.fadeDir = 0;
  for (let id = 0; id < TOTAL_LEVELS; id++) {
    let err = null, info = {};
    try {
      const s = new PlayScene(id);
      s.introT = 99; s.state = 'play';
      let maxRow = 0, deaths = 0, wins = 0;
      for (let fr = 0; fr < 60 * 40; fr++) {
        if (fr % 9 === 0) s.tryHop(Math.random() < .75 ? 0 : (Math.random() < .5 ? 1 : 3));
        if (fr % 70 === 0 && Math.random() < .5) s.tryHop(2);
        if (fr % 25 === 0) s.fire();
        s.update(1/60);
        if (fr % 120 === 0) s.draw(ctx);
        if (s.f.row > maxRow) maxRow = s.f.row;
        if (s.state === 'won' || s.state === 'lost') break;
      }
      s.draw(ctx);
      info = { id, rows: s.rows, maxRow, state: s.state, hearts: s.hearts, boss: s.boss ? s.boss.hp + '/' + s.boss.maxhp : '-' };
    } catch (e) { err = id + ': ' + e.stack.split('\\n').slice(0,3).join(' | '); }
    res.push(err ? { id, err } : info);
  }
  return res;
})()
"""
import os
modes = sys.argv[1:] or ['land', 'land8', 'land9', 'port']
bad = 0
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox'])
    for mode in modes:
        vp = {'port': {'width':450,'height':920}, 'land8': {'width':800,'height':400}, 'land9': {'width':1280,'height':720}}.get(mode, {'width':915,'height':412})
        pg = b.new_page(viewport=vp, device_scale_factor=1)
        errs=[]
        pg.on('pageerror', lambda e: errs.append('PAGEERR: '+str(e)))
        pg.add_init_script("localStorage.setItem('frogcross_save_v1', %s)" % json.dumps(json.dumps(dict(SAVE, orient='port' if mode == 'port' else 'land'))))
        pg.goto('file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'www', 'index.html')))
        pg.wait_for_timeout(600)
        pg.evaluate("Game.scene = {update(){}, draw(){}}")
        print('=====', mode, pg.evaluate('[LAND, SW, SH]'))
        res = pg.evaluate(JS)
        for r in res:
            print(r)
            if 'err' in r: bad += 1
        print(errs[:5]); bad += len(errs)
        pg.close()
    b.close()
print('RESULT:', 'OK' if bad == 0 else 'FAIL (%d)' % bad)

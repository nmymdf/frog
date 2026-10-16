#!/usr/bin/env python3
"""產生 iPhone App 圖示 1024×1024（不透明、滿版方形，iOS 會自己切圓角）。作者：ArchieKUO
用法：python3 tools/make_icon.py [版本]   → ios-assets/AppIcon-<版本>-1024.png
需要 Playwright + Chromium（跟 tools/smoke_test.py 一樣）與 Pillow。"""
import base64, io, os, re, sys
from playwright.sync_api import sync_playwright
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
ver = sys.argv[1] if len(sys.argv) > 1 else re.search(r"VERSION = '(v[0-9.]+)'", open(ROOT + '/www/js/core.js', encoding='utf-8').read()).group(1)
K = 2.8; N = 432
JS = """
(() => { const N=%d, K=%s, S=Math.round(N*K);
  const cv=document.createElement('canvas'); cv.width=S; cv.height=S; const g=cv.getContext('2d'); g.scale(K,K);
  g.fillStyle = vgrad(g, 0, N, ['#5fd0ff', '#2a95e0', '#0f5c9a']); g.fillRect(0,0,N,N);
  g.save(); g.strokeStyle='rgba(255,255,255,.22)'; g.lineWidth=5; g.lineCap='round';
  for (let i=0;i<7;i++){ const y=60+i*58, x=(i*97)%%N-30; g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+40,y-10,x+80,y); g.stroke(); } g.restore();
  g.fillStyle = radial(g, N/2, N*.62, 10, N*.62, ['rgba(255,255,255,.35)','rgba(255,255,255,0)']); g.fillRect(0,0,N,N);
  g.save(); g.translate(N/2, 300); g.beginPath(); g.moveTo(0,0); g.ellipse(0,0,112,46,0,.22,TAU-.22); g.closePath(); g.fillStyle = grad(g,0,-46,0,46,['#8be85f','#37a63a','#1f7a2a']); g.fill(); g.lineWidth=5; g.strokeStyle='#17591f'; g.stroke(); g.restore();
  FrogArt.front(g, N/2, 288, { s: 1.72, t: 0, skin: 'green', hat: 'none', mood: 'happy', blink: 0, look:[0,0] });
  FrogArt.hat(g, 'crown', N/2+14, 150, 2.3, 0);
  [[96,110,13],[336,120,10]].forEach(([x,y,r])=>Icons.sparkle(g,x,y,r));
  return cv.toDataURL('image/png'); })()
""" % (N, K)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium'), args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 450, 'height': 920}); pg.goto('file://' + os.path.abspath(ROOT + '/www/index.html')); pg.wait_for_timeout(500)
    im = Image.open(io.BytesIO(base64.b64decode(pg.evaluate(JS).split(',')[1]))).convert('RGB'); b.close()
m = int(im.width * .075); im = im.crop((m, m, im.width - m, im.height - m)).resize((1024, 1024), Image.LANCZOS)
out = os.path.join(ROOT, 'ios-assets', 'AppIcon-%s-1024.png' % ver); os.makedirs(os.path.dirname(out), exist_ok=True); im.save(out, optimize=True); print(out)

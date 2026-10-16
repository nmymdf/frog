# 青蛙過河 · 超級蛙蛙大冒險 — 給 Claude 的專案說明

**先讀 https://github.com/nmymdf/READFIRST(README.md 與其他檔案):家族 App 的分工與規則。**
這份只寫這個 App 自己的事。

## 這是什麼
Frogger 風格的 HTML5 Canvas 小遊戲,給爸爸(含長輩)玩。6 個世界 × 8 關,每個世界一隻魔王。
作者署名:每個設計都要有「作者:ArchieKUO」(金色斜體)加版本號。

## 分工
- Android:爸爸與他的 Claude,本 repo `main` 分支。
- 網頁版:GitHub Pages(https://nmymdf.github.io/frog/),iPhone 用 Safari「加入主畫面」可全螢幕玩。
- **iPhone 原生版:不需要**(爸爸要做時才改成「需要」,並照 READFIRST 的 `iPhone交接.md` 準備文件)。
- Windows 版:規劃中,還沒開始。

## 這個 App 的特別規則(爸爸說過的)
- 畫面**絕對不能縮小**(給長輩玩,越大越好);橫式場地約佔畫面 58%,依畫面寬度自動 7/8/9 列。
- 改畫面前**先做示意圖/預覽截圖給他看**,他選好才改。
- **改過的檔案、新增的圖示與設定檔,檔名都要帶版本**(例如 `FrogCross-v1.2.5.apk`、`icons/icon-192-v1.2.5.png`);給下載連結用帶版本的檔名。
- 網址要**單獨一行**,前後不要黏著中文標點(會變成 404)。
- 「先討論/不動手」只回答;說「可以動手/好」才改。
- 手機上「離開遊戲」按鈕只在 Android 版出現,按了要確認。

## 文件地圖
- `README.md`:版本說明、畫面方向、網頁版、取得 APK
- `www/`:遊戲本體(純 HTML/JS,無套件);`www/js/core.js` 的 `VERSION` 是版本唯一來源
- `android/`:Android 外殼(WebView);`tools/`:工具腳本
- `.github/workflows/build.yml`:打包 APK 放到 `apk` 分支;`pages.yml`:網頁版放到 `gh-pages`

## 常用指令
- 換版本:`tools/bump_version.sh 1.2.6`(改 `VERSION`、圖示與設定檔檔名、引用),再改 README 版本說明
- 測試:`python3 tools/smoke_test.py`(要 Playwright + Chromium,橫/直式各跑一遍,結果要 `RESULT: OK`)
- 打包:push 到 `main` 就由 GitHub Actions 自動打包;APK 在 `apk` 分支:`FrogCross-vX.Y.Z.apk`
- 下載:`https://github.com/nmymdf/frog/raw/apk/FrogCross-vX.Y.Z.apk`(前後換行)

## 目前狀態(每次改版更新)
- Android v1.2.5;網頁版同版;iPhone 原生:不需要
- **待決定:簽章金鑰。** 目前的金鑰檔放在 repo(`android/frogcross.keystore`)且 repo 是公開的,
  不符合 READFIRST「金鑰不能 commit」。要改成放在雲端機密環境變數/GitHub Secrets,
  換新金鑰會讓已安裝的人再移除重裝一次。
- 還沒做:其他畫面(地圖/商店/結算/遊戲中)的作者字樣仍偏小;Windows 版。

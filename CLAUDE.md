# 青蛙過河 · 超級蛙蛙大冒險 — 給 Claude 的專案說明

**先讀 https://github.com/nmymdf/READFIRST(README.md 與其他檔案):家族 App 的分工與規則。**
這份只寫這個 App 自己的事。

## 這是什麼
Frogger 風格的 HTML5 Canvas 小遊戲,給爸爸(含長輩)玩。6 個世界 × 8 關,每個世界一隻魔王。
作者署名:每個設計都要有「作者:ArchieKUO」(金色斜體)加版本號。

## 分工
- Android:爸爸與他的 Claude,本 repo `main` 分支。
- 網頁版:GitHub Pages(https://nmymdf.github.io/frog/),iPhone 用 Safari「加入主畫面」可全螢幕玩。
- **iPhone 版:需要**(爸爸說要做)。由 Jay 在 `jaykuo0619/frog` 的 `ios` 分支、`ios/` 資料夾做:WKWebView 載入 `www/`,照 `docs/IOS_PORT.md` 與 `docs/IOS_TODO.md`。這邊的 Claude 不寫 iOS 程式、不動 `ios/`。
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
- `android/`:Android 外殼(WebView);`tools/`:工具腳本(`make_icon.py` 產生 iPhone 1024 圖示到 `ios-assets/`)
- `docs/IOS_PORT.md`(iPhone 規格)、`docs/IOS_TODO.md`(待辦勾選清單)、`docs/iPhone版_給家人的步驟.md`(Jay 的操作步驟)
- `.github/workflows/build.yml`:打包 APK 放到 `apk` 分支;`pages.yml`:網頁版放到 `gh-pages`

## 每次改版要做的事
- 有使用者看得到的改動:同步更新 `docs/IOS_PORT.md` 與 `docs/IOS_TODO.md`(表格加一行:版本、項目、規格段落、Android 參考),一起 push;回報爸爸時說「iPhone 要跟著改的已寫進 IOS_TODO.md」。
- 圖示有改:重新執行 `python3 tools/make_icon.py`。

## 常用指令
- 換版本:`tools/bump_version.sh 1.2.6`(改 `VERSION`、圖示與設定檔檔名、引用),再改 README 版本說明
- 測試:`python3 tools/smoke_test.py`(要 Playwright + Chromium,橫/直式各跑一遍,結果要 `RESULT: OK`)
- 打包:push 到 `main` 就由 GitHub Actions 自動打包;APK 在 `apk` 分支:`FrogCross-vX.Y.Z.apk`
- 下載:`https://github.com/nmymdf/frog/raw/apk/FrogCross-vX.Y.Z.apk`(前後換行)

## 目前狀態(每次改版更新)
- Android v1.2.7;網頁版同版;iPhone:規格與交接文件已備好(v1.2.7),等 Jay 開始做
- **待決定:簽章金鑰。** 目前的金鑰檔放在 repo(`android/frogcross.keystore`)且 repo 是公開的,
  不符合 READFIRST「金鑰不能 commit」。要改成放在雲端機密環境變數/GitHub Secrets,
  換新金鑰會讓已安裝的人再移除重裝一次。
- 還沒做:其他畫面(地圖/商店/結算/遊戲中)的作者字樣仍偏小;Windows 版。

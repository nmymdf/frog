# 青蛙過河 · 超級蛙蛙大冒險

作者：*ArchieKUO*　版本：v1.2.3（網頁版支援 iPhone「加到主畫面」：全螢幕、有圖示；v1.2.2 橫式魔王關不再縮小，場地跟一般關一樣大；v1.2.1 首頁作者字樣放大）

HTML5 Canvas 做的青蛙過河（Frogger）冒險遊戲，全部畫面都用程式畫出來、音效與音樂用 WebAudio 合成，不需要任何圖片或音檔。

## 內容
- **6 個主題世界 × 8 關 = 48 關**：青蛙池塘、霓虹都市、冰雪王國、火山冒險、星際太空、糖果樂園；每個世界最後一關是魔王戰
- **關卡進度自動記憶**：星星、金幣、造型、設定都存在手機裡，下次開啟可從「繼續冒險」接著玩
- **9 種變種能力**：超級彈跳、飛天蛙、幽靈蛙、巨無霸蛙、閃電蛙、冰凍蛙、泡泡護盾、時間緩慢、金幣磁鐵
- **6 種武器**：泡泡槍、火球砲、冰凍光線、閃電鞭、迴旋鏢、散彈泡泡（從補給箱撿）
- **商店**：5 種升級、9 種青蛙造型、12 頂帽子

## 畫面方向（v1.2 起以橫式為主）
- **橫式（預設）**：場地在中間，左邊方向鍵、右邊武器與發射鈕，一般關與魔王關都顯示 9 列、畫面絕不縮放（給長輩玩，字和按鈕都要夠大）；橫式的魔王場只有 9 排
- **直式**：原本的直立版面，一樣可以玩（設定 → 畫面方向 → 直式）
- **自動**：跟著手機轉；選關地圖、商店、結算、設定等所有畫面兩種方向都有各自排好的版面
- 設定會記住；APK 用 `AndroidBridge.setOrientation` 通知外殼旋轉，網頁版則依視窗比例自動換版面

## 操作
- 手機：在畫面上滑動 / 點一下往前跳，或用方向鍵；發射鈕發射武器
- 電腦鍵盤：方向鍵或 WASD 移動，空白鍵發射，Esc 暫停

## 網頁版（電腦直接玩）
推送到 `main` 後 GitHub Actions 會把 `www/` 放到 `gh-pages` 分支，用 GitHub Pages 發佈：
https://nmymdf.github.io/frog/

### iPhone 也能玩
用 Safari 開上面的網址 → 分享鈕 → 「加入主畫面」，之後從主畫面圖示開啟就是全螢幕（沒有網址列）。
- 要先點一下畫面才會有聲音；側邊靜音開關打開時網頁沒有聲音；iPhone 網頁沒有震動
- 存檔在該瀏覽器裡，跟 Android 版互不相通
- 圖示與設定檔（`www/icons/`、`www/manifest-vX.Y.Z.webmanifest`）檔名帶版本；換版請用 `tools/bump_version.sh 1.2.4`，會一起改名並更新引用

## 取得 Android APK
推送到 `main` 後 GitHub Actions 會自動編譯，APK 會放在 [`apk` 分支](../../tree/apk)：
`FrogCross-latest.apk`（永遠是最新版）。用手機瀏覽器下載並安裝即可。

## 目錄
```
www/                 遊戲本體（index.html + js/）
android/             Android WebView 外殼（Gradle 專案）
tools/sync_assets.sh 把 www 複製進 Android assets
tools/smoke_test.py  用 headless Chromium 在橫式與直式各跑完 48 關的煙霧測試
.github/workflows/   自動編譯 APK 並推到 apk 分支
```

在電腦上直接玩：用瀏覽器開 `www/index.html` 即可。

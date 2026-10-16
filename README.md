# 青蛙過河 · 超級蛙蛙大冒險

作者：*ArchieKUO*　版本：v1.0

HTML5 Canvas 做的青蛙過河（Frogger）冒險遊戲，全部畫面都用程式畫出來、音效與音樂用 WebAudio 合成，不需要任何圖片或音檔。

## 內容
- **6 個主題世界 × 8 關 = 48 關**：青蛙池塘、霓虹都市、冰雪王國、火山冒險、星際太空、糖果樂園；每個世界最後一關是魔王戰
- **關卡進度自動記憶**：星星、金幣、造型、設定都存在手機裡，下次開啟可從「繼續冒險」接著玩
- **9 種變種能力**：超級彈跳、飛天蛙、幽靈蛙、巨無霸蛙、閃電蛙、冰凍蛙、泡泡護盾、時間緩慢、金幣磁鐵
- **6 種武器**：泡泡槍、火球砲、冰凍光線、閃電鞭、迴旋鏢、散彈泡泡（從補給箱撿）
- **商店**：5 種升級、9 種青蛙造型、12 頂帽子

## 操作
- 手機：在畫面上滑動 / 點一下往前跳，或用左下方向鍵；右下按鈕發射武器
- 電腦鍵盤：方向鍵或 WASD 移動，空白鍵發射，Esc 暫停

## 取得 Android APK
推送到 `main` 後 GitHub Actions 會自動編譯，APK 會放在 [`apk` 分支](../../tree/apk)：
`FrogCross-latest.apk`（永遠是最新版）。用手機瀏覽器下載並安裝即可。

## 目錄
```
www/                 遊戲本體（index.html + js/）
android/             Android WebView 外殼（Gradle 專案）
tools/sync_assets.sh 把 www 複製進 Android assets
tools/smoke_test.py  用 headless Chromium 跑完 48 關的煙霧測試
.github/workflows/   自動編譯 APK 並推到 apk 分支
```

在電腦上直接玩：用瀏覽器開 `www/index.html` 即可。

# iPhone 版待辦(給 Jay)

作者:ArchieKUO　目前對應 Android / 網頁版本:v1.2.6

> 爸爸轉告 Jay 的話:「`nmymdf/frog` 有更新,請合併後讀 `CLAUDE.md` 和 `docs/IOS_TODO.md`,照清單處理 iPhone 版。」

## 合併爸爸的新版(寫在最上面)
```
git remote add upstream https://github.com/nmymdf/frog.git   # 第一次才需要
git fetch upstream main
git checkout ios
git merge upstream/main
```
iPhone 程式在你 fork(`jaykuo0619/frog`)的 `ios` 分支、`ios/` 資料夾。做完一個版本就 push;不要動 `android/`,不要把憑證、密碼 commit(公開 repo)。

## 第一次移植(規格:`docs/IOS_PORT.md`)
- [ ] 1. Xcode 專案,WKWebView 載入 `www/`,模擬器能玩(IOS_PORT「開發順序」第 1 項)
- [ ] 2. 全螢幕、橫式、隱藏狀態列/Home 指示條、不鎖屏
- [ ] 3. 注入 `AndroidBridge`(只有 `vibrate`、`setOrientation`;**不要** `exitApp`)
- [ ] 4. 音訊:`AVAudioSession.playback`,靜音開關開著也有聲音
- [ ] 5. 背景/回前景:送 `blur` 事件讓遊戲暫停
- [ ] 6. **存檔實測**(localStorage 在 WKWebView 是否穩定;不穩就改 URL scheme 或回報爸爸)
- [ ] 7. 實機:瀏海機型橫式左右控制鍵不被擋;iPad;多點觸控(左手方向 + 右手發射)
- [ ] 8. App 圖示 `ios-assets/AppIcon-v1.2.5-1024.png`、啟動底色 `#0b1a12`、上架資料、TestFlight

## 之後每次 Android 改版要跟著做(由爸爸的 Claude 加在這裡)
| 版本 | 項目 | 規格段落 | Android 參考 |
|---|---|---|---|
| v1.2.6 | 修正:青蛙不能再往下跳到只露出一半的那一列(遊戲內邏輯,`www/` 合併即可,外殼不用改) | — | `www/js/play.js` `tryHop()` |
| v1.2.5 | 首頁新增「離開遊戲」鈕:**iPhone 不要顯示**(只要不定義 `AndroidBridge.exitApp` 就不會出現);失敗畫面返回鍵改回地圖(只影響 Android 返回鍵) | IOS_PORT「要實作的橋接」 | `www/js/core.js` `canExit()`、`www/js/scenes.js` `ExitDialog` |
| v1.2.3 | 圖示皇冠改位置;iPhone 用的新圖示 | IOS_PORT「要照搬的素材」 | `ios-assets/AppIcon-v1.2.5-1024.png` |

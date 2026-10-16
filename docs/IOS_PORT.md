# 青蛙過河 — iPhone / iPad 版交接規格(給 Jay 的 Claude 讀)

作者:ArchieKUO　對應 Android 版本:v1.2.5

## 先讀這裡(重要)
- 目標:把本 repo 的遊戲做成 iPhone / iPad App,用 TestFlight / App Store 上架。**先讀 https://github.com/nmymdf/READFIRST 的 README.md 與 iPhone交接.md。**
- 你的程式放在 fork `jaykuo0619/frog` 的 **`ios` 分支、`ios/` 資料夾**。**不要動 `android/`**,也**盡量不要改 `www/` 的遊戲邏輯**(那是爸爸與他的 Claude 維護);真的非改不可,先寫進 `docs/IOS_TODO.md` 請爸爸決定。
- 這是公開 repo:**憑證、`.p12`、描述檔、密碼、API 金鑰一律不能 commit**。
- 對 Jay 一律**繁體中文、白話**;他可能是第一次做 iOS,步驟要寫清楚(見 `docs/iPhone版_給家人的步驟.md`)。
- 介面規則(爸爸的要求):畫面**不能縮小**、不能出現直排字。遊戲給長輩玩,字與按鈕越大越好。

## 這個 App 是什麼
Frogger 風格的橫式小遊戲:控制青蛙過馬路與河流、撿金幣、用武器打敵人、每個世界有魔王。6 世界 × 8 關,有商店(造型、升級)。
**整個遊戲是純 HTML5 Canvas + JavaScript**(`www/index.html` + `www/js/*.js`,沒有任何套件、沒有後端、不需要網路)。

## 技術做法(建議,最省事)
用 **WKWebView 載入 `www/` 資料夾**,跟 Android 版的作法一模一樣(Android 是 `WebView` 載入 `assets/www/index.html`)。原生程式只負責:全螢幕、方向、聲音設定、震動、背景暫停,以及一個小橋接。**不要用 Swift 重寫遊戲。**

- Xcode 專案:SwiftUI 或 UIKit 皆可;名稱「青蛙過河」;Bundle ID 建議 `com.archiekuo.frogcross`(跟 Android 一致);最低 iOS 15。
- 把 `www/` 整個資料夾以「資料夾參照(blue folder)」加入 App 資源,用 `loadFileURL(index.html, allowingReadAccessTo: wwwDir)` 載入。
- WKWebViewConfiguration:`mediaTypesRequiringUserActionForPlayback = []`;`allowsInlineMediaPlayback = true`;關閉縮放、關閉回彈(`scrollView.bounces = false`、`isScrollEnabled = false`);`contentInsetAdjustmentBehavior = .never`(版面由遊戲自己處理)。
- `UIApplication.shared.isIdleTimerDisabled = true`(遊戲中不要自動鎖屏,Android 版也是 KEEP_SCREEN_ON)。
- 隱藏狀態列、隱藏 Home 指示條(`prefersStatusBarHidden`、`prefersHomeIndicatorAutoHidden`),並設 `preferredScreenEdgesDeferringSystemGestures`。
- **音訊**:遊戲用 Web Audio(`webkitAudioContext`),第一次點畫面才會解鎖(遊戲已處理)。請設定 `AVAudioSession.sharedInstance().setCategory(.playback)`,**這樣側邊靜音開關打開時還是有聲音**(網頁版做不到,原生可以)。
- **存檔**:遊戲用 `localStorage`,鍵名 `frogcross_save_v1`,內容是 JSON(關卡星數、金幣、寶石、升級、造型、設定等,見 `www/js/core.js` 的 `Save.def()`)。**WKWebView 載入 `file://` 時 localStorage 可能不穩(被清掉)——請實測:關閉 App、重開、背景太久後存檔還在不在。** 若不穩,改用自訂 URL scheme(`WKURLSchemeHandler`,如 `app://frogcross/index.html`)載入,或在原生端額外備份存檔(橋接加 `saveGet/saveSet`,**要改 `www/`,先問爸爸**)。

## 要實作的橋接(跟 Android 的 `AndroidBridge` 對齊)
遊戲程式用 `window.AndroidBridge` 判斷「我在 App 裡」。**請用 `WKUserScript`(documentStart)注入一個同名物件**,方法轉給原生:

| JS 呼叫 | 作用 | iOS 實作 |
|---|---|---|
| `AndroidBridge.vibrate(ms)` | 震動回饋 | `UIImpactFeedbackGenerator`(ms ≤ 15 輕、≤ 40 中、否則重);沒有震動硬體的 iPad 忽略 |
| `AndroidBridge.setOrientation(mode)` | 畫面方向,`mode` 是 `'land'`(橫式,預設)/ `'port'`(直式)/ `'auto'`(跟著手機) | 記在 `UserDefaults`;`supportedInterfaceOrientations` 依模式回傳(land=`.landscape`、port=`.portrait`、auto=`.all`),再用 `requestGeometryUpdate`(iOS 16+)或 `UIDevice.setValue(forKey:"orientation")` 立即轉 |
| `AndroidBridge.exitApp()` | **iOS 不要實作這個**(見下) | — |

- 注入物件的寫法範例:`window.AndroidBridge = { vibrate: ms => webkit.messageHandlers.vibrate.postMessage(ms), setOrientation: m => webkit.messageHandlers.orient.postMessage(m) };`
- **不要定義 `exitApp`**:遊戲裡的「離開遊戲」按鈕只在 `AndroidBridge.exitApp` 存在時才顯示(見 `www/js/core.js` 的 `canExit()`)。Apple 不允許 App 自己關閉自己,所以 iPhone 版不顯示這顆按鈕,使用者用上滑回桌面即可。
- 啟動時讀 `UserDefaults` 的方向設定,先轉好再載入畫面(避免閃一下);預設 `'land'`。
- **背景暫停**:`sceneWillResignActive` / `applicationWillResignActive` 時執行 `window.dispatchEvent(new Event('blur'))`(遊戲聽到會自動暫停),回前景不用做事。
- 返回鍵:iOS 沒有。遊戲裡的畫面都有自己的返回按鈕,不用處理 `window.onAndroidBack`。

## 畫面與版面(遊戲自己會處理,Jay 只需注意)
- 遊戲預設**橫式**。橫式時邏輯畫面高 450、寬 800~1050(依視窗長寬比),中間場地固定 450 寬,左右是操控區;直式時邏輯 450×920。程式在 `www/js/core.js` 的 `resize()`。
- **瀏海/圓角**:網頁版遇到 iPhone 的 User-Agent 會去掉 `viewport-fit=cover`(`www/index.html` 最上面的小 script),讓內容留在安全區內。WKWebView 的 User-Agent 預設就含 `iPhone`,所以通常自動生效;請在有瀏海的機型(橫式)實測左右控制鍵有沒有被擋住。若被擋,在原生端把 WebView 約束在 `safeAreaLayoutGuide` 內,背景色用 `#0b1a12`(遊戲底色)。
- 背景色請設 `#0b1a12`,避免載入時閃白。

## 要照搬的素材
- App 圖示:`ios-assets/AppIcon-v1.2.5-1024.png`(1024×1024、不透明;之後改版用 `python3 tools/make_icon.py` 重新產生)。
- App 名稱:「青蛙過河」;副標題可用「超級蛙蛙大冒險」。
- 版本號:對應 `www/js/core.js` 的 `VERSION`(例如 `v1.2.5` → `CFBundleShortVersionString = 1.2.5`;`CFBundleVersion` 每次上傳 +1)。
- 署名:遊戲畫面內已有「作者:ArchieKUO」與版本;App Store 的作者/版權欄請寫 ArchieKUO。

## 跨平台檔案格式
**沒有。** 這個遊戲沒有匯出/匯入檔案,Android 與 iPhone 的存檔互不相通(各自存在手機裡)。所以沒有 `compat/` 測試檔。

## 開發順序(每階段能跑、有測試、commit)
1. 建 Xcode 專案,載入 `www/`,模擬器上能玩到首頁、能開始一關。
2. 全螢幕、橫式鎖定、隱藏狀態列/Home 指示條、不鎖屏。
3. 注入橋接:方向設定(設定頁切換橫/直/自動要真的會轉)、震動。
4. 音訊:`AVAudioSession.playback`;首次點畫面後音效與音樂都有;靜音開關開著也有聲音。
5. 背景/回前景:按 Home 後回來遊戲是暫停狀態、音樂恢復正常。
6. **存檔實測**:通關一關、關掉 App、重開,星星與金幣還在;背景放置後重開也在。
7. 實機測試:瀏海機型橫式、iPad、各種螢幕大小(遊戲會自動調整列數,但場地不能縮小)。
8. 圖示、啟動畫面(底色 `#0b1a12`)、上架資料、TestFlight。

## 驗證怎麼做
- 遊戲邏輯有自動測試:`python3 tools/smoke_test.py`(Playwright + Chromium,橫/直式各跑一遍,結果要 `RESULT: OK`)。你改的是外殼,不影響這個測試,但合併爸爸的新版後可以跑一次。
- 手動清單:能玩完一關、魔王關正常、設定頁音效/音樂/震動/方向都有效、轉向不當機、背景回來不當機。

## Android 已知的小問題(iPhone 不用照抄)
- Android 的「返回鍵」(`window.onAndroidBack`)與「離開遊戲」按鈕(`exitApp`)在 iPhone 不需要。
- Android 版用 `FLAG_KEEP_SCREEN_ON` 與沉浸模式,iPhone 用上面對應的 API。

## 逐畫面細節
畫面全是 Canvas 畫的(沒有原生控制項),**不需要逐畫面重做**;畫面與文字都在 `www/js/scenes.js`、`scenes_land.js`、`play_draw.js`。Jay 只要確認它們在 WKWebView 裡顯示、點擊、手勢都正常。操作:在畫面上滑動或點一下往前跳、左右下方向鍵、右邊發射鈕(多點觸控:左手方向、右手發射)——**請實機確認多點觸控正常**。

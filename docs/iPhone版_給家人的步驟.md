# iPhone 版:給 Jay 的操作步驟(第一次)

作者:ArchieKUO

> 白話版,一步一步來。有不懂的地方直接問你 Mac 上的 Claude,它會帶你做。

## 要準備的東西
1. 一台 **Mac**,裝好最新版 **Xcode**(App Store 下載,很大,要先下載好)。
2. **Apple 開發者帳號**(你已經有)。
3. Mac 上的 **Claude Code**(終端機版或桌面版)。
4. 一支 iPhone(實機測試用;模擬器也可以先玩)。

## 步驟
1. 到 https://github.com/nmymdf/frog 按右上角 **Fork**,你的 GitHub 會多一個 `jaykuo0619/frog`。
2. 在 Mac 終端機:
   ```
   git clone https://github.com/jaykuo0619/frog.git
   cd frog
   git remote add upstream https://github.com/nmymdf/frog.git
   git checkout -b ios
   ```
3. 在這個資料夾打開 Claude Code,對它說:
   「先讀 https://github.com/nmymdf/READFIRST,再讀這個專案的 `CLAUDE.md`、`docs/IOS_PORT.md`、`docs/IOS_TODO.md`,照清單把 iPhone 版做出來。」
4. 它會建立 `ios/` 資料夾和 Xcode 專案。用 Xcode 開 `ios/` 底下的 `.xcodeproj`,按 ▶ 在模擬器執行。
5. 實機測試:iPhone 用線接 Mac → Xcode 上方選你的 iPhone → ▶。第一次要在 iPhone「設定 → 一般 → VPN 與裝置管理」信任開發者。
6. 上架前:Xcode → Product → **Archive** → Distribute App → **TestFlight & App Store**,到 App Store Connect 加測試人員,爸爸就能用 TestFlight 安裝。

## 以後爸爸出新版
爸爸會說:「`nmymdf/frog` 有更新」。你只要:
```
git fetch upstream main
git checkout ios
git merge upstream/main
```
然後叫 Claude 讀 `docs/IOS_TODO.md`,照清單處理,再重新 Archive 上傳。

## 注意
- **不要把憑證、`.p12`、密碼、描述檔 commit 進 Git**(這個 repo 是公開的)。
- 不要改 `android/` 資料夾。

#!/usr/bin/env bash
# 把遊戲本體 (www) 複製到 Android 專案的 assets，GitHub Actions 與本機打包都會用到
set -e
cd "$(dirname "$0")/.."
rm -rf android/app/src/main/assets/www
mkdir -p android/app/src/main/assets
cp -r www android/app/src/main/assets/www
echo "assets 已更新：$(grep -oP "VERSION = '\K[^']+" www/js/core.js)"

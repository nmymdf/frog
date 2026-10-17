#!/usr/bin/env bash
# 換版本：tools/bump_version.sh 1.2.4
# 一次改好：core.js 的 VERSION、網頁的圖示／設定檔「檔名裡的版本」與 index.html 的引用、manifest 內容。
# 作者：ArchieKUO
set -e
cd "$(dirname "$0")/.."
NEW="v${1#v}"
OLD=$(grep -oP "VERSION = '\Kv[0-9.]+" www/js/core.js)
[ -n "$1" ] || { echo "用法：tools/bump_version.sh 1.2.4"; exit 1; }
[ "$OLD" != "$NEW" ] || { echo "版本沒變（$OLD）"; exit 0; }
sed -i "s/VERSION = '$OLD'/VERSION = '$NEW'/" www/js/core.js
for f in www/icons/*-$OLD.png www/manifest-$OLD.webmanifest; do
  [ -e "$f" ] && git mv -f "$f" "${f//$OLD/$NEW}" 2>/dev/null || { [ -e "$f" ] && mv "$f" "${f//$OLD/$NEW}"; }
done
sed -i "s/$OLD/$NEW/g; s/\.js?v=${OLD#v}\"/.js?v=${NEW#v}\"/g" www/index.html www/manifest-$NEW.webmanifest
echo "版本 $OLD → $NEW（記得更新 README 的版本說明後再提交）"

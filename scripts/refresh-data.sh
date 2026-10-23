#!/usr/bin/env bash
# 日本の回線で最新データを取り、リリース「data-latest」の控え（raw-data.tar.gz）を差し替えて、サイトを作り直す
# 使い方: GH_TOKEN=<micoficial に書き込めるトークン> bash scripts/refresh-data.sh
set -euo pipefail
cd "$(dirname "$0")/.."
REPO="micoficial/tsushinbo"
bash scripts/fetch.sh
cd data/raw
rm -f raw-data.tar.gz
tar -czf raw-data.tar.gz positivedb shokuba
ls -la raw-data.tar.gz
cd ../..
if ! gh release view data-latest -R "$REPO" > /dev/null 2>&1; then
  gh release create data-latest -R "$REPO" --title "最新の公開データ（控え）" --notes-file scripts/release-notes.md
fi
gh release upload data-latest data/raw/raw-data.tar.gz -R "$REPO" --clobber
rm -f data/raw/raw-data.tar.gz
gh workflow run deploy.yml -R "$REPO" --ref main
echo "控えを更新し、作り直しを始めました"

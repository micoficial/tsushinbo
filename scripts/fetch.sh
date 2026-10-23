#!/usr/bin/env bash
# 厚生労働省の公開データ（全件CSV）を取ってきて data/raw/ に展開する
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p data/raw
cd data/raw

UA="Mozilla/5.0 (compatible; kaisha-tsushinbo/1.0; +https://micoficial.github.io/tsushinbo/about/)"
get() {
  # $1=保存名 $2=URL
  curl -fsSL -A "$UA" --retry 3 --retry-delay 10 --max-time 600 -o "$1.tmp" "$2"
  # ZIP でなければ（メンテナンス画面など）止める
  if ! head -c 2 "$1.tmp" | grep -q "PK"; then echo "ZIPではありません: $2" >&2; exit 1; fi
  mv "$1.tmp" "$1"
}

# 女性の活躍推進企業データベース オープンデータ（全体版・UTF-8 BOMなし）
get positivedb.zip "https://positive-ryouritsu.mhlw.go.jp/positivedb/opendata/download_nb.html?w=99"
# しょくばらぼ CSV一括ダウンロード（Shift_JIS）
get shokuba.zip "https://shokuba.mhlw.go.jp/shokuba/utilize/download010?lang=JA"

rm -rf positivedb shokuba
unzip -q -o positivedb.zip -d positivedb
unzip -q -o shokuba.zip -d shokuba
rm -f positivedb.zip shokuba.zip
ls -la positivedb shokuba

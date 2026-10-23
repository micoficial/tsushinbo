#!/usr/bin/env bash
# 厚生労働省の公開データ（全件CSV）を取ってきて data/raw/ に展開する
# 国のサイトは海外（GitHub Actions など）からのアクセスを 403 で断るため、
# 取れないときはリポジトリのリリース「data-latest」に置いた控え（raw-data.tar.gz）を使う。
# 控えの更新は日本の回線で scripts/refresh-data.sh を実行する。
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p data/raw
cd data/raw

UA="Mozilla/5.0 (compatible; kaisha-tsushinbo/1.0; +https://micoficial.github.io/tsushinbo/about/)"
get() {
  # $1=保存名 $2=URL。ZIP を取れたら 0
  local code
  code=$(curl -sSL -A "$UA" --retry 2 --retry-delay 10 --max-time 600 -o "$1.tmp" -w "%{http_code}" "$2" || echo "000")
  if [ "$code" != "200" ] || ! head -c 2 "$1.tmp" | grep -q "PK"; then
    echo "取得できませんでした（HTTP $code）: $2" >&2
    rm -f "$1.tmp"
    return 1
  fi
  mv "$1.tmp" "$1"
}

if get positivedb.zip "https://positive-ryouritsu.mhlw.go.jp/positivedb/opendata/download_nb.html?w=99" \
  && get shokuba.zip "https://shokuba.mhlw.go.jp/shokuba/utilize/download010?lang=JA"; then
  # 別の作業がデータを読んでいても壊れにくいよう、展開してから差し替える
  rm -rf positivedb.new shokuba.new
  unzip -q -o positivedb.zip -d positivedb.new
  unzip -q -o shokuba.zip -d shokuba.new
  rm -rf positivedb shokuba
  mv positivedb.new positivedb
  mv shokuba.new shokuba
  rm -f positivedb.zip shokuba.zip
  echo "国のサイトから取得しました"
else
  echo "リリース data-latest の控えを使います" >&2
  rm -f raw-data.tar.gz
  gh release download data-latest --pattern raw-data.tar.gz --dir . --clobber
  rm -rf positivedb shokuba
  tar -xzf raw-data.tar.gz
  rm -f raw-data.tar.gz
fi
ls -la positivedb shokuba

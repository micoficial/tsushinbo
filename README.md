# 会社の通信簿

会社が国のデータベースで公表している「働きやすさの数字」（残業時間・有給取得率・男性の育休取得率・平均勤続年数・女性管理職の割合・男女の賃金の差異・新卒の離職）を、同じ業種・同じ規模の会社と比べて5段階で評定し、無料で公開する静的サイトです。

公開先：https://micoficial.github.io/tsushinbo/

## データ

| データ | 提供 | 使い方 |
|---|---|---|
| [女性の活躍推進企業データベース オープンデータ](https://positive-ryouritsu.mhlw.go.jp/positivedb/opendata/)（全体版CSV・UTF-8） | 厚生労働省 | 指標の本体 |
| [しょくばらぼ CSV一括ダウンロード](https://shokuba.mhlw.go.jp/shokuba/utilize/utilize010.do)（Shift_JIS） | 厚生労働省 | 所在地・事業概要・新卒の採用/離職・認定 |

どちらも政府標準利用規約（第2.0版）準拠・CC BY 4.0互換。出典と「加工して作成」の記載が必要（全ページのフッターに入れている）。国が作成したように見せないこと。

## 動かし方

```bash
bash scripts/fetch.sh      # データを data/raw/ に取得（約60MB）
node scripts/build.mjs     # dist/ に約3.4万ページを生成（1分ほど）
node scripts/serve.mjs     # http://localhost:4173/tsushinbo/ で確認
```

`LIMIT=300 node scripts/build.mjs` で会社ページを300件だけ作れる（試すとき用）。

## 仕組み

- `scripts/lib/load.mjs`：2つのCSVを読んで法人番号で結合。列の並びが変わったら止まる（黙って変な値を出さない）
- `scripts/lib/grade.mjs`：代表値の選び方、比較グループ（業種×規模帯、30社未満なら全業種の規模帯）、評定（上位7/31/69/93%で区切る相対評価）
- `scripts/lib/text.mjs`：会社ページの「ひとことで言うと」とよくある質問の文
- `scripts/pages/`：会社ページ（`company.mjs`）、ランキング・都道府県・業種・トップなど（`hubs.mjs`）
- `.github/workflows/deploy.yml`：push と毎週月曜3時（日本時間）に作り直して GitHub Pages に出す。`data/summary.json` を毎回コミットするので、定期実行が60日で止まることもない
- **国のサイトは海外からのアクセスを 403 で断る**ので、GitHub Actions では直接取れない。そのときはリリース `data-latest` の控え（`raw-data.tar.gz`）を使う。控えは日本の回線で `GH_TOKEN=... bash scripts/refresh-data.sh` を実行すると差し替わり、作り直しも始まる。このPCではタスク スケジューラ（mico-tsushinbo-data-refresh）が毎週月曜9時に `scripts/scheduled-refresh.sh` 経由で実行する

## 注意

- 残業時間は国の定義で「法定労働時間（週40時間）を超えた分の月平均」。所定が短い会社は0時間になりやすい。ページとランキングに説明と各社の注記を載せている
- 数値は会社の自己申告。評定は「公表した会社の中での位置」

# STATE（現在地）— 会社の通信簿

最終更新：2026-10-23

## いまの状態
- **2026-10-23 公開済み**：https://micoficial.github.io/tsushinbo/ （リポジトリ `micoficial/tsushinbo`、GitHub Pages を Actions で配信）
- 掲載 32,921社（評定できる項目が2つ以上、または301人以上で1つ以上）、全34,010ページ、約5.5億バイト。データは 2026-10-23 時点
- サイト直下に Search Console の確認ファイル（`google08ebf2cdcabb4d55.html`、ai-fuseji と同じもの）と IndexNow のキーを置いた。**Search Console への登録とサイトマップ送信はまだ**（Jの Google アカウントの操作）
- アクセス解析なし（Cookieなし）

## なぜこのテーマか（2026-10-23 決定）
Jの依頼：「AIで完全に作れて、一般の人には取りにくく、本来は有料のサービスにある情報を、AIだからこそ無料で出し、圧倒的なアクセスを取る」
- 就職四季報（有料）や口コミサイトの有料会員で見る「残業・有給・離職」などの数字は、実は国のDBで公表されている。ただし1社ずつしか見られず比べられない（しょくばらぼ自体の年間アクセスは約250万件しかない）
- 検索需要：「〇〇 離職率」「〇〇 有給」「ホワイト企業 ランキング」「ホワイト企業 福岡」「就職四季報 無料で見る方法」などがGoogleの検索候補に多数（会社名×指標のロングテール）
- 公開データから企業別の残業ランキングを出しているサイトは見つからなかった（空き地）
- 規約：両DBとも商用可・出典表示で自由に使える。しょくばらぼは「就職活動に資する」目的が条件で、まさにそれ

### 選ばなかった案
- 補助金のAI解説（jGrants）：補助金ポータル等が強い。更新が頻繁でAPI費用がかかる
- 判決文のAI要約：1件数万トークンでLLM費用が大きい
- 法令の逐条解説：Wikibooksのコンメンタールが無料で強い
- 不動産の取引価格：大手ポータル（SUUMO・LIFULL・土地代データ）が強い
- 法人データベース（法人番号）：類似サイトが多く1ページの価値が低い
- 国家試験の過去問解説：過去問道場など無料の強い先行者あり

## データ更新の流れ（大事）
- 厚労省の2サイトは **GitHub Actions（海外のサーバー）からだと 403**（2026-10-23 の初回実行で判明）。日本の回線（このPC）からは取れる
- そこで、日本の回線で取ったCSVをリリース `data-latest` の `raw-data.tar.gz` に置き、Actions は直接取れなければそれを使う
- 控えの更新：このPCで `GH_TOKEN=$(gh auth token --user mico95official-create) bash scripts/refresh-data.sh`（取得→控え差し替え→作り直し開始まで自動）
- **このPCのタスク スケジューラ「mico-tsushinbo-data-refresh」**が毎週月曜9時（PCが切れていたら次の起動時）に `scripts/scheduled-refresh.sh` を実行する（Jが2026-10-23に許可）。ログは `data/refresh.log`。動作確認だけなら `bash scripts/scheduled-refresh.sh --check`
- Search Console：2026-10-23 に URLプレフィックス `https://micoficial.github.io/tsushinbo/` を登録（HTMLファイルで自動確認）。`sitemap.xml`・`sitemap-hubs.xml`・`sitemap-companies-1.xml` を送信。直後の状態は「取得できませんでした」（新規プロパティでよくある表示）→ 数日後に再確認する

## 試して駄目だったこと
- 日本郵便の郵便番号データ（市区町村ページ用）：`/zipcode/dl/utf/zip/utf_ken_all.zip` などが 404（2026-10-23）。市区町村ページは見送り
- gBizINFO の一括ダウンロード：アクセストークン（登録）が必要。Jの登録待ち
- 平均残業時間「0時間」の大企業（日本製鉄・キヤノン・野村総研など）がランキング上位に並んだ → 国の定義が「法定労働時間を超えた分」のため。説明文と各社の注記をページに出して対応（除外はしていない）
- 総合ランキングで4項目だけ公表の会社が上位に来た → 総合は5項目以上に限定

## 次の一手
1. Search Console に `https://micoficial.github.io/tsushinbo/` を登録して sitemap.xml を送る（Jの Google アカウント。確認用ファイルは同じものを置けば通る見込み）
2. 独自ドメイン（例：kaisha-tsushinbo.jp）を取ると検索に強くなる（Jの購入）
3. アクセス解析（GA4 など）を入れるかJに確認
4. 市区町村ページ（「福岡市 ホワイト企業」など）：総務省の団体コードか法人番号の全件データで市区町村を出す
5. 上場企業は有価証券報告書（EDINET）の平均年収を足すと「〇〇 年収」も取れる（EDINET API キーはJの登録が必要）
6. 収益化：転職エージェントのアフィリエイト、または広告（独自ドメイン後）

## 関係ファイル
- 作業フォルダ：`C:\Users\syake\workspace\tsushinbo\`
- データ：`data/raw/`（gitに入れない）、`data/summary.json`（更新の記録）
- 画像：`src/assets/og.png`・`icon-180.png`（Windows の System.Drawing で作った。作り直しは `powershell -File scripts/make_images.ps1 -OutDir src/assets`）

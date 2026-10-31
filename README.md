# 操り継ぐ

1976年のポルシェ934から最新のマシンまで、いま組んで走らせたいタミヤのRCカーを、カテゴリ・シャーシ・年代で横断するキュレーションサイト。

公開予定URL: https://rc.napoblog.com

[EmDash](https://github.com/emdash-cms/emdash)(Astro製CMS)で作り、Cloudflare Workers + D1 + R2 で動かします。姉妹サイト「遊び継ぐ」(game-curation)「組み継ぐ」(gunpla-curation)「走り継ぐ」(mini4wd-curation)と同じ作りです。コード上のコレクション名・タクソノミー名は共通で、`kits` がマシン、`grade` がカテゴリ、`series` がシャーシです。

## ページ

| ページ | パス |
|---|---|
| トップ | `/` |
| マシン一覧(年代・カテゴリ・シャーシ・推し度で絞り込み) | `/kits` |
| マシンページ | `/kits/:slug` |
| 年表 | `/timeline` |
| シャーシガイド | `/chassis` |
| 全車種名簿(カテゴリ別・初出年別) | `/catalog`, `/catalog/:カテゴリ`, `/catalog/:カテゴリ/:年`(年不明は `/0`) |
| 特集 | `/posts`, `/posts/:slug` |
| 検索 | `/search` |
| このサイトについて | `/pages/about` |
| プライバシーポリシー | `/privacy` |

## データ

- 厳選マシンは `data/kits-*.mjs` に `data/entry.mjs` の `k()` で書く。本文は「どんなマシン/走らせどころ/タミヤRC史の中で/こんな人におすすめ」の4見出し
- 初出は「YYYY-MM」。月が確かめられないときは「YYYY」だけにする
- 復刻版は別のマシンとして扱い、車種名に「(2011)」のように復刻の年を付ける
- 初出年月は `node scripts/check-years.mjs data/kits-*.mjs` で全車種名簿と照合する(品番があれば品番で、なければ車種名で探す)
- 名簿から車種名を探す: `node scripts/find-kit.mjs <正規表現> [カテゴリ]`
- `node scripts/build-seed.mjs` で `seed/seed.json` を生成(seed は空のデータベースにだけ適用される)
- 公開中のサイトへの反映は `node scripts/sync-remote.mjs --url https://rc.napoblog.com`(先に `npx emdash login`)

## 全車種名簿

名簿は `data/catalog/roster.mjs` が次の資料を組み合わせて作る。`node scripts/build-catalog.mjs` で `public/catalog-data/` に書き出す。

1. タミヤ公式サイト「発売月製品一覧」の電動RCカー(genre_item=2010)とエンジンRCカー(2050)。`scripts/catalog/monthly.mjs` で `data/catalog/tamiya-monthly.json` に取得する(1か月に数秒かかるので、`--from` `--to` `--file` で分けて並行に取ると速い)
2. 日本語版ウィキペディア「タミヤのRC製品一覧」の年別の一覧(1976〜2009年、年だけ)。`scripts/catalog/wiki-list.mjs` が `data/catalog/wiki-rc-list.wiki` から `wiki-list.json` を作る。表記の合わせは同じファイルの `NAME_FIX`
3. `data/catalog/date-fixes.json`: ウィキペディアの各車種の記事などで月まで確かめられた分。`force: true` は公式の一覧の月より確かな発売日(商品ページ・記事)で月を直す分
4. `data/catalog/additions.json`: どちらにもない車種を手で足す分
5. ウィキペディア由来で年だけの行は、TamiyaBase(`https://tamiyabase.com/tamiya-models/<品番>`、英語名・シャーシ・発売日)と同じ年の中で車種名を突き合わせ、月を `date-fixes.json` に `src: "tamiyabase:<品番>"` で入れる(年が一致するときだけ当たる)。同名でシャーシ違いの車種はシャーシ欄で見分ける
6. 公式の月別一覧の月が商品ページの発売日(`products/<品番>/index.html` の「〇年〇月〇日発売」)より1か月早いもの(月初の発売)は、`date-fixes.json` に `force: true`・`src: "tamiya-product:<品番>"` で直す。商品ページの日付が何年も後なら再販の日付なので使わない

注意点:

- 公式の一覧の月は、月初の発売だと前の月に載ることがある(TA07 PRO、ダークインパクトなど)
- 公式の一覧には、古い品番の商品が再販の月で載ることがある。58xxx・56xxx・44xxx の品番はほぼ発売順なので、大きい品番にずっと古い月があれば再販の月とみなし、前後の品番の年が同じならその年、違えば年不明にする(`fixReissueMonths`)
- ウィキペディアの年のほうが古い同名の行は、旧品番の再販なら初出をウィキペディアの年に直し、新しい品番なら復刻版として別の行に残す
- 組み立て済み完成品(XB)とフルセットは、同じ車種のキットと重なるので載せない
- エンジン用パーツ(GE.xx)・工具・スプリングやウイングのセットなど車種でないものは `NOT_A_CAR` で外す
- 発売前の月の商品は載せない

## 開発とデプロイ

```bash
npm run dev      # http://localhost:4321(ローカルの初期データは /_emdash/api/setup/dev-bypass で入る)
npm run deploy   # astro build && wrangler deploy(手動デプロイ)
```

`node_modules` は容量節約のため `game-curation\node_modules` へのジャンクション(依存は同じ)。

`src/layouts/Base.astro` の `google-site-verification` は Search Console の所有権確認用なので消さないでください。

当サイトはファンによる非公式のサイトで、株式会社タミヤとは関係ありません。

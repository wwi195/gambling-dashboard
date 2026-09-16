# ギャンブル収支ダッシュボード

Googleフォームで記録している「収支記録」を、スマホのブラウザで開くだけで
成績が一目で分かる画面にするツールです。競馬・パチンコ・競艇・FX・株など、
シートに記録されている全カテゴリを対象に、日別推移とカテゴリ別の内訳を見られます。

設計の詳細は `docs/superpowers/specs/2026-09-16-gambling-dashboard-design.md` を参照してください。

## セットアップ

1. 「収支記録（回答）」のGoogleスプレッドシートで `ファイル → 共有 → ウェブに公開` を開く
2. 公開対象を該当シート、形式を `カンマ区切り形式 (.csv)` にして公開
3. 発行されたURLを `config.js` の `CSV_URL` に貼る
4. GitHubにこのリポジトリをpushし、Settings → Pages を有効化する
5. 発行されたPages URLをスマホのホーム画面に追加する

## 開発

- `node test/run.js` — ロジック部分（parse/aggregate/chart-data）のテストを実行
- `test/index.html` をブラウザで開いても同じテストが実行される
- `dev.html` をローカルサーバー経由で開くと、`test/fixtures/` の合成データで画面を確認できる
  （`python -m http.server` などで配信してください。`file://` で直接開くと fetch がCORSでブロックされます）

## ディレクトリ構成

- `index.html` / `style.css` — 画面
- `config.js` — CSVの公開URL（利用者が設定）
- `parse.js` — CSVパース・日付/金額の正規化（純粋関数）
- `aggregate.js` — 集計（純粋関数）
- `chart-data.js` — Chart.js設定オブジェクトの組み立て（純粋関数）
- `render.js` — DOM描画
- `app.js` — 起動・fetch・結線
- `test/` — テストコードとブラウザ向けテストランナー

# ギャンブル収支ダッシュボード 設計書

作成日: 2026-09-16

## 1. 目的

Googleフォームで記録している「収支記録」を、スマホのブラウザで開くだけで
成績が一目で分かる画面にする。`fx-dashboard`と同じ考え方（CSV公開URLを
fetchするだけの静的ページ、GitHub Pagesで公開）を踏襲する。

対象は「収支記録（回答）」シート1つ。カテゴリ列に競馬・パチンコ・競艇・FX・株
などが混在しており、今回はそれら**全カテゴリ**を対象にする（FXは
`fx-dashboard`で詳細分析済みだが、このシートでは日次の収支確定額として
他カテゴリと横並びで見る）。

## 2. データソース

シート「収支記録（回答）」（Googleフォーム回答シート）。

列定義:

| 列 | 内容 | 例 |
|---|---|---|
| タイムスタンプ | フォーム送信日時 | `2026/05/26 1:25:41` |
| 年月 | 実際の取引・プレー日（列名に反する。実質「日付」） | `2026/05/24` |
| 収支(円) | その回の収支。プラス/マイナスの整数のみ（FX決済後記録シートのような `(スワップ...)` 注記なし） | `-10000`, `4000`, `0` |
| カテゴリ | 自由記述に近いが実質的に固定的な値（競馬/パチンコ/競艇/FX/株など。今後増える可能性あり） | `パチンコ` |
| メモ | 自由記述。空・複数行・カンマを含みうる | `マルハンリング` |

### 取得方式

`fx-dashboard`と同じ。スプレッドシートを「ファイル → 共有 → ウェブに公開 → CSV」で
公開し、発行されたCSV URLを`config.js`に書く。GitHub Pages上のHTMLから`fetch`する。

### fx-dashboardとの違い

- シートは1つだけ（エントリー前/決済後のような2シート突合が不要）。
  1行 = 1回の収支確定なので、`match.js`に相当する処理は不要。
- 金額パースは単純な符号付き整数のみ（`parseAmount`のスワップ注記パースは不要）。
- 「通貨ペア×方向」の代わりに「カテゴリ別」の内訳を見る。
- ロット/pipsの概念はない（FXシミュレーターではなく実績記録のため）。

## 3. アーキテクチャ

```
gambling-dashboard/
├── index.html              画面構造
├── style.css                スタイル（スマホ縦を基準、fx-dashboardを流用）
├── config.js                CSV URL 1つ
├── parse.js                 CSVパース／日付・金額の正規化（純粋関数）
├── aggregate.js              集計（純粋関数）
├── chart-data.js              Chart.js設定オブジェクトの組み立て（純粋関数）
├── render.js                  DOM描画
├── app.js                     起動・fetch・結線
└── test/
    ├── run.js                 Node向けテストランナー
    ├── harness.js              テストハーネス（fx-dashboardと同一のものを流用）
    ├── index.html              ブラウザ向けテストページ
    └── fixtures/               合成データ（dev.html用）
```

`parse.js` / `aggregate.js` / `chart-data.js` は純粋関数のみ。`render.js`と`app.js`
のみが外部（DOM・fetch）と接する。fx-dashboardと同じ構成方針。

データフロー:

```
app.js 起動
  ├→ config.CSV_URL を fetch
        ↓
   parse.parseCsv()        引用符・改行・カンマを含むセルに対応
        ↓
   parse.normalizeRecord() 1行 → { date, pnl, category, memo, ok }
        ↓
   aggregate.summarize()   期間フィルタを受けて集計
        ↓
   render.draw()
```

## 4. 正規化の仕様

### 4.1 日付 `parse.parseDate(raw)`

「年月」列（`YYYY/MM/DD`形式）をDateにする。この列が実質の取引日。
タイムスタンプ列は使わない（送信日時と実際のプレー日がずれるケースが
多いため。例: `2026/07/01 17:36:29`送信で年月列は`2026/06/30`）。

### 4.2 金額 `parse.parseAmount(raw)`

符号付き整数のみ。`fx-dashboard`の`parseAmount`のような
スワップ注記パース（`-6100(スワップ4940)`等）は不要 — このシートには
出現しない。数値化できなければ `{ ok: false, raw: raw }` とし、
要確認件数として画面に出す（fx-dashboardの`filterValidTrades`除外と同じ方針）。

### 4.3 カテゴリ

固定リストにせず、シートに出現する値をそのまま使う（現状: 競馬/FX/株/
パチンコ/競艇。将来増減してもコード変更不要）。空文字は「未分類」として扱う。

## 5. 集計: `aggregate.js`

`summarize(records, period)` は期間内の有効レコード（`amount.ok && date.ok`）
から以下を算出する（fx-dashboardの`summarize`と対応するが「勝ち/負け」の
意味は「収支がプラス/マイナスの回」に一般化する）。

- `pnlSum`（収支合計）
- `winRate`（収支プラスだった回の割合）
- `count`（件数）
- `avgWin` / `avgLoss`（平均プラス額・平均マイナス額）
- `maxWin` / `maxLoss`
- `dailyPnl`（日別収支・件数）
- `byCategory`（カテゴリ別: `{ category, pnlSum, count, wins }` の配列）

## 6. 表示: `chart-data.js` / `render.js`

- サマリータイル: 収支合計・勝率・件数・平均プラス/平均マイナス・最大勝ち/最大負け
  （fx-dashboardのタイルからスワップ関連を除いたもの）
- 日別推移グラフ（棒グラフ、プラス緑/マイナス赤）。横軸は
  fx-dashboardで確立した「先頭だけ年表記、残りはM/D表記」を最初から採用。
- カテゴリ別内訳（横棒グラフ、`buildPairDirectionChartConfig`と同じ形。
  ラベルがカテゴリ名になるだけ）
- 一覧: 日付・カテゴリ・金額・メモを新しい順に表示（期間フィルタ連動）

「直近N件」タブ相当の機能は今回のスコープ外（YAGNI。カテゴリが混在する
ため「直近」の意味が薄く、必要になれば別途追加）。

## 7. テスト

fx-dashboardと同じ方針: `test/harness.js`（同一）+ `test/run.js`（Node向け）。
`parse.js` / `aggregate.js` / `chart-data.js` それぞれにユニットテストを書く。

## 8. デプロイ

fx-dashboardと同じ手順。新規GitHubリポジトリ `gambling-dashboard`
（public、GitHub Pages有効化）を作成し、pushする。

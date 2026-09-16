var GD = typeof module === 'object' ? require('../aggregate.js') : window.GD;
var T = typeof module === 'object' ? require('./harness.js') : window.GDTest;

T.test('periodRange: allはnull', function () {
  T.assertEqual(GD.periodRange('all', new Date(2026, 8, 15, 10, 0, 0)), null);
});

T.test('periodRange: monthは当月1日0時からnowまで', function () {
  var now = new Date(2026, 8, 15, 10, 30, 0);
  var r = GD.periodRange('month', now);
  T.assertDateEqual(r.start, new Date(2026, 8, 1, 0, 0, 0));
  T.assertDateEqual(r.end, now);
});

T.test('periodRange: weekは直近月曜0時からnowまで', function () {
  var now = new Date(2026, 8, 15, 10, 30, 0);
  var r = GD.periodRange('week', now);
  T.assertEqual(r.start.getDay(), 1);
  T.assertTrue(r.start.getTime() <= now.getTime());
});

T.test('periodRange: 7dはnowの7日前ちょうどからnowまで', function () {
  var now = new Date(2026, 8, 15, 10, 30, 0);
  var r = GD.periodRange('7d', now);
  T.assertEqual(r.end.getTime() - r.start.getTime(), 7 * 24 * 60 * 60 * 1000);
});

function record(category, pnl, dateOk, date) {
  return {
    category: category,
    amount: { ok: true, pnl: pnl },
    date: { ok: dateOk, date: date }
  };
}

T.test('filterValidRecords: 金額または日付が失敗した記録を除外する', function () {
  var records = [
    record('競馬', 100, true, new Date(2026, 5, 1)),
    { category: '競馬', amount: { ok: false, raw: 'x' }, date: { ok: true, date: new Date() } },
    { category: '競馬', amount: { ok: true, pnl: 1 }, date: { ok: false, raw: 'y' } }
  ];
  T.assertEqual(GD.filterValidRecords(records).length, 1);
});

T.test('filterByPeriod: nullなら全件通す', function () {
  var records = [record('競馬', 100, true, new Date(2026, 5, 1))];
  T.assertEqual(GD.filterByPeriod(records, null).length, 1);
});

T.test('filterByPeriod: 範囲内のみ残す', function () {
  var records = [
    record('競馬', 100, true, new Date(2026, 5, 1)),
    record('競馬', 200, true, new Date(2026, 5, 10))
  ];
  var period = { start: new Date(2026, 5, 5), end: new Date(2026, 5, 15) };
  var filtered = GD.filterByPeriod(records, period);
  T.assertEqual(filtered.length, 1);
  T.assertEqual(filtered[0].amount.pnl, 200);
});

T.test('summarize: 複数カテゴリのフィクスチャで全指標を検証', function () {
  var records = [
    record('競馬', 100, true, new Date(2026, 5, 1)),
    record('競馬', -50, true, new Date(2026, 5, 1)),
    record('パチンコ', 4000, true, new Date(2026, 5, 2)),
    record('パチンコ', -39000, true, new Date(2026, 5, 3))
  ];
  var s = GD.summarize(records, null);
  T.assertEqual(s.pnlSum, 100 - 50 + 4000 - 39000);
  T.assertEqual(s.count, 4);
  T.assertEqual(s.winRate, 2 / 4);
  T.assertEqual(s.avgWin, (100 + 4000) / 2);
  T.assertEqual(s.avgLoss, (50 + 39000) / 2);
  T.assertEqual(s.maxWin, 4000);
  T.assertEqual(s.maxLoss, -39000);
  T.assertEqual(s.dailyPnl, [
    { date: '2026-06-01', pnl: 50, count: 2 },
    { date: '2026-06-02', pnl: 4000, count: 1 },
    { date: '2026-06-03', pnl: -39000, count: 1 }
  ]);
});

T.test('summarize: カテゴリ別に収支合計順で内訳を出す', function () {
  var records = [
    record('競馬', 100, true, new Date(2026, 5, 1)),
    record('競馬', -50, true, new Date(2026, 5, 1)),
    record('パチンコ', 4000, true, new Date(2026, 5, 2)),
    record('パチンコ', -39000, true, new Date(2026, 5, 3))
  ];
  var s = GD.summarize(records, null);
  T.assertEqual(s.byCategory, [
    { category: '競馬', pnlSum: 50, count: 2, winRate: 0.5 },
    { category: 'パチンコ', pnlSum: -35000, count: 2, winRate: 0.5 }
  ]);
});

T.test('summarize: 件数0件ならwinRate/avgWin/avgLoss/maxWin/maxLossはnull', function () {
  var s = GD.summarize([], null);
  T.assertEqual(s.winRate, null);
  T.assertEqual(s.avgWin, null);
  T.assertEqual(s.avgLoss, null);
  T.assertEqual(s.maxWin, null);
  T.assertEqual(s.maxLoss, null);
  T.assertEqual(s.byCategory, []);
});

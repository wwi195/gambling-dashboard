var GD = typeof module === 'object' ? require('../parse.js') : window.GD;
var T = typeof module === 'object' ? require('./harness.js') : window.GDTest;

T.test('parseAmount: 符号付き整数を数値化する', function () {
  T.assertEqual(GD.parseAmount('-10000'), { ok: true, pnl: -10000 });
  T.assertEqual(GD.parseAmount('4000'), { ok: true, pnl: 4000 });
  T.assertEqual(GD.parseAmount('0'), { ok: true, pnl: 0 });
});

T.test('parseAmount: 数値化できないものはok:false', function () {
  T.assertEqual(GD.parseAmount(''), { ok: false, raw: '' });
  T.assertEqual(GD.parseAmount(null), { ok: false, raw: null });
  T.assertEqual(GD.parseAmount('-6100(スワップ4940)'), { ok: false, raw: '-6100(スワップ4940)' });
});

T.test('parseDate: YYYY/MM/DDをDateにする', function () {
  var r = GD.parseDate('2026/06/23');
  T.assertTrue(r.ok);
  T.assertDateEqual(r.date, new Date(2026, 5, 23));
});

T.test('parseDate: 不正な値はok:false', function () {
  T.assertEqual(GD.parseDate(''), { ok: false, raw: '' });
  T.assertEqual(GD.parseDate('2026/13/01'), { ok: false, raw: '2026/13/01' });
  T.assertEqual(GD.parseDate('abc'), { ok: false, raw: 'abc' });
});

T.test('parseCsv: 引用符内のカンマ・改行に対応', function () {
  var text = 'a,b\n"1,2","line1\nline2"\n';
  var rows = GD.parseCsv(text);
  T.assertEqual(rows, [['a', 'b'], ['1,2', 'line1\nline2']]);
});

T.test('normalizeRecord: 列順どおりに変換する', function () {
  var row = ['2026/06/05 21:18:11', '2026/06/05', '160000', 'パチンコ', 'マルハンリング'];
  var r = GD.normalizeRecord(row);
  T.assertTrue(r.date.ok);
  T.assertDateEqual(r.date.date, new Date(2026, 5, 5));
  T.assertEqual(r.amount, { ok: true, pnl: 160000 });
  T.assertEqual(r.category, 'パチンコ');
  T.assertEqual(r.memo, 'マルハンリング');
});

T.test('normalizeRecord: カテゴリが空なら未分類にする', function () {
  var row = ['2026/05/31 11:12:28', '2026/05/29', '2240', '', ''];
  var r = GD.normalizeRecord(row);
  T.assertEqual(r.category, '未分類');
});

T.test('normalizeRecords: 複数行をまとめて変換する', function () {
  var rows = [
    ['2026/06/05 21:18:11', '2026/06/05', '160000', 'パチンコ', 'マルハンリング'],
    ['2026/06/06 15:10:57', '2026/06/06', '-200', '競馬', '阪神7']
  ];
  var result = GD.normalizeRecords(rows);
  T.assertEqual(result.length, 2);
  T.assertEqual(result[1].category, '競馬');
});

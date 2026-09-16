var GD = typeof module === 'object' ? require('../chart-data.js') : window.GD;
var T = typeof module === 'object' ? require('./harness.js') : window.GDTest;

T.test('buildDailyPnlChartConfig: labels/data/色を組み立てる', function () {
  var dailyPnl = [
    { date: '2026-06-01', pnl: 500, count: 2 },
    { date: '2026-06-02', pnl: -200, count: 1 }
  ];
  var config = GD.buildDailyPnlChartConfig(dailyPnl);
  T.assertEqual(config.data.labels, ['2026-06-01', '2026-06-02']);
  T.assertEqual(config.data.datasets[0].data, [500, -200]);
  T.assertEqual(config.data.datasets[0].backgroundColor, ['#2f9e59', '#c0392b']);
  T.assertEqual(config.type, 'bar');
});

T.test('buildDailyPnlChartConfig: 横軸ラベルは先頭だけ年表記、他はM/D表記', function () {
  var dailyPnl = [
    { date: '2026-06-01', pnl: 500, count: 2 },
    { date: '2026-06-02', pnl: -200, count: 1 },
    { date: '2026-09-08', pnl: 100, count: 1 }
  ];
  var config = GD.buildDailyPnlChartConfig(dailyPnl);
  var tickFn = config.options.scales.x.ticks.callback;
  T.assertEqual(tickFn(null, 0), '2026/6/1');
  T.assertEqual(tickFn(null, 1), '6/2');
  T.assertEqual(tickFn(null, 2), '9/8');
});

T.test('buildCategoryChartConfig: labels/data/色を組み立てる', function () {
  var byCategory = [
    { category: '競馬', pnlSum: 50, count: 2, winRate: 0.5 },
    { category: 'パチンコ', pnlSum: -35000, count: 2, winRate: 0.5 }
  ];
  var config = GD.buildCategoryChartConfig(byCategory);
  T.assertEqual(config.data.labels, ['競馬', 'パチンコ']);
  T.assertEqual(config.data.datasets[0].data, [50, -35000]);
  T.assertEqual(config.data.datasets[0].backgroundColor, ['#2f9e59', '#c0392b']);
  T.assertEqual(config.options.indexAxis, 'y');
});

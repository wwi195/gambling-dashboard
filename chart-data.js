(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GD = root.GD || {};
    Object.assign(root.GD, factory());
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var COLOR_PLUS = '#2f9e59';
  var COLOR_MINUS = '#c0392b';

  function formatDailyAxisLabel(dateStr, isFirst) {
    var parts = dateStr.split('-');
    var y = parts[0];
    var m = String(Number(parts[1]));
    var d = String(Number(parts[2]));
    return isFirst ? (y + '/' + m + '/' + d) : (m + '/' + d);
  }

  function buildDailyPnlChartConfig(dailyPnl) {
    return {
      type: 'bar',
      data: {
        labels: dailyPnl.map(function (d) { return d.date; }),
        datasets: [{
          data: dailyPnl.map(function (d) { return d.pnl; }),
          backgroundColor: dailyPnl.map(function (d) { return d.pnl >= 0 ? COLOR_PLUS : COLOR_MINUS; })
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true },
          x: {
            ticks: {
              callback: function (value, index) {
                return formatDailyAxisLabel(dailyPnl[index].date, index === 0);
              }
            }
          }
        }
      }
    };
  }

  function buildCategoryChartConfig(byCategory) {
    return {
      type: 'bar',
      data: {
        labels: byCategory.map(function (c) { return c.category; }),
        datasets: [{
          data: byCategory.map(function (c) { return c.pnlSum; }),
          backgroundColor: byCategory.map(function (c) { return c.pnlSum >= 0 ? COLOR_PLUS : COLOR_MINUS; })
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } }
      }
    };
  }

  return {
    buildDailyPnlChartConfig: buildDailyPnlChartConfig,
    buildCategoryChartConfig: buildCategoryChartConfig
  };
});

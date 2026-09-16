(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GD = root.GD || {};
    Object.assign(root.GD, factory());
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function periodRange(key, now) {
    if (key === 'all') return null;
    if (key === 'month') {
      return { start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0), end: now };
    }
    if (key === 'week') {
      var day = now.getDay();
      var diffToMonday = day === 0 ? 6 : day - 1;
      var start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0);
      return { start: start, end: now };
    }
    if (key === '7d') {
      var start7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { start: start7, end: now };
    }
    return null;
  }

  function filterValidRecords(records) {
    return records.filter(function (r) {
      return r.amount && r.amount.ok && r.date && r.date.ok;
    });
  }

  function filterByPeriod(records, period) {
    if (!period) return records;
    return records.filter(function (r) {
      var time = r.date.date.getTime();
      return time >= period.start.getTime() && time <= period.end.getTime();
    });
  }

  function formatDateKey(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1);
    var d = String(date.getDate());
    if (m.length < 2) m = '0' + m;
    if (d.length < 2) d = '0' + d;
    return y + '-' + m + '-' + d;
  }

  function sum(arr) {
    return arr.reduce(function (a, b) { return a + b; }, 0);
  }

  function summarize(records, period) {
    var valid = filterValidRecords(records);
    var excludedCount = records.length - valid.length;
    var inRange = filterByPeriod(valid, period);

    var pnlSum = 0;
    var wins = [];
    var losses = [];
    var dailyMap = {};
    var categoryMap = {};

    inRange.forEach(function (r) {
      var pnl = r.amount.pnl;
      pnlSum += pnl;
      if (pnl > 0) wins.push(pnl);
      if (pnl < 0) losses.push(pnl);

      var dateKey = formatDateKey(r.date.date);
      if (!dailyMap[dateKey]) dailyMap[dateKey] = { pnl: 0, count: 0 };
      dailyMap[dateKey].pnl += pnl;
      dailyMap[dateKey].count += 1;

      if (!categoryMap[r.category]) {
        categoryMap[r.category] = { category: r.category, pnlSum: 0, count: 0, wins: 0 };
      }
      categoryMap[r.category].pnlSum += pnl;
      categoryMap[r.category].count += 1;
      if (pnl > 0) categoryMap[r.category].wins += 1;
    });

    var dailyPnl = Object.keys(dailyMap).sort().map(function (key) {
      return { date: key, pnl: dailyMap[key].pnl, count: dailyMap[key].count };
    });

    var byCategory = Object.keys(categoryMap)
      .map(function (key) { return categoryMap[key]; })
      .sort(function (a, b) { return b.pnlSum - a.pnlSum; })
      .map(function (c) {
        return {
          category: c.category,
          pnlSum: c.pnlSum,
          count: c.count,
          winRate: c.count > 0 ? c.wins / c.count : null
        };
      });

    return {
      pnlSum: pnlSum,
      count: inRange.length,
      winRate: inRange.length > 0 ? wins.length / inRange.length : null,
      avgWin: wins.length > 0 ? sum(wins) / wins.length : null,
      avgLoss: losses.length > 0 ? Math.abs(sum(losses)) / losses.length : null,
      maxWin: wins.length > 0 ? Math.max.apply(null, wins) : null,
      maxLoss: losses.length > 0 ? Math.min.apply(null, losses) : null,
      dailyPnl: dailyPnl,
      byCategory: byCategory,
      excludedCount: excludedCount
    };
  }

  // 直近limit件の記録を古い順に並べ、最新から数えた相対ラベルを付ける。
  // 呼び出し側で有効な記録(amount.ok && date.ok)に絞ってから渡すこと。
  function recentRecordsSeries(records, limit) {
    var sorted = records.slice().sort(function (a, b) {
      return a.date.date.getTime() - b.date.date.getTime();
    });
    var recent = limit ? sorted.slice(-limit) : sorted;
    var n = recent.length;
    return recent.map(function (r, i) {
      var distanceFromLatest = n - 1 - i;
      var label = distanceFromLatest === 0 ? '最新' : (distanceFromLatest + 1) + '回前';
      return { label: label, pnl: r.amount.pnl };
    });
  }

  return {
    periodRange: periodRange,
    filterValidRecords: filterValidRecords,
    filterByPeriod: filterByPeriod,
    summarize: summarize,
    recentRecordsSeries: recentRecordsSeries
  };
});

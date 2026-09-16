(function () {
  'use strict';

  var RECENT_RECORDS_LIMIT = 20;

  function main() {
    var els = {
      errorBanner: document.getElementById('error-banner'),
      emptyState: document.getElementById('empty-state'),
      main: document.getElementById('app-main'),
      periodFilter: document.getElementById('period-filter'),
      summary: document.getElementById('summary-tiles'),
      dailyChartTitle: document.getElementById('daily-chart-title'),
      genreSelect: document.getElementById('genre-select'),
      dailyCanvas: document.getElementById('daily-chart'),
      categoryCanvas: document.getElementById('category-chart'),
      categoryList: document.getElementById('category-list'),
      recordList: document.getElementById('record-list')
    };

    var state = {
      records: [],
      periodKey: 'all',
      genre: 'all',
      dailyChart: null,
      categoryChart: null
    };

    function showError(message) {
      GD.renderError(els.errorBanner, message);
      els.main.hidden = true;
    }

    function recordsForPeriod(allRecords, periodKey) {
      var period = GD.periodRange(periodKey, new Date());
      return allRecords.filter(function (r) {
        if (!r.date || !r.date.ok) return periodKey === 'all';
        return GD.filterByPeriod([r], period).length > 0;
      });
    }

    function rerender() {
      if (state.records.length === 0) {
        els.emptyState.hidden = false;
        els.main.hidden = true;
        return;
      }

      els.emptyState.hidden = true;
      els.main.hidden = false;

      var period = GD.periodRange(state.periodKey, new Date());
      var summary = GD.summarize(state.records, period);
      var visibleRecords = recordsForPeriod(state.records, state.periodKey);

      GD.renderSummary(els.summary, summary);

      var dailyChartData;
      var dailyMetric;
      if (state.genre === 'all') {
        dailyChartData = summary.dailyPnl;
        dailyMetric = 'daily';
        els.dailyChartTitle.textContent = '日別推移';
      } else {
        var periodValidRecords = GD.filterByPeriod(GD.filterValidRecords(state.records), period);
        var genreRecords = periodValidRecords.filter(function (r) { return r.category === state.genre; });
        dailyChartData = GD.recentRecordsSeries(genreRecords, RECENT_RECORDS_LIMIT);
        dailyMetric = 'recent';
        els.dailyChartTitle.textContent = state.genre + ' 直近' + dailyChartData.length + '回';
      }
      state.dailyChart = GD.renderDailyChart(els.dailyCanvas, dailyChartData, state.dailyChart, dailyMetric);

      state.categoryChart = GD.renderCategory(els.categoryCanvas, els.categoryList, summary.byCategory, state.categoryChart);
      GD.renderRecordList(els.recordList, visibleRecords);
    }

    function onPeriodClick(event) {
      var btn = event.target.closest('[data-period]');
      if (!btn) return;
      state.periodKey = btn.getAttribute('data-period');
      Array.prototype.forEach.call(els.periodFilter.querySelectorAll('[data-period]'), function (b) {
        b.classList.toggle('active', b === btn);
      });
      rerender();
    }

    function onGenreChange() {
      state.genre = els.genreSelect.value;
      rerender();
    }

    function populateGenreOptions(records) {
      var counts = {};
      records.forEach(function (r) {
        counts[r.category] = (counts[r.category] || 0) + 1;
      });
      Object.keys(counts)
        .sort(function (a, b) { return counts[b] - counts[a]; })
        .forEach(function (category) {
          var opt = document.createElement('option');
          opt.value = category;
          opt.textContent = category;
          els.genreSelect.appendChild(opt);
        });
    }

    function fetchCsv(url) {
      return fetch(url).then(function (res) {
        if (!res.ok) throw new Error('HTTPエラー: ' + res.status);
        return res.text();
      });
    }

    els.periodFilter.addEventListener('click', onPeriodClick);
    els.genreSelect.addEventListener('change', onGenreChange);

    if (!window.GD_CONFIG || !GD_CONFIG.CSV_URL) {
      showError(
        'CSVの公開URLが未設定です。config.js に、Googleスプレッドシートを「ウェブに公開（CSV形式）」して発行されたURLを貼ってください。'
      );
      return;
    }

    fetchCsv(GD_CONFIG.CSV_URL)
      .then(function (text) {
        var rows = GD.parseCsv(text).slice(1);
        state.records = GD.normalizeRecords(rows);
        populateGenreOptions(state.records);
        rerender();
      })
      .catch(function (err) {
        showError(
          'データの取得に失敗しました（' + err.message + '）。' +
          'スプレッドシートが「ウェブに公開」されているか、config.js のURLが正しいか確認してください。'
        );
      });
  }

  document.addEventListener('DOMContentLoaded', main);
})();

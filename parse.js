(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GD = root.GD || {};
    Object.assign(root.GD, factory());
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  // normalizeRecord は列の並び順（インデックス）に依存する。
  // 列順: タイムスタンプ,年月,収支(円),カテゴリ,メモ
  // 「年月」列は列名に反して実際の取引・プレー日が入っている（タイムスタンプは送信日時）。

  function parseAmount(raw) {
    if (raw === null || raw === undefined) return { ok: false, raw: raw };
    var s = String(raw).trim();
    if (s === '' || !/^-?\d+(\.\d+)?$/.test(s)) return { ok: false, raw: raw };
    return { ok: true, pnl: parseFloat(s) };
  }

  function parseDate(raw) {
    if (!raw) return { ok: false, raw: raw };
    var trimmed = String(raw).trim();
    var segs = trimmed.split('/');
    if (segs.length !== 3) return { ok: false, raw: raw };
    var year = parseInt(segs[0], 10);
    var month = parseInt(segs[1], 10);
    var day = parseInt(segs[2], 10);
    if ([year, month, day].some(function (n) { return isNaN(n); })) return { ok: false, raw: raw };
    if (month < 1 || month > 12 || day < 1 || day > 31) return { ok: false, raw: raw };
    return { ok: true, date: new Date(year, month - 1, day) };
  }

  function parseCsv(text) {
    var rows = [];
    var row = [];
    var field = '';
    var inQuotes = false;
    var i = 0;
    var len = text.length;

    function pushField() {
      row.push(field);
      field = '';
    }
    function pushRow() {
      pushField();
      rows.push(row);
      row = [];
    }

    while (i < len) {
      var ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i += 2;
            continue;
          } else {
            inQuotes = false;
            i += 1;
            continue;
          }
        } else {
          field += ch;
          i += 1;
          continue;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
          i += 1;
          continue;
        } else if (ch === ',') {
          pushField();
          i += 1;
          continue;
        } else if (ch === '\r') {
          i += 1;
          continue;
        } else if (ch === '\n') {
          pushRow();
          i += 1;
          continue;
        } else {
          field += ch;
          i += 1;
          continue;
        }
      }
    }

    if (field.length > 0 || row.length > 0) {
      pushRow();
    }

    return rows;
  }

  function normalizeRecord(row) {
    return {
      date: parseDate(row[1]),
      amount: parseAmount(row[2]),
      category: (row[3] || '').trim() || '未分類',
      memo: row[4] || ''
    };
  }

  function normalizeRecords(rows) {
    return rows.map(normalizeRecord);
  }

  return {
    parseAmount: parseAmount,
    parseDate: parseDate,
    parseCsv: parseCsv,
    normalizeRecord: normalizeRecord,
    normalizeRecords: normalizeRecords
  };
});

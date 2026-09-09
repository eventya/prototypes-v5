/* Static chart kit for the AI Dashboard prototype.
   Pure DOM/SVG, mock data only — no backend, no framework, no CDN.
   Colours are mid-tone hexes so they read on both light and dark themes;
   everything structural (gridlines, tracks, labels) uses design-system tokens
   so it flips automatically with data-theme. */
(function () {
  // Channel palette — mirrors Stejar::Presenters::AiTokenUsage::AUDIENCE_STYLE,
  // with the public audience split into website vs mobile app.
  var C = {
    website: '#0ea5e9',   // sky-500    — public, on the website
    app:     '#06b6d4',   // cyan-500   — public, in the mobile app
    backend: '#8b5cf6',   // violet-500 — the CMS assistant
    helpdesk:'#10b981',   // emerald-500— AI drafts for agents
    amber:   '#f59e0b',
    rose:    '#f43f5e',
    indigo:  '#6366f1',
    muted:   '#94a3b8'
  };

  function fmt(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function money(n) {
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d)\.)/g, ',');
  }

  // ---- Multi-series line/area. series:[{data:[…], color, label, dashed}] ----
  function line(node, series) {
    var W = 640, H = 190, pad = 10;
    var len = series[0].data.length;
    var max = Math.max.apply(null, series.reduce(function (a, s) { return a.concat(s.data); }, []).concat([1]));
    var xs = function (i) { return pad + i * ((W - 2 * pad) / (len - 1)); };
    var ys = function (v) { return H - pad - (v / max) * (H - 2 * pad - 12); };

    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" preserveAspectRatio="none" role="img">';
    for (var g = 0; g <= 3; g++) {
      var gy = pad + g * ((H - 2 * pad) / 3);
      svg += '<line x1="' + pad + '" y1="' + gy + '" x2="' + (W - pad) + '" y2="' + gy +
             '" stroke="var(--color-surface-200)" stroke-width="1"/>';
    }
    series.forEach(function (s) {
      var pts = s.data.map(function (v, i) { return xs(i) + ',' + ys(v); }).join(' ');
      if (!s.dashed) {
        var area = pts + ' ' + xs(len - 1) + ',' + (H - pad) + ' ' + xs(0) + ',' + (H - pad);
        svg += '<polygon points="' + area + '" fill="' + s.color + '" opacity="0.10"/>';
      }
      svg += '<polyline points="' + pts + '" fill="none" stroke="' + s.color + '" stroke-width="2.5" ' +
             'stroke-linejoin="round" stroke-linecap="round"' + (s.dashed ? ' stroke-dasharray="5 5"' : '') + '/>';
    });
    svg += '</svg>';
    node.innerHTML = svg;
  }

  // ---- Stacked columns. rows:[{a:1,b:2,…}], segs:[{key,color,label}] ----
  function stacked(node, rows, segs, unit) {
    var totals = rows.map(function (r) {
      return segs.reduce(function (s, seg) { return s + (r[seg.key] || 0); }, 0);
    });
    var max = Math.max.apply(null, totals.concat([1]));
    var html = '<div style="display:flex;align-items:flex-end;gap:3px;height:200px">';
    rows.forEach(function (r, i) {
      var title = segs.map(function (seg) { return seg.label + ' ' + fmt(r[seg.key] || 0); }).join(' · ');
      html += '<div title="' + title + ' — total ' + fmt(totals[i]) + (unit ? ' ' + unit : '') + '" ' +
              'style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%;gap:1px">';
      // top segment first so the stack reads in the legend's order bottom-up
      segs.slice().reverse().forEach(function (seg, j) {
        var h = ((r[seg.key] || 0) / max) * 100;
        var radius = j === 0 ? '3px 3px 0 0' : '0';
        html += '<div style="height:' + h + '%;background:' + seg.color + ';border-radius:' + radius + ';min-height:1px"></div>';
      });
      html += '</div>';
    });
    html += '</div>';
    node.innerHTML = html;
  }

  // ---- Donut. parts:[{label,value,color}] ----
  function donut(node, parts, centerTop, centerBottom) {
    var total = parts.reduce(function (s, p) { return s + p.value; }, 0) || 1;
    var r = 54, cx = 70, cy = 70, circ = 2 * Math.PI * r, off = 0;
    var svg = '<svg viewBox="0 0 140 140" width="140" height="140" role="img">';
    parts.forEach(function (p) {
      var len = (p.value / total) * circ;
      svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + p.color +
             '" stroke-width="20" stroke-dasharray="' + len + ' ' + (circ - len) +
             '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"><title>' +
             p.label + ' — ' + fmt(p.value) + '</title></circle>';
      off += len;
    });
    svg += '<text x="70" y="66" text-anchor="middle" font-size="21" font-weight="700" fill="var(--color-ink-900)">' +
           (centerTop != null ? centerTop : fmt(total)) + '</text>';
    svg += '<text x="70" y="84" text-anchor="middle" font-size="10" fill="var(--color-ink-400)">' +
           (centerBottom || 'Total') + '</text></svg>';
    node.innerHTML = svg;
  }

  // ---- Horizontal bar list. rows:[{label,value,color,display,note}] ----
  // `value` always drives the bar width; `display` overrides the printed figure
  // when the bar is sized by one quantity but read as another (e.g. cost).
  function hbars(node, rows) {
    var max = Math.max.apply(null, rows.map(function (r) { return r.value; }).concat([1]));
    var html = '<div style="display:flex;flex-direction:column;gap:12px">';
    rows.forEach(function (r) {
      html += '<div>' +
        '<div style="display:flex;justify-content:space-between;gap:12px;font-size:13px;margin-bottom:5px">' +
          '<span style="color:var(--color-ink-700);font-weight:500;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + r.label + '</span>' +
          '<span style="color:var(--color-ink-900);font-weight:600;white-space:nowrap">' + (r.display != null ? r.display : fmt(r.value)) +
            (r.note ? ' <span style="color:var(--color-ink-400);font-weight:500">' + r.note + '</span>' : '') +
          '</span>' +
        '</div>' +
        '<div style="height:8px;border-radius:999px;background:var(--color-surface-200)">' +
          '<div style="height:100%;width:' + (r.value / max * 100) + '%;background:' + (r.color || C.indigo) + ';border-radius:999px"></div>' +
        '</div></div>';
    });
    html += '</div>';
    node.innerHTML = html;
  }

  // ---- Vertical bars. data:[{label,value,color}] ----
  function bars(node, data, color) {
    var max = Math.max.apply(null, data.map(function (d) { return d.value; }).concat([1]));
    var html = '<div style="display:flex;align-items:flex-end;gap:14px;height:190px;padding-top:10px">';
    data.forEach(function (d) {
      html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:6px">' +
        '<div style="font-size:12px;font-weight:600;color:var(--color-ink-700)">' + fmt(d.value) + '</div>' +
        '<div style="width:100%;max-width:52px;height:' + (d.value / max * 100) + '%;min-height:4px;background:' +
          (d.color || color || C.indigo) + ';border-radius:6px 6px 0 0"></div>' +
        '<div style="font-size:11px;color:var(--color-ink-400);text-align:center">' + d.label + '</div>' +
        '</div>';
    });
    html += '</div>';
    node.innerHTML = html;
  }

  // ---- One stacked horizontal bar + legend. parts:[{label,value,color,money}] ----
  // Mirrors the shared stejar/shared/_ai_token_usage partial.
  function splitBar(node, parts) {
    var total = parts.reduce(function (s, p) { return s + p.value; }, 0) || 1;
    var html = '<div style="display:flex;height:12px;border-radius:999px;overflow:hidden;background:var(--color-surface-100)">';
    parts.forEach(function (p) {
      html += '<div title="' + p.label + ' — ' + fmt(p.value) + '" style="width:' + (p.value / total * 100) + '%;background:' + p.color + '"></div>';
    });
    html += '</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-top:12px">';
    parts.forEach(function (p) {
      html += '<div style="display:flex;align-items:center;gap:7px;min-width:0">' +
        '<span style="width:8px;height:8px;border-radius:999px;flex-shrink:0;background:' + p.color + '"></span>' +
        '<span style="font-size:12px;color:var(--color-ink-500);min-width:0">' + p.label +
          ' <span style="color:var(--color-ink-800);font-weight:600">' + fmt(p.value) + '</span>' +
          (p.money != null ? ' <span style="color:var(--color-ink-400)">· ' + money(p.money) + '</span>' : '') +
        '</span></div>';
    });
    html += '</div>';
    node.innerHTML = html;
  }

  // ---- Funnel. rows:[{label,value,percent,color,indent,note}] ----
  // Mirrors Presenters::AiAgentStats#funnel_rows.
  function funnel(node, rows) {
    var html = '<div style="display:flex;flex-direction:column;gap:13px">';
    rows.forEach(function (r) {
      html += '<div>' +
        '<div style="display:flex;justify-content:space-between;gap:12px;font-size:12.5px;margin-bottom:5px">' +
          '<span style="color:var(--color-ink-600);' + (r.indent ? 'padding-left:14px' : '') + '">' +
            (r.indent ? '↳ ' : '') + r.label + '</span>' +
          '<span style="color:var(--color-ink-800);font-weight:600;white-space:nowrap">' + fmt(r.value) + ' · ' + r.percent + '%</span>' +
        '</div>' +
        '<div style="height:10px;border-radius:999px;background:var(--color-surface-100)">' +
          '<div style="height:100%;width:' + r.percent + '%;min-width:2px;background:' + r.color + ';border-radius:999px"></div>' +
        '</div>' +
        (r.note ? '<div style="font-size:11px;color:var(--color-ink-400);margin-top:4px">' + r.note + '</div>' : '') +
        '</div>';
    });
    html += '</div>';
    node.innerHTML = html;
  }

  // ---- Rating distribution, 5★ down to 1★. counts:{1:n,…,5:n} ----
  function ratings(node, counts) {
    var total = Object.keys(counts).reduce(function (s, k) { return s + counts[k]; }, 0) || 1;
    var tone = { 5: '#10b981', 4: '#84cc16', 3: '#f59e0b', 2: '#fb923c', 1: '#f43f5e' };
    var html = '<div style="display:flex;flex-direction:column;gap:10px">';
    [5, 4, 3, 2, 1].forEach(function (stars) {
      var v = counts[stars] || 0;
      html += '<div style="display:flex;align-items:center;gap:10px">' +
        '<span style="font-size:12px;color:var(--color-ink-500);width:34px;white-space:nowrap">' + stars + '★</span>' +
        '<div style="flex:1;height:9px;border-radius:999px;background:var(--color-surface-100)">' +
          '<div style="height:100%;width:' + (v / total * 100) + '%;min-width:' + (v ? '3px' : '0') +
            ';background:' + tone[stars] + ';border-radius:999px"></div>' +
        '</div>' +
        '<span style="font-size:12px;color:var(--color-ink-700);font-weight:600;width:34px;text-align:right">' + v + '</span>' +
        '</div>';
    });
    html += '</div>';
    node.innerHTML = html;
  }

  // ---- Tiny inline trend line, for KPI cards ----
  function spark(node, data, color) {
    var W = 120, H = 32, pad = 3;
    var max = Math.max.apply(null, data.concat([1]));
    var min = Math.min.apply(null, data);
    var xs = function (i) { return pad + i * ((W - 2 * pad) / (data.length - 1)); };
    var ys = function (v) { return H - pad - ((v - min) / (max - min || 1)) * (H - 2 * pad); };
    var pts = data.map(function (v, i) { return xs(i) + ',' + ys(v); }).join(' ');
    node.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" preserveAspectRatio="none">' +
      '<polygon points="' + pts + ' ' + xs(data.length - 1) + ',' + H + ' ' + xs(0) + ',' + H + '" fill="' + color + '" opacity="0.12"/>' +
      '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
      '</svg>';
  }

  // ---- Segment switcher used by the Public tab (Tot / Website / App) ----
  // Restyles the [data-segbtn] buttons, then hands the chosen id back to the
  // page so it can swap the numbers and redraw its charts.
  window.showSeg = function (id, onChange) {
    document.querySelectorAll('[data-segbtn]').forEach(function (b) {
      var on = b.getAttribute('data-segbtn') === id;
      b.className = on
        ? 'px-3 py-1.5 rounded-md text-[12.5px] font-semibold bg-surface-0 text-ink-900 shadow-sm'
        : 'px-3 py-1.5 rounded-md text-[12.5px] font-medium text-ink-500 hover:text-ink-800 transition-colors';
    });
    if (typeof onChange === 'function') onChange(id);
  };

  window.Charts = {
    line: line, stacked: stacked, donut: donut, hbars: hbars, bars: bars,
    splitBar: splitBar, funnel: funnel, ratings: ratings, spark: spark,
    C: C, fmt: fmt, money: money
  };
})();

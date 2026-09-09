/* Static chart kit for the Rapoarte prototype.
   Pure DOM/SVG, mock data only — no backend, no framework.
   Renders into a container by id via data-chart attributes. */
(function () {
  var C = {
    teal: '#1cc39a', tealDeep: '#0d8e6e', red: '#ef4e57', amber: '#f0b228',
    blue: '#3b78ff', violet: '#a05cd6', green: '#1da46a', gray: '#cfd2d6', grayMid: '#9aa0aa'
  };

  function el(tag, attrs, html) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  }

  // ---- Line chart: { series:[{data:[...], color, dashed}], } ----
  function line(node, series) {
    var W = 640, H = 180, pad = 10;
    var len = series[0].data.length;
    var max = Math.max.apply(null, series.flatMap(function (s) { return s.data; }).concat([1]));
    var xs = function (i) { return pad + i * ((W - 2 * pad) / (len - 1)); };
    var ys = function (v) { return H - pad - (v / max) * (H - 2 * pad - 12); };
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" preserveAspectRatio="none">';
    // gridlines
    for (var g = 0; g <= 3; g++) {
      var gy = pad + g * ((H - 2 * pad) / 3);
      svg += '<line x1="' + pad + '" y1="' + gy + '" x2="' + (W - pad) + '" y2="' + gy + '" stroke="var(--color-surface-200)" stroke-width="1"/>';
    }
    series.forEach(function (s) {
      var pts = s.data.map(function (v, i) { return xs(i) + ',' + ys(v); }).join(' ');
      if (!s.dashed) {
        var area = pts + ' ' + xs(len - 1) + ',' + (H - pad) + ' ' + xs(0) + ',' + (H - pad);
        svg += '<polygon points="' + area + '" fill="' + s.color + '" opacity="0.08"/>';
      }
      svg += '<polyline points="' + pts + '" fill="none" stroke="' + s.color + '" stroke-width="2.5" ' +
        'stroke-linejoin="round" stroke-linecap="round"' + (s.dashed ? ' stroke-dasharray="5 5"' : '') + '/>';
    });
    svg += '</svg>';
    node.innerHTML = svg;
  }

  // ---- Stacked bars (backlog): data:[{opened, closed}] ----
  function stacked(node, data) {
    var max = Math.max.apply(null, data.map(function (d) { return d.opened + d.closed; }).concat([1]));
    var html = '<div style="display:flex;align-items:flex-end;gap:3px;height:200px">';
    data.forEach(function (d) {
      var oh = (d.opened / max) * 100, ch = (d.closed / max) * 100;
      html += '<div title="Deschise ' + d.opened + ' · Închise ' + d.closed + '" ' +
        'style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%;gap:1px">' +
        '<div style="height:' + oh + '%;background:' + C.red + ';border-radius:2px 2px 0 0;min-height:2px"></div>' +
        '<div style="height:' + ch + '%;background:' + C.green + ';border-radius:0 0 2px 2px;min-height:2px"></div>' +
        '</div>';
    });
    html += '</div>';
    node.innerHTML = html;
  }

  // ---- Donut: parts:[{label, value, color}] ----
  function donut(node, parts, centerTop, centerBottom) {
    var total = parts.reduce(function (s, p) { return s + p.value; }, 0) || 1;
    var r = 54, cx = 70, cy = 70, circ = 2 * Math.PI * r, off = 0;
    var svg = '<svg viewBox="0 0 140 140" width="140" height="140">';
    parts.forEach(function (p) {
      var len = (p.value / total) * circ;
      svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + p.color +
        '" stroke-width="20" stroke-dasharray="' + len + ' ' + (circ - len) + '" stroke-dashoffset="' + (-off) +
        '" transform="rotate(-90 ' + cx + ' ' + cy + ')"/>';
      off += len;
    });
    svg += '<text x="70" y="66" text-anchor="middle" font-size="22" font-weight="700" fill="var(--color-ink-900)">' + (centerTop || total) + '</text>';
    svg += '<text x="70" y="84" text-anchor="middle" font-size="10" fill="var(--color-ink-400)">' + (centerBottom || 'Total') + '</text>';
    svg += '</svg>';
    node.innerHTML = svg;
  }

  // ---- Horizontal bar list: rows:[{label, value, color}] ----
  function hbars(node, rows) {
    var max = Math.max.apply(null, rows.map(function (r) { return r.value; }).concat([1]));
    var html = '<div style="display:flex;flex-direction:column;gap:12px">';
    rows.forEach(function (r) {
      html += '<div>' +
        '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px">' +
        '<span style="color:var(--color-ink-700);font-weight:500">' + r.label + '</span>' +
        '<span style="color:var(--color-ink-900);font-weight:600">' + r.value + '</span></div>' +
        '<div style="height:8px;border-radius:999px;background:var(--color-surface-200)">' +
        '<div style="height:100%;width:' + (r.value / max * 100) + '%;background:' + r.color + ';border-radius:999px"></div>' +
        '</div></div>';
    });
    html += '</div>';
    node.innerHTML = html;
  }

  // ---- Vertical bars: data:[{label, value, color}] ----
  function bars(node, data, color) {
    var max = Math.max.apply(null, data.map(function (d) { return d.value; }).concat([1]));
    var html = '<div style="display:flex;align-items:flex-end;gap:14px;height:200px;padding-top:10px">';
    data.forEach(function (d) {
      html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:6px">' +
        '<div style="font-size:12px;font-weight:600;color:var(--color-ink-700)">' + d.value + '</div>' +
        '<div style="width:100%;max-width:48px;height:' + (d.value / max * 100) + '%;min-height:4px;background:' + (d.color || color || C.teal) + ';border-radius:6px 6px 0 0"></div>' +
        '<div style="font-size:11px;color:var(--color-ink-400)">' + d.label + '</div>' +
        '</div>';
    });
    html += '</div>';
    node.innerHTML = html;
  }

  // ---- Heatmap: rows (labels), cols (labels), data [][] ----
  function heatmap(node, rows, cols, data) {
    var max = Math.max.apply(null, data.flat().concat([1]));
    function shade(t) {
      return 'rgb(' + Math.round(244 + (28 - 244) * t) + ',' + Math.round(246 + (195 - 246) * t) + ',' + Math.round(245 + (154 - 245) * t) + ')';
    }
    var html = '<div style="display:grid;grid-template-columns:34px repeat(' + cols.length + ', 1fr);gap:4px;align-items:center">';
    html += '<div></div>';
    cols.forEach(function (c) { html += '<div style="text-align:center;font-size:10px;color:var(--color-ink-400)">' + c + '</div>'; });
    rows.forEach(function (rlabel, i) {
      html += '<div style="font-size:11px;color:var(--color-ink-500);font-weight:500">' + rlabel + '</div>';
      data[i].forEach(function (v) {
        html += '<div title="' + v + ' tichete" style="aspect-ratio:1.6;border-radius:4px;background:' + shade(v / max) +
          ';display:flex;align-items:center;justify-content:center;font-size:10px;color:' + (v / max > 0.55 ? '#fff' : 'var(--color-ink-400)') + '">' + (v || '') + '</div>';
      });
    });
    html += '</div>';
    node.innerHTML = html;
  }

  window.Charts = { line: line, stacked: stacked, donut: donut, hbars: hbars, bars: bars, heatmap: heatmap, C: C };

  // tab switching helper
  window.showTab = function (id, btn) {
    document.querySelectorAll('[data-tab]').forEach(function (n) { n.style.display = n.getAttribute('data-tab') === id ? '' : 'none'; });
    document.querySelectorAll('[data-tabbtn]').forEach(function (b) {
      var on = b.getAttribute('data-tabbtn') === id;
      b.style.color = on ? 'var(--color-ink-900)' : 'var(--color-ink-400)';
      b.style.borderBottomColor = on ? 'var(--color-ink-900)' : 'transparent';
    });
  };
})();

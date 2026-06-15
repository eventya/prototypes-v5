/* =========================================================================
   email.js — renders email PREVIEWS for the prototype.

   It emits EMAIL-CLIENT-SAFE markup: <table role="presentation"> layout with
   INLINE styles for the light baseline (no flexbox/grid/variables) + a gradient
   with a solid fallback. Class names are added only as dark-mode hooks that
   email.css targets under [data-theme="dark"] (mirroring how production ships a
   <style> @media (prefers-color-scheme: dark) block in the layout <head>).

   The rendered DOM is what you'd port to the Rails mailer ERB; here it's built
   from JS so each screen stays a concise, readable config.
   ========================================================================= */
(function (global) {
  var F = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  var MONO = "'JetBrains Mono','Courier New',monospace";

  /* ---- header variants -------------------------------------------------- */
  function wsHeader(h, category) {
    var badge = h.logo
      ? '<td width="34" height="34" valign="middle" style="width:34px;height:34px;border-radius:9px;overflow:hidden;">'
        + '<img src="' + h.logo + '" alt="' + esc(h.name) + '" width="34" height="34" style="width:34px;height:34px;display:block;border-radius:9px;object-fit:cover;"></td>'
      : '<td width="34" height="34" align="center" valign="middle" style="width:34px;height:34px;border-radius:9px;background-color:' + (h.color || '#6c5ce7') + ';color:#ffffff;font-size:13px;font-weight:700;text-align:center;vertical-align:middle;">' + esc(h.initial || '?') + '</td>';
    return ''
      + '<tr><td class="em-header" style="background-color:#ffffff;border-bottom:1px solid #ebebf0;padding:20px 32px;font-family:' + F + ';">'
      +   '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
      +     '<td valign="middle" style="vertical-align:middle;">'
      +       '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>'
      +         badge
      +         '<td style="padding-left:11px;" valign="middle">'
      +           '<div class="em-title" style="font-size:15px;font-weight:700;color:#1a1a2e;line-height:1.2;">' + esc(h.name) + '</div>'
      +           (h.slug ? '<div class="em-faint" style="font-size:11px;color:#8888a0;">' + esc(h.slug) + '</div>' : '')
      +         '</td>'
      +       '</tr></table>'
      +     '</td>'
      +     '<td align="right" valign="middle" style="text-align:right;vertical-align:middle;">' + catLabel(category) + '</td>'
      +   '</tr></table>'
      + '</td></tr>';
  }

  function pfHeader(category) {
    return ''
      + '<tr><td class="em-header" style="background-color:#ffffff;border-bottom:1px solid #ebebf0;padding:20px 32px;font-family:' + F + ';">'
      +   '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
      +     '<td valign="middle" style="vertical-align:middle;">'
      +       '<img src="img/eventya-logo.svg" alt="Eventya" height="24" class="em-logo--light" style="height:24px;width:auto;display:inline-block;vertical-align:middle;">'
      +       '<img src="img/eventya-logo-dark.svg" alt="Eventya" height="24" class="em-logo--dark" style="height:24px;width:auto;vertical-align:middle;">'
      +     '</td>'
      +     '<td align="right" valign="middle" style="text-align:right;vertical-align:middle;">' + catLabel(category) + '</td>'
      +   '</tr></table>'
      + '</td></tr>';
  }

  function catLabel(category) {
    if (!category) return '';
    return '<span class="em-faint" style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8888a0;">' + esc(category) + '</span>';
  }

  function footer(ref) {
    // Footer holds only the functional bits: disclaimer (left) + Ref (right).
    // The brand "Powered by Eventya" lives below the whole card (see attribution()).
    return ''
      + '<tr><td class="em-footer" style="background-color:#fafafc;border-top:1px solid #ebebf0;padding:20px 32px 22px;text-align:left;font-family:' + F + ';">'
      +   '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
      +     '<td valign="middle" style="vertical-align:middle;text-align:left;">'
      +       '<span class="em-foot" style="font-size:12px;color:#a8a8b6;line-height:1.5;">Acesta e un mesaj automat — te rugăm să nu răspunzi.</span>'
      +     '</td>'
      +     (ref ? '<td valign="middle" align="right" style="vertical-align:middle;text-align:right;white-space:nowrap;padding-left:16px;"><span class="em-faint" style="font-size:10px;color:#cfcfd8;letter-spacing:.5px;">Ref · ' + esc(ref) + '</span></td>' : '')
      +   '</tr></table>'
      + '</td></tr>';
  }

  function attribution() {
    // Centered brand attribution beneath the card, on the page background.
    return ''
      + '<div style="text-align:center;padding:16px 0 2px;font-family:' + F + ';">'
      +   '<a href="http://eventya.net" target="_blank" style="display:inline-block;text-decoration:none;">'
      +     '<span class="em-attrib" style="font-size:11px;color:#9a9aa8;letter-spacing:.2px;vertical-align:middle;">Powered by</span>'
      +     '<img src="img/eventya-logo.svg" alt="Eventya" height="19" class="em-logo--light" style="height:19px;width:auto;opacity:.85;margin-left:7px;vertical-align:middle;border:0;display:inline-block;">'
      +     '<img src="img/eventya-logo-dark.svg" alt="Eventya" height="19" class="em-logo--dark" style="height:19px;width:auto;opacity:.9;margin-left:7px;vertical-align:middle;border:0;">'
      +   '</a>'
      + '</div>';
  }

  /* ---- whole email ------------------------------------------------------ */
  function renderEmail(cfg) {
    var head = cfg.header.type === 'pf' ? pfHeader(cfg.category) : wsHeader(cfg.header, cfg.category);
    return ''
      + '<div class="em-frame">'
      +   '<table role="presentation" align="center" width="600" cellpadding="0" cellspacing="0" border="0" class="em-card" style="width:600px;max-width:600px;margin:0 auto;border-collapse:separate;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.07);font-family:' + F + ';">'
      +     '<tr><td height="4" style="height:4px;line-height:0;font-size:0;background-color:#6c5ce7;background-image:linear-gradient(90deg,#6c5ce7 0%,#8b7cf6 50%,#a29bfe 100%);">&nbsp;</td></tr>'
      +     head
      +     '<tr><td class="em-body" style="background-color:#ffffff;padding:34px 32px 30px;font-family:' + F + ';">' + cfg.body + '</td></tr>'
      +     footer(cfg.ref)
      +   '</table>'
      +   attribution()
      + '</div>';
  }

  function metaCard(m) {
    var tag = m.ctx === 'pf'
      ? '<span class="proto-tag proto-tag--pf">Platformă</span>'
      : (m.ctx === 'ws' ? '<span class="proto-tag proto-tag--ws">Workspace</span>' : '');
    var bits = '';
    if (m.mailer) bits += '<span><span class="k">Mailer</span> <code>' + esc(m.mailer) + '</code></span>';
    if (m.from)   bits += '<span><span class="k">FROM</span> <span class="v">' + esc(m.from) + '</span></span>';
    if (m.subject)bits += '<span><span class="k">Subiect</span> <span class="v">' + esc(m.subject) + '</span></span>';
    return '<div class="proto-meta">' + bits + tag + '</div>';
  }

  function renderAll(selector, list) {
    var host = document.querySelector(selector);
    if (!host) return;
    host.innerHTML = list.map(function (cfg) {
      return '<section>' + metaCard(cfg.meta || {}) + renderEmail(cfg) + '</section>';
    }).join('');
  }

  /* ---- body-content helpers (all email-safe inline styles) -------------- */
  var B = {
    h1: function (t) { return '<div class="em-title" style="font-size:21px;font-weight:700;color:#1a1a2e;line-height:1.3;margin:0 0 10px;">' + t + '</div>'; },
    p:  function (t) { return '<div class="em-text" style="font-size:15px;color:#5a5a6e;line-height:1.6;margin:0 0 14px;">' + t + '</div>'; },
    lead: function (t){ return '<div class="em-text" style="font-size:15px;color:#5a5a6e;line-height:1.6;margin:0 0 18px;">' + t + '</div>'; },
    small: function (t){ return '<div class="em-faint" style="font-size:13px;color:#8888a0;line-height:1.55;margin-top:14px;">' + t + '</div>'; },
    strong: function (t){ return '<strong class="em-strong" style="color:#1a1a2e;font-weight:600;">' + t + '</strong>'; },
    icon: function (emoji, bg) { return '<div style="width:52px;height:52px;border-radius:14px;background-color:' + (bg || '#f5f3ff') + ';text-align:center;line-height:52px;font-size:24px;margin:0 0 18px;">' + emoji + '</div>'; },
    btn: function (t, href) {
      return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;"><tr>'
        + '<td align="center" bgcolor="#6c5ce7" style="border-radius:9px;background-color:#6c5ce7;">'
        + '<a href="' + (href || '#') + '" style="display:inline-block;padding:12px 26px;font-family:' + F + ';font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:9px;">' + t + '</a>'
        + '</td></tr></table>';
    },
    code: function (t) { return '<div class="em-codebox" style="font-family:' + MONO + ';font-size:36px;font-weight:700;letter-spacing:10px;color:#1a1a2e;text-align:center;background-color:#f4f4f8;border:1px solid #ebebf0;border-radius:12px;padding:20px 12px;margin:0 0 16px;">' + t + '</div>'; },
    panel: function (rows) {
      var inner = rows.map(function (r, i) {
        var top = i === 0 ? '' : 'border-top:1px solid #ebebf0;';
        return '<tr><td class="em-divide" style="padding:11px 18px;' + top + '">'
          + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
          + '<td class="em-faint" style="font-size:13px;color:#8888a0;">' + r[0] + '</td>'
          + '<td align="right" class="em-strong" style="font-size:13px;color:#1a1a2e;font-weight:600;text-align:right;">' + r[1] + '</td>'
          + '</tr></table></td></tr>';
      }).join('');
      return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="em-panel" style="background-color:#fafafc;border:1px solid #ebebf0;border-radius:11px;margin:18px 0 4px;">' + inner + '</table>';
    },
    callout: function (kind, html) {
      var c = {
        warn:   ['#fff7ed', '#fed7aa', '#9a5b1e'],
        danger: ['#fef2f2', '#fecaca', '#b1483f'],
        ok:     ['#f0fdf4', '#bbf7d0', '#2f7d52'],
        info:   ['#f5f3ff', '#ddd6fe', '#5b4bc4']
      }[kind] || ['#fafafc', '#ebebf0', '#5a5a6e'];
      return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 4px;"><tr>'
        + '<td style="background-color:' + c[0] + ';border:1px solid ' + c[1] + ';border-radius:11px;padding:14px 16px;color:' + c[2] + ';font-size:13.5px;line-height:1.55;font-family:' + F + ';">' + html + '</td>'
        + '</tr></table>';
    },
    steps: function (items) {
      var inner = items.map(function (it, i) {
        var top = i === 0 ? '' : 'border-top:1px solid #ebebf0;';
        return '<tr><td style="padding:14px 0;' + top + '">'
          + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
          + '<td width="26" valign="top" style="vertical-align:top;"><div class="em-stepn" style="width:26px;height:26px;border-radius:8px;background-color:#f5f3ff;color:#6c5ce7;text-align:center;line-height:26px;font-size:12px;font-weight:700;">' + (it.n || (i + 1)) + '</div></td>'
          + '<td style="padding-left:13px;">'
          + '<div class="em-strong" style="font-size:14px;font-weight:600;color:#1a1a2e;">' + it.t + '</div>'
          + '<div class="em-text" style="font-size:13px;color:#5a5a6e;line-height:1.5;margin-top:2px;">' + it.d + '</div>'
          + '</td></tr></table></td></tr>';
      }).join('');
      return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 4px;">' + inner + '</table>';
    },
    stats: function (items) {
      var cells = items.map(function (s) {
        return '<td width="' + Math.floor(100 / items.length) + '%" style="padding:0 5px;">'
          + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="em-panel" style="background-color:#fafafc;border:1px solid #ebebf0;border-radius:10px;"><tr><td align="center" style="padding:14px 6px;text-align:center;">'
          + '<div class="em-title" style="font-size:22px;font-weight:700;color:#1a1a2e;">' + s.n + '</div>'
          + '<div class="em-faint" style="font-size:11px;color:#8888a0;margin-top:2px;">' + s.l + '</div>'
          + '</td></tr></table></td>';
      }).join('');
      return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px -5px 4px;"><tr>' + cells + '</tr></table>';
    },
    sectionHead: function (t) { return '<div class="em-faint" style="font-size:12px;font-weight:700;color:#8888a0;text-transform:uppercase;letter-spacing:.8px;margin:22px 0 10px;">' + t + '</div>'; },
    quote: function (html) { return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 4px;"><tr><td class="em-panel" style="border-left:3px solid #6c5ce7;background-color:#fafafc;border-radius:0 10px 10px 0;padding:14px 16px;font-size:14px;color:#5a5a6e;line-height:1.55;">' + html + '</td></tr></table>'; },
    author: function (initial, name, role) {
      return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;"><tr>'
        + '<td width="44" height="44" align="center" valign="middle" style="width:44px;height:44px;border-radius:50%;background-color:#6c5ce7;color:#ffffff;font-size:16px;font-weight:700;text-align:center;vertical-align:middle;">' + initial + '</td>'
        + '<td style="padding-left:12px;" valign="middle">'
        + '<div class="em-strong" style="font-size:15px;font-weight:700;color:#1a1a2e;">' + name + '</div>'
        + '<div class="em-faint" style="font-size:12px;color:#8888a0;">' + role + '</div>'
        + '</td></tr></table>';
    },
    stars: function (n) {
      var s = '';
      for (var i = 0; i < 5; i++) s += (i < n ? '★' : '☆');
      return '<div style="color:#f5a623;font-size:18px;letter-spacing:3px;margin:0 0 10px;">' + s + '</div>';
    }
  };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  global.Email = { renderAll: renderAll, renderEmail: renderEmail, B: B };
})(window);

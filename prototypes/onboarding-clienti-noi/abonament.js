// The one subscription picker of the prototypes: the packages are a list, and the selected one opens
// with its modules, total and CTA (variant A, chosen on 28.09 — question C11).
// Modes: 'public'  (eventya.net pricing: free trial or an offer; opts.skin = 'marketing')
//        'upgrade' (in the workspace; opts.billing 'contract' | 'trial' | 'stripe' — 'trial' is "Alege abonamentul")
//        'renew'   ("Continuă cu abonamentul")
// Every new workspace starts on a trial, so the wizard has no subscription step.
// Used by onboarding-clienti-noi (04, 09, 13) and tranzitie-abonamente (02, 03).
// Prices are deliberately NOT here (public repo): they come from Stejar::Entitlements::PriceList.
(function () {
  var BASES = [
    { id: 'helpdesk',   rank: 1, name: 'Helpdesk',   desc: 'Formulare și tichete. Fără site.' },
    { id: 'web',        rank: 2, name: 'Web',        desc: 'Site complet, helpdesk simplu, AI pentru editori.' },
    { id: 'mobile',     rank: 3, name: 'Mobile',     desc: 'Tot ce are Web, plus aplicațiile iOS și Android.' },
    { id: 'enterprise', rank: 4, name: 'Enterprise', desc: 'Tot ce are Mobile, cu toate modulele incluse.' }
  ];
  var MODULES = [
    { id: 'helpdesk_pro', name: 'Helpdesk Pro',         desc: 'E-mail, WhatsApp, SLA' },
    { id: 'ai_visitor',   name: 'AI pentru vizitatori', desc: 'Asistentul de pe site' },
    { id: 'community',    name: 'Community',            desc: 'Recenzii, membri, push targetat' },
    { id: 'media',        name: 'Media',                desc: 'Biblioteca foto-video' }
  ];
  var ADDONS = { helpdesk: ['helpdesk_pro'], web: ['helpdesk_pro', 'ai_visitor', 'community', 'media'],
                 mobile: ['helpdesk_pro', 'ai_visitor', 'community', 'media'], enterprise: 'all' };
  var CARD = ['helpdesk', 'web', 'mobile'];

  // On eventya.net the picker takes the site's own theme (assets/marketing.css), nothing new.
  var MARKETING_SKIN = [
    ['btn btn--primary', 'mkt-btn-primary justify-center'],
    ['btn btn--ghost', 'mkt-btn-secondary justify-center'],
    ['hover:border-surface-400', 'hover:border-[var(--border-teal)]'],
    ['border-surface-200', 'border-[var(--border)]'], ['border-surface-300', 'border-[var(--border)]'], ['border-surface-400', 'border-[var(--border)]'],
    ['divide-surface-200', 'divide-[var(--border)]'],
    ['bg-surface-0', 'bg-[var(--bg-card)]'], ['bg-surface-100', 'bg-[var(--card-alt)]'], ['bg-surface-200', 'bg-[var(--border)]'],
    ['bg-primary-50 dark:bg-primary-500/10', 'bg-[var(--card-alt)]'],
    ['text-primary-600 dark:text-primary-400', 'text-[var(--teal)]'],
    ['ring-primary-500/10', 'ring-[rgba(23,198,165,0.15)]'],
    ['border-primary-500', 'border-[var(--teal)]'],
    ['bg-primary-600', 'bg-[var(--teal)]'], ['bg-primary-500', 'bg-[var(--teal)]'],
    ['accent-primary-600', 'accent-[#17C6A5] text-[#17C6A5]'],
    ['hover:text-primary', 'hover:text-[var(--teal)]'],
    ['text-ink-900', 'text-[var(--text-primary)]'],
    ['text-ink-700', 'text-[var(--text-secondary)]'], ['text-ink-600', 'text-[var(--text-secondary)]'], ['text-ink-500', 'text-[var(--text-secondary)]'],
    ['text-ink-400', 'text-[var(--text-muted)]'], ['text-ink-300', 'text-[var(--text-muted)]']
  ];

  var bar = function (w, h) { return '<span class="inline-block align-middle rounded bg-surface-200 ' + (w || 'w-10') + ' ' + (h || 'h-3') + '"></span>'; };
  var find = function (id) { return BASES.filter(function (b) { return b.id === id; })[0]; };
  var check = '<svg class="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>';

  window.Abonament = function (root, opts) {
    if (root._abCleanup) root._abCleanup();
    opts = opts || {};
    var mode = opts.mode || 'upgrade';
    var current = opts.current || null, start = opts.start || current || { base: 'web', modules: [] };
    var cardOn = opts.cardEnabled !== false;
    var s = { base: start.base, modules: (start.modules || []).slice(), annual: !!opts.annual || opts.currentInterval === 'annual' };

    function sellable(m) { var a = ADDONS[s.base]; return a !== 'all' && a.indexOf(m) >= 0; }
    function included() { return ADDONS[s.base] === 'all'; }
    function byCard() { return cardOn && CARD.indexOf(s.base) >= 0; }
    function unchanged() {
      return current && mode === 'upgrade' && opts.billing !== 'trial' && s.base === current.base &&
        s.modules.slice().sort().join() === current.modules.slice().sort().join() &&
        (!opts.currentInterval || (opts.currentInterval === 'annual') === s.annual);
    }
    function goingDown() {
      if (!current || (mode !== 'upgrade' && mode !== 'renew')) return false;
      if (find(s.base).rank < find(current.base).rank) return true;
      return current.base !== 'enterprise' && current.modules.some(function (m) { return s.modules.indexOf(m) < 0; });
    }
    function query(intent) {
      return '?package=' + s.base + (s.modules.length ? '&modules=' + s.modules.join(',') : '') +
        '&interval=' + (s.annual ? 'annual' : 'monthly') + '&intent=' + intent + (opts.starter ? '&starter=' + opts.starter : '');
    }
    // Two short notes, never boxes: the Enterprise recommendation and the downgrade warning.
    function notes(which) {
      var out = '';
      if (which !== 'down' && s.base === 'mobile' && s.modules.length >= 3) {
        out += '<p class="text-[13px] text-sky-700 dark:text-sky-300 mt-3">Cu atâtea module, Mobile costă cât Enterprise, care le include pe toate. <button type="button" data-base="enterprise" class="font-semibold underline underline-offset-2">Alege Enterprise</button></p>';
      }
      if (which !== 'ent' && goingDown()) {
        out += '<p class="text-[13px] text-amber-700 dark:text-amber-300 mt-3">Treci pe mai puțin. Ce nu intră se ascunde, iar conținutul rămâne și revine dacă urci din nou.' +
          (opts.billing === 'stripe' ? ' Se aplică la finalul perioadei plătite.' : '') + '</p>';
      }
      return out;
    }
    function badge(b) {
      if (opts.recommended === b.id) return '<span class="text-[11px] font-medium text-sky-600 dark:text-sky-400">Recomandat pentru ' + opts.recommendedFor + '</span>';
      if (!current || current.base !== b.id) return '';
      var t = opts.badgeLabel || (mode === 'renew' ? 'Pachetul expirat' : opts.billing === 'trial' ? 'Trial-ul tău' : 'Planul tău');
      return '<span class="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">' + t + '</span>';
    }
    function done(path) { if (opts.onDone) opts.onDone({ base: s.base, modules: s.modules.slice(), annual: s.annual, path: path }); }

    // ---- bucăți comune
    function interval() {
      function seg(on, v, label) {
        return '<button type="button" data-annual="' + v + '" class="px-4 py-1.5 rounded-full text-[13px] transition-colors ' +
          (on ? 'bg-surface-0 text-ink-900 font-semibold shadow-sm' : 'text-ink-500 hover:text-ink-900') + '">' + label + '</button>';
      }
      return '<div class="inline-flex items-center rounded-full bg-surface-100 p-1">' + seg(!s.annual, 0, 'Lunar') +
        seg(s.annual, 1, 'Anual <span class="text-emerald-600 dark:text-emerald-400 font-semibold">−' + bar('w-4', 'h-2.5') + '%</span>') + '</div>';
    }
    function moduleRows() {
      if (included()) {
        return '<div class="space-y-2">' + MODULES.map(function (m) {
          return '<div class="flex items-center gap-3 text-[14px] text-ink-700">' + check + '<span class="flex-1">' + m.name + '</span><span class="text-[12px] text-ink-400">inclus</span></div>';
        }).join('') + '</div>';
      }
      return '<div class="divide-y divide-surface-200">' + MODULES.filter(function (m) { return sellable(m.id); }).map(function (m) {
        var on = s.modules.indexOf(m.id) >= 0;
        return '<label class="flex items-center gap-3 py-2.5 cursor-pointer">' +
          '<input type="checkbox" data-mod="' + m.id + '" class="w-4 h-4 rounded accent-primary-600"' + (on ? ' checked' : '') + '>' +
          '<span class="flex-1 min-w-0"><span class="text-[14px] text-ink-900">' + m.name + '</span> <span class="text-[13px] text-ink-400">· ' + m.desc + '</span></span>' +
          '<span class="text-[13px] text-ink-400 font-mono whitespace-nowrap">+ ' + bar('w-8') + '</span></label>';
      }).join('') + '</div>' +
        (s.base === 'helpdesk' ? '<p class="text-[12px] text-ink-400 mt-2">Pe Helpdesk, Helpdesk Pro înlocuiește pachetul. Celelalte module cer un site.</p>' : '');
    }
    function total() {
      return '<div class="flex items-baseline gap-2">' + bar('w-28', 'h-7') + '<span class="text-[13px] text-ink-500">RON/' + (s.annual ? 'an' : 'lună') + '</span></div>' +
        '<div class="text-[12px] text-ink-400 mt-1">TVA inclus · plată ' + (s.annual ? 'anuală' : 'lunară') + '</div>';
    }
    function btn(path, label, dis) { return '<button type="button" data-done="' + path + '" class="btn btn--primary"' + (dis ? ' disabled' : '') + '>' + label + '</button>'; }
    function lnk(path, label) { return '<button type="button" data-done="' + path + '" class="text-[13px] text-ink-500 hover:text-primary hover:underline underline-offset-2">' + label + '</button>'; }
    function href(intent, label, primary) {
      var l = (opts.links || {})[intent] || '#';
      return primary ? '<a href="' + l + query(intent) + '" class="btn btn--primary">' + label + '</a>'
        : '<a href="' + l + query(intent) + '" class="text-[13px] text-ink-500 hover:text-primary hover:underline underline-offset-2">' + label + '</a>';
    }
    var dot = '<span class="text-ink-300">·</span>';
    function cta() {
      // Pe site: perioada de probă sau o ofertă. Selecția merge mai departe și te așteaptă în spațiu, la „Alege abonamentul”.
      if (mode === 'public') {
        if (!byCard()) return { main: href('contract', 'Cere ofertă', true), alt: href('trial', 'sau începe 30 de zile gratuit') };
        return { main: href('trial', 'Începe 30 de zile gratuit', true), alt: href('contract', 'Cere ofertă'),
          note: 'În perioada de probă ai totul. Selecția te așteaptă în spațiu, când alegi abonamentul.' };
      }
      if (mode === 'renew') return { main: byCard() ? btn('card', opts.ctaLabel || 'Plătește și reactivează') : btn('contract', opts.ctaLabel || 'Cere reînnoirea'),
        alt: byCard() ? lnk('contract', 'sau cere ofertă') : '',
        note: byCard() ? '' : 'Cererea ajunge la echipa Eventya. Spațiul revine imediat ce se setează abonamentul.' };
      if (opts.billing === 'trial') return { main: byCard() ? btn('card', 'Plătește cu cardul') : btn('contract', 'Cere ofertă'), alt: byCard() ? lnk('contract', 'sau cere ofertă') : '',
        note: (included() ? '' : 'În trial ai totul. La plată, ce nu intră în pachet se ascunde, iar conținutul rămâne. ') +
          (byCard() ? 'Datele de facturare le completezi la plată.' : 'Cererea ajunge la echipa Eventya. Până la contract, lucrezi pe perioada de probă.') };
      // Suma exactă vine din previzualizarea facturii Stripe; drepturile noi intră doar după ce diferența s-a plătit.
      if (opts.billing === 'stripe') return { main: byCard() ? btn('apply', goingDown() ? 'Programează schimbarea' : 'Aplică schimbarea', unchanged()) : btn('contract', 'Cere ofertă pentru Enterprise'),
        note: unchanged() ? 'Alege alt pachet, un modul sau alt interval.' : goingDown() ? '' : 'Plătești acum ' + bar('w-10', 'h-2.5') + ' RON, diferența până pe 01.11.2026, cu cardul salvat.' };
      return { main: btn('request', 'Trimite cererea', unchanged()), note: unchanged() ? 'Alege alt pachet, un modul sau alt interval.' : 'Cererea ajunge la echipa Eventya.' };
    }
    function ctaBlock() {
      var c = cta();
      return '<div class="flex flex-wrap items-center gap-x-4 gap-y-2">' + c.main + (c.alt ? '<span class="flex items-center gap-2">' + c.alt + '</span>' : '') + '</div>' +
        (c.note ? '<p class="text-[12px] text-ink-400 mt-2">' + c.note + '</p>' : '');
    }
    function radio(on) { return '<span class="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ' + (on ? 'border-primary-500' : 'border-surface-400') + '">' + (on ? '<span class="w-2.5 h-2.5 rounded-full bg-primary-500"></span>' : '') + '</span>'; }

    // ---- pachetele se deschid
    function renderCollapse() {
      var h = '<div class="flex justify-center mb-8">' + interval() + '</div><div class="space-y-3">';
      BASES.forEach(function (b) {
        var open = s.base === b.id;
        h += '<div class="rounded-2xl border transition-all ' + (open ? 'border-primary-500 ring-4 ring-primary-500/10 bg-surface-0' : 'border-surface-200 bg-surface-0 hover:border-surface-400') + '">' +
          '<button type="button" data-base="' + b.id + '" class="w-full flex items-center gap-4 px-5 py-4 text-left">' + radio(open) +
            '<span class="flex-1 min-w-0"><span class="flex items-center gap-2 flex-wrap"><span class="text-[16px] font-semibold text-ink-900">' + b.name + '</span>' + badge(b) + '</span>' +
            '<span class="block text-[13px] text-ink-500">' + b.desc + '</span></span>' +
            '<span class="text-[13px] text-ink-400 whitespace-nowrap">' + bar() + ' /lună</span></button>';
        if (open) {
          h += '<div class="px-5 pb-5 pl-14">' +
            '<div class="text-[12px] font-medium text-ink-500 mb-1">' + (included() ? 'Module incluse' : 'Adaugă module') + '</div>' + moduleRows() +
            '<div class="mt-5 pt-5 border-t border-surface-200">' + total() + '</div>' + notes() +
            '<div class="mt-4">' + ctaBlock() + '</div></div>';
        }
        h += '</div>';
      });
      return h + '</div>';
    }

    function render() {
      s.modules = s.modules.filter(sellable);
      var html = renderCollapse();
      if (opts.skin === 'marketing') MARKETING_SKIN.forEach(function (p) { html = html.split(p[0]).join(p[1]); });
      root.innerHTML = html;
    }

    function onClick(e) {
      var el = e.target.closest('[data-base],[data-annual],[data-done]');
      if (!el || el.disabled) return;
      if (el.dataset.base) s.base = el.dataset.base;
      if (el.dataset.annual) s.annual = el.dataset.annual === '1';
      if (el.dataset.done) return done(el.dataset.done);
      render();
    }
    function onChange(e) {
      var t = e.target;
      if (t.dataset.mod) { if (t.checked) s.modules.push(t.dataset.mod); else s.modules = s.modules.filter(function (x) { return x !== t.dataset.mod; }); }
      render();
    }
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    root._abCleanup = function () { root.removeEventListener('click', onClick); root.removeEventListener('change', onChange); root._abCleanup = null; };
    render();
  };

})();

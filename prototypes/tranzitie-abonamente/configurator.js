// Prototype of the single pricing configurator behind two screens:
//   upgrade — the owner changes the plan: any package, up OR down
//   renew   — "Continuă cu abonamentul" on a suspended workspace, the expired plan preselected
// Both send a request that becomes a ticket for the Eventya team; the team sets the
// subscription in Admin. Stripe (automatic activation) is a separate, later plan.
// Every price on the page includes VAT: what you see is what you pay, no sums left to the reader.
// Prices are deliberately NOT here (public repo): the real numbers live in
// Stejar::Entitlements::PriceList. Every price and percentage renders as a grey placeholder.
(function () {
  var BASES = [
    { id: 'helpdesk',   rank: 1, name: 'Helpdesk',   desc: 'Doar formulare → tichete, un departament. Fără e-mail, WhatsApp, SLA, AI.' },
    { id: 'web',        rank: 2, name: 'Web',        desc: 'Site oficial complet + helpdesk simplu.' },
    { id: 'mobile',     rank: 3, name: 'Mobile',     desc: 'Web + aplicații iOS și Android, notificări push către toți și pe limbă.' },
    { id: 'enterprise', rank: 4, name: 'Enterprise', desc: 'Mobile + toate modulele + suport cu prioritate.' }
  ];
  var MODULES = [
    { id: 'helpdesk_pro', name: 'Helpdesk Pro',         desc: 'E-mail și WhatsApp → tichete, departamente, SLA, AI în helpdesk.' },
    { id: 'ai_visitor',   name: 'AI pentru vizitatori', desc: 'Asistentul public pe site și în aplicație.' },
    { id: 'community',    name: 'Community',            desc: 'Recenzii, membri, push-uri targetate pe utilizatori și urmăritori.' },
    { id: 'media',        name: 'Media',                desc: 'Biblioteca foto-video a organizației.' }
  ];
  // Mirrors Catalog::PACKAGE_ADDONS: on Helpdesk only Helpdesk Pro is sold, the rest need a website.
  var ADDONS = { helpdesk: ['helpdesk_pro'], web: ['helpdesk_pro', 'ai_visitor', 'community', 'media'],
                 mobile: ['helpdesk_pro', 'ai_visitor', 'community', 'media'], enterprise: 'all' };

  var ph = function (w) { return '<span class="inline-block align-middle rounded bg-surface-200 ' + (w || 'w-10') + ' h-3" aria-label="din grilă"></span>'; };
  var find = function (list, id) { return list.filter(function (x) { return x.id === id; })[0]; };

  var seq = 0;
  window.Configurator = function (root, opts) {
    var ns = '_' + (seq++);
    var mode = opts.mode, current = opts.current;
    var state = { base: current.base, modules: current.modules.slice(), annual: false };
    var curRank = find(BASES, current.base).rank;

    function sellable(baseId, modId) { var a = ADDONS[baseId]; return a !== 'all' && a.indexOf(modId) >= 0; }

    function render() {
      var base = find(BASES, state.base), included = ADDONS[base.id] === 'all';
      state.modules = state.modules.filter(function (id) { return sellable(base.id, id); });
      var html = '';

      // Plata — comutator sus, ca pe eventya.net/pricing; reducerea anuală e un procent din PriceList
      html += '<div class="flex flex-col items-center gap-2 mb-10">' +
        '<div class="inline-flex items-center gap-3">' +
          '<button type="button" data-pay="monthly" class="text-sm ' + (state.annual ? 'text-ink-500' : 'text-ink-900 font-semibold') + '">Lunar</button>' +
          '<button type="button" data-pay="toggle" role="switch" aria-checked="' + state.annual + '" aria-label="Plată anuală" class="relative w-12 h-6 rounded-full transition-colors ' + (state.annual ? 'bg-primary-500' : 'bg-surface-300') + '">' +
            '<span class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ' + (state.annual ? 'translate-x-6' : '') + '"></span></button>' +
          '<button type="button" data-pay="annual" class="text-sm ' + (state.annual ? 'text-ink-900 font-semibold' : 'text-ink-500') + '">Anual</button>' +
          '<span class="inline-flex items-center gap-1 rounded-full border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">−' + ph('w-4') + ' %</span>' +
        '</div>' +
        '<div class="text-[12px] text-ink-400">Toate prețurile includ TVA.</div>' +
      '</div>';

      html += '<div class="grid lg:grid-cols-[1fr_340px] gap-6 items-start"><div>';

      // 1 · Pachetul de bază — every package can be chosen, up or down
      html += '<div class="text-lg font-bold text-ink-900">1 · Pachetul de bază</div><div class="space-y-2 mt-3">';
      BASES.forEach(function (b) {
        var sel = state.base === b.id, isCur = current.base === b.id;
        html += '<label class="flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors ' +
          (sel ? 'border-primary-500 ring-1 ring-primary-500 bg-primary-50/40 dark:bg-primary-500/5' : 'border-surface-200 bg-surface-0 hover:border-surface-400') + '">' +
          '<input type="radio" name="base' + ns + '" value="' + b.id + '" class="mt-1 accent-primary-600"' + (sel ? ' checked' : '') + '>' +
          '<span class="flex-1 min-w-0"><span class="flex items-center gap-2 flex-wrap"><span class="font-semibold text-ink-900">' + b.name + '</span>' +
          (isCur ? '<span class="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-600 text-white">' + (opts.badge || (mode === 'renew' ? 'Pachetul expirat' : 'Planul tău')) + '</span>' : '') +
          '</span><span class="block text-[13px] text-ink-500 mt-0.5">' + b.desc + '</span></span>' +
          '<span class="text-[12px] text-ink-400 whitespace-nowrap font-mono">' + ph() + ' /lună</span></label>';
      });
      html += '</div>';

      // 2 · Module
      var hint = included ? 'Enterprise le include pe toate patru.'
        : base.id === 'helpdesk' ? 'Pe Helpdesk se adaugă doar Helpdesk Pro. Celelalte module cer un website.'
        : 'Se adaugă la Web sau la Mobile, la același preț. Toate sunt incluse în Enterprise.';
      html += '<div class="text-lg font-bold text-ink-900 mt-8">2 · Module</div><div class="text-[13px] text-ink-500 mt-1">' + hint + '</div>';
      html += '<div class="grid sm:grid-cols-2 gap-2 mt-3">';
      MODULES.forEach(function (m) {
        var can = sellable(base.id, m.id), on = included || state.modules.indexOf(m.id) >= 0;
        var had = current.modules.indexOf(m.id) >= 0 || (current.base === 'enterprise');
        var dropping = had && !on;
        html += '<label class="flex items-start gap-3 rounded-xl border p-3.5 bg-surface-0 ' +
          (on ? 'border-primary-500 ring-1 ring-primary-500' : 'border-surface-200') +
          (can ? ' cursor-pointer hover:border-surface-400' : ' opacity-60 cursor-not-allowed') + '">' +
          '<input type="checkbox" name="module' + ns + '" value="' + m.id + '" class="mt-1 accent-primary-600"' + (on ? ' checked' : '') + (can ? '' : ' disabled') + '>' +
          '<span class="flex-1 min-w-0"><span class="flex items-center gap-2 flex-wrap"><span class="font-semibold text-ink-900">' + m.name + '</span>' +
          (included ? '<span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">inclus</span>' : '') +
          (had && on && !included ? '<span class="text-[11px] text-ink-400">activ acum</span>' : '') +
          (dropping ? '<span class="text-[11px] text-red-600 dark:text-red-400 font-medium">renunți la el</span>' : '') +
          (!can && !included ? '<span class="text-[11px] text-ink-400">cere un website</span>' : '') +
          '</span><span class="block text-[13px] text-ink-500 mt-0.5">' + m.desc + '</span></span>' +
          '<span class="text-[12px] text-ink-400 whitespace-nowrap font-mono">+' + ph('w-8') + '</span></label>';
      });
      html += '</div>';

      html += '</div>';

      // Aside · Oferta
      var lines = '<div class="flex justify-between text-[13px] py-1"><span class="font-medium text-ink-900">' + base.name + '</span>' +
        (base.id === 'helpdesk' && state.modules.length ? '<span class="text-[12px] text-ink-400">înlocuit de Helpdesk Pro</span>' : ph()) + '</div>';
      state.modules.forEach(function (id) {
        lines += '<div class="flex justify-between text-[13px] py-1 text-ink-500"><span>+ ' + find(MODULES, id).name + '</span>' + ph() + '</div>';
      });
      if (included) lines += '<div class="flex justify-between text-[13px] py-1 text-ink-500"><span>Helpdesk Pro, AI vizitatori, Community, Media</span><span class="text-emerald-600 dark:text-emerald-400">incluse</span></div>' +
        '<div class="flex justify-between text-[13px] py-1 text-ink-500"><span>Suport cu prioritate</span><span class="text-emerald-600 dark:text-emerald-400">inclus</span></div>';

      var goingDown = base.rank < curRank;
      var nearEnterprise = base.id === 'mobile' && state.modules.length >= 3;
      var noChange = mode === 'upgrade' && state.base === current.base &&
        state.modules.slice().sort().join() === current.modules.slice().sort().join();

      html += '<aside class="lg:sticky lg:top-6 rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-sm">' +
        '<div class="text-xl font-bold text-ink-900">Oferta ta</div>' +
        '<div class="mt-3 divide-y divide-surface-100">' + lines + '</div>' +
        '<div class="border-t border-surface-200 mt-3 pt-4"><div class="flex items-end gap-2"><span class="inline-block rounded-lg bg-surface-200 w-36 h-10"></span><span class="text-sm text-ink-500 font-mono">RON/lună</span></div>' +
        '<div class="text-[12px] text-ink-500 mt-1.5">TVA inclus · ' + (state.annual ? 'facturat anual, în avans: ' + ph('w-14') + ' RON/an' : 'facturat lunar') + '</div></div>' +
        (goingDown ? '<div class="mt-4 rounded-lg border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3 text-[12px] text-amber-800 dark:text-amber-300">Treci pe un pachet mai mic. Ce nu intră în el se ascunde, dar conținutul rămâne și revine dacă urci din nou.</div>' : '') +
        (nearEnterprise ? '<div class="mt-4 rounded-lg border border-sky-300 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 p-3 text-[12px] text-sky-800 dark:text-sky-300">Mobile cu atâtea module costă cât Enterprise sau mai mult. Enterprise le include pe toate, plus suport cu prioritate. <button type="button" data-pick="enterprise" class="font-semibold underline">Alege Enterprise</button></div>' : '') +
        '<textarea class="input mt-4 w-full text-[13px]" rows="2" placeholder="Mesaj pentru echipa Eventya (opțional)"></textarea>' +
        '<button type="button" class="btn btn--primary w-full mt-3"' + (noChange ? ' disabled title="Alege un pachet sau un modul"' : '') + '>' +
          (mode === 'renew' ? 'Cere reînnoirea' : 'Trimite cererea') + '</button>' +
        '<div class="text-[11px] text-ink-400 mt-2 leading-relaxed">Cererea ajunge ca tichet la echipa Eventya. Contractul se stabilește în afara platformei, iar noul abonament se setează din Admin.</div>' +
        '</aside></div>';
      root.innerHTML = html;
    }

    root.addEventListener('change', function (e) {
      var t = e.target;
      if (t.name === 'base' + ns) state.base = t.value;
      if (t.name === 'module' + ns) {
        if (t.checked) state.modules.push(t.value);
        else state.modules = state.modules.filter(function (x) { return x !== t.value; });
      }
      render();
    });
    root.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('[data-pick],[data-pay]') : null;
      if (!el) return;
      var pick = el.getAttribute('data-pick'), pay = el.getAttribute('data-pay');
      if (pick) state.base = pick;
      if (pay) state.annual = pay === 'toggle' ? !state.annual : pay === 'annual';
      render();
    });
    render();
  };
})();

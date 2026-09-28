// Shared by screens 03–05: the public site in the CURRENT eventya.net theme
// (assets/marketing.css). The logo, the theme switch and the 7 templates (`starter` in code).
// Dark is the default; light is data-theme="light". As on the real site
// (marketing_theme_controller.js), dark also sets class="dark" on <html>,
// so the `dark:` utilities (the logo swap) follow the theme.
(function () {
  var S = window.EventyaSite = {};

  // ── Theme ──────────────────────────────────────────────
  S.toggleTheme = function () {
    var d = document.documentElement;
    var next = d.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    d.setAttribute('data-theme', next);
    d.classList.toggle('dark', next === 'dark');
    try { localStorage.setItem('proto-theme', next); } catch (e) {}
    S.themeLabels();
  };
  S.themeLabels = function () {
    var dark = document.documentElement.getAttribute('data-theme') !== 'light';
    document.querySelectorAll('[data-theme-label]').forEach(function (el) { el.textContent = dark ? 'Întunecat' : 'Luminos'; });
  };

  // ── Logo: horizontally_{white,dark}_background_no_motto.svg, inline ──
  // Fills are attributes, not the files' <style> classes: two inline copies with
  // the same class names would overwrite each other's colours.
  var WORD = [
    'M605.2,73.4c-26.6,0-48.3,21.3-48.3,47.5v52.9h19.7v-52.9c0-14.8,11.6-27,26.4-27.8h.3c.3,0,.7,0,1,0h1.4c15.3.7,27.8,13.3,27.8,28v52.8h19.7v-52.8c0-26.3-21.5-47.6-48-47.7Z',
    'M737,164.2l-14.7-13.1-.6.6c-3,2.8-6.9,4.4-11.1,4.4-8.9,0-16.2-7.3-16.2-16.2v-45h39.7v-19.8h-39.7c0,.1,0-31.5,0-31.5h-19.7v31.6h-17.1v19.7h17.1v45c0,19.8,16.1,35.9,35.9,35.9s19-4,25.7-10.8l.6-.7Z',
    'M956.9,135.4v-60.3h-19.3v9.1l-2.6-1.7c-8.4-5.7-18.2-8.7-28.4-8.7-28.1,0-51,22.9-51,51s22.9,51,51,51,28.4-7.9,33.3-11.2l1.9-1.3.6,1.2c4.2,8,12.1,11.7,25.4,12v-18.9c-7.9-.7-10.9-6.7-10.9-22ZM906.5,156.4c-17.4,0-31.6-14.2-31.6-31.6s14.2-31.6,31.6-31.6,31.6,14.2,31.6,31.6-14.2,31.6-31.6,31.6Z',
    'M824.1,75.2v52.4c0,14.7-11.5,26.8-26.1,27.5h-.3c-.3,0-.7,0-1,0h-1.4c-15.2-.7-27.5-13.2-27.5-27.7v-52.3h-19.5v52.3c0,26,21.3,47.2,47.6,47.2,10.6,0,20.4-3.5,28.4-9.2v3.4c0,14.7-11.5,26.8-26.1,27.5h-.3c-.3,0-.7,0-1,0h-1.4c-11.3-.6-20.9-7.5-25.2-17h-20.6c4.9,20.9,23.8,36.5,46.3,36.5,26.4,0,47.9-21.1,47.9-47.1v-93.6h-19.5Z',
    'M495.1,73.4c-28.3,0-51.3,23-51.3,51.3s23,51.3,51.3,51.3c14.2,0,27-5.8,36.2-15.1l-13.5-13.5c-5.8,5.8-13.8,9.5-22.7,9.5-14.4,0-26.6-9.4-30.7-22.5h81.1c.6-3.2,1-6.4,1-9.8,0-28.3-23-51.3-51.3-51.3ZM525.8,114.9h-61.5c4.1-13,16.3-22.5,30.7-22.5,14.4,0,26.6,9.4,30.7,22.5Z',
    'M293.6,73.4c-28.3,0-51.3,23-51.3,51.3s23,51.3,51.3,51.3c14.2,0,27-5.8,36.2-15.1l-13.5-13.5c-5.8,5.8-13.8,9.5-22.7,9.5-14.4,0-26.6-9.4-30.7-22.5h81.1c.6-3.2,1-6.4,1-9.8,0-28.3-23-51.3-51.3-51.3ZM324.3,114.9h-61.5c4.1-13,16.3-22.5,30.7-22.5,14.4,0,26.6,9.4,30.7,22.5Z'
  ];
  var V = '426.4 75.2 394.3 150 362.3 75.2 341 75.2 383.3 173.8 405.4 173.8 447.6 75.2 426.4 75.2';
  function svgLogo(wordFill, cls) {
    return '<svg class="' + cls + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 250" role="img" aria-label="Eventya">' +
      '<g fill="' + wordFill + '">' + WORD.map(function (d) { return '<path d="' + d + '"/>'; }).join('') + '<polygon points="' + V + '"/></g>' +
      '<path fill="#f95741" d="M120.6,98.2l19-19.2c10.5-10.5,10.5-27.5,0-38-10.5-10.5-27.5-10.5-38,0-10.5,10.5-10.5,27.5,0,38l19,19.2Z"/>' +
      '<path fill="#17c6a5" d="M181.5,97.4h-38.6c-14.7,0-26.6,11.8-26.8,26.4-.3,15,12.5,27.3,27.6,27.3h38.6c14.7,0,26.6-11.8,26.8-26.4.3-15-12.5-27.3-27.6-27.3Z"/>' +
      '<path fill="#d6bd09" d="M116.9,101.7l3.7-3.5h-57.2c-12.4,0-23.4,7.1-28.5,18.6-5,11.1-3.1,23.5,4.9,32.4.5.5,59.8,59.9,59.8,59.9,5.1,5.1,11.8,7.9,19,7.9s.4,0,.7,0c7.4-.2,14.2-3.3,19.2-8.8,9.7-10.6,9.1-27.1-1.4-37.5l-20.4-20.7c-13.2-13.4-13.5-34.9.2-48.2Z"/>' +
      '</svg>';
  }
  // <span data-logo="h-8"></span> → the light logo (dark:hidden) + the dark logo (hidden dark:block), as in the layout.
  S.logos = function () {
    document.querySelectorAll('[data-logo]').forEach(function (el) {
      var h = el.getAttribute('data-logo') || 'h-8';
      el.outerHTML = svgLogo('#264d4a', h + ' w-auto dark:hidden') + svgLogo('#ffffff', h + ' w-auto hidden dark:block');
    });
  };

  S.icon = function (paths, cls) {
    return '<svg class="' + (cls || 'w-4 h-4') + '" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">' + paths + '</svg>';
  };

  // ── The 7 templates (PLAN §5; `starter` in code). Names are the A2 proposal. ──
  // Colour classes are whole strings so Tailwind compiles them.
  S.GROUPS = [
    { key: 'cultura', name: 'Cultură', sub: 'Muzee, teatre și instituții de spectacol.' },
    { key: 'publice', name: 'Comunități publice', sub: 'Primării, destinații turistice și regiuni.' },
    { key: 'privati', name: 'Privați', sub: 'Asociații, afaceri locale și organizatori.' }
  ];
  S.STARTERS = [
    { key: 'atrium', name: 'Atrium', group: 'cultura', layout: 'museum', short: 'muzee, galerii, case memoriale',
      audience: 'muzee, galerii, case memoriale, colecții',
      pages: ['Acasă', 'Vizitează', 'Expoziții', 'Colecția', 'Evenimente', 'Educație', 'Despre', 'Contact'],
      pkg: 'Web', plus: 'AI pentru vizitatori',
      tint: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300', solid: 'bg-violet-500', mid: 'bg-violet-200',
      icon: '<path d="M3 21h18M5 21V10M19 21V10M9.5 21V10M14.5 21V10M2 10l10-6 10 6"/>' },
    { key: 'scena', name: 'Scena', group: 'cultura', layout: 'posters', short: 'teatre, filarmonici, opere, centre culturale',
      audience: 'teatre, filarmonici, opere, centre culturale',
      pages: ['Acasă', 'Stagiunea', 'Spectacole', 'Bilete', 'Trupa', 'Turnee', 'Despre', 'Contact'],
      pkg: 'Web',
      tint: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300', solid: 'bg-rose-500', mid: 'bg-rose-200',
      icon: '<path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M13 5v2M13 11v2M13 17v2"/>' },
    { key: 'forum', name: 'Forum', group: 'publice', layout: 'news', short: 'primării, orașe, municipii',
      audience: 'primării, orașe, municipii',
      pages: ['Acasă', 'Știri și anunțuri', 'Evenimente în oraș', 'Ghidul cetățeanului', 'Sesizări', 'Descoperă orașul', 'Contact'],
      pkg: 'Web', plus: 'Helpdesk Pro',
      tint: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300', solid: 'bg-sky-500', mid: 'bg-sky-200',
      icon: '<path d="M4 21V9l8-5 8 5v12M9 21v-6h6v6M3 21h18"/>' },
    { key: 'panorama', name: 'Panorama', group: 'publice', layout: 'map', short: 'județe, regiuni, OMD-uri, stațiuni mari',
      audience: 'județe, regiuni, OMD-uri, stațiuni mari, destinații naționale',
      pages: ['Acasă', 'Descoperă', 'Trasee', 'Evenimente', 'Cazare', 'Gastronomie', 'Zone', 'Planifică vizita', 'Oferte', 'Știri'],
      pkg: 'Mobile', note: 'aplicația și push-ul pornesc cu pachetul',
      tint: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', solid: 'bg-emerald-500', mid: 'bg-emerald-200',
      icon: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>' },
    { key: 'vatra', name: 'Vatra', group: 'publice', layout: 'village', short: 'comune turistice, stațiuni mici, sate',
      audience: 'comune turistice, stațiuni mici, sate, micro-regiuni, GAL-uri',
      pages: ['Acasă', 'Descoperă', 'Trasee', 'Cazare', 'Producători locali', 'Evenimente', 'Cum ajungi', 'Contact'],
      pkg: 'Web',
      tint: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300', solid: 'bg-orange-500', mid: 'bg-orange-200',
      icon: '<path d="M12 22v-5M7 17h10l-5-7-5 7zM8.5 11h7L12 5l-3.5 6z"/>' },
    { key: 'agora', name: 'Agora', group: 'privati', layout: 'members', short: 'asociații, ONG-uri, cluburi, festivaluri',
      audience: 'asociații, ONG-uri, cluburi, festivaluri, rețele de membri',
      pages: ['Acasă', 'Despre noi', 'Membri', 'Evenimente', 'Știri', 'Implică-te', 'Contact'],
      pkg: 'Web', plus: 'Community',
      tint: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300', solid: 'bg-teal-500', mid: 'bg-teal-200',
      icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>' },
    { key: 'vitrina', name: 'Vitrina', group: 'privati', layout: 'shop', short: 'pensiuni, restaurante, ghizi, organizatori',
      audience: 'pensiuni, restaurante, ghizi, organizatori de evenimente, producători',
      pages: ['Acasă', 'Servicii și oferte', 'Galerie foto', 'Evenimente', 'Despre', 'Contact și rezervări'],
      pkg: 'Web',
      tint: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300', solid: 'bg-fuchsia-500', mid: 'bg-fuchsia-200',
      icon: '<path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6"/>' }
  ];

  // Amber banner view switcher, shared by the three screens.
  S.views = function (onShow) {
    function paint(v) {
      document.querySelectorAll('[data-view]').forEach(function (b) {
        var on = b.getAttribute('data-view') === v;
        b.className = 'px-2 py-1 rounded-md ' + (on ? 'font-semibold bg-amber-200/70 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200' : 'font-medium text-amber-700 dark:text-amber-300');
      });
      document.querySelectorAll('[data-show]').forEach(function (el) {
        el.hidden = el.getAttribute('data-show').split(' ').indexOf(v) < 0;
      });
      if (history.replaceState) history.replaceState(null, '', '#' + v);
      if (onShow) onShow(v);
    }
    document.getElementById('views').addEventListener('click', function (e) {
      var v = e.target.getAttribute('data-view'); if (v) paint(v);
    });
    return paint;
  };

  document.addEventListener('DOMContentLoaded', function () { S.logos(); S.themeLabels(); });
})();

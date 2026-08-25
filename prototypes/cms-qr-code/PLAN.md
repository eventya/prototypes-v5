# Cod QR pentru pagini CMS — plan de implementare

## Context

Un client care tipărește un afiș, o plăcuță la intrarea într-un obiectiv turistic sau un flyer nu are azi nicio cale să ducă vizitatorul de pe hârtie pe pagina lui din CMS. Trebuie să tasteze un URL lung.

Codul QR **există deja** în platformă, dar doar ca **element de conținut pus în pagină** (PR #927, `feature/qr_code_component`) — adică un cod pe care îl vede cine e *deja* pe site. Exact invers decât ne trebuie: vrem un cod **despre** pagină, pe care editorul îl exportă și îl duce în lumea fizică.

Lipsesc două lucruri care contează pentru client:

1. **Câți oameni au scanat efectiv.** Fără cifra asta, afișul e o cheltuială pe care nimeni n-o poate justifica.
2. **Un cod per limbă.** Un panou la intrarea într-un muzeu are trei coduri lipite sub trei steaguri; fiecare trebuie să ducă în limba lui.

**Ce livrăm:**
- Item nou **Cod QR** în meniul „Mai multe" (⋮) al paginii, sub SEO.
- O pagină de previzualizare, **cu tab-uri de limbă**, cu export **SVG, PNG, JPG, PDF** pentru limba activă.
- Un endpoint public de redirect care face codurile **măsurabile, separat pe limbă**.

**Constrângere asumată:** *zero tabele noi, zero coloane noi, zero gem-uri noi.* Măsurarea se face cu `content_signals`, deja în `stejar.gemspec`. Exportul PDF cu `jspdf`, deja în `package.json`.

**Zero opțiuni de configurare.** Pagina generează și exportă; nu întreabă nimic. Vezi *Out of scope* — dar consecința principală merită spusă din capul locului: **serviciul `QrCode::Image` rămâne complet neatins**, fără niciun parametru nou.

---

## Starea curentă în codebase

### QR-ul e deja construit — ca element, nu ca pagină

`rqrcode ~> 3.0` e dependență în `stejar.gemspec:47` și `require`-uit în `lib/stejar.rb`. Două servicii fac toată munca:

| Fișier | Ce face | Refolosibil? |
|---|---|---|
| `app/services/stejar/cms/qr_code/image.rb` | `Image.new(url).to_svg` / `.to_png`. Constante: `MODULE_SIZE 4`, `QUIET_ZONE 4`, `PNG_SIZE 1024`, `ERROR_CORRECTION :m`, `MAX_CAPACITY 2_300`, `DARK`/`LIGHT` fixate pe negru/alb. Întoarce `nil` pentru URL gol sau prea lung. | **Da, ca atare** — zero modificări |
| `app/services/stejar/cms/qr_code/target.rb` | Rezolvă unde duce codul unui **element** și numele fișierului descărcat. | Nu — e legat de `Element`. Ne trebuie un echivalent pentru pagină. |

Tiparul de download de copiat — `app/controllers/stejar/cms/elements_controller.rb:155-169`:

```ruby
QR_CODE_CONTENT_TYPES = { 'svg' => 'image/svg+xml', 'png' => 'image/png' }.freeze

def qr_code
  content_type = QR_CODE_CONTENT_TYPES[params[:format].to_s] or return head :not_found
  target = QrCode::Target.new(page: @page, element: @element, base_url: request.base_url)
  data   = params[:format] == 'png' ? Image.new(target.url).to_png : Image.new(target.url).to_svg
  return head :not_found if data.blank?
  send_data data, type: content_type, filename: "#{target.filename}.#{params[:format]}",
                  disposition: 'attachment'
end
```

> ✅ Toate constantele sunt deja alegerile corecte pentru un cod tipărit, cu motivele documentate în cod: `:m` e echilibrul pe care îl folosește semnalistica tipărită, `QUIET_ZONE 4` e minimul cerut de standard ca scannerele să prindă marginea, iar `DARK`/`LIGHT` sunt fixate pentru că un cod colorat în paleta brandului deseori nu se mai scanează. **Nu expunem niciuna ca opțiune** — le moștenim.

### Slug-ul e per limbă — de aici vine codul multilingv

`Stejar::Translatable` (`app/models/concerns/stejar/translatable.rb`) dă fiecărei pagini **câte un rând `Cms::Translation` per limbă a contului**, fiecare cu `slug`-ul lui:

```ruby
after_create_commit :create_translations   # câte unul pentru fiecare account.locales

def find_by_slug(slug, account_id:)
  joins(:translations).where(account_id: account_id).find_by(translations: { slug: slug })
end
```

`Page#validates_slug_uniqueness?` și `#create_slug?` întorc ambele `true` (`app/models/stejar/cms/page.rb:138-144`), iar `Translation.slugify` adaugă sufixul de limbă pentru limbile non-default (`translation.rb:40`) și verifică unicitatea **peste toate limbile** contului. Deci în practică slug-urile generate sunt unice pe cont.

> ⚠️ Validarea e însă `uniqueness: { scope: %i[locale translatable_type account_id] }` — unic **pe limbă**, nu peste limbi. Un slug editat manual ar putea teoretic să se repete între două limbi. Nu e o problemă nouă: catch-all-ul public `/:id` folosește deja `find_by_slug`, la fel de agnostic de limbă. `/qr/:slug` moștenește exact comportamentul existent, nu-l înrăutățește.

**Cheia designului:** `Cms::Translation.find_by(slug:)` întoarce într-o singură interogare **și pagina, și limba**. Cu un id de pagină în cod aveam o singură destinație. Cu slug-ul avem câte un cod per limbă, fiecare aterizând în limba lui.

### Meniul „Mai multe" (⋮) — două fișiere, nu unul

Item-ul **SEO** apare în două locuri care trebuie ținute în sincron:

| Fișier | Pentru cine |
|---|---|
| `app/views/stejar/cms/pages/panels/_admin_page_menu_items.html.erb:14-20` | admini (i18n prin `t('cms.editor.menu.seo')`) |
| `app/components/stejar/cms/pages/page_manager_menu_items.html.erb:11-17` | page manageri (engleză hardcodată, `helpers.seo_cms_page_path`) |

Shell-uri: `panels/_iframe_admin_menu.html.erb` și `panels/_iframe_manager_menu.html.erb`, ambele randate din `panels/_iframe_topbar.html.erb` (desktop + duplicat mobil). Item-ul **Cod QR** intră în ambele, sub SEO — urmăm precedentul.

### Pagina SEO — șablonul pentru pagina de QR

`app/controllers/stejar/cms/page_seo_controller.rb` — `requires_permission "cms.view"`, `include Stejar::Cms::PageManagerScopable`, `page_scoped_actions ...`, `before_action :set_page` (`page_scope.find` → scoping multi-tenant + page-manager). Rute în `config/routes/cms.rb:52-57`.

View-ul de copiat: **`app/views/stejar/cms/page_seo/sharing.html.erb`** (76 linii, un singur card) — nu `seo.html.erb`, care e mult mai complex. Structura: `turbo_frame_tag(dom_id(@page, :sharing))` → `max-w-3xl mx-auto px-4 py-6 md:px-8 md:py-10` → breadcrumb (CMS › Pagini › titlu › secțiune) → header cu săgeată înapoi → card `bg-surface-0 rounded-xl border border-surface-200 p-6` → rând de acțiuni jos.

Tab-urile de limbă se refolosesc din `app/views/stejar/cms/pages/_fields_name.html.erb:4-16` (`data-controller="tabs"`, `.locale-tab`, `locale_flag(locale)`, `data-action="click->tabs#select"`).

> ⚠️ `app/views/stejar/cms/pages/seo.html.erb` și `sharing.html.erb` sunt **fișiere moarte** — nu există acțiuni corespondente în `PagesController`. Nu copiem din ele.

### `content_signals` rezolvă măsurarea — fără tabele noi

Gem `content_signals (0.1.15)`. Tabelul `content_signals_page_views` e **polimorfic** (`trackable_type` / `trackable_id`), iar `stejar_pages` are `id` bigint și `page_views_count` — `PageView` declară `belongs_to :trackable, polymorphic: true, counter_cache: :page_views_count`.

**Nu există coloană `source` / `utm_*` / `event_type` / `metadata`.** Singurul câmp prin care o scanare se poate distinge de o vizită obișnuită este **`referrer`** — string liber, fără nicio validare. Restul candidaților pică:

| Candidat | De ce nu merge |
|---|---|
| `app_platform` | `validates :inclusion, in: %w[hybrid native]` → `RecordInvalid` |
| `device_type` | `validates :inclusion, in: %w[desktop mobile tablet]` → idem |
| `locale` | `limit: 10`, și strică `locale_breakdown` |
| `device_id`, `user_agent` | Libere, dar **nu ajung în rollup-ul zilnic** → se pierd la purjare |

Punctul de intrare care acceptă un `referrer` arbitrar — `lib/content_signals/jobs/track_page_view_job.rb`:

```ruby
TrackPageViewJob.perform_later(trackable_type, trackable_id, user_id, tracking_data)
# tracking_data[:referrer] ajunge direct în coloană, fără filtrare
```

`ContentSignals::PageViewTracker#compile_tracking_data` (privat) construiește hash-ul cu `referrer: @request.referrer`. E **subclasabil** — de aici vine soluția. Initializer-ul Stejar are deja precedentul: `DevIpOverride` face `prepend` pe exact metoda asta.

### Rutele publice stau în Eventya

`eventya/config/routes.rb:87` → `draw(:account_website)` → `eventya/config/routes/account_website.rb`, în `scope '(/:account_id)', constraints: Stejar::WebsiteRoutingConstraint`, care se termină cu catch-all-ul `get '/:id' => 'public_website#show'`.

`Stejar::Website::BaseController` include deja `ContentSignals::TrackablePageViews` (linia 11) și expune `account_id` pentru `tenant_id` (linia 115).

> ⚠️ `Stejar::WebsiteRoutingConstraint` respinge orice cale terminată în extensie (`/\.\w{2,5}\z/`), cu excepția `sitemap.xml` / `robots.txt`. `/qr/:slug` e în regulă; `/qr/:slug.svg` **nu s-ar potrivi**.

### Export PDF — `jspdf` e deja în proiect

`package.json` are `jspdf ^3.0.1` + `jspdf-autotable`, folosite în `app/javascript/helpdesk/src/report_pdf_builder.js`. **Nu adăugăm niciun gem de PDF.**

---

## Propunerea

### Un cod per limbă, care encodează slug-ul limbii respective

```
Vizitator scanează codul de sub steagul britanic
  │  https://tursitulcea.ro/qr/momarlani-route-en
  ▼
GET /qr/:slug → Stejar::Website::QrCodesController#show
  │  Cms::Translation.find_by(slug:) → pagina + limba, dintr-o interogare
  ▼  302 → https://tursitulcea.ro/momarlani-route-en?locale=en&utm_source=qr-en
GET /:slug → PublicWebsiteController#show
  └─ tracking normal, dar cu referrer forțat "qr-en"  → 1 singur PageView
```

De ce redirect și nu URL-ul paginii direct în cod:

1. **URL scurt → cod rar → se scanează de la distanță.** Măsurat cu `rqrcode` la nivelul `:m`, pe URL-uri reale:

   | URL encodat | Grilă | Module |
   |---|---|---|
   | `https://tursitulcea.ro/qr/ruta-momarlanilor` | **33 × 33** | 1.089 |
   | `https://tursitulcea.ro/ruta-momarlanilor?locale=ro&utm_source=qr-ro` | 37 × 37 | 1.369 |

   Cu **26% mai puține module**, la aceeași dimensiune fizică pe afiș fiecare pătrat e cu ~12% mai lat. Diferența se simte direct în distanța de la care telefonul prinde codul.
2. **Un singur loc care atribuie scanarea**, în loc de un parametru pe care oricine îl poate copia greșit din bara de adrese.

> **Ce pierdem față de varianta cu id de pagină:** codul tipărit moare dacă editorul schimbă slug-ul. Compensăm cu un avertisment exact acolo unde se produce greșeala (vezi mai jos) — nu cu un al doilea format de URL.

**Pagina de start** nu are slug (`Page#homepage?`). Codul ei encodează direct rădăcina sitului cu parametrii de limbă și atribuire — nu trece prin `/qr/`, pentru că n-ar avea pe ce cheie să se rezolve.

### Măsurarea: un `PageView` per scanare, marcat `qr-<locale>`

Redirect-ul **nu** înregistrează nimic — e un 302 curat și rapid. Măsurarea se face la vizualizarea reală a paginii, unde datele (IP, device, geo) sunt oricum de calitate mai bună.

> **De ce nu măsurăm la redirect.** Dacă scriem acolo, browserul încarcă apoi și pagina, care se înregistrează a doua oară: **două `PageView`-uri pentru o scanare**, deci și `page_views_count` umflat. Ar trebui o logică de „sari peste tracking dacă `utm_source` e prezent" — care are efectul invers neplăcut: cine primește link-ul redistribuit nu s-ar mai număra deloc, nici măcar ca vizită. Măsurând la aterizare avem **exact un** `PageView` per scanare și zero logică de excludere.

```ruby
# app/services/stejar/cms/qr_code/scan_tracker.rb   (nou)
module Stejar::Cms::QrCode
  # Aceleași date ca o vizită obișnuită, dar atribuite scanării unui cod tipărit.
  # `compile_tracking_data` e privat în gem, dar stabil — îl extindem, nu îl copiem.
  class ScanTracker < ContentSignals::PageViewTracker
    def self.track(trackable:, request:, referrer:, user: nil)
      new(trackable, request, user, referrer).track
    end

    def initialize(trackable, request, user, referrer)
      super(trackable, request, user)
      @referrer = referrer
    end

    private

    def compile_tracking_data = super.merge(referrer: @referrer)
  end
end
```

```ruby
# app/controllers/concerns/stejar/cms/qr_code/scan_trackable.rb   (nou)
# Inclus în Website::BaseController DUPĂ ContentSignals::TrackablePageViews.
module Stejar::Cms::QrCode::ScanTrackable
  extend ActiveSupport::Concern

  private

  def track_page_view
    marker = qr_scan_marker or return super
    return if should_skip_tracking?

    trackable = find_trackable_for_tracking or return
    ensure_visitor_cookie
    Stejar::Cms::QrCode::ScanTracker.track(
      trackable: trackable, user: current_user_for_tracking,
      request: request, referrer: marker
    )
  rescue => e
    Rails.logger.error "Failed to track QR scan: #{e.message}"
  end

  # `referrer` e o coloană liberă, iar utm_source vine din URL — deci controlat de
  # oricine. Fără whitelist, un vizitator ar putea scrie orice string în analytics.
  def qr_scan_marker
    locale = params[:utm_source].to_s[/\Aqr-([a-z]{2,5})\z/, 1] or return
    "qr-#{locale}" if available_locales.include?(locale)
  end
end
```

Un singur `include` în `Stejar::Website::BaseController`. **Nu modificăm gem-ul, nu modificăm `PageViewTracker`, nu atingem tracking-ul existent** — fără marker valid, totul merge exact ca azi prin `super`.

`?utm_source=qr-en` e în plus util clientului: e un UTM standard, îl vede și în propriul Google Analytics dacă are unul.

### Citirea: două surse, pentru că rândurile brute se șterg

> 🔴 **Capcana care schimbă designul.** `eventya/config/recurring.yml` programează `ContentSignals::PurgePageViewsJob` **zilnic la 3:30**, iar `retention_days` nu e suprascris în `stejar/config/initializers/content_signals.rb` → rămâne default **90**. Job-ul face `delete_all` pe `viewed_at < cutoff`.
>
> Pentru un cod QR tipărit — a cărui singură valoare e cifra cumulată în timp — un total citit din `PageView` ar **scădea** în tăcere după trei luni.
>
> Din fericire `AggregateAnalyticsJob` rulează **orar** (același fișier) și rulează raw-ul în `content_signals_analytics_daily_stats.referrer_breakdown`, care **nu** se purjează.

```ruby
markers = account.locales.index_with { |lc| "qr-#{lc}" }   # { "ro" => "qr-ro", … }

# ── Recent (< 90 zile): rânduri brute, cu toate dimensiunile ──
recent = ContentSignals::PageView.where(trackable: @page, referrer: markers.values)
recent.group(:referrer).count      # scanări pe limbă
recent.today.count                 # azi
recent.this_month.count            # luna asta
recent.daily_distribution(30)      # sparkline
recent.device_breakdown            # iOS/Android, gratis
recent.top_countries(5)            # de unde vin, gratis

# ── Total istoric: rollup zilnic, imun la purjare ──
ContentSignals::AnalyticsDailyStat
  .for_tenant(account.id)
  .for_trackable('Stejar::Cms::Page', @page.id)
  .sum { |s| markers.values.sum { |m| s.referrer_breakdown[m].to_i } }
```

> ✅ **De ce markerul e `qr-<locale>`, fără schemă — două motive care se aliniază.**
>
> 1. **Supraviețuiește agregării.** `AggregateAnalyticsJob#extract_domain` face `URI.parse(url).host&.sub(/\Awww\./, "") || url`. Pentru `"qr-en"` `host` e `nil` → fallback pe stringul brut → cheia din `referrer_breakdown` e chiar `"qr-en"`. Fiecare limbă își păstrează cheia ei, deci **totalul per limbă e durabil**.
> 2. **Nu poluează raportul de referrers al clientului.** `Stejar::Cms::Presenters::Analytics#valid_referrer_host?` (`app/services/stejar/cms/presenters/analytics.rb:173-180`) cere `host.include?(".")` — `"qr-en"` pică, deci rândul nu apare în „Top referrers".
>
> Un marker de forma `https://qr.scan/` ar fi apărut în lista clientului ca domeniul „qr.scan", care **nu există** — arată a spam de referrer.

> Coloana `locale` din `PageView` **nu** poate ține limba codului: `PageViewTracker#detect_locale` scrie acolo primul `Accept-Language` al browserului, adică limba telefonului, nu a paginii.

### Zero configurare — și de ce e bine așa

Pagina nu are niciun control. Deschizi, alegi limba, descarci.

Asta nu e o scurtătură, e alegerea corectă: **fiecare opțiune pe care am fi expus-o strică ceva.** Culorile personalizate reduc contrastul de care depinde scanarea. Un logo în centru forțează nivel de corecție maxim și mărește codul. Chiar și nivelul de corecție, singura opțiune pe care o luaserăm în calcul, e o alegere pe care editorul n-are cum s-o facă informat — `:m` e deja echilibrul pe care îl folosește semnalistica tipărită, iar o valoare mai mare doar îndesește grila fără un motiv pe care utilizatorul să-l poată evalua din backend.

Consecința practică: **`QrCode::Image` nu se atinge deloc.** Fără parametru `level:`, fără query param de preview, fără suprafață nouă de testat. Serviciul are deja spec-uri care trec; le moștenim intacte.

Și nu rămâne nimic de salvat. Confirmat pe schemă: `stejar_pages` (nu `stejar_cms_pages`) nu are niciun jsonb de setări — singurul e `seo_issues`, un *array* de probleme SEO — și nu are `token`, `uuid` sau `public_id`. Nu există unde pune o setare fără migrare, și nici nu ne trebuie una.

#### De ce nu stocăm în modulul Media

Numărul de coduri pe care le poți genera **nu depinde de storage**. Un QR e o funcție pură de URL-ul lui — 3 limbi înseamnă 3 URL-uri, deci 3 coduri, calculate la cerere. `Image` documentează chiar asta: *„the same URL always produces the same image… There is no shared or cached state."*

Și, ironic, **slug-ul face storage-ul mai prost, nu mai bun**: fișierul salvat devine învechit exact în momentul în care se editează slug-ul — lucru care se întâmplă mult mai des decât o schimbare de id. În plus:

| Motiv | Detaliu |
|---|---|
| **SVG-ul nici nu e permis** | `Media::Asset::CONTENT_TYPES` nu conține `image/svg+xml`. Excludere deliberată — SVG e markup executabil. |
| **Variantele forțează WebP** | `:thumbnail` / `:list` / `:big` toate cu `format: :webp` + resize — transformare greșită pentru un artefact de tipar. |
| **Consumă cota clientului** | `CalculateStorageJob` rulează la 4 ore; `CreateAsset` refuză când `account.media_storage_limit_exceeded?`. |
| **Zgomot în audit** | `Asset` are `audited on: %i[create update destroy]`. |
| **Devine vizibil ca upload** | `media_assets` nu are coloană `kind` / `purpose`. Ar apărea în Media picker, editabil și ștergibil de oricine — exact ce se întâmplă azi cu `shareable_asset`. |

### Avertisment la schimbarea slug-ului

În `app/views/stejar/cms/pages/_fields_name.html.erb`, imediat sub câmpul de slug (liniile 39-50, deja randat **per limbă** în interiorul tab-urilor), un avertisment **condiționat de existența scanărilor** pentru limba respectivă:

> ⚠️ Codul QR pentru adresa asta a fost scanat de 1.204 ori. Dacă schimbi adresa, codurile deja tipărite nu vor mai funcționa.

Condiționarea contează: pe o pagină care n-a avut niciodată un QR, avertismentul e zgomot. Verificarea e un `exists?` pe `(trackable, referrer)`, ieftină la scara unei pagini.

### Export

Previzualizarea e SVG inline, randat pe server (`Image#to_svg`), în tab-ul limbii active. Cele patru butoane exportă codul limbii curente:

| Format | Unde se face | De ce |
|---|---|---|
| **SVG** | server, `send_data` | vector, formatul corect pentru tipar; refolosește exact tiparul din `ElementsController#qr_code` |
| **PNG** | server, `send_data` | `Image#to_png` există deja (chunky_png) |
| **JPG** | client, `<canvas>.toBlob('image/jpeg')` | evită vips / ImageMagick în request |
| **PDF** | client, `jsPDF` | zero gem-uri — `jspdf` e deja bundle-uit, cu precedent în `helpdesk/src/report_pdf_builder.js` |

Numele fișierului include limba: `qr-momarlani-route-en.svg`.

> ⚠️ **JPG e un format prost pentru coduri QR** și trebuie spus în UI: compresia cu pierderi produce artefacte exact pe muchiile alb/negru de care depinde scanarea. Îl livrăm pentru că tipografiile îl cer, dar cu eticheta „recomandat: SVG pentru tipar, PNG pentru digital".

---

## Ecrane

| # | Ecran | Ce arată |
|---|---|---|
| 1 | `01-meniu-more.html` | Before/after pe meniul ⋮ al paginii — item-ul **Cod QR** imediat sub SEO. Ambele variante (admin + page manager), pentru că SEO apare azi în ambele. |
| 2 | `02-pagina-qr.html` | Pagina de Cod QR, stare populată: tab-uri de limbă, previzualizare, cele 4 butoane de export, URL-ul măsurat cu buton de copiere. Panoul de scanări: **total istoric** lângă **ultimele 30 de zile**, plus defalcarea pe limbă. |
| 3 | `03-stari-goale.html` | Trei stări: pagină nepublicată, zero scanări încă, și pagina de start (fără slug, cod pe rădăcina sitului). |
| 4 | `04-flux-scanare.html` | Fluxul tehnic complet: afiș → `/qr/…` → 302 → `PageView` cu `referrer: "qr-en"` → rollup zilnic. Plus avertismentul de la schimbarea slug-ului. |

Cifrele din prototip sunt mock dar **coerente aritmetic**: suma pe limbi dă totalul, iar sparkline-ul se închide cu cifra pe 30 de zile.

---

## Cod de reutilizat

| Ce există | Cum îl folosim |
|---|---|
| `Stejar::Cms::QrCode::Image` | Generarea propriu-zisă, **fără nicio modificare**. |
| `ElementsController#qr_code` | **Model** pentru `PageQrCodesController#download` — `send_data` cu content type și filename. |
| `Stejar::Cms::QrCode::Target` | **Model** pentru `PageTarget` (clasă nouă) — aceeași logică de `public_page_url` + homepage fără slug, dar pentru pagină + limbă, nu pentru element. |
| `Account#public_page_url(slug:)` | Rezolvă domeniul custom verificat vs calea de platformă. Se folosește ca atare. |
| `PageSeoController` | **Model** pentru `PageQrCodesController` — `requires_permission`, `PageManagerScopable`, `page_scoped_actions`, `set_page`. |
| `page_seo/sharing.html.erb` | **Model** pentru view — breadcrumb, header, card, rând de acțiuni. |
| `pages/_fields_name.html.erb:4-16` | Tab-urile de limbă (`data-controller="tabs"`, `.locale-bar`, `.locale-tab`, `locale_flag`). |
| `ContentSignals::PageViewTracker` | Se **subclasează** pentru `ScanTracker`. Precedent: `DevIpOverride` din initializer. |
| `ContentSignals::PageView` scopes | `today`, `this_month`, `daily_distribution`, `device_breakdown`, `top_countries` — toate gratis. |
| `helpdesk/src/report_pdf_builder.js` | **Model** pentru exportul PDF client-side cu jsPDF. |
| `@stimulus-components/clipboard` | Butonul de copiere a URL-ului măsurat — deja în `package.json`. |

---

## Implementare (faze)

1. **Generarea.** `Image#level`, `PageTarget` (pagină + limbă, cu cazul homepage), `PageQrCodesController#show` + `#download`, ruta, view-ul cu tab-uri de limbă și previzualizare SVG. Fără măsurare încă — codurile encodează deja `/qr/:slug`.
2. **Redirect-ul public.** `Website::QrCodesController#show`, ruta în `account_website.rb` **înainte** de catch-all. De aici codurile devin funcționale end-to-end.
3. **Măsurarea.** `ScanTracker`, `ScanTrackable`, `include` în `Website::BaseController`, whitelist-ul de marker. Panoul de scanări în pagina de QR (`ScanStats`).
4. **Exporturile client-side.** `qr_export_controller.js` — canvas → JPG, jsPDF → PDF.
5. **Legăturile din UI + avertismentul.** Item în cele două meniuri ⋮, avertismentul sub câmpul de slug.
6. **i18n + spec-uri.** Chei în en/ro/de/es/fr/hu/it; spec-uri după tiparul din `spec/services/stejar/cms/qr_code/`.

---

## Rezumat fișiere Stejar

| Fișier | Schimbare |
|---|---|
| `app/services/stejar/cms/qr_code/page_target.rb` | nou — URL + filename pentru o pagină **și o limbă**; tratează homepage-ul fără slug |
| `app/services/stejar/cms/qr_code/scan_tracker.rb` | nou — subclasă de `ContentSignals::PageViewTracker` |
| `app/services/stejar/cms/qr_code/scan_stats.rb` | nou — total din `AnalyticsDailyStat`, recent + defalcare pe limbă din `PageView` |
| `app/controllers/concerns/stejar/cms/qr_code/scan_trackable.rb` | nou |
| `app/controllers/stejar/cms/page_qr_codes_controller.rb` | nou — `#show` + `#download` |
| `app/controllers/stejar/website/qr_codes_controller.rb` | nou — rezolvă slug → (pagină, limbă), 302 |
| `app/controllers/stejar/website/base_controller.rb` | un `include` |
| `app/views/stejar/cms/page_qr_codes/show.html.erb` | nou |
| `app/javascript/cms/controllers/qr_export_controller.js` | nou — canvas → JPG, jsPDF → PDF |
| `app/views/stejar/cms/pages/_fields_name.html.erb` | avertisment sub câmpul de slug, condiționat de scanări |
| `app/views/stejar/cms/pages/panels/_admin_page_menu_items.html.erb` | item nou sub SEO (linia 20) |
| `app/components/stejar/cms/pages/page_manager_menu_items.html.erb` | idem (linia 17) |
| `config/routes/cms.rb` | `get :qr_code, on: :member` + ruta de download |
| `config/locales/{en,ro,de,es,fr,hu,it}/ui_cms_{editor,panels,page_edit}.yml` | chei noi |
| `eventya/config/routes/account_website.rb` | `get '/qr/:slug'` **înainte** de catch-all-ul `get '/:id'` |

**Fără migrări. Fără tabele noi. Fără coloane noi. Fără gem-uri noi.**

---

## Verificare

- **Multi-limbă end-to-end:** cont cu 3 limbi → 3 coduri distincte; `GET /qr/<slug-en>` → 302 cu `locale=en&utm_source=qr-en`; aterizarea creează **exact un** `PageView` cu `referrer == "qr-en"` (`perform_enqueued_jobs`), iar `GET /:slug` fără param creează unul cu `referrer` normal.
- **Whitelist-ul de marker:** `?utm_source=qr-zz` (limbă neconfigurată) sau `?utm_source=qr-<injecție>` **nu** trebuie să scrie nimic în `referrer`.
- **Testul care contează cel mai mult:** rulează `AggregateAnalyticsJob`, apoi `PurgePageViewsJob` cu `retention_days` mic — totalul istoric trebuie să rămână neschimbat, iar sparkline-ul pe 30 de zile să se golească. Ăsta e scenariul care ar trece neobservat în producție trei luni.
- Verificat că raportul de referrers din CMS Analytics **nu** afișează `qr-*`.
- Scanare reală cu telefonul, pe domeniu custom și pe `/:account_id`, plus pagina de start (fără slug).

---

## Out of scope (deocamdată)

- **Orice opțiune de configurare** — culori, logo în centru, ramă cu call-to-action, nivel de corecție. Primele trei cresc direct riscul ca un cod tipărit să nu se mai scaneze; a patra e o alegere pe care editorul n-o poate face informat. Ținem `QrCode::Image` neatins.
- **Mai multe coduri denumite per pagină** („Afiș intrare", „Flyer târg"), cu măsurare separată per canal. Ar cere un tabel nou — exact ce am exclus. `referrer` poate ține doar o dimensiune, iar aceea e deja limba.
- **Stocarea codurilor în modulul Media.** Vezi secțiunea dedicată.
- **Scanări unice** (același telefon scanează de trei ori). `unique_count` există pe `PageView`, dar `visitor_id` la o scanare cold e mereu nou — cifra n-ar însemna nimic.
- **Alt tip de destinație decât pagina** (link extern, vCard, WiFi). Elementul de QR din pagină acoperă deja linkul liber.

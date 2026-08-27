# Linkuri de Share & Coduri QR — plan de implementare

## Context

Platforma are azi trei nevoi care par separate și care sunt, de fapt, aceeași nevoie:

1. **Un cod QR pe un afiș** duce vizitatorul de pe hârtie pe pagina din CMS.
2. **Un link distribuit pe WhatsApp** duce prietenul pe aceeași pagină.
3. **Un deep-link** deschide aplicația nativă, dacă e instalată, în loc de browser.

Toate trei înseamnă: *o adresă scurtă, stabilă, măsurabilă, care trimite pe undeva*. Astăzi niciuna dintre ele nu are un obiect în spate — codul QR e o funcție pură de `page + locale`, share-ul distribuie URL-ul brut al paginii, iar deep-link-urile nu există deloc.

**Ce livrăm:** un singur obiect — `Link` — cu trei suprafețe.

| Suprafață | Cum apare linkul | Cine îl creează |
|---|---|---|
| **Automat** | Share din ActionBar, „copiază link" | Sistemul, lazy, la primul share — unul per pagină + limbă |
| **Manual** | `/cms/links` — campanii, afișe, destinații externe | Editorul, cu etichetă de amplasare |
| **Derivat** | Imagine QR, rezolvare deep-link | Nimeni — sunt consecințe gratuite ale existenței obiectului |

Un editor care nu deschide niciodată `/cms/links` beneficiază oricum: paginile lui devin măsurabile la share, iar linkurile lui deschid aplicația nativă.

---

## Decizii luate

### Domeniu scurt — propunere, de discutat cu echipa

> ⚠️ **Nedecis.** Secțiunea asta e o propunere, nu o decizie luată. `evy.link` e greu de găsit la înregistrare; `evy.to` pare o alternativă bună. **De verificat și decis împreună înainte de Faza 1** — vezi *Candidați* mai jos.
>
> Link de verificat: <https://www.namecheap.com/domains/registration/results/?domain=evy.to>
>
> Ecranele din prototip folosesc `evy.link` ca **placeholder vizual**. Se schimbă într-un singur loc când domeniul e ales.

**Ce e decis:** domeniul e **de sine stătător**, nu un subdomeniu al lui `eventya.net` (gen `l.eventya.net`). Motive, în ordinea greutății:

- **Codul QR iese mai mic.** `https://evy.to/x7k2m9` = 21 de caractere → QR versiunea 2, grilă 25×25. Pe `l.eventya.net` același cod ar avea 28 → versiunea 3, grilă 29×29. La aceeași dimensiune tipărită, modulele sunt cu ~16% mai late: codul se scanează de mai departe și suportă mai bine o plăcuță ruginită sau un afiș plouat.
- **Se poate tasta de pe un panou.** Cineva care citește „evy.to/x7k2m9" îl poate tasta. „l.eventya.net/x7k2m9" — nu.
- **Izolare de reputație.** Un shortener e prin definiție un open redirector. Dacă e abuzat și Google Safe Browsing flaguiește domeniul, pe un domeniu separat pierzi shortener-ul; pe un subdomeniu al lui `eventya.net` pierzi reputația domeniului principal, inclusiv deliverability-ul pe email.
- **Deep-links: o configurare, toate conturile.** Universal Links (iOS) și App Links (Android) se declanșează doar pentru domenii listate în aplicație. Un singur domeniu scurt înseamnă o singură asociere. Alternativa — deep-links pe fiecare domeniu custom de client — ar cere un release de app la fiecare client nou.

#### Candidați

Verificați cu `whois` la 27 august 2026. **Whois e un semnal, nu o rezervare** — se confirmă la registrar înainte de decizie.

| Domeniu | Lungime | Stare la verificare | Observații |
|---|---|---|---|
| `evy.to` | 6 | fără NS; `.to` nu are whois public accesibil | Cel mai scurt. De confirmat la registrar. `.to` e Tonga, revânzare liberă, folosit larg pentru shorteneri. |
| `evy.link` | 8 | liber la registry (`whois.uniregistry.net`) | Greu de găsit la înregistrare în practică. `.link` e gTLD nou — unele filtre corporate de spam îl tratează cu suspiciune. |
| `evya.ro` | 7 | **liber** | `.ro` inspiră încredere unui cetățean care scanează un cod de pe un panou al primăriei. Cel mai potrivit pentru publicul nostru real. |
| `eyv.ro` | 6 | **liber** | Cel mai scurt `.ro`, dar greu de citit și de dictat. |
| `evtya.ro` | 8 | **liber** | Rezervă. |

Ocupate la verificare: `evy.ro`, `evt.ro`, `evnt.ro`, `ev.ro`, `ey.ro`, `eya.ro`, `evn.ro`, `eve.ro`, `evi.ro`, `eventy.ro`, `evya.com`, `evya.net`, `evya.eu`, `evya.app`.

**Recomandarea mea:** `evy.to` dacă e liber (cel mai scurt, arată ca un shortener), altfel `evya.ro` (încredere locală, cu o singură literă în plus).

> ⚠️ **Decizia se ia o singură dată.** Codurile tipărite stau pe pereți 5–10 ani; domeniul din ele nu se mai poate schimba niciodată. Nu pornim „provizoriu" pe subdomeniu cu gândul că-l mutăm mai târziu.

### Namespace: cod plat + slug personalizat sub workspace

Un domeniu scurt comun peste toate conturile ar însemna un spațiu global de slug-uri — primul lucru din platformă rupt de multi-tenancy. Două primării vor amândouă `turism`.

Soluția: **două forme, un singur tabel.**

| Formă | Exemplu | Unicitate | Când |
|---|---|---|---|
| **Cod auto-generat** | `‹domeniu›/x7k2m9` | globală, prin construcție | mereu — orice link are unul |
| **Slug personalizat** | `‹domeniu›/uricani/turism` | **în cadrul contului** | opțional, ales de editor |

- Primul segment al formei lungi e **slug-ul contului, care există deja** și e deja unic global — îl folosește rutarea path-based din eventya (`eventya.net/uricani/despre-noi`). Nu introducem o a doua sursă de adevăr.
- Al doilea segment e unic **per cont**, exact ca orice altă entitate din Stejar. Uricani și Petrila pot avea amândouă `turism`.
- Dezambiguizarea la rutare e totală, fără euristici: **1 segment = cod, 2 segmente = workspace + slug.** Nu servim niciodată un workspace la `‹domeniu›/uricani` singur, deci cazul ambiguu nu există.
- Codurile auto-generate folosesc un alfabet fără caractere confundabile (fără `0/O`, `1/l/I`) — un cod citit de pe un afiș și tastat greșit e un 404 inutil.

**Regulă de tipar: codul QR encodează întotdeauna `code`, niciodată slug-ul personalizat.** `code` e imuabil și cel mai scurt; slug-ul personalizat e editabil, deci un afiș tipărit cu el s-ar rupe la prima redenumire. Slug-ul personalizat există pentru oameni — postări, emailuri, ceva de dictat la telefon.

### Permisiuni: niciuna nouă

Cerința — doar cine poate interacționa azi cu CMS-ul (Owners, Editors), nu Page Managers.

Se rezolvă **fără cod nou de autorizare**. `Stejar::ApplicationController#restrict_page_scoped_editor!` e un guard global: page managerii ajung *doar* la controllerele care optează explicit prin `Stejar::Cms::PageManagerScopable`. E suficient să **nu** includem concern-ul în controllerele de Linkuri.

- Gate: `requires_permission "cms.view"` — la fel ca restul CMS-ului.
- Owners: `full_access?` → trec.
- Editors: trec dacă au bifat Website la invitație.
- Page managers: nu au niciun rând de `Permission` (`InviteTeamMember#grant_selected_permissions` rulează doar `if membership.role_editor?`) **și** sunt opriți de guard-ul global. Dublă barieră, zero cod nou.

### Migrare: niciuna

Nu există coduri tipărite în circulație prin `/qr/:slug`. **Scoatem tot ce există**, nu migrăm nimic. Vezi *Ce se șterge*.

---

## Model de date

Un tabel nou, `stejar_links` (migrare nouă — nu edităm nimic existent).

| Coloană | Tip | Rol |
|---|---|---|
| `account_id` | uuid | tenant |
| `code` | string(7) | **unic global**, auto-generat, **imuabil**. Identitatea permanentă a linkului. |
| `vanity_slug` | string, null | unic *în cont*. Editabil. Alias frumos. |
| `destination_type` | enum | `page` \| `url` |
| `page_id` | bigint, null | pentru `page` |
| `locale` | string, null | pentru `page` — limba în care aterizează |
| `url` | text, null | pentru `url` — orice adresă |
| `label` | string | „Afiș intrare muzeu" — vezi *De ce contează eticheta* |
| `status` | enum | `active` \| `paused` \| `archived` |
| `origin` | enum | `auto` (creat de share) \| `manual` |
| `app_route` | string, null | ruta in-app pentru deep-link |
| `page_views_count` | integer | counter cache ContentSignals |
| `created_by_id` | bigint, null | |

Indexuri: `code` unic global; `(account_id, vanity_slug)` unic; `(account_id, page_id, locale)` unic parțial `where origin = 'auto'`.

**Destinația se rezolvă la redirect, nu la creare.** Pentru `destination_type: page`, redirectul citește slug-ul *curent* al paginii în limba respectivă. Deci: editorul schimbă slug-ul paginii → linkul urmează automat, afișul de pe perete continuă să funcționeze. Asta e diferența de fond față de implementarea actuală, unde codul encodează slug-ul și un rename îl rupe iremediabil (comportament recunoscut explicit în `Website::QrCodesController`, care alege 404 în loc să ghicească).

Pentru `destination_type: url`, editorul schimbă destinația când vrea. Un cod tipărit poate fi redirecționat oriunde, oricând.

---

## Contorizare

Fiecare `Link` devine `trackable` polimorfic în ContentSignals. Nu mai e nevoie de nimic special: gemul are deja `belongs_to :trackable, polymorphic: true, counter_cache: :page_views_count`.

Ce dispare față de azi: parsarea de `referrer_breakdown` din `QrCode::ScanStats` și markerul înghesuit în coloana `referrer` a page view-ului *paginii*. Linkul are rândurile lui.

**Două lucruri verificate în gem, care fac designul mai simplu decât pare:**

1. **`PurgePageViewsJob` folosește `delete_all`**, deci nu decrementează `page_views_count`. Counter cache-ul de pe `stejar_links` e un **total pe viață, imun la purge** — gratis. Dispare complet hack-ul cu două surse de adevăr pe care `ScanStats` a trebuit să-l construiască.
2. **Dedup-ul Redis afectează doar contorul de „unici", nu crearea rândurilor** (`PageViewTracker#track` enqueue-ază jobul necondiționat). Deci avem și clickuri brute, și vizitatori unici, fără efort: *„1.204 scanări · 890 persoane"*.

### Canalul

De unde a venit clickul — `qr`, `whatsapp`, `facebook`, `linkedin`, `email`, `copy`, `direct` — merge în coloana `referrer`, prin exact tiparul de validare din `Cms::QrCode::ScanTrackable`: valoarea vine din URL (`?c=wa`), deci e controlată de atacator, și se reconstruiește dintr-un enum fix înainte de scriere. **Niciodată preluată brut.** Zero coloane noi.

Butoanele de share adaugă `?c=`; codul QR nu adaugă nimic (are link propriu, cu etichetă de amplasare), ca să rămână cât mai mic.

---

## Rutare

Rutele de host stau în **eventya**, codul în **stejar**.

```ruby
# eventya: config/routes/short_links.rb
constraints Stejar::ShortLinkRoutingConstraint do   # host == domeniul scurt
  get '/.well-known/apple-app-site-association', to: 'stejar/links/associations#apple'
  get '/.well-known/assetlinks.json',            to: 'stejar/links/associations#android'
  get '/api/links/:code',                        to: 'stejar/links/resolutions#show'
  get '/:workspace/:slug',                       to: 'stejar/links/redirects#show'
  get '/:code',                                  to: 'stejar/links/redirects#show'
end
```

Redirectul e calea fierbinte: un hit de cache pe `code`, fără ActiveRecord în cazul comun. Nu facem serviciu separat (vezi *De ce nu aplicație separată*), dar izolăm căutarea într-un singur obiect, ca extragerea de mai târziu să fie mecanică.

`/.well-known/*` și `/api/*` sunt rezervate: un cod auto-generat nu le poate lovi (alfabet fix + verificare), iar slug-urile de workspace au deja lista lor de rezervări în Stejar.

---

## Share automat în ActionBar

`Stejar::Cms::Website::ShareButton` distribuie azi `@current_url` — URL-ul brut al paginii. Trece pe linkul scurt.

- La randare, componenta cere linkul `auto` pentru `(page, locale)`; dacă nu există, se creează. O singură interogare indexată, cache-uită.
- Fiecare buton primește canalul lui: `?c=wa`, `?c=fb`, `?c=li`, `?c=em`, `?c=cp`.
- Efect imediat, fără ca editorul să facă nimic: fiecare pagină publicată devine măsurabilă la distribuire, iar fiecare link distribuit deschide aplicația nativă la destinatar.

### Preview-ul bogat nu are voie să se rupă

Azi, când distribui pe WhatsApp, cardul cu imagine și titlu se construiește din meta tag-urile paginii. Dacă distribui `‹domeniu›/x7k2m9`, crawler-ul cere meta tag-uri de la domeniul scurt. Majoritatea urmăresc 302-ul, unele nu.

Deci: **când user-agentul e un crawler cunoscut, redirectul servește un HTML minimal cu Open Graph tags** — titlu, descriere, imagine — plus un fallback `<meta refresh>`. Logica de titlu/descriere/imagine există deja în `ShareButton#description` și `#image`; se mută pe `Link`.

Aceleași fetch-uri **nu trebuie să umfle contorul**. `browser.bot?` din gem prinde crawlerele clasice, dar nu toate fetcher-ele de link preview (WhatsApp, Slack, Discord). Adăugăm o listă explicită de UA pe endpointul de redirect.

---

## Deep links

Scop: `‹domeniu›/x7k2m9` deschide aplicația nativă dacă e instalată, altfel cade pe web. Integrarea nativă e alt task; aici pregătim backendul.

- `/.well-known/apple-app-site-association` și `/.well-known/assetlinks.json` servite de pe `‹domeniu›`, generate din configul aplicației.
- **`GET /api/links/:code` → `{ destination, app_route, account, locale }`.** Piesa esențială și cea mai ușor de ratat: pe iOS, când aplicația e instalată, sistemul interceptează URL-ul **înainte** să ajungă la server. Aplicația trebuie să poată rezolva singură codul ca să știe unde să navigheze. Endpointul se proiectează acum, chiar dacă îl consumă alt task.
- `app_route` se derivă automat din destinație când e pagină; câmp liber când nu.

**Limită onestă:** Universal Links nu se declanșează din browserele in-app ale Facebook/Instagram. E o victorie parțială, nu totală — merită spus înainte, nu după.

---

## Dashboard în Analytics

Secțiune nouă în modulul Analytics, lazy ca restul (`AnalyticsController#qr_scans` are deja tiparul).

- KPI: clickuri totale, vizitatori unici, linkuri active, cel mai scanat cod.
- Evoluție în timp, zero-filled.
- Defalcare pe canal (QR / WhatsApp / Facebook / copiere / direct).
- Top linkuri, cu eticheta de amplasare.
- Device + geo, din datele native ContentSignals.

Read-only. Creezi și editezi în `/cms/links`; aici doar te uiți. Fiecare rând linkuiește înapoi în modul.

---

## De ce contează eticheta

Un câmp `label` — „Afiș intrare muzeu", „Flyer târg", „Panou parcare". Fără el, cifra din dashboard nu înseamnă nimic: clientul află că un cod a fost scanat de 1.204 ori, dar nu care dintre cele patru coduri tipărite.

Consecință de UX: **același destinatar, mai multe linkuri** e cazul normal, nu excepția. „Duplică linkul" trebuie să fie o acțiune de un click.

Pentru limbi, la fel: din pagină, „creează linkuri pentru toate limbile" într-o singură acțiune — altfel muzeul cu trei steaguri sub trei coduri înseamnă trei pași manuali de fiecare dată.

---

## De ce nu aplicație separată

Singurul argument serios pentru un serviciu separat e izolarea de uptime: codurile de pe perete să meargă și când CMS-ul e în deploy.

Dar un serviciu separat are nevoie de paginile contului, traducerile, domeniile verificate, locale-urile, permisiunile și configul de tenant al ContentSignals. Ori împarte baza de date cu Stejar — și atunci nu e separat, e un al doilea deploy al aceleiași scheme — ori vorbește prin API cu Stejar, și atunci cade exact când cade Stejar, deci argumentul se anulează singur.

În plus, UI-ul de administrare trebuie oricum să stea în CMS, dashboard-ul în Analytics, iar share-ul din ActionBar are nevoie să rezolve linkul **în timpul randării paginii publice**.

Ce facem în schimb, pentru ~90% din beneficiu la ~2% din cost: host separat prin constrângere de rutare (tiparul `Stejar::WebsiteRoutingConstraint`, deja folosit pentru domenii custom) + cache pe `code`. Un redirect = un hit de cache.

---

## Riscuri și ce facem cu ele

| Risc | Ce facem |
|---|---|
| **Open redirect → phishing → Safe Browsing flaguiește `‹domeniu›`** și se rup toate afișele din toate primăriile | Rate limit la creare; blocklist global; ecran de platform-admin care listează destinațiile externe. Nu restricționăm destinațiile (cerință explicită), dar monitorizăm. |
| **Codurile tipărite nu mor niciodată** | Stări `active/paused/archived`; `code` niciodată reutilizabil; **niciodată 404 sec** — pagină brand-uită „acest cod nu mai e activ" cu link către site. Avertisment tare înainte de ștergerea unui link cu scanări. |
| **Link preview umflă contorul** | Listă explicită de UA pe endpointul de redirect, peste `browser.bot?`. |
| **Slug personalizat redenumit rupe tiparul** | QR-ul encodează întotdeauna `code`, nu slug-ul. |
| **Universal Links nu merg din browsere in-app** | Documentat ca limită cunoscută; fallback web funcționează. |

---

## Ce se șterge

Nu există coduri în circulație, deci curățăm complet:

| Fișier | Acțiune |
|---|---|
| `app/services/stejar/cms/qr_code.rb` (markerele) | **șters** |
| `app/services/stejar/cms/qr_code/page_target.rb` | **șters** |
| `app/services/stejar/cms/qr_code/scan_tracker.rb` | **șters** |
| `app/services/stejar/cms/qr_code/scan_stats.rb` | **șters** |
| `app/controllers/concerns/stejar/cms/qr_code/scan_trackable.rb` | **șters** (+ include-ul din `Website::BaseController`) |
| `app/controllers/stejar/cms/page_qr_codes_controller.rb` + views | **șters** |
| `app/controllers/stejar/website/qr_codes_controller.rb` | **șters** |
| ruta `/qr/:slug` din `eventya/config/routes/account_website.rb` | **ștearsă** |
| `analytics#qr_scans` + `_qr_scans.html.erb` | **rescris** peste noile date |
| `app/services/stejar/cms/qr_code/image.rb` | **păstrat neatins**, mutat sub `Stejar::Links::QrImage`. Constantele lui sunt deja alegerile corecte pentru tipar, cu motivele documentate în cod. |
| `Elements::QrCode` + `QrCode::Target` (elementul din pagină) | **păstrate** — sunt alt feature (un cod afișat vizitatorului care e *deja* pe site). Câștigă în schimb opțiunea de a puncta spre un `Link`. |

---

## Faze

**Faza 1 — Fundația.** *Blocant: domeniul scurt ales și înregistrat.* Migrare `stejar_links`; model + generator de coduri; `ShortLinkRoutingConstraint`; controller de redirect cu cache; tracking ContentSignals cu enum de canal; pagina „cod inactiv". Ștergerea codului vechi. *Livrabil: un link creat în consolă redirectează și se contorizează.*

**Faza 2 — Modulul CMS.** `/cms/links` listă + CRUD; formular cu selector de pagină și URL liber; slug personalizat cu verificare live; ecran de detaliu cu statistici; export QR (SVG, PNG, JPG, PDF — `jspdf` e deja în `package.json`); tile în „Jump to"; scurtătură din meniul ⋮ al paginii.

**Faza 3 — Share automat.** `ShareButton` trece pe linkuri; creare lazy a linkului `auto`; parametri de canal; HTML cu Open Graph pentru crawlere; filtru UA.

**Faza 4 — Analytics + deep links.** Secțiune nouă în Analytics. Fișiere de asociere + `GET /api/links/:code`. Ecran de diagnostic care arată dacă asocierea e servită corect.

---

## Out of scope

- **Rewrite-uri 301 pe domeniul clientului** (`/slug-vechi` → `/slug-nou` după redenumire). E o problemă reală, dar alt produs. Numele modulului — „Linkuri de Share & Coduri QR" — spune exact ce face; „URL Rewrites" ar fi promis și asta.
- Integrarea nativă iOS/Android (alt task).
- Domenii scurte proprii per client.
- Coduri QR cu logo sau culori de brand — taie contrastul de care depinde scanarea.

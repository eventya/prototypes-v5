# Pachete și drepturi — ce primește fiecare workspace

> **Status:** plan de implementare + prototip. Înlocuiește varianta cu grandfathering din `stejar/plans/entitlements-si-pachete.md`.
> **Sursa comercială:** grila de pachete v1.5 și matricea de funcționalități v1.5 (documente interne). Planul folosește doar structura lor, fără prețuri.
> **Audit de cod:** 16.09.2026, `stejar` @ `8dbe196` + `eventya` @ main.

---

## 1. Regulile jocului

| # | Regula |
|---|---|
| R1 | **Toți clienții, inclusiv cei existenți,** primesc exact ce dă subscripția lor. Nu există grandfathering și nici „fotografia" flag-urilor vechi. |
| R2 | **Blocare fermă peste tot.** Nu există moduri `log` / `soft` și nici facturarea automată a depășirilor. |
| R3 | **Ce nu e în pachet se ascunde**, nu se arată cu lacăt. Navigația, setările, elementele CMS și paginile publice se comportă ca și cum funcția n-ar exista. |
| R4 | **Limitele atinse se arată contextual:** acțiunea (de ex. „Adaugă agent") devine inactivă, iar lângă ea apare un buton de upgrade. |
| R5 | **Upgrade-ul e o cerere, nu self-service.** Butonul deschide o pagină care creează un tichet în Helpdesk-ul contului de sistem (departamentul Suport). Echipa preia conversația prin fluxul normal de Helpdesk (e-mail + interfața de răspuns). |
| R6 | **Doar proprietarul (`role_owner?`) poate cere upgrade.** |
| R7 | **Subscripțiile se pun de mână** din admin. Implicit, conturile cu subscripție activă primesc **Complet**, iar cele fără subscripție activă rămân doar cu modulul CMS. |
| R8 | **La expirare se blochează imediat** toate funcțiile plătite, inclusiv cele publice. Nu există perioadă de grație și nici comutator global. |
| R9 | **Excepțiile comerciale se dau tot prin subscripție** (opțiune sau supliment consemnat), niciodată prin flag-uri editate de mână. |
| R10 | **MCP e activ implicit pentru toți** și nu ține de pachet. |
| R11 | **În interfață, subscripția înseamnă doar două lucruri:** butonul „Upgrade” din bară (proprietar, pachet diferit de Complet) și o linie în meniul de avatar (pachetul și data de expirare). Expirarea și cererile se comunică pe e-mail. |

---

## 2. Catalogul: ce dă fiecare pachet

Pachetele sunt cumulative (Mobil include Web, Complet include Mobil). Helpdesk-ul e un produs separat, cu două niveluri, care se poate cumpăra și fără pachet. Cheile de mai jos sunt singurele întrebări pe care codul le pune: `account.entitled?("module.helpdesk")`.

Legendă: ✓ inclus · **opț.** opțiune cumpărabilă · — indisponibil · ★ cheie rezervată pentru o funcție încă neconstruită (§11)

### 2.1 Website

| Cheie | Ce acoperă | Fără subscripție | Web | Mobil | Complet |
|---|---|---|---|---|---|
| `site.core` | CMS, roluri, media, căutare, cookies/GDPR | ✓ | ✓ | ✓ | ✓ |
| `site.custom_domain` | Domeniu propriu + SSL | — | ✓ | ✓ | ✓ |
| `site.branding` | Branding per workspace | — | ✓ | ✓ | ✓ |
| `site.analytics` | Analytics + raportul periodic pe e-mail | — | ✓ | ✓ | ✓ |
| `content.qr` | Cod QR per pagină (elementul `QrCode`, ecranul QR al paginii) | — | ✓ | ✓ | ✓ |
| `content.qr_manager` | Linkuri scurte create manual + domenii de linkuri (QR Code Manager) | — | ✓ | ✓ | ✓ |
| `site.audio_guide` | Elementul `Audio` | — | ✓ | ✓ | ✓ |
| `site.a11y` ★ | Declarația de accesibilitate (prototipul `declaratie-accesibilitate`) | — | ✓ | ✓ | ✓ |
| `site.schema_org` ★ | Date structurate JSON-LD | — | ✓ | ✓ | ✓ |
| `site.mol` ★ | Monitorul Oficial Local | — | ✓ | ✓ | ✓ |
| `ai.tts` ★ | Generarea vocilor pentru ghidul audio | — | ✓ | ✓ | ✓ |
| `module.community` | Recenzii, reacții, bookmark-uri, urmăriri, zona de membru, dashboard Comunitate | — | — | — | ✓ |

### 2.2 Aplicație mobilă

| Cheie | Ce acoperă | Fără | Web | Mobil | Complet |
|---|---|---|---|---|---|
| `module.mobile_app` | Setări aplicație, Sandbox, resurse store, tab-uri, build-uri, API mobil | — | — | ✓ | ✓ |
| `push.notifications` | Push per pagină din meniul paginii | — | — | ✓ | ✓ |
| `push.broadcast` | Alerte în masă (anunțurile de azi) | — | — | ✓ | ✓ |
| `push.zones` ★ | Alerte pe zone (geo-fencing) | — | — | ✓ | ✓ |
| `mobile.offline` ★ | Conținut offline | — | — | ✓ | ✓ |

> **Anunțurile trec de la Comunitate la Aplicație.** Azi controller-ul stă sub `community/`, dar grila le vinde cu pachetul Mobil. Intrarea din setările aplicației (`_announcements_section`) există deja.

### 2.3 Helpdesk (produs separat)

| Cheie | Ce acoperă | Start | Pro | Complet |
|---|---|---|---|---|
| `module.helpdesk` | Tichete, formulare publice, e-mail, FAQ, rapoarte, elementele `HelpdeskForm` și `Faq` | ✓ | ✓ | ✓ (Pro inclus) |
| `helpdesk.whatsapp` | Canalul WhatsApp | ✓ | ✓ | ✓ |
| `helpdesk.departments` | Mai multe departamente (Start are doar Inbox) | — | ✓ | ✓ |
| `helpdesk.transfer` | Mutare și asignare între departamente | — | ✓ | ✓ |
| `helpdesk.sla` | Politici SLA, rapoarte SLA | — | ✓ | ✓ |
| `helpdesk.field_reports` | Câmpul de locație GPS + harta tichetelor | — | ✓ | ✓ |

### 2.4 Opțiuni AI

| Cheie | Web | Mobil | Complet | Helpdesk (fără pachet) |
|---|---|---|---|---|
| `ai.editor` — asistentul din CMS | opț. | ✓ | ✓ | — |
| `ai.visitor` — asistentul public (site + aplicație) | opț. | opț. | ✓ | — |
| `ai.helpdesk` — ciorne și direcționare în Helpdesk | opț. (cere Pro) | opț. (cere Pro) | ✓ | opț. doar la Pro, **blocat** la Start |

### 2.5 Limite

| Limită | Fără subscripție | Web | Mobil | Complet | Supliment |
|---|---|---|---|---|---|
| `limits.backend_users` | 3 ⚠ D1 | 3 | 10 | 25 | `extra_users` |
| `limits.storage_gb` | 1 ⚠ D1 | 10 | 25 | 100 | `extra_storage_gb` (pași de 10 GB) |
| `limits.helpdesk_agents` | — | Start: **3 fix** · Pro: 3 | | ⚠ D2 | `extra_agents` (doar Pro) |
| `limits.helpdesk_departments` | — | Start: 1 (Inbox) · Pro: nelimitat | | nelimitat | — |

Helpdesk fără pachet: `limits.backend_users` = limita de agenți.

**Conturi scutite** (au tot, fără limite): contul de sistem (`Account#system?`) și template-urile (`Account#template?`).

---

## 3. Modelul de date

### 3.1 `stejar_subscriptions` — o migrare nouă

```ruby
add_column :stejar_subscriptions, :package,          :string,  null: false, default: "none"  # none | web | mobil | complet
add_column :stejar_subscriptions, :helpdesk,         :string,  null: false, default: "none"  # none | start | pro
add_column :stejar_subscriptions, :ai_editor,        :boolean, null: false, default: false
add_column :stejar_subscriptions, :ai_visitor,       :boolean, null: false, default: false
add_column :stejar_subscriptions, :ai_helpdesk,      :boolean, null: false, default: false
add_column :stejar_subscriptions, :extra_users,      :integer, null: false, default: 0
add_column :stejar_subscriptions, :extra_storage_gb, :integer, null: false, default: 0
add_column :stejar_subscriptions, :extra_agents,     :integer, null: false, default: 0
add_column :stejar_subscriptions, :catalog_version,  :string,  null: false, default: "1.5"
remove_column :stejar_subscriptions, :plan  # basic/standard/custom — nu e citit nicăieri
```

Rămân: `status` (active / expired / cancelled), `starts_at`, `ends_at`, `notes`, `created_by_id`. `billing_type` dispare din formular; coloana rămâne până se decide facturarea.

Validări:
- În Complet, helpdesk-ul se forțează la `pro` și opțiunile AI nu se salvează (sunt incluse).
- `ai_helpdesk` cere `helpdesk: pro`.
- `extra_agents > 0` cere `helpdesk: pro`.
- `package: none` + `helpdesk: none` e invalid: înseamnă „fără subscripție", deci se șterge rândul.

### 3.2 `stejar_account_meta` — ce se întâmplă cu flag-urile

| Coloană | Devine | Acțiune |
|---|---|---|
| `helpdesk_sla_enabled` | `helpdesk.sla` | se citește din catalog; coloana se șterge în PR-ul de curățenie |
| `whatsapp_available` | `helpdesk.whatsapp` | idem |
| `media_storage_limit` | `limits.storage_gb` | idem |
| `ai_public_assistant_enabled` | **preferința** clientului | rămâne; efectiv = `entitled?("ai.visitor") && ai_public_assistant_enabled` |
| `ai_helpdesk_agent_enabled` | **preferința** clientului | rămâne; efectiv = `entitled?("ai.helpdesk") && ai_helpdesk_agent_enabled` |
| `whatsapp_enabled`, `whatsapp_phone_number` | configurare canal | rămân |
| `ai_monthly_token_limit`, `ai_public_monthly_token_limit` | protecție tehnică, nu comercială | rămân în admin, tab-ul AI |
| `mcp_enabled` | în afara pachetelor | default `true`; migrarea le pornește pe toate; toggle-ul din admin rămâne ca frână |
| `services` | coloană moartă | se șterge |

### 3.3 Catalogul și rezolvarea

```
lib/stejar/entitlements/catalog.rb        # §2 ca date: pachet → chei + limite; versiunea "1.5"
app/models/stejar/entitlements/resolver.rb # subscripție activă → set de chei + limite
```

```ruby
account.entitlements                    # memoizat pe request (Stejar::Current)
account.entitled?("module.helpdesk")    # => true / false
account.entitlement_limit("limits.backend_users")  # => 13 (10 + 3 suplimentari), nil = nelimitat
account.entitlements.fingerprint        # => "complet:pro:0:0:0|active" — pentru cache
```

Reguli de rezolvare, în ordine:
1. `system?` sau `template?` → tot, fără limite.
2. Fără subscripție sau `!subscription.currently_active?` (verificat **pe dată**, la fiecare request) → profilul „Fără subscripție".
3. Altfel → `package` + `helpdesk` + opțiuni + suplimente, din catalog.

Expirarea nu are nevoie de job: `currently_active?` compară deja datele.

---

## 4. Unde se aplică: ascundere (R3)

### 4.1 Module și navigație — un singur punct

`app/models/concerns/stejar/permissionable.rb` — `can_access?` (46-60) și `can_access_module?` (64-78) primesc, imediat după `module_enabled?`, verificarea `account.entitled?(MODULE_KEYS[module])`.

Asta acoperă dintr-o singură schimbare:
- tab-urile din navbar, desktop (`Layout::Navbar`) și mobil (`_mobile_menu`);
- redirect-ul de pe dashboard către primul modul accesibil;
- orice controller cu `requires_permission` / `requires_module_access`;
- ecranele de permisiuni din Echipă (modulul nu mai apare ca opțiune).

Legătura modul → cheie: `cms` → `site.core`, `media` → `site.core`, `mobile_app` → `module.mobile_app`, `community` → `module.community`, `helpdesk` → `module.helpdesk`.

### 4.2 Funcții din afara catalogului de module

Concern nou, `Stejar::RequiresEntitlement`, cu macro-ul `requires_entitlement "site.analytics", only: …`. Când lipsește dreptul, răspunde cu **404** (funcția nu există pentru cont), nu cu mesaj de upgrade. Înlocuiește `PaidPlanGate`, care se șterge.

| Cheie | Controllere |
|---|---|
| `site.analytics` | `cms/analytics_controller`, `cms/analytics/*` |
| `content.qr` | `cms/page_qr_codes_controller`, `ElementsController#qr_code` |
| `content.qr_manager` | `cms/settings/short_links_controller`, `short_link_domains_controller` |
| `site.custom_domain` | `workspace/domains_controller` |
| `site.branding` | acțiunile de branding din `workspace/settings_controller` |
| `ai.editor` | `ai_assistant/conversations_controller`, `AiAssistantChannel` |
| `ai.visitor` | `cms/settings/ai_assistant_controller` |
| `ai.helpdesk` | `helpdesk/settings/ai_agent*`, `helpdesk/tickets/ai_replies_controller` |
| `helpdesk.sla` | `helpdesk/settings/slas*`, `tickets/slas`, `customers/sla_assignments`, `reports/sla` |
| `helpdesk.whatsapp` | `helpdesk/settings/whatsapp`, `customers/whatsapp_numbers`, `tickets/whatsapp_associations` |
| `helpdesk.field_reports` | `helpdesk/maps_controller` |
| `push.broadcast` | `community/announcements_controller` |
| `push.notifications` | push-ul din meniul paginii |

Intrările din interfață se ascund cu același `entitled?`:
- meniul paginii (QR, urmăritori, push): `_admin_page_menu_items`, `page_manager_menu_items`;
- hub-ul de setări CMS: linkuri scurte, asistent AI;
- hub-ul de setări Helpdesk: SLA, WhatsApp, agent AI;
- butonul de hartă și tab-ul SLA din rapoarte;
- dashboard-ul CMS: panoul Analytics;
- hub-ul Workspace: domenii, branding;
- câmpul flotant al asistentului AI;
- tab-urile Comunității.

### 4.3 Elemente CMS

Atribut nou pe `Cms::Elements::Base`: `entitlement "module.helpdesk"`. Maparea:

| Element | Cheie |
|---|---|
| `HelpdeskForm`, `Faq` | `module.helpdesk` |
| `Reviews`, `ReviewSummary`, `AllReviews` | `module.community` |
| `ActionBar` — butoanele like / dislike / bookmark / follow | `module.community` (filtru în `enabled_buttons`; share și calendar rămân) |
| `QrCode` | `content.qr` |
| `Audio` | `site.audio_guide` |

Unde se filtrează:
- **Picker:** `ComponentRegistry.available_for(account)`, folosit de `Presenters::ElementForm#categories`. E același loc ca `PAGE_MANAGER_BLOCKED_COMPONENTS`.
- **Server:** `ElementsController#create` și schimbarea de tip din `#update`.
- **Agenți și API:** `Mcp::ComponentResolver` (REST API + MCP), promptul asistentului AI din CMS și `BuildFromAi`. Altfel AI-ul ar putea construi elemente pe care contul nu le are.
- **Site public:** `BlockRenderer#render_element`. Un element salvat pe pagină, dar fără drept, nu se randează, iar containerul lui dispare. Aceeași cale deservește site-ul, webview-urile aplicației și preview-ul.
- **Editor:** elementul rămas pe pagină apare ca un rând discret („Recenzii · nu apare pe site în planul curent") cu acțiunea Șterge, fără nume de pachet și fără upgrade. La un upgrade ulterior, elementul reapare singur. Vezi D6.
- **Cache:** cheia din `Pages::Renderer` (24h) primește `account.entitlements.fingerprint`. Fără ea, după un downgrade sau o expirare pagina ar mai arăta elementele plătite încă o zi.

### 4.4 Suprafețe publice (R8)

| Cheie | Ce se oprește |
|---|---|
| `module.helpdesk` | `helpdesk_public/*` (formulare, embed, comentarii), mailbox-urile de tichete |
| `helpdesk.whatsapp` | scope-ul `whatsapp_active` folosit de job-ul de mesaje primite |
| `module.community` | `website/reviews`, `all_reviews`, `bookmarks`, `page_follows`, `reactions`, `notifications`, zona de membru, clopoțelul din temă |
| `ai.visitor` | widget-ul și butonul (helper-ul `ai_public_assistant_enabled?`), `PublicAiAssistantChannel`, `public_ai_conversations`, `public_ai_tickets`, tab-ul AI din aplicație |
| `module.mobile_app` | `mobile_app/api/v1/*`, `hotwire/*`, sandbox |
| `site.custom_domain` | rezolvarea contului pe domeniu propriu (`Current`) → site-ul rămâne pe subdomeniul Eventya |

⚠ **Linkurile scurte deja tipărite** (redirect-urile de pe domeniul de linkuri) rămân funcționale. Se ascunde doar managerul. Vezi D3.

---

## 5. Limite (R2, R4)

| Limită | Se numără | Blocare pe server (un singur punct) | Unde apare în UI |
|---|---|---|---|
| Utilizatori | membership-uri cu rol de echipă (`editor`, `owner`, `page_manager`), **fără** `developer` | `Team::InviteTeamMember` (acoperă și `Helpdesk::InviteAgent`) + promovarea de rol din `Team::MembersController#update_role` | `team/members/index`: „Invită membru" inactiv |
| Agenți | `Helpdesk::Agent` cu cel puțin un departament | `DepartmentAgentsController#create` (ambele moduri) | `departments/show`: „Adaugă agent" inactiv |
| Departamente | departamente fără `inbox: true` | `DepartmentsController#create` | `departments/index`: „Departament nou" inactiv |
| Stocare | `media_stats.total_bytes` + dimensiunea fișierului nou | `Media::CreateAsset` + `check_storage_limit` din `FoldersController` + `Media::PickerController#upload` + `Cms::PageSeoController` | zonele de upload inactive; câmpurile de imagine din editor |

Detalii:
- **Datele existente peste limită nu se ating.** Un cont cu 15 utilizatori pe un plafon de 10 îi păstrează pe toți, dar nu mai poate invita alții.
- **Stocarea se incrementează la upload,** nu doar în job-ul de 4 ore, altfel un upload în lot trece de limită.
- Căile de sistem (`clone_site`, `theme_importer`, `import_from_json`, `sitemap/uploader`, sincronizarea bannerelor) sunt scutite.
- Mesajul de limită devine i18n (azi e hard-coded în engleză), iar componenta de mesaj e una singură: `Stejar::Entitlements::LimitNotice`.
- Proprietarul vede „Cere upgrade", ceilalți văd „Contactează proprietarul spațiului de lucru".
- **Plafonul de tokeni AI** rămâne protecția tehnică de azi. Se repară doar composer-ul Helpdesk, care azi ignoră răspunsul 403 fără niciun mesaj.

---

## 6. Bara de sus și asistentul AI (ecranele 1-4)

Ecranele sunt construite pe markup-ul real din `stejar`.

### 6.1 Bara

| Element | Azi | Devine |
|---|---|---|
| Lățimea | `_navbar.html.erb` o limitează la `max-w-7xl` | **Toată lățimea ecranului.** Conținutul paginii rămâne în `max-w-5xl` |
| Simbolul Eventya | `_header_menu.html.erb` L5-7 | **Scos.** Rămâne în footer și în meniul mobil |
| Meniul de module | pastile centrate (`components/stejar/layout/navbar.html.erb`) | **Tab-uri text aliniate la stânga** (§6.2) |
| „Asistent AI" | buton în bară (`_ai_assistant_trigger.html.erb`) | **Câmp flotant jos, pe centru** (§6.5) |
| Pastila „Live / Activează" | `_live_status.html.erb` | **Scoasă.** Starea domeniului rămâne în Setări spațiu de lucru → Domenii |
| „Upgrade” | — | **Nou**, în stânga clopoțelului (§6.3) |
| Clopoțelul, avatarul | `_notifications_items`, `_user_avatar` | Rămân |

Ordinea din dreapta: „Upgrade” · clopoțel · separator · avatar.

### 6.2 Meniul de module

- **Stil:** tab-uri text (`.topnav`, o variantă a `.tabs` din design system): `text-sm`, `px-3.5`, sub-linie neagră de 2px pe marginea barei, fără iconițe și fără chenar. Sub-linia e neagră ca să nu se confunde cu tab-urile din pagini.
- **De ce:** pastilele de azi au 110–150px fiecare. Măsurat în browser, 5 module încap până pe la ~900px, dar 8 module cer ~1.370px, mai mult decât un laptop de 1280 sau 1366px.
- **„Mai mult”:** un controller Stimulus `nav-overflow` cu `ResizeObserver` mută în dropdown-ul existent tab-urile care nu încap. Modulul activ ia locul ultimului tab vizibil. Fără JavaScript, tab-urile fac scroll orizontal.
- **Mobil:** neschimbat, meniul hamburger cu iconițe.

### 6.3 Butonul „Upgrade”

- **Apare** doar la proprietar (`role_owner?`) și doar dacă pachetul nu e Complet. Alte condiții nu există.
- **Arată** ca un buton cu contur, nu plin. Duce la `/workspace/upgrade` (§7).
- **Nu are stări:** nici bulină, nici banner, nici „cerere trimisă”. Dacă există deja o cerere deschisă, o arată pagina de upgrade (§7.1).
- **Pe mobil** stă în meniul hamburger, deasupra modulelor.

### 6.4 Meniul de avatar

- Sub nume și rol, o singură linie: pachetul și data („Expiră pe 31.12.2026”, „Fără dată de expirare”, „A expirat pe …”, „Doar CMS și Media” fără pachet).
- O văd toți membrii echipei. Nu e link, nu are acțiuni și nu are culori de avertizare, în afară de data trecută.
- Meniul rămâne `w-56`.

### 6.5 Asistentul AI flotant

- **Forma:** arată ca un câmp de text („Întreabă asistentul AI…”), dar e un buton. Click-ul deschide panoul de azi (`#ai-assistant-panel`), pe aceeași axă.
- **Poziția:** fix, jos pe centru, `w-[520px]`; pe mobil ocupă lățimea ecranului minus 16px. Panoul deschis are `w-[560px]`, pe mobil 75% din înălțime.
- **Când apare:** doar dacă spațiul de lucru are dreptul `ai.editor`.
- **Deschis sau minimizat:** cât timp panoul e deschis, câmpul nu se vede. Minimizat, câmpul arată „Continuă conversația…” cu un punct și înlocuiește bara minimizată de azi.
- **Coliziuni:** pe paginile cu `_edit_save_bar`, câmpul urcă deasupra barei de salvare (`body:has(.save-bar)`). `main` primește ~80px spațiu liber jos.
- **Ce nu se schimbă:** conținutul panoului, frame-ul `ai_assistant_panel` și limita de tokeni.

### 6.6 Informarea pe e-mail

Interfața nu avertizează despre subscripție. Proprietarul primește e-mailuri:

| E-mail | Când |
|---|---|
| Abonamentul expiră | cu 30, 7 și 1 zi înainte de `ends_at` (propunere) |
| Abonamentul a expirat | în ziua de după `ends_at` |
| Cererea de upgrade | e-mailurile Helpdesk existente: confirmarea tichetului și răspunsurile echipei |

Un job zilnic, în `config/recurring.yml`, trimite e-mailurile de expirare, fiecare o singură dată per subscripție și prag.

---

## 7. Cererea de upgrade

### 7.1 Pagina

- Ruta este `GET/POST /workspace/upgrade` (`Stejar::Workspace::UpgradeRequestsController`) și e accesibilă doar proprietarului.
- Parametrul `?from=` (`topbar`, `users`, `storage`, `agents`, `departments`) precompletează ce vrea clientul să schimbe.
- Conținutul paginii:
  - un rezumat read-only: workspace, planul curent și utilizarea;
  - opțiunile „Ce vrei să schimbi": pachet superior, Helpdesk Start/Pro, opțiuni AI, utilizatori, stocare, agenți, altceva;
  - un mesaj opțional.
- Pagina nu afișează **prețuri**, pentru că oferta o face echipa.
- Dacă workspace-ul are deja o cerere deschisă, pagina afișează starea ei în locul formularului.

### 7.2 Tichetul

- `Stejar::Subscriptions::UpgradeRequestCreator` preia pattern-ul din `AiAssistant::SupportTicketCreator`: găsește contul de sistem după `root_account_slug`, creează tichetul pe formularul de upgrade și setează clientul la `current_user`.
- Corpul tichetului e structurat: workspace (nume + slug + link admin), plan curent, utilizare, ce s-a cerut, de unde (`from`) și mesajul.
- Workspace-ul se salvează și într-un câmp separat, ca să poată fi detectată o cerere deja deschisă.
- Conversația continuă prin fluxul existent: e-mail către client, răspunsuri din Helpdesk, „Tichetele mele".

### 7.3 Migrarea care creează formularul

```ruby
# stejar/db/migrate/2026091xxxxxxx_create_upgrade_request_helpdesk_form.rb
def up
  account = Stejar::Account.find_by(slug: Stejar.configuration.root_account_slug)
  return unless account   # dev/test fără cont de sistem: nu face nimic

  Stejar::Helpdesk::Form.upgrade_request(account)
end
```

`Form.upgrade_request(account)` urmează pattern-ul lui `Form.ai_assistant`, cu `first_or_create!` pe `dev_key: "system_upgrade_request"`:
- `title: "Cerere upgrade"`, `authentication: "required"`;
- câmpurile `name`, `email`, `text` („Workspace") și `textarea` („Solicitare");
- departamentul se caută după nume („Suport" / „Support") în contul de sistem, cu Inbox ca fallback. Se poate schimba ulterior din setările formularului.

---

## 8. Admin

### 8.1 Lista de conturi (`/stejar-admin/accounts`)

- **Coloane:** cont, pachet + Helpdesk, stare (activă / expiră în N zile / expirată / fără), utilizatori x/y, stocare x/y.
- **Filtre:** toate · fără subscripție · expiră în 30 de zile · expirate · peste o limită.
- **Numărul de membri** se calculează ca în §5, adică fără membrii publici. Azi `memberships.size` îi include și pe ei.

### 8.2 Tab-ul Subscripție (reproiectat)

Formularul are pași în ordinea grilei și un panou de previzualizare lângă el:
1. **Pachet:** carduri Fără pachet / Web / Mobil / Complet, fiecare cu limitele lui.
2. **Helpdesk:** Fără / Start / Pro. În Complet apare „Pro inclus", blocat.
3. **Opțiuni AI:** trei comutatoare, cu starea explicată („inclus în pachet", „necesită Helpdesk Pro", „indisponibil la Start").
4. **Suplimente:** utilizatori, stocare (pași de 10 GB), agenți (doar la Pro).
5. **Perioadă și stare:** început, sfârșit, activă / anulată, plus nota internă (de ce, ce excepție).

**Previzualizarea** arată ce primește contul după salvare și, mai ales, **ce se schimbă față de acum**:
- modulele care apar sau dispar;
- limitele noi comparate cu utilizarea reală („12 utilizatori activi, plafon nou 10: nu mai poate invita");
- elementele plătite plasate deja pe pagini, care vor dispărea de pe site.

### 8.3 Ce dispare

- `accounts/edit.html.erb`: comutatoarele de stocare, SLA, WhatsApp, agent AI și asistent public.
- Plafonul de tokeni AI se mută în tab-ul AI.
- Tab-ul Intelligence (MCP) rămâne.

---

## 9. Conturile existente

**Migrarea de date** (PR 1):
- Conturile cu `subscription.currently_active?` primesc `package: complet`, deci și Helpdesk Pro și toate opțiunile AI.
- Dacă aveau `media_storage_limit` peste 100 GB, diferența devine `extra_storage_gb`, rotunjită în sus la multiplu de 10, ca să nu li se blocheze upload-ul.
- `mcp_enabled = true` pentru toate conturile, iar default-ul coloanei devine `true`.
- Conturile fără subscripție activă nu se ating.

**Raportul de impact** (rake `stejar:entitlements:impact`, rulat **înainte** de PR-ul cu porți) listează conturile fără subscripție activă care folosesc azi ceva plătit:
- domeniu propriu verificat;
- tichete în ultimele 90 de zile;
- dispozitive mobile înregistrate;
- recenzii sau reacții;
- asistent public pornit;
- WhatsApp activ.

Echipa le pune subscripția de mână înainte de deploy-ul porților. Altfel, în ziua deploy-ului, un astfel de client își pierde site-ul de pe domeniul propriu.

---

## 10. Etape (PR-uri)

| PR | Conținut | Schimbă comportamentul? |
|---|---|---|
| 1 | Catalog, migrarea `stejar_subscriptions`, `Resolver`, `entitled?`, migrarea de date (Complet + MCP), rake-ul de impact | Nu, nimeni nu citește încă dreptul |
| 2 | Admin: lista și tab-ul Subscripție reproiectate | Doar în admin |
| 3 | Formularul de upgrade (migrare), pagina de cerere, butonul „Upgrade”, linia de pachet din meniul de avatar, e-mailurile de expirare | Adaugă, nu blochează |
| 4 | Porțile: `Permissionable`, `RequiresEntitlement`, elemente, suprafețe publice, cheia de cache; ștergerea `PaidPlanGate` | **Da.** Deploy doar după ce raportul de impact e curat |
| 5 | Limitele: utilizatori, agenți, departamente, stocare + `LimitNotice` | **Da** |
| 6 | Curățenie: coloanele derivate din `account_meta`, `services`, `plan`, comutatoarele vechi din admin | Nu |
| 7 | Bara de sus: full width, fără simbol, tab-uri cu „Mai mult”, asistentul AI flotant. Independent de pachete, poate intra oricând | Doar vizual |

Testele de acceptanță pentru PR 4 și 5 folosesc un factory per profil (`:free`, `:web`, `:mobil`, `:complet`, `:helpdesk_start`, `:helpdesk_pro`) și verifică pentru fiecare cheie: navigație, controller (404), element (picker + public) și cache.

---

## 11. Cele 7 funcții „fără cod" — starea reală (16.09.2026)

| Funcție | Stare | Cheie | Unde se leagă dreptul |
|---|---|---|---|
| QR Code Manager | **live** din 10.09 (linkuri scurte) | `content.qr_manager` | `ShortLinksController`, `ShortLinkDomainsController`; linkurile automate de share rămân |
| Declarația de accesibilitate | **în lucru** (prototip) | `site.a11y` | pagina publică `/accesibilitate` + setările ei |
| Alerte pe zone | neînceput; există locul (`community/audiences.rb`, comentariul „geofence") | `push.zones` | noul tip de audiență, filtrat per cont |
| Schema.org JSON-LD | neînceput; datele există (locații, intervale) | `site.schema_org` | `Cms::Website::MetaTags` |
| Monitorul Oficial Local | neînceput | `site.mol` | modulul nou, cu `requires_entitlement` |
| Conținut offline | neînceput pe server | `mobile.offline` | configurația build-ului / endpoint nou în `api/v1` |
| Generarea vocilor (TTS) | neînceput; upload-ul manual e live | `ai.tts` | acțiunea „Generează" din câmpul Audio + job-ul nou |

Cheile ★ există în catalog de la PR 1. Orice funcție nouă se leagă de cheia ei în momentul în care se construiește, nu după.

---

## 12. Decizii deschise

| # | Întrebare | Propunere |
|---|---|---|
| D1 | Ce limite are un cont **fără subscripție**? | 3 utilizatori, 1 GB (default-ul de azi) |
| D2 | În **Complet**, agenții Helpdesk au limită separată? | Nu: sunt limitați doar de cei 25 de utilizatori |
| D3 | La pierderea `content.qr_manager`, **redirect-urile codurilor deja tipărite** se opresc? | Nu, rămân funcționale; se ascunde doar managerul |
| D4 | La pierderea pachetului Mobil, **aplicația din store** primește 404 pe API. Ce vede cetățeanul? | De verificat cu aplicația nativă: ecran „Serviciu indisponibil", nu crash |
| D5 | **FAQ** și **rapoartele** Helpdesk intră și în Start? | Da, țin de modul, nu de Pro |
| D6 | În **editor**, un element plătit rămas pe pagină se ascunde complet sau apare ca rând discret, cu Șterge? | Rând discret: explică golul din pagină și permite curățarea (ecranul 8) |

---

## Ecrane

1. **Bara de sus:** full width, tab-uri, „Upgrade” lângă clopoțel, AI flotant
2. **Meniul de avatar:** pachetul și data de expirare
3. **Asistentul AI:** câmp flotant, panoul deschis, minimizat, cu bara de salvare, mobil
4. **Meniul de module:** tab-uri text cu „Mai mult”
5. **Cerere upgrade:** formularul
6. **Cerere trimisă:** confirmarea și tichetul văzut de Suport
7. **Limită:** utilizatori (Echipă)
8. **Limită:** agenți și departamente (Helpdesk Start)
9. **Limită:** stocare (Media)
10. **Module ascunse:** bara pe fiecare pachet, picker-ul de elemente, meniul paginii
11. **Admin:** lista de conturi
12. **Admin:** tab-ul Subscripție, cu previzualizarea unui downgrade

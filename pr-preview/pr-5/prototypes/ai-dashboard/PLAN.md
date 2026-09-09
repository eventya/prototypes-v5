# Dashboard AI centralizat — Plan de implementare

## Context

Metricile AI sunt azi împrăștiate în **patru ecrane**, din trei zone diferite, fiecare cu propria
perioadă, propriul scope și propriul stil. Nimeni nu are o imagine de ansamblu asupra AI-ului
dintr-un workspace.

Două lucruri sunt de-a dreptul greșite:

1. **Cel mai bun raport e ascuns de client.** `admin/accounts/:slug/ai_performance` — rating,
   knowledge gaps, success rate, distribuția evaluărilor — e vizibil **doar de admin-ul de
   platformă**. Owner-ul workspace-ului nu-l vede niciodată, deși e despre chatbot-ul lui.
2. **`/stejar-admin/ai_usage` minte prin omisiune.** Subtitlul promite „token and request
   consumption per workspace", dar query-ul filtrează `.cms_audience` — deci arată doar
   asistentul din CMS. Website-ul public și drafturile din Helpdesk, care înseamnă ~82% din
   consum, lipsesc din raport.

În plus, nicăieri nu se vede **cât costă**. Se afișează tokeni, iar tokenii nu spun nimic
unui director de DMO și nici nouă când ne uităm la platformă.

---

## Starea curentă în codebase

| Ecran | Rută | Perioadă | Ce arată |
|---|---|---|---|
| CMS › Settings › AI Assistant | `/cms/settings/ai_assistant` | luna curentă, fixă | Conversații + Requests (doar `public`), card tokens pe 3 audiences vs plafon, prompt custom, „how it works" |
| Helpdesk › Settings › AI Agent | `/helpdesk/settings/ai_agent` | luna curentă, fixă | 4 KPI (Generated / Used / Edit rate / Unused), funnel „soarta draftului" în bare CSS, card tokens, house rules, workspace profile |
| Admin › AI Usage | `/stejar-admin/ai_usage` | selector lună | 3 tile-uri + tabel per workspace. **Doar `cms_audience`** |
| Admin › AI Performance | `/stejar-admin/accounts/:slug/ai_performance` | 7d / 30d / 90d / month | 6 carduri, 2 grafice ApexCharts, Knowledge gaps (20), Low ratings (10) |

Plus două carduri încastrate: `admin/accounts#show` („AI Assistant", rating + conversații pe 30
de zile, din `AiConversation.public_overview_for`) și `admin/accounts#edit` (plafon de tokens +
spend pe audience).

**Nu mai există alt dashboard AI.** CMS Analytics și Helpdesk Reports au zero metrici AI —
verificat prin grep.

### Modelul de date

Totul stă în **două tabele**:

**`stejar_ai_conversations`** — `account_id`, **`audience`** (`cms` | `public` | `helpdesk`, cu
CHECK constraint pe invarianții per audience), `user_id`, `session_id`, `ticket_id`, `page_id`,
`locale`, `prompt_tokens`, `completion_tokens`, `total_tokens`, `request_count`, `rating`,
`feedback_comment`, `rated_at`, `referer_url`, `last_activity_at`, `discarded_at`.

**`stejar_ai_messages`** — `conversation_id`, `role` (`user` / `assistant`), `content`,
`metadata` jsonb (GIN). Scope-uri: `failed` (`metadata->>'status' = 'error'`), `no_results`
(`= 'no_knowledge_results'`).

> **Coloana `audience` mapează 1:1 pe taburile propuse.** `cms` → Backend, `public` → Public,
> `helpdesk` → Helpdesk. Nu inventăm o taxonomie nouă, o expunem pe cea existentă.

Suport: `stejar_account_metas.ai_public_assistant_enabled` / `ai_monthly_token_limit` /
`ai_public_assistant_prompt` / `ai_helpdesk_agent_enabled` / `mcp_enabled`;
`brad_tickets.ai_reply` (jsonb); `brad_comments.inserted_draft_digest` / `draft_edited`;
`brad_ai_agent_configs`.

**Nu se salvează** model, cost sau latency per request.

---

## Propunerea

Un singur loc — **Rapoarte AI** — cu taburi, exact ca Helpdesk Reports: un controller și un URL
per tab, filtrele ca query params.

```
Overview | Backend | Public | Helpdesk
```

- **Overview** — imaginea de ansamblu: conversații, cost, rating, rată de succes, activitate pe
  canale, split tokens+cost vs plafon, feed „necesită atenție".
- **Backend** — asistentul pe care echipa îl folosește în CMS (`audience: cms`). Aici stă
  tabelul de consum per utilizator, singurul loc unde se vede cine cheltuie.
- **Public** — chatbot-ul vizitatorilor (`audience: public`), cu segment intern
  **Tot · Website · App mobil**. Calitatea trăiește aici: rating, knowledge gaps, evaluări mici.
- **Helpdesk** — drafturile pentru agenți (`audience: helpdesk`): funnel-ul draftului, edit rate,
  tabel per agent.

Iar în Admin, **aceleași patru taburi**, cumulate pe toată platforma, plus un al cincilea:

```
Overview | Backend | Public | Helpdesk | Workspaces
```

**Workspaces** e un leaderboard sortabil (implicit după cost), cu drill-down în dashboard-ul
acelui workspace. Înlocuiește `/stejar-admin/ai_usage`.

### Setări vs rapoarte

Statisticile pleacă din paginile de setări. CMS › Settings › AI Assistant rămâne cu promptul
public și „how it works"; Helpdesk › Settings › AI Agent rămâne cu house rules și workspace
profile. Fiecare primește un card-link către tabul relevant din dashboard. **O cifră trăiește
într-un singur loc.**

> **Atenție la nume.** `cms/settings/ai_assistant` sună a „asistentul din CMS", dar editează
> `ai_public_assistant_prompt`, `ai_usage_stats` e scopat pe `public_audience`, iar starea de
> activare o citește din `ai_public_assistant_enabled?` — deci configurează **asistentul
> public**. Card-link-ul ei duce în tabul **Public**, nu în Backend.

### Ce nu arătăm owner-ului

Flag-urile de activare — `ai_public_assistant_enabled`, `ai_helpdesk_agent_enabled`,
`mcp_enabled` — se setează de platformă, în `admin/accounts#edit`. Owner-ul nu le poate
schimba. Un card „ce e activat / ce nu" i-ar lista funcții pe care nu le are și nu și le poate
da singur, așa că **nu apare în dashboard-ul de workspace**; adopția pe funcții rămâne o vedere
de Admin (ecranul 5).

Plafonul lunar de tokens, în schimb, **se arată** — owner-ul trebuie să știe când se apropie de
el, iar informația e deja expusă azi prin `stejar/shared/_ai_token_usage`.

### Acces

Workspace → `full_access?` (owner / developer), identic cu Helpdesk Reports și cu secțiunea din
dropdown-ul de avatar unde intră linkul. Admin → `require_admin!`.

---

## Ecrane

| # | Ecran | Ce arată |
|---|---|---|
| 1 | `01-overview.html` | Workspace · Overview — 4 KPI (conversații, **cost estimat**, rating, rată de succes), activitate stivuită pe canale, card tokens+cost vs plafon, donut pe canal, feed „necesită atenție" pe toată lățimea |
| 2 | `02-backend.html` | Tab Backend — KPI, activitate în timp, **tabel consum per utilizator cu coloană Cost**, de unde e invocat, la ce e folosit |
| 3 | `03-public.html` | Tab Public — segment `Tot / Website / App mobil` care **chiar comută datele**, distribuția evaluărilor, website vs app în timp, limba conversației, Knowledge gaps, Low ratings |
| 4 | `04-helpdesk.html` | Tab Helpdesk — 4 KPI, funnel-ul draftului, cost pe draft generat **și pe draft chiar folosit**, generate vs folosite în timp, tabel per agent |
| 5 | `05-admin-overview.html` | Admin · Overview platformă — cost total + trend pe 12 luni, adopție, workspace-uri aproape de plafon, top 5 după cost, unde se duc banii |
| 6 | `06-admin-workspaces.html` | Admin · Workspaces — leaderboard sortat după cost, cu total pe platformă în footer |
| 7 | `07-entry-points.html` | **Legăturile din UI** — dropdown-ul de avatar, sidebar-ul de Admin, și before/after pentru cele două pagini de setări |

Cifrele din prototip sunt mock, dar **coerente aritmetic**: totalurile din ecranul 5 se închid
exact cu tabelul din ecranul 6, iar fiecare cost derivă din tokenii afișați la aceeași rată.

---

## Cost estimativ

```
cost = prompt_tokens / 1.000.000 × rată_input(model)
     + completion_tokens / 1.000.000 × rată_output(model)
```

Se poate calcula **retroactiv, pe datele existente** — `prompt_tokens` și `completion_tokens`
sunt deja pe fiecare conversație.

Toate cele trei fluxuri rulează pe același model, hardcodat separat în trei locuri:

```ruby
app/services/stejar/public_ai_assistant/chat_loop.rb:9      MODEL = "gpt-5.4-mini"
app/services/stejar/helpdesk/ai_agent/reply_generator.rb:7  MODEL = "gpt-5.4-mini"
app/jobs/stejar/ai_assistant/job.rb:45                      model: "gpt-5.4-mini"
```

Nu se folosesc embeddings (indexul e Meilisearch), deci **fiecare token contorizat vine dintr-un
singur model**.

### Clasă nouă: `Stejar::Ai::Pricing`

`app/services/stejar/ai/pricing.rb` — singurul loc care știe prețuri:

```ruby
DEFAULT_MODEL = "gpt-5.4-mini"        # sursa unică; cele 3 constante MODEL o referă
RATES = {                             # USD per 1M tokens
  "gpt-5.4-mini" => { input: …, output: … }   # se completează la implementare
}.freeze

def self.cost_for(prompt:, completion:, model: DEFAULT_MODEL)
def self.cost_for_scope(relation)     # SUM(prompt_tokens), SUM(completion_tokens) → USD, o interogare
```

### Onestitate în copy — obligatoriu

Eticheta e **„Cost estimat"**, niciodată „Cost". Tooltip peste tot:

> Estimare pe baza tokenilor consumați și a prețului de listă pentru %{model}. Factura reală
> poate fi mai mică — input-ul din cache se taxează redus, iar noi nu îl contorizăm separat.

Motivul e concret: OpenAI facturează input-ul cache-uit la rată redusă, iar `track_token_usage!`
salvează doar `prompt` și `completion`, fără `cached_tokens`. Cifra noastră e un **plafon
superior**, nu factura. Dacă o prezentăm ca fiind factura, primul om care compară cu extrasul
real nu mai are încredere în niciun număr de pe ecran.

---

## Modificări schemă DB

O singură migrare nouă. Nu edităm nimic existent, nu facem backfill.

```ruby
class AddSurfaceAndModelToAiConversations < ActiveRecord::Migration[7.2]
  def change
    add_column :stejar_ai_conversations, :surface, :string  # website | mobile_app
    add_column :stejar_ai_conversations, :model,   :string  # ex. "gpt-5.4-mini"
    add_index  :stejar_ai_conversations, %i[account_id surface created_at]
  end
end
```

**`surface`** — azi website-ul și app-ul mobil salvează amândouă `audience: "public"` și nu se
pot separa. Se populează la creare în `Stejar::PublicAiAssistantChannel` (linia ~86), din
`hotwire_native_app?`. Rândurile vechi rămân `NULL` → UI-ul le arată ca „nedeterminat".

**`model`** — fără el, o schimbare viitoare de model re-prețuiește retroactiv tot istoricul.
Se populează în toate cele trei puncte de creare din `Pricing::DEFAULT_MODEL`. `NULL` cade pe
`DEFAULT_MODEL`, ceea ce e corect pentru datele de azi.

---

## Rute

**Stejar** — `config/routes/ai_reports.rb`, cu `draw(:ai_reports)` în `config/routes.rb`:

```ruby
namespace :ai_reports, path: 'ai' do
  root to: 'ai_reports#show'                              # redirect → overview, cu filtrele
  resource :overview, only: :show, controller: 'overview'
  resource :backend,  only: :show, controller: 'backend'
  resource :public,   only: :show, controller: 'public'
  resource :helpdesk, only: :show, controller: 'helpdesk'
end
```

**Eventya** — în `config/routes/admin.rb`, `namespace :admin, path: 'stejar-admin'`:

```ruby
namespace :ai do
  root to: 'ai#show'
  resource  :overview,   only: :show, controller: 'overview'
  resource  :backend,    only: :show, controller: 'backend'
  resource  :public,     only: :show, controller: 'public'
  resource  :helpdesk,   only: :show, controller: 'helpdesk'
  resources :workspaces, only: :index, controller: 'workspaces'
end
# - resources :ai_usage        ← se scoate
```

`accounts#ai_performance` și `#ai_ratings` redirectează în noul dashboard, scopat pe workspace.

**Perioade.** Workspace folosește segmentul `7d / 30d / 90d / 12m` (aliniat la
`Helpdesk::Reports::Filter::PERIODS`). Admin păstrează **selectorul de lună** — costul e o
mărime de facturare, iar plafoanele sunt lunare.

---

## Cod de reutilizat

Aproape totul există deja. Nu rescriem query-uri.

| Ce există | Cum îl folosim |
|---|---|
| `AiConversation.usage_in_range` / `monthly_usage_by_audience` / `monthly_usage_by_user` / `public_overview_for` | Baza tuturor KPI-urilor de tokens; `monthly_usage_by_user` e chiar tabelul din tabul Backend |
| `Stejar::PublicAiAssistant::PerformanceMetrics` | Devine `AiReports::PublicReport` — aceleași query-uri (success rate, rating distribution, daily series, knowledge gaps, low ratings) plus filtrul `surface` |
| `Stejar::Helpdesk::AiAgent::Stats` + `Presenters::AiAgentStats` | Sursa tabului Helpdesk. Se parametrizează range-ul — azi e hardcodat `Time.current.all_month` |
| `Stejar::Presenters::AiTokenUsage` + `stejar/shared/_ai_token_usage` | Cardul de tokens din Overview. `AUDIENCE_STYLE` se extinde cu split website/app, iar `Row` primește un câmp `cost` |
| `Stejar::Helpdesk::Reports::Filter` | **Model** pentru `AiReports::Filter` (whitelist perioadă, `to_params`, `current_range` / `previous_range`) — clasă nouă, nu o modificăm pe cea existentă |
| `Stejar::Helpdesk::Reports::Base` | **Model** pentru `AiReports::Base` (`count_kpi`, `rate_kpi`, `trend_for`, `bucket_counts`, `cache_key` pentru `fresh_when`) — tot clasă nouă |
| `stejar/helpdesk/reports/_kpi_card`, `_chart_card`, `_empty`, `_filter_combobox` | Copiate în `app/views/stejar/ai_reports/`, aceleași locals |
| Stimulus `analytics-chart`, `report-pdf` | Graficele și exportul PDF |

> ⚠️ **Capcană.** `Helpdesk::Reports::BaseController` include `Stejar::Helpdesk::Headable`
> tocmai ca să încarce bundle-ul JS — fără el paginile se randează, dar ApexCharts nu rulează
> niciodată și graficele rămân goale. Noul `AiReports::BaseController` are nevoie de
> echivalentul lui.

---

## Implementare (faze)

1. **Rute + shell.** `AiReports::BaseController` cu gate `full_access?`, `AiReports::Filter`,
   tab strip, tabul Overview.
2. **Taburile de canal.** Backend, Public, Helpdesk — mutarea query-urilor existente în report
   objects.
3. **Migrarea + costul.** `surface` + `model`, `Stejar::Ai::Pricing`, cele trei constante `MODEL`
   reduse la `Pricing::DEFAULT_MODEL`, segmentul Website/App, cifrele `$` peste tot.
4. **Admin.** Cele patru taburi cumulate + tabul Workspaces; se scoate `ai_usage`; redirect de pe
   `ai_performance`.
5. **Legăturile din UI.** Link în `_menu_items.html.erb` (după *Workspace Settings*, în blocul
   `full_access?`, linia 26); cele două pagini de setări rămân doar cu setări + card-link.
6. **i18n + spec-uri.** Chei `ai_reports.*` în en/ro/de/es/fr/hu/it; spec-uri de acces, filtre,
   randare și caching după tiparul din `spec/requests/stejar/helpdesk/reports/`.

---

## Rezumat fișiere Stejar

| Fișier | Schimbare |
|---|---|
| `config/routes/ai_reports.rb` | nou |
| `config/routes.rb` | `draw(:ai_reports)` |
| `app/controllers/stejar/ai_reports/{base,ai_reports,overview,backend,public,helpdesk}_controller.rb` | nou |
| `app/models/stejar/ai_reports/{filter,base,overview_report,backend_report,public_report,helpdesk_report}.rb` | nou |
| `app/services/stejar/ai/pricing.rb` | nou |
| `app/views/stejar/ai_reports/**` | nou (partiale copiate din `helpdesk/reports/`) |
| `app/helpers/stejar/ai_reports_helper.rb` | nou |
| `db/migrate/*_add_surface_and_model_to_ai_conversations.rb` | nou |
| `app/models/stejar/ai_conversation.rb` | scope-uri `website_surface` / `mobile_app_surface` |
| `app/channels/stejar/public_ai_assistant_channel.rb` | setează `surface` + `model` la creare |
| `app/services/stejar/public_ai_assistant/chat_loop.rb` | `MODEL` → `Pricing::DEFAULT_MODEL` |
| `app/services/stejar/helpdesk/ai_agent/reply_generator.rb` | idem + setează `model` |
| `app/jobs/stejar/ai_assistant/job.rb` | idem |
| `app/services/stejar/presenters/ai_token_usage.rb` | split pe `surface`, câmp `cost` |
| `app/views/layouts/stejar/components/_menu_items.html.erb` | link „Rapoarte AI" (linia 26) |
| `app/views/layouts/stejar/components/_admin_sidebar.html.erb` | „AI Usage" → „AI" |
| `app/views/stejar/cms/settings/ai_assistant/show.html.erb` | scoate cardurile de statistici, adaugă card-link |
| `app/views/stejar/helpdesk/settings/ai_agent/show.html.erb` | idem |
| `app/controllers/stejar/admin/ai_*` | `ai_usage` se șterge, `ai_performance` devine redirect |
| `eventya/config/routes/admin.rb` | `namespace :ai`, scoate `resources :ai_usage` |

---

## Out of scope (deocamdată)

- **`cached_tokens` salvat separat.** Ar transforma estimarea de cost în cifră exactă. Necesită
  citirea `usage.prompt_tokens_details.cached_tokens` din răspunsul API și o coloană nouă.
- **Breakdown pe model.** Azi există un singur model; coloana `model` pregătește terenul.
- **Latency / p95 per request.** Nu se măsoară nicăieri.
- **Conversie în EUR** și alertare pe depășire de buget (email către admin la 90% din plafon).
- **Clasificarea intenției** pentru asistentul din CMS (graficul „la ce e folosit" din ecranul 2
  e mock — ar cere o etichetă pe conversație).
- **Migrarea zonei de Admin la token-urile de design.** Admin-ul folosește încă `gray-*` în loc
  de `surface-*` / `ink-*`; prototipul păstrează paleta existentă ca să rămână recognoscibil.

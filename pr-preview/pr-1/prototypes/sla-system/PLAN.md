# SLA System — Plan de implementare

## Context

Modulul Helpdesk (Brad) are nevoie de un sistem de SLA (Service Level Agreement) care sa permita administratorilor sa defineasca si sa monitorizeze timpii de raspuns si rezolvare ai ticketelor.

Sistemul este modelat dupa Zendesk si Freshdesk — cele doua referinte de industrie pentru helpdesk SLA. Am pastrat functialitatile esentiale si am eliminat ce e over-engineering pentru stadiul actual (7 metrici Zendesk, Group SLA, advanced mode).

**Ce rezolva:**
- SLA-ul este un **feature opt-in per workspace** — adminul de platforma il activeaza din zona de Admin (default: dezactivat)
- Administratorii workspace-ului definesc politici SLA cu targeturi per prioritate (critical, high, medium, low)
- La creare ticket, SLA-ul se ataseaza automat (via departament) si se calculeaza deadline-urile
- Agentii vad in real-time cat timp mai au (verde/galben/rosu)
- Sistemul trimite notificari pre-breach (reminder) si post-breach (escalare)
- Ceasul SLA se opreste cand se asteapta raspuns de la client (status pending)
- Business hours: deadline-urile se calculeaza doar pe orele de lucru

**Trei metrici SLA standard (folosite de ambele platforme):**
1. **First Response Time** — de la creare ticket pana la primul raspuns al agentului
2. **Next Response Time** — de la fiecare mesaj al clientului pana la raspunsul agentului
3. **Resolution Time** — de la creare ticket pana la rezolvare

---

## Starea curenta in codebase

Exista deja tabela `brad_slas` cu coloane de baza:

```
brad_slas
├── name (string, NOT NULL)
├── description (text)
├── response_time (interval)
├── resolution_time (interval)
├── applies_to_priority (enum: low/medium/high/critical)
└── account_id (uuid)
```

Modelul `Stejar::Helpdesk::Sla` e minimal (doar `has_many :tickets`). Pe `brad_tickets` exista `sla_id` (optional) si `resolution_time` (interval).

**Nu exista**: controller, views, routes, logica de business, tracking SLA pe tickets, escalation, business hours, jobs.

### Problema cu schema curenta

Un SLA e legat de o singura prioritate (`applies_to_priority`). Asta inseamna ca ar fi nevoie de 4 SLA-uri separate ("Standard - Low", "Standard - High", etc.) in loc de o singura politica cu targeturi diferite per prioritate. Ambele platforme de referinta (Zendesk, Freshdesk) folosesc modelul **un SLA policy → multiple targets per prioritate**.

---

## Feature flag — activare per workspace

SLA-ul nu e disponibil implicit pentru toate workspace-urile. Trebuie activat manual de catre adminul de platforma, urmand pattern-ul existent cu `whatsapp_enabled` si `ai_public_assistant_enabled`.

### Pattern existent in codebase

Feature flag-urile per workspace traiesc in `stejar_account_meta`:

```
stejar_account_meta
├── whatsapp_enabled (boolean, default: false)
├── ai_public_assistant_enabled (boolean, default: false)
├── ... (alte feature flags)
└── helpdesk_sla_enabled (boolean, default: false)   ← NOU
```

### Modificare DB

```ruby
add_column :stejar_account_meta, :helpdesk_sla_enabled, :boolean,
           default: false, null: false
```

### Zona de Admin

In view-ul de edit account (`/admin/accounts/:slug/edit`) se adauga o sectiune noua "Helpdesk SLA" cu un toggle:

```erb
<!-- app/views/stejar/admin/accounts/edit.html.erb -->
<div class="...">
  <h3>Helpdesk SLA</h3>
  <p class="text-muted">
    Permite acestui workspace sa configureze politici SLA pentru tickete.
  </p>
  <%= form.check_box :helpdesk_sla_enabled %>
  <%= form.label :helpdesk_sla_enabled, "Activeaza SLA pentru helpdesk" %>
</div>
```

Controllerul `Stejar::Admin::AccountsController#update` deja accepta `account_meta_params` — se adauga `:helpdesk_sla_enabled` la parametrii permisi (similar cu `:ai_public_assistant_enabled`).

### UI in Helpdesk Settings (cand e dezactivat)

In pagina principala de Helpdesk Settings (`helpdesk/settings/settings/index.html.erb`), cardul SLA este afisat **mereu**, dar se comporta diferit in functie de feature flag:

**Cand `helpdesk_sla_enabled = false` (default):**
- Card vizibil, dar **disabled vizual** (opacity 60%, cursor not-allowed)
- Icon de lock/lacat in colt
- Badge "Premium" sau "Contact admin" (text mic)
- Linkul nu duce nicaieri (sau duce la o pagina informativa cu CTA)
- Hover tooltip: "Aceasta functionalitate este dezactivata. Contacteaza administratorul platformei pentru activare."

**Cand `helpdesk_sla_enabled = true`:**
- Card normal, click duce la `/helpdesk/settings/slas`
- Functionalitate completa disponibila

### Guard pe controllers

Toate controllerele SLA (Settings::SlasController, etc.) trebuie protejate:

```ruby
class Stejar::Helpdesk::Settings::SlasController < Stejar::Helpdesk::SettingsController
  before_action :ensure_sla_enabled

  private

  def ensure_sla_enabled
    head :not_found unless current_account&.account_meta&.helpdesk_sla_enabled?
  end
end
```

### Helper pentru view-uri

In `Stejar::ApplicationHelper`:

```ruby
def helpdesk_sla_enabled?
  respond_to?(:current_account) &&
    current_account&.account_meta&.helpdesk_sla_enabled?
end
```

Folosit oriunde se afiseaza UI legat de SLA (badge pe ticket list, panel pe ticket detail, etc.) — daca flag-ul e off, nu se randa nimic.

### Comportament la dezactivare

Daca un admin de platforma dezactiveaza SLA pe un workspace care il avea activat:
- Politicile SLA existente raman in DB (nu se sterg)
- Deadline-urile pe tickete raman calculate (nu se sterg)
- UI-ul de Settings devine disabled
- Badge-urile si panel-urile de pe tickete nu mai apar
- Background job-urile (breach check) skip-uiesc workspace-ul
- La reactivare, totul se reia de unde a ramas

---

## Arhitectura propusa

```
┌─────────────────────────────────────────────────────┐
│                    SLA Policy                        │
│  (brad_slas)                                         │
│  name: "Standard SLA"                                │
│  business_hours_enabled: true                        │
│  timezone: "Europe/Bucharest"                        │
│  active: true                                        │
│  position: 1                                         │
└──────────────┬───────────────────────────────────────┘
               │ has_many
    ┌──────────▼──────────────────────────────────┐
    │            SLA Targets                       │
    │  (brad_sla_targets)                          │
    │  ┌────────┬───────────┬───────────┬────────┐ │
    │  │Priority│1st Reply  │Next Reply │Resolut.│ │
    │  ├────────┼───────────┼───────────┼────────┤ │
    │  │Critical│  1 hour   │  30 min   │  4 hrs │ │
    │  │High    │  4 hours  │  1 hour   │  8 hrs │ │
    │  │Medium  │  8 hours  │  2 hours  │ 24 hrs │ │
    │  │Low     │ 24 hours  │  4 hours  │ 72 hrs │ │
    │  └────────┴───────────┴───────────┴────────┘ │
    └──────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────┐
    │        Business Hours Schedule                │
    │  (brad_business_hour_schedules)               │
    │  Luni:    09:00 - 18:00                       │
    │  Marti:   09:00 - 18:00                       │
    │  ...                                          │
    │  Sambata: INCHIS                              │
    │  Duminica: INCHIS                             │
    └──────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────┐
    │        SLA Tracker (pe ticket)                │
    │  Coloane noi pe brad_tickets:                 │
    │  first_response_due_at    │ resolved_at       │
    │  next_response_due_at     │ sla_paused_at     │
    │  resolution_due_at        │ sla_paused_dur.   │
    │  first_responded_at       │ *_breached flags   │
    └──────────────────────────────────────────────┘
```

---

## Comportamentul SLA Clock

Cum functioneaza ceasul SLA — cand porneste, se opreste, se pauza:

| Eveniment | SLA Clock | Detalii |
|---|---|---|
| Ticket creat (status: open) | **Start** | Se calculeaza deadline-urile pe baza SLA-ului departamentului |
| Agent raspunde prima data | **First response** completat | Se inregistreaza `first_responded_at` |
| Client trimite mesaj | **Next response** timer porneste | Se seteaza `next_response_due_at` |
| Agent raspunde la mesajul clientului | **Next response** completat | Timer-ul se reseteaza, asteapta urmatorul mesaj client |
| Status → pending | **Pauza** | Ceasul se opreste, se salveaza `sla_paused_at` |
| Client raspunde (pending → in_progress) | **Resume** | Ceasul merge din nou, se acumuleaza `sla_paused_duration` |
| Status → resolved / closed | **Stop** | Se inregistreaza `resolved_at`, se evalueaza breach |
| Ticket reopened | **Restart** resolution clock | Se recalculeaza `resolution_due_at` |
| Prioritate schimbata | **Recalculare** | Se folosesc targeturile noii prioritati |

### Breach states (per metric)

Fiecare metric SLA poate fi intr-una din starile:

- **Active** — ceasul merge, nu e breach
- **Active + Breached** — ceasul merge, s-a depasit target-ul
- **Paused** — ceasul oprit, nu e breach
- **Paused + Breached** — ceasul oprit, dar deja depasit
- **Achieved** — completat in timp
- **Breached** — completat, dar dupa target

---

## Modificari schema DB

### `brad_slas` — modificare tabela existenta

```ruby
# Coloane noi
add_column :brad_slas, :active, :boolean, default: true, null: false
add_column :brad_slas, :business_hours_enabled, :boolean, default: false, null: false
add_column :brad_slas, :timezone, :string, default: "Europe/Bucharest"
add_column :brad_slas, :position, :integer, default: 0, null: false

# Coloane de sters (se muta in sla_targets)
remove_column :brad_slas, :response_time
remove_column :brad_slas, :resolution_time
remove_column :brad_slas, :applies_to_priority

# Index unic pe name trebuie facut scoped la account
remove_index :brad_slas, :name
add_index :brad_slas, [:account_id, :name], unique: true
```

### `brad_sla_targets` — tabela noua

```ruby
create_table :brad_sla_targets do |t|
  t.references :sla, null: false, foreign_key: { to_table: :brad_slas }
  t.enum :priority, enum_type: "brad_ticket_priority", null: false
  t.interval :first_response_time
  t.interval :next_response_time
  t.interval :resolution_time
  t.uuid :account_id, null: false
  t.timestamps
end

add_index :brad_sla_targets, [:sla_id, :priority], unique: true
add_index :brad_sla_targets, [:account_id, :created_at]
add_foreign_key :brad_sla_targets, :stejar_accounts, column: :account_id
```

### `brad_business_hour_schedules` — tabela noua

```ruby
create_table :brad_business_hour_schedules do |t|
  t.references :sla, null: false, foreign_key: { to_table: :brad_slas }
  t.integer :day_of_week, null: false  # 0=Sunday, 1=Monday, ..., 6=Saturday
  t.time :start_time, null: false
  t.time :end_time, null: false
  t.uuid :account_id, null: false
  t.timestamps
end

add_index :brad_business_hour_schedules, [:sla_id, :day_of_week], unique: true
add_index :brad_business_hour_schedules, [:account_id, :created_at]
add_foreign_key :brad_business_hour_schedules, :stejar_accounts, column: :account_id
```

### `brad_sla_holidays` — tabela noua (Faza 4)

```ruby
create_table :brad_sla_holidays do |t|
  t.references :sla, null: false, foreign_key: { to_table: :brad_slas }
  t.date :date, null: false
  t.string :name, null: false
  t.uuid :account_id, null: false
  t.timestamps
end

add_index :brad_sla_holidays, [:sla_id, :date], unique: true
add_index :brad_sla_holidays, [:account_id, :created_at]
add_foreign_key :brad_sla_holidays, :stejar_accounts, column: :account_id
```

### `brad_tickets` — coloane noi

```ruby
# SLA tracking
add_column :brad_tickets, :first_response_due_at, :datetime
add_column :brad_tickets, :next_response_due_at, :datetime
add_column :brad_tickets, :resolution_due_at, :datetime
add_column :brad_tickets, :first_responded_at, :datetime
add_column :brad_tickets, :resolved_at, :datetime

# Breach flags
add_column :brad_tickets, :first_response_breached, :boolean, default: false, null: false
add_column :brad_tickets, :next_response_breached, :boolean, default: false, null: false
add_column :brad_tickets, :resolution_breached, :boolean, default: false, null: false

# Pause tracking
add_column :brad_tickets, :sla_paused_at, :datetime
add_column :brad_tickets, :sla_paused_duration, :interval, default: "PT0S"

# Indexes pentru queries frecvente
add_index :brad_tickets, :first_response_due_at, where: "first_response_due_at IS NOT NULL"
add_index :brad_tickets, :next_response_due_at, where: "next_response_due_at IS NOT NULL"
add_index :brad_tickets, :resolution_due_at, where: "resolution_due_at IS NOT NULL"
```

### `brad_departments` — coloana noua

```ruby
add_reference :brad_departments, :default_sla,
              foreign_key: { to_table: :brad_slas },
              null: true
```

---

## SLA Assignment — cum se ataseaza SLA la ticket

### MVP: Department-based (Faza 2)

Fiecare departament are un `default_sla_id`. La creare ticket:

```
1. Ticket creat cu department_id
2. Se ia department.default_sla
3. Se gaseste SLA target pentru prioritatea ticketului
4. Se calculeaza deadline-urile (cu sau fara business hours)
5. Se salveaza pe ticket: first_response_due_at, resolution_due_at
```

### Post-MVP: Policy conditions cu ordering (Faza 8)

Politicile SLA se evalueaza top-down (dupa `position`), first-match-wins:

```
1. SLA "VIP Clients" (position: 1) — conditie: source = email AND tag = vip
2. SLA "Critical Issues" (position: 2) — conditie: category = "System Down"
3. SLA "Standard" (position: 3) — fara conditii (fallback default)
```

Prima politica care se potriveste se aplica. Daca niciuna nu se potriveste, se ia SLA-ul default al departamentului.

---

## Visual indicators in UI

### Pe ticket list

Fiecare ticket afiseaza un badge SLA cu:
- **Verde** — mai mult de 25% din timp ramas
- **Galben** — sub 25% din timp ramas
- **Rosu** — breach (timp depasit)
- **Gri/Pause** — SLA in pauza (status pending)
- Text: "2h 15m" / "Overdue by 45m" / "Paused"

### Pe ticket detail (sidebar)

Panel dedicat SLA cu:
- **First Response**: deadline + status (achieved/remaining/breached)
- **Next Response**: deadline + status
- **Resolution**: deadline + status
- Progress bar vizual per metric
- Historicul pauzelor

### Filtrare si sortare

- Filter: "SLA Status" (On Track / Warning / Breached / Paused)
- Sort: "SLA Due Date" (cele mai urgente primele)

---

## Notifications si escalare

### Pre-breach reminders (Faza 5)

Un background job (SolidQueue, la fiecare 5 minute) verifica ticketele active:

| Conditie | Actiune |
|---|---|
| 75% din first response time consumat | Notificare agent (in-app + email) |
| 75% din resolution time consumat | Notificare agent (in-app + email) |
| 90% din orice metric consumat | Notificare agent + supervisor departament |

### Post-breach (Faza 5)

| Conditie | Actiune |
|---|---|
| First response breached | Notificare agent + supervisor |
| Resolution breached | Notificare agent + supervisor |
| Resolution breached > 2x target | Notificare administrator |

### Post-MVP: Multi-level escalation (Faza 8)

Freshdesk ofera pana la 4 nivele de escalare pe resolution breach:

```
Level 1 (imediat):     Notifica agentul asignat
Level 2 (+30 min):     Notifica team lead-ul departamentului  
Level 3 (+2 ore):      Notifica managerul
Level 4 (+4 ore):      Notifica administratorul
```

Se implementeaza printr-o tabela `brad_sla_escalation_rules` cu `level`, `notify_to`, `after_duration`.

---

## Reporting (Faza 7)

### Metrici principale

| Metric | Formula |
|---|---|
| First Response SLA % | tickete cu first response in timp / total tickete cu raspuns |
| Resolution SLA % | tickete rezolvate in timp / total tickete rezolvate |
| Next Response SLA % | tickete fara niciun breach next response / total |
| Avg First Response Time | media timpului pana la primul raspuns |
| Avg Resolution Time | media timpului pana la rezolvare |

### Dimensiuni de filtrare

- Per departament
- Per agent
- Per prioritate
- Per perioada (saptamana / luna)
- Per SLA policy

---

## Phasing — ordinea de implementare

### Faza 1: Feature Flag + Schema + CRUD Settings UI
- Migrare DB: `helpdesk_sla_enabled` pe `stejar_account_meta` (default: false)
- Admin: toggle in `/admin/accounts/:slug/edit` pentru activare SLA per workspace
- Helper `helpdesk_sla_enabled?` + guard `before_action :ensure_sla_enabled` pe controllere SLA
- Card disabled in Helpdesk Settings cand flag-ul e off (lock icon + tooltip)
- Migratiile DB (sla_targets, business_hour_schedules, coloane pe tickets/departments)
- Modificare model Sla + modele noi (SlaTarget, BusinessHourSchedule)
- Routes + Controller in `helpdesk/settings/slas`
- UI: lista SLA policies, form creare/editare cu tabel targets per prioritate
- UI: toggle active/inactive, reorder (position)
- **Complexitate: Medie**

### Faza 2: Assignment + Clock Logic
- Service: `Stejar::Helpdesk::Sla::AssignService` — ataseaza SLA la ticket creat
- Service: `Stejar::Helpdesk::Sla::CalculateDeadlinesService` — calculeaza due dates
- Service: `Stejar::Helpdesk::Sla::PauseService` / `ResumeService` — pause/resume pe status change
- Service: `Stejar::Helpdesk::Sla::RecalculateService` — la schimbare prioritate
- Callbacks pe Ticket: after_create, after_update (status, priority)
- Callbacks pe Comment: after_create (first response detection, next response reset)
- Department settings: selectie default SLA
- **Complexitate: Mare** — core business logic

### Faza 3: Visual Indicators
- ViewComponent: `Sla::BadgeComponent` (verde/galben/rosu/gri + countdown text)
- Ticket list: coloana/badge SLA
- Ticket detail: sidebar panel cu cele 3 metrici
- Filter "SLA Status" pe ticket list
- Sort by "SLA Due Date"
- **Complexitate: Medie**

### Faza 4: Business Hours
- UI: schedule editor in SLA policy form (zile + ore per zi)
- UI: holidays manager (date + name)
- Service: `Stejar::Helpdesk::Sla::BusinessHoursCalculator` — calcul deadline cu business hours
- Integrare cu CalculateDeadlinesService
- **Complexitate: Mare** — algoritmul de calcul business hours e non-trivial

### Faza 5: Notifications
- Job: `Stejar::Helpdesk::Sla::BreachCheckJob` (SolidQueue, recurent la 5 min)
- Notificari pre-breach (reminder la 75%, 90%)
- Notificari post-breach (agent + supervisor)
- Email templates pentru SLA alerts
- **Complexitate: Medie**

### Faza 6: Next Response SLA
- Track fiecare customer reply → agent response cycle
- Set `next_response_due_at` la fiecare comment al clientului
- Clear la raspunsul agentului
- Track breaches per-reply (un singur breach => ticket marcat)
- **Complexitate: Medie**

### Faza 7: Reporting
- Dashboard SLA compliance (% first response, % resolution)
- Breakdown per departament, agent, prioritate
- Average response/resolution times
- Trend charts (saptamanal/lunar)
- **Complexitate: Medie**

### Faza 8: Advanced Features (Post-MVP)
- Policy conditions (matching rules cu ordering, first-match-wins)
- Multi-level escalation rules (tabel + config UI)
- Manual override pe deadline-uri
- Configurable pause statuses
- **Complexitate: Mare**

---

## Decizii de design si compromisuri

### Ce am luat din Zendesk
- Badge cu 3 culori (green/amber/red) — cea mai clara reprezentare vizuala
- Policy ordering top-down, first-match-wins (post-MVP)
- Breach states distincte (active, paused, achieved, breached)
- Timp afisat in calendar hours chiar daca se calculeaza in business hours

### Ce am luat din Freshdesk
- 3 metrici standard (first response, next response, resolution) — acopera 95% din cazuri
- Multi-level escalation pe resolution breach (post-MVP)
- Reminders pre-breach configurabile
- Business hours per SLA policy (nu global)
- Pause configurable per status (post-MVP)

### Ce am exclus intentionat
- **7 metrici Zendesk** (periodic_update, pausable_update, agent_work_time, requester_wait_time, total_resolution_time) — over-engineering, 3 metrici sunt suficiente
- **Group SLA** (Zendesk) — mecanism parallel nejustificat
- **Advanced mode** (internal notes counting) — edge case minimal
- **Multiple schedules per account** (Enterprise feature) — un schedule per SLA e suficient

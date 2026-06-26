# Status per Departament — Plan de implementare

## Context

Un tichet Helpdesk poate fi rutat la **mai multe departamente** simultan (ex. „a
căzut un copac pe stradă" → **Salubrizare** + **Poliția Locală** + **Urbanism**).
Fiecare departament își face partea lui de responsabilitate, dar azi **nu există
niciun semnal** când un departament și-a terminat treaba.

Problema: tichetul are **un singur status global**
(`Stejar::Helpdesk::Ticket#status` — `open / in_progress / pending / resolved / closed`),
deci „resolved" e tot-sau-nimic. Nu știm când Salubrizarea a terminat dar
Poliția Locală încă lucrează — și nimeni nu știe când e momentul potrivit să închidă
tichetul.

Avem nevoie de:
1. un **semnal per-departament** — „noi am terminat partea noastră";
2. o **modalitate de comunicare** între departamente;
3. un **prompt de schimbare a statusului** când *toate* departamentele au semnalat gata.

> **Regula de bază:** la **un singur departament** nu apare nimic în plus. Tot
> mecanismul de semnalizare se activează **doar la ≥2 departamente** rutate.

## Starea curentă în codebase

Atribuirea pe mai multe departamente e **deja livrată** (PR #753):

- `brad_ticket_departments (ticket_id, department_id, account_id)` — tabel de legătură
  curat, **fără** coloane de finalizare. Model: `Stejar::Helpdesk::TicketDepartment`.
- `brad_ticket_agents` are `department_id` — agenți alocați *sub* un departament.
- UI-ul sidebar de atribuire (cardurile de departament) e în
  `app/views/stejar/helpdesk/tickets/_assignment_section.html.erb` — **aici** se adaugă
  toggle-ul „Gata".
- **Notele interne există deja** (`brad_comments.internal = true`) — canal de comunicare
  doar pentru agenți. Refolosim asta pentru coordonare (nu construim un fir nou).
- **Timeline de activitate + broadcast live**: `ActivityBroadcastable`,
  `app/components/stejar/helpdesk/tickets/activity_timeline.rb`, Turbo Streams
  (`turbo_stream_from @ticket, :activity`). Finalizarea unui departament intră aici ca eveniment.

> **Notă istorică:** tabelele `brad_responsibles` (șterse în migrarea
> `20260611120000`) erau un *director de contacte* (name/role/email/phone), **nu** un
> sistem de finalizare. Feature-ul ăsta e genuin nou.

## Abordarea aleasă — A (minimal: toggle „Gata")

Cel mai mic efort, sprijinit pe ce există deja:

- Fiecare card de departament din sidebar primește un buton **„Marchează partea
  noastră ca gata"** (toggle binar — gata / ne-gata, reversibil).
- La bifare: cardul primește un badge verde **„Gata · de [agent] · [timp]"**, iar în
  timeline-ul de activitate apare evenimentul.
- **Cine poate marca:** doar **responsabilul** pe acel departament — dacă sunt agenți
  nominalizați, doar ei; dacă nu, doar dispecerii (vezi regula detaliată mai jos).
- **Marcarea și demarcarea apar în zona de Activitate** (append-only, cu cine + când).
- Butonul de marcare e stilizat ca un **checkbox / call-to-action** clar, nu un link discret.
- **Comunicarea** se face prin **notele interne existente** (opțional cu `@Departament`
  mention) — fără un fir de coordonare separat.
- **Cât timp NU sunt toate gata** (și tichetul e multi-departament), statusurile
  **Resolved** și **Closed** sunt **dezactivate** în selectorul de status, cu o
  explicație (*„blocate până confirmă toate departamentele — X/Y gata"*). Celelalte
  statusuri (Open / In progress / Pending) rămân disponibile.
- Când **toate** departamentele sunt „gata" → Resolved/Closed se **deblochează** și
  apare un **banner verde** sus: *„Toate departamentele au finalizat — treci tichetul
  în Resolved?"* cu buton. **Prompt manual** — agentul confirmă; **fără auto-resolve**.

## Modificări schemă DB (pentru implementarea reală — pas următor)

Pe tabelul de legătură existent, fără tabel nou:

```ruby
# brad_ticket_departments
add_column :brad_ticket_departments, :completed_at,    :datetime
add_column :brad_ticket_departments, :completed_by_id, :bigint   # -> brad_agents
add_index  :brad_ticket_departments, :completed_by_id
```

`TicketDepartment#completed? => completed_at.present?`. Pe `Ticket`:

```ruby
def multi_department?       = ticket_departments.size >= 2
def all_departments_done?   = multi_department? && ticket_departments.all?(&:completed?)
```

- Marcarea = toggle pe rândul `TicketDepartment` (set/clear `completed_at` + `completed_by_id`).
- **Cine poate marca un departament ca „gata" (oglindește regula de notificare):**
  - dacă pe acel departament **există agenți nominalizați** (`brad_ticket_agents` cu
    `department_id`-ul respectiv) → **doar acei agenți** pot marca;
  - dacă **nu** există agenți nominalizați → **doar dispecerii** departamentului
    (`DepartmentAgent role: :dispatcher`) pot marca.

  ```ruby
  def can_complete?(ticket_department, agent)
    noms = ticket_department.ticket.ticket_agents
                            .where(department_id: ticket_department.department_id)
    if noms.exists?
      noms.where(agent_id: agent.id).exists?           # nominalizați → doar ei
    else
      agent.department_agents
           .where(department_id: ticket_department.department_id, role: :dispatcher)
           .exists?                                     # fără nominalizați → doar dispecerii
    end
  end
  ```
- **Activitate:** atât **marcarea** cât și **demarcarea** se înregistrează în zona de
  Activitate (append-only, ca `SlaEvent`/audited) prin `ActivityBroadcastable` —
  *„[Departament] · marcat ca gata de [agent]"* / *„… marcaj anulat de [agent]"* — cu
  cine și când. Nu se șterg evenimente.
- La `all_departments_done?` → banner-ul de prompt (Turbo Stream), nu schimbare automată de status.
- Gating UI: butonul/coloana apar doar dacă `ticket.multi_department?`.
- **Blocare Resolved/Closed:** când `multi_department? && !all_departments_done?`,
  selectorul de status dezactivează opțiunile `resolved`/`closed` (UI) **și** se pune
  un guard în `Helpdesk::Tickets::UpdateService` care respinge tranziția (defensiv —
  nu doar din UI). Re-deschiderea unui departament după resolve readuce statusul la
  `in_progress`.

## Fazare (la implementarea reală)

1. **Schema + model** — coloane pe `brad_ticket_departments`, helpers pe `Ticket`/`TicketDepartment`, gating `multi_department?`.
2. **Toggle + UI** — buton-checkbox în `_assignment_section`, badge „Gata", guard de permisiune (`can_complete?`), controller action (Turbo Stream), eveniment de marcare/demarcare în Activitate.
3. **Banner all-done** — prompt manual de Resolved când toate departamentele sunt gata.

## Ecrane în acest set

| Ecran | |
|---|---|
| **01 · Un singur departament** | referință — un departament → **fără** toggle (regula de gating) |
| **02 · Multi-departamente (interactiv)** | 3 departamente (2 cu agent nominalizat, 1 doar cu dispeceri). Checkbox „gata" pe fiecare card — **doar text + bifă, fără fundal colorat**. Pe departamentele de care utilizatorul **nu e responsabil**, marcajul e **dezactivat** (comutator „Vizualizezi ca" simulează agentul logat — doar pentru prototip). Marcare/demarcare → eveniment în Activitate. **Resolved/Closed sunt blocate** în selectorul de status până confirmă toate. Când **ultimul** departament bifează „gata" → apare **promptul de Resolved** (dialog de confirmare, integrat în acest ecran). **Clickabil.** |

## Out of scope (deocamdată)

- Mini-status multi-stare (În lucru / Blocat) — abordarea B.
- Fir de coordonare dedicat — abordarea C.
- Auto-resolve și configurarea per-cont a comportamentului de prompt.
- Finalizare per-agent (rămâne per-departament).

# Helpdesk Rapoarte — Plan de implementare

## Context

Modulul Helpdesk are deja un Dashboard cu numărători de bază (status counts, unassigned,
my tickets, inbox), dar **nu există o zonă de Rapoarte / analitice**. Acest plan adaugă
pagina **Rapoarte** — insight-uri detaliate despre tichete, SLA și performanța echipei.

> **Decizie de produs (confirmată):** Rapoartele sunt o zonă **exclusiv de Owner**.
> Doar membrii cu `full_access?` (rolurile `owner` / `developer`) văd pagina; agenții nu
> au deloc acces. Designul e construit ca **vedere completă, nescopată**: toate
> departamentele, toți agenții, clasamente SLA/CSAT. Nu există perspectivă de Agent.

---

## Acces & gating

O singură vedere, nescopată. Vizibilitatea e binară: ai `full_access?` → vezi tot; altfel
pagina nici nu apare.

- **Ruta** e protejată: dacă `!current_membership.full_access?` → 404 / redirect la Dashboard.
- **Intrarea de meniu** „Rapoarte" se randează doar dacă `current_membership.full_access?`.
- Conținut: toate cele 3 taburi — **Tichete · SLA · Performanță** — pe toate departamentele
  și toți agenții. Clasamentul SLA pe agent și tabelul de performanță pe agenți sunt vizibile
  integral (sunt vederi de management, iar publicul e doar Owner-ul).

> Agentul / dispatcher-ul **nu** primesc o versiune scopată a acestei pagini. Dacă în viitor
> se decide expunerea unor analitice și către agenți, mecanismul există deja
> (`for_membership` + `helpdesk_accessible_department_ids`) și se poate adăuga atunci — vezi
> *Out of scope*. Acum nu prototipăm și nu construim acea ramură.

---

## Starea curentă în codebase

Modelul de permisiuni necesar pentru gating **există deja** — nu trebuie inventat:

```ruby
# app/models/concerns/stejar/permissionable.rb
FULL_ACCESS_ROLES = %w[owner developer]

def full_access?
  role.in?(FULL_ACCESS_ROLES)
end
```

Asocieri relevante: `Department has_many :agents, through: :department_agents`;
`Agent has_many :departments, through: :department_agents`. Statusuri tichet (enum):
`draft, open, in_progress, pending, resolved, closed`. Există model `Sla` (minimal,
doar `has_many :tickets`) și `Form` (formulare).

**Nu există încă:** controller de rapoarte, query objects de agregare, niciun stats builder
dedicat. Tot ce există e `DashboardController#show` cu `group(:status).count` și presenterul
`Presenters::TicketsList` pentru filtrare/export xlsx.

Autorizare: nu sunt politici Pundit — se folosesc guard-uri de controller
(`requires_permission "helpdesk.view"`) + metodele de pe Membership. Pentru Rapoarte
adăugăm în plus guard-ul de `full_access?`.

---

## Funcționalitate

### Filtre globale
- **Perioadă** — 7 / 30 / 90 zile, 12 luni, personalizat. Implicit 30 zile, comparativ cu
  perioada precedentă.
- **Formular** — toate / per formular (`Helpdesk::Form`).
- **Status** — toate / open / in_progress / pending / resolved / closed.
- **Departament** — listează toate departamentele (Owner-ul le vede pe toate).

### Tab Tichete
KPI: tichete primite, rezolvate, backlog activ, redeschise. Rapoarte: volum în timp (curent
vs precedent), backlog deschise vs închise pe zi, distribuție pe formular (donut), distribuție
pe departament (bare orizontale), heatmap zi×oră (când vin tichetele).

### Tab SLA
KPI: rată rezolvare în SLA, timp mediu primă reacție, timp mediu rezolvare, tichete depășite
SLA. Rapoarte: matrice SLA formular×departament (cod culori), **rată SLA pe agent** (cine
respectă ținta vs. cine e sub țintă — cu bară și marker de țintă), distribuție timp primă
reacție + timp rezolvare (histograme), comparație perioade (tabel).

### Tab Performanță
KPI echipă, bar rezolvate per agent, tabel agenți (deschise/rezolvate/timp/FRT/SLA/CSAT),
tabel departamente. Clasament complet — fără restricții, fiind vedere de Owner.

### Export
CSV + PDF per raport, plus „Export pagină". Reuse `Presenters::TicketsList` (suportă deja
xlsx) pentru sursa de date; PDF prin varianta print existentă (vezi `*-print.html`).

---

## Implementare (faze)

### Faza 1 — Rute + Controller + gating
- Rută `helpdesk/reports` (+ taburi prin `?tab=`).
- `Stejar::Helpdesk::ReportsController#show`, `requires_permission "helpdesk.view"` **plus**
  un guard `full_access?` (altfel `redirect_to helpdesk_dashboard_path` / 404).
- Intrarea de meniu „Rapoarte" condiționată pe `current_membership.full_access?`.

### Faza 2 — Query objects de agregare
- `Reports::TicketVolume`, `Reports::Backlog`, `Reports::FormDistribution`,
  `Reports::DepartmentDistribution`, `Reports::Heatmap`.
- `Reports::SlaMatrix` (formular×departament), `Reports::ResponseTimeBuckets`.
- `Reports::SlaByAgent` (în SLA / depășite / rată per agent, vs. țintă).
- `Reports::AgentPerformance` (clasament + agregat pe departament).

> Toate primesc un relation de tichete ca input (`tickets_scope`). Pentru Owner e relația
> completă a contului; păstrând inputul ca parametru, dacă apare vreodată o versiune scopată
> nu trebuie rescrise query-urile.

### Faza 3 — View + charts + taburi
- Partiale per tab; charts ca SVG inline / CSS (vezi prototipul Owner).
- Comutare taburi cu Turbo Frames (`?tab=`), filtrele rescriu query string.

### Faza 4 — Export
- CSV per raport din query object; PDF din varianta print; „Export pagină" agregat.

---

## Ecran propus

1. **Owner · Rapoarte** — toate 3 taburile, scope complet (toate deptele/agenții).

---

## Out of scope (deocamdată)
- **Versiune de Agent / Dispatcher** a paginii (scopată pe departamente). Modelul de scoping
  există (`for_membership`, `helpdesk_accessible_department_ids`), dar nu o construim acum —
  Rapoartele rămân Owner-only.
- Tab **Calitate / CSAT** dedicat (scos din design — CSAT rămâne doar ca metrică în Performanță).
- Buton „Sumar AI" (scos din design).
- SLA real-time clock / business hours (acoperit de setul **Helpdesk SLA** separat).
- Hartă tichete (rămâne pe Dashboard, nu în Rapoarte).

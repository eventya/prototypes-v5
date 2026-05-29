# Helpdesk Rapoarte — Plan de implementare

## Context

Modulul Helpdesk are deja un Dashboard cu numărători de bază (status counts, unassigned,
my tickets, inbox), dar **nu există o zonă de Rapoarte / analitice**. Acest plan adaugă
pagina **Rapoarte** — insight-uri detaliate despre tichete, SLA și performanța echipei.

Designul de pornire (exportat din Claude Design) a fost gândit implicit ca **vedere de
Owner / manager**: arată toate departamentele, toți agenții, clasament SLA/CSAT. Provocarea
reală — și motivul pentru care planul e scris pe **perspective de utilizator** — este ce
vede fiecare rol în funcție de **permisiuni** și **departamentele la care are acces**.

> **Decizie de produs (confirmată):** prototipăm **2 perspective — Owner și Agent**.
> Sub-rolul `dispatcher` (există deja pe `Helpdesk::Agent`) e tratat ca o variantă a
> Agentului (vede agregat pe departamentele lui) și e descris la final, nu prototipat separat.

---

## Cele două perspective

Întreaga pagină se construiește o singură dată; **diferența dintre roluri e dată de
scoping (ce date intră) și de vizibilitatea taburilor**, nu de pagini separate.

### Owner (sau `developer`)
- `full_access?` → vede **toate** departamentele, toți agenții, toate formularele.
- Toate cele 3 taburi: **Tichete · SLA · Performanță**.
- Tabul **Performanță** = clasament complet pe agenți (deschise, rezolvate, timp mediu,
  primă reacție, SLA%, CSAT) + agregat pe departament.
- Filtrul **Departament** e disponibil (vezi mai jos) și listează toate departamentele.

### Agent (scopat pe departamentele lui)
- Vede date **doar pentru departamentele la care e asignat** (prin `DepartmentAgent`).
- Persona din prototip: **Maria Pop**, asignată la **Salubritate + Drumuri** (2 din 4 depts).
- **Tichete** — KPI-uri, volum, backlog, distribuții și heatmap calculate **doar pe cele 2
  departamente**. Distribuția "pe departament" listează doar Salubritate + Drumuri (nu vede
  Iluminat / Spații verzi / Neasignat). Banner explicativ în capul paginii.
- **SLA** — aceeași matrice formular×departament, dar **doar rândurile departamentelor lui**.
- **Performanță → "Performanța mea"** — tabul de clasament pe colegi e **înlocuit** cu o
  vedere despre munca proprie (KPI-uri personale + trend personal). Fără ranking intern.

### Matrice de vizibilitate

| Element | Owner / developer | Agent | Dispatcher (variantă) |
|---|---|---|---|
| Tab **Tichete** | Toate departamentele | Doar deptele lui | Doar deptele lui |
| Tab **SLA** | Matrice completă | Matrice scopată pe deptele lui | Matrice scopată pe deptele lui |
| SLA **pe agent** (cine respectă ținta) | Toți agenții | **Ascuns** (e clasament) | Agenții din deptele lui |
| Tab **Performanță** | Clasament toți agenții + departamente | **„Performanța mea"** (doar el) | Agenții din deptele lui |
| Filtru **Departament** | Toate | Pre-scopat la deptele lui (ascuns dacă are 1) | Deptele lui |
| Distribuție pe departament | Toate | Doar deptele accesibile | Deptele lui |
| Export pagină / CSV / PDF | Da | Da (pe datele scopate) | Da |

---

## Starea curentă în codebase

Modelul de permisiuni necesar **există deja** — nu trebuie inventat:

```ruby
# app/models/concerns/stejar/permissionable.rb
FULL_ACCESS_ROLES = %w[owner developer]

def helpdesk_accessible_department_ids
  @helpdesk_accessible_department_ids ||=
    if full_access?
      nil                                    # nil = acces nelimitat (Owner/dev)
    else
      agent = Stejar::Helpdesk::Agent.find_by(user_id:, account_id:)
      agent ? agent.department_ids : []      # doar deptele agentului, sau [] dacă nu e agent
    end
end
```

Scopurile de tenant + departament sunt deja definite pe modele:

```ruby
# Ticket / Department / Agent au toate:
scope :for_membership, ->(membership) {
  return none if membership.nil?
  ids = membership.helpdesk_accessible_department_ids
  ids.nil? ? all : where(department_id: ids)   # Ticket; Department -> where(id: ids)
}
```

Asocieri relevante: `Department has_many :agents, through: :department_agents`;
`Agent has_many :departments, through: :department_agents`. Statusuri tichet (enum):
`draft, open, in_progress, pending, resolved, closed`. Există model `Sla` (minimal,
doar `has_many :tickets`) și `Form` (formulare).

**Nu există încă:** controller de rapoarte, query objects de agregare, niciun stats builder
dedicat. Tot ce există e `DashboardController#show` cu `group(:status).count` și presenterul
`Presenters::TicketsList` pentru filtrare/export xlsx.

Autorizare: nu sunt politici Pundit — se folosesc guard-uri de controller
(`requires_permission "helpdesk.view"`) + metodele de pe Membership.

---

## Funcționalitate

### Filtre globale
- **Perioadă** — 7 / 30 / 90 zile, 12 luni, personalizat. Implicit 30 zile, comparativ cu
  perioada precedentă.
- **Formular** — toate / per formular (`Helpdesk::Form`).
- **Status** — toate / open / in_progress / pending / resolved / closed.
- **Departament** *(doar relevant la scoping)* — Owner: toate; Agent: pre-scopat și ascuns
  dacă are un singur departament.

### Tab Tichete
KPI: tichete primite, rezolvate, backlog activ, redeschise. Rapoarte: volum în timp (curent
vs precedent), backlog deschise vs închise pe zi, distribuție pe formular (donut), distribuție
pe departament (bare orizontale), heatmap zi×oră (când vin tichetele).

### Tab SLA
KPI: rată rezolvare în SLA, timp mediu primă reacție, timp mediu rezolvare, tichete depășite
SLA. Rapoarte: matrice SLA formular×departament (cod culori), **rată SLA pe agent** (cine
respectă ținta vs. cine e sub țintă — cu bară și marker de țintă), distribuție timp primă
reacție + timp rezolvare (histograme), comparație perioade (tabel).

> **Rată SLA pe agent** e o vedere de management — apare **doar pentru Owner** (e un clasament
> pe colegi). Pentru Agent rămâne ascunsă; un Dispatcher ar vedea doar agenții din deptele lui.

### Tab Performanță (Owner) / Performanța mea (Agent)
- **Owner:** KPI echipă, bar rezolvate per agent, tabel agenți (deschise/rezolvate/timp/FRT/
  SLA/CSAT), tabel departamente.
- **Agent:** KPI proprii, trendul personal de rezolvări, recordul propriu pe SLA & CSAT.
  Fără tabel de colegi.

### Export
CSV + PDF per raport, plus "Export pagină". Reuse `Presenters::TicketsList` (suportă deja
xlsx) pentru sursa de date; PDF prin varianta print existentă (vezi `*-print.html`).

---

## Implementare (faze)

### Faza 1 — Rute + Controller + scoping
- Rută `helpdesk/reports` (+ taburi prin `?tab=`).
- `Stejar::Helpdesk::ReportsController#show`, `requires_permission "helpdesk.view"`.
- **Tot ce intră în rapoarte trece prin `.for_membership(current_membership)`** — așa Agentul
  primește automat date scopate, fără ramuri speciale.
- Gating tab Performanță: `current_membership.full_access?` → tabul complet; altfel randăm
  parțiala „Performanța mea” legată de `current_account.agents.find_by(user: current_user)`.

### Faza 2 — Query objects de agregare
- `Reports::TicketVolume`, `Reports::Backlog`, `Reports::FormDistribution`,
  `Reports::DepartmentDistribution`, `Reports::Heatmap` — toate primesc un relation deja
  scopat (`tickets_scope`) ca input, deci scopingul rămâne într-un singur loc.
- `Reports::SlaMatrix` (formular×departament), `Reports::ResponseTimeBuckets`.
- `Reports::SlaByAgent` (în SLA / depășite / rată per agent, vs. țintă) — randat **doar dacă
  `full_access?`** (sau, pentru dispatcher, scopat la agenții din deptele lui).
- `Reports::AgentPerformance` (Owner) și `Reports::MyPerformance` (Agent).

### Faza 3 — View + charts + taburi
- Partiale per tab; charts ca SVG inline / CSS (vezi prototipurile).
- Comutare taburi cu Turbo Frames (`?tab=`), filtrele rescriu query string.

### Faza 4 — Export
- CSV per raport din query object; PDF din varianta print; „Export pagină" agregat.

---

## Ecrane propuse

1. **Owner · Rapoarte** — toate 3 taburile, scope complet (toate deptele/agenții).
2. **Agent · Rapoarte** — aceleași taburi, scopate pe Salubritate + Drumuri, cu
   „Performanța mea" în loc de clasament + banner de scoping.

> Cele două ecrane sunt **aceeași pagină** randată pentru două membership-uri diferite —
> diferă doar datele care intră (`for_membership`) și un tab. Asta e exact ce trebuie verificat
> în review: că nu construim două pagini, ci una singură corect scopată.

---

## Out of scope (deocamdată)
- Tab **Calitate / CSAT** dedicat (scos din design — CSAT rămâne doar ca metrică în Performanță).
- Buton „Sumar AI" (scos din design).
- SLA real-time clock / business hours (acoperit de setul **Helpdesk SLA** separat).
- Hartă tichete (rămâne pe Dashboard, nu în Rapoarte).

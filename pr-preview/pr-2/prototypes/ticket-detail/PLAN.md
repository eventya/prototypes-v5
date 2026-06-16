# Pagina de detaliu ticket (Helpdesk) — replică + teren de joacă

## Context

Acesta este punctul de plecare pentru a ne juca cu **pagina de detaliu a unui
tichet** din modulul Helpdesk (vederea agentului). Faza 1 este o **replică
fidelă** a paginii actuale (`Stejar::Helpdesk::TicketsController#show`), redată
static cu design-system-ul real, ca să avem o bază comună peste care iterăm.

Pagina reală e compusă din:

- `app/views/stejar/helpdesk/tickets/show.html.erb` → `_details.html.erb` (layout-ul)
- partiale de conversație: `comments/_composer`, `_comment`, `_agent_comment`,
  `_customer_comment`, `_internal_comment`, `_day_separator`
- sidebar: secțiunile **State** (status / tags / priority), **SLA**
  (`_sla_section` + `Slas::Panel`), **Routing** (formular de transfer
  client-side), **Responsibles**, **Customer**, **History**
  (`ActivityTimeline`)

## Layout (replica)

```
┌─────────────────────────────────────────────┬──────────────────┐
│  Header: ← #HD-1042 · prioritate · via form  │  STATE           │
│  ───────────────────────────────────────────  │   status         │
│  Conversation (scroll)                        │   tags           │
│   ┌ Hero: mesajul original al clientului ┐    │   priority       │
│   │ avatar · nume · email · categorie     │    │  ──────────────  │
│   │ subiect + corp + atașamente           │    │  SLA panel       │
│   └───────────────────────────────────────┘    │   first response │
│   — day separator —                            │   resolution     │
│   răspuns agent                                │  ──────────────  │
│   notă internă (amber)                         │  ROUTING         │
│   răspuns client                               │   dept → agent   │
│  ───────────────────────────────────────────  │  ──────────────  │
│  Composer (collapsed):                         │  RESPONSIBLES    │
│   [ Răspunde clientului ] [ Notă internă ]     │  ──────────────  │
│                                                │  CUSTOMER        │
│                                                │  ──────────────  │
│                                                │  HISTORY         │
└─────────────────────────────────────────────┴──────────────────┘
```

Pe desktop: coloană principală (conversație) + sidebar dreapta de 320–340px.
Pe mobil sidebar-ul devine drawer (omis în prototip — ne concentrăm pe desktop).

## Ce e static / mock în prototip

- Date exemplu (ticket #HD-1042, client Maria Popescu, departament Suport Tehnic).
- Fără Turbo/Stimulus: dropdown-urile (status/priority/tags), `composer`,
  `ticket-routing`, `customer-change`, heartbeat-ul SLA sunt redate în starea
  lor de repaus. Routing-ul (care în realitate e desenat client-side de
  controllerul `ticket-routing`) e mockat ca „departament → agent".
- Icon-urile `icon-*` (font Lucide) sunt înlocuite cu `<svg>` inline (fontul nu
  e inclus în CSS-ul standalone).

## Idei de explorat (faza 2+)

> Aici notăm ce vrem să schimbăm odată ce avem replica. De completat împreună.

- _TBD_

## Referințe în cod (pentru implementarea reală)

- View: `app/views/stejar/helpdesk/tickets/show.html.erb`, `_details.html.erb`
- Helpers: `Stejar::Helpdesk::ApplicationHelper` (`status_badge_classes`,
  `priority_dot_color`, `status_dot_color`, `tag_badge_classes`,
  `ticket_source_badge`, `sla_state_*`)
- Componente: `Helpdesk::Tickets::ActivityTimeline`, `Helpdesk::Slas::Panel`,
  `Helpdesk::Slas::Chip`, `Utilities::UserAvatar`
- Controller: `Stejar::Helpdesk::TicketsController#show`

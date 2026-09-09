# Helpdesk · Listă tickete — regrupare filtru status + lazy-load filtre grele

## Problema

În lista de tickete (`Stejar::Helpdesk::Tickets#index`), dropdown-ul de status din
`_filter_bar.html.erb` listează **plat** toate statusurile publice —
`open, in_progress, pending, resolved, closed` — într-o singură listă, sub item-ul
agregat „Tichete active". Spam-ul e deja desprins printr-un divider la final.

Astfel **Închis** (status terminal, cu sute/mii de tichete arhivate) stă în aceeași
listă cu statusurile de lucru de zi-cu-zi, amestecând „inbox-ul de lucru" cu „arhiva".

În plus, `index` încarcă pe calea critică liste care în majoritatea sesiunilor nici nu
sunt deschise: toate **departamentele** și toți **agenții** (cu `includes(:user)`), iar
filtrul **SLA** ar avea nevoie de contoare per stare (scump de calculat la fiecare load).

## Propunerea

### 1. Regrupare dropdown status (3 secțiuni)

- **Tichete active** — singura secțiune cu **titlu de grup**: agregatul „Toate active"
  (= toate în afară de Închis) + statusurile non-terminale: Deschis, În lucru,
  În așteptare, Rezolvat.
- **Închis** — desprins printr-un divider, **fără titlu de grup** (o singură opțiune).
- **Spam** — desprins printr-un divider, **fără titlu de grup** (o singură opțiune,
  `?spam=true`).

Comportamentul de filtrare nu se schimbă (param-ii URL rămân aceiași) — e doar o
reorganizare vizuală care separă „lucrul curent" de „arhivă" și „spam".

### 2. Lazy-load pentru Departamente / Agenți / SLA (turbo-frame `loading: :lazy`)

Meniul fiecăruia dintre aceste trei dropdown-uri se încarcă **doar la prima deschidere**,
nu la randarea listei.

## Ecran

- **01 · Listă tickete** — lista cu **toate filtrele** din `_filter_bar.html.erb`
  replicate (Departament · Agent · Status · Prioritate · SLA · Mai multe filtre ·
  Resetare). Statusul filtrează tabelul live; Departament/Agent/SLA demonstrează
  lazy-load-ul cu un skeleton la prima deschidere.

## Implementarea reală în Stejar (după aprobare)

### A. Regruparea statusului — `app/views/stejar/helpdesk/tickets/_filter_bar.html.erb`

În loc de un singur loop peste `public_statuses`, randăm 3 secțiuni:

- **Grup „Tichete active"** (cu titlu): header de grup + item agregat existent
  (`helpdesk_tickets_path(params.except(:status, :tag_id))`, count = `active_count`)
  + loop peste **statusurile active** (`Ticket.active_statuses`).
- **Închis** (fără titlu): divider + item explicit pentru `closed`
  (`?status=closed`, count `@status_counts['closed']`).
- **Spam** (fără titlu): divider + item spam existent (`?spam=true`, `@spam_count`).

Titlu de grup (clasa folosită deja în UI):
`text-[10px] font-bold uppercase tracking-wider text-ink-400 px-3`.

Metodă nouă pe `Stejar::Helpdesk::Ticket` (lângă `public_statuses`):

```ruby
def self.active_statuses
  public_statuses - %w[closed]
end
```

…ca să nu rămână `- %w[closed]` inline în view și pentru un singur loc care definește
„statusurile active" (aliniat cu `where.not(status: :closed)` din presenter).

### B. Lazy-load filtre grele — turbo-frame `loading: :lazy`

**Idee:** meniul Departament / Agent / SLA devine un `turbo_frame_tag` cu `loading: :lazy`
și `src` către un endpoint care randează doar partial-ul de opțiuni. Cadrul nu face
request până nu devine vizibil; meniul fiind `hidden` (`display:none`) până la
deschiderea dropdown-ului, **fragmentul se cere abia la prima deschidere**
(IntersectionObserver nu vede un element `display:none`). A doua deschidere e instant
(Turbo păstrează conținutul cadrului).

**Rute** (collection pe tickets), fiecare randând un partial mic:

```ruby
resources :tickets do
  collection do
    get :filter_departments
    get :filter_agents
    get :filter_sla
  end
end
```

**Controller** (`Stejar::Helpdesk::TicketsController`) — acțiuni subțiri care încarcă
datele acolo, nu în `index`:

```ruby
def filter_departments
  @departments = current_account.departments.for_membership(current_membership)
                                .order(inbox: :desc, name: :asc)
  render partial: 'filter_departments', layout: false
end

def filter_agents
  # scoping pe departamentul efectiv din params, ca în filtrul actual
  @agents = current_account.agents.for_membership(current_membership).includes(:user)
  render partial: 'filter_agents', layout: false
end

def filter_sla
  # contoarele per stare SLA calculate DOAR aici (scump), nu la fiecare index
  @sla_counts = Stejar::Helpdesk::Sla::Counts.call(account: current_account, membership: current_membership)
  render partial: 'filter_sla', layout: false
end
```

**View** (`_filter_bar.html.erb`) — în locul listei inline, doar cadrul + un skeleton:

```erb
<%# Departament %>
<div data-controller="dropdown" class="relative shrink-0">
  <button data-action="dropdown#toggle click@window->dropdown#hide" …>…</button>
  <div data-dropdown-target="menu" class="… hidden …">
    <%= turbo_frame_tag "filter_departments",
          src: filter_departments_helpdesk_tickets_path(@tickets.params),
          loading: :lazy do %>
      <%= render 'filter_skeleton' %>   <%# spinner / skeleton până sosește fragmentul %>
    <% end %>
  </div>
</div>
```

Analog pentru `filter_agents` și `filter_sla`. Partial-urile `_filter_departments`,
`_filter_agents`, `_filter_sla` conțin exact markup-ul de opțiuni de azi (link-uri care
păstrează `@tickets.params`), mutat din `_filter_bar.html.erb`.

**`index`** scapă de `@departments` și `@agents` (mutate în endpoint-urile lazy) și de
orice calcul SLA per-stare. Rămâne ce e strict necesar listei + butoanelor:
`@status_counts`, `@spam_count`, plus restul.

> Notă: Stimulus `dropdown` rămâne neschimbat (doar deschide/închide). Turbo-frame se
> ocupă exclusiv de conținut. `src` poartă filtrele active ca link-urile din fragment
> să rămână în context.

### Ce NU se atinge

- Presenter (`presenters/tickets_list.rb`) și logica de filtrare — neschimbate.
- Status counts / spam count rămân în `index` (sunt necesare pentru badge-ul implicit).
- Label-urile RO există deja (`Închis`, `Spam`, `Tichete active`, prioritățile, sursele,
  `helpdesk.sla.filter.*`). Singurul i18n nou: titlul de grup „Tichete active" (există)
  și eventual o cheie pentru placeholder-ul de skeleton.

### Date reale reutilizate (referință)

- Enum status: `open, in_progress, pending, resolved, closed` (+ `draft`, exclus).
- „Active" = `where.not(status: :closed)` (presenter).
- Culori punct status: open `red-500`, in_progress `blue-500`, pending `amber-500`,
  resolved `emerald-500`, closed `ink-400`.
- Filtre reale (ordine): Departament (`?department_id` / `?all=true`), Agent
  (`?agent_id` / `?unassigned`), Status, Prioritate (`?priority`), SLA (`?sla_status`,
  doar dacă `helpdesk_sla_enabled?`), Mai multe filtre (Sursă `?source` + Interval
  `?start_at`/`?end_at`), Resetare. Plus căutarea `?q` din header.

## În afara scopului

Doar gruparea dropdown-ului de status + lazy-load-ul celor 3 filtre grele. Alte
schimbări la listă (coloane, sortare, paginare) sunt separate.

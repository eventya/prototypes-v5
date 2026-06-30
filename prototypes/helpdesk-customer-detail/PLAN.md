# Helpdesk · Reproiectare pagină detaliu Customer — Plan de implementare

## Context

Pagina de detaliu a unui client din Helpdesk (`Stejar::Helpdesk::CustomersController#show`)
a primit recent un box de Blocare/Deblocare cu timeout (PR #831, deja pe `main`). În forma
actuală pagina are trei probleme pe care le rezolvăm aici:

1. **Box-ul de Blocare e greu de citit.** Textele vorbesc despre „email-uri" (nu despre
   tickete), butoanele „Schimbă durata" și „Deblochează" sunt la capetele opuse ale unei
   bare (`justify-between`) cu stiluri diferite, iar *cine a blocat / când / până când
   expiră* sunt înghesuite ca text mic în propoziție.
2. **Cele 4 stat-card-uri** cu countere pe status (Total / Open / Resolved / Closed) ocupă
   spațiu fără valoare reală.
3. **Lista de tickete a clientului** e o variantă simplificată, scrisă inline, cu filtre pe
   status ca niște „chips" în dreapta header-ului — diferită de lista din `Tickets#index`.

Acest set propune designul reproiectat. Mai jos e maparea către codul real Stejar pentru
faza de implementare.

---

## Ecrane

| # | Ecran | Ce arată |
|---|---|---|
| 1 | `01-customer-blocat.html` | Pagina completă, client **blocat** (blocare care expiră): header, box blocare Card A, listă tickete cu dropdown filtru |
| 2 | `02-customer-neblocat.html` | Pagina completă, client **neblocat**: bară subțire + dropdown „Blochează clientul" |
| 3 | `03-stari-si-dropdowns.html` | Componente focusate: box blocare **Permanent** + cele 3 dropdown-uri deschise |

---

## 1 · Box Blocare — Card structurat (A)

**Problema actuală:** layout pe o bară cu `justify-between`, copy despre „email-uri",
butoane disonante (unul `font-medium`, altul `font-semibold` + check verde), metadata
înghesuită.

**Soluția:** un card cu trei zone clare:

- **Header** — iconiță shield + titlu „Client blocat" + sub-text efect, iar în dreapta un
  **pill de status** cu termenul de expirare relativ („Expiră în 5 zile" / „Permanent") —
  ușor de scanat dintr-o privire.
- **Metadata** — un **panel cu trei coloane divizate** (etichetă mică uppercase sus, valoare
  cu glyph jos). Umple lățimea cardului — nu lasă gol în dreapta ca un layout key-value. Pe
  mobil coloanele se stivuiesc (divizor orizontal):
  - `Blocat de` — mini-avatar + nume (`blocked_by.name`)
  - `Blocat la` — `blocked_at` (dată + oră)
  - `Expiră` — `blocked_until` ca dată absolută („5 iul. 2026"), sau „Niciodată" când
    `block_permanent?`. Termenul relativ („în 5 zile") rămâne în pill-ul din header.
- **Bară de acțiuni** (jos, separată) — cele două butoane **grupate și uniforme**, aliniate
  la dreapta, același stil/size: `Schimbă durata` (dropdown durate) + `Deblochează`.

### Copy — email → tichet
În `config/locales/*/helpdesk.yml`, cheile sub `helpdesk.customers.block`:

| Cheie | Acum | Propus |
|---|---|---|
| `until_desc` | „**Emailurile** noi sunt marcate automat ca spam până la %{date}…" | „**Tichetele** noi de la acest client sunt marcate automat ca spam până la %{date}…" |
| `permanent_desc` | „**Emailurile** noi sunt marcate automat ca spam până când deblochezi…" | „**Tichetele** noi de la acest client sunt marcate automat ca spam până când îl deblochezi." |

Chei noi pentru rândurile etichetate: `blocked_by_label` („Blocat de"), `blocked_at_label`
(„La data"), `expires_label` („Expiră"), `expires_never` („Niciodată · blocare permanentă"),
`expires_relative` („%{date} · peste %{count}"). De actualizat/adăugat în **toate** locale-le
care au `customers.block.*` — confirmat `en` și `ro`; de propagat și la `de/es/fr/hu/it`.

### Fișiere
- `app/views/stejar/helpdesk/customers/show.html.erb` — rescrie liniile ~57–135 (ambele stări).
- Datele există deja pe model: `blocked_by`, `blocked_at`, `blocked_until`, `blocked?`,
  `block_permanent?` (`app/models/stejar/helpdesk/customer.rb`). Fără modificări de schemă.
- Controllerul de blocare rămâne neschimbat (`customers/blocks_controller.rb`,
  `POST/DELETE helpdesk_customer_block_path`).

---

## 2 · Scoatere stat-cards

- Șterge blocul stat-cards (`show.html.erb` liniile ~137–159).
- Șterge partialul orfan `app/views/stejar/helpdesk/customers/_stat_card.html.erb`
  (folosit **doar** aici).
- În controller, scoate counterele nefolosite (`@open_count`, `@closed_count`,
  `@resolved_count`). **Păstrează** `@status_counts` (pentru counterele din dropdown) și
  `@total_count` (badge-ul de pe buton).

---

## 3 · Listă tickete — identică cu `Tickets#index`, refolosibilă

**Header card:** în loc de titlul „All Tickets" + chips-uri pe status în dreapta, un singur
**dropdown de filtrare pe status** la stânga (chips-urile din dreapta dispar). Buton cu
label-ul filtrului curent („Toate ticketele" + count, sau status + dot colorat); meniul are
„Toate ticketele" + fiecare status public cu count.

- Refolosește pattern-ul din `app/views/stejar/helpdesk/tickets/_filter_bar.html.erb`
  (secțiunea status, ~liniile 164–206) + helperul `status_dot_color`
  (`app/helpers/stejar/helpdesk/application_helper.rb`).
- Linkuri către `helpdesk_customer_path(@customer, status:)`. Opțional, wrap lista
  într-un `turbo_frame` ca filtrarea să facă update parțial.
- **Diferențe față de index** (intenționate): fără „Spam" în dropdown (lista clientului e
  deja `.not_spam`); default = **toate** ticketele (nu „active-only").

**Rândurile:** refolosesc **exact** partialul existent
`app/views/stejar/helpdesk/tickets/_ticket_row.html.erb`:

```erb
<%= render partial: "stejar/helpdesk/tickets/ticket_row", collection: @tickets, as: :ticket %>
```

plus header-ul de coloane din `tickets/list.html.erb` (ID · Priority · SLA · Client ·
Message · Status · Tags · Agent). Astfel lista arată **identic** cu cea din `Tickets#index`.

Controllerul (`customers_controller.rb#show`) trebuie să eager-load-eze același set ca
presenter-ul, ca să nu apară N+1:

```ruby
@tickets = scope
  .includes(*Stejar::Helpdesk::Presenters::TicketsList::TICKET_INCLUDES)
  .order(updated_at: :desc)
  .page(params[:page]).per(25)
```

> **Notă — coloana „Client".** Pe pagina unui singur client coloana Client e redundantă
> (același client pe fiecare rând), dar o păstrăm pentru a refolosi *exact* același rând.
> Dacă se dorește ascunderea ei, se poate adăuga un local opțional în `_ticket_row`
> (ex. `hide_client: true`) — de discutat la implementare.

---

## Rezumat fișiere Stejar (la implementare)

| Fișier | Modificare |
|---|---|
| `app/views/stejar/helpdesk/customers/show.html.erb` | Box blocare Card A; scoate stat-cards; header dropdown; randează `_ticket_row` |
| `app/controllers/stejar/helpdesk/customers_controller.rb` | Eager-load `TICKET_INCLUDES`; scoate counterele nefolosite; păstrează `@status_counts`/`@total_count` |
| `app/views/stejar/helpdesk/customers/_stat_card.html.erb` | **Șters** (orfan) |
| `config/locales/*/helpdesk.yml` | Copy email→tichet + chei noi pentru metadata, în toate locale-le |
| `app/views/stejar/helpdesk/tickets/_ticket_row.html.erb` | **Refolosit** ca atare (fără modificări) |

Fără migrări DB, fără modele noi, fără rute noi.

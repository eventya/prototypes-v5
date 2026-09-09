# Atribuire pe mai multe departamente & agenți

Zona **ATRIBUIRE** din sidebar-ul unui tichet trece de la **un singur departament + un
singur agent** la **mai multe departamente și mai mulți agenți**. Un incident (ex. „a căzut
un copac pe stradă") poate ține de Poliția Locală **și** Salubrizare în același timp, iar mai
mulți agenți îl pot prelua.

Tichetul păstrează **un singur status** (nu există status per-departament). „Dispeceratul" =
departamentul **Inbox** existent — acolo aterizează tichetele noi și acolo se pot întoarce.

## Ce arată acest set

| Ecran | |
|---|---|
| **01 · Acum (single)** | varianta actuală — un departament + un agent (pentru referință) |
| **02 · Varianta A — Flux pe departamente (carduri)** | fiecare departament e un card; lângă el „Adaugă agent" (agenți **din acel departament**), iar dedesubt „Adaugă alt departament" |
| **03 · Varianta B — Flux compact** | același flux, dar rânduri despărțite de o linie (fără chenare) |

Fluxul: **alegi un departament → opțional adaugi agenți din el → adaugi alt departament**. Agenții
sunt mereu scoși **din departamentul** sub care îi adaugi. Ecranele sunt **clickabile** — panoul
„VOR FI NOTIFICAȚI" se actualizează live.

## Model de date (decis în `stejar` PR #753)

Două **tabele de legătură** (nu coloane array), oglindind `brad_ticket_responsibles`:

- `brad_ticket_departments (ticket_id, department_id, account_id)`
- `brad_ticket_agents (ticket_id, agent_id, **department_id**, account_id)`

**Notă (din acest flux):** pentru că agentul se alege *sub* un departament, `brad_ticket_agents`
primește și `department_id` — adică „agentul X, pe partea departamentului D". E o mică schimbare
față de modelul plat din PR #753 (unde agenții erau o listă separată, fără departament). Filtrarea
rămâne idiomatică prin sub-query (`where(id: TicketDepartment.where(...).select(:ticket_id))`),
exact pattern-ul folosit deja la tag-uri. FK integrity + ActiveRecord curat.

> De ales: când dispecerul rutează către un departament real, tichetul **pleacă** din Inbox
> (se scoate rândul Inbox) sau **stă în ambele**? Default: pleacă.

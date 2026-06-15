# Email-uri Eventya — redesign template + copy uman

## Context

Lucrăm la template-ul de email-uri tranzacționale (PR-uri deschise: stejar#784, eventya#239). Înainte de a finaliza implementarea, acest set de prototip arată **toate** email-urile sistemului cu:

1. **header & footer noi** (vezi mai jos);
2. un **copy nou, cald și omenesc** în română, care înlocuiește tonul rigid „de plastic” de acum;
3. o **hartă** completă a tuturor email-urilor.

> Prototipul e doar pentru review. După aprobare, designul + textele se toarnă în template-urile reale (ERB + traduceri I18n `ro` / `en` / `hu`).

---

## Ce se schimbă în template

### Header
- **Strip gradient** subțire sus (mov brand: `#6c5ce7 → #a29bfe`).
- **Email cu workspace** → în stânga: badge pătrat (logo real al workspace-ului sau inițiale pe culoarea lui) + **numele workspace-ului** + slug. **Fără logo Eventya în header.** În dreapta: eticheta categoriei.
- **Email de platformă** (fără workspace) → în stânga: **logo Eventya** curat, varianta *fără* „Digital Neighbourhood”. În dreapta: eticheta categoriei.

### Footer (curățat — fără bare orizontale multiple)
- Un singur separator sus, conținut centrat, cu ierarhie clară:
  - sus, discret: `Acesta e un mesaj automat — te rugăm să nu răspunzi.` (notă funcțională, în română, omogen cu restul);
  - jos, ca semnătură de brand: `Powered by` + logo Eventya (fără motto) — **link către `http://eventya.net`**;
  - `Ref: COD` ca ultimă șoaptă, foarte discret.
- **Scos:** „Need help? Contact us…”, „© 2026 Eventya.”.

---

## Vocea — cum scriem acum

Trecem de la formal & rigid la **cald, direct, omenesc**:

- Persoana a II-a, propoziții scurte, fără limbaj corporatist.
- Începem cu **ce s-a întâmplat** sau **ce câștigă** cititorul.
- CTA-uri umane: „Deschide ticketul”, „Vezi ce-i nou”, „Hai să dăm drumul”.
- La securitate (coduri OTP) rămânem scurți și clari, dar prietenoși.

| Înainte (rigid) | Acum (uman) |
|---|---|
| „A representative will review your request and respond as soon as possible.” | „Ne uităm peste solicitarea ta și revenim cât de repede putem.” |
| „Your request has been registered with number #123.” | „Gata, ți-am înregistrat cererea — are numărul #123.” |
| „You've been invited to collaborate on the X workspace.” | „Echipa **X** te vrea alături. Intri cu un singur clic.” |
| „The first-response SLA target has been breached on ticket #123.” | „Ticketul #123 a depășit timpul de primă reacție. Hai să-l prindem.” |

---

## Ecrane

| # | Ecran | Ce conține |
|---|---|---|
| 01 | **Harta** | Toate email-urile: declanșator · destinatar · FROM · categorie · context |
| 02 | **Auth** | Cod verificare (workspace + platformă), cod & confirmare ștergere cont, cont existent |
| 03 | **Onboarding** | Welcome client, welcome editor, welcome membru (workspace + platformă) |
| 04 | **Echipă** | Invitație, invitație confirmată, membru nou intrat, schimbare rol/acces |
| 05 | **Comunitate** | Pagină urmărită actualizată, recenzie nouă |
| 06 | **Digest** | Sumar zilnic / săptămânal / lunar de activitate |
| 07 | **Migrare** | Reminder de lansare (checklist), raport de migrare (admin) |
| 08 | **Helpdesk** | 8 email-uri de ticket + 2 de comentarii |
| 09 | **Platformă** | Lifecycle cont, ștergere workspace, alerte conținut, alerte admin |

---

## FROM — regula

- Mereu de la `noreply@eventya.net`.
- **Display name** = numele workspace-ului (email cu workspace) sau `Eventya` (email de platformă).
- **Excepție helpdesk:** dacă workspace-ul are un canal de email *verificat* (domeniu propriu via SendGrid), FROM e adresa lui — ex. `Primăria Cluj <suport@primariacluj.ro>`.

---

## Note

- În prototip, fiecare email e randat cu CSS din `email.css` (clase, ușor de citit). În producție acestea devin **stiluri inline** pe `<table>`, pentru compatibilitate cu clienții de email.
- **Dark mode:** butonul de dark din prototip flipează și email-ul (pentru review). În producție, email-ul urmează `prefers-color-scheme` al clientului.

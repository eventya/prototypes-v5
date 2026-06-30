# Detaliu ticket — redesign UI/UX

Pagina de detaliu ticket din Helpdesk devenise aglomerată: prea multe acțiuni și fluxuri se
întâmplau *inline* în sidebar, antetul amesteca Print cu acțiuni secundare, iar mesajele contextuale
stăteau mereu vizibile și îngroșau coloana. Acest set propune varianta curățată.

Baseline de referință: setul **`ticket-detail`** (replica paginii actuale).

## Ce se schimbă

1. **Antet minimal — un singur meniu „⋮".** Print, Istoric modificări și Marchează ca SPAM se mută
   sub un meniu „trei puncte" lângă numărul tichetului, fiecare ducând către o pagină dedicată (nu
   mai sunt fluxuri inline). Schimbarea politicii de SLA NU stă în acest meniu — se face din sidebar
   (vezi pct. 3).
2. **Mesaj multi-departament contextual.** Când tichetul e pe mai multe departamente, „Rezolvat" și
   „Închis" apar dezactivate *în interiorul* dropdown-ului de status, iar sub ele un rând nou cu
   iconiță explică de ce sunt blocate (ex. „2/3 departamente finalizate"). Nu mai e un text permanent
   sub dropdown.
3. **„Termene & prioritate" → „Politica de răspuns".** Redenumirea secțiunii. Prioritatea și Politica
   SLA apar ca **text** (nu casete tip dropdown): label + valoare (numele politicii / nivelul de
   prioritate) + valorile de rezolvare SLA dedesubt. Fiecare are propriul link **„Schimbă"** în
   sidebar — prioritatea → pagină dedicată cu impact SLA (ecran 6), politica SLA → ecran 3.
4. **Secțiunea Client clarificată.** Numele și emailul sunt linkuri spre profilul clientului;
   iconița de fereastră nouă stă imediat în dreapta numelui; acțiunea **„Atribuie altui client"**
   devine un link discret cu underline (nu buton proeminent), cu iconiță de creionaș.
5. **Butoane CTA consistente pe primary color.** Toate call-to-action-urile din sidebar folosesc
   același sistem (`.btn--primary` / `.btn--outline-primary`), în loc de mix-ul de stiluri ad-hoc de
   azi.
6. **Transferul de ticket — pagină dedicată.** Editarea inline de rutare iese din sidebar; Atribuirea
   afișează rutarea curentă read-only + buton „Transferă ticket" către o pagină întreagă.
7. **Istoricul iese din sidebar.** Se accesează doar din meniul „⋮" → pagină dedicată.
8. **Fonturi mai mari, general.** Scala de tipografie crește cu ~o treaptă (demonstrată scoped în
   prototip peste tokenii Tailwind v4 `--text-*`). Rollout-ul real = același bump în blocul `@theme`
   din design-system-ul Stejar.
9. **Confirmare la schimbarea statusului.** Selectarea unui status nou cere o confirmare („Schimbi
   statusul în «X»?") înainte de aplicare.
10. **Blocare expeditor pe interval.** Pe pagina de SPAM, bifarea „Blochează expeditorul" dezvăluie
    opțiunile de interval: 1 / 7 / 30 zile sau permanent.

## Ecrane

| # | Ecran | Conținut |
|---|-------|----------|
| 1 | **Detaliu ticket (redesign)** | Antet cu meniul „⋮"; sidebar redesignat (Client cu acțiune discretă tip link aliniată la nume; Stare cu mesaj multi-dept în popover **și confirmare la schimbarea statusului**; Politica de răspuns — prioritate + politică SLA ca **text** cu „Schimbă", valori aliniate; Atribuire clarificată: caption + progres „2/3 confirmat" + listă departament · responsabil · stare, cu CTA transfer vizibil sus); fonturi mărite; CTA-uri consistente. |
| 2 | **Istoric modificări** | Timeline complet al evenimentelor tichetului, grupat pe momente. |
| 3 | **Schimbă politica de SLA** | Selector de politici (Standard Business / Premium 24/7 / Intern) cu termenele aferente + preview impact. |
| 4 | **Marchează ca SPAM** | Explicație + confirmare + opțiunea de a bloca expeditorul **pe interval (1 / 7 / 30 zile / permanent)**; și starea de recuperare („Nu e spam"). |
| 5 | **Transferă ticket** | Pagină master-detail: stânga lista de departamente (bife), dreapta membrii departamentului selectat, cu rezumat „Vor fi notificați". Info explicativ sus (ce se întâmplă) și headere omogene deasupra celor două liste. |

Toate paginile secundare (2–6) folosesc **același header de aplicație** ca pagina de detaliu, pentru
consistență vizuală între ecrane.
| 6 | **Schimbă prioritatea** | Pagină dedicată: fiecare prioritate cu termenele SLA rezultate (primul răspuns + rezolvare) pe politica activă, ca să fie clar impactul înainte de schimbare. |

## Implementare reală (follow-up, după aprobare)

În `stejar`: `app/views/stejar/helpdesk/tickets/_details.html.erb`, `_deadlines_section.html.erb`,
`_assignment_section.html.erb`, `_spam_actions.html.erb`; pagini/controllere/rute noi pentru Istoric
și SLA (transferul are deja `new_helpdesk_ticket_transfer_path`); redenumirea cheii i18n
`helpdesk.tickets.show.sidebar.section_deadlines` în `config/locales/{ro,en}/helpdesk.yml`; și bump-ul
tokenilor de `font-size` în blocul `@theme` din `app/assets/stylesheets/stejar/application.css`.

# Trecerea clienților existenți pe pachete și abonamente

> **Status:** storyboard + plan, în review. Versiunea 2, după răspunsurile la cele 40 de întrebări.
> **Se citește peste:** setul [Pachete și drepturi](../entitlements-pachete/) și planul intern al grilei v1.8 (în `stejar/plans`). Regulile de acolo rămân în vigoare, cu excepția celor pe care le schimbă §2.
> **Cod:** `stejar` și `eventya` pe `feature/entitlements` (PR-urile #970 și #331).
> **Prețuri:** repo-ul e public, deci ecranele arată doar structura calculatorului. Cifrele și procentele se citesc din `Stejar::Entitlements::PriceList`.

---

## 1. Pe scurt

Nu există o zi D și nici un preaviz. Pașii sunt:

1. Terminăm dezvoltarea pe branch.
2. Testăm pe staging.
3. Facem deploy în producție. Clienții cu abonament activ trec pe Enterprise, prin migrările existente.
4. Imediat după deploy, echipa Eventya setează de mână fiecare cont după contract, începând cu cei fără abonament activ.
5. Trimitem un Developer Announcement generic.

Din acel moment, regula e aceeași pentru toți: **fără abonament activ, spațiul de lucru e suspendat.**

Trei schimbări de produs intră în acest plan:

1. **Suspendarea la expirare.** Se opresc website-ul, aplicația mobilă (hibridă, deci aceeași pagină HTML de suspendare), API-ul și toate modulele. Proprietarul ajunge pe „Continuă cu abonamentul”.
2. **Pagina de upgrade refăcută după calculatorul de prețuri.** Are pachet, module, plată și ofertă, iar **downgrade-ul se poate face oricând**.
3. **Push-ul trece din Community în Mobile.** Mobile trimite către toți și pe limbă. Push-urile targetate (utilizatori anume, urmăritorii unei pagini) se activează doar cu modulul Community. Clopoțelul apare mereu.

Onboarding-ul self-serve și plata prin Stripe sunt un plan separat (§6).

---

## 2. Deciziile luate

| # | Tema | Decizia |
|---|---|---|
| 1 | Clienții existenți la deploy | Migrările existente trec pe Enterprise conturile cu abonament activ. Restul se setează de mână imediat după deploy. Fără migrare nouă. |
| 2 | Ziua D, preavizul | Nu există. Deploy → setare conturi → Developer Announcement. |
| 3 | Cont creat din admin, fără abonament | Suspendat, ca oricare altul. Admin-ul îi pune abonamentul la creare. |
| 4 | Conturi demo sau neplătitoare | Tratate de mână, după deploy. |
| 5 | Foaia cu clienții și proprietarii | Se completează intern, după deploy, de echipa Eventya. |
| 6 | Proprietar lipsă sau intern | Aceleași reguli ca la toate conturile. Nicio excepție. |
| 7 | Contractele | Blocare la dată. Echipa Eventya mută data de final de mână. |
| 8 | Licența perpetuă | Nu are un tip separat: data de final se pune de mână la expirarea licenței. |
| 9 | Ce rămâne deschis pe suspendat | Contul meu, echipa (doar vizualizare) și cererile trimise. Fără export de date acum. |
| 10 | Adminii platformei | Nu trec de suspendare. Dacă vor să schimbe ceva, o fac din Admin → Subscripție. Nu se intervine în conținutul unui client neplătitor. |
| 11 | Site-ul public | Pagină neutră, „temporar indisponibil”, cu 503. |
| 12 | QR-uri și linkuri scurte | Rămân active. |
| 13 | Helpdesk | Formularele publice se opresc. E-mailurile și mesajele WhatsApp se primesc și se păstrează ascunse până la reactivare. |
| 14 | MCP | Se oprește la suspendare. |
| 15 | Programările | Anunțurile și broadcast-urile programate se anulează. |
| 16 | Păstrarea datelor | Nelimitată, deocamdată. |
| 17 | Aplicația mobilă | Hibridă: afișează aceeași pagină HTML de suspendare ca site-ul. Nu se lucrează nimic nativ. |
| 18 | Downgrade | Oricând, inclusiv de pe butonul „Upgrade”. |
| 19 | Reactivarea | Prin contract, stabilit în afara platformei. Echipa setează abonamentul din Admin. |
| 20 | Membrii care nu sunt proprietari | Văd doar că spațiul e suspendat. Doar proprietarii au de-a face cu abonamentul. |
| 21 | Trial | Un trial expirat ajunge pe același ecran. Un spațiu suspendat **nu mai primește trial**, doar reînnoire. |
| 22 | Helpdesk Pro | Doar ca modul, cum e implementat acum. Pe Helpdesk e singurul modul oferit. |
| 23 | TVA | Toate prețurile de pe pagină includ TVA. Prețul din grilă e prețul final, cu TVA inclus. Fără rânduri de calcul: cifra afișată e cea plătită. |
| 24 | Plata anuală | Comutator Lunar / Anual sus pe pagină, ca pe eventya.net/pricing. Reducerea apare ca procent. |
| 25 | Recomandarea Enterprise | Da, când Mobile cu module trece de prag. |
| 26 | Serviciile (setup, instruire, migrare, domeniu) | Nu intră în aplicație. |
| 27 | Cheile de push | `push.broadcast` pe Mobile, cheie nouă `push.targeting` pe Community. |
| 28 | Broadcast către urmăritori | Doar cu Community. |
| 29 | Audiențele blocate | Se văd, cu buton de upgrade lângă ele. |
| 30 | Clopoțelul | Apare mereu. Community activează doar push-urile targetate. |
| 31 | Push pe zone | Nu se afișează nimic, încă nu există. |
| 32 | Staging, seed-uri, colegi, feedback | Există deja sau se fac de mână. Nu intră în plan. |
| 33 | Developer Announcement | Modulul există. Mesaj generic, nimic de implementat. |
| 34 | Termenii și condițiile, cine e de serviciu după lansare | Pași în storyboard. |
| 35 | Stripe, la plata eșuată | Blocare la finalul perioadei, în planul Stripe. |
| 36 | e-Factura | În afara scopului. |

---

## 3. Ce se construiește

Totul intră pe `feature/entitlements`, în același PR, ca până acum.

### 3.1 Suspendarea

- `Entitlements::Resolver`: un cont fără abonament activ (expirat, trial terminat sau creat din admin fără abonament) primește **un profil gol**, fără `site.core`. Conturile system și template rămân cu tot.
- **Backend:** orice cerere HTML duce la „Continuă cu abonamentul”, cu excepția paginilor Contul meu, Echipa (doar vizualizare), Cererile trimise și a deconectării. Formatele JSON primesc 403 `subscription_inactive`.
- **Site public și aplicația hibridă:** o pagină HTML de suspendare, cu 503, `Retry-After` și `noindex`, pe toate adresele: pagini, `sitemap.xml`, RSS, iCal, embed-uri, formularele Helpdesk publice, asistentul AI. Pagina arată numele și logo-ul clientului și nu pomenește plata.
- **API mobil:** 503 `subscription_inactive`, pe toate rutele, nu doar când lipsește `module.mobile_app`.
- **Excepții:** redirecturile linkurilor scurte și ale QR-urilor, endpoint-ul care confirmă domeniile pentru certificatele TLS și webhook-urile de e-mail și WhatsApp. Mesajele primite se păstrează ascunse până la reactivare.
- **MCP:** `Mcp::Dispatcher` refuză cererile pentru un cont suspendat.
- **Joburi:** anunțurile și broadcast-urile programate se anulează, cu un motiv vizibil. SLA, auditul de accesibilitate și costurile AI sar peste conturile suspendate.
- **Cache:** amprenta din cheia cache-ului public include starea activ/suspendat, ca schimbarea să fie instantanee în ambele sensuri.
- **SUB-002** spune „spațiul de lucru e suspendat” și duce la „Continuă”. Varianta pentru trial spune „perioada de probă s-a încheiat”. Nu se oferă un trial nou.

### 3.2 Pagina de upgrade și „Continuă”

- O singură componentă, pe două ecrane: `/workspace/upgrade` și „Continuă cu abonamentul”. Aceeași componentă servește și „Alege abonamentul” din [onboarding-ul clienților noi](../onboarding-clienti-noi/), pe care un spațiu nou îl deschide din Dashboard, în trial.
- **Pachetele se deschid** (varianta A, decisă pe 28.09; ecranele [2](02-pagina-upgrade.html) și [3](03-continua-abonamentul.html)). Lista celor patru pachete. Cel ales se mărește și conține modulele lui, cu bife, totalul și butonul. Pe pagină mai stau:
  - titlul „Abonament Eventya” și o singură frază: „Toată echipa e inclusă. Plătești doar pachetul și modulele pe care le folosești.”;
  - comutatorul Lunar / Anual, deasupra listei, cu reducerea ca procent din `PriceList`;
  - pachetul curent marcat „Planul tău” (pe „Continuă”: „Pachetul expirat”; după un trial: „Trial-ul tău”);
  - doar modulele eligibile: pe Helpdesk doar Helpdesk Pro, pe Enterprise toate incluse;
  - totalul, cu TVA inclus, pe lună sau pe an (la plata anuală, suma pe an). `PriceList` ține prețurile grilei ca prețuri finale, cu TVA inclus: comentariul „without VAT”, nota „fără TVA” din interfață și `Quote#vat_amount` / `with_vat` se schimbă, pentru că TVA-ul se scoate din preț, nu se adaugă;
  - două note scurte, fără casete: recomandarea de Enterprise când Mobile are cel puțin trei module și avertismentul la coborâre („ce nu intră se ascunde, conținutul rămâne și revine dacă urci din nou”);
  - „Trimite cererea”, dezactivat cât nu se schimbă nimic (pachetul, un modul sau intervalul), cu fraza „Alege alt pachet, un modul sau alt interval”. Fără câmp de mesaj (decis pe 28.09).
- **Downgrade oricând.** Dispare regula că pachetul doar urcă (`UpgradeRequest`, validarea din `upgrade_request.rb:64-68`). Butonul „Upgrade” rămâne ascuns pe Enterprise, dar pagina se deschide din meniul avatarului („Abonament”).
- **Plata:** `billing_interval` (`monthly` / `annual`) pe `UpgradeRequest` și pe `Subscription`, ales din comutator.
- **„Continuă”** are pachetul expirat preselectat. Butonul spune „Cere reînnoirea” (după un trial: „Cere abonamentul”) și deschide un tichet. Sursa tichetului rămâne `web`; originea (`renew`) intră în corpul tichetului.
- **Membrii care nu sunt proprietari** văd doar mesajul de suspendare, fără alegerea abonamentului.

### 3.3 Push în Mobile

- **Catalog:** `push.broadcast` trece de pe Community pe Mobile. Cheia nouă `push.targeting` e acordată de Community.
- **Registrul `Community::Audiences`:** fiecare audiență declară cheia cerută. `all` și `locale` cer `push.broadcast`, iar `specific_users` cere `push.targeting`. Selectorul arată audiențele blocate cu buton de upgrade.
- **`PageBroadcast`** (urmăritorii unei pagini) cere `push.targeting`.
- **Compozitorul** trece din Comunitate sub „Aplicație”, iar ruta veche redirecționează. Linkul din `mobile_app/settings/_announcements_section` se repară.
- **Clopoțelul** din aplicație (`BroadcastAnnouncementJob`) nu depinde de Community.
- **Fără push pe zone:** `push.zones` nu apare nicăieri în interfață.

---

## 4. Pașii

Storyboard-ul ([ecranul 1](01-storyboard.html)) îi desenează în ordine, cu legăturile dintre ei.

| # | Etapa | Pas | Gata când |
|---|---|---|---|
| 1 | Dezvoltare | Implementarea din §3 | specurile țintite sunt verzi, iar suita completă e rulată o dată înainte de push |
| 2 | Staging | Deploy pe staging (există) | branch-ul rulează |
| 3 | Staging | Seed-urile existente + colegii adăugați de mână | toată lumea intră în profile |
| 4 | Staging | Testare manuală ([ecranul 6](06-checklist-staging.html)), inclusiv pe telefon, în aplicație | matricea e verde |
| 5 | Staging | Procesarea feedback-ului (verbal și scris). Ce blochează se întoarce la pasul 1. | nimic blocant |
| 6 | Producție | Backup → merge `stejar#970` → bump în `eventya#331` → deploy | deploy reușit; lista conturilor fără abonament activ scoasă din Admin → Conturi |
| 7 | Producție | Imediat după deploy: conturile setate de mână după contracte, întâi cele fără abonament activ. Conturile demo sau neplătitoare, tratate de mână. | fiecare client are pachetul și data de final din contract |
| 8 | Producție | Termenii și condițiile actualizați | publicați înainte de anunț |
| 9 | Producție | Developer Announcement, generic ([ecranul 7](07-anunt-clienti.html)) | trimis |
| 10 | După lansare | Cineva de serviciu în primele zile, plus AppSignal | o săptămână fără surprize |
| 11 | Mai departe | Onboarding self-serve + Stripe | plan separat |

---

## 5. Riscuri rămase

1. **Conturile fără abonament activ sunt suspendate de la deploy până le setează echipa.** `20260916120100_backfill_stejar_subscription_packages` trece pe Complet, apoi pe Enterprise, doar conturile cu un abonament **activ azi**. Restul se setează de mână imediat după deploy (pasul 7), începând cu ele.
2. **Hotwire Native și codul 503.** Aplicația tratează un răspuns non-2xx ca vizită eșuată și poate afișa ecranul ei de eroare, nu pagina HTML de suspendare. De verificat pe telefon la pasul 4. Dacă se întâmplă asta, pentru user-agent-ul aplicației pagina se servește cu 200.
3. **Abonamentele fără dată de final nu expiră niciodată.** La pasul 7, fiecare cont primește data din contract. Lista din Admin ar trebui să arate abonamentele fără final, ca niciunul să nu fie uitat.
4. **Un cont creat din admin pornește suspendat** (decizia 3). Cine creează un workspace pentru un client îi pune abonamentul pe loc.
5. **Cache-ul și certificatele.** Fără amprenta din §3.1, site-ul rămâne online până la o zi după expirare. Fără excepția pentru TLS, certificatul domeniului propriu expiră cât timp contul e suspendat.

---

## 6. Mai departe, în alt plan: onboarding + Stripe

- Activarea automată după plată, prin webhook-urile Stripe, cu `ends_at` ca sursă de adevăr.
- Blocarea la finalul perioadei plătite (decizia 35).
- Trial pentru orice spațiu nou, cu toate funcționalitățile. Un spațiu suspendat reînnoiește, nu primește alt trial.
- Aceeași componentă de calculator, cu butonul „Plătește” în loc de „Trimite cererea”.

---

## 7. Ecranele

1. [Storyboard](01-storyboard.html): pașii, stările abonamentului și decizia de acces.
2. [Pagina de upgrade](02-pagina-upgrade.html): pachetele se deschid, cu downgrade oricând.
3. [Continuă cu abonamentul](03-continua-abonamentul.html): proprietar, membru, trial expirat.
4. [Site-ul și aplicația, suspendate](04-site-si-aplicatie-suspendate.html).
5. [Push în Mobile](05-push-in-aplicatie.html).
6. [Checklist pentru testarea pe staging](06-checklist-staging.html).
7. [Developer Announcement](07-anunt-clienti.html).

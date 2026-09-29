# Onboarding pentru clienții noi: de pe site până la spațiul de lucru, cu Stripe sau contract

> **Status:** v2, după feedback-ul din 28.09 (contul cu câte un câmp pe pas, asistentul în doi pași, trial pentru orice spațiu nou, abonamentul ales din spațiu, contractele și facturarea în afara platformei). Storyboard + plan + 19 ecrane, **în review**. Acolo unde nu există încă o decizie, ecranele arată varianta recomandată, iar §17 strânge întrebările, fiecare cu o recomandare.
> **Se citește peste:** [Tranziția pe abonamente](../tranzitie-abonamente/): suspendarea, pagina de upgrade, „Continuă cu abonamentul”, `billing_interval`. Tranziția trebuie să fie în producție **înainte** de acest plan. Regulile ei rămân în vigoare, cu excepțiile din §2.
> **Cod:** `eventya` pentru site, cont și asistent, `stejar` pentru abonament, Stripe, facturare și admin. Branch-uri noi, pornite din `main` după ce `feature/entitlements` ajunge în producție.
> **Prețuri:** repo-ul e public, deci ecranele arată doar structura calculatorului. Cifrele se citesc din `Stejar::Entitlements::PriceList`.

---

## 1. Pe scurt

Un client nou ajunge de pe site la un spațiu de lucru funcțional, într-un singur parcurs:

1. **Site.** Pornește din „Începe gratuit”, dintr-un pachet ales pe pagina de prețuri sau dintr-o soluție (Muzee, Teatre, Orașe…).
2. **Cont.** Câte un câmp pe pas: numele, apoi e-mailul, apoi codul primit pe e-mail. Cine e deja autentificat sare pasul.
3. **Spațiul de lucru**, în doi pași: *Proiect* (doar numele) → *Template*. Adresa se face din nume, iar limba vine de pe site.
4. **Trial-ul pornește singur.** Orice spațiu nou primește 30 de zile gratuit, **cu toate funcționalitățile deblocate**. Nu e o alegere.
5. **Aterizarea în Dashboard**, modulul nou, vizibil mereu, cu câteva cifre și lista modulelor (§4.7). Spațiul e pregătit din template, iar aici îl așteaptă **ghidul de început**: o listă de pași care se bifează singuri pe măsură ce clientul lucrează (§4.6). Site-ul rămâne privat până la ultimul pas, „Publică site-ul”.
6. **Abonamentul se alege din spațiu**, din Dashboard: **plată cu cardul prin Stripe** sau **cerere de ofertă**. Contractul și facturarea se fac în afara platformei.

**Stripe, cap-coadă:**
- Plata se face pe Checkout găzduit de Stripe.
- Webhook-urile scriu în `Stejar::Subscription`, iar `ends_at` rămâne sursa de adevăr pentru drepturi.
- Datele de facturare (denumirea, CUI-ul, adresa) se cer în Checkout.
- Customer Portal acoperă cardul, chitanțele și datele de facturare. Anularea se face din pagina Abonament.
- Plățile eșuate au reîncercări și notificări.
- Factura fiscală o emite echipa, în afara platformei. La fiecare plată, adminii primesc PAY-006 (§8).
- Un job zilnic de reconciliere prinde webhook-urile pierdute.

**Template-urile:** șapte, pe tipologii. **Blank dispare cu totul.**

**Dashboard și ghidul de început:** o filă nouă, Dashboard, prima din bara de sus, cu statistici din module și scurtături. În ea stă ghidul de început: o listă de pași, nu un slideshow. Pașii diferă după template și după pachet și se bifează din date reale.

**Reparațiile:** cele 17 defecte găsite în codul de azi intră în plan (§13), ca feature separat (F1) care ajunge primul în producție, fiindcă o parte din ele îi afectează deja pe utilizatori.

---

## 2. Regulile care se schimbă față de planurile anterioare

| Regula de azi | Ce devine | De ce |
|---|---|---|
| R5 · „Upgrade-ul e o cerere, nu self-service” | Rămâne pentru contracte. Un client pe card își schimbă singur pachetul, iar schimbarea se aplică prin Stripe. | plata automată |
| R7 · „Abonamentele se setează de mână în Admin” | Abonamentele Stripe se scriu **doar** din webhook-uri. În Admin se văd, dar nu se editează. | fără desincronizări |
| Tranziție, decizia 18 · „downgrade oricând” | Pe card, downgrade-ul se cere oricând, dar intră în vigoare **la finalul perioadei plătite**. Upgrade-ul e imediat, cu diferența proporțională. | practica standard, fără rambursări parțiale |
| Tranziție, decizia 35 · „blocare la finalul perioadei” | Plata eșuată la reînnoire primește **7 zile de grație**, cât reîncearcă Stripe. Apoi spațiul se suspendă (întrebarea C3). | un card expirat nu trebuie să oprească un site public în aceeași zi |
| ICP-ul intern · „operatorii privați sunt în afara țintei” | Intră prin două template-uri pentru privați (Agora, Vitrina). | cererea din acest plan (întrebarea A1) |
| Tranziție, decizia 21 · trial doar la înregistrarea self-serve | Rămâne, și devine regula: **orice spațiu nou din asistent** primește trial, fără verificări de eligibilitate. Un spațiu suspendat tot nu primește un trial nou. | decizia din 28.09 |
| Grila v1.8 · „trial 30 de zile pe pachetul Web, fără domeniu propriu” (`TRIAL_PACKAGE = "web"`, `TRIAL_EXCLUDED_KEYS`) | Trial-ul **deblochează tot**: profilul Enterprise, cu toate modulele și cu domeniul propriu. | decizia din 28.09: clientul încearcă tot, apoi alege |
| 17.09 · „Fără pagină de detaliu a abonamentului; totul pe /workspace/upgrade” | Revine o pagină **Abonament** (`/workspace/subscription`, §4.8): planul, plata, facturile, datele de facturare, anularea. `/workspace/upgrade` rămâne doar pentru schimbarea pachetului. | clientul pe card trebuie să-și poată anula singur abonamentul și să-și găsească facturile |
| 17.09 · meniul avatarului conține Echipa, Setări, Abonament, Rapoarte AI | Meniul avatarului rămâne personal (Contul meu, Tichetele mele, Spațiile mele, Deconectare). Cele patru trec în Dashboard, în coloana „Spațiul de lucru” (§4.7). | meniul avatarului e al persoanei, nu al organizației |
| SUB-001 („expiră în 7 zile / 1 zi”) pentru orice abonament | Nu se mai trimite abonamentelor Stripe care se reînnoiesc singure. La plata anuală, ele primesc „se reînnoiește pe…”. | altfel, fiecare client pe card ar primi lunar „abonamentul expiră” |

---

## 3. Ce există azi

| Zona | Azi | Ce schimbăm |
|---|---|---|
| Site de marketing | Doar în engleză, textele scrise direct în ERB, fără i18n. Meniul: Destinations, Pricing, About, Help, Jobs. Butonul principal: „Create your destination”. | RO + EN, meniul Soluții, antetul după stare (§11) |
| Pagina de prețuri | Statică, în EUR, cu pachetele *Starter / Destination / Regional*, „free forever”, „2 months free”. Comutatorul lunar/anual nu ajunge în niciun link. | Calculatorul din Tranziție, cu prețurile din `PriceList` (§6) |
| Texte legale | Termenii (§4) vorbesc de Stripe, EUR și o reîncercare după 14 zile. Pagina de ajutor promite „30 de zile banii înapoi” și anularea din setări, care nu există. | Rescrise (§11, §12) |
| Cookie-uri | `cookie_consent_controller.js` există, dar nicio pagină nu-l folosește. GA4 nu e randat. Politica descrie un banner, GA4 și Meta Pixel. | Banner real, GA4 doar după acceptare |
| Autentificare | Cod de 6 cifre pe e-mail (OTP), fără parole și fără Google. `Stejar::User` se creează abia la finalul `/setup`. | Rămâne OTP, plus reparațiile din §13 |
| Crearea spațiului | `/setup` în 2 pași: nume + adresă, apoi starter cu previzualizare. Trial Web de 30 de zile în aceeași tranzacție, apoi `SeedWorkspaceJob`. La final, redirect pe **site-ul public**. | 2 pași: numele proiectului, apoi template-ul, fără previzualizare. Trial-ul deblochează tot. Aterizare în Dashboard (§4.3, §4.4, §4.7) |
| Template-uri (în cod, `starter`) | Spații marcate `starter`, construite de mână în producție. O singură temă (`city`). „Blank” e un card fals adăugat de `SetupData`. | 7 template-uri, fără Blank (§5) |
| Plată și facturare | Nimic. Doar valoarea `stripe` în enum-ul `billing_type`. | Stripe (§7). Facturarea fiscală rămâne în afara platformei (§8) |
| Protecție | Fără CAPTCHA. rack-attack pe `MemoryStore`, deci limitele se socotesc per proces, nu pe server. | Turnstile, store comun |

---

## 4. Parcursul

Harta din [ecranul 2](02-harta-parcursului.html) desenează tot ce urmează.

### 4.1 Intrările

| # | Intrarea | Unde duce | Ce se păstrează |
|---|---|---|---|
| A | Acasă → „Începe gratuit” | `/signup` | — |
| B | Prețuri → „Începe gratuit” | `/signup` | pachetul, modulele, intervalul |
| B2 | Prețuri → „Cere ofertă” | formularul de vânzări existent (§11) | selecția, în corpul cererii |
| C | Soluții → „Începe cu Atrium” | `/signup` | template-ul și pachetul lui recomandat |
| D | Antet → „Autentificare” | `/signin` | întoarcerea la pagina de unde a plecat |
| E | Logat, meniul avatarului de pe site → „Spațiu de lucru nou” | `/setup` | — |
| F | Logat, în Stejar, lista de spații din meniul avatarului → „Spațiu de lucru nou” (există deja) | `/setup` | — |
| G | Link de invitație | nu trece prin onboarding: intră direct în spațiul în care a fost invitat | — |

**Intenția** (template-ul, pachetul, modulele, intervalul, `utm_*` și pagina de pornire) se ține în sesiune, în `onboarding_intent`, până la finalul asistentului. Apoi se salvează pe spațiu, în `settings['onboarding']`, pentru rapoarte. Pachetul, modulele și intervalul se preselectează pe „Alege abonamentul” (§4.4, ecranul 9).

### 4.2 Autentificat sau nu

| Situația | Ce vede |
|---|---|
| Anonim, e-mail nou, pe „Creează cont” | Câte un câmp pe pas: numele → e-mailul, cu textul de acceptare a Termenilor sub buton → codul → asistentul. |
| Anonim, e-mail care are deja cont, pe „Creează cont” | Primește un cod de autentificare, cu mesajul neutru „Ți-am trimis un cod”. După cod intră în spațiile lui. Dacă a venit cu o intenție (B sau C), merge direct în asistent, pentru un spațiu nou. **Repară R2**: azi nu primește niciun cod. |
| Anonim, pe „Autentificare”, cu un e-mail necunoscut | Ecranul e același („Ți-am trimis un cod”), ca să nu dezvăluie ce adrese au cont. Pe e-mail primește însă „Nu există un cont cu această adresă”, cu un buton spre crearea contului. **Repară R3**: azi nu primește nimic și rămâne blocat pe ecranul de cod. |
| Autentificat, fără spații de echipă | Butoanele de pe site duc direct la pasul 1 din asistent, fără câmpul de nume. `/signup` și `/signin` îl trimit la `/setup` (**R4**). |
| Autentificat, cu cel puțin un spațiu | În antet apare avatarul cu „Spațiile mele”, nu „Autentificare”. „Începe gratuit”, prețurile și soluțiile duc în asistent, pentru un spațiu nou. |
| Autentificat, doar ca membru al unui site public (rolul `member`, nu de echipă) | E tratat ca fără spații de echipă. **Repară R6**: azi e trimis într-un CMS la care nu are acces. |
| Autentificat, cu un spațiu suspendat sau cu un trial folosit | Asistentul merge la fel: spațiul nou primește trial (§4.4). |
| Admin Eventya (`@eventya.net`) | Asistentul e același. Spațiile pentru clienții pe contract se creează din Admin, cu abonamentul pus pe loc (Tranziție, decizia 3). Un admin fără spații ajunge după cod în `/stejar-admin` (**R5**). |
| Sesiunea expiră în asistent | După autentificare revine la pasul la care era, cu intenția păstrată. |

### 4.3 Asistentul

| Pas | Ce cere | Note |
|---|---|---|
| 1 · Proiect | doar numele proiectului | **Adresa** nu se cere: se face din nume (`muzeul-demo`). Dacă e ocupată sau rezervată, se ia următoarea liberă (`muzeul-demo-2`). Se schimbă din Setări. **Limba** nu se cere: vine din cookie-ul de limbă al site-ului public (RO sau EN), altfel RO. Restul limbilor se adaugă din Setări. |
| 2 · Template | unul dintre cele 7, într-o grilă mare, pe trei grupe | Preselectat din intenție. Sărit pentru pachetul Helpdesk. **Fără previzualizare.** Sub „Creează spațiul” stă fraza de acceptare a DPA. |

**Aceeași machetă pentru ambii pași:** sus logo-ul și pașii (Proiect · Template), apoi o coloană centrată, cu titlul, conținutul și „Înapoi / Continuă” jos. Panoul din dreapta de azi dispare.

Asistentul trimite totul **o singură dată, la final**, ca azi: spațiul, trial-ul, apoi pregătirea și Dashboard-ul. Abonamentul nu se alege aici (§4.4).

### 4.4 Trial și alegerea abonamentului

- **Orice spațiu nou din asistent primește trial**: 30 de zile, fără card, **cu toate funcționalitățile deblocate** (profilul Enterprise, inclusiv domeniul propriu). Nu e o opțiune de ales și nu are reguli de eligibilitate. Spațiile create din Admin rămân ca în Tranziție: suspendate până le pune echipa abonamentul.
- **Abonamentul se alege din spațiu**, pe „Alege abonamentul” ([ecranul 9](09-alege-abonamentul.html)). Se ajunge acolo din:
  - eticheta „Trial · N zile” din bară;
  - rândul de stare din Dashboard;
  - rândul „Abonament” din Dashboard;
  - SUB-001.

  Selecția de pe site (§4.1) e preselectată. De acolo:
  - **„Plătește cu cardul”**: Stripe Checkout (§7), cu datele de facturare cerute pe pagina Stripe;
  - **„Cere ofertă”**: un tichet la echipă (§10). Contractul se face în afara platformei, iar clientul lucrează pe trial până atunci.
- **Plata în timpul trial-ului:** pachetul ales pornește imediat, facturarea începe azi, iar trial-ul se încheie (întrebarea B3).
- **Contract în lucru:** echipa prelungește trial-ul din Admin, cu butonul „+30 de zile” (întrebarea B5).
- **Eticheta „Trial · N zile”** din bară o văd doar proprietarii și dezvoltatorii, ca butonul Upgrade pe care îl înlocuiește.
- **După trial, pachetul ales decide ce rămâne.** Ce nu intră în el se ascunde (regula existentă: se ascunde, nu se blochează), iar conținutul rămâne și revine la un upgrade. „Alege abonamentul” spune asta sub total, pentru orice pachet în afară de Enterprise.
- **Bara din trial** arată toate filele (Site web, Aplicație, Helpdesk, Community, Media). Pașii ghidului de început care depind de pachet (§4.6) urmează însă pachetul recomandat de template sau cel ales pe site, nu întregul trial.
- **Domeniul propriu** se poate lega din trial. La finalul trial-ului, fără abonament, domeniul arată pagina de suspendare din Tranziție.
- **Un spațiu suspendat** nu primește un trial nou, doar reînnoire (Tranziție, decizia 21).

### 4.5 Scenariile de margine

| Scenariul | Ce se întâmplă |
|---|---|
| Adresa generată e luată între timp | La trimitere se alege următoarea adresă liberă. Clientul nu vede nicio eroare. |
| Dublu click sau „înapoi” după Checkout | Aceeași Checkout Session e refolosită. Există o singură sesiune deschisă per spațiu. |
| Checkout abandonat sau anulat | Spațiul rămâne pe trial, cu selecția păstrată. Dacă trial-ul s-a încheiat, rămâne suspendat, pe „Continuă cu abonamentul”. |
| Card refuzat sau 3-D Secure eșuat | Clientul rămâne în Checkout, unde îl tratează Stripe. La noi nu se schimbă nimic. |
| Webhook-ul întârzie | Ecranul „Confirmăm plata…” citește Checkout Session direct din API la întoarcere, nu așteaptă doar webhook-ul. |
| Utilizatorul închide fereastra în asistent | Nu se creează nimic. La revenire, intenția e încă în sesiune. |
| Formularul spre Checkout | Are `data-turbo="false"` și un redirect 303. Turbo nu urmează redirect-uri pe alt domeniu. |

### 4.6 Ghidul de început

**Recomandarea:** o listă de pași (todo), nu un slideshow. Un slideshow e pasiv: se sare, nu se mai poate relua și nu știe ce a făcut deja clientul. O listă de pași e activă: fiecare pas duce exact unde trebuie lucrat, se bifează singur din date, se poate relua oricând și măsoară activarea. **Fără popup de bun venit:** clientul aterizează direct pe Dashboard, unde lista e primul lucru pe care îl vede. Modelul e ghidul de configurare de pe pagina principală din Shopify. [Ecranul 17](17-ghid-de-inceput.html) îl desenează.

**Cele două piese:**

1. **Lista de pași**, sus în Dashboard (§4.7), cu progresul („3 din 7”). Fiecare pas are un titlu, o frază, un buton spre locul exact și, unde se poate, „Cu asistentul AI”. Un singur pas e deschis odată. Pașii se bifează **singuri, din date**, iar clientul poate apăsa „Sari peste”. Lista dispare când e gata și se redeschide din Dashboard, din rândul „Ghidul de început · 3/7” din coloana „Spațiul de lucru” (§4.7).
2. **Indiciul la pas.** Când clientul ajunge dintr-un pas (`?guide=logo`), o bulă mică arată elementul de lucru (de exemplu câmpul de logo) o singură dată, cu „Am înțeles”. Nu există tur cu zece bule la rând.

**Pașii comuni** (șapte; pachetul și modulele mai adaugă cel mult trei):

| # | Pasul | Unde duce | Bifat când |
|---|---|---|---|
| 1 | Pune logo-ul și culorile | Spațiu de lucru → Branding | există un logo (`logo_attached?`) |
| 2 | Completează datele legale și de contact | Setări → Date legale | `legal_data` are cel puțin clientul și adresa. Paginile legale create la onboarding le folosesc. |
| 3 | Personalizează pagina de acasă | CMS → pagina Acasă, sau asistentul AI | pagina a fost salvată de un om după creare |
| 4 | Adaugă primul conținut al tău | depinde de template (tabelul de mai jos) | primul element creat de client, nu din template |
| 5 | Invită echipa | Echipa → Invitații | cel puțin o invitație trimisă |
| 6 | Conectează domeniul propriu | Spațiu de lucru → Domenii | un domeniu verificat |
| 7 | Publică site-ul | un ecran de verificare, apoi comutatorul | `visibility` devine `public` |

**Pașii care depind de template și de pachet.** Template-ul dă textul pasului 4. Pachetul și modulele adaugă pași după el. În trial contează pachetul recomandat de template sau cel ales pe site (§4.4):

| Template sau pachet | Pasul |
|---|---|
| Atrium | Adaugă programul de vizitare și prima expoziție |
| Scena | Adaugă primul spectacol din stagiune |
| Forum | Verifică formularul de sesizări și adaugă primul anunț |
| Panorama | Adaugă primele atracții pe hartă |
| Vatra | Adaugă cazările și producătorii locali |
| Agora | Adaugă primul eveniment al comunității |
| Vitrina | Adaugă serviciile și ofertele |
| pachetul Mobile | Configurează aplicația mobilă |
| modulul Helpdesk Pro | Conectează e-mailul și WhatsApp |
| modulul AI pentru vizitatori | Pornește asistentul pe site (CMS → Setări → Asistent AI) |

**Site-ul pornește privat** (întrebarea B10). Azi, un spațiu nou e public din prima secundă, cu conținutul demo al template-ului. Propunerea: un spațiu self-serve pornește cu `visibility: private`, pe care `AccountVisibilityEnforceable` îl aplică deja (site-ul se vede doar de membrii echipei, autentificați). Pasul 7 deschide un ecran de verificare (logo, date legale, pagina de acasă, încă o dată cu linkurile) și apoi face site-ul public. Clientul poate publica și fără să fi terminat restul pașilor: verificarea doar avertizează, nu blochează.

**Tehnic** (clase noi):

- `Onboarding::Guide`: registrul pașilor. Fiecare pas declară `key`, `applicable?(account)` (după template și după drepturi), `done?(account)` și `path`.
- Starea stă în `settings['guide']` pe cont: pașii săriți și `completed_at`.
- `Stejar::Guide::ChecklistComponent` pentru listă (randată în Dashboard) și controllerul Stimulus `guide-hint` pentru indiciul la pas.
- **Cine vede ghidul:** proprietarii și dezvoltatorii (`full_access?`). Editorii nu văd pașii de proprietar (întrebarea B11).
- **Măsurare:** pașii făcuți în primele 7 zile intră în pâlnia din Admin → Onboarding. Metrica de activare: „site publicat în 7 zile”.
- **Reamintire:** un singur e-mail în ziua 3, doar în trial și doar dacă au rămas pași (GUIDE-001, întrebarea B9).

### 4.7 Dashboard: modulul nou, pagina de pornire a spațiului

**Ce e.** O filă nouă, **Dashboard**, prima din bara de sus, înaintea modulelor. E vizibilă mereu, în orice pachet și pentru orice rol de echipă. Devine pagina de pornire a spațiului:

- `/:account/stejar` duce aici;
- logo-ul spațiului din bara de sus duce aici;
- după autentificare, un utilizator cu un singur spațiu ajunge aici, nu în CMS;
- onboarding-ul aterizează aici (R7);
- porțile de funcționalitate care azi trimit „la dashboard, cu o alertă” trimit aici.

Azi nu există un dashboard al spațiului: `ApplicationController#dashboard` redirecționează la primul modul accesibil, iar fiecare modul are dashboard-ul lui (CMS, Helpdesk, Community, Media). Acelea rămân pagina de start a filei lor. Dashboard-ul le adună deasupra. [Ecranul 18](18-dashboard.html) îl desenează.

**Ce conține, de sus în jos.** Puțin, cu mult spațiu alb ([ecranul 18](18-dashboard.html)):

1. **Salutul**, cu starea spațiului pe un singur rând: domeniul și abonamentul („muzeuldemo.ro · Enterprise, până pe 31.12.2026”), ambele linkuri. În dreapta, un singur buton, **„+ Creează”**, cu un meniu: Pagină, Eveniment, Anunț push, Invită un coleg. E filtrat pe drepturi și pe rol.
2. **Ghidul de început** (§4.6), în prima zi și până e terminat ([ecranul 17](17-ghid-de-inceput.html)).
3. **Patru cifre**, pe ultimele 30 de zile, fără carduri, fiecare cu comparația față de luna trecută. Clic pe cifră duce la analytics-ul modulului.
4. **Două coloane, aceeași formă de listă:**
   - **Module:** numele modulului și un singur lucru de urmărit („3 tichete nealocate”). Rândurile care cer o acțiune au un punct discret. Rândul duce în modul.
   - **Spațiul de lucru** (doar proprietari și dezvoltatori), mutat din meniul avatarului: **Echipa** („5 membri · 1 invitație în așteptare”), **Setări** (limbile, domeniul), **Abonament** (planul și data; în trial duce la „Alege abonamentul”, ecranul 9, altfel la pagina din §4.8), **Rapoarte AI**. Când ghidul e ascuns dar neterminat, aici apare și rândul „Ghidul de început · 3/7”.

**Meniul avatarului** rămâne personal: Contul meu, Tichetele mele, Spațiile mele, Deconectare (plus Admin pentru echipa Eventya).

Sursele, toate existente:

| Modulul | Cifra | Rândul din listă | Sursa |
|---|---|---|---|
| Site web | vizitatori | pagina cea mai văzută | `Cms::Presenters::Dashboard` (analytics-ul de azi) |
| Helpdesk | tichete deschise | tichete nealocate | aceleași numărători ca `Helpdesk::DashboardController` |
| Community | membri noi | recenzii de verificat | dashboard-ul Community |
| Aplicație (Mobile) | dispozitive | ultimul anunț | `MobileApp::Device`, broadcast-urile |
| AI pentru vizitatori | conversații | răspunsuri ratate | `AiConversation` |
| Linkuri și QR | scanări | linkuri active | `ShortLink`. Azi e o dală pe dashboard-ul CMS și se mută aici. |
| Media | fișiere | spațiul folosit | `Entitlements::Usage#storage_gb` |

Nu intră: carduri de stare, grafice, dale de scurtături separate. Detaliile rămân în dashboard-ul fiecărui modul.

**Reguli:**

- **Modulele neplătite nu apar deloc**, după regula existentă: se ascund, nu se blochează. Nu există dale „Deblochează” sau statistici goale.
- **Permisiunile.** Fiecare cifră și fiecare rând verifică `can_access_module?` și permisiunea din modul. Un agent de helpdesk vede doar Helpdesk, iar un editor nu vede starea abonamentului.
- **Viteza.** Cifrele și rândurile se încarcă leneș, într-un turbo frame (ca analytics-ul CMS de azi), cu cache pe cont de câteva minute. Pagina se deschide instant.
- **Spațiul suspendat** nu vede Dashboard-ul: backend-ul duce la „Continuă cu abonamentul”, ca în Tranziție.
- **Clienții existenți** primesc și ei Dashboard-ul, la deploy. După autentificare aterizează aici, nu în CMS, și primesc un Developer Announcement scurt despre asta.
- **Tehnic** (clase noi):
  - cheia `:dashboard` în `CoreModules::CATALOG`, prima în listă, fără nicio cheie de drept;
  - `Stejar::DashboardController#show` pe ruta rădăcină a motorului, în locul redirect-ului;
  - registrul `Dashboard::Modules`, câte o intrare pe modul, cu `available?(membership)`, cifra și rândul;
  - ViewComponent-urile `Stejar::Dashboard::MetricComponent` și `ModuleRowComponent`;
  - `PostVerification` și alegerea spațiului trimit la `/:slug/stejar`, nu la `/stejar/cms`.


### 4.8 Pagina Abonament

`/workspace/subscription`, deschisă din Dashboard → Spațiul de lucru → Abonament și din linkul de pe rândul de stare. Doar proprietarii și dezvoltatorii o văd. [Ecranul 19](19-abonament.html) o desenează. E o pagină de citire, cu acțiunile lângă rândul lor:

| Rândul | Pe card | Pe contract | În trial |
|---|---|---|---|
| Planul | pachetul, modulele, intervalul, prețul, starea | pachetul, „pe contract” | „Perioada de probă · N zile” |
| Acțiunea principală | „Schimbă pachetul” → `/workspace/upgrade` | „Cere alt pachet” | „Alege abonamentul” (ecranul 9) |
| Următoarea plată | data și suma | — | — |
| Plata | cardul, cu „Schimbă cardul” (Portalul Stripe) | transfer bancar, pe factură | — |
| Intervalul | „Treci pe anual” (imediat, cu proratare) | — | — |
| Contractul | — | numărul și data de final, cu „Cere reînnoirea” | — |
| Date de facturare | denumirea, CUI-ul, e-mailul, cu „Editează” (Portalul Stripe, §9) | — (în contract) | — |
| Facturi | „le trimite echipa Eventya pe e-mail, după fiecare plată” (§8), plus chitanțele Stripe din Portal | „le trimite echipa Eventya” | — |
| La final | „Anulează abonamentul” | „Cere încetarea contractului” (tichet) | linkul spre ștergerea spațiului |

**Anularea pe card** se face aici, nu în Portalul Stripe, ca să vedem motivul și să putem propune un pachet mai mic:

1. **Ecranul de confirmare:** ce rămâne activ și până când, ce se oprește după, și că datele rămân păstrate. Dedesubt, propunerea: „Vrei să plătești mai puțin? Poți trece pe un pachet mai mic.”
2. **Motivul**, opțional, dintr-o listă scurtă: costă prea mult, nu-l folosim destul, trecem pe altă platformă, proiectul s-a încheiat, altceva. Se salvează pentru pâlnie.
3. **„Anulează abonamentul”** setează `cancel_at_period_end` în Stripe și trimite PAY-004. Pagina arată apoi „Se încheie pe <data>”, cu **„Reia abonamentul”** până la acea dată. „Reia” e o acțiune a noastră (`cancel_at_period_end: false`), nu a Portalului.

**Schimbarea programată.** Un downgrade așteaptă finalul perioadei (§7.7). Până atunci, pagina arată un rând „De la <data>: <pachetul nou>”, cu „Renunță la schimbare”.

**Cine face ce.** Pagina o văd proprietarii și dezvoltatorii. Plata, anularea, cardul și datele de facturare sunt doar ale proprietarilor. Azi `require_owner!` lasă și dezvoltatorii, pentru că verifică `full_access?`, deci acțiunile de plată primesc o verificare nouă, doar pe rolul `owner`.

Portalul Stripe rămâne doar pentru card, chitanțe și datele de facturare. Anularea și schimbarea planului sunt oprite în configurația Portalului (C6).

---

## 5. Template-urile

Blank dispare. Rămân șapte template-uri, grupate în trei familii.

**Numele.** În interfață se numesc „template”. În cod rămân `starter` (`account.starter?`, `settings['starter']`), pentru că `template?` numește deja spațiile-șablon de temă (`__template_*`).

**Propunerea de nume** (întrebarea A2): o familie de *locuri*, pe linia „Digital Neighbourhood™”. Fiecare template e un tip de loc în care se strâng oamenii. Numele sunt scurte, se pronunță la fel în română și în engleză și nu se bat cap în cap cu pachetele (Helpdesk, Web, Mobile, Enterprise) sau cu modulele (Helpdesk Pro, AI vizitatori, Community, Media). De aceea „Comunitate” și „Galerie” au fost evitate: prima se confundă cu modulul Community, a doua cu galeria media.

| Grupa | Tipologia | Nume propus | Pentru cine | Paginile de pornire | Pachet recomandat | Alternative |
|---|---|---|---|---|---|---|
| Cultură | Muzeu | **Atrium** | muzee, galerii, case memoriale, colecții | Acasă · Vizitează (program, bilete, acces) · Expoziții · Colecția · Evenimente · Educație · Despre · Contact | Web + AI pentru vizitatori | Expo, Colecția |
| Cultură | Teatru | **Scena** | teatre, filarmonici, opere, centre culturale | Acasă · Stagiunea · Spectacole · Bilete · Trupa · Turnee · Despre · Contact | Web | Cortina, Stagiunea |
| Comunități publice | Oraș | **Forum** | primării, orașe, municipii | Acasă · Știri și anunțuri · Evenimente în oraș · Ghidul cetățeanului · Sesizări (formular Helpdesk) · Descoperă orașul · Contact | Web + Helpdesk Pro | Civic, Cetatea |
| Comunități publice | Destinație turistică mare | **Panorama** | județe, regiuni, OMD-uri, stațiuni mari, destinații naționale | Acasă · Descoperă (hartă) · Trasee · Evenimente · Cazare · Gastronomie · Zone · Planifică vizita · Oferte · Știri | Mobile | Orizont, Visit |
| Comunități publice | Destinație turistică mică | **Vatra** | comune turistice, stațiuni mici, sate, micro-regiuni, GAL-uri | Acasă · Descoperă · Trasee · Cazare · Producători locali · Evenimente · Cum ajungi · Contact | Web | Popas, Escapada |
| Privați | Privați – comunitate | **Agora** | asociații, ONG-uri, cluburi, festivaluri, rețele de membri | Acasă · Despre noi · Membri · Evenimente · Știri · Implică-te · Contact | Web + Community | Cerc, Breasla |
| Privați | Privați | **Vitrina** | pensiuni, restaurante, ghizi, organizatori de evenimente, producători | Acasă · Servicii și oferte · Galerie foto · Evenimente · Despre · Contact și rezervări | Web | Atelier, Brand |

### Reguli

- **Ce e un template.** Fiecare template rămâne un spațiu marcat `starter` în producție, ca azi. Îl construiește echipa de conținut, în RO și EN, cu imagini cu licență comercială (întrebarea S1).
- **Metadate noi** în `settings['starter']`: `group` (cultură / comunități publice / privați), `audience` (textul „pentru cine”), `recommended_package`, `recommended_modules` și `preview_image` (miniatura din grila asistentului și din galeria de Soluții). Se editează în Admin → Startere.
- **Doar conținut Web.** Template-urile folosesc doar ce intră în trial-ul Web. Ce ține de un modul (recenziile din Agora, push-ul din Panorama) apare pe cardul template-ului, de exemplu „Se completează cu Community”. Nu se clonează conținut care ar rămâne ascuns.
- **Template-urile sunt scutite de suspendare**, ca spațiile-șablon de temă: `Resolver` adaugă `account.starter?` lângă `template?`, iar `ExpiryNoticesJob` le sare. Echipa de conținut le construiește și le editează în producție, iar adminii nu trec de suspendare: fără scutire, un template fără abonament s-ar bloca și ar primi notificări de expirare. Aceasta e reparația R15 din §13.
- **Un singur template nu mai ascunde pasul.** Pasul 2 se afișează când există cel puțin un template (`any?` în loc de `length > 1`). Dacă e unul singur, cheia lui se trimite ascuns (R13).
- **Rezerva** e primul template publicat. `city/template.json` se curăță de paginile de test (R14) și rămâne doar ultima plasă, pentru când nu există niciun template.
- **Clientul care vrea doar Helpdesk** (venit cu `package=helpdesk`) sare pasul de template. Spațiul primește doar pagina de acasă de rezervă din `SeedWorkspaceJob` (`create_fallback_homepage`). Nu apare nicio opțiune „Blank” (întrebarea B7). Dacă alege mai târziu un pachet cu site, pornește de la această pagină.
- **Tema.** Toate cele șapte folosesc tema `city` și se diferențiază prin conținut, culori și fonturi (întrebarea S4).

---

## 6. Pagina de prețuri și calculatorul

**Pachetele se deschid** (varianta A, decisă pe 28.09, întrebarea C11). Lista celor patru pachete. Pachetul ales se mărește și conține modulele lui, cu bife (doar cele eligibile), totalul și butonul principal. Comutatorul Lunar / Anual stă deasupra listei.

Toate ecranele cu alegerea abonamentului folosesc aceeași componentă de prototip, `abonament.js`: prețurile publice (4), „Alege abonamentul” (9), abonamentul din spațiu (13) și ecranele 2 și 3 din Tranziție.

Calculatorul e același ca în Tranziție: pachetul, modulele, oferta cu totalul, comutatorul Lunar / Anual cu reducerea ca procent, **TVA inclus în toate prețurile**. Se extrage într-un **ViewComponent nou**, `Stejar::Subscriptions::ConfiguratorComponent`, cu trei moduri. Azi e format din partiale ERB și două controllere Stimulus.

| Mod | Unde | Ce diferă față de Tranziție |
|---|---|---|
| `public` | pagina de prețuri de pe site, **în tema site-ului** (aceleași `mkt-*` și variabile, fără alt aspect) | Fără „Planul tău” și fără avertismentul de coborâre. Două butoane: **Începe gratuit · 30 de zile** (duce la `/signup`, cu selecția) și **Cere ofertă** (formularul de vânzări). Nu există plată cu cardul pe site. Venind de pe o soluție, pachetul recomandat e preselectat, cu eticheta „Recomandat pentru Atrium”. O linie despre servicii: setup, migrare, instruire și domeniu se discută în ofertă. |
| `upgrade` | „Alege abonamentul” (ecranul 9) și `/workspace/upgrade` | **În trial:** „Plătește cu cardul” + „Cere ofertă”, cu selecția de pe site preselectată, altfel Web. Sub total: ce nu intră în pachet se ascunde la plată, conținutul rămâne. **Pe card:** „Aplică schimbarea”, cu suma exactă de plătit acum (upgrade) sau „de la <data>” (downgrade). **Pe contract:** rămâne cererea, ca azi. |
| `renew` | „Continuă cu abonamentul” | Pachetul expirat e preselectat. „Plătește și reactivează” (card) + „Cere ofertă”. |

Reguli comune:

- **Nume de butoane, peste tot:** „Plătește cu cardul”, „Cere ofertă” și „Alege abonamentul”. „Finalizează plata”, „Finalizează abonamentul” și „Cere ofertă și contract” dispar.
- **Prețurile se randează pe server din `PriceList`**, nu mai sunt scrise în ERB. Totalul din calculator trebuie să fie egal cu `Quote` și cu suma din Checkout (spec). `Quote` rotunjește pe linie, în bani, ca Stripe, altfel totalurile anuale pot diferi cu un leu.
- **TVA-ul e inclus în toate prețurile (C7).** Prețul din grilă e prețul final, cu TVA inclus: clientul plătește exact cifra afișată. În cod se schimbă sensul lui `PriceList` (azi comentariul spune „fără TVA”, iar interfața scrie „fără TVA”): TVA-ul se scoate din preț, nu se adaugă. `Quote#vat_amount` devine partea de TVA inclusă, pentru PAY-006.
- **Enterprise se vinde doar prin contract** (întrebarea C1). Pe cardul lui apare „Cere ofertă”, nu „Plătește”.
- **Selecția ajunge în URL:** `?package=web&modules=media,ai_visitor&interval=annual`. Se păstrează prin cont și asistent, până pe ecranul 9.
- **Dispar de pe pagina de acum:** *Starter / Destination / Regional*, EUR, „free forever” și „2 months free”, înlocuit de procentul real. „Stocare nelimitată” rămâne: stocarea nu are plafoane (`stejar/plans/stocare-fara-limite.md`).

---

## 7. Stripe, cap-coadă

### 7.1 Principii

- **Checkout găzduit de Stripe.** Datele cardului nu ajung la noi, iar 3-D Secure, Apple Pay, Google Pay și limba română vin incluse. CSP-ul rămâne simplu (§7.10).
- `PriceList` rămâne sursa prețurilor, iar Stripe primește o copie.
- `Stejar::Subscription` rămâne sursa drepturilor. Webhook-urile doar o sincronizează. Nimic nu citește Stripe la cerere, în afara întoarcerii din Checkout.
- Tot codul nou stă în clase noi, sub `Stejar::Billing::`. Nu se modifică `UpgradeRequestCreator` și nici alte clase comune.

### 7.2 Obiectele

| Stripe | La noi |
|---|---|
| Customer | un Customer per spațiu de lucru, creat la prima plată, cu `stripe_customer_id` pe cont. Poartă datele de facturare cerute în Checkout (§9). |
| Product / Price | un Product per pachet și per modul. Price lunar și anual, în RON, cu TVA inclus (`tax_behavior: inclusive`), cu `lookup_key` versionat (`web_monthly_1_8`). |
| Subscription | `Stejar::Subscription` cu `billing_type: stripe` și coloanele noi `stripe_subscription_id`, `billing_interval` (vine din Tranziție), `cancel_at_period_end`, `past_due_since` și `grace_until` |
| Invoice | chitanța Stripe. Factura fiscală o emite echipa, în afara platformei (§8). |
| Event | tabelul nou `stejar_stripe_events`: `stripe_event_id` unic, tipul, payload-ul, `processed_at`, eroarea |

### 7.3 Catalogul

- `bin/rails stripe:sync_catalog` creează idempotent Products și Prices din `PriceList`. **Prețurile nu se editează în dashboard-ul Stripe.**
- O schimbare de preț înseamnă o versiune nouă de `lookup_key`. Ce se întâmplă cu abonamentele existente la o schimbare de preț e întrebarea C8. Pagina Abonament arată prețul din abonament, nu din `PriceList`, iar `catalog_version` (azi scris, dar necitit) începe să conteze.
- Pe pachetul Helpdesk cu Helpdesk Pro, abonamentul are un singur item, `helpdesk_pro` (regula `HELPDESK_PRO_REPLACES`). Enterprise are tot un singur item, cu modulele incluse.

### 7.4 Checkout

- Plata pornește **doar din spațiu**: „Alege abonamentul” în trial (ecranul 9), `/workspace/upgrade` și „Continuă cu abonamentul”. Spațiul există mereu înaintea Checkout-ului.
- Clasa nouă `Billing::StartCheckout` creează sesiunea:
  - `mode: subscription`, `line_items` din `Quote`, `client_reference_id: account.id`;
  - `customer`: cel existent sau unul nou, cu e-mailul proprietarului;
  - datele de facturare: `billing_address_collection: required`, `tax_id_collection` (CUI, `ro_tin`) și `customer_update: { name, address: auto }`, ca să rămână pe Customer.
- `metadata` conține `account_id`, `package`, `modules`, `interval` și `catalog_version`.
- Limba e cea a utilizatorului. Întoarcerea se face în spațiu:
  - `success_url` = `/:slug/stejar/billing/checkout/return?session_id={CHECKOUT_SESSION_ID}` („Confirmăm plata…”, ecranul 10);
  - `cancel_url` = `/:slug/stejar/billing/checkout/cancel` („Plata nu s-a făcut”, cu selecția păstrată).
- `checkout.session.expired` închide sesiunea deschisă, ca regula „o singură sesiune per spațiu” să nu blocheze o plată nouă.

### 7.5 Webhook-urile

- **Ruta:** `POST /stripe/webhooks` în eventya, la o adresă curată, cu controllerul în stejar. Ruta se desenează dintr-un modul comun, ca la MCP (`Stejar::Billing::Routes.draw`), în eventya și în aplicația dummy. Ruta nu trece prin CSRF, prin middleware-ul de spațiu și nici prin limitele rack-attack.
- **Ordinea:** verificarea semnăturii → salvarea evenimentului → răspuns 200 imediat → `Billing::ProcessEventJob`, idempotent.
- **Ordinea evenimentelor nu contează:** job-ul citește mereu starea curentă a abonamentului din API.

| Eveniment | Acțiune |
|---|---|
| `checkout.session.completed` | Leagă abonamentul Stripe de spațiu, apoi `Billing::SyncSubscription`. Trial-ul se încheie. |
| `customer.subscription.created` / `updated` / `deleted` | `SyncSubscription`: pachetul, modulele, intervalul, `starts_at`, `ends_at`, `cancel_at_period_end`. |
| `invoice.paid` | Prelungește `ends_at` (§7.6). Trimite **PAY-006** adminilor, ca să emită factura fiscală (§8). La prima plată trimite PAY-001. |
| `invoice.payment_failed` | Pornește grația (§7.6) și salvează `past_due_since`. Trimite PAY-002 proprietarilor și PAY-005 adminilor. Dacă plata cere de fapt 3-D Secure (`payment_intent.status: requires_action`), pleacă doar PAY-003, nu și PAY-002. |
| `invoice.payment_action_required` | PAY-003: plata trebuie confirmată cu 3-D Secure, prin linkul facturii găzduite. E-mailul Stripe pentru același caz se oprește din setări, ca să nu plece două. |
| `invoice.upcoming` | Doar la plata anuală: SUB-005 „se reînnoiește pe…”, cu 7 zile înainte. |
| `charge.refunded` | PAY-005 pentru admini. Stornarea o face echipa, în afara platformei. |
| `charge.dispute.created` | PAY-005 pentru admini. |
| `customer.updated` | Copiază denumirea, CUI-ul, adresa și e-mailul pe cont (`settings['billing']`), pentru pagina Abonament și PAY-006. |

### 7.6 Stările

| Starea în Stripe | La noi |
|---|---|
| `active` | activ. `ends_at` = data lui `current_period_end`, **plus o zi**. Stripe încasează reînnoirea la aproximativ o oră după finalul perioadei, iar fără ziua în plus fiecare client pe card ar fi suspendat la fiecare reînnoire. |
| `past_due` | activ până la `grace_until` = `past_due_since` + 7 zile. PAY-002 pleacă în ziua 0 din webhook, iar în zilele 3 și 6 din jobul zilnic, după `past_due_since`, nu după reîncercările Stripe. |
| `canceled` / `unpaid` | `ends_at` = finalul perioadei plătite, apoi suspendat, ca în Tranziție |
| `incomplete` / `incomplete_expired` | nicio schimbare: spațiul rămâne pe trial sau suspendat |
| `trialing` / `paused` | nu se folosesc: trial-ul e al nostru, nu al Stripe |

- **Finalul reîncercărilor.** După ultima reîncercare, Stripe **anulează** abonamentul (setare în cont), iar factura rămasă neplătită se anulează (void). Reactivarea trece printr-un Checkout nou, din „Continuă cu abonamentul”, cu vechea configurație preselectată.
- **Ziua de azi, într-un singur fus.** `starts_at` și `ends_at` sunt date. „Azi” se socotește în Europe/Bucharest, și în cereri, și în joburi. Azi joburile rulează în UTC (`config.time_zone` nu e setat), iar cererile în fusul utilizatorului. Decizia de acces nu trebuie să depindă de cine se uită.

### 7.7 Schimbările

- **Upgrade și trecerea de la lunar la anual:** imediat, cu proratare. Diferența se facturează pe loc (`proration_behavior: always_invoice`), iar drepturile noi intră doar după ce s-a plătit (`payment_behavior: pending_if_incomplete`). Dacă 3-D Secure eșuează, pachetul rămâne cel vechi. Înainte de confirmare, pagina arată suma exactă, din previzualizarea facturii Stripe.
- **Downgrade și trecerea de la anual la lunar:** la finalul perioadei, printr-un Subscription Schedule. Oferta arată „de la <data>”, iar pagina Abonament arată schimbarea programată, cu „Renunță la schimbare”. Un upgrade sau o anulare eliberează întâi programarea.
- **Anularea:** din pagina Abonament (§4.8), cu efect la finalul perioadei. Până atunci, „Reia abonamentul” o retrage.
- **Trecerea de la card la contract:** echipa anulează în Stripe și pune contractul din Admin.
- **Plată restantă:** pagina de abonament arată întâi „Plătește acum”, care duce la factura găzduită de Stripe (plata se face pe loc, cu orice card), iar pachetul nu se schimbă până nu trece plata.
- **Anulare programată:** pagina arată întâi „Reia abonamentul”. Schimbările vin după reluare.

### 7.8 Customer Portal

- Clientul își actualizează cardul, descarcă chitanțele și își modifică datele de facturare.
- **Anularea și schimbarea planului sunt oprite** în configurația Portalului. Anularea se face din pagina Abonament, ca să vedem motivul. Pachetul se schimbă doar din pagina noastră, ca să se respecte `PACKAGE_ADDONS`.
- Deschiderea Portalului, prin `Billing::OpenPortal`, e permisă doar proprietarului.

### 7.9 Reconcilierea

Un job zilnic, `Billing::ReconcileJob`, compară fiecare abonament `stripe` cu Stripe și repară diferențele. Acoperă webhook-urile pierdute și editările făcute din dashboard. Orice diferență reparată ajunge în AppSignal.

Reconcilierea nu se oprește la abonamente:

- **Plățile.** Orice factură Stripe plătită în ultimele 35 de zile fără PAY-006 trimis trimite PAY-006, ca nicio factură fiscală să nu fie uitată.
- **Evenimentele eșuate.** Joburile se reîncearcă singure. Cele care rămân cu eroare apar în Admin, cu „Reprocesează”.
- **Un singur cont.** Fișa din Admin are „Sincronizează acum”.

### 7.10 Securitatea și configurarea

- **CSP:** `form-action` primește `https://checkout.stripe.com` și `https://billing.stripe.com`. `Permissions-Policy: payment=()` rămâne, pentru că Checkout rulează pe domeniul Stripe.
- **Versiunea API** Stripe se fixează în cod și pe endpoint-ul de webhook. De la `2025-03-31.basil`, `current_period_end` stă pe subscription items, nu pe abonament.
- **Idempotență și la ieșire:** apelurile care creează ceva în Stripe (Customer, Checkout Session, schimbarea abonamentului) poartă o cheie de idempotență.
- **Chei în 1Password:** test mode pe staging, live în producție, cu câte un webhook secret pentru fiecare endpoint. Nu se atinge `dev_ops`.
- **Comutatorul** `billing.stripe_enabled` ascunde „Plătește cu cardul” până la lansare, așa că restul poate ajunge în producție înainte.
- **Test clocks pe staging:** Stripe leagă un Customer de un test clock doar la creare, așa că pe staging `Billing::StartCheckout` creează Customer-ul pe un test clock, cu `STRIPE_TEST_CLOCKS` pornit. Test clock-ul mută doar timpul Stripe. Joburile noastre (PAY-002 în zilele 3 și 6, SUB-005) se rulează de mână, cu data mutată.

### 7.11 Contul Stripe al Eventya (în afara codului)

- Activarea contului presupune verificarea firmei și un cont bancar în RON pentru încasări.
- Mai trebuie setate:
  - descriptorul de pe extras;
  - brandingul (logo și culori pe Checkout, Portal și chitanțe);
  - Smart Retries pe 7 zile, cu **anularea** abonamentului după ultima reîncercare;
  - Radar în setările implicite;
  - Portalul fără anulare și fără schimbarea planului.
- Se hotărăște și ce e-mailuri trimite Stripe și ce e-mailuri trimitem noi (întrebarea C9).
- `invoice.upcoming` se setează la 7 zile înainte de reînnoire, pentru SUB-005.

---

## 8. Factura fiscală: în afara platformei, deocamdată

- **Echipa emite factura fiscală** pentru fiecare plată cu cardul, în programul ei de facturare, care o transmite și în e-Factura și o trimite clientului pe e-mail. Chitanța Stripe nu e factură fiscală.
- **Declanșatorul e PAY-006:** la fiecare `invoice.paid`, adminii primesc „Emite factura fiscală” (clopoțel și e-mail), cu:
  - cumpărătorul: denumirea, CUI-ul, adresa și e-mailul;
  - suma, cu TVA inclus;
  - perioada;
  - linkul spre plata din Stripe.

  Reconcilierea (§7.9) prinde plățile fără PAY-006.
- **Rambursarea:** PAY-005 la admini, iar stornarea se face tot în afara platformei.
- **Contractele** se facturează ca azi, de echipă.
- **Mai târziu:** automatizarea, prin API-ul programului de facturare (SmartBill, Oblio sau FGO), dacă numărul plăților cu cardul o cere.

---

## 9. Datele de facturare

- **Nu există un profil de facturare la noi.** Checkout cere denumirea, adresa și CUI-ul și le salvează pe Stripe Customer (§7.4).
- **Se schimbă din Portalul Stripe.** `customer.updated` copiază denumirea, CUI-ul, adresa și e-mailul pe cont (`settings['billing']`), pentru pagina Abonament și PAY-006.
- **Plata cu cardul e doar pentru organizații din România**, în RON (A4). Clienții din alte țări trec prin ofertă.
- **Contractele** își au datele în contract, în afara platformei.

---

## 10. Oferta și contractul

**Contractul se gestionează în afara platformei.**

- **Pe site:** „Cere ofertă” deschide formularul de vânzări existent (§11), cu selecția din calculator în corpul cererii.
- **În spațiu:** „Cere ofertă”, din „Alege abonamentul” (ecranul 9) sau de pe `/workspace/upgrade`, deschide un tichet în Suport prin mecanismul de azi (`UpgradeRequestCreator`), cu configurația și un mesaj opțional. Nu există formular nou, câmpuri de achiziție sau `ContractRequestCreator`. Cererea apare la client în „Tichetele mele” ([ecranul 11](11-cerere-contract.html)).
- **Până la semnare,** clientul lucrează pe trial. Dacă procedura durează, echipa prelungește trial-ul din Admin, cu „+30 de zile” (B5).
- **Echipa** face oferta și contractul (direct sau prin SEAP/SICAP), apoi setează abonamentul din Admin, cu `billing_type: contract`.
- **Instituțiile publice vor merge aproape toate pe contract**, iar cardul va fi folosit mai ales de privați. Cinci din cele șapte tipologii sunt publice, așa că trial-ul de 30 de zile poate fi mai scurt decât o procedură de achiziție. De aici butonul „+30 de zile” din Admin.

---

## 11. Site-ul de marketing

**Tema site-ului rămâne cea de azi** (fundalul închis implicit, turcoazul și coralul, fonturile Plus Jakarta Sans și DM Sans, componentele `mkt-*`, modul luminos). Nu se reproiectează nimic. Se adaugă doar piesele din tabelul de mai jos, construite cu aceleași clase și variabile. Ecranele 3–5 folosesc chiar foaia de stil reală a site-ului (`marketing.tailwind.css` din eventya), compilată în `assets/marketing.css`.

| Ce | Schimbarea |
|---|---|
| Limbi | RO + EN, cu `t()` pe toate paginile de marketing, comutator în antet și `hreflang` (întrebările A3, A6) |
| Antet · anonim | Soluții · Prețuri · Destinații · Despre · Ajutor, apoi **Autentificare** și **Începe gratuit** |
| Antet · autentificat | Același meniu, apoi avatarul cu **Spațiile mele**, **Spațiu de lucru nou** și **Deconectare**. „Autentificare” dispare. Un spațiu suspendat apare cu eticheta „suspendat”. |
| Acasă | „Începe gratuit” și „Vezi prețurile” |
| Soluții | o pagină de galerie cu cele 7 template-uri, plus câte o pagină pentru fiecare, cu o captură a template-ului, pachetul recomandat și „Începe cu <nume>” (întrebarea A5). Fără „Vezi demo”: demo-ul e chiar onboarding-ul, cu trial-ul deblocat. |
| Prețuri | calculatorul (§6), în tema site-ului, cu „Începe gratuit” și „Cere ofertă”: se înlocuiesc doar cele trei carduri statice cu prețuri în EUR. Hero-ul, tabelul comparativ și întrebările frecvente își păstrează forma, cu conținutul actualizat. |
| Contact vânzări | formularul Helpdesk existent, cu un câmp nou, „Tipul organizației”. Primește și cererile de ofertă de pe Prețuri, cu selecția din calculator. |
| Legal | Termenii (§4 rescris: RON, trial, plata prin Stripe, suspendarea, anularea, rambursările) · Confidențialitatea (Stripe ca destinatar) · DPA (lista subprocesatorilor) · Cookies (ce există de fapt) · Ajutor (scoase promisiunile care nu se țin) |
| Cookie-uri | banner real, cu cookie-ul `eventya_consent` numit în politică (R17), valabil 6 luni (azi codul spune 180 de zile, iar politica un an: se aliniază). Singura categorie opțională e analytics, deci bannerul are doar Accept și Refuz. „Setări cookie” din subsol permite schimbarea. GA4 se încarcă doar după acceptare. |
| Subsol | se adaugă Cookies, DPA și „Setări cookie” |

---

## 12. Legal, GDPR, securitate, măsurare

- **Termenii:** textul „Continuând, accepți Termenii și Politica de confidențialitate” stă sub butonul pasului E-mail, la crearea contului. Pe `Stejar::User` se salvează `terms_accepted_at` și `terms_version`.
- **DPA:** proprietarul îl acceptă în numele organizației, la crearea spațiului, printr-o frază sub „Creează spațiul” (pasul Template), nu printr-o bifă. Pe cont se salvează `dpa_accepted_at` și `dpa_version`.
- **Fără abonare la noutăți** la crearea contului.
- **Protecția la creare cont:** Cloudflare Turnstile, invizibil, pe `/signup` și `/signin`. rack-attack trece pe un store comun (Solid Cache), în loc de `MemoryStore` per proces (R16). Dacă Turnstile nu se încarcă (Cloudflare indisponibil), formularul merge mai departe doar cu limitele rack-attack, iar cazul se loghează. Dacă provocarea invizibilă eșuează, apare cea vizibilă.
- **Adresele rezervate** se completează (R8).
- **Măsurarea:** o pâlnie server-side, fără cookie-uri: vizualizări ale paginii de prețuri → cont creat → cod confirmat → spațiu creat (pe template) → „Alege abonamentul” deschis → Checkout pornit → plătit sau cerere de ofertă → trial convertit. Fără cookie-uri se numără vizualizări, nu vizitatori unici. Pașii de după crearea spațiului se numără pe cohorte, după săptămâna creării. Plus activarea: pașii din ghid făcuți în primele 7 zile și „site publicat în 7 zile”. Se vede în Admin → Onboarding. GA4 doar cu consimțământ (întrebarea G2).

---

## 13. Reparațiile: defectele găsite în codul de azi

Toate au fost verificate în cod. Intră în **F1**, care ajunge primul în producție, independent de restul: o parte din ele îi afectează deja pe utilizatori. Fiecare defect primește un spec care îl reproduce înainte de reparație.

| # | Defectul | Unde | Reparația | Specul |
|---|---|---|---|---|
| R1 | „Retrimite codul” nu trimite nimic la crearea contului: codul pleacă doar dacă `Stejar::User` există, iar userul nou se creează abia la finalul `/setup`. | `onboarding_controller.rb` `resend` (:146-148) | Pe fluxul `signup`, codul se trimite mereu. Pe `signin`, doar dacă există userul. | request: signup → resend → e-mail trimis |
| R2 | Cine are deja cont și intră pe „Creează cont” nu primește niciun cod, dar ecranul îi spune că l-a primit. | `create_signup` (:40-44) | Primește un cod de autentificare (contextul `onboarding`), iar `PostVerification` îl duce în spațiile lui sau în asistent, dacă a venit cu o intenție. | request: e-mail existent pe signup → cod → CMS |
| R3 | Pe „Autentificare”, un e-mail necunoscut nu primește nimic, iar utilizatorul așteaptă un cod care nu vine. | `create_signin` (:63) | E-mail „Nu există un cont cu această adresă”, cu buton spre crearea contului. Ecranul rămâne neutru. | mailer + request |
| R4 | Un utilizator autentificat, fără spații de echipă, vede formularele de creare cont și de autentificare. | `redirect_if_authenticated` (:225-237) | Redirect la `/setup`. | request |
| R5 | Un admin fără spații e trimis la `/stejar/admin`, iar ruta reală e `/stejar-admin`. | `post_verification.rb` :38 | Folosește `admin_root_path`. | service spec |
| R6 | Numărarea spațiilor diferă: `PostVerification` și `ChooseWorkspaceController` numără și rolul `member` (membru public), `redirect_if_authenticated` doar rolurile de echipă. Un membru public e trimis într-un CMS la care nu are acces. | `post_verification.rb` :31, :50-52 · `choose_workspace_controller.rb` :10-11 | Un singur query, `Onboarding::TeamMemberships`, folosit în toate trei. | service + request |
| R7 | După creare, utilizatorul aterizează pe **site-ul public**, nu în spațiul de lucru. | `onboarding_controller.rb` `preparing` (:137) | Redirect în Dashboard, unde îl așteaptă ghidul de început (§4.6, §4.7, ecranele 12, 17 și 18). | request |
| R8 | `RESERVED_SLUGS` nu conține adresele site-ului și ale noilor rute: `destinations`, `jobs`, `dpa`, `signin`, `resend`, `workspace`, `platform`, `solutii`, `preturi`, `solutions`, `en`, `ro`, `stripe`, `billing`, `checkout`. | `stejar/app/models/stejar/account.rb` :9-21 | Lista completată și un spec care compară lista cu rutele de la primul nivel din eventya. | model + routing |
| R9 | Un spațiu în trial pe Web nu poate cere trecerea pe Web plătit: validarea `asks_for_something` refuză o configurație „neschimbată” fără mesaj. | `upgrade_request.rb` :133-137 | În trial, orice pachet plătit e o schimbare, inclusiv Web. | model |
| R10 | „Finalizează abonamentul” dintr-un trial (`?from=domains`) preselectează Mobile, pentru că orice sursă alege pachetul următor. | `upgrade_request.rb` `preselect!` :56-59 | În trial se preselectează selecția de pe site, altfel Web. | model |
| R11 | Reînnoirea unui abonament expirat preselectează Helpdesk (pachetul următor după `none`), nu pachetul care a expirat. | `upgrade_request.rb` `current_for` :32-35 | Modul `renew` citește pachetul expirat. Se face în Tranziție (§3.2 acolo), aici doar se verifică. | model |
| R12 | Admin → Subscripție are prețuri scrise direct în text. | `_subscription_form.html.erb` :96 | Se citesc din `PriceList`. | view |
| R13 | Fără Blank, `@starters.length > 1` ascunde pasul de template când există un singur template, iar spațiul cade pe `template.json`. | `setup.html.erb` :6 | `any?`, cu un câmp ascuns pentru template-ul unic. | request |
| R14 | `city/template.json` se folosește pentru orice cheie necunoscută, nu doar pentru `default`, și conține pagini de test („sss”, „wqadada”, „T1”–„T3”, „Testing undo feature”). | `seed_from_template.rb` :52-57 · `app/themes/city/template.json` | Rezerva devine primul starter publicat. Fișierul se curăță și rămâne ultima plasă. | job |
| R15 | Template-urile (`starter`) nu sunt scutite de suspendare: fără abonament primesc profilul gol, deci după Tranziție echipa de conținut nu le mai poate edita (adminii nu trec de suspendare). `ExpiryNoticesJob` nu le sare nici el. | `resolver.rb` :23 · `expiry_notices_job.rb` :52 | `starter?` lângă `template?`, în ambele. | model + request |
| R16 | rack-attack folosește `MemoryStore`, deci limitele se socotesc per proces Puma, nu pe server. | `config/initializers/rack_attack.rb` :4 | Store comun (Solid Cache). | config |
| R17 | Controllerul de consimțământ scrie cookie-ul `cookie_consent`, iar politica numește `eventya_consent`. Pe site-ul de marketing bannerul nu apare; același controller rulează însă pe site-urile clienților (tema `city`). | `cookie_consent_controller.js` :7 · `cookie_policy.html.erb` :31 | Numele cookie-ului devine o valoare Stimulus, per suprafață: `eventya_consent` pe marketing, `cookie_consent` rămâne pe site-urile clienților, ca acordul lor să nu se piardă. Bannerul se randează în layout-ul de marketing. | system |

Curățenie fără impact pentru utilizator, făcută în aceeași trecere:

- comentariul din `recurring.yml` (:76) spune „30/7/1 zile”, iar codul trimite la 7 și la 1 zi;
- comentariile din notifierii SUB-001/002 pomenesc parametri care nu mai există;
- skill-ul `product-design` încă listează temele OMD, Travel și Blog;
- nicio specificație nu verifică trial-ul creat de `CreateWorkspace`, așa că se adaugă una.

---

## 14. Notificările și e-mailurile

Toate notificările trec prin Noticed (clopoțel, push și e-mail, după caz) și fiecare primește o intrare în `stejar/manual/notifications`, după regula existentă. Excepțiile sunt e-mailurile către adrese care nu au încă un cont (AUTH-001 la creare, AUTH-008): rămân mailere simple, ca azi, pentru că Noticed are nevoie de un destinatar în baza de date. AUTH-002 trece pe Noticed (e-mail și clopoțel). Expeditorul e `noreply@eventya.net`, cu Reply-To spre Suport.

| Cod | Când | Cui | Canale | Stare |
|---|---|---|---|---|
| AUTH-001 | codul, la creare cont și la autentificare | utilizatorul | e-mail | există, text RO/EN |
| AUTH-008 | autentificare cu un e-mail necunoscut | adresa | e-mail | **nou** (R3) |
| AUTH-002 | spațiul e gata | proprietarul | e-mail | există, text ajustat |
| EVENTYA-008 | spațiu creat | adminii | e-mail | există, cu template-ul și selecția de pe site în plus |
| — | cerere de ofertă din spațiu | echipa | tichet în Suport | există: mecanismul de cerere de upgrade |
| PAY-001 | prima plată reușită, abonament activ | proprietarii | clopoțel + e-mail | **nou** |
| PAY-002 | plata a eșuat, în zilele 0, 3 și 6 | proprietarii | clopoțel + push + e-mail | **nou** |
| PAY-003 | plata trebuie confirmată cu 3-D Secure | proprietarii | clopoțel + e-mail | **nou** |
| PAY-004 | abonamentul e anulat și se încheie pe <data> | proprietarii | clopoțel + e-mail | **nou** |
| PAY-005 | plată eșuată, dispută sau rambursare | adminii | e-mail + clopoțel | **nou** |
| PAY-006 | plată încasată: emite factura fiscală (§8) | adminii | e-mail + clopoțel | **nou** |
| GUIDE-001 | ziua 3, în trial, dacă au rămas pași în ghid | proprietarii | e-mail | **propus** (B9) |
| SUB-005 | plata anuală se reînnoiește pe <data> | proprietarii | e-mail | **nou** |
| SUB-001 / SUB-002 | trial-ul se încheie / s-a încheiat | proprietarii | ca azi | text de trial nou, cu „Alege abonamentul” (ecranul 9). Butonul e „Plătește cu cardul” doar cu `billing.stripe_enabled` pornit, altfel „Alege abonamentul”. Echipa primește copia, ca azi (SUB-003). SUB-001 nu se trimite deloc abonamentelor Stripe. SUB-002 pleacă la suspendare, oricare ar fi motivul. |
| — | factura fiscală | e-mailul de facturare | de la echipă, în afara platformei (§8) | ca azi, la contracte |

---

## 15. Feature-urile și drumul lor, de la cod la producție

[Storyboard-ul](01-storyboard.html) desenează fiecare feature pe patru etape: **implementare → staging → testare → producție**, fiecare cu condiția de „gata”.

| # | Feature | Repo | Depinde de | În producție |
|---|---|---|---|---|
| F0 | Pregătiri în afara codului: contul Stripe, textele legale, numele și conținutul template-urilor | — | — | înaintea lansării plăților |
| F1 | Reparațiile R1–R17 (§13) | eventya + stejar | Tranziția | **primul**, independent |
| F2 | Contul și autentificarea: câte un câmp pe pas, intenția, termenii, Turnstile, texte RO/EN | eventya | F1 | imediat după F1 |
| F3 | Template-urile: cele 7, fără Blank, metadatele, grupele | eventya + stejar + conținut | F1, F0 (conținutul) | când sunt gata toate 7 |
| F4 | Calculatorul ca ViewComponent și pagina de prețuri publică | stejar + eventya | Tranziția | înaintea F6 |
| F5 | Asistentul în doi pași (proiect, template), adresa din nume, limba din cookie, aterizarea în Dashboard | eventya | F2, F3, F14 | cu F6 |
| F6 | Trial cu toate funcționalitățile pentru orice spațiu nou, „Alege abonamentul” din spațiu (ecranul 9), „+30 de zile” în Admin | stejar + eventya | F4, F5 | cu F5, cu plata ascunsă (comutatorul oprit) |
| F8 | Cererea de ofertă din spațiu (mecanismul de cerere de upgrade) | stejar | F4 | cu F6: onboarding-ul nou e live cu trial și ofertă |
| F9 | Stripe: catalog, Checkout cu datele de facturare, webhook-uri, Portal, schimbări, grație, reconciliere, PAY-006 | stejar + eventya | F4 | cu comutatorul oprit, pornit la lansare |
| F11 | Admin: fișa Stripe, filtrele, pâlnia | stejar | F9 | cu F9 |
| F12 | Site-ul de marketing: RO/EN, antetul, Soluțiile, legalul, cookie-urile | eventya | F3, F4 | legalul **înaintea** lansării plăților |
| F13 | Ghidul de început: lista de pași din Dashboard, indiciile, site-ul privat până la publicare | stejar + eventya | F3, F5, F14 | cu F5 |
| F14 | Dashboard: modulul nou, cu cifrele, modulele și coloana „Spațiul de lucru”; meniul avatarului devine personal | stejar + eventya | F1 | **în Val 2, independent**: îl primesc și clienții existenți |
| F15 | Pagina Abonament: planul, plata, datele de facturare, anularea și reluarea | stejar | F9 | cu F9 (anularea pe card cere Stripe); varianta pentru contract și trial poate intra din Val 3 |
| — | **Lansarea plăților** | — | toate | comutatorul pornit după o plată reală internă, rambursată |

F7 (datele de facturare și ANAF) și F10 (factura fiscală și e-Factura) au ieșit din plan pe 28.09: datele de facturare vin din Checkout, iar factura fiscală o emite echipa, după PAY-006 (§8, §9).

**Ordinea de lucru:**

1. **Val 0, în paralel, în afara codului:** F0.
2. **Val 1:** F1.
3. **Val 2:** F2, F3, F4 și F14, în paralel. Dashboard-ul ajunge în producție pentru toți clienții, cu un Developer Announcement scurt.
4. **Val 3:** F5, F6, F8 și F13. Onboarding-ul nou e live, cu trial, ofertă și ghidul de început.
5. **Val 4:** F9, F11 și F15, cu plățile ascunse.
6. **Val 5:** F12. Poate începe în paralel din Val 1, dar legalul trebuie publicat înaintea lansării.
7. **Lansarea plăților.**

**Pe staging:**

- Stripe în test mode și Stripe CLI local (`stripe listen --forward-to …/stripe/webhooks`).
- Test clocks pentru reînnoiri și plăți eșuate.
- Template-urile copiate din producție.
- Matricea de test din [ecranul 16](16-checklist-staging.html).

**În producție, pentru fiecare feature:**

1. backup înainte de migrări;
2. merge;
3. bump al stejar în eventya (stejar e un gem din git: rutele noi din eventya intră doar după bump);
4. deploy;
5. smoke test;
6. o zi de urmărit AppSignal.

La lansarea plăților, în plus: cheile live, webhook-ul live, `stripe:sync_catalog` pe live și o plată reală cu un card intern, rambursată, verificată până la PAY-006 și factura emisă de echipă.

---

## 16. Riscuri

1. **Tranziția trebuie să fie în producție.** Fără suspendare și fără calculator, jumătate din plan nu are pe ce să stea.
2. **Facturarea manuală.** Fiecare plată cu cardul cere o factură fiscală emisă de mână, în termenul legal, după PAY-006. Dacă plățile cresc, se automatizează (§8).
3. **Instituțiile publice și durata procedurilor.** Trial-ul de 30 de zile e mai scurt decât o achiziție publică. Fără „+30 de zile” din Admin, spațiile se suspendă în mijlocul negocierii.
4. **Site-ul promite azi lucruri pe care codul nu le face** (EUR, „free forever”, rambursare în 30 de zile, anulare din setări). Trebuie corectat înaintea lansării plăților, cu revizuire juridică.
5. **Conținutul template-urilor** înseamnă 7 spații × 2 limbi, cu imagini cu licență. E cel mai probabil drum critic.
6. **Abuzul de trial:** orice spațiu nou primește 30 de zile cu tot deblocat, deci cineva poate crea câte un spațiu nou la fiecare 30 de zile. E acceptat, fără limite de eligibilitate. Se urmărește în pâlnie.
7. **Trecerea din trial pe un pachet mai mic.** Clientul a folosit tot, apoi plătește Web: modulele neplătite se ascund. Avertismentul de pe ecranul 9 trebuie să fie clar, altfel vin tichete de tipul „mi-a dispărut ceva”.
8. **Webhook-urile.** Reconcilierea zilnică și idempotența sunt obligatorii, nu opționale.
9. **Prețurile în două locuri** (`PriceList` și Stripe). Se sincronizează doar din cod, iar pe staging un test compară cele două cataloage.
10. **SUB-001 pentru clienții pe card.** Dacă excluderea din §14 lipsește, fiecare client pe card primește lunar „abonamentul expiră”.
11. **Onboarding-ul e azi în engleză, cu textele direct în view.** Trecerea pe i18n atinge fiecare ecran existent.

---

## 17. Întrebări deschise

Fiecare întrebare are o recomandare. Ecranele o urmează până la răspuns.

### A. Poziționare și site

- **A1.** „Privați – comunitate” și „Privați”: le-am înțeles ca (a) asociații, ONG-uri, cluburi, festivaluri, rețele de membri și (b) afaceri: pensiuni, restaurante, ghizi, organizatori. E corect? ICP-ul intern spune că operatorii privați sunt în afara țintei, deci se schimbă poziționarea. Mai trebuie hotărât dacă pachetele și prețurile rămân aceleași pentru privați.
- **A2.** Numele: familia de „locuri” (Atrium, Scena, Forum, Panorama, Vatra, Agora, Vitrina), cu alternativele din §5. **Recomand** familia propusă, aceeași în RO și EN.
- **A3.** Limbile de pe site și din onboarding: **decis (29.09):** site-ul rămâne doar în engleză.
- **A4.** Țările și moneda: grila e în RON. **Recomand** plata cu cardul doar pentru clienții din România, în RON, la lansare. Clienții din alte țări trec prin ofertă. EUR și taxarea inversă din UE rămân pentru mai târziu.
- **A6.** Adresele în două limbi: **decis (29.09):** nu e cazul, site-ul rămâne în engleză, la adresele de azi.
- **A7.** Pagina de ajutor de azi promite exportul datelor după anulare și o reducere pentru ONG-uri. Planul nu are reguli pentru ele. Le păstrăm pe site?
- **A5.** Paginile de Soluții: **decis (29.09):** nu acum.

### B. Parcursul

- **B1.** Trial: **decis (28.09):** orice spațiu nou primește 30 de zile cu toate funcționalitățile, inclusiv domeniul propriu, fără reguli de eligibilitate.
- **B2.** Trial-ul rămâne fără card? **Recomand** da: pentru instituții, un card cerut la intrare oprește evaluarea.
- **B3.** Plata în timpul trial-ului: **recomand** ca pachetul să pornească imediat și facturarea azi, iar zilele de trial rămase se pierd. Alternativa e ca facturarea să pornească la finalul trial-ului, dar atunci pachetul ales nu poate fi activ din prima zi.
- **B5.** Butonul „+30 de zile” în Admin, pentru contractele în lucru: **recomand** da, fără limită, cu o notă obligatorie.
- **B6.** Ghidul de început: o listă de pași în Dashboard, fără popup de bun venit și fără slideshow (§4.6). **Decis.**
- **B7.** Clientul care vrea doar Helpdesk: **recomand** ca pasul de template să fie sărit, iar spațiul să primească doar pagina de acasă de rezervă, fără o opțiune „Blank” vizibilă.
- **B8.** Autentificarea cu Google sau Microsoft: **recomand** să rămână doar codul pe e-mail la lansare. Instituțiile au adesea e-mail pe domeniul propriu.
- **B9.** E-mailul de reamintire GUIDE-001: **recomand** unul singur, în ziua 3, doar în trial și doar dacă au rămas pași. Fără push.
- **B10.** Spațiul nou pornește privat și devine public la pasul „Publică site-ul”? **Recomand** da: azi, conținutul demo al template-ului e public și poate fi indexat din prima secundă.
- **B12.** Previzualizarea template-ului: **decis (28.09):** fără previzualizare în asistent; template-urile stau într-o grilă mare. Nici pe site nu există „Vezi demo”: demo-ul e chiar template-ul, în onboarding, cu trial-ul deblocat.
- **B11.** Cine vede ghidul: **recomand** proprietarii și dezvoltatorii. Editorii și agenții invitați văd Dashboard-ul fără ghid.

### C. Stripe

- **C11.** Alegerea abonamentului: **decis (28.09): varianta A**, pachetele se deschid, peste tot.

- **C1.** Ce se poate plăti cu cardul: **decis (29.09):** orice pachet, cu module, Enterprise inclus, fiindcă prețul lui e pe pagină. Oferta rămâne deschisă oricui o cere.
- **C2.** Lunar și anual, amândouă pe card? **Recomand** da.
- **C3.** Grația la plata eșuată: **recomand** 7 zile, cu notificări în zilele 0, 3 și 6, apoi suspendarea.
- **C4.** Downgrade-ul la finalul perioadei, upgrade-ul imediat cu proratare: **recomand** da.
- **C5.** Rambursările: pagina de ajutor promite „30 de zile banii înapoi”. **Recomand** să renunțăm la promisiune, cu anulare oricând și efect la finalul perioadei, fără rambursări automate. Excepțiile le tratează echipa, din Stripe.
- **C6.** Portalul Stripe: cardul, chitanțele și datele de facturare. Fără anulare (se face din pagina Abonament, cu motivul) și fără schimbarea planului.
- **C7.** TVA-ul: **decis (28.09):** prețul din grilă e prețul final, cu TVA inclus, peste tot. Cota e fixă, fără Stripe Tax, cât vindem doar în România.
- **C8.** Schimbarea de preț pentru abonamentele existente: **recomand** ca noul preț să se aplice la următoarea reînnoire, cu un anunț cu 30 de zile înainte.
- **C9.** E-mailurile către client: **recomand** ca ale noastre (Noticed) să acopere tot ce e în §14, inclusiv 3-D Secure (PAY-003). Stripe trimite doar chitanța, pe e-mailul de facturare.
- **C10.** Metodele de plată: **recomand** card, Apple Pay și Google Pay. Transferul bancar rămâne pe contract.

### D. Facturarea

- **Decis (28.09):** facturarea fiscală rămâne în afara platformei, deocamdată (§8). Datele de facturare vin din Checkout (§9).
- **D1.** Cine emite factura după PAY-006 și în cât timp? **Recomand** o persoană numită, în aceeași zi lucrătoare.

### E. Oferta

- **E1.** Tichetul de ofertă merge la Vânzări sau la Suport?
- **E2.** Cine răspunde la cereri și în cât timp? **Recomand** o zi lucrătoare, scris pe ecranul de confirmare.

### S. Template-urile

- **S1.** Cine produce conținutul celor 7 (texte RO + EN, imagini cu licență) și până când?
- **S2.** Pachetul recomandat pentru fiecare template (tabelul din §5) se preselectează pe „Alege abonamentul”? **Recomand** da, cu eticheta „Recomandat pentru …”, iar clientul poate alege altul.
- **S3.** Conținutul pentru module plătite: trial-ul le deblochează pe toate, dar după alegerea abonamentului ce nu e plătit se ascunde. **Recomand** ca template-urile să conțină doar conținut Web, iar modulele să fie pomenite pe card.
- **S4.** Tema: există una singură (`city`). Rămân toate pe ea, diferențiate prin conținut și culori? **Recomand** da pentru lansare.

### H. Dashboard

- **H1.** Numele filei: „Dashboard”, cum ai cerut, sau „Acasă”? **Recomand** „Dashboard”, la fel în RO și EN.
- **H2.** Membrii limitați la anumite pagini (`cms_page_scoped?`): azi ajung direct în paginile lor. **Recomand** să aterizeze tot pe Dashboard, cu o singură dală, „Paginile tale”.
- **H3.** Activitatea recentă din toate modulele (cine ce a modificat): **recomand** să vină într-o a doua versiune. Prima are ghidul, starea, statisticile și scurtăturile.
- **H4.** Dashboard-ul CMS de azi (hero, creare rapidă, „Sari la”, analytics, activitate) rămâne pagina de start a filei „Site web”? **Recomand** da, doar dala „Linkuri și QR” se mută în Dashboard.
- **H5.** Perioada statisticilor: **recomand** ultimele 30 de zile, fix, cu „Vezi tot” spre modul. Un selector 7 / 30 / 90 de zile, mai târziu.

### I. Ce lipsea (după revizuirea Dashboard-ului)

- **I1.** Facturile fiscale în aplicație: **decis (28.09):** nu, deocamdată. Le trimite echipa pe e-mail. Pagina Abonament arată doar chitanțele Stripe, din Portal.
- **I2.** Exportul datelor la plecare: DPA-ul cere de obicei returnarea datelor la încetare, iar Tranziția a amânat exportul (decizia 9). **Recomand** un export (pagini, media, tichete, ca arhivă) înaintea lansării anulării self-serve.
- **I3.** Ștergerea spațiului de către proprietar există deja în eventya (`Workspace::RemoveController`, cu adresa tastată), imediat și definitiv, iar abonamentul se șterge odată cu contul. **Recomand:** întâi se anulează abonamentul Stripe, altfel plățile continuă, apoi 30 de zile în care ștergerea se poate anula.
- **I4.** Transferul proprietății: la instituții, oamenii pleacă. Mai mulți proprietari sunt deja posibili, din rolul din Echipa. **Recomand** doar regula că spațiul are mereu cel puțin un proprietar.
- **I5.** Contactul de facturare separat de proprietar: **recomand** ca PAY-002 și PAY-003 să ajungă și pe e-mailul de facturare, nu doar la proprietari.
- **I6.** Pauza sezonieră (stațiuni, destinații mici): Stripe o permite. **Recomand** să nu intre la lansare. Anularea și reluarea acoperă cazul.
- **I7.** Istoricul abonamentului: azi fiecare cont are un singur rând de abonament, fără istoric (auditul se șterge după 14 zile), iar „none” din Admin șterge rândul. **Recomand** tabelul `stejar_subscription_events` (cine, sursa: admin, webhook sau job, înainte și după, nota) încă din F6, pentru „+30 de zile” cu nota lui și pentru suport. Lista pe pagina Abonament poate veni după lansare.
- **I8.** Noutățile Eventya (Developer Announcements) pe Dashboard: **recomand** un singur rând discret, sub cele două coloane, cât există un anunț necitit.
- **I9.** Rapoartele AI: sunt pentru toți proprietarii sau doar pentru pachetele cu AI? **Recomand** să le vadă doar cine are AI (editor, vizitatori sau helpdesk).

### G. Livrarea și măsurarea

- **G1.** Livrarea: pe feature, fiecare cu drumul lui până în producție, ca în storyboard, sau un singur PR, ca la Tranziție? **Recomand** pe feature, cu plățile ascunse sub comutator.
- **G2.** Măsurarea: **decis (29.09):** fără pâlnie în Admin deocamdată. GA4 rămâne, doar după consimțământ.
- **G3.** Cine rescrie Termenii, Confidențialitatea și DPA: un jurist sau echipa?
- **G4.** Turnstile pe creare cont și autentificare: **recomand** da.

---

## 18. Ecranele

**Fluxul, clic cu clic:** site (3, 4 sau 5) → cont (6: numele, e-mailul, codul) → proiectul (7) → template-ul (8) → pregătirea, cu trial-ul pornit (12) → Dashboard-ul din prima zi, cu ghidul (17). Abonamentul se alege din spațiu: „Trial · N zile” din bară sau rândul „Abonament” din Dashboard duc la „Alege abonamentul” (9), de acolo la plata cu cardul (10) sau la cererea de ofertă (11), apoi înapoi în Dashboard (18). După plată, „Abonament” duce la pagina Abonament (19), iar de acolo „Schimbă pachetul” la ecranul 13. Între ecranele fluxului, conținutul trece printr-un fondu scurt, iar antetul rămâne pe loc (`flow.css`, View Transitions).

**Harta**
1. [Storyboard](01-storyboard.html): fiecare feature, de la implementare la producție.
2. [Harta parcursului](02-harta-parcursului.html): toate intrările, cazurile de autentificare, drumul spre abonament și scenariile de margine.

**Site-ul**
3. [Antetul și butoanele, după stare](03-site-antet.html): anonim, logat fără spații, logat cu spații.
4. [Pagina de prețuri](04-pagina-preturi.html): calculatorul public, cu „Începe gratuit” și „Cere ofertă”.
5. [Soluții](05-solutii.html): cele 7 template-uri pe site.

**Contul și asistentul**
6. [Contul](06-cont.html): cont nou (câte un câmp pe pas), autentificare, codul.
7. [Pasul 1 · Proiectul](07-pas-detalii.html): doar numele.
8. [Pasul 2 · Template-ul](08-pas-template.html): grila, fără previzualizare.
12. [Pregătirea spațiului](12-spatiu-gata.html), cu trial-ul pornit, care trece singură la Dashboard.

**Abonamentul, din spațiu**
9. [Alege abonamentul](09-alege-abonamentul.html): în trial, cu selecția de pe site.
10. [Plata cu cardul](10-stripe-checkout.html): pagina Stripe (schematic), cu datele de facturare, confirmarea, plata anulată.
11. [Cererea de ofertă trimisă](11-cerere-contract.html)
13. [Abonamentul în spațiu](13-abonament-in-spatiu.html): pe card, plată eșuată, anulat, suspendat.

**După onboarding**
14. [Admin](14-admin.html): fișa Stripe, trial +30, pâlnia.
15. [E-mailuri și notificări](15-emailuri.html)
16. [Checklist pentru testarea pe staging](16-checklist-staging.html)

**Dashboard și ghidul de început**
17. [Dashboard-ul din prima zi](17-ghid-de-inceput.html): ghidul de început, indiciul la pas, publicarea.
18. [Dashboard-ul în uz](18-dashboard.html): salutul, „+ Creează”, patru cifre, modulele și spațiul de lucru.
19. [Pagina Abonament](19-abonament.html): pe card, pe contract, trial, anularea, anulat.

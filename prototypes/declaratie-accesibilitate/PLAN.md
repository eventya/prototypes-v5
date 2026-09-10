# Declarația privind accesibilitatea — plan de implementare

## 1. De ce facem asta

Orice instituție publică din România este obligată prin lege să publice pe site o **declarație privind accesibilitatea**. Este un document public, cu o formă fixată prin lege, în care instituția spune deschis cât de accesibil este site-ul ei pentru persoanele cu dizabilități și ce anume nu este încă accesibil.

| Actul normativ | Ce stabilește |
|---|---|
| **Directiva (UE) 2016/2102** | Obligația de accesibilitate pentru site-urile și aplicațiile mobile ale instituțiilor publice. |
| **OUG 112/2018**, aprobată **fără modificări** prin **Legea 90/2019** | Transpunerea în dreptul român. Adaugă obligații mai stricte decât directiva — vezi secțiunea 5. |
| **Decizia (UE) 2018/1523** | Modelul european de declarație. |
| **Normele ADR din 06.12.2022** (MO 1257/28.12.2022), **anexa nr. 1** | **Modelul obligatoriu în România.** Acesta este textul pe care îl generăm. |
| **EN 301 549 V2.1.2** sau versiuni ulterioare, care preia **WCAG 2.1 nivel AA** | Standardul tehnic după care se măsoară accesibilitatea. |
| **Ghidul tehnic ADR** (v1.0, februarie 2023) | Documentul prin care ADR explică cerințele și metodele de verificare. Vezi secțiunea 5.9. |

Verificarea și sancționarea le face **Autoritatea pentru Digitalizarea României (ADR)**.

### Amenzile

OUG 112/2018, art. 11, exprimă amenzile în *puncte*, iar alin. (2) definește: **un punct = salariul minim brut pe țară garantat în plată.** Nu există o sumă fixă în lege.

| Fapta | Amenda |
|---|---|
| Nepublicarea declarației | **4–5 puncte** |
| Neactualizarea declarației | **1–2 puncte** |
| **Neîndeplinirea cerințelor de accesibilitate** (art. 3) | **5–10 puncte** |

Ca ordin de mărime: la un salariu minim brut de aproximativ 4.050 lei, nepublicarea declarației înseamnă în jur de 16.000–20.000 lei, iar neîndeplinirea cerințelor de accesibilitate poate ajunge la circa 40.000 de lei. Valoarea exactă se recalculează la salariul minim în vigoare — de verificat înainte de a o folosi într-o discuție comercială.

Două observații care schimbă felul în care vorbim despre asta:

1. **Amenda cea mare nu e pentru lipsa declarației, ci pentru lipsa accesibilității** (5–10 puncte față de 4–5). Declarația este documentul; obligația de fond este site-ul.
2. **Există o amendă separată pentru neactualizare.** Nu e suficient să publici declarația o dată. Vezi secțiunea 5.

Clienții noștri sunt primării, muzee, centre culturale și consilii județene. Toate intră sub această obligație. În momentul de față, niciun site pe care îl livrăm nu are declarația.

În discuția comercială folosim argumentul **„conformitate livrată, nu promisă"**. Ca să fie adevărat, declarația trebuie generată automat de platformă, nu scrisă de client într-o pagină obișnuită de CMS.

---

## 2. Ce livrăm, în cuvinte simple

O secțiune publică numită **„Accesibilitate"**, una pentru fiecare workspace, la o adresă fixă de tipul `client.ro/accesibilitate`, care conține:

- **declarația privind accesibilitatea**, în forma cerută de lege;
- **datele de contact ale responsabilului cu accesibilitatea** desemnat de instituție;
- **evaluarea sarcinii disproporționate**, atunci când instituția invocă acest temei.

Toate trei sunt cerute expres — vezi secțiunea 5. Din conținutul declarației, **partea cea mai mare o completează platforma automat.** Clientul scrie doar ce anume de pe site-ul lui nu este accesibil și pe cine contactează cetățeanul.

Secțiunea există din prima zi a workspace-ului, în toate limbile site-ului, și este legată automat din subsolul fiecărei pagini.

---

## 3. Regula după care se ordonează tot planul

> **Nu publicăm declarația înainte ca ea să spună adevărul.**

O declarație falsă nu este o greșeală de formă. Produce două efecte reale:

1. **Clientul rămâne cu amenda.** El semnează declarația și el răspunde în fața ADR.
2. **Noi rămânem cu răspunderea față de client**, pentru că afirmația a fost generată de platforma noastră.

Mai grav: o declarație care afirmă conformitatea fără să o aibă îl expune pe client la amenda mai mare, cea de la art. 3 (5–10 puncte), și îi și semnalează ADR-ului unde să se uite.

Din această regulă decurg trei decizii care structurează tot restul:

1. **Nicăieri în platformă nu există un câmp în care cineva să aleagă „site-ul este conform".** Valoarea este calculată, nu scrisă de un om.
2. **Clientul poate declara doar o situație mai proastă decât cea a platformei, niciodată una mai bună.**
3. **Prima etapă de lucru este verificarea tehnică a site-urilor, nu construirea paginii.**

---

## 4. Modelul oficial

Modelul obligatoriu în România este **anexa nr. 1 la Normele ADR din 06.12.2022**. Este o preluare a modelului european din Decizia 2018/1523, cu o diferență esențială, explicată mai jos.

### Structura oficială

Legea numerotează **două secțiuni**:

- **SECȚIUNEA 1 — Conținutul obligatoriu**
- **SECȚIUNEA a 2-a — Conținutul opțional**

În interiorul secțiunii 1 există cinci titluri fixe, plus paragraful de angajament care deschide documentul și nu are titlu:

| Ordinea | Titlul oficial |
|---|---|
| — | *(paragraful de angajament, fără titlu)* |
| 1 | **Situația conformității** |
| 2 | **Conținutul inaccesibil** |
| 3 | **Elaborarea prezentei declarații privind accesibilitatea** |
| 4 | **Feedback și date de contact** |
| 5 | **Procedura de asigurare a aplicării** |

> ⚠️ Când vorbim intern despre „secțiunile 2–5 pe care le editează clientul", folosim o numerotare a noastră. **Nu este numerotarea din lege.** Merită spus explicit în interfață, ca nimeni să nu creadă că „secțiunea 3" este un termen juridic.

### Formulările oficiale

Angajamentul:

> *(denumirea organismului din sectorul public) se angajează să asigure accesibilitatea site-ului(-urilor) său/sale web și/sau a aplicației(ilor) sale mobile în conformitate cu Ordonanța de urgență a Guvernului nr. 112/2018 …, aprobată prin Legea nr. 90/2019.*
> *Prezenta declarație privind accesibilitatea este valabilă pentru …*

Situația conformității — se alege **una** dintre trei variante:

| Varianta | Textul oficial | Când se alege |
|---|---|---|
| a) | „…este/sunt **pe deplin conform(ă)(e)** cu O.U.G. nr. 112/2018." | numai dacă **toate** cerințele standardului sunt îndeplinite integral, fără excepții |
| b) | „…este/sunt **parțial conform(ă)(e)** cu O.U.G. nr. 112/2018, ca urmare a neconformității(lor) și/sau exceptărilor menționate mai jos." | dacă **majoritatea** cerințelor sunt îndeplinite, cu unele excepții |
| c) | „…**nu este/sunt conformă/conforme** cu O.U.G. nr. 112/2018." | dacă **majoritatea** cerințelor **nu** sunt îndeplinite |

Conținutul inaccesibil — trei temeiuri, cu titlurile lor:

> „Conținutul indicat mai jos nu este accesibil din următoarele motive:"
> a) **neconformitate cu O.U.G. nr. 112/2018**
> b) **sarcină disproporționată**
> c) **conținutul nu intră sub incidența legislației aplicabile**

Elaborarea: „Prezenta declarație a fost elaborată la data …" și „Declarația a fost revizuită ultima dată la …".

Procedura de asigurare a aplicării — modelul dă chiar datele de contact:

> **Autoritatea pentru Digitalizarea României (ADR)**, Bd. Libertății nr. 14, București, sector 5
> e-mail: monitorizare.accesibilitateweb@adr.gov.ro

### Conformitatea se declară față de ordonanță, nu față de standard

Este detaliul cel mai ușor de ratat. Modelul românesc raportează conformitatea la **O.U.G. nr. 112/2018**. Standardul — EN 301 549, care preia WCAG 2.1 AA — rămâne instrumentul prin care se măsoară, dar afirmația publică se face față de ordonanță.

Pe pagină scriem forma legală și explicăm standardul într-o propoziție separată, ca cititorul să înțeleagă ce anume s-a măsurat. Terminologia modelului se respectă la fel de strict: se spune **„exceptări"**, nu „excepții".

### Un detaliu care ne ajută

Modelul european cere să se indice **metoda** folosită la elaborarea declarației. **Modelul românesc nu are acest câmp.** Îl păstrăm totuși, ca informație suplimentară — secțiunea a 2-a permite „orice alt tip de conținut considerat adecvat", iar punctul 5 din conținutul opțional prevede explicit linkul către un raport de evaluare. Transparența metodei este exact ce ne diferențiază comercial.

---

## 5. Ce adaugă legea românească peste model

Ordonanța și normele merg mai departe decât modelul european. Fiecare obligație de mai jos are consecință directă asupra a ce construim.

### 5.1 Declarația se reînnoiește **anual**, iar la o problemă constatată se actualizează **în 3 zile**

> OUG 112/2018, art. 6 alin. (1): organismele „oferă **anual** și actualizează ori de câte ori este cazul, **în termen de 3 zile de la constatare**" declarația.

La nivel european, revizuirea anuală este doar *recomandată*. În România este **obligatorie**, cu amendă separată pentru neactualizare (1–2 puncte).

**Ce construim:** o sarcină programată care, o dată pe an, republică declarația fiecărui workspace și marchează data revizuirii. Și un traseu scurt de la „am găsit o problemă" la „declarația e actualizată", ca să încapă în trei zile — practic, verificarea automată care descoperă o regresie trebuie să poată declanșa o republicare, nu doar un raport.

### 5.2 Răspunsul la o sesizare: **30 de zile de la înregistrare**

> OUG 112/2018, art. 6 alin. (5): „…un răspuns adecvat pentru fiecare informare sau solicitare, **în termen de 30 de zile de la data înregistrării solicitării**."

Directiva spune doar „într-o perioadă de timp rezonabilă"; România pune un număr.

**Ce construim:** termenul se scrie pe pagină și în e-mailul de confirmare. Tichetul creat în Helpdesk primește un termen de 30 de zile de la înregistrare.

### 5.3 Evaluarea sarcinii disproporționate se **publică**, alături de declarație

> OUG 112/2018, art. 4 alin. (7): organismul „are obligația de a publica pe propriul site **evaluarea** prevăzută la alin. (2), împreună cu declarația privind accesibilitatea".

Nu este suficient să scrii în declarație „arhiva de PDF-uri este o sarcină disproporționată". Evaluarea care a dus la concluzia asta trebuie publicată.

**Ce construim:** un câmp de text bogat, publicat ca document separat în aceeași secțiune „Accesibilitate", legat din dreptul temeiului (b). Apare numai dacă instituția invocă temeiul respectiv.

### 5.4 Motivele care **nu** pot fi invocate

> OUG 112/2018, art. 4 alin. (5): nu pot fi motive legitime **lipsa încadrării acțiunii ca prioritară**, **constrângerea temporală** și **lipsa cunoștințelor în materie**. Nici achiziționarea sau nedezvoltarea unui CMS accesibil.

**Ce construim:** în editorul de excepții, pe temeiul „sarcină disproporționată", un avertisment explicit cu aceste patru motive. Un client care scrie „nu am avut timp" trebuie oprit acolo, nu descoperit de ADR.

### 5.5 Instituția desemnează un **responsabil cu accesibilitatea**, iar datele lui se publică

> Normele ADR, art. 7 alin. (1)–(2): reprezentantul legal numește prin act administrativ un responsabil cu accesibilitatea; administratorul site-ului creează **pe prima pagină** o secțiune numită **„Accesibilitate"**, unde publică **datele de contact ale responsabilului** și declarația.

**Ce construim:** un câmp nou, obligatoriu, pentru numele și contactul responsabilului. Și confirmarea că denumirea secțiunii și adresa `/accesibilitate` sunt exact ce cere norma.

### 5.6 Declarația se fundamentează pe o analiză asumată

> Normele ADR, art. 8: echipa responsabilă întocmește o analiză privind implementarea cerințelor tehnice — modalitatea, instrumentele, standardul folosit, termene, resurse și elemente privind sarcina disproporționată. Analiza este **asumată de reprezentantul legal** și „reprezintă fundamentarea pentru completarea declarației".

**Ce facem:** raportul verificării automate a platformei acoperă modalitatea, instrumentele și standardul. Îl punem la dispoziția clientului ca document descărcabil, pe care instituția îl poate anexa propriei analize. Nu îl semnăm în locul ei — asumarea este a reprezentantului legal.

### 5.7 O singură declarație poate acoperi site-ul și aplicațiile

> Normele ADR, art. 9: instituția poate emite fie o declarație pentru fiecare site și aplicație, fie **una singură** pentru toate.

Alegem varianta a doua. Este exact ce făcea deja prototipul.

### 5.8 „Audit terț" înseamnă ceva anume

> OUG 112/2018, art. 7 și 9 alin. (2): conformitatea se evaluează de **organisme de inspecție de tip A, acreditate de RENAR**. Normele ADR: raportul de inspecție este valabil **3 ani**.

**Ce construim:** peste tot unde interfața vorbește despre o evaluare externă, termenul folosit este „**organism de inspecție acreditat RENAR**". Nu orice firmă de consultanță produce un raport care contează în fața ADR.

### 5.9 Ce spune Ghidul ADR și cum verifică ADR în practică

Ghidul tehnic al ADR (v1.0, februarie 2023) și rapoartele anuale de monitorizare arată exact ce se întâmplă la o verificare. Patru lucruri contează pentru noi.

**Standardul este EN 301 549 V2.1.2 sau versiuni ulterioare.** Ordonanța, scrisă în 2018, trimite la V1.1.2. Ghidul ADR corectează: obligația este față de **V2.1.2**, care preia WCAG 2.1. În fișierul de evaluare scriem versiunea standardului, nu doar „WCAG 2.1 AA".

**Documentele PDF sunt explicit în domeniul de aplicare.** Capitolul 10 din EN 301 549 este dedicat documentelor electronice — PDF, text, foi de calcul. Exceptarea noastră implicită despre arhivele de PDF-uri nu este o precauție inventată de noi, ci acoperă o cerință reală a standardului.

**ADR verifică automat, cu un instrument public, și dă un scor.** Raportul de monitorizare pe 2025 spune ce folosește: **AChecker+**, modulele WCAG 2.1 AA desktop și mobil, cu praguri fixe — **0–49 „inaccesibil", 50–89 „parțial accesibil", 90–100 „accesibil"**. Baza de monitorizare are 12.682 de organisme, iar eșantionul se calculează după Decizia (UE) 2018/1524.

*Consecință:* verificarea noastră trebuie să prindă cel puțin ce prinde a lor. Raportul pe 2025 listează **cele șapte neconformități găsite cel mai des**, care devin lista obligatorie a verificării noastre:

| # | Neconformitatea găsită de ADR | Prinsă automat? |
|---|---|---|
| 1 | Focalizare / vizibilitate limitată la navigarea cu tastatura | parțial — necesită și verificare manuală |
| 2 | Contrast redus pentru textul conținutului | da |
| 3 | Câmpuri de formular neasociate corect cu etichetele | da |
| 4 | Imagini fără text alternativ | da |
| 5 | Tabele de date fără celule de antet codificate corect | da |
| 6 | Corelații greu de stabilit între elemente | nu — verificare manuală |
| 7 | Lipsa valorii semantice pentru structura paginii | da |

**O evaluare făcută în timpul dezvoltării nu poate susține o declarație de conformitate.** Ghidul spune asta explicit: evaluările din etapele de proiectare „nu trebuie utilizate pentru a face declarații de conformitate cu site-ul finalizat".

*Consecința:* verificarea din procesul de integrare are rolul de **a nu lăsa o regresie să ajungă în producție**. Valoarea care ajunge în `config/accessibility.yml` se ia dintr-o **rulare pe un site de referință deja publicat**, cu conținut real, nu dintr-o rulare pe o ramură de dezvoltare. Același job, două momente și două roluri diferite.

**Automat și manual, împreună.** Ghidul cere explicit ambele metode. Lista manuală o parcurgem la fiecare livrare importantă și acoperă exact punctele 1 și 6 din tabel.

**Conținutul preluat de la terți are o regulă proprie.** Ghidul cere ca acel conținut să fie monitorizat și reparat „în termen de două zile lucrătoare" și ca cel neconform să fie marcat clar pe fiecare pagină unde apare. Este mai strict decât credeam și privește direct hărțile și materialele video încorporate.

**Reevaluarea se face periodic, la 3 ani**, sau mai devreme dacă problemele au fost reparate. Raportul de inspecție al unui organism acreditat are aceeași valabilitate.

---

---

## 6. Cum stabilim situația conformității

```
Verificarea automată rulează la fiecare modificare de cod
        ↓  (produce un raport)
Fișierul  config/accessibility.yml  din stejar
        ↓  (citit de platformă la afișarea paginii)
Declarația fiecărui workspace
        ↓  (clientul poate doar înrăutăți valoarea)
Ce citește cetățeanul pe pagină
```

### Pasul 1 — verificarea automată

La fiecare modificare de cod, un program verifică un set fix de pagini ale temei publice și raportează problemele găsite. Detaliile sunt în secțiunea 11.

### Pasul 2 — rezultatul se scrie într-un fișier din codul platformei

```yaml
standard:      "EN 301 549 V2.1.2 (WCAG 2.1 AA)"   # instrumentul de măsură
status:        partially_conformant          # sau: conformant | non_conformant
method:        self_assessment               # sau: accredited_inspection
assessed_on:   2026-10-14
reviewed_on:   2026-10-14
report_url:    "https://…/raport-2026-10.html"
known_issues:                                # exceptările valabile pentru toate site-urile
  - key: pdf_uploads
    basis: non_conformance
  - key: embedded_maps
    basis: out_of_scope
```

Cele trei valori posibile pentru `status` sunt exact cele trei variante din model, iar regula de alegere vine tot din model: **a)** numai dacă *toate* cerințele sunt îndeplinite; **b)** dacă *majoritatea* sunt îndeplinite; **c)** dacă *majoritatea nu* sunt.

**De ce un fișier în cod și nu un tabel în baza de date, cu un ecran de administrare.** Trei motive, în ordinea importanței:

1. **Un ecran de administrare înseamnă un buton prin care cineva poate declara conformitatea fără să o fi verificat.** Un fișier din cod nu poate fi modificat decât printr-o schimbare pe care o citește și o aprobă un alt coleg înainte ca ea să ajungă în producție. Exact aceasta este bariera pe care o vrem în fața unei afirmații cu valoare juridică.
2. **Conformitatea este o proprietate a versiunii de cod, nu a datelor clientului.** Codul temei publice se schimbă la fiecare livrare, iar accesibilitatea paginilor se schimbă odată cu el.
3. **Data ultimei revizuiri se actualizează în același pas în care rulează verificarea**, nu de cineva care își aduce aminte. Iar obligația de la 5.1 face din asta o cerință legală, nu o comoditate.

Nu avem nevoie de un tabel de audituri și nici de o bibliotecă de urmărire a versiunilor. Istoricul evaluărilor este istoricul modificărilor fișierului.

### Pasul 3 — clientul poate doar înrăutăți valoarea

Materialul pe care îl încarcă el — documente PDF scanate, hărți, conținut preluat din alte surse — poate doar să scadă accesibilitatea site-ului. Regula: **se afișează varianta mai proastă** dintre valoarea platformei și valoarea aleasă de client, în ordinea `pe deplin conform` → `parțial conform` → `neconform`.

Opțiunile mai bune decât valoarea platformei sunt afișate, dar dezactivate, cu motivul scris alături. Un client care are un raport de la un organism acreditat RENAR și vrea să declare mai mult discută cu noi.

### Pasul 4 — cât timp nu există evaluare, nu există pagină

Dacă `config/accessibility.yml` nu are o dată de evaluare completată, pagina publică răspunde cu 404, iar ecranul de setări este inactiv. Este mecanismul prin care regula „întâi verificarea, apoi declarația" nu poate fi ocolită din grabă.

---

## 7. Unde salvăm datele

**Adăugăm un singur tabel nou.** Restul se așază în locuri care există deja.

### Textele scrise de client → `account.settings['accessibility']`

Lângă `legal_data` și `legal_contact`, care există deja în `app/models/stejar/account.rb`:

```ruby
{
  "officer" => { "name" => "…", "email" => "…", "phone" => "…" },  # responsabilul, obligatoriu
  "exceptions" => [
    { "basis" => "non_conformance",
      "key"   => "scanned_pdfs",
      "text"  => { "ro" => "…", "en" => "…" } },
    { "basis"      => "disproportionate_burden",
      "text"       => { "ro" => "…" },
      "assessment" => { "ro" => "…" },   # evaluarea publicată, cerută de art. 4 alin. (7)
      "review_on"  => "2027-06-01" }     # memento intern, nu o cerință legală
  ],
  "status_override"   => nil,
  "feedback"          => { "email" => "…", "phone" => "…", "helpdesk_form" => true },
  "accredited_audit"  => { "body" => "…", "report_url" => "…", "assessed_on" => "…" },
  "planned_measures"  => { "ro" => "…" }
}
```

Coloana `settings` este deja `jsonb`, deci nu este nevoie de nicio modificare a tabelului `accounts`.

### Istoricul → `stejar_accessibility_statement_versions`

| Coloană | Tip | Ce conține |
|---|---|---|
| `account_id` | uuid | Workspace-ul. |
| `revision` | integer | Numerotare separată pentru fiecare workspace. |
| `payload` | jsonb | **Textul complet al declarației, așa cum a fost afișat, în toate limbile.** |
| `status` | string | Situația conformității la momentul publicării. |
| `platform_digest` | string | Ce versiune a fișierului de evaluare era valabilă atunci. |
| `trigger` | string | `manual`, `anual` sau `constatare` — de ce s-a publicat. |
| `published_at` | datetime | Când. |
| `published_by_id` | bigint | Cine. Gol la republicarea anuală automată. |

Rândurile doar se adaugă. Coloana `trigger` există pentru că obligația anuală de la 5.1 trebuie să poată fi **dovedită**: fără ea, o inspecție nu poate distinge o declarație reînnoită la timp de una uitată.

**Salvăm textul complet, nu referințe.** O versiune din 2027 reconstituită în 2029 ar prelua numele instituției de atunci și textul standard de atunci. Ar fi o reconstituire, nu o dovadă. Ocupă în jur de 4 KB pe versiune.

---

## 8. Secțiunea „Accesibilitate", adresa și linkul din subsol

Ruta se declară în **eventya**, iar codul care o servește stă în **stejar** — tiparul folosit deja de `delete_user` și `all_reviews`.

```ruby
# eventya: config/routes/account_website.rb — DEASUPRA rutei generale de pagini CMS
get '/accesibilitate', to: 'stejar/website/accessibility_statements#show', as: :accessibility_statement
```

- **Funcționează în ambele forme de adresă**: `client.ro/accesibilitate` pe domeniu propriu și `eventya.net/uricani/accesibilitate` pe platformă.
- **Pagina arată ca restul site-ului.** Controllerul moștenește `Stejar::Website::BaseController` și primește identificarea workspace-ului, schimbarea limbii și macheta temei.
- **Numele secțiunii este „Accesibilitate"**, exact cum cere art. 7 alin. (2) din norme, iar pagina conține declarația, contactul responsabilului și, când e cazul, evaluarea sarcinii disproporționate.
- **Toate limbile, o singură adresă**: `/accesibilitate?locale=en`. Textele standard stau în fișierele de traducere ale platformei; textele clientului se completează pe fiecare limbă.
- **Adresa intră în lista de adrese rezervate** (`RESERVED_SLUGS`).
- **Pagina intră în `sitemap.xml`** și nu primește instrucțiune de neindexare.

### Linkul din subsol

`Themes::City::FooterComponent#legal_pages` construiește azi bara de jos dintr-un meniu configurabil din CMS. Adăugăm declarația **direct în cod, pe ultima poziție**:

```ruby
def legal_pages
  configured_legal_pages + [accessibility_statement_link]
end
```

Un element de meniu poate fi șters de oricine din CMS, fără să își dea seama ce a șters. Legea cere prezența linkului, deci nu este o preferință de conținut.

---

## 9. Mecanismul de feedback

Modelul cere „o descriere și un link către mecanismul de feedback", plus datele de contact ale persoanei responsabile. În practică: un formular, nu o adresă de e-mail pierdută în subsol.

**Nu construim un formular nou.** Platforma are deja formulare de sistem în `Stejar::Helpdesk::Form`: create automat, ascunse din lista de setări, imposibil de șters din interfață. Adăugăm unul pentru accesibilitate, după același tipar.

- **Cu modulul Helpdesk:** sesizarea devine tichet, cu **termen de 30 de zile de la înregistrare**, conform art. 6 alin. (5). Instituția are un fir de discuție, un termen și o urmă — exact ce trebuie să arate dacă ADR întreabă.
- **Fără modul:** rămân e-mailul și telefonul responsabilului cu accesibilitatea. Declarația rămâne conformă.
- **Formularul se afișează direct în pagină.** Elementul de CMS existent folosește un cadru separat (`iframe`), care mută focusul tastaturii și strică ordinea de navigare. Tocmai pe pagina care declară conformitatea, ar fi o contradicție.

---

## 10. Pagina trebuie să fie ea însăși accesibilă

- **un singur titlu principal** (`h1`) și subtitluri de același nivel (`h2`), fără salturi;
- **structură semantică reală** — `<main>`, `<nav>`, `<address>` — nu `div`-uri cu clase de stil;
- **contrast de cel puțin 4.5:1 în ambele teme**; culoarea de brand a clientului nu se aplică pe text mic;
- **navigare completă de la tastatură**, fără capcane de focus;
- **formularul**: etichetă reală pentru fiecare câmp, fiecare eroare legată de câmpul ei, confirmarea anunțată automat cititoarelor de ecran;
- **comutatorul de limbă**: limba declarată corect pe pagină și pe fiecare opțiune.

Aceasta este prima pagină pe care o va deschide un inspector. Dacă ea nu trece verificarea, restul declarației nu mai contează.

---

## 11. Verificarea automată — prima etapă de lucru

Un job cu **axe-core** și **Pa11y**, pe un set fix de pagini ale temei publice: prima pagină, o pagină de conținut, o listă, o hartă, un formular, căutarea și chiar pagina de declarație. Jobul acoperă obligatoriu **cele șapte neconformități pe care ADR le găsește cel mai des** (secțiunea 5.9).

Rulează în două momente, cu două roluri diferite:

| Când | Rolul |
|---|---|
| La fiecare modificare de cod | **Oprește integrarea** dacă apare o regresie. Nu produce afirmații publice. |
| Pe un site de referință publicat, cu conținut real | **Produce valoarea** care ajunge în `config/accessibility.yml` și raportul public. |

Separarea vine din Ghidul ADR: o evaluare din etapa de dezvoltare nu poate susține o declarație de conformitate pentru site-ul finalizat.

- raportul se publică și ajunge ca link în declarație; clientul îl poate descărca pentru analiza cerută de art. 8 din norme;
- ce nu poate fi verificat automat — vizibilitatea focalizării, corelațiile dintre elemente, ordinea logică de citire, dacă textele alternative chiar descriu imaginea — intră într-o listă de verificare manuală, parcursă la fiecare livrare importantă. Ghidul cere explicit ambele metode, folosite împreună.

**O precizare de realism.** Conform propriei documentații, axe-core acoperă în jur de 30–40% dintre criteriile WCAG. Instrumentul folosit de ADR are aceeași limită: raportul pe 2025 recunoaște că nu poate pune verificările în corespondență cu criteriile WCAG, corespondență posibilă doar printr-o inspecție aprofundată. Verificarea automată nu poate susține niciodată varianta a) din model, care cere ca *toate* cerințele să fie îndeplinite, fără excepții. Poate susține, în mod onest, varianta b). Pentru varianta a) este nevoie de un organism de inspecție acreditat RENAR — de aceea fișierul are și valoarea `accredited_inspection`.

---

## 12. Etapele de livrare

### Etapa 1 — verificarea *(fără ea nu se livrează nimic)*
1. Jobul axe-core + Pa11y, blocant la regresie.
2. Rezolvarea problemelor găsite în tema publică și în componentele comune.
3. Prima completare a fișierului `config/accessibility.yml`, revizuită de un coleg.

### Etapa 2 — generarea declarației
4. Codul care citește fișierul de evaluare și cel care compune declarația unui workspace.
5. Ruta publică, controllerul și pagina, **cu formulările oficiale din secțiunea 4**.
6. Traducerea textelor standard în cele șapte limbi ale platformei.
7. Linkul din subsol, adresa rezervată, intrarea în `sitemap.xml`.

### Etapa 3 — ce completează clientul
8. Ecranul Setări → Accesibilitate, vizibil doar proprietarului workspace-ului: responsabilul cu accesibilitatea, exceptările, evaluarea sarcinii disproporționate, contactul.
9. Formularul de sesizare, cu termenul de 30 de zile.
10. Tabelul de istoric și ecranul de versiuni.

### Etapa 4 — obligațiile recurente
11. **Republicarea anuală automată** și traseul „constatare → actualizare în 3 zile".
12. Ecranul din panoul de administrare: cine nu are responsabil desemnat, cui îi lipsește evaluarea publicată, care declarații se apropie de termenul anual.
13. Publicarea primei versiuni pentru toate workspace-urile existente.

---

## 13. Criterii de acceptare

| Cerința | Cum este îndeplinită |
|---|---|
| Orice workspace nou are declarația publicată din prima zi. | Pagina nu depinde de existența vreunei înregistrări în baza de date. |
| Câmpurile sunt precompletate. | Numele instituției, domeniul și aplicațiile vin din workspace; exceptările stabilite de noi sunt preluate automat; contactul vine din datele legale. |
| Clientul completează doar ce ține de el. | Responsabilul, exceptările, evaluarea sarcinii disproporționate, contactul, măsurile planificate. Angajamentul și procedura de asigurare a aplicării nu au formular. Situația conformității este calculată. |
| Linkul din subsol apare automat. | Adăugat în cod, nu ca element de meniu care poate fi șters. |
| Există în română și în celelalte limbi ale site-ului. | O singură adresă, cu `?locale=xx`. |
| Păstrăm istoricul declarațiilor. | Tabel separat, în care rândurile doar se adaugă. |
| **Declarația se reînnoiește anual.** | Sarcină programată care republică și marchează data revizuirii; coloana `trigger` dovedește reînnoirea. |
| **Sesizările primesc răspuns în 30 de zile.** | Termen pe tichetul de Helpdesk, afișat și pe pagină. |
| **Evaluarea sarcinii disproporționate este publicată.** | Document separat în aceeași secțiune, legat din dreptul temeiului (b). |

---

## 14. Riscuri

Un risc „rezolvat" printr-un obicei de lucru este de fapt un risc nerezolvat. De aceea lista este împărțită în două.

### A. Riscuri închise prin construcție

**Declarăm că site-ul este accesibil, deși nu este.**
Cel mai grav: amenda ajunge la client, iar răspunderea la noi. Nu se mai poate întâmpla pentru că nicăieri în platformă nu există un câmp în care cineva să scrie situația conformității. Valoarea este scrisă de verificarea automată, în fișierul din cod. Un om o poate schimba doar printr-o modificare de cod aprobată de un coleg și doar către o valoare mai proastă. În plus, un test automat oprește livrarea dacă cineva scrie „pe deplin conform" fără un raport de la un organism acreditat RENAR — modelul cere pentru varianta a) ca *toate* cerințele să fie îndeplinite, iar o verificare automată nu poate demonstra asta.

**Clientul încarcă 400 de documente PDF scanate, iar declarația devine falsă fără ca cineva să observe.**
Exceptarea despre documentele PDF este stabilită de noi și activă automat în orice workspace, iar clientul nu o poate șterge — o poate doar completa.

**Un editor creează o pagină de CMS cu adresa `/accesibilitate` și o ascunde pe a noastră.**
Ruta noastră este declarată înaintea rutei generale, deci câștigă întotdeauna. În plus, adresa este rezervată.

**Cineva șterge linkul din subsol.**
Nu este element de meniu. Este adăugat în cod.

**Un workspace privat își ascunde propria declarație legală.**
Paginile publice trec printr-o verificare care, pentru un workspace privat, cere autentificare. Fără o excepție, tocmai instituțiile care au cea mai mare nevoie de declarație ar rămâne neconforme. Controllerul sare peste verificare, cum face deja controllerul de configurare a aplicației mobile. Se închide accesul la conținut, nu la informațiile impuse de lege.

**Declarația se învechește și instituția ia amendă pentru neactualizare.**
Republicarea anuală este automată, nu depinde de client. Coloana `trigger` din istoric arată că a avut loc.

**Clientul invocă un motiv pe care legea îl respinge.**
Editorul de exceptări avertizează explicit, pe temeiul „sarcină disproporționată", că lipsa timpului, lipsa priorității și lipsa cunoștințelor nu sunt motive legitime.

**Culorile de brand strică contrastul chiar pe pagina care declară conformitatea.**
Culoarea de brand nu se aplică pe text mic pe această pagină.

**Declarația lipsește într-una dintre limbile site-ului.**
Un test automat parcurge toate titlurile oficiale în toate limbile platformei și semnalează prima lipsă.

### B. Riscuri care rămân deschise

| Riscul | Cine îl ține sub control |
|---|---|
| **Modelul se schimbă.** Normele ADR pot fi modificate, iar textul nostru ar rămâne în urmă. | Titlurile și formulările stau în fișierele de traducere, într-un singur loc. O modificare a normelor înseamnă o modificare de text, nu una de cod. Verificare la fiecare livrare importantă. |
| **Termenul de 3 zile de la constatare** presupune că cineva reacționează. | Verificarea automată poate declanșa republicarea, dar „constatarea" poate veni și dintr-o sesizare a unui cetățean. Aici rămâne un pas omenesc. |
| **Valoarea punctului de amendă** se schimbă odată cu salariul minim. | De recalculat înainte de fiecare discuție comercială. Nu o scriem ca sumă fixă nicăieri în platformă. |

---

## 15. Soluția, pe scurt

### În stejar

| Fișierul | Ce face |
|---|---|
| `config/accessibility.yml` | **Singura sursă a situației conformității.** Scris de verificarea automată, revizuit de un om. |
| `lib/stejar/accessibility/platform_statement.rb` | Clasă simplă. Citește fișierul de mai sus. |
| `lib/stejar/accessibility/statement.rb` | Clasă simplă. Compune declarația unui workspace, aplicând regula „se afișează varianta mai proastă". |
| `app/controllers/stejar/website/accessibility_statements_controller.rb` | O acțiune. Sare peste verificarea de vizibilitate a contului. |
| `app/views/stejar/website/accessibility_statements/show.html.erb` | Pagina, cu formulările oficiale. Marcaj semantic, fără JavaScript. |
| `app/models/stejar/accessibility/statement_version.rb` + migrarea | Istoricul. |
| `app/jobs/stejar/accessibility/annual_republish_job.rb` | Obligația anuală de la 5.1. |
| `app/controllers/stejar/workspace/settings_controller.rb` | O acțiune nouă, lângă cea pentru datele legale. |
| `app/views/stejar/workspace/settings/accessibility.html.erb` | Formularul din ecranele 3 și 4. |
| `config/locales/*/accessibility.yml` | Textele oficiale, în șapte limbi. |
| `Stejar::Helpdesk::Form` | O constantă în plus, pentru formularul de sesizare. |
| `Stejar::Account::RESERVED_SLUGS` | Un cuvânt în plus. |

### În eventya

| Fișierul | Ce face |
|---|---|
| `config/routes/account_website.rb` | O linie, deasupra rutei generale. |
| `app/themes/city/components/themes/city/footer_component.rb` | O linie, pentru linkul din subsol. |
| `.github/workflows/ci.yml` | Verificarea automată de accesibilitate. |

### Ce nu adăugăm

Nicio bibliotecă nouă. Nicio permisiune nouă. Nicio modificare a tabelului `accounts`. **Un singur tabel nou** și **o singură sarcină programată**, aceasta din urmă doar pentru că legea cere reînnoirea anuală.

### Dacă timpul este scurt

Etapa 1 și pașii 4–7 din Etapa 2 aduc conformitatea legală de bază pentru toate site-urile. **Etapa 4 nu este opțională**: fără republicarea anuală, clientul intră sub art. 11 alin. (1) lit. b). Ce se poate amâna este ecranul de administrare, nu jobul.

---

## 16. Ce nu construim

- **Un instrument de reparare automată a accesibilității.** Nu convertim documente PDF, nu generăm texte alternative și nu adăugăm peste site un widget de „accesibilitate". Astfel de suprapuneri sunt considerate, în majoritatea evaluărilor serioase, o înrăutățire mascată.
- **Un scor de accesibilitate pentru fiecare pagină din CMS.** Arată bine într-o prezentare, dar produce un număr cu care nimeni nu știe ce să facă.
- **Un ecran de administrare care stabilește situația conformității.** Lipsește intenționat. Motivele sunt în secțiunea 6.
- **Analiza cerută de art. 8 din norme, în locul instituției.** Îi dăm raportul tehnic; asumarea rămâne a reprezentantului ei legal.

---

## Surse

Textele au fost citite integral, în limba română, din următoarele surse:

- **Decizia de punere în aplicare (UE) 2018/1523** — [EUR-Lex, CELEX 32018D1523](https://eur-lex.europa.eu/legal-content/RO/TXT/?uri=CELEX:32018D1523), JO L 256/103 din 12.10.2018. *(Textul a fost obținut prin serviciul Cellar al Oficiului pentru Publicații — interfața EUR-Lex nu răspunde cererilor automate.)*
- **Directiva (UE) 2016/2102** — [CELEX 32016L2102](https://eur-lex.europa.eu/legal-content/RO/TXT/?uri=CELEX:32016L2102), în special art. 5 și art. 7.
- **OUG 112/2018**, MO 1105 din 27.12.2018 — [text integral](https://lege5.ro/Gratuit/gmytimrugeyq/ordonanta-de-urgenta-nr-112-2018-privind-accesibilitatea-site-urilor-web-si-a-aplicatiilor-mobile-ale-organismelor-din-sectorul-public), art. 4, 6, 7, 9, 11.
- **Legea 90/2019** — [text integral](https://lege5.ro/Gratuit/gmzdsojsgyza/legea-nr-90-2019-pentru-aprobarea-ordonantei-de-urgenta-a-guvernului-nr-112-2018-privind-accesibilitatea-site-urilor-web-si-a-aplicatiilor-mobile-ale-organismelor-din-sectorul-public): articol unic, aprobă ordonanța **fără modificări**.
- **Normele ADR din 06.12.2022**, MO 1257 din 28.12.2022 — [text integral](https://legislatie.just.ro/Public/DetaliiDocument/263193), art. 7–12 și **anexa nr. 1 (modelul obligatoriu)**.

- **Ghidul tehnic ADR** privind accesibilitatea și utilizarea resurselor internet, v1.0, februarie 2023 — [PDF pe adr.gov.ro](https://www.adr.gov.ro/accesibilitate-site-uri-web/), capitolele 2, 4 și 5.
- **Raportul ADR de monitorizare a accesibilității, 2025** — [PDF pe adr.gov.ro](https://www.adr.gov.ro/accesibilitate-site-uri-web/): instrumentul folosit, pragurile de scor și cele șapte neconformități cele mai frecvente.

Toate textele de mai sus au fost citite integral, în original.

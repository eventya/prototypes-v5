# Declarația privind accesibilitatea - plan de implementare

## 1. De ce

Orice instituție publică din România trebuie să publice pe site o **declarație privind accesibilitatea**: un document cu formă fixată prin lege, în care spune cât de accesibil este site-ul pentru persoanele cu dizabilități și ce anume nu este încă accesibil.

| Actul | Ce stabilește |
|---|---|
| **Directiva (UE) 2016/2102** | Obligația de accesibilitate pentru site-urile și aplicațiile instituțiilor publice. |
| **OUG 112/2018**, aprobată fără modificări prin Legea 90/2019 | Transpunerea în România. Adaugă termene și obligații peste directivă (secțiunea 5). |
| **Normele ADR din 06.12.2022, anexa nr. 1** | **Modelul obligatoriu al declarației.** Acesta este textul pe care îl generăm. |
| **EN 301 549 V2.1.2**, care preia **WCAG 2.1 nivel AA** | Standardul tehnic după care se măsoară. |

Verifică și sancționează **Autoritatea pentru Digitalizarea României (ADR)**. Amenzile sunt în puncte, iar **un punct = salariul minim brut pe țară** (OUG art. 11):

| Fapta | Amenda |
|---|---|
| Nepublicarea declarației | 4-5 puncte |
| Neactualizarea declarației | 1-2 puncte |
| Neîndeplinirea cerințelor de accesibilitate | 5-10 puncte |

Clienții noștri - primării, muzee, centre culturale, consilii județene - intră toți sub această obligație, și niciun site pe care îl livrăm nu are declarația. Argumentul comercial este „conformitate livrată, nu promisă". Ca să fie adevărat, declarația trebuie generată de platformă, nu scrisă de client într-o pagină de CMS.

---

## 2. Ce livrăm

O secțiune publică numită **„Accesibilitate"**, la `client.ro/accesibilitate`, legată automat din subsolul fiecărei pagini și disponibilă în toate limbile site-ului. Conține exact ce cere legea:

1. **declarația**, în forma din anexa nr. 1;
2. **datele responsabilului cu accesibilitatea** desemnat de instituție;
3. **evaluarea sarcinii disproporționate**, dacă instituția invocă acest temei.

Cine completează ce:

| Partea declarației | Cine |
|---|---|
| Angajamentul (instituția, site-ul, aplicațiile) | Platforma, din datele workspace-ului |
| Situația conformității | Auditul automat al site-ului; clientul nu o poate scrie |
| Conținutul inaccesibil | Ce a găsit auditul, în cuvinte, + exceptările adăugate de client |
| Elaborarea declarației (date) | Platforma |
| Feedback și date de contact | Clientul: responsabilul cu accesibilitatea |
| Procedura de asigurare a aplicării | Platforma, text identic pentru toți |

Declarația există de la primul audit al workspace-ului și se reînnoiește automat o dată pe săptămână.

---

## 3. Regula care ordonează planul

> **Nu publicăm declarația înainte ca ea să spună adevărul.**

O declarație falsă lasă amenda la client și răspunderea la noi - și îl expune pe client la amenda mai mare, cea pentru lipsa accesibilității. De aici decurg trei decizii:

1. **Situația conformității nu se scrie de mână în CMS.** Vine din auditul automat al fiecărui site (secțiunea 6).
2. **Clientul nu o poate schimba**, nici în bine, nici în rău. Poate doar să adauge ce știe el că nu e accesibil și pe ce temei.
3. **Prima etapă de lucru este verificarea site-urilor, nu construirea paginii.**

---

## 4. Modelul oficial

Anexa nr. 1 la Normele ADR preia modelul european, cu o diferență esențială: **conformitatea se declară față de O.U.G. nr. 112/2018**, nu față de standard. Standardul este instrumentul de măsură; afirmația publică se face față de ordonanță.

Legea numerotează două secțiuni: **Secțiunea 1 - conținutul obligatoriu** și **Secțiunea a 2-a - conținutul opțional**. În interiorul primei există paragraful de angajament, fără titlu, și cinci titluri fixe:

| Titlul oficial | Ce conține |
|---|---|
| *(angajamentul)* | „*[Instituția]* se angajează să asigure accesibilitatea site-ului său web și a aplicației sale mobile în conformitate cu O.U.G. nr. 112/2018 … aprobată prin Legea nr. 90/2019. Prezenta declarație privind accesibilitatea este valabilă pentru …" |
| **Situația conformității** | Una din trei variante: **a)** pe deplin conform - doar dacă *toate* cerințele sunt îndeplinite; **b)** parțial conform „ca urmare a neconformităților și/sau exceptărilor menționate mai jos" - dacă *majoritatea* sunt îndeplinite; **c)** neconform - dacă *majoritatea nu* sunt. |
| **Conținutul inaccesibil** | „Conținutul indicat mai jos nu este accesibil din următoarele motive:" a) neconformitate cu O.U.G. nr. 112/2018; b) sarcină disproporționată; c) conținutul nu intră sub incidența legislației aplicabile. |
| **Elaborarea prezentei declarații privind accesibilitatea** | „Prezenta declarație a fost elaborată la data …" și „Declarația a fost revizuită ultima dată la …". Atât - modelul românesc nu cere metoda de evaluare. |
| **Feedback și date de contact** | Descrierea mecanismului, linkul către el, datele persoanei responsabile. |
| **Procedura de asigurare a aplicării** | Modelul dă chiar datele: **ADR, Bd. Libertății nr. 14, București, sector 5, monitorizare.accesibilitateweb@adr.gov.ro**. |

Din conținutul opțional folosim două lucruri: **linkul către raportul de evaluare** și **măsurile planificate**.

Terminologia se respectă strict: „exceptări", nu „excepții"; „parțial conform cu O.U.G. nr. 112/2018", nu „cu WCAG".

---

## 5. Ce adaugă legea românească

| Obligația | Sursa | Ce construim |
|---|---|---|
| Declarația se oferă **anual** și se actualizează **în 3 zile de la constatarea** unei probleme | OUG art. 6 (1) | Auditul săptămânal al fiecărui workspace; declarația se compune din ultimul audit, deci nu poate rămâne în urmă. |
| Răspuns la o sesizare **în 30 de zile de la înregistrare** | OUG art. 6 (5) | Termenul e scris pe pagină; tichetul din Helpdesk îl primește automat. |
| **Evaluarea sarcinii disproporționate se publică** alături de declarație | OUG art. 4 (7) | Câmp de text, publicat ca document separat, legat din dreptul temeiului b). |
| Lipsa timpului, a priorității, a cunoștințelor și lipsa unui CMS accesibil **nu sunt motive legitime** | OUG art. 4 (5) | Avertisment în editorul de exceptări, pe temeiul b). |
| Instituția desemnează un **responsabil cu accesibilitatea** și îi publică datele într-o secțiune numită **„Accesibilitate"** pe prima pagină | Normele art. 7 | Câmp obligatoriu; numele secțiunii și adresa `/accesibilitate`. |
| O singură declarație poate acoperi site-ul și aplicațiile | Normele art. 9 | Exact ce facem. |
| Evaluarea externă înseamnă **organism de inspecție acreditat RENAR**; raportul e valabil 3 ani | OUG art. 7, 9 (2) | Acesta e termenul folosit peste tot în interfață. |
| Conținutul preluat de la terți se repară în **două zile lucrătoare** și se marchează ca neconform | Ghidul ADR, cap. 5 | Exceptarea implicită pentru hărți și materiale video încorporate. |

---

## 6. Situația conformității

```
Auditul automat al workspace-ului (săptămânal, sau la cerere din Setări → Accesibilitate)
      ↓
Rând nou în stejar_accessibility_audits: status, constatări, pagini, revizia de cod
      ↓
Declarația se compune live din ultimul audit + ce a completat instituția
```

**Fiecare workspace are auditul lui**, pe paginile lui, așa cum le văd vizitatorii lui: aceeași componentă arată altfel cu alt brand și alt conținut. Nu există o evaluare comună moștenită; codul comun se vede în admin ca „ce cade pe multe workspace-uri deodată". Trei reguli țin statusul onest:

1. **Auditul nu poate declara „pe deplin conform".** Modelul cere ca *toate* cerințele să fie îndeplinite, iar axe-core acoperă în jur de o treime dintre ele. Auditul dă b) când nu găsește nimic grav și c) când găsește o problemă gravă sau critică.
2. **a) vine doar de la un organism de inspecție acreditat RENAR.** Instituția pune în setări linkul și data raportului; cât timp raportul are sub 3 ani și auditul nu găsește nimic grav, declarația spune a).
3. **Fiecare audit e un rând nou, cu revizia de cod pe care a rulat.** Nimic nu se editează în loc, nimic nu se șterge; istoricul e dovada că declarația e ținută la zi.

**Fără audit, nu există pagină.** Până la primul audit ruta răspunde 404 și linkul din subsol nu apare; primul audit rulează în prima duminică după deploy sau, la cerere, imediat.

---

## 7. Verificarea

**Un singur motor: axe-core.** Este motorul din Lighthouse și din instrumentul folosit de ADR (ACHECKS combină AChecker și Lighthouse). Rulează într-un singur loc: **în platformă**, `Accessibility::AuditJob`, Chromium headless în containerul aplicației, duminică noaptea, workspace după workspace, și la cerere pentru un workspace din Setări → Accesibilitate sau pentru toate din admin. Fără GitHub, fără teste locale, fără dependență de mașina cuiva.

**Eșantionul** nu e ales de mână, ci derivat din codul și conținutul fiecărui workspace (`AuditTargets`), cu plafon de 60 de pagini, ca un site cu mii de pagini să fie auditat în câteva minute:

| Criteriu | Ce prinde |
|---|---|
| paginile de sistem (prima pagină, notificări, căutare, ștergere cont, declarația) | codul comun |
| până la trei pagini publicate pentru fiecare componentă CMS în uz | același element în contexte de conținut diferite |
| o pagină pentru fiecare template de pagină | structura fiecărui tip de pagină |
| cele mai vizitate zece pagini | ce văd efectiv cetățenii |

Fiecare pagină e derulată până jos ca listele, bara de acțiuni și restul conținutului încărcat ulterior să fie verificate. Ce arată un iframe (player YouTube, hartă Google) este conținut terț și nu se evaluează; iframe-ul în sine, da. O pagină care nu se deschide e notată ca atare, nu oprește auditul. Fiecare pagină din rezultat spune ce acoperă. Un workspace cu 25 de componente ajunge la 20-40 de pagini, 2-3 minute; 30 de workspace-uri, în jur de o oră pe săptămână.

Auditul acoperă cele șapte neconformități pe care ADR le găsește cel mai des (raportul de monitorizare 2025): focalizare puțin vizibilă, contrast redus, câmpuri fără etichete, imagini fără text alternativ, tabele fără anteturi, corelații greu de stabilit, lipsa structurii semantice. Ce nu e automat - focalizarea, corelațiile, ordinea de citire, sensul textelor alternative - intră într-o listă scurtă de verificare manuală, la fiecare livrare importantă.

**Constatările devin text de declarație.** Fiecare regulă axe are o propoziție în cele 7 limbi (`accessibility.findings.*`: „Unele texte nu au contrast suficient față de fundal."), afișată la „Conținutul inaccesibil, a) neconformitate" cu numărul de pagini din eșantion pe care a apărut. O regulă fără traducere apare cu formularea axe.

Remedierea a ce găsește auditul e un task separat; constatările de acum și remedierile propuse stau în `remedieri/`.

---

## 8. Datele

**Auditul** - tabel nou `stejar_accessibility_audits`, în care rândurile doar se adaugă:

| Coloana | Ce conține |
|---|---|
| `account_id` | Workspace-ul |
| `status` | `partially_conformant` / `non_conformant` (a) nu vine niciodată din audit) |
| `code_revision` | Revizia de cod pe care a rulat |
| `summary` | `engine`, `findings` (o linie pe regulă: impact, pagini, elemente), `pages` (fiecare pagină: adresă, ce acoperă, încălcările) |
| `created_at` | Când |

**Ce completează clientul** - în `account.settings['accessibility']`, lângă `legal_data` și `legal_contact` care există deja. Coloana e `jsonb`, deci nicio migrare pe `accounts`:

```ruby
{
  "officer"           => { "name" => "…", "email" => "…", "phone" => "…" },
  "custom"            => [ { "basis" => "disproportionate_burden",
                             "text" => { "ro" => "…" }, "assessment" => { "ro" => "…" } } ],
  "helpdesk_form"     => { "enabled" => true, "department_id" => 3 },
  "planned_measures"  => { "ro" => "…" },           # opțional
  "accredited_report" => { "url" => "…", "assessed_on" => "…" }   # opțional; ridică statusul la a)
}
```

Nu există versiuni publicate: declarația se compune live, „elaborată la" e data primului audit, „revizuită la" e data ultimului. Auditul săptămânal acoperă reînnoirea anuală și actualizarea în 3 zile de la constatare, iar rândurile de audit sunt dovada.

---

## 9. Pagina și linkul din subsol

- **Ruta** stă în eventya, `config/routes/account_website.rb`, deasupra rutei generale de pagini CMS - tiparul deja folosit de `delete_user` și `all_reviews`. O singură rută, constrânsă la adresele din fișierele de traducere (`/accesibilitate`, `/accessibility`, `/barrierefreiheit`…): un workspace cu 14 limbi are 14 adrese, unul cu una are una, iar adresa vizitată alege limba, dacă `?locale=` nu spune altfel. Funcționează și pe domeniu propriu, și pe `eventya.net/<slug>/…`.
- **Controllerul** moștenește `Stejar::Website::BaseController` și **sare peste `enforce_account_visibility`**: altfel un workspace privat și-ar ascunde propria declarație legală în spatele autentificării.
- **Limbile**: `?locale=xx`, ca peste tot pe platformă. Textele standard stau în fișierele de traducere; textele clientului se completează pe fiecare limbă.
- **Adresa** intră în `RESERVED_SLUGS`; pagina intră în `sitemap.xml`.
- **Linkul din subsol** se adaugă în `FooterComponent#legal_pages`, în cod, **pe ultima poziție**, după linkurile configurate din CMS. Nu e element de meniu, deci nu poate fi șters. Dacă un workspace a legat deja declarația printr-un element de meniu, linkul nu se dublează.
- **Pagina e ea însăși în setul verificat**: un singur `h1`, structură semantică, iar culoarea de brand a clientului nu se aplică pe text mic.

---

## 10. Formularul de sesizare

Modelul cere „o descriere și un link către mecanismul de feedback". Folosim ce există:

- un **formular Helpdesk de sistem**, `accessibility_feedback`, creat automat după tiparul `Form.email_form` - ascuns din lista de setări, imposibil de șters din interfață;
- afișat pe pagină cu **aceeași componentă pe care o folosește elementul CMS `HelpdeskForm`**, cu `title` pe iframe; pagina formularului e în setul verificat;
- sesizarea devine tichet la departamentul ales de client, cu **termen de 30 de zile** de la înregistrare;
- fără modulul Helpdesk rămân e-mailul și telefonul responsabilului. Declarația e în continuare conformă.

---

## 11. Etapele

| Etapa | Ce conține |
|---|---|
| **1. Auditul** | `AuditTargets` (eșantionul), `Auditor` (Chromium + axe-core), `AuditJob` (săptămânal, la cerere), `Audit` (model + migrare), Chromium în imagine. |
| **2. Declarația** | Ruta, controllerul, pagina cu formulările oficiale și constatările traduse, linkul din subsol, adresa rezervată, sitemap. |
| **3. Clientul** | Setări → Accesibilitate: auditul (rulare, progres, constatări), responsabilul, exceptările proprii, formularul, raportul RENAR. |
| **4. Admin** | Tabelul workspace-urilor cu ultimul audit, ce cade pe mai multe workspace-uri, rularea pentru toate. |

**Criterii de acceptare:** orice workspace are declarația de la primul audit, cu câmpurile precompletate; clientul editează doar ce ține de el; linkul din subsol apare automat; există în toate limbile site-ului; istoricul auditurilor se păstrează; declarația se reînnoiește săptămânal; sesizările au termen de 30 de zile; evaluarea sarcinii disproporționate se publică.

---

## 12. Riscuri

| Riscul | Cum e închis |
|---|---|
| Declarăm o conformitate pe care nu o avem | Situația nu se scrie în CMS: vine din auditul site-ului. „Pe deplin conform" cere raport de la organism acreditat, sub 3 ani, și un audit fără probleme grave. |
| Clientul urcă sute de PDF-uri scanate | Clientul adaugă exceptarea în setări, pe temeiul potrivit, cu evaluarea cerută de lege. |
| Un site cu mii de pagini blochează auditul | Eșantion derivat din componente, template-uri și trafic, plafon de 60 de pagini; workspace-urile rulează pe rând, într-un singur proces. |
| O pagină CMS `/accesibilitate` o ascunde pe a noastră | Ruta noastră e declarată înaintea celei generale și adresa e rezervată. |
| Cineva șterge linkul din subsol | Nu e element de meniu; e în cod. |
| Un workspace privat își ascunde declarația | Controllerul sare peste verificarea de vizibilitate. |
| Declarația se învechește | Auditul săptămânal; fiecare rulare e un rând în istoric. |
| Clientul invocă un motiv respins de lege | Avertisment explicit în editorul de exceptări. |
| Lipsește o limbă | Un test parcurge titlurile oficiale în toate limbile. |
| Modelul se schimbă | Textele stau într-un singur loc, în fișierele de traducere. |

---

## 13. Inventarul

| Unde | Ce |
|---|---|
| stejar | `Accessibility::Audit` (model + migrare) · `Accessibility::AuditTargets` / `Auditor` / `AuditProgress` / `AuditJob` · `Accessibility::Statement` (compune declarația) · `Accessibility::Path` (adresa în fiecare limbă) · `Accessibility::SettingsForm` · `Website::AccessibilityStatementsController` + view · `Workspace::AccessibilityController` + views · `Admin::AccessibilityController` + view · locale `accessibility.yml` × 7 · o constantă în `Helpdesk::Form` · `selenium-webdriver` + `axe-core-api` în gemspec |
| eventya | o rută în `account_website.rb` și una în `admin.rb` · o linie în `footer_component.rb` · `recurring.yml` (auditul săptămânal) · Chromium în `Dockerfile` |

Nicio permisiune nouă. Nicio modificare a tabelului `accounts`. Un tabel nou, în care rândurile doar se adaugă. O sarcină programată. Chromium în imaginea de producție, pentru că auditul rulează în platformă.

Nu construim: un instrument care repară automat accesibilitatea (suprapunerile de tip „widget" sunt considerate o înrăutățire mascată), un scor per pagină în CMS, sau analiza cerută de art. 8 din norme în locul instituției - îi dăm raportul, asumarea rămâne a reprezentantului ei legal.

---

## Surse

- Decizia de punere în aplicare (UE) 2018/1523 - [EUR-Lex, CELEX 32018D1523](https://eur-lex.europa.eu/legal-content/RO/TXT/?uri=CELEX:32018D1523)
- Directiva (UE) 2016/2102 - [CELEX 32016L2102](https://eur-lex.europa.eu/legal-content/RO/TXT/?uri=CELEX:32016L2102), art. 5 și 7
- OUG 112/2018, MO 1105/27.12.2018 - [text integral](https://lege5.ro/Gratuit/gmytimrugeyq/ordonanta-de-urgenta-nr-112-2018-privind-accesibilitatea-site-urilor-web-si-a-aplicatiilor-mobile-ale-organismelor-din-sectorul-public), art. 4, 6, 7, 9, 11
- Legea 90/2019 - [text integral](https://lege5.ro/Gratuit/gmzdsojsgyza/legea-nr-90-2019-pentru-aprobarea-ordonantei-de-urgenta-a-guvernului-nr-112-2018-privind-accesibilitatea-site-urilor-web-si-a-aplicatiilor-mobile-ale-organismelor-din-sectorul-public), articol unic
- Normele ADR din 06.12.2022, MO 1257/28.12.2022 - [text integral](https://legislatie.just.ro/Public/DetaliiDocument/263193), art. 7-12 și anexa nr. 1
- Ghidul tehnic ADR, v1.0, februarie 2023, și Raportul ADR de monitorizare 2025 - [adr.gov.ro/accesibilitate-site-uri-web](https://www.adr.gov.ro/accesibilitate-site-uri-web/)
- `axe-core-rspec` - [dequelabs/axe-core-gems](https://github.com/dequelabs/axe-core-gems)

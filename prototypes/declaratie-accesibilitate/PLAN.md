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
| Situația conformității | Calculată. Clientul o poate schimba doar către o variantă mai proastă |
| Conținutul inaccesibil | Exceptările stabilite de noi pentru toate site-urile + cele adăugate de client |
| Elaborarea declarației (date) | Platforma |
| Feedback și date de contact | Clientul: responsabilul cu accesibilitatea |
| Procedura de asigurare a aplicării | Platforma, text identic pentru toți |

Declarația există din prima zi a workspace-ului și se reînnoiește automat o dată pe an.

---

## 3. Regula care ordonează planul

> **Nu publicăm declarația înainte ca ea să spună adevărul.**

O declarație falsă lasă amenda la client și răspunderea la noi - și îl expune pe client la amenda mai mare, cea pentru lipsa accesibilității. De aici decurg trei decizii:

1. **Situația conformității nu se scrie de mână în CMS.** Vine din evaluarea platformei, publicată de noi (secțiunea 6).
2. **Clientul o poate doar înrăutăți**, niciodată îmbunătăți.
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
| Declarația se oferă **anual** și se actualizează **în 3 zile de la constatarea** unei probleme | OUG art. 6 (1) | O sarcină programată republică declarația fiecărui workspace o dată pe an. O regresie găsită de verificare poate declanșa republicarea. |
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
Verificarea (secțiunea 7)
      ↓
Admin → Accesibilitate: noi publicăm evaluarea platformei
      ↓
Declarația fiecărui workspace o preia
      ↓
Clientul o poate doar înrăutăți
```

**Evaluarea platformei este una singură**, pentru codul comun: tema, componentele și paginile generate rulează identic pe toate workspace-urile, deci toate o moștenesc. **Se publică dintr-un ecran în `/stejar-admin`**, cu doar patru câmpuri: situația conformității, metoda, data și linkul către raport. Ecranul nu conține nicio listă de exceptări - exceptările privesc conținutul instituției și stau în setările ei. Trei reguli îl țin onest:

1. **Se publică, nu se editează.** Fiecare publicare este un rând nou, cu autor și dată. Nimic nu se modifică în loc și nimic nu se șterge - istoricul este chiar lista publicărilor.
2. **„Pe deplin conform" cere un raport de la un organism acreditat RENAR.** Opțiunea rămâne dezactivată până când raportul e atașat. O verificare automată nu poate demonstra că *toate* cerințele sunt îndeplinite, iar modelul cere exact asta pentru varianta a).
3. **Fără evaluare publicată, nu există pagină.** Ruta răspunde 404, ecranul de setări e inactiv. Regula „întâi verificarea, apoi declarația" e impusă de cod, nu de disciplină.

**Clientul poate doar înrăutăți.** Materialul lui - PDF-uri scanate, hărți, conținut preluat - poate doar să scadă accesibilitatea. Se afișează varianta mai proastă dintre valoarea platformei și cea aleasă de client, în ordinea *pe deplin conform → parțial conform → neconform*. Opțiunile mai bune sunt afișate, dar dezactivate, cu motivul alături.

**Fiecare workspace are și propria verificare.** ADR verifică fiecare site separat, nu platforma. De aceea rulăm lunar, automat, aceeași verificare Lighthouse pe paginile publice ale fiecărui workspace și păstrăm scorul: îl vedem noi în admin, îl vede clientul în setări. Scorul este un semnal - declarația nu se schimbă singură. Coborârea rămâne un click al nostru sau al clientului, care încape în cele 3 zile cerute de lege.

---

## 7. Verificarea

**Un singur motor: axe-core.** Este motorul din Lighthouse și din instrumentul folosit de ADR (ACHECKS combină AChecker și Lighthouse). Îl folosim în două locuri:

| Unde | Cum | Rolul |
|---|---|---|
| **În suita RSpec**, prin gemul oficial `axe-core-rspec` (Deque) | Specuri de sistem pe un set fix de pagini: prima pagină, o pagină de conținut, o listă, o hartă, un formular, căutarea, pagina de declarație | Blochează integrarea codului la orice regresie. Nu produce afirmații publice. |
| **Lighthouse, pe un site de referință publicat**, cu conținut real | Scorul de accesibilitate 0-100, reproductibil de oricine din Chrome DevTools | Scorul și raportul publicate în admin. Se compară direct cu pragurile ADR: 0-49 inaccesibil, 50-89 parțial, 90-100 accesibil. |

Separarea vine din Ghidul ADR: o evaluare din etapa de dezvoltare nu poate susține o declarație de conformitate pentru site-ul finalizat.

**Când rulează.** Totul este automat; singurul click uman este publicarea evaluării platformei, pentru că are valoare juridică.

| Ce | Când | Ce produce |
|---|---|---|
| `axe-core-rspec` | la fiecare modificare de cod | blochează regresia înainte să ajungă în producție |
| Lighthouse pe site-ul de referință | după fiecare deploy în producție | evaluarea platformei, precompletată în admin; noi apăsăm „Publică" |
| Lighthouse per workspace | lunar, plus la cerere | scor și raport per workspace; semnal în admin și în setările clientului |
| Republicarea declarației | anual, per workspace | rând nou în istoric, cu `trigger: anual` |

Verificarea acoperă obligatoriu **cele șapte neconformități pe care ADR le găsește cel mai des** (raportul de monitorizare 2025):

| # | Neconformitatea | Automat? |
|---|---|---|
| 1 | Focalizare puțin vizibilă la navigarea cu tastatura | parțial |
| 2 | Contrast redus al textului | da |
| 3 | Câmpuri de formular neasociate cu etichetele | da |
| 4 | Imagini fără text alternativ | da |
| 5 | Tabele fără celule de antet corecte | da |
| 6 | Corelații greu de stabilit între elemente | nu |
| 7 | Lipsa structurii semantice a paginii | da |

Ce nu e automat - punctele 1 și 6, ordinea de citire, sensul textelor alternative - intră într-o listă scurtă de verificare manuală, parcursă la fiecare livrare importantă. Ghidul ADR cere explicit ambele metode.

O precizare de realism: axe-core acoperă în jur de 30-40% din criteriile WCAG. Verificarea automată susține onest doar „parțial conform". Pentru „pe deplin conform" e nevoie de un organism acreditat - de aceea garda din secțiunea 6.

---

## 8. Datele

**Evaluarea platformei** - tabel nou `stejar_accessibility_platform_statements`, în care rândurile doar se adaugă:

| Coloana | Ce conține |
|---|---|
| `status` | `conformant` / `partially_conformant` / `non_conformant` |
| `evaluation_method` | `self_assessment` / `accredited_inspection` |
| `assessed_on`, `report_url` | Data evaluării și, opțional, raportul |
| `published_by_id`, `created_at` | Cine și când |

**Ce completează clientul** - în `account.settings['accessibility']`, lângă `legal_data` și `legal_contact` care există deja. Coloana e `jsonb`, deci nicio migrare pe `accounts`:

```ruby
{
  "officer"          => { "name" => "…", "email" => "…", "phone" => "…" },
  "catalog_keys"     => ["scanned_pdfs", "word_forms"],   # exceptări predefinite bifate; implicit: PDF-uri, imagini fără text, hărți terțe
  "custom"           => [ { "basis" => "disproportionate_burden",
                            "text" => { "ro" => "…" }, "assessment" => { "ro" => "…" } } ],
  "status_override"  => nil,                       # doar către o valoare mai proastă
  "helpdesk_form"    => { "enabled" => true, "department_id" => 3 },
  "planned_measures" => { "ro" => "…" },           # opțional
  "accredited_report"=> { "url" => "…", "assessed_on" => "…" },  # opțional
  "last_check"       => { "score" => 91, "checked_at" => "…", "report_url" => "…" }  # scris de verificarea lunară
}
```

**Istoricul declarațiilor** - tabel nou `stejar_accessibility_statement_versions`, în care rândurile doar se adaugă: `account_id`, `revision`, `payload` (textul complet, în toate limbile, așa cum a fost afișat), `status`, `trigger` (`manual` / `anual` / `constatare`), `published_at`, `published_by_id`.

Salvăm textul, nu referințe: o versiune din 2027 reconstituită în 2029 ar prelua numele instituției și textele de atunci. Ar fi o reconstituire, nu o dovadă. Coloana `trigger` dovedește la o inspecție că reînnoirea anuală a avut loc.

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
| **1. Verificarea** *(fără ea nu se livrează nimic)* | `axe-core-rspec` pe setul de pagini, blocant. Rezolvarea problemelor din temă. Prima rulare Lighthouse pe site-ul de referință. |
| **2. Declarația** | Ecranul de admin și tabelul evaluării platformei. Ruta, controllerul, pagina cu formulările oficiale, traducerile, linkul din subsol, adresa rezervată, sitemap. |
| **3. Clientul** | Setări → Accesibilitate: responsabilul, exceptările, evaluarea publicată, formularul. Istoricul și ecranul de versiuni. |
| **4. Recurența** | Verificarea lunară per workspace. Republicarea anuală automată. Publicarea primei versiuni pentru toate workspace-urile. Vederea de ansamblu din admin. |

Etapa 1 și pașii din Etapa 2 aduc conformitatea de bază pentru toate site-urile. Republicarea anuală din Etapa 4 nu e opțională - fără ea, clientul intră sub amenda pentru neactualizare.

**Criterii de acceptare:** orice workspace nou are declarația din prima zi, cu câmpurile precompletate; clientul editează doar ce ține de el; linkul din subsol apare automat; există în toate limbile site-ului; istoricul se păstrează; declarația se reînnoiește anual; sesizările au termen de 30 de zile; evaluarea sarcinii disproporționate se publică.

---

## 12. Riscuri

| Riscul | Cum e închis |
|---|---|
| Declarăm o conformitate pe care nu o avem | Situația nu se scrie în CMS. În admin, „pe deplin conform" cere raport de la organism acreditat; fiecare publicare rămâne în istoric, cu autor. |
| Clientul urcă sute de PDF-uri scanate | Exceptarea despre PDF-uri e bifată implicit în orice workspace nou; declarația o listează din prima zi. |
| O pagină CMS `/accesibilitate` o ascunde pe a noastră | Ruta noastră e declarată înaintea celei generale și adresa e rezervată. |
| Cineva șterge linkul din subsol | Nu e element de meniu; e în cod. |
| Un workspace privat își ascunde declarația | Controllerul sare peste verificarea de vizibilitate. |
| Declarația se învechește | Republicarea anuală e automată; `trigger` o dovedește. |
| Clientul invocă un motiv respins de lege | Avertisment explicit în editorul de exceptări. |
| Lipsește o limbă | Un test parcurge titlurile oficiale în toate limbile. |
| Modelul se schimbă | Textele stau într-un singur loc, în fișierele de traducere. |

---

## 13. Inventarul

| Unde | Ce |
|---|---|
| stejar | `Accessibility::PlatformStatement` (model + migrare) · admin: controller + view `accessibility` · `Accessibility::Statement` (compune declarația unui workspace) · `Website::AccessibilityStatementsController` + view · `Accessibility::StatementVersion` (model + migrare) · `Accessibility::AnnualRepublishJob` · `Accessibility::WorkspaceCheckJob` (lunar) · acțiunea `accessibility` în `Workspace::SettingsController` + view · locale `accessibility.yml` × 7 · o constantă în `Helpdesk::Form` · un cuvânt în `RESERVED_SLUGS` |
| eventya | o linie în `account_website.rb` · o linie în `footer_component.rb` · `axe-core-rspec` + specurile de sistem |

Niciun gem nou în afara `axe-core-rspec`. Nicio permisiune nouă. Nicio modificare a tabelului `accounts`. Două tabele noi, în care rândurile doar se adaugă. Două sarcini programate: verificarea lunară și republicarea anuală.

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

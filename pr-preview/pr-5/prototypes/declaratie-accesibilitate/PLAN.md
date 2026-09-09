# Declarația de Accesibilitate — plan de implementare

## 1. De ce facem asta

Orice instituție publică din România este obligată prin lege să publice pe site o **Declarație de Accesibilitate**. Este un document public, cu o structură fixată prin lege, în care instituția spune deschis cât de accesibil este site-ul ei pentru persoanele cu dizabilități și ce anume nu este încă accesibil.

Actele care o cer:

| Actul normativ | Ce stabilește |
|---|---|
| **Directiva (UE) 2016/2102** | Obligația de accesibilitate pentru site-urile și aplicațiile mobile ale instituțiilor publice. |
| **OUG 112/2018**, aprobată prin **Legea 90/2019** | Aduce directiva în legislația românească. |
| **Decizia (UE) 2018/1523** | Stabilește **modelul obligatoriu** al declarației: ce secțiuni are și în ce ordine. |
| **EN 301 549**, care trimite la **WCAG 2.1, nivel AA** | Standardul tehnic față de care se măsoară accesibilitatea. |
| **Norma ADR din 06.12.2022** | Cum se face monitorizarea și cum depune cineva o plângere. |

Verificarea o face **Autoritatea pentru Digitalizarea României (ADR)**. Amenda este între **6.000 și 12.000 de lei**.

Clienții noștri sunt primării, muzee, centre culturale și consilii județene. Toate intră sub această obligație. În momentul de față, niciun site pe care îl livrăm nu are declarația. Cu alte cuvinte, fiecare workspace pe care îl punem în producție pornește cu o neconformitate pe care am creat-o noi.

În discuția comercială folosim argumentul **„conformitate livrată, nu promisă"**. Ca să fie adevărat, declarația trebuie generată automat de platformă, nu scrisă de client într-o pagină obișnuită de CMS.

> **Ce rămâne în afara acestui plan.** Legea 232/2022 (care aduce în România Directiva 2019/882, cunoscută ca *European Accessibility Act*) extinde obligații asemănătoare și către firme private din anumite domenii: comerț online, transport, servicii bancare. Câțiva dintre clienții noștri ar putea intra sub incidența ei. Este însă altă lege, cu alt model de declarație. Nu o tratăm acum. O menționăm doar ca să fie clar că nu a fost uitată.

---

## 2. Ce livrăm, în cuvinte simple

O pagină publică, una singură pentru fiecare workspace, la o adresă fixă de tipul `client.ro/accesibilitate`.

Pagina conține cele șase secțiuni cerute de lege. **Patru dintre ele le completează platforma automat.** Clientul scrie doar două lucruri: ce anume de pe site-ul lui nu este accesibil și la ce adresă răspunde cineva dacă un cetățean semnalează o problemă.

Pagina există din prima zi a workspace-ului, în toate limbile site-ului, și este legată automat din subsolul fiecărei pagini.

---

## 3. Regula după care se ordonează tot planul

> **Nu publicăm declarația înainte ca ea să spună adevărul.**

O declarație falsă nu este o greșeală de formă. Ea produce două efecte reale:

1. **Clientul rămâne cu amenda.** El este cel care semnează declarația și el răspunde în fața ADR.
2. **Noi rămânem cu răspunderea față de client**, pentru că afirmația a fost generată de platforma noastră, nu scrisă de el.

Este singurul loc din platformă în care un câmp completat greșit creează o obligație juridică pentru altcineva. Din această regulă decurg trei decizii care structurează tot restul:

1. **Nicăieri în platformă nu există un câmp în care cineva să aleagă „site-ul este conform".** Nici în CMS, nici în panoul de administrare. Valoarea este calculată, nu scrisă de un om.
2. **Clientul poate declara doar o situație mai proastă decât cea a platformei, niciodată una mai bună.**
3. **Prima etapă de lucru este verificarea tehnică a site-urilor, nu construirea paginii.** Până nu avem un raport pe care să îl putem arăta ADR-ului, pagina nu se livrează clienților.

---

## 4. Cele șase secțiuni obligatorii

Structura de mai jos vine din modelul stabilit prin Decizia 2018/1523. **Secțiunile 1–6 sunt obligatorii, exact în ordinea aceasta.**

| # | Secțiunea | De unde vin datele | Cine o completează |
|---|---|---|---|
| **1** | **Angajamentul.** „[Instituția] se angajează să asigure accesibilitatea site-ului și a aplicației mobile…", urmat de lista adreselor la care se aplică declarația. | Numele instituției, domeniul verificat și aplicațiile mobile publicate, toate din workspace. | **Nimeni.** Text generat. |
| **2** | **Stadiul conformității.** Site-ul este conform în totalitate, **parțial conform** sau neconform cu WCAG 2.1 AA. | Rezultatul verificării tehnice a platformei. | **Nimeni nu îl scrie.** Este calculat. Clientul îl poate doar înrăutăți. |
| **3** | **Conținut neaccesibil.** Ce anume nu este accesibil și în care dintre cele trei temeiuri legale se încadrează: (a) neconformitate, (b) sarcină disproporționată, (c) conținut aflat în afara domeniului de aplicare al legii. | Excepțiile stabilite de noi pentru toate site-urile, plus cele adăugate de client. | **Clientul**, din setările workspace-ului. |
| **4** | **Întocmirea declarației.** Data la care a fost scrisă, metoda de evaluare (autoevaluare sau audit făcut de o firmă externă) și data ultimei revizuiri. | Data primei publicări și datele verificării tehnice. | Clientul intervine doar dacă instituția a plătit un audit extern. |
| **5** | **Feedback și date de contact.** Prin ce mijloc poate un cetățean să semnaleze o problemă și cine îi răspunde. | Datele de contact ale instituției, plus un formular care creează un tichet în Helpdesk. | **Clientul.** |
| **6** | **Procedura de aplicare.** Ce face cetățeanul dacă nu primește un răspuns mulțumitor: se adresează ADR. | Text standard, scris de noi o singură dată. | **Nimeni.** Identic pentru toate workspace-urile. |

Modelul permite și câteva secțiuni opționale. Le susținem pe cele utile: **măsurile pe care instituția plănuiește să le ia**, **linkul către raportul de evaluare** și **un număr de telefon**.

> ⚠️ **De verificat în textul oficial înainte de a scrie prima linie de cod.** Tabelul de mai sus a fost reconstruit din trei surse: [Decizia 2018/1523 pe EUR-Lex](https://eur-lex.europa.eu/legal-content/RO/TXT/?uri=CELEX:32018D1523), [Norma ADR din 06.12.2022](https://legislatie.just.ro/Public/DetaliiDocument/263193) și declarații publicate de instituții care urmează modelul. Structura secțiunilor este sigură. Trei lucruri **nu** au putut fi verificate cuvânt cu cuvânt și trebuie citite în document de un coleg:
> 1. **formulările exacte în română** ale secțiunilor 1, 2 și 6 — știm ce trebuie să conțină secțiunile, nu și cum trebuie formulate cuvânt cu cuvânt;
> 2. **în cât timp trebuie să răspundă instituția** la o sesizare de accesibilitate — scriem termenul pe pagină, deci nu îl putem inventa;
> 3. dacă modelul cere o **dată de reevaluare** pentru excepțiile invocate ca *sarcină disproporționată*. Ecranul 4 presupune că da.

---

## 5. Cum stabilim stadiul de conformitate

Aceasta este partea de care depinde credibilitatea întregii funcționalități, așa că merită explicată pas cu pas.

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

La fiecare modificare de cod, un program verifică automat un set fix de pagini ale temei publice și raportează problemele de accesibilitate găsite. Detaliile sunt în secțiunea 10.

### Pasul 2 — rezultatul se scrie într-un fișier din codul platformei

Fișierul se numește `config/accessibility.yml` și stă în stejar, lângă restul codului:

```yaml
standard:      "WCAG 2.1 AA"
status:        partially_conformant   # sau: conformant | non_conformant
method:        self_assessment        # sau: third_party_audit
assessed_on:   2026-10-14             # data evaluării
reviewed_on:   2026-10-14             # data ultimei revizuiri
report_url:    "https://…/raport-2026-10.html"
known_issues:                         # excepțiile valabile pentru toate site-urile
  - key: pdf_uploads
    basis: non_conformance
  - key: embedded_maps
    basis: disproportionate_burden
```

**De ce un fișier în cod și nu un tabel în baza de date, cu un ecran de administrare.** Trei motive, în ordinea importanței:

1. **Un ecran de administrare înseamnă un buton prin care cineva poate declara conformitatea fără să o fi verificat.** Un fișier din cod nu poate fi modificat decât printr-o schimbare pe care o citește și o aprobă un alt coleg înainte ca ea să ajungă în producție. Exact aceasta este bariera pe care o vrem în fața unei afirmații cu valoare juridică.
2. **Conformitatea este o proprietate a versiunii de cod, nu a datelor clientului.** Codul temei publice se schimbă la fiecare livrare, iar accesibilitatea paginilor se schimbă odată cu el. Un rând salvat în baza de date ar rămâne în urmă fără ca cineva să observe.
3. **Data ultimei revizuiri se actualizează singură la fiecare livrare importantă.** Aceasta era una dintre cerințe. Câmpul `reviewed_on` este actualizat în același pas în care rulează verificarea, nu de cineva care își aduce aminte.

Consecință practică: **nu avem nevoie de un tabel de audituri și nici de o bibliotecă de urmărire a modificărilor.** Istoricul evaluărilor este chiar istoricul modificărilor fișierului.

### Pasul 3 — clientul poate doar înrăutăți valoarea

Clientul încarcă pe site documente PDF scanate, hărți din surse externe, uneori un material video preluat din altă parte. Conținutul lui poate doar să **scadă** accesibilitatea site-ului. Nu poate să o crească, pentru că noi nu avem cum să garantăm nimic despre ce va încărca mâine.

Regula, scrisă simplu: **se afișează varianta mai proastă dintre valoarea platformei și valoarea aleasă de client**, în ordinea `conform în totalitate` → `parțial conform` → `neconform`.

În ecranul de setări, opțiunile mai bune decât valoarea platformei sunt afișate, dar dezactivate, cu motivul scris alături. Dacă un client a plătit un audit extern și vrea să declare mai mult — caz real, deși rar — atunci discută cu noi. Nu rezolvăm asta printr-un buton.

### Pasul 4 — cât timp nu există evaluare, nu există pagină

Dacă `config/accessibility.yml` nu are o dată de evaluare completată, pagina publică răspunde cu 404, iar ecranul de setări este inactiv.

Nu este o precauție teoretică. Este mecanismul prin care regula „întâi verificarea, apoi declarația" nu poate fi ocolită nici de noi, într-o săptămână în care un client cere declarația până vineri.

---

## 6. Unde salvăm datele

**Adăugăm un singur tabel nou.** Restul se așază în locuri care există deja.

### Textele scrise de client

Se salvează în `account.settings['accessibility']`, adică exact acolo unde stau deja datele legale ale instituției (`legal_data` și `legal_contact` din `app/models/stejar/account.rb`). Forma:

```ruby
{
  "exceptions" => [
    { "basis" => "non_conformance",
      "key"   => "scanned_pdfs",                # un exemplu predefinit …
      "text"  => { "ro" => "…", "en" => "…" } },# … sau text propriu, pe fiecare limbă
    { "basis"         => "disproportionate_burden",
      "text"          => { "ro" => "…" },
      "justification" => { "ro" => "…" },       # obligatorie pe acest temei
      "review_on"     => "2027-06-01" }
  ],
  "status_override"   => nil,                   # doar spre o valoare mai proastă
  "feedback"          => { "email" => "…", "phone" => "…", "helpdesk_form" => true },
  "third_party_audit" => { "method" => "…", "report_url" => "…", "assessed_on" => "…" },
  "planned_measures"  => { "ro" => "…" }
}
```

Coloana `settings` este deja de tip `jsonb`, deci **nu este nevoie de nicio modificare a tabelului `accounts`**.

### Istoricul declarațiilor

Tabel nou: `stejar_accessibility_statement_versions`.

| Coloană | Tip | Ce conține |
|---|---|---|
| `account_id` | uuid | Workspace-ul. |
| `revision` | integer | 1, 2, 3… — numerotare separată pentru fiecare workspace. |
| `payload` | jsonb | **Textul complet al declarației, așa cum a fost afișat, în toate limbile.** |
| `status` | string | Stadiul afișat la momentul publicării. |
| `platform_digest` | string | Ce versiune a fișierului de evaluare era valabilă atunci. |
| `published_at` | datetime | Când. |
| `published_by_id` | bigint | Cine. |

Rândurile se adaugă. Nu se modifică și nu se șterg niciodată.

**De ce salvăm textul complet, și nu doar referințe către datele curente.** Dacă am salva doar identificatori, o declarație din 2027 s-ar reconstitui în 2029 cu numele instituției de atunci și cu textul standard de atunci. Ar fi o reconstituire, nu o dovadă. Într-o discuție cu ADR-ul contează ce scria pe pagină în ziua respectivă.

Ca dimensiune, nu este o problemă: aproximativ 4 KB pentru o versiune, câteva versiuni pe an, pentru fiecare workspace.

---

## 7. Adresa paginii și linkul din subsol

Ruta se declară în **eventya**, iar codul care o servește stă în **stejar**. Este exact tiparul folosit deja de paginile `delete_user` și `all_reviews`.

```ruby
# eventya: config/routes/account_website.rb — DEASUPRA rutei generale de pagini CMS
get '/accesibilitate', to: 'stejar/website/accessibility_statements#show', as: :accessibility_statement
```

Ce rezultă de aici:

- **Funcționează în ambele forme de adresă**, ca tot ce se află în blocul `scope '(/:account_id)'`: `client.ro/accesibilitate` pe domeniu propriu și `eventya.net/uricani/accesibilitate` pe platformă.
- **Pagina arată ca restul site-ului.** Controllerul moștenește `Stejar::Website::BaseController`, deci primește deja identificarea workspace-ului, schimbarea limbii și macheta temei.
- **Toate limbile, o singură adresă.** Platforma schimbă limba prin `?locale=xx`, nu prin prefix în adresă. Deci `/accesibilitate?locale=en`. Textele standard stau în fișierele de traducere ale platformei, care acoperă deja româna, engleza, maghiara, germana, franceza, italiana și spaniola. Textele scrise de client se traduc separat, pe fiecare limbă.
- **Adresa se trece în lista de adrese rezervate** (`RESERVED_SLUGS`), ca să nu poată fi ocupată de o pagină obișnuită de CMS.
- **Pagina intră în `sitemap.xml`** și nu primește instrucțiune de neindexare. ADR-ul o caută cu un program automat.

### Linkul din subsol

În acest moment, bara de jos a site-ului își ia linkurile legale dintr-un meniu configurabil din CMS (`Themes::City::FooterComponent#legal_pages`). Adăugăm declarația **direct în cod, pe prima poziție**:

```ruby
def legal_pages
  [accessibility_statement_link] + configured_legal_pages
end
```

**De ce nu ca element de meniu.** Un element de meniu poate fi șters de oricine din CMS, fără să își dea seama ce a șters, iar site-ul devine neconform fără ca cineva să observe. Legea cere prezența linkului, deci nu este o preferință de conținut. Titlul linkului rămâne traductibil, dar prezența lui nu este opțională.

---

## 8. Mecanismul de sesizare

Legea cere „un mecanism prin care oricine poate semnala deficiențe". În practică, asta înseamnă un formular, nu o adresă de e-mail pierdută în subsol.

**Nu construim un formular nou.** Platforma are deja tiparul formularelor de sistem în `Stejar::Helpdesk::Form`: formulare create automat, ascunse din lista de setări și imposibil de șters din interfață. Adăugăm unul nou, pentru accesibilitate, cu aceleași reguli.

- **Dacă workspace-ul are modulul Helpdesk:** formularul apare pe pagină, iar sesizarea devine tichet la departamentul ales de client. Instituția are astfel un fir de discuție, un termen și o urmă — exact ce trebuie să poată arăta dacă ADR-ul întreabă.
- **Dacă nu are modulul:** rămân adresa de e-mail și telefonul din datele legale ale instituției. Declarația este în continuare conformă; doar mecanismul este mai simplu.
- **Formularul se afișează direct în pagină.** Elementul de CMS existent pentru formulare Helpdesk le afișează într-un cadru separat (`iframe`). Aici nu procedăm la fel: un cadru separat mută focusul tastaturii, strică ordinea de navigare și îngreunează anunțarea erorilor către cititoarele de ecran. Tocmai pe pagina care declară conformitatea, ar fi o contradicție.

---

## 9. Pagina trebuie să fie ea însăși accesibilă

Pare evident și tocmai de aceea se uită. Concret:

- **un singur titlu principal** (`h1`) și șase subtitluri de același nivel (`h2`), fără salturi de nivel;
- **structură semantică reală** — `<main>`, `<nav>`, `<address>` pentru datele de contact — nu simple `div`-uri cu clase de stil;
- **contrast de cel puțin 4.5:1 în ambele teme**, inclusiv cu culorile de brand ale clientului, care pot fi oricât de deschise. Pe această pagină, culoarea de brand nu se aplică pe text mic;
- **navigare completă de la tastatură**, fără capcane de focus și fără conținut care apare doar la trecerea mouse-ului peste el;
- **formularul de sesizare**: etichetă reală pentru fiecare câmp, fiecare eroare legată de câmpul ei și mesajul de confirmare anunțat automat cititoarelor de ecran;
- **comutatorul de limbă**: limba corectă declarată pe pagină și pe fiecare opțiune.

Aceasta este prima pagină pe care o va deschide un auditor ADR. Dacă ea nu trece verificarea, restul declarației nu mai contează.

---

## 10. Verificarea automată — prima etapă de lucru

Adăugăm o verificare automată în procesul care rulează la fiecare modificare de cod din eventya. Folosim două programe consacrate, **axe-core** și **Pa11y**, pe un set fix de pagini reprezentative ale temei publice: prima pagină, o pagină de conținut, o listă de pagini, o hartă, un formular, pagina de rezultate ale căutării și chiar pagina de declarație.

- rulează la fiecare modificare și **oprește intrarea codului dacă apare o problemă nouă** — nu doar raportează;
- raportul rezultat se publică și ajunge ca link în secțiunea 4 a declarației;
- ce nu poate fi verificat automat — ordinea logică de citire, corectitudinea textelor alternative, navigarea reală de la tastatură — intră într-o listă de verificare manuală, parcursă o dată la fiecare livrare importantă, nu la fiecare modificare.

**O precizare de realism, ca să nu promitem prea mult.** Conform propriei documentații, axe-core acoperă în jur de 30–40% dintre criteriile WCAG. Prin urmare, verificarea automată **nu poate justifica niciodată afirmația „conform în totalitate"**. Poate susține, în mod onest, doar „parțial conform", cu o listă de probleme cunoscute — ceea ce, de altfel, declară aproape orice instituție din Europa. Dacă vrem vreodată să declarăm conformitate totală, este nevoie de un audit făcut de o firmă externă. Tocmai de aceea fișierul are și opțiunea `third_party_audit`.

---

## 11. Etapele de livrare

### Etapa 1 — verificarea *(fără ea nu se livrează nimic)*
1. Adăugarea verificării automate în procesul de integrare, cu oprire la regresie.
2. Rezolvarea problemelor găsite în tema publică și în componentele comune.
3. Prima completare a fișierului `config/accessibility.yml`, revizuită de un coleg.

### Etapa 2 — generarea declarației
4. Codul care citește fișierul de evaluare și codul care compune declarația unui workspace.
5. Ruta publică, controllerul și pagina — cu regulile de accesibilitate din secțiunea 9 aplicate chiar pe ea.
6. Traducerea textelor standard în cele șapte limbi ale platformei.
7. Linkul din subsol, adresa rezervată, intrarea în `sitemap.xml`.

### Etapa 3 — ce poate edita clientul
8. Ecranul Setări → Accesibilitate (ecranele 3 și 4), vizibil doar proprietarului workspace-ului.
9. Formularul de sesizare și afișarea lui în pagină.
10. Tabelul de istoric și ecranul de versiuni.

### Etapa 4 — administrarea flotei
11. Ecranul din panoul de administrare: cine are excepții expirate, cui îi lipsesc datele de contact, cine și-a declarat un stadiu mai slab decât cel al platformei.
12. Publicarea primei versiuni pentru toate workspace-urile existente.

---

## 12. Criterii de acceptare

| Cerința | Cum este îndeplinită |
|---|---|
| Orice workspace nou are declarația publicată din prima zi. | Pagina nu depinde de existența vreunei înregistrări în baza de date. Secțiunile 1, 2 și 6 sunt generate, iar 3–5 pornesc cu valorile stabilite de noi. |
| Câmpurile sunt precompletate. | Numele instituției, domeniul și aplicațiile vin din workspace; excepțiile stabilite de noi sunt preluate automat; contactul vine din datele legale ale instituției. |
| Clientul poate edita doar secțiunile 2–5. | Formularul de setări conține doar excepțiile, contactul, măsurile planificate și auditul extern. Secțiunile 1 și 6 nu au formular deloc. Secțiunea 2 este calculată, iar clientul o poate doar înrăutăți. |
| Linkul din subsol apare automat. | Este adăugat în cod, nu ca element de meniu care poate fi șters. |
| Există în română și în celelalte limbi ale site-ului. | O singură adresă, cu `?locale=xx` pentru fiecare limbă activă a workspace-ului. |
| Păstrăm istoricul declarațiilor. | Tabel separat, în care rândurile doar se adaugă, cu textul declarației salvat integral. |

---

## 13. Riscuri

Un risc „rezolvat" printr-un obicei de lucru — *ne aducem aminte*, *verificăm înainte de livrare* — este de fapt un risc nerezolvat. De aceea am împărțit lista în două: mai întâi ce nu se mai poate întâmpla prin felul în care este construită funcționalitatea, apoi ce rămâne în grija echipei.

### A. Riscuri închise prin construcție

**Declarăm că site-ul este accesibil, deși nu este.**
Este cel mai grav dintre toate: amenda ajunge la client, iar răspunderea la noi. Nu se mai poate întâmpla pentru că nicăieri în platformă nu există un câmp în care cineva să scrie stadiul de conformitate — nici în CMS, nici în panoul de administrare. Valoarea este scrisă de verificarea automată, în fișierul din cod. Un om o poate schimba doar printr-o modificare de cod aprobată de un coleg și doar către o valoare mai proastă. În plus, adăugăm un test automat care oprește livrarea dacă cineva scrie „conform în totalitate" fără să existe un raport de audit extern.

**Clientul încarcă 400 de documente PDF scanate, iar declarația noastră devine falsă fără ca cineva să observe.**
Excepția „documentele PDF publicate anterior datei de…" este stabilită de noi și activă automat în orice workspace, iar clientul nu o poate șterge — o poate doar completa. Astfel, declarația rămâne adevărată atât în prima zi, cât și în ziua în care clientul își încarcă arhiva.

**Un editor creează o pagină de CMS cu adresa `/accesibilitate` și o ascunde pe a noastră.**
Ruta noastră este declarată *înaintea* rutei generale care servește paginile de CMS, deci câștigă întotdeauna. O pagină de CMS cu aceeași adresă ar deveni cel mult o pagină la care nu ajunge nimeni, nu o declarație ascunsă. În plus, adresa este trecută în lista celor rezervate, deci nici nu poate fi creată. Nu mai este nevoie de nicio verificare a tuturor site-urilor înainte de livrare.

**Cineva șterge linkul din subsol.**
Nu este element de meniu. Este adăugat în cod și nu există niciun ecran din care să poată fi șters.

**Un workspace privat își ascunde propria declarație legală.**
Paginile publice trec printr-o verificare care, pentru un workspace marcat ca privat, cere autentificare. Fără o excepție, tocmai instituțiile care au cea mai mare nevoie de declarație ar rămâne neconforme. Controllerul nostru sare peste această verificare, exact cum face deja controllerul de configurare a aplicației mobile. Regula generală: **se închide accesul la conținut, nu la informațiile impuse de lege.**

**Culorile de brand ale clientului strică contrastul chiar pe pagina care declară conformitatea.**
Pe această pagină, culoarea de brand nu se aplică pe text mic, ci doar pe elemente decorative și pe fundaluri cu contrast verificat. Paleta clientului nu poate coborî contrastul textului sub pragul cerut, pentru că nu se aplică deloc pe text.

**Declarația lipsește într-una dintre limbile site-ului.**
Un test automat parcurge cele șase secțiuni în toate limbile platformei și semnalează prima lipsă. O limbă activată fără traducere devine astfel o eroare descoperită de noi, nu de ADR.

### B. Riscuri care rămân deschise

| Riscul | Cine îl ține sub control |
|---|---|
| **Textele standard nu corespund exact modelului din lege.** | Singurul risc pe care nu îl poate preveni niciun cod. Verificarea textului oficial este o sarcină explicită, cu o persoană responsabilă, **înainte** de Etapa 2. |
| **Excepțiile rămân neactualizate** — o „sarcină disproporționată" invocată în 2026 și nereevaluată în 2029. | Data de reevaluare este obligatorie pe acest temei și nu poate fi la mai mult de doi ani distanță. La expirare, proprietarul workspace-ului primește o notificare, iar ecranul de administrare o marchează. Nu ascundem automat excepția expirată din declarație: ar însemna să modificăm în tăcere un text cu valoare juridică. |
| **Verificarea automată devine incomodă și cineva o transformă într-una care doar raportează.** | Problema devine vizibilă singură: aceeași verificare este cea care actualizează data ultimei revizuiri. Dacă nu mai rulează, data îngheață, iar ecranul de administrare marchează declarația ca fiind învechită. |

---

## 14. Soluția, pe scurt

Mai jos este lista completă de fișiere. Merită scrisă, pentru că arată că nu construim un modul nou — construim o pagină cu o singură sursă de adevăr.

### În stejar

| Fișierul | Ce face |
|---|---|
| `config/accessibility.yml` | **Singura sursă a stadiului de conformitate.** Scris de verificarea automată, revizuit de un om. |
| `lib/stejar/accessibility/platform_statement.rb` | Clasă simplă. Citește fișierul de mai sus. |
| `lib/stejar/accessibility/statement.rb` | Clasă simplă. Compune declarația unui workspace: valorile platformei plus textele clientului, aplicând regula „se afișează varianta mai proastă". |
| `app/controllers/stejar/website/accessibility_statements_controller.rb` | O singură acțiune. Sare peste verificarea de vizibilitate a contului. |
| `app/views/stejar/website/accessibility_statements/show.html.erb` | Pagina. Șase secțiuni, marcaj semantic, fără JavaScript. |
| `app/models/stejar/accessibility/statement_version.rb` + migrarea | Istoricul. |
| `app/controllers/stejar/workspace/settings_controller.rb` | O acțiune nouă, lângă cea pentru datele legale, care există deja. |
| `app/views/stejar/workspace/settings/accessibility.html.erb` | Formularul din ecranele 3 și 4. |
| `config/locales/*/accessibility.yml` | Textele standard, în șapte limbi. |
| `Stejar::Helpdesk::Form` | O constantă în plus, pentru formularul de sesizare. |
| `Stejar::Account::RESERVED_SLUGS` | Un cuvânt în plus. |

### În eventya

| Fișierul | Ce face |
|---|---|
| `config/routes/account_website.rb` | O linie, deasupra rutei generale. |
| `app/themes/city/components/themes/city/footer_component.rb` | O linie, pentru linkul din subsol. |
| `.github/workflows/ci.yml` | Verificarea automată de accesibilitate. |

### Ce nu adăugăm

Nicio bibliotecă nouă. Nicio permisiune nouă — ecranul de setări este pentru proprietarul workspace-ului, ca toate celelalte setări. Niciun proces de fundal și nicio sarcină programată. Nicio modificare a tabelului `accounts`. **Un singur tabel nou**, și acela doar pentru că păstrarea istoricului este o cerință explicită, iar platforma nu are un mecanism de urmărire a versiunilor.

Ecranele 3–7 din prototip sunt cinci vederi peste aceleași două surse de date: fișierul de evaluare și setările workspace-ului. Dacă implementarea ajunge să conțină mai mult decât atât, înseamnă că am complicat-o inutil.

### Dacă timpul este scurt

Etapa 1 și pașii 4–7 din Etapa 2 aduc **conformitatea legală completă pentru toate site-urile**: pagina există, este corectă, este legată din subsol, există în toate limbile, cu excepțiile stabilite de noi. Restul — editarea de către client, istoricul, ecranul de administrare — sunt îmbunătățiri pentru munca noastră de zi cu zi, nu condiții de conformitate. Dacă se taie ceva, se taie de la coadă.

---

## 15. Ce nu construim

- **Un instrument de reparare automată a accesibilității.** Nu convertim automat documente PDF, nu generăm texte alternative pentru imagini și nu adăugăm peste site un widget de „accesibilitate". Astfel de suprapuneri sunt considerate, în majoritatea evaluărilor serioase, o înrăutățire mascată.
- **Un scor de accesibilitate pentru fiecare pagină din CMS.** Arată bine într-o prezentare, dar produce un număr cu care nimeni nu știe ce să facă.
- **Un ecran de administrare care stabilește stadiul de conformitate.** Lipsește intenționat. Motivele sunt explicate în secțiunea 5.
- **Declarația cerută de Legea 232/2022** pentru clienții din mediul privat. Alt domeniu de aplicare, alt model de document.

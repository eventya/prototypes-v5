# Aplicația pentru servicii custom — plan de arhitectură

# 1 · Ce construim

O **aplicație pentru servicii custom**: o aplicație Rails de sine stătătoare, care găzduiește modulele
cerute de clienți anume — module care nu au ce căuta în produsul Eventya v5.

- **repo propriu, deploy propriu** — nu e gem, nu e engine montat în v5
- **bază de date proprie** — PostgreSQL separat, fără nicio conexiune la baza v5
- **view-uri proprii** — randează HTML complet: pagini publice + backoffice. Nu e un API consumat de v5
- **mai multe module în același proces** — colectarea deșeurilor e primul; fiecare cu tabelele lui
  (prefix propriu), rutele lui, view-urile lui

## Unde trăiește

**Nu are domeniu propriu.** Procesul ascultă intern (`servicii:3000`, în rețeaua Docker) și nu e
expus direct în internet.

E accesibilă exclusiv prin Caddy, sub domeniile clienților. Un singur proces deservește toți clienții;
separarea între ei se face din datele cererii, nu din infrastructură.

## Regula de rutare

Toată legătura la nivel de infrastructură se reduce la o singură regulă:

> **Orice cerere care conține `/s/` în adresă pleacă la aplicația de servicii. Orice altceva merge la v5.**

```
soma.ro/despre-noi              →  v5
soma.ro/contact                 →  v5
soma.ro/stejar/pages            →  v5
                                    ↑ fără /s/

soma.ro/s/deseuri               →  servicii
soma.ro/s/deseuri/admin         →  servicii
soma.ro/s/transport-public      →  servicii   ← modulul următor, fără nicio modificare
                                    ↑ conține /s/
```

Caddy nu se uită la nimic altceva. Nu știe ce e „colectarea deșeurilor", nu știe ce module există,
nu întreabă pe nimeni. Citește adresa și dă mai departe.

Două consecințe practice:

- **Al doilea modul nu cere nicio modificare de infrastructură.** Ruta lui începe tot cu `/s/`, deci
  intră automat în aplicația de servicii, care îl duce la modulul potrivit.
- **Dacă aplicația de servicii e oprită, cad doar adresele cu `/s/`.** Site-ul, CMS-ul și helpdesk-ul
  merg mai departe, fără să știe că lipsește ceva.

## Cele două forme de URL

Aici e partea care se ratează ușor. Un client are, **simultan**, două căi valide către același conținut:

| Formă | URL | Contul se află din | Cine o folosește |
|---|---|---|---|
| **pe domeniul CMS** | `eventya.net/soma/s/deseuri` | primul segment din path | **aplicația mobilă**, staging, orice client care încă nu are domeniu propriu |
| **pe domeniu custom** | `soma.ro/s/deseuri` | hostname | browserul, după ce clientul își leagă domeniul |

Forma cu path **nu e o etapă tranzitorie**. Din `UrlNormalization`, în v5:

> „Mobile apps don't follow custom workspace domains — they always navigate the CMS base domain
> prefixed with the account slug."

Aplicația mobilă folosește permanent `eventya.net/soma/...`, chiar și după ce clientul are domeniu
propriu. Iar acolo va veni majoritatea traficului pentru colectarea deșeurilor.

**Ambele forme trebuie să funcționeze, permanent, la același client.**

## Configurația Caddy

Un bloc care acoperă ambele forme:

```caddyfile
# pe domeniul CMS, slug-ul contului e primul segment din path
@cms host eventya.net staging.eventya.net
handle @cms {
    handle /*/s/* {
        reverse_proxy servicii:3000
    }
    handle {
        reverse_proxy kamal-proxy:80
    }
}

# pe domenii custom, contul vine din hostname
handle /s/* {
    reverse_proxy servicii:3000
}

handle {
    reverse_proxy kamal-proxy:80        # v5, ca până acum
}
```

În ambele cazuri, browserul vede **un singur origin**. Nu află niciodată că în spate sunt două
procese, două repo-uri și două baze de date.

---

# 2 · Identitatea — cum folosim API-ul

## Problema

Aplicația de servicii nu are utilizatori, nu are parole, nu are roluri. Toate sunt la v5.

Dar uneori trebuie să știe cine e omul: ca să-l aboneze la notificări sau ca să-l lase în
administrare.

## Cum funcționează

```
Ion deschide  soma.ro/s/deseuri/abonari
      │
      │  cererea duce cu ea cookie-urile puse de v5
      ▼
┌──────────────────────────────────────────────────┐
│  APLICAȚIA DE SERVICII                           │
│                                                  │
│  1. Ce client e?  →  din adresă: „soma"          │
│                      fără niciun apel            │
│                                                  │
│  2. Pagina cere identitate?                      │
│        nu  →  randează, gata                     │
│        da  →  continuă                           │
│                                                  │
│  3. Am răspunsul în cache (120 s)?               │
│        da  →  randează, gata                     │
│        nu  →  întreabă v5                        │
└───────────────────────┬──────────────────────────┘
                        │  GET /api/v1/context
                        │  + cookie-urile lui Ion
                        ▼
┌──────────────────────────────────────────────────┐
│  EVENTYA v5                                      │
│                                                  │
│  citește sesiunea          →  cine e, ce rol      │
│  citește cookie-ul telefon →  ce telefon e        │
│  caută contul              →  limbă, fus, culori  │
└───────────────────────┬──────────────────────────┘
                        │  cont · limbă · fus · rol
                        │  device_uid · culoare · logo
                        ▼
                 randează pagina
```

## Endpoint-ul

Aplicația de servicii îi trimite cookie-urile primite de la om. v5 răspunde cine e.

```
GET /api/v1/context
Cookie: <cookie-urile omului, retrimise ca atare>

→ 200
{ "cont":    "8f2a-…",
  "slug":    "soma",
  "limba":   "ro",
  "fus":     "Europe/Bucharest",
  "rol":     "vizitator",
  "device_uid": "A3F9C2E1-8B44-…",
  "culoare": "#0E75BD",
  "logo":    "https://…/logo.svg" }
```

Dacă v5 nu recunoaște niciun telefon, răspunde `rol: "anonim"` și fără `device_uid` — omul nu se
poate abona la notificări (vede programul, dar nu primește alerte).

Atât. Fără chei, fără semnături, fără expirări de gestionat.

## Cum știe v5 despre cine e vorba

Nu construim nimic special. **Retransmitem cookie-urile omului, neatinse.**

**1 · Browserul lui Ion trimite cererea.** Fiind același domeniu, atașează automat toate cookie-urile
pentru `soma.ro` — puse de v5 la vizitele anterioare:

```
GET /s/deseuri/abonari
Host:   soma.ro
Cookie: _stejar_session=SFMyNTY.g3QAAAAC...;  evt_device=a3f9c2e1...
```

**2 · Aplicația de servicii întreabă v5** și copiază headerul `Cookie` ca atare:

```
GET /api/v1/context?cont=soma
Cookie:        _stejar_session=SFMyNTY.g3QAAAAC...;  evt_device=a3f9c2e1...
Authorization: Bearer <token-ul aplicației de servicii>
```

**3 · v5 le recunoaște**, pentru că el le-a emis. Decriptează sesiunea, găsește omul, citește
cookie-ul de telefon, răspunde.

### Deci pasăm două lucruri

| | Ce răspunde |
|---|---|
| cookie-urile omului, retrimise ca atare | *cine* e |
| slug-ul contului (`?cont=soma`), din adresă | *pentru ce workspace* întrebăm |

Al doilea e necesar pentru că același om poate fi membru în mai multe primării.

### Aplicația de servicii nu poate citi cookie-urile

Sunt criptate cu o cheie pe care numai v5 o are. Le mută dintr-o cerere în alta fără să afle ce
conțin. Nu vede sesiunea nimănui — doar o transportă.

### Apelul în sine e autentificat

Fără asta, oricine ar putea lovi endpoint-ul de pe internet cu cookie-uri furate. Aplicația de
servicii se prezintă cu un token propriu, iar v5 verifică două lucruri separat:

1. **cine întreabă** → aplicația de servicii, prin token
2. **despre cine întreabă** → omul, prin cookie-uri

Fără primul, răspunsul e 401, indiferent ce cookie-uri primește.

### De ce nu merge fără același domeniu

Pe alt domeniu, browserul **nu ar trimite cookie-urile lui `soma.ro`** aplicației de servicii.
N-ar avea ce retransmite, și tot mecanismul ar cădea.

## Când se apelează

**Nu la fiecare pagină.** Doar când identitatea chiar contează:

| Ce face omul | Apel |
|---|---|
| Caută strada, vede programul | **nu** |
| Se abonează la notificări | **da** — trebuie `device_uid` |
| Își vede abonările | **da** — trebuie să știe ale cui |
| Intră în administrare | **da** — trebuie rolul |

Paginile publice sunt grosul traficului și nu apelează niciodată.

**Ce client e** vine din adresă — `/soma/s/deseuri` sau `soma.ro/s/deseuri` — deci și paginile
publice știu ce date să afișeze, fără să întrebe pe nimeni.

## Cache — 120 de secunde

Răspunsul se reține **două minute, per om**, cu cheia pe cookie-ul lui de sesiune.

O sesiune reală de administrare:

```
10:00:00   deschide lista de adrese     → apel          (1)
10:00:04   filtrează                    → din cache
10:00:11   deschide o adresă            → din cache
10:00:26   editează programul           → din cache
10:00:43   salvează                     → din cache
10:01:30   caută altceva                → din cache
10:02:10   deschide altă adresă         → apel          (2)
```

**Un apel la două minute**, indiferent câte click-uri face. Zece minute de lucru → 5 apeluri.

Compromisul: dacă cuiva i se retrage rolul în stejar, mai poate lucra **cel mult două minute**.
Pentru un backoffice de programe de colectare, e acceptabil.

## Timeout și ce se întâmplă la depășire

Obligatoriu de la început, nu ca îmbunătățire ulterioară. Fără el, o încetinire în v5 se propagă
tăcut în aplicația de servicii — și ajungi să cauți cauza unde nu e.

Timeout de **1 secundă**, cu purtare explicită:

| Pagina | La depășire |
|---|---|
| publică | continuă ca anonim — omul vede programul, doar nu se poate abona pe loc |
| administrare | eroare vizibilă, nu pagină înghețată |

## Rolurile

v5 rămâne singura sursă de adevăr. Aplicația de servicii nu decide niciodată singură cine e owner —
primește răspunsul și îl aplică:

- `owner` sau `developer` → intră în administrare
- orice altceva → 403

## Abonarea fără cont

**Cerință fermă:** omul se programează fără să-și facă cont, ca în v4. Deci v5 trebuie să știe
**pe ce telefon** trimite, deși nu știe **cine** e omul.

### Cum ajunge telefonul să fie cunoscut

Aplicația nativă își înregistrează telefonul la v5 la pornire. **v5 răspunde cu un cookie semnat care
conține identificatorul telefonului**, iar aplicația îl duce singură în pagina web.

```
App pornește → înregistrează telefonul → v5 răspunde cu cookie-ul
                                       → cookie-ul ajunge în pagina web
                                       → de acum v5 recunoaște telefonul
                                          ori de câte ori e întrebat
```

Se întâmplă la pornire, înainte de orice pagină — deci nu există moment în care cookie-ul lipsește.

### Ce primește aplicația de servicii

`device_uid` — identificatorul telefonului, la fel ca în v4. Îl salvează pe abonare și îl dă înapoi
când vrea să trimită o notificare.

Nu primește niciodată adresa de livrare (tokenul de push). Doar v5 o are.

Căutarea în v5 se face mereu pe **perechea** `device_uid` + `account_id` — indexul din
`mobile_app_devices` e unic pe amândouă, iar același telefon poate fi înregistrat la mai multe
primării.

**Detaliat în anexa „Cum circulă `device_uid`”.**

### Verificat în cod

- **Android** — cookie-urile primite de la API ajung automat în pagina web. **Zero schimbări.**
- **iOS** — mecanismul există, dar serviciul de înregistrare folosește clientul brut în loc de cel
  care propagă cookie-urile. **O linie.**

---

# 3 · Activarea per client

## Cine activează

**Echipa Eventya**, din panoul de admin, pe pagina contului: `/stejar-admin/accounts/soma`.

Modulele custom sunt contractate și plătite separat — nu se pornesc singure. Primăria nu le vede în
setările ei și nu le poate porni.

Owner-ul primăriei vede doar **rezultatul**: după activare, butonul apare în bara lui din stejar.

## De unde știe v5 ce servicii există

Nu le are scrise în cod. Le **cere aplicației de servicii**:

```
GET /catalog

→ [ { "cheie": "waste_pickup",
      "cale":  "deseuri",
      "nume":  { "ro": "Colectare deșeuri", "en": "Waste collection" },
      "icon":  "trash-2" } ]
```

Răspunsul se ține în cache 5 minute.

**Consecința:** un modul nou apare singur în panoul de admin, fără niciun deploy de v5. Adaugi
modulul în aplicația de servicii, îl treci în catalog, și în cel mult cinci minute e în listă, gata
de activat.

## Ce se întâmplă la activare

```
Cineva din Eventya deschide /stejar-admin/accounts/soma
        │
        ├─ v5 cere catalogul → afișează lista de servicii,
        │                      cu un comutator lângă fiecare
        ▼
Pornește „Colectare deșeuri"
        │
        ▼
┌─────────────────────────────────────────────────────┐
│ 1. v5 anunță aplicația de servicii                  │
│                                                     │
│    PUT /tenants/8f2a-…                              │
│    { cont:     { slug: "soma", nume: "Primăria …",  │
│                  limbi: ["ro","en"],                │
│                  fus: "Europe/Bucharest" },         │
│      servicii: { waste_pickup: { activ: true } } }  │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│ 2. Aplicația de servicii pregătește clientul        │
│                                                     │
│    creează rândul în tabela de clienți              │
│    → { ok: true }                                   │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│ 3. v5 bifează la el                                 │
│                                                     │
│    în services: activ + nume + icon + cale          │
│    (copiate din catalog, ca bara să citească        │
│     doar din baza de date)                          │
└──────────────────────┬──────────────────────────────┘
                       ▼
        Butonul apare în bara owner-ului,
        la următoarea pagină încărcată
```

Dacă pasul 2 eșuează, v5 **nu bifează nimic** și arată „activarea a eșuat, reîncearcă". Nu rămâne
stare pe jumătate.

## De ce se copiază numele și iconul în v5

Bara din stejar se randează la fiecare pagină din CMS. Dacă ar trebui să întrebe aplicația de
servicii de fiecare dată cum se cheamă butonul, ai un apel pe drumul critic al fiecărei pagini.

Așa, bara citește **doar din baza v5**. Iar dacă aplicația de servicii e picată, butonul tot apare —
pagina din spate dă 503, ceea ce e corect și onest.

## Dezactivarea

Același apel, cu `activ: false`.

- butonul dispare la următoarea pagină
- **datele rămân intacte** în aplicația de servicii
- reactivarea le regăsește exact cum erau

Ștergerea definitivă e altceva: se face doar când se șterge contul, cu un apel separat.

## Unde se atinge v5

| Ce | Unde |
|---|---|
| Coloana `services` | metadatele contului |
| Ecranul de servicii pe pagina contului | `/stejar-admin/accounts/:slug` — tiparul există deja |
| Clientul care cere catalogul + cache | serviciu nou în v5 |
| Apelul de activare | același serviciu |

---

# 4 · Butonul din bara stejar

## Ce vede omul

În bara de sus din stejar, lângă Pagini / Media / Helpdesk:

```
[ Pagini ]  [ Media ]  [ Helpdesk ]  [ 🗑 Colectare deșeuri ]
                                       └── /soma/s/deseuri/admin
```

Apare doar la primăriile care au serviciul activat, și doar pentru `owner` și `developer`.

## Mecanismul există deja în v5

Moștenit din sistemul de plugin-uri al v4, nefolosit până acum. Verificat în sursă:

- `Stejar.configuration.register_extension` — înregistrare cu nume, icon, cale, roluri
- `Stejar::Layout::Navbar#app_plugins_links` — le desenează, cu stare „activ"
- `check_custom_extension_access` — conține literal *„Owner and developer have full access to all
  custom extensions"*, cu `return true if full_access?`
- `FULL_ACCESS_ROLES = %w[owner developer]`

## Ce lipsește

Extensiile sunt **globale și înghețate la pornire**:

```ruby
def finalize!
  @all_extensions = {…}.freeze   # aceleași pentru toate workspace-urile
end
```

Adică butonul ar apărea la **toate** primăriile, inclusiv la cele care n-au serviciul.

## Ce se schimbă

Bucla existentă rămâne neatinsă — se extrage într-o metodă, și se adaugă una nouă care citește
coloana scrisă la activare:

```ruby
def app_plugins_links
  @app_plugins_links ||= configured_links + workspace_service_links
end

private

def workspace_service_links
  return [] unless @current_membership&.full_access?

  @current_membership.account.active_services.map do |service|
    { key: service.key, name: service.label, icon: service.icon,
      path: service.path, active: @current_url.starts_with?(service.path) }
  end
end
```

Numele, iconul și calea vin din baza v5 — copiate acolo la activare. **Nicio cerere de rețea la
randarea barei.**

## Cine îl vede

| Rol | Vede butonul |
|---|---|
| owner | da |
| developer | da |
| editor, page manager, member | nu — nici măcar dezactivat |

Verificarea o face v5 la afișare. Aplicația de servicii **o face din nou la intrare**, pe baza
răspunsului de la punctul 2 — nu se bazează pe faptul că butonul n-ar fi fost vizibil.

## Regula care ține produsul curat

Butonul scrie „Colectare deșeuri", dar în codul v5 **nu apare nicăieri cuvântul ăsta**. Eticheta,
iconul și calea vin din date.

Verificabil mecanic, în CI:

```bash
grep -ri "deseuri\|waste_pickup\|soma" stejar/app stejar/lib
# trebuie să întoarcă zero
```

Peste doi ani, cu cinci module la trei clienți, `navbar.rb` arată exact la fel.

---

# 5 · Notificările

## Principiul

**Aplicația de servicii decide *când*. v5 *livrează*.**

Doar aplicația de servicii știe că mâine e ridicare pe Mihai Viteazu. Doar v5 știe pe ce adresă se
livrează pe telefonul lui Ion.

## Traseul

```
19:00:00  jobul din aplicația de servicii:
          „cine are ridicare mâine?"  →  340 de abonări
              │
19:00:02  O SINGURĂ TRANZACȚIE
              marchează abonările ca notificate
              scrie 340 de rânduri în lista de așteptare
              fiecare cu termen de valabilitate: 20:00
          COMMIT
              │
              │   ← din clipa asta nu se mai poate pierde nimic
              │
19:00:05  curierul golește lista, la ritm impus
              │
19:00:06  v5:  găsește destinatarul  →  răspunde imediat
                                     →  push + clopoțel, în fundal
              │
19:00:07  curierul citește răspunsul:
              acceptat    → bifează
              necunoscut  → șterge abonarea
              │
19:00:39  gata — toate 340 trimise
```

## Cele patru piese

**1 · Jobul de calcul + lista de așteptare.** Calculul și intenția de trimitere se scriu în
**aceeași tranzacție**. Dacă serviciul ar suna v5 direct din job și v5 e picat zece minute, cele 340
de notificări s-ar evapora fără ca nimeni să afle.

**2 · Curierul.** Un proces separat care golește lista, cu reîncercări la eșec.

**3 · Endpoint-ul în v5.** Răspunde imediat ce a găsit destinatarul; trimite push-ul în fundal.

```
POST /api/v1/notifications
{ "cheie":  "wp:8412:2026-08-13",
  "device_uid": "A3F9C2E1-8B44-…",
  "cont":       "8f2a-…",
  "titlu":  "Colectare deșeuri mâine",
  "text":   "Reciclabile — Str. Mihai Viteazu 12",
  "link":   "/s/deseuri/programul-meu" }

→ 200  { "stare": "acceptat" }
```

Găsirea destinatarului e rapidă — câteva citiri din bază. Trimiterea la Google/Apple e lentă.
Serviciul are nevoie doar de prima parte: să știe pe cine să șteargă.

**4 · Curățenia**, din răspuns, fără webhook-uri:

| Ce spune v5 | Ce face serviciul |
|---|---|
| `acceptat` | bifează în listă |
| `necunoscut` | **șterge abonarea** — telefonul nu mai există |
| `fara_token` | păstrează, dar omul primește doar în clopoțel |

Ăsta e mecanismul care ține cele două baze aliniate, fără niciun cablu între ele.

## Regulile stabilite

### R1 · Un mesaj per apel, fără loturi

Nu vor fi atât de multe notificări în același minut cât să justifice complicarea.

*De revenit doar dacă:* se atinge plafonul. Atunci se adaugă loturi peste același endpoint —
100 de mesaje per cerere ridică plafonul de 60×, fără să se rescrie nimic în module.

### R2 · Push și clopoțel, amândouă

Push-ul poate fi refuzat de om sau blocat de sistem. **Clopoțelul nu ratează niciodată** — omul
găsește notificarea în aplicație chiar dacă n-a primit-o pe ecran. E deja construit în v5.

### R3 · Textul îl scrie aplicația de servicii

Vine gata scris, în limba omului. **v5 nu-l compune, nu-l traduce, nu-l înțelege — îl duce.**

Consecința: v5 rămâne complet ignorant despre ce înseamnă „reciclabile". Modulul următor trimite alt
text prin exact același endpoint.

### R4 · Termen de o oră

Fiecare rând din listă are un termen: **ora în care a fost creat, plus una.**

```
19:00  scris în listă, termen 20:00
       │
       ├─ pleacă până la 20:00      →  livrat
       └─ n-a plecat până la 20:00  →  marcat expirat, nu se mai trimite
```

Dacă curierul stă blocat șase ore și se dezmorțește la 3 noaptea, „colectare mâine" e încă adevărat —
dar trimis atunci deranjează. La două zile, e de-a dreptul greșit.

Efect secundar util: regula **face inutile orele de liniște**. O rafală de la 19:00 ori pleacă până la
20:00, ori nu mai pleacă deloc. Nu ajunge niciodată la 3 noaptea.

O notificare expirată e pierdută **intenționat**. E preferabilă uneia trimise la ora greșită.

### R5 · Reîncercările se opresc singure

Fără număr maxim. Curierul reîncearcă cu pauze crescânde, iar termenul de o oră taie de la sine.

## Ritmul și limita

Un apel se închide în ~15 ms — v5 doar găsește destinatarul, push-ul pleacă în fundal. Tehnic, cele
340 ar putea pleca în 5 secunde. Constrângerea nu e viteza, ci limita API-ului.

**Limită separată pentru aplicația de servicii: 600 pe minut** (restul API-ului rămâne la 120).

```ruby
class NotificationsController < BaseController
  rate_limit to: 600, within: 1.minute, by: -> { rate_limit_key }
end
```

| Abonări scadente într-o seară | Durată |
|---|---|
| 340 *(estimarea SOMA)* | 34 s |
| 2.000 | 3,5 min |
| 36.000 | 60 min — plafonul orar |

La 10 mesaje pe secundă, v5 consumă ~15% dintr-un singur fir de execuție. Practic zero.

### De ce păstrăm totuși o limită

Nu pentru capacitate. Pentru două lucruri concrete:

1. **Plasă de siguranță pentru bug-uri.** Dacă cineva scrie greșit condiția de oprire a curierului și
   intră în buclă, limita e singurul lucru care oprește un proces care lovește v5 de 60 de ori pe
   secundă la nesfârșit.
2. **Rafala nu concurează cu oamenii.** La 19:00 lumea navighează site-ul. Nimeni nu observă dacă
   notificările ajung în 3 secunde sau în 34.

### Curierul se autolimitează

Chiar cu limita ridicată, trimite la ritm impus — **10 pe secundă**, nu cât poate.

Dacă ar trage necontrolat, ar primi refuzuri și ar intra în pauze și reîncercări. Ar ieși **mai lent**
decât mergând liniștit de la început.

## Ce se întâmplă când ceva cade

| Situație | Rezultat |
|---|---|
| Jobul de calcul crapă | tranzacția se anulează întreagă; se reia la ora următoare |
| Curierul moare după commit | rândurile rămân în listă, pleacă la repornire |
| v5 e jos 10 minute | curierul reîncearcă; notificările pleacă cu întârziere, **toate** |
| v5 e jos peste o oră | rândurile expiră; notificările se pierd, dar **se știe exact care** |
| Curierul moare după trimitere, înainte să bifeze | reîncearcă → cheia de idempotență oprește dublura |
| Firebase respinge telefonul | v5 curăță tokenul și raportează; serviciul șterge abonarea |
| Omul a refuzat notificările | push-ul nu pleacă, dar o găsește în clopoțel |

---

# 6 · Ce se atinge, cât costă, ce rămâne deschis

## Ce se atinge în v5

| # | Ce | Din punctul | Efort |
|---|---|---|---|
| 1 | Regula de rutare `/s/*` | 1 | ~2 h |
| 2 | `s` adăugat în `RESERVED_SLUGS` | 1 | 10 min |
| 3 | `GET /api/v1/context` | 2 | ~3 h |
| 4 | Cookie cu identificatorul telefonului, la înregistrare | 2 | ~1 h |
| 5 | Cookie-ul de device citit în `context` | 2 | ~1 h |
| 6 | Coloana `services` pe metadatele contului | 3 | 30 min |
| 7 | Client pentru catalog + cache 5 min | 3 | ~3 h |
| 8 | Apelul de activare / dezactivare | 3 | ~2 h |
| 9 | Ecranul de servicii pe pagina contului din admin | 3 | ~1 zi |
| 10 | Butonul în bara stejar | 4 | ~1 h |
| 11 | `POST /api/v1/notifications` + limita de 600/min | 5 | ~3 h |
| 12 | Testul de grep în CI | 4 | ~1 h |

**Total v5: ~4 zile.**

Niciuna nu conține numele vreunui client sau modul. Toate se folosesc de la al doilea modul încolo,
fără modificări.

## Ce se atinge în aplicațiile native

| | Ce | Efort |
|---|---|---|
| **iOS** | serviciul de înregistrare folosește clientul care propagă cookie-urile | o linie + o versiune nouă |
| **Android** | — | zero |

## Ce se construiește în aplicația de servicii

Doar infrastructura comună, **nu modulul de deșeuri**:

| Ce | Efort |
|---|---|
| Scheletul aplicației, tenancy, deploy | ~2 zile |
| Apelul de identitate + cache 120 s + timeout 1 s | ~3 h |
| Endpoint-ul de catalog | ~2 h |
| Endpoint-ul de activare / dezactivare a clienților | ~3 h |
| Lista de așteptare + curierul cu ritm impus | ~1 zi |

**Total: ~3,5 zile.**

## Efort cumulat

| | |
|---|---|
| v5 | ~4 zile |
| Aplicația de servicii — infrastructura | ~3,5 zile |
| iOS | o linie |
| **Total până la „se poate conecta un modul"** | **~8 zile** |

De la al doilea modul încolo, costul de conectare e **zero** — se adaugă în catalog și apare singur.

## Ce NU acoperă planul ăsta

Modulul de colectare a deșeurilor în sine: adresele, programele, abonările, importul din CSV,
paginile publice, backoffice-ul, migrarea datelor din v4.

Planul de față descrie **doar cum se leagă o aplicație de servicii de Eventya v5.** Modulul e un
plan separat, care se sprijină pe ăsta.

## Deciziile luate

Fiecare cu motivul, ca validarea să poată contesta raționamentul, nu doar concluzia.

| # | Decizie | De ce |
|---|---|---|
| D1 | Aplicație separată, nu modul în stejar | v5 e produs vândut identic multor clienți; modulele custom în produs îl degradează ireversibil |
| D2 | Montată sub domeniul clientului, pe cale `/s/*` | fără same-origin cad simultan cookie-urile, deep-link-urile din push, navigarea nativă și sesiunea comună |
| D3 | Ambele forme de URL funcționează permanent | aplicația mobilă folosește mereu `eventya.net/soma/…`, chiar și după ce clientul are domeniu propriu |
| D4 | Identitatea prin apel către v5, nu prin pachet semnat | pachetul aduce chei de rotit, reînnoiri care pot prinde omul în mijlocul unui formular, câmpuri greu de adăugat și drepturi care întârzie să dispară |
| D5 | `device_uid` direct, nu un cod opac | fără migrație și fără concept nou; identic cu v4. Aplicația de servicii tot nu primește adresa de push |
| D6 | Abonare fără cont | cerință fermă, ca în v4 |
| D7 | Activarea o face echipa Eventya, din admin | modulele custom sunt contractate; clientul nu le pornește singur |
| D8 | v5 cere catalogul, nu îl are scris în cod | un modul nou apare singur, fără niciun deploy de v5 |
| D9 | Lista de așteptare tranzacțională pentru notificări | apelul direct din job pierde notificări la orice cădere a v5 |
| D10 | Termen de o oră pe notificări | o notificare expirată e preferabilă uneia trimise la 3 noaptea |
| D11 | Serviciul deține abonările; v5 e doar transportor | două surse de adevăr ar produce notificări către oameni dezabonați |
| D12 | Textul notificării îl scrie serviciul | v5 rămâne ignorant despre ce înseamnă „reciclabile" |

## Necunoscute rămase

### 1 · Confirmarea pe telefon real

Codul spune că mecanismul cu cookie-uri funcționează pe ambele platforme. Confirmarea finală se face
cu un log temporar pe staging, ca să vezi cookie-ul ajungând în pagina web după înregistrare.

**Nu mai e o necunoscută de arhitectură — e o verificare de rulare.** O zi, cu tot cu deploy.

### 2 · Migrarea abonaților din v4

Pe iOS, identificatorul telefonului e `identifierForVendor` — stabil per cont de dezvoltator, per
telefon.

| Situație | Abonările se pot migra |
|---|---|
| Același cont de dezvoltator Apple, omul face update | **da** |
| Omul dezinstalează v4 și instalează v5 din nou | nu |
| Cont de dezvoltator diferit între v4 și v5 | nu |

E o întrebare de administrare, nu de cod. Pe Android trebuie verificat separat ce sursă folosește.

Contează pentru ce promiți clientului: dacă răspunsul e „nu", ai nevoie de un plan de reabonare,
comunicat din timp.

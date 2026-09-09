# Cum circulă `device_uid` între v5 și aplicația de servicii

Sunt **două drumuri**, în momente diferite.

---

# DUS — cum ajunge la aplicația de servicii

Se întâmplă **o singură dată**, când omul se abonează.

## 1 · Telefonul se prezintă la v5

La pornirea aplicației:

```
POST /mobile_app/api/v1/devices
{ "token": "A3F9C2E1-8B44-…" }
```

v5 salvează rândul și răspunde cu un cookie semnat:

```
Set-Cookie: evt_device=A3F9C2E1-8B44-…--a7f3d91c2e; HttpOnly; Secure
                       └─── valoarea ───┘  └─ semnătura ─┘
```

Aplicația nativă duce cookie-ul în pagina web. De aici încolo, orice pagină deschisă în aplicație
îl poartă cu ea.

## 2 · Ion apasă „Anunță-mă"

Cererea ajunge la aplicația de servicii cu cookie-ul atașat automat:

```
POST soma.ro/s/deseuri/abonari
Cookie: evt_device=A3F9C2E1-8B44-…--a7f3d91c2e
```

**Aplicația de servicii nu poate citi cookie-ul** — semnătura e a v5.

## 3 · Îl întreabă pe v5

Retrimite cookie-ul exact cum l-a primit:

```
GET soma.ro/api/v1/context?cont=soma
Cookie:        evt_device=A3F9C2E1-8B44-…--a7f3d91c2e
Authorization: Bearer <tokenul aplicației de servicii>
```

## 4 · v5 răspunde

Verifică semnătura, apoi:

```json
{ "cont":       "8f2a-…",
  "device_uid": "A3F9C2E1-8B44-…",
  "rol":        "vizitator" }
```

**Ăsta e momentul în care aplicația de servicii primește `device_uid`.** Prin răspunsul HTTP,
nu prin cookie.

## 5 · Îl salvează

```ruby
Subscription.create!(
  schedule_id: 88,
  device_uid:  "A3F9C2E1-8B44-…",
  account_id:  "8f2a-…"
)
```

Gata cu drumul dus. Cookie-ul nu mai interesează pe nimeni.

---

# ÎNTORS — cum îl trimite înapoi

Seara, când notifică.

## 6 · Îl scoate din baza lui

```
POST soma.ro/api/v1/notifications
Authorization: Bearer <tokenul aplicației de servicii>

{ "cheie":      "wp:8412:2026-08-13",
  "cont":       "8f2a-…",
  "device_uid": "A3F9C2E1-8B44-…",
  "titlu":      "Colectare deșeuri mâine",
  "text":       "Reciclabile — Str. Mihai Viteazu 12" }
```

**Fără cookie-uri.** Aici nu mai e nimeni în fața ecranului — e un job care rulează la 19:00.
Autentificarea e doar tokenul aplicației de servicii.

## 7 · v5 îl caută

```ruby
device = Device.find_by(device_uid: "A3F9C2E1-8B44-…", account_id: "8f2a-…")
# → push_token: "fcm:dK9x…"
```

**Ambele câmpuri, nu doar `device_uid`.** Indexul din `mobile_app_devices` e unic pe perechea
telefon + primărie:

```ruby
t.index ["device_uid", "account_id"],
        unique: true,
        where: "((sandbox = false) AND (account_id IS NOT NULL))"
```

Același telefon, cu aplicația de la SOMA și cu cea de la Cluj, are **două rânduri cu același
`device_uid`**. O căutare doar după `device_uid` poate nimeri rândul altei primării — bug care
apare abia când cineva are două aplicații Eventya pe telefon, și e greu de reprodus.

## 8 · Trimite și răspunde

```json
{ "stare": "acceptat" }
```

---

# Diferența care trebuie reținută

| | Dus (pașii 1–5) | Întors (pașii 6–8) |
|---|---|---|
| Când | omul se abonează | seara, la trimitere |
| Cine declanșează | omul, cu degetul pe ecran | un job programat |
| Cum se identifică | **cookie-ul omului**, retrimis de aplicația de servicii | **tokenul aplicației de servicii** |
| Cine dă `device_uid` | v5 → aplicația de servicii | aplicația de servicii → v5 |

Cookie-ul apare **doar la dus**, și doar ca să afle v5 despre ce telefon vorbim.

La întors nu există niciun cookie — valoarea e deja salvată în baza aplicației de servicii.

---

# Într-o frază

v5 îl dă **o dată**, în răspunsul la `context`, când omul se abonează.
Aplicația de servicii îl păstrează.
I-l dă înapoi **de fiecare dată** când vrea să trimită o notificare.

---

# De ce `device_uid` și nu un cod inventat

Se pusese în discuție un cod opac (`sub_7f3a9c`), generat de v5, care să nu spună nimic în afara lui.

**Decizia: rămâne `device_uid`**, la fel ca în v4.

| | Ce câștigi | Ce pierzi |
|---|---|---|
| `device_uid` | fără migrație, fără concept nou, identic cu v4, ușor de urmărit în depanare | identificatorul telefonului ajunge și în baza aplicației de servicii |
| cod opac | pseudonim; s-ar putea repointa spre alt telefon fără ca modulul să afle | o coloană, un concept și o traducere în plus |

Consecința deciziei: dacă omul schimbă telefonul, abonările vechi rămân agățate de un telefon care
nu mai există. La prima trimitere, v5 răspunde `necunoscut` și abonarea se șterge — omul se abonează
din nou. **La fel ca în v4.**

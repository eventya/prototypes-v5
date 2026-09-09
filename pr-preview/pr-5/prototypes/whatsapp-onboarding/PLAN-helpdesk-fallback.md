# WhatsApp Onboarding — plan de implementare

**Obiectiv:** în panoul Setări → WhatsApp, un workspace care *nu are încă WhatsApp activat* vede un
formular de onboarding (Nume, Prenume, Email, Număr de telefon) cu o explicație clară despre cum
funcționează și despre cerința numărului „curat". La trimitere, solicitarea devine **tichet în
helpdesk-ul contului root „eventya"** — echipa Eventya preia activarea.

Nu se implementează nimic încă. Ecrane: `01-onboarding-form.html`, `02-confirmation.html`, `03-status.html`.

---

## 1. UX / unde apare

Panoul are azi două stări (`app/views/stejar/helpdesk/settings/whatsapp/show.html.erb`):

| `whatsapp_available?` | Azi | După feature |
|---|---|---|
| `false` | card gol „WhatsApp is coming soon" | **Formularul de onboarding** (explicație + callout + câmpuri) |
| `false` + cerere deja trimisă | — | Stare „Cerere trimisă" (status + recap) — *vezi §6* |
| `true` | formular de conectare (număr + toggle) | neschimbat |

Fluxul rămâne compatibil cu gate-ul pe 2 nivele existent: super-admin tot flipează
`whatsapp_available` din stejar-admin; onboarding-ul e doar ce vede workspace-ul *înainte* de flip.

Conținutul formularului (din prototip):
- card „hero" (ce e WhatsApp ca și canal de suport),
- „Cum funcționează" — cei 3 pași existenți (`how_it_works.step_1..3`),
- **callout galben**: numărul trebuie să fie dedicat și **să NU fie deja pe WhatsApp / WhatsApp Business**,
- câmpuri: **Nume, Prenume, Email, Număr de telefon**, apoi sub-secțiunea **„Profilul WhatsApp"** cu
  **Numele afișat pe WhatsApp** (ce văd cetățenii) + **Poza de profil** (upload imagine, opțional),
  apoi **Observații (textarea, opțional)** + checkbox de confirmare că numărul e curat,
- buton „Trimite solicitarea" → stare de succes.

**Observații = textarea simplu** (text pe mai multe rânduri, `field_type: textarea`). Se salvează ca
text în corpul tichetului.

Panoul are **3 stări** (vezi prototip): `Formular` → `Confirmare imediată` (după submit) →
`Status (după)` — starea persistentă cu timeline pe care o vede userul când revine cât timp cererea e
în lucru.

**Timeline-ul are doar 2 pași:** `Solicitare trimisă` (done) → `În verificare` (activ). Pasul „Număr
conectat" **NU** apare aici: în momentul în care numărul e conectat (`whatsapp_available = true`),
panoul se schimbă automat în formularul de configurare — deci userul nu mai vede niciodată starea de
status cu acel pas atins. În loc de al 3-lea pas, o notă explică tranziția: *„Când numărul e conectat,
acest panou devine automat formularul de configurare WhatsApp."*

---

## 2. Flux de date

```
Workspace admin (helpdesk.settings)
  └─ POST /:account/helpdesk/settings/whatsapp/onboarding_request
        WhatsappController#onboarding_request
          │ validează params (nume, prenume, email, telefon, display_name, confirmare) + poza (opțional)
          ▼
     Stejar::Helpdesk::WhatsappOnboardingTicketCreator.call(params:, requesting_account:, requesting_user:)
          │ target_account = Account.find_by(slug: root_account_slug)   # „eventya"
          │ form   = Form.whatsapp_onboarding(target_account)
          │ dept   = Department.inbox(target_account)
          │ cust   = Customer.where(email:, account: target_account).first_or_create!  (name = „Prenume Nume")
          │ ticket = form.tickets.create!(account: target_account, department: dept, customer: cust,
          │                               status: :open, priority: :medium, source: :other)
          │ populează ticket_values (nume/prenume/email/telefon/display_name) SAU un Comment lizibil
          │ atașează poza de profil pe comment/ticket (Active Storage), dacă a fost încărcată
          │ save_internal_note(...)  ← context: workspace sursă (nume + slug), user solicitant
          ▼
     tichet nou în helpdesk-ul „eventya" → apare la echipa Eventya ca orice tichet
```

Reutilizează **exact** pattern-ul `AiAssistant::SupportTicketCreator` (care deja creează tichet în
contul root) — `app/services/stejar/ai_assistant/support_ticket_creator.rb` +
`app/services/stejar/ai_assistant/ticket_creator.rb`.

---

## 3. Ce conține tichetul (ce vede echipa Eventya)

- **Client (Customer):** solicitantul — `„Prenume Nume"` + email (first_or_create pe email, în contul eventya).
- **Corp / câmpuri:**
  - Nume + Prenume
  - Email de contact
  - **Numărul de integrat** (format internațional)
  - **Numele afișat pe WhatsApp** (display name-ul care apare cetățenilor)
  - **Poza de profil** — imaginea încărcată, atașată la tichet (Active Storage), dacă a fost pusă
  - **Observații** (text, dacă solicitantul a completat)
  - **Workspace sursă**: numele + slug-ul workspace-ului care cere (`requesting_account.name` / `.slug`) — esențial ca echipa să știe *pe care* workspace să flipeze `whatsapp_available`
  - Confirmarea „număr curat": Da/Nu
- `source: :other`, `priority: :medium`, `department: Inbox`.

Recomandare: pune datele într-un **Comment lizibil** (ca fluxul WhatsApp inbound), nu doar în
`ticket_values` — e mai ușor de citit de un agent. Detaliile structurate pot merge într-o notă internă.

---

## 4. Modificări backend

| # | Fișier | Modificare |
|---|---|---|
| 1 | `app/models/stejar/helpdesk/form.rb` | Constantă `SYSTEM_DEV_KEY_WHATSAPP_ONBOARDING = 'whatsapp_onboarding'`; adaug-o în `SYSTEM_DEV_KEYS`; metodă `self.whatsapp_onboarding(account)` (oglindă la `self.ai_assistant`) cu câmpurile first_name/second_name/email/phone/**display_name** + **observations (`field_type: textarea`)**. Poza NU e un form_field — e o **atașare Active Storage** pe tichet/comment. |
| 2 | `app/services/stejar/helpdesk/whatsapp_onboarding_ticket_creator.rb` **(nou)** | Serviciul de creare tichet în contul root. Fie subclasă din `AiAssistant::TicketCreator` (override `target_account`, `value_for`), fie `ApplicationService` slab. Guard când root e absent. |
| 3 | `app/controllers/stejar/helpdesk/settings/whatsapp_controller.rb` | Acțiune nouă `onboarding_request`: validează params, cheamă serviciul, răspunde cu flash/turbo (succes sau erori). NU folosește `current_account` pentru tichet — țintește root. |
| 4 | `config/routes/helpdesk.rb` | `resource :whatsapp, only: %i[show update] do; post :onboarding_request; end` |
| 5 | `app/views/stejar/helpdesk/settings/whatsapp/show.html.erb` + partial `_onboarding_form.html.erb` **(nou)** | Randează formularul în ramura `else` (când `!whatsapp_available?`). |
| 6 | `config/locales/{en,ro,it,hu,de,fr,es}/helpdesk.yml` | Chei noi sub `helpdesk.settings.whatsapp.onboarding.*` (titluri, callout, labels, mesaje succes/eroare, timeline status) |
| 7 | migrare + `stejar_account_meta` | Coloană `whatsapp_onboarding_requested_at :datetime` (pentru starea „Status după") — vezi §6 |

**Fără tabele noi** (respectă preferința): totul reutilizează `Form`/`Ticket`/`Comment`/`Customer`.

---

## 4b. Cum se conectează formularul cu helpdesk-ul (embed vs. nativ) — DECIZIE

Întrebarea: *„creez un formular în helpdesk pe Eventya și îl embed, sau cum se face?"*

Sunt două variante. **Recomand varianta B (nativ + serviciu).**

### Varianta A — form public în Eventya + `<iframe>` embed
Creezi manual un formular în helpdesk-ul Eventya (Nume/Email/Telefon/Observații), iei codul de embed
și pui iframe-ul în panoul de WhatsApp. Submisia intră nativ ca tichet prin
`Stejar::HelpdeskPublic::TicketsController` (există deja, `source: :embed`).

- ✅ Zero cod; echipa poate edita câmpurile singură.
- ❌ **Nu știe cine cere** — iframe-ul e cross-origin, nu are `current_account`/`current_user`.
  Ar trebui să pasezi workspace-ul prin query-param în URL-ul de embed și să-l mapezi pe un câmp
  ascuns — fragil, iar userul l-ar putea modifica.
- ❌ Stilul iframe-ului **nu se potrivește** cu panoul; arată lipit.
- ❌ Nu poți lega curat checkbox-ul „număr curat" / starea „status după" de panou.

### Varianta B — formular nativ în panou + serviciu server-side (RECOMANDAT)
Formularul e randat **nativ** în panou (Rails form, exact ca în prototip), face POST către
`WhatsappController#onboarding_request`, care cheamă `WhatsappOnboardingTicketCreator`. Serviciul
creează tichetul **direct în contul Eventya** via `Form.whatsapp_onboarding(root_account)`.

- ✅ UI identic cu restul CMS-ului (fără iframe).
- ✅ **Atașează automat workspace-ul sursă** (`current_account.name` + `.slug`) și solicitantul
  (`current_user`) — echipa Eventya știe exact pe cine să activeze. Nu se poate falsifica.
- ✅ Control total pe validare (checkbox „număr curat", format telefon) și pe starea „status după".
- ✅ Tichetul e **la fel de nativ** ca la varianta A — tot un `Ticket` real în helpdesk-ul Eventya.
- ⚙️ Cost: puțin cod (1 serviciu + 1 acțiune + 1 system form), dar reutilizează pattern-ul deja
  testat `AiAssistant::SupportTicketCreator`.

**Cheia:** și în varianta B există un `Form` real în workspace-ul Eventya (`Form.whatsapp_onboarding`,
creat programatic prin `first_or_create!`) — doar că îl **randăm noi în panou**, nu prin iframe. Deci
„formularul din helpdesk-ul Eventya" există; nu e nevoie să-l faci manual și nici să-l embed-uiești.

---

## 5. Validare & edge cases

- **Required:** nume, prenume, email (format valid), telefon (prezent; normalizare whitespace, ideal E.164), **numele afișat pe WhatsApp**, checkbox de confirmare bifat.
- **Poza de profil (opțional):** formular **multipart**; validare tip imagine (JPG/PNG), dimensiune (max 5MB), ideal pătrată (min. 640×640px). Se atașează la tichet/comment prin Active Storage; dacă lipsește, nu blochează trimiterea.
- **Root account lipsă** → serviciul întoarce `failure`, controllerul arată eroare generică (nu crapă).
- **Permisiune:** rămâne `requires_permission "helpdesk.settings"`.
- **Workspace-ul curent ESTE eventya root** → tichetul se creează în același cont; ok.
- **Telefon deja folosit** de alt workspace (`whatsapp_phone_number` e unic global) → *nu* validăm aici (numărul nu e încă conectat); echipa Eventya verifică manual. De menționat în tichet.

---

## 6. Stare „cerere în așteptare" / status după submit (fără tabel nou)

Designul e în prototip (tab-ul **„Status (după)"**): status „În verificare" + timeline cu **2 pași**
(Solicitare trimisă → În verificare) + nota de tranziție + recap datele trimise + contact.

Implementare, fără tabel nou — o coloană `whatsapp_onboarding_requested_at :datetime` pe
`stejar_account_meta`:
- setată la prima trimitere → panoul arată **starea de status** în loc de formularul gol,
- previne spam-ul cu cereri duplicate,
- se resetează când super-adminul flipează `whatsapp_available` (atunci apare formularul de conectare).

Logica de randare în view:
```
!whatsapp_available? && onboarding_requested_at.present?  → starea Status (§ prototip)
!whatsapp_available? && onboarding_requested_at.nil?      → Formularul de onboarding
whatsapp_available?                                        → Formularul de conectare (azi)
```

---

## 7. Teste

- **Request spec** `spec/requests/.../settings/whatsapp_controller_spec.rb`: `onboarding_request` creează
  un tichet în contul root cu datele corecte; erorile de validare re-randează formularul; gate de permisiune.
- **Model spec** pentru `Form.whatsapp_onboarding` (first_or_create, câmpuri, `system?`).
- **Service spec** pentru `WhatsappOnboardingTicketCreator` (target = root; failure când root lipsește;
  mapare câmpuri; context workspace sursă în corp).

---

## 8. Nota de branch (important)

`main` are panoul WhatsApp cu config pe `@account_meta` (deployabil). Feature-ul se construiește
curat **peste `main`**. Dacă între timp se merge `feat/whatsapp-twilio-subaccounts` (config mutat pe
`Responder`), doar contextul ramurii `else` din view se schimbă (`@responder` vs `@account_meta`) —
codul de onboarding în sine e independent de asta.

---

## 9. Decizii luate (spune dacă vrei altfel)

- Câmpurile Nume/Email se **pre-completează** din `current_user` dar rămân editabile.
- **Fără** câmp manual „Instituție/Workspace" — atașăm automat `current_account` (nume + slug) în tichet.
- Prefix telefon **fix `+40`** în prototip; se poate face selector de țară dacă țintiți și non-RO.
- Corpul tichetului = **Comment lizibil** (nu doar ticket_values).
- Observații = **textarea** simplu (nu rich text).
- Starea „Status după" (§6) = **inclusă** (ai cerut designul) — necesită coloana `whatsapp_onboarding_requested_at`.
- Conectare = **nativ + serviciu** (varianta B din §4b), nu iframe embed.

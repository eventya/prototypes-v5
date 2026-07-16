# Plan de implementare — Auto-reply & Suggested replies (Helpdesk)

**Status:** rescris integral 2026-07-16, după review (council + cercetare de piață + lentilă de business).
Versiunea anterioară a acestui document e **invalidă** — descria pre-fill în composer, un flag `automated`, un singur modul „Autoresponder", fără i18n, cu generare la crearea tichetului. Fiecare din aceste decizii a fost răsturnată. Prototip clickabil: `scratchpad/autoresponder-prototype.html`.

---

## 0. Contextul care schimbă totul

Commitul **`8f878f140` (2026-07-13, Calin Cufteac)** — acum 3 zile — a șters botul WhatsApp:

> Removed the FAQ bot (OpenAI gpt-4o-mini), the per-account AI prompt and fallback message, **and the Responder model/table**. The bot answered unconditionally — talking over agents mid-thread — and had no token cap. **Anything smarter gets built separately.**

Deci: acesta **este** „anything smarter". Commitul e simultan mandatul și lista modurilor de eșec de evitat:
| Cauza morții lui v1 | Cum e evitată aici |
|---|---|
| răspundea necondiționat | ack-ul e text fix, o dată per conversație; AI-ul **nu vorbește niciodată cu clientul** |
| vorbea peste agenți mid-thread | ack-ul pleacă doar la deschiderea tichetului |
| fără plafon de tokeni | **plafon decis înainte de prima linie de cod** (§4.6) — netransferabil în „decizii deschise" |

Commitul a mutat și configul de pe o tabelă dedicată înapoi pe `account_meta`. **Deci JSONB pe `account_meta` nu e o preferință, e continuarea unei decizii de 72 de ore.**

---

## 1. Două funcții, nu una

Council + business au convers: ack-ul fix și draftul AI au risc, cost și cadență diferite. Le legăm doar prin navigare, nu prin cod.

| | **Auto-reply** | **Suggested replies** |
|---|---|---|
| AI | nu | da |
| Cost | 0 | tokeni |
| Riscul | mesaj greșit la client | draft prost / ancorare agent |
| Livrare | 1–2 zile | separat |
| Kill switch | propriu | propriu |

**Navigare:** un rând în Settings → `Auto-reply`. Pagina lui = master toggle + 3 boxuri de canal + (secțiune `For agents`) card `Suggested replies` → pagină proprie.
**Critic:** cardul de sugestii stă **în afara** zonei guvernate de master toggle-ul auto-reply. Stingi auto-reply → sugestiile rămân vii. Sunt independente în cod, nu doar pe hârtie.

Numele „Autoresponder" **nu se folosește** — e numele lucrului șters pe 13 iulie.

---

## 2. ⚠️ Corecție: ce am greșit în review

**Am afirmat că ack-ul ar falsifica first-response SLA. Fals.** `Stejar::Helpdesk::Slas::FirstResponseDetector:31-34` are deja garda, scrisă pe vremea botului:

```ruby
# A "first response" is a reply from a human agent. Automated/system
# comments (e.g. the WhatsApp FAQ bot) carry no user — skip them so
# they don't satisfy the SLA before any human sees the ticket.
return if comment.user_id.nil?
```

**Ce e însă real:** garda aia e o convenție implicită (`user_id.nil?` ⇒ automat) și **celelalte consumatoare nu o au**:

| Consumator | Gardă | Un ack `agent + user:nil` ar… |
|---|---|---|
| `first_response_detector.rb:34` | `creator_type=='agent'` + `user_id` | ✅ ignorat corect |
| `next_response_detector.rb:18` | `case creator_type` fără `else` | ✅ ignorat |
| `whatsapp_notifyable_comment.rb:13` | `creator_type == "agent"` | ⚠️ declanșa send-ul (dorit pe WA) |
| **`notifyable_comment.rb:18`** | `creator_type == 'agent'` | ❌ **trimite digest email clientului** |
| **`performance_report.rb:123`** | `creator_type: :agent` | ❌ **umflă statisticile agenților** |
| `comment_digest_job.rb:87` | `creator_type: 'agent'` | ❌ notifică agenții |

---

## 3. Mecanismul: `creator_type: :system`

Cercetarea (Zendesk/Freshdesk/Zoho/Help Scout/JSM) e unanimă:

> Every one of these five separates **notification** from **public comment/reply**, and the SLA clock keys off the latter. **That distinction — not an `is_autoreply` flag** — is what keeps autoresponders out of first-response metrics.

**Descoperirea decisivă:** *fiecare* gardă din acest codebase e o verificare **pozitivă** `== "agent"` — niciuna nu e `!= "customer"`. Deci o a treia valoare de enum e exclusă **automat de toate, fără nicio modificare la ele**.

```ruby
# comment.rb
enum :creator_type, { customer: 'customer', agent: 'agent', system: 'system' }
validates :creator_type, inclusion: { in: %w[customer agent system] }   # :35 — trebuie extins
```

**Migrare:** niciuna (coloană string existentă). Doar enum + validare.

Ce câștigăm gratis, prin construcție:
- ✅ nu satisface first-response SLA (`== "agent"` pică)
- ✅ nu umflă `performance_report` (`creator_type: :agent` pică)
- ✅ nu trimite digest clientului (`notifyable_comment:18` pică)
- ✅ nu notifică agenții (`comment_digest_job:87` pică)
- ✅ nu declanșează `SendWhatsappReplyJob` (`whatsapp_notifyable_comment:13` pică) — **corect: trimitem noi, direct**
- ✅ se randează în thread cu rendering-ul existent de comentarii

**Zero flaguri, zero guard-uri noi, zero excepții de ținut minte peste 6 luni.** Înlocuiește convenția implicită „fără user ⇒ automat" cu una explicită.

**Trimiterea** nu mai trece prin hook-ul de comentarii:
- **WhatsApp:** `SendAutoReplyJob` → `Whatsapp::SendMessage` **direct**, apoi înregistrează comentariul `system` pentru vizibilitatea agentului.
- **Email/Form:** nimic de trimis separat — textul se injectează în emailul de confirmare care oricum pleacă. Notificare prin construcție, exact ca la Zendesk.

**De verificat la implementare:** `Comment` are `belongs_to :user, optional: true` ✔; `ticket.rb:331` creează note interne cu `creator_type: :agent` — neatins.

---

## 4. Feature A — Auto-reply

### 4.1 Config (JSONB pe `account_meta`)

`add_column :stejar_account_meta, :auto_reply, :jsonb, default: {}, null: false`

```json
{
  "enabled": true,
  "channels": {
    "email":    { "enabled": true, "message": { "ro": "…", "hu": "…" } },
    "whatsapp": { "enabled": true, "message": { "ro": "…", "hu": "…" } },
    "form": {
      "enabled": true,
      "message": { "ro": "…", "hu": "…" },
      "extras":  { "15": { "ro": "…", "hu": "…" } },
      "skipped_form_ids": [22]
    }
  }
}
```

Wrapper: `Stejar::Helpdesk::AutoReplyConfig` (ActiveModel peste JSONB). Expune `active_for?(ticket)`, `message_for(ticket)`, `skipped?(form_id)`. **Zero logică în ERB.**

### 4.2 i18n — obligatoriu, nu nice-to-have

`Ticket` are `locale`; `Form` și `Faq` sunt `Translatable`; UI-ul e localizat în 7 limbi. Fără asta, o primărie din Harghita trimite ack în română unui cetățean care a scris maghiară — **iar AI-ul răspunde corect în maghiară, deci inconsistența e vizibilă în același tichet**.

`message_for(ticket)` → `message[ticket.locale] || message[account.default_locale]`. UI: bară de locale ca în CMS (`.locale-tab`, bulină verde=tradus).

### 4.3 Model Forms: standard + extra (append)

Validat de cercetare: **„No platform ships a message per form."** Toate cele cinci (Zendesk, Freshdesk, Zoho, Help Scout, JSM) = un mesaj implicit pe scope larg + reguli pentru excepții.

Clientul primește `message[locale] + " " + extras[form_id][locale]`. `skipped_form_ids` = fără niciun mesaj.
**UI:** lista arată **doar abaterile** („Customized forms · 2 of 4"), contor clickabil → lista completă pentru audit. Rândul afișează mesajul standard ca **prefix blocat** (gri, lacăt) lipit de textarea-ul tău — compoziția e vizibilă, deci nu are nevoie de propoziții explicative.

⚠️ **Zendesk race warning** (documentat): *„a race condition between the two triggers might mean the autoreply is sent for the wrong brand."* → textul per-formular se rezolvă **înainte** de trimitere, într-o singură unitate. Niciodată în două joburi.

**Chei orfane:** un formular șters lasă chei moarte în `extras`/`skipped_form_ids`. Inerte (UI randează din `account.forms`). **Dar:** un id reciclat ar reactiva tăcut o configurație veche → curăță în `Form#before_destroy`.

### 4.4 Gărzi anti-buclă (Help Scout, două independente)

1. **O dată per conversație.** Pe WhatsApp e deja quasi-gratuit: `ProcessIncomingWhatsappMessageJob#find_or_create_ticket` reutilizează tichetul deschis, deci ack doar la tichet nou.
2. **Throttle 24h per adresă.** Cea care chiar oprește buclele — prima cedează când fiecare bounce deschide o conversație nouă. Nu există azi. Cheie: `[account_id, email/phone]`, TTL 24h.

Plus, pe email-in (`ticket_mailbox.rb`): respectă `Precedence: bulk`, `Auto-Submitted: auto-generated`, `X-Auto-Response-Suppress`; sari peste `noreply@`/`mailer-daemon@`. **De verificat dacă mailbox-ul le are deja** — riscul preexistă featurei, dar featurea îl amplifică.

### 4.5 WhatsApp — constrângeri de platformă (verificate în docs)

- **Fereastra 24h:** ack-ul e in-window **prin construcție** (mesajul clientului o deschide; ack-ul pleacă la t≈0). Freeform permis, fără template. Zero risc.
- **Automatizarea e permisă explicit in-window**, dar politica cere: *„must also have available prompt, clear, and direct **escalation paths**."* → **singura cerință tare pe care o putem rata.** Ack-ul trebuie să conțină telefon/adresă. UI: validare live pe textarea.
- **1600 caractere = respingere dură** (Twilio error 21617). **Nu trunchiază.** Se aplică pe textul **randat** — diacriticele românești consumă în plus. → validează înainte de send și blochează.
- **Mit demontat:** „botul trebuie să declare că e AI" — **nu există** în politica reală. Nu construi nimic pe ea. (Eticheta „Auto-reply" rămâne, ca bună-practică.)
- **Frecvență:** Meta gate-ază propriul greeting la o dată per contact per **14 zile**. „O dată per tichet" e mai agresiv decât nativul. Riscul nu e de politică, e de **blocări → quality rating → rate limiting**.
- **Idempotență:** Twilio retrimite webhook-uri; nu stocăm `MessageSid`. Un retry ⇒ **tichet dublu + ack dublu**. Gap preexistent, dar ack-ul îl face vizibil clientului. → unique index pe `MessageSid`.

### 4.6 Fără delivery webhook

Eșecurile de trimitere ajung doar în logs/AppSignal, nu în UI-ul agentului. Un ack care n-a plecat arată identic cu unul plecat. Gap cunoscut — de acceptat conștient pentru v1.

---

## 5. Feature B — Suggested replies

### 5.1 Pattern: card alături, NU pre-fill

**Dovezile împotriva pre-fill-ului:**
- **1 din 6** vendori majori precompletează text generat (doar Zendesk). Patru cer click explicit.
- **Granița internă Intercom:** precompletează ce e **regăsit** (macros, greetings), cere click pentru ce e **generat**. Graniță de risc de halucinație trasată în același produs.
- **Bias in the Loop** (n=2.784, randomizat): frâna a **înrăutățit** lucrurile — *„requiring corrections… reduced human engagement and increased the tendency to accept incorrect suggestions"*; stimulentele financiare — efect zero.
- **Jakesch et al.** (n=1.506, Cornell): ancorarea se produce **chiar și când sugestia e respinsă**; scriitorii devin *„reactive evaluators, editors, and extenders"*.
- **Sinteza:** *un composer precompletat transformă agentul din autor în editor înainte să-și formeze propriul răspuns. Ăsta e harm-ul documentat — nu butonul de send.* Deci „nu se trimite niciodată automat" **nu apără nimic**.
- **Gorgias** consideră revizuirea umană atât de nesigură încât a înlocuit-o cu un al doilea model AI.

**Design:** composerul se deschide **gol**. Cardul de sugestie stă **în thread, alături**, cu bordură **punctată** (nu seamănă cu un mesaj trimis) + „Only you can see this". Acțiuni: `Use this draft` / `Regenerate` / `Dismiss`. După inserare → urmă discretă + `Undo`.

**Fără potrivire bună → nu se afișează nimic.** (HubSpot). Un card respins de 40 de ori/zi produce oboseală de dismiss, și-atunci va fi respins și când e bun.

### 5.2 Declanșator: la **deschiderea tichetului**, nu la creare

Generarea pe 100% din tichete = plătești LLM pentru spam, pentru cele 402 sesizări de salubritate, pentru tot ce nu deschide nimeni. La deschidere: cardul e tot acolo când agentul ajunge, dar plătești doar pentru tichetele atinse de un om.

### 5.3 Plafon de tokeni — **decis, nu deschis**

Cauza declarată a morții lui v1. Reutilizăm `account_meta.ai_public_within_token_limit?`. **Nicio linie de cod înainte ca pragul per cont/lună să fie o valoare, nu o discuție.** Depășire → funcția tace (fără card), nu eșuează zgomotos.

### 5.4 Grounding & stil

- **Sursa:** toate FAQ-urile contului, **fără UI de configurare**. Divergență conștientă: *„every vendor lets admins scope sources; none is all-content-automatic."* Apărabil la 34 de FAQ-uri curate; **prag de reevaluare: >100 FAQ-uri sau liste pentru audiențe diferite.**
- **Retrieval:** stuffing din Postgres, cap la ~30k caractere (ca `DocumentBuilder::MAX_BODY_CHARS`). Fără Meilisearch. Trece la retrieval la pragul de mai sus. (`FaqMatcher` a fost șters în #869 — nu-l învia.)
- **Stil per canal — validat:** doar **Gorgias** documentează asta: *„shorter, more conversational messages on chat versus comprehensive messages on email."* Suntem în avans.
  Două stiluri, nu trei — grupate după **ieșire**: Email + **Form** (răspunsul la un tichet de formular pleacă tot pe email) → *Email style*; WhatsApp → *Chat style* (plain text, <1500 char).
  **Sursa de adevăr: `reply_channel_hint(ticket)`** (`application_helper.rb:464`) — există deja, nu reimplementa.
  De ce nu poate fi un stil unic: `SendWhatsappReplyJob` trece body-ul prin `TextNormalizer` care **șterge HTML-ul Trix** → agentul ar vedea altceva decât primește clientul.
- **House rules** (furat de la Zendesk „Procedures" — *„No competitor documents an equivalent"*): text liber de la owner, aplicat fiecărui draft. Ghidează **cum**, FAQ-ul decide **ce**. Pentru sectorul public („menționează termenul de 30 de zile, Legea 544/2001") valorează mai mult decât orice selector de liste FAQ.

### 5.5 Telemetrie — instrumentul, nu un nice-to-have

*„Rejecting a suggested reply doesn't retrain agent copilot"* — nici Zendesk n-are buclă de suprimare. **Rata de editare e singurul mod de a ști dacă agenții revizuiesc sau ștampilează.** Fără ea, oprim (sau păstrăm) funcția pe impresii — exact cum a murit v1.

4 contoare, de la ziua unu: `suggested` / `used` / `edited_before_send` / `dismissed`.
Implementare: `inserted_draft_digest` pe comentariu la inserare; la send compară cu body-ul → editat sau nu. Afișare pe pagina Suggested replies.
**Semnalul:** dacă `edited` scade spre zero în timp ce reclamațiile cresc → se ștampilează → se oprește funcția **pe baza unui număr**.

### 5.6 Zero FAQ

Blochează **doar** draftul, nu auto-reply-ul — mesajul standard e text fix scris de owner și n-are nicio dependență de FAQ. (Analogia cu „WhatsApp fără număr" e falsă: acolo chiar nu se poate trimite nimic.)

---

## 6. Verdictul comercial (context pentru priorități)

- **Ack-ul nu e un produs.** Pe email e redundant (emailul de confirmare deja spune „am primit"). Pe WhatsApp ar conta, dar majoritatea workspace-urilor n-au număr. E o funcție de o zi care închide gaura lăsată de #869. Nu-i face pagină de vânzare.
- **Draftul e produsul** — dar numai poziționat ca **„AI-ul nu vorbește niciodată cu cetățeanul."** Pentru o primărie, coșmarul e un răspuns automat prost ajuns în presa locală. Exact poziționarea HubSpot: *„use the AI brain in draft mode without deploying it to live channels."*
- **Nu-l vinde separat.** Piața taxează asistența per-seat și automatizarea per-rezultat, dar **Help Scout și HubSpot dau draftul gratis** ca rampă de acces. Pentru o primărie cu 11 agenți, un add-on/seat = linie bugetară nouă = ciclu de achiziție. Per-rezultat = cost variabil, pe care bugetele municipale îl resping. → **bagă-l în planul existent**; de-aia declanșatorul lazy contează (tokenii sunt costul nostru).
- **Ce vinde de fapt** e conformitatea cu **Legea 544** (termen 30 de zile) — iar raportul SLA e povestea. De aici și de ce `creator_type: :system` nu e cosmetică: protejează singurul lucru care vinde.

---

## 7. Fazare

**Faza 0 — fundația (0.5 zile)**
`creator_type: :system` (enum + validare `:35`) · spec: *un comentariu system nu satisface first-response, nu apare în performance report, nu trimite digest*.

**Faza 1 — Auto-reply (1–2 zile)**
Migrare JSONB · `AutoReplyConfig` · injecție în `confirm_new_ticket_registration_to_customer` · `SendAutoReplyJob` (WhatsApp direct, apoi comentariu `system`) · throttle 24h/adresă · validare 1600 + escalation path · UI: rând Settings, 3 boxuri, bară de locale, listă „Customized forms".
*Livrabil independent. Zero AI, zero tokeni.*

**Faza 2 — Suggested replies (separat)**
**Precondiție: plafonul de tokeni e un număr.** `GenerateDraftJob` la deschiderea tichetului · `DraftGenerator` (FAQ stuffing + house rules + stil din `reply_channel_hint`) · card în thread · 4 contoare · pagină proprie.

**Faza 3 — igienă**
`MessageSid` idempotency · cleanup chei orfane la `Form#destroy` · headere anti-buclă pe mailbox.

---

## 8. Fișiere

**Noi:** `models/stejar/helpdesk/auto_reply_config.rb` · `services/stejar/helpdesk/auto_reply/message_resolver.rb` · `jobs/stejar/helpdesk/send_auto_reply_job.rb` · `services/stejar/helpdesk/suggested_replies/draft_generator.rb` · `jobs/…/generate_draft_job.rb` · `controllers/stejar/helpdesk/settings/auto_reply_controller.rb` + `auto_reply/channels_controller.rb` + `suggested_replies_controller.rb` + views · 2 migrări.

**Modificate:** `comment.rb` (enum `:system` + validare) · `account_meta.rb` (accessor) · `ticket.rb` (`suggested_reply` jsonb) · `process_incoming_whatsapp_message_job.rb` (enqueue ack la tichet nou) · `tickets/create_customer.rb` sau mailer · `ticket_mailer/confirm_new_ticket_registration_to_customer.html.erb` · `comments/_composer.html.erb` (card, **composer rămâne gol**) · `settings/settings/index` · `config/routes/helpdesk.rb` · descrierea rândului FAQs („…and WhatsApp auto-replies" e rămășiță de la #869).

---

## 9. Decizii rămase

1. **Plafon de tokeni: ce număr?** — blochează Faza 2.
2. **Ack la redeschiderea unui tichet închis?** Recomandare: **nu** (conversație continuă; al doilea ack sună robotic + frecvența e ce atrage blocări pe WhatsApp).
3. **LLM:** rămâne OpenAI `gpt-5.4-mini` (consistent cu `PublicAiAssistant`) vs. Claude per regula globală. Recomandare: OpenAI acum.
4. **Numele rândului din Settings:** „Auto-reply" găzduiește și „Suggested replies", care nu răspunde automat niciodată. Alternativă onestă: **„Replies"**.

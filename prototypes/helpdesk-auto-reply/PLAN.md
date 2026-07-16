# Auto-reply & Suggested replies — plan de implementare

Două funcții separate, cu un singur punct de intrare în Setări. Succesorul botului WhatsApp șters în `8f878f140`: *„The bot answered unconditionally — talking over agents mid-thread — and had no token cap. **Anything smarter gets built separately.**"*

| | **Auto-reply** | **Suggested replies** |
|---|---|---|
| Ce face | trimite un text fix, scris de owner | scrie o ciornă din FAQ pentru agent |
| AI | nu | da |
| Cost | 0 | tokeni |
| Ajunge la client | da, automat | **niciodată** fără agent |
| Switch | propriu | propriu — merge și cu auto-reply stins |

---

## 1. Flux

```
AUTO-REPLY

Email / Form:  ticket creat → CreateCustomer#notify_customer!
                            → TicketMailer (emailul de confirmare care EXISTĂ deja)
                            → injectăm mesajul standard în el     ← nu pleacă email nou
                            → Comment(creator_type: :system)      ← urma în thread

WhatsApp:      mesaj inbound → ProcessIncomingWhatsappMessageJob
                            → ticket NOU? (nu la fiecare mesaj)
                            → SendAutoReplyJob
                                 ├─ Whatsapp::SendMessage.call(...)   ← trimitem DIRECT
                                 └─ Comment(creator_type: :system)    ← doar urma
```

**De ce trimitem direct, nu prin hook-ul de comentarii:** `WhatsappNotifyableComment` se declanșează pe `creator_type == "agent"`. Dacă am fabrica un comentariu de agent ca să declanșăm trimiterea, am cădea în toate celelalte gărzi care caută tot `"agent"` — SLA, digest către client, rapoarte de performanță. Trimitem noi și înregistrăm separat.

```
SUGGESTED REPLIES

agent deschide ticketul → GenerateDraftJob        ← NU la crearea ticketului
                        → DraftGenerator: FAQ + house rules + stil per canal
                        → ticket.suggested_reply (jsonb)
                        → card LÂNGĂ composer; composerul rămâne GOL
                        → agentul apasă „Use this draft" → text în composer
                        → Send → Comment(creator_type: :agent), fluxul de azi
```

**De ce la deschidere, nu la creare:** generarea pe 100% din tichete = LLM plătit pentru spam, pentru cele 402 sesizări de salubritate, pentru tot ce nu deschide nimeni. La deschidere, cardul e tot acolo când agentul ajunge — dar plătim doar pentru tichetele atinse de un om.

---

## 2. `creator_type: :system` — piesa centrală

Auto-reply-ul trebuie să apară în thread, dar să nu fie confundat cu un răspuns de agent. Soluția nu e un flag, e o a treia valoare de enum.

**De ce funcționează fără să atingem nimic altceva:** fiecare gardă din codebase e o verificare **pozitivă** `== "agent"`. Niciuna nu e `!= "customer"`. O valoare nouă e exclusă automat de toate:

| Fișier | Garda | Cu `:system` |
|---|---|---|
| `slas/first_response_detector.rb:28` | `return unless creator_type == "agent"` | nu oprește ceasul SLA |
| `slas/next_response_detector.rb:18` | `case creator_type when "customer"/"agent"` | nicio ramură → no-op |
| `whatsapp_notifyable_comment.rb:13` | `creator_type == "agent" && …` | nu declanșează send dublu |
| `notifyable_comment.rb:18` | `if creator_type == 'agent' && !internal?` | nu trimite digest clientului |
| `comment_digest_job.rb:87` | `creator_type: 'agent'` | nu notifică agenții |
| `reports/performance_report.rb:123` | `where(creator_type: :agent)` | nu umflă statisticile |

```ruby
# app/models/stejar/helpdesk/comment.rb
- enum :creator_type, { customer: 'customer', agent: 'agent' }
+ enum :creator_type, { customer: 'customer', agent: 'agent', system: 'system' }

- validates :creator_type, presence: true, inclusion: { in: %w[customer agent] }
+ validates :creator_type, presence: true, inclusion: { in: %w[customer agent system] }
```

**Migrare: niciuna.** `creator_type` e deja `string`.

> `first_response_detector.rb:34` are deja `return if comment.user_id.nil?`, cu comentariul *„Automated/system comments (e.g. the WhatsApp FAQ bot) carry no user"* — deci SLA-ul era **deja** protejat. Ce NU e protejat: `notifyable_comment` și `performance_report`, care nu verifică `user_id`. `:system` le acoperă pe toate și transformă o convenție implicită („fără user = automat") într-una explicită.

---

## 3. Model de date

Fără tabele noi. `8f878f140` tocmai a șters `brad_responders` și a mutat configul înapoi pe `account_meta` — continuăm acolo.

```ruby
# db/migrate/XXXXXX_add_auto_reply_to_account_meta.rb
class AddAutoReplyToAccountMeta < ActiveRecord::Migration[7.1]
  def change
    add_column :stejar_account_meta, :auto_reply, :jsonb, default: {}, null: false
    add_column :stejar_account_meta, :suggested_replies, :jsonb, default: {}, null: false
  end
end
```

```ruby
# db/migrate/XXXXXX_add_suggested_reply_to_tickets.rb
class AddSuggestedReplyToTickets < ActiveRecord::Migration[7.1]
  def change
    # { body:, faq_ids:, model:, style:, generated_at: }
    add_column :brad_tickets, :suggested_reply, :jsonb
  end
end
```

Forma configului:

```jsonc
// account_meta.auto_reply
{
  "enabled": true,
  "channels": {
    "email":    { "enabled": true, "message": { "ro": "…", "hu": "…" } },
    "whatsapp": { "enabled": true, "message": { "ro": "…", "hu": "…" } },
    "form": {
      "enabled": true,
      "message": { "ro": "…", "hu": "…" },   // merge pe TOATE formularele
      "extras":  { "15": { "ro": "…" } },    // form_id → text ADĂUGAT, nu înlocuit
      "skipped_form_ids": [22]
    }
  }
}

// account_meta.suggested_replies
{ "enabled": true, "house_rules": "Menționează termenul legal de 30 de zile…" }
```

**De ce `message` e per-locale:** `Ticket` are coloana `locale`, iar UI-ul e localizat în 7 limbi. Fără asta, o primărie din Harghita trimite ack în română unui cetățean care a scris maghiară — în timp ce AI-ul îi răspunde corect în maghiară. Inconsistență vizibilă în același tichet.

**De ce „standard + extra", nu un mesaj per formular:** niciun vendor major (Zendesk, Freshdesk, Zoho, Help Scout, JSM) nu are mesaj per formular — toate au un implicit pe scope larg + reguli pentru excepții. Un mesaj per formular = N texte de ținut în sincron, fără câștig.

---

## 4. Wrapper de config

```ruby
# app/models/stejar/helpdesk/auto_reply_config.rb
module Stejar
  module Helpdesk
    class AutoReplyConfig
      CHANNELS = %w[email form whatsapp].freeze

      def initialize(account) = (@account = account)

      def enabled? = data["enabled"].present?

      def channel_enabled?(channel)
        enabled? && data.dig("channels", channel.to_s, "enabled").present?
      end

      # Sursa unică de adevăr pentru „ce text pleacă la clientul ăsta".
      # Rezolvă canal + locale + extra-ul formularului într-o SINGURĂ trecere.
      def message_for(ticket)
        channel = channel_of(ticket)
        return nil unless channel_enabled?(channel)

        cfg = data.dig("channels", channel) || {}
        return nil if channel == "form" && skipped?(cfg, ticket.form_id)

        base  = localized(cfg["message"], ticket.locale)
        extra = channel == "form" ? localized(cfg.dig("extras", ticket.form_id.to_s), ticket.locale) : nil
        [base, extra].compact_blank.join(" ").presence
      end

      def update!(attrs)
        @account.account_meta.update!(auto_reply: data.deep_merge(attrs.deep_stringify_keys))
      end

      private

      def data = @account.account_meta&.auto_reply.presence || {}

      def skipped?(cfg, form_id)
        Array(cfg["skipped_form_ids"]).map(&:to_s).include?(form_id.to_s)
      end

      # Fallback pe locale-ul contului: mai bine un mesaj în altă limbă decât niciunul.
      def localized(hash, locale)
        return nil if hash.blank?
        hash[locale.to_s].presence || hash[@account.default_locale.to_s].presence
      end

      def channel_of(ticket)
        case ticket.source
        when "whatsapp" then "whatsapp"
        when "email"    then "email"
        else "form"
        end
      end
    end
  end
end
```

```ruby
# app/models/stejar/account.rb
def auto_reply_config = @auto_reply_config ||= Stejar::Helpdesk::AutoReplyConfig.new(self)
```

⚠️ **Race condition (avertisment documentat de Zendesk):** *„a race condition between the two triggers might mean the autoreply is sent for the wrong brand."* De aceea `message_for` rezolvă canal + locale + extra **într-un singur apel, înainte de trimitere** — niciodată în două joburi separate.

---

## 5. Auto-reply pe Email / Form

Textul intră în emailul de confirmare **care oricum pleacă**. Nu trimitem email nou.

```ruby
# app/services/stejar/helpdesk/tickets/create_customer.rb
def notify_customer!
  return unless ticket.open? && !ticket.spam?

  auto_reply_text = ticket.account.auto_reply_config.message_for(ticket)
  record_auto_reply!(auto_reply_text) if auto_reply_text

  if (membership = customer_membership)
    NewCustomerTicketNotifier.with(record: ticket, auto_reply: auto_reply_text).deliver(membership)
  else
    TicketMailer.with(ticket: ticket, auto_reply: auto_reply_text)
                .confirm_new_ticket_registration_to_customer.deliver_later
  end
end

private

# Urma în thread, ca agentul să vadă ce i s-a spus deja clientului.
# :system => exclus automat din SLA, digest-uri și rapoarte.
def record_auto_reply!(body)
  ticket.comments.create!(
    account_id: ticket.account_id, creator_type: :system,
    source: ticket.source, internal: false, body: body
  )
end
```

```ruby
# app/mailers/stejar/helpdesk/tickets/ticket_mailer.rb
def confirm_new_ticket_registration_to_customer
  @ticket     = params[:ticket]
  @auto_reply = params[:auto_reply]   # poate fi nil — view-ul doar verifică prezența
  # …restul, neschimbat
end
```

```erb
<%# app/views/stejar/helpdesk/tickets/ticket_mailer/confirm_new_ticket_registration_to_customer.html.erb %>
<% if @auto_reply.present? %>
  <div style="border-left:2px solid #0f9d76; padding-left:12px; margin:16px 0;">
    <%= simple_format @auto_reply %>
  </div>
<% end %>
```

---

## 6. Auto-reply pe WhatsApp

```ruby
# app/jobs/stejar/helpdesk/process_incoming_whatsapp_message_job.rb
def find_or_create_ticket(account, customer, form, department)
  existing = Ticket.where(customer:, account:, source: :whatsapp).where.not(status: :closed)
                   .order(created_at: :desc).first
  if existing
    existing.update!(status: :open) if existing.resolved?
    return existing                      # conversație în curs → FĂRĂ ack
  end

  Ticket.create!(form:, customer:, department:, account:, source: :whatsapp, status: :open).tap do |ticket|
    SendAutoReplyJob.perform_later(ticket.id)   # doar la tichet NOU
  end
end
```

```ruby
# app/jobs/stejar/helpdesk/send_auto_reply_job.rb
module Stejar
  module Helpdesk
    class SendAutoReplyJob < ApplicationJob
      TWILIO_LIMIT = 1600   # error 21617 — Twilio RESPINGE, nu trunchiază

      def perform(ticket_id)
        ticket = Ticket.find_by(id: ticket_id)
        return if ticket.nil? || ticket.spam?

        body = ticket.account.auto_reply_config.message_for(ticket)
        return if body.blank?
        return if body.length > TWILIO_LIMIT   # mai bine nimic decât un request respins
        return if throttled?(ticket)

        meta = ticket.account.account_meta
        return unless meta&.whatsapp_active?

        # Trimitem DIRECT. Nu fabricăm un comentariu de agent ca să declanșăm hook-ul.
        Whatsapp::SendMessage.call(from: meta.whatsapp_phone_number,
                                   to: ticket.customer.phone, body: body)

        ticket.comments.create!(
          account_id: ticket.account_id, creator_type: :system,
          source: :whatsapp, internal: false, body: body
        )
      end

      private

      # A doua gardă, ca la Help Scout. Prima (o dată per conversație) cedează
      # când fiecare bounce deschide o conversație nouă; asta nu.
      def throttled?(ticket)
        key = "auto_reply:#{ticket.account_id}:#{ticket.customer&.phone || ticket.customer&.email}"
        return true if Rails.cache.exist?(key)
        Rails.cache.write(key, true, expires_in: 24.hours)
        false
      end
    end
  end
end
```

**Fereastra de 24h:** ack-ul e in-window **prin construcție** — mesajul clientului e chiar evenimentul care o deschide, iar ack-ul pleacă la t≈0. Freeform permis, fără template.

**Cerință tare Meta:** *„You may use automation when responding during the 24-hour window, but must also have available prompt, clear, and direct escalation paths."* → mesajul trebuie să conțină o rută către un om (telefon/adresă). UI-ul o validează live (§9).

---

## 7. Suggested replies — generare

```ruby
# app/controllers/stejar/helpdesk/tickets_controller.rb
def show
  # …
  SuggestedReplies::GenerateDraftJob.perform_later(@ticket.id) if suggest_draft?
end

private

def suggest_draft?
  @ticket.suggested_reply.blank? &&
    @ticket.open? && !@ticket.spam? &&
    current_account.suggested_replies_enabled? &&
    current_account.account_meta&.ai_public_within_token_limit?   # plafonul care a lipsit la v1
end
```

```ruby
# app/services/stejar/helpdesk/suggested_replies/draft_generator.rb
module Stejar
  module Helpdesk
    module SuggestedReplies
      class DraftGenerator < Stejar::ApplicationService
        MODEL         = "gpt-5.4-mini"     # același ca PublicAiAssistant
        MAX_FAQ_CHARS = 30_000             # ca DocumentBuilder::MAX_BODY_CHARS
        MAX_TOKENS    = 800

        STYLES = {
          # Formularele se răspund tot pe EMAIL → același stil.
          email: "Scrie ca un email formal: formulă de adresare, paragrafe, încheiere.",
          # SendWhatsappReplyJob trece body-ul prin TextNormalizer și ȘTERGE HTML-ul Trix.
          # Dacă generăm rich text aici, agentul vede altceva decât primește clientul.
          chat:  "Scrie scurt și informal, text simplu, fără antet sau semnătură, sub 1500 de caractere."
        }.freeze

        def initialize(ticket) = (@ticket = ticket)

        def call
          return if faq_context.blank?

          content = client.chat(parameters: {
            model: MODEL, temperature: 0.2, max_completion_tokens: MAX_TOKENS,
            messages: [{ role: "system", content: system_prompt },
                       { role: "user",   content: question }]
          }).dig("choices", 0, "message", "content")
          return if content.blank?

          @ticket.update!(suggested_reply: {
            body: content, style: style_key, model: MODEL,
            faq_ids: faqs.map(&:id), generated_at: Time.current
          })
        end

        private

        # reply_channel_hint (application_helper.rb:464) decide deja dacă răspunsul
        # pleacă pe email sau WhatsApp. Aceeași sursă de adevăr — nu reimplementăm.
        def style_key = @ticket.source == "whatsapp" ? :chat : :email

        def system_prompt
          [
            "Ești asistentul de suport al #{@ticket.account.name}.",
            "Răspunde DOAR pe baza FAQ-ului de mai jos. Nu inventa nimic.",
            "Dacă FAQ-ul nu acoperă întrebarea, spune că un coleg va prelua.",
            "Scrie în limba tichetului (#{@ticket.locale}).",
            STYLES[style_key],
            house_rules.presence,
            "\n--- FAQ ---\n#{faq_context}"
          ].compact.join("\n")
        end

        def house_rules = @ticket.account.suggested_replies_config["house_rules"]

        def question
          @ticket.originating_comment&.body&.to_plain_text.presence ||
            @ticket.ticket_values.map { |v| v.value_string || v.body&.to_plain_text }
                   .compact_blank.join("\n")
        end

        def faqs = @faqs ||= @ticket.account.faqs.includes(:faq_questions)

        # Stuffing simplu din Postgres. Fără vector search — la 34 de întrebări nu e nevoie.
        # Prag de reevaluare: >100 FAQ-uri, sau liste pentru audiențe diferite.
        # (FaqMatcher a fost șters în #869 — nu-l învia.)
        def faq_context
          @faq_context ||= faqs.flat_map { |faq|
            faq.faq_questions.map { |q| "Q: #{q.display_question}\nA: #{q.display_answer&.to_plain_text}" }
          }.join("\n\n").truncate(MAX_FAQ_CHARS)
        end

        def client
          OpenAI::Client.new(access_token: Rails.application.credentials.dig(:openai, :api_key))
        end
      end
    end
  end
end
```

---

## 8. Suggested replies — UI

**Regula: composerul se deschide GOL. Cardul stă alături.**

Doar 1 din 6 vendori majori precompletează text generat. Cercetarea (Cornell, n=1.506; studiu randomizat, n=2.784) arată că **ancorarea se produce chiar și când agentul respinge ciorna** — deci „nu se trimite automat" nu apără nimic. Frânele („confirmă că ai citit") au **înrăutățit** măsurabil lucrurile.

```erb
<%# app/views/stejar/helpdesk/comments/_composer.html.erb — deasupra butoanelor %>
<% if (draft = @ticket.suggested_reply&.dig("body")).present? %>
  <%= render "stejar/helpdesk/comments/suggestion", ticket: @ticket, draft: draft %>
<% end %>
```

```erb
<%# app/views/stejar/helpdesk/comments/_suggestion.html.erb %>
<%# Bordură punctată: nu trebuie să semene NICIODATĂ cu un mesaj trimis. %>
<div class="rounded-xl border-[1.5px] border-dashed border-primary-300 bg-primary-50/40"
     data-controller="suggestion" data-suggestion-body-value="<%= draft %>">
  <div class="flex items-center gap-2 px-3.5 py-2.5 border-b border-dashed border-primary-200">
    <b class="text-[12.5px]">Suggested reply from your FAQs</b>
    <span class="ml-auto text-[11px] text-ink-400">Only you can see this</span>
  </div>
  <div class="px-3.5 py-3 text-[13.5px] text-ink-700"><%= simple_format draft %></div>
  <div class="flex gap-2 px-3.5 py-3 border-t border-dashed border-primary-200">
    <button class="btn btn--sm" data-action="suggestion#use">Use this draft</button>
    <%= button_to "Regenerate", regenerate_helpdesk_ticket_suggestion_path(@ticket), class: "btn btn--sm" %>
    <button class="btn btn--sm" data-action="suggestion#dismiss">Dismiss</button>
  </div>
</div>
```

```js
// app/javascript/cms/controllers/suggestion_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { body: String }

  use() {
    this.#openComposer()
    const editor = document.querySelector("trix-editor")
    editor.editor.loadHTML(this.bodyValue)
    // Ce am predat — ca să putem măsura dacă a fost editat înainte de send.
    document.querySelector("[name='comment[inserted_draft_digest]']").value = this.#digest(this.bodyValue)
    this.element.remove()
  }

  dismiss() { this.element.remove() }

  #openComposer() { document.querySelector("[data-composer-target='replyButton']")?.click() }
  #digest(s) { return btoa(unescape(encodeURIComponent(s))).slice(0, 32) }
}
```

---

## 9. Controllers + rute

```ruby
# app/controllers/stejar/helpdesk/settings/auto_reply_controller.rb
module Stejar::Helpdesk::Settings
  class AutoReplyController < BaseController
    requires_permission "helpdesk.settings"

    def show; end

    def update
      current_account.auto_reply_config.update!(enabled: params[:enabled] == "1")
      redirect_to helpdesk_settings_auto_reply_path, notice: t(".saved")
    end
  end
end
```

```ruby
# app/controllers/stejar/helpdesk/settings/auto_reply/channels_controller.rb
module Stejar::Helpdesk::Settings::AutoReply
  class ChannelsController < Stejar::Helpdesk::Settings::BaseController
    requires_permission "helpdesk.settings"
    before_action :set_channel

    def show
      @forms = current_account.forms.where(system: false) if @channel == "form"
    end

    def update
      current_account.auto_reply_config.update!(channels: { @channel => channel_params })
      redirect_to helpdesk_settings_auto_reply_channel_path(@channel), notice: t(".saved")
    end

    private

    def set_channel
      @channel = params[:id]
      redirect_to helpdesk_settings_auto_reply_path unless
        Stejar::Helpdesk::AutoReplyConfig::CHANNELS.include?(@channel)
    end

    def channel_params
      params.require(:channel).permit(:enabled, message: {}, extras: {}, skipped_form_ids: [])
    end
  end
end
```

```ruby
# config/routes/helpdesk.rb  (în namespace :settings)
resource :auto_reply, only: %i[show update] do
  resources :channels, only: %i[show update], param: :id   # id ∈ email|form|whatsapp
end
resource :suggested_replies, only: %i[show update]

# în resources :tickets
resource :suggestion, only: [] do
  post :regenerate
end
```

---

## 10. Validare & edge cases

| Caz | Comportament |
|---|---|
| **Zero FAQ-uri** | blochează **doar** draftul. Auto-reply-ul e text fix, n-are nicio dependență de FAQ — merge. (Analogia cu „WhatsApp fără număr" e falsă: acolo chiar nu se poate trimite nimic.) |
| Mesaj gol pe un canal | canalul e activ, dar nu pleacă nimic. Legal, nu e eroare. |
| **Mesaj > 1600 char pe WhatsApp** | nu se trimite. Twilio dă 21617 și **respinge** — se aplică pe textul randat, iar diacriticele consumă în plus. |
| Fără rută de escaladare în textul WhatsApp | avertisment în UI. Nu blocant — dar e singura cerință *tare* din politica Meta. |
| Ticket spam | fără ack, fără draft. |
| Client scrie de 5 ori la rând | un singur ack: tichetul se reutilizează + throttle 24h/adresă. |
| Ticket închis, clientul scrie iar | tichet nou → ack nou. **De confirmat: îl vrem?** (§12) |
| **Formular șters** | `extras`/`skipped_form_ids` rămân chei moarte. Inerte (UI randează din `account.forms`), **dar** un id reciclat ar reactiva tăcut o config veche → curăță în `Form#before_destroy`. |
| **Twilio retrimite webhook-ul** | *gap cunoscut*: fără `MessageSid` unic → tichet dublu + ack dublu. Faza 3. |
| Trimitere eșuată | doar în logs/AppSignal. Fără delivery webhook, un ack neplecat arată ca unul plecat. Acceptat pentru v1. |

---

## 11. Teste

```ruby
# spec/models/stejar/helpdesk/comment_spec.rb
describe "creator_type: :system" do
  let(:comment) { create(:comment, ticket:, creator_type: :system, user: nil, internal: false) }

  it("nu satisface first response SLA") { expect { comment }.not_to change { ticket.reload.first_responded_at } }
  it("nu trimite digest clientului")    { expect { comment }.not_to have_enqueued_job(CommentDigestJob) }
  it("nu declanșează send WhatsApp")    { expect { comment }.not_to have_enqueued_job(SendWhatsappReplyJob) }

  it "nu apare în performance report ca răspuns de agent" do
    comment
    expect(Reports::PerformanceReport.new(account).agent_replies_count).to eq(0)
  end
end
```

```ruby
# spec/models/stejar/helpdesk/auto_reply_config_spec.rb
describe "#message_for" do
  it("rezolvă locale-ul tichetului")            { expect(config.message_for(build(:ticket, locale: "hu"))).to eq("Köszönjük…") }
  it("cade pe locale-ul contului dacă lipsește"){ expect(config.message_for(build(:ticket, locale: "de"))).to eq("Vă mulțumim…") }
  it("adaugă extra-ul, nu îl înlocuiește")      { expect(config.message_for(ticket_on_form(15))).to eq("Vă mulțumim… Vă rugăm să aveți buletinul.") }
  it("returnează nil pentru formular exclus")   { expect(config.message_for(ticket_on_form(22))).to be_nil }
end
```

```ruby
# spec/jobs/stejar/helpdesk/send_auto_reply_job_spec.rb
it "nu trimite de două ori aceleiași adrese în 24h" do
  described_class.perform_now(ticket.id)
  expect(Whatsapp::SendMessage).not_to receive(:call)
  described_class.perform_now(second_ticket.id)
end

it "nu trimite peste 1600 de caractere" do   # Twilio ar respinge cu 21617
  expect(Whatsapp::SendMessage).not_to receive(:call)
  described_class.perform_now(ticket_with_long_message.id)
end
```

---

## 12. Telemetrie — instrumentul, nu decorul

*„Rejecting a suggested reply doesn't retrain agent copilot"* — nici Zendesk n-are buclă de suprimare. Rata de editare e **singurul** mod de a ști dacă agenții revizuiesc sau ștampilează. Fără ea, oprim sau păstrăm funcția pe impresii — exact cum a murit v1.

```ruby
# app/models/stejar/helpdesk/comment.rb
# inserted_draft_digest e setat de composer când agentul apasă „Use this draft".
before_create :stamp_draft_usage, if: -> { inserted_draft_digest.present? }

def stamp_draft_usage
  self.draft_edited = Digest::MD5.hexdigest(body.to_plain_text)[0, 32] != inserted_draft_digest
end
```

Patru contoare pe pagina Suggested replies: `suggested` / `used` / `edited_before_send` / `dismissed`.
**Semnalul de alarmă:** dacă `edited` scade spre zero în timp ce reclamațiile cresc → se ștampilează → se oprește funcția, pe baza unui număr.

---

## 13. Fazare

**Faza 0 — fundația (0.5 zile).** `creator_type: :system` + specs. Nu atinge nimic altceva.

**Faza 1 — Auto-reply (1–2 zile).** Migrare, `AutoReplyConfig`, injecție în mailer, `SendAutoReplyJob`, throttle, UI (rând Settings, 3 boxuri, bară de locale, „Customized forms"). **Zero AI, zero tokeni. Livrabil independent.**

**Faza 2 — Suggested replies.** *Precondiție: plafonul de tokeni e un număr, nu o discuție.* `GenerateDraftJob`, `DraftGenerator`, card în thread, 4 contoare, pagină proprie.

**Faza 3 — igienă.** `MessageSid` idempotency, cleanup chei orfane, headere anti-buclă pe mailbox (`Precedence: bulk`, `Auto-Submitted`, `X-Auto-Response-Suppress`).

---

## 14. Fișiere atinse

**Noi**
```
app/models/stejar/helpdesk/auto_reply_config.rb
app/jobs/stejar/helpdesk/send_auto_reply_job.rb
app/services/stejar/helpdesk/suggested_replies/draft_generator.rb
app/jobs/stejar/helpdesk/suggested_replies/generate_draft_job.rb
app/controllers/stejar/helpdesk/settings/auto_reply_controller.rb
app/controllers/stejar/helpdesk/settings/auto_reply/channels_controller.rb
app/controllers/stejar/helpdesk/settings/suggested_replies_controller.rb
app/views/stejar/helpdesk/comments/_suggestion.html.erb
app/javascript/cms/controllers/suggestion_controller.js
db/migrate/   (2 migrări)
```

**Modificate**
```
app/models/stejar/helpdesk/comment.rb                       enum + validare + draft_edited
app/models/stejar/account.rb                                auto_reply_config
app/services/stejar/helpdesk/tickets/create_customer.rb     injecție + urma :system
app/mailers/.../ticket_mailer.rb + template                 blocul auto_reply
app/jobs/.../process_incoming_whatsapp_message_job.rb       enqueue la tichet nou
app/controllers/stejar/helpdesk/tickets_controller.rb       enqueue draft pe #show
app/views/stejar/helpdesk/comments/_composer.html.erb       cardul (composerul rămâne GOL)
app/views/stejar/helpdesk/settings/settings/index.html.erb  rândul Auto-reply
config/routes/helpdesk.rb
```

**De reparat din trecut:** descrierea rândului FAQs zice „*…and WhatsApp auto-replies*" — rămășiță de la botul șters în #869.

---

## 15. Decizii rămase

1. **Plafonul de tokeni: ce număr?** — blochează Faza 2. E cauza declarată a morții lui v1; nu începe fără el.
2. **Ack la redeschiderea unui tichet închis?** Recomandare: **nu**. Frecvența e ce atrage blocări pe WhatsApp, iar Meta gate-ază propriul greeting la o dată per contact per **14 zile** — „o dată per tichet" e deja mai agresiv decât nativul.
3. **LLM:** OpenAI `gpt-5.4-mini` (consistent cu `PublicAiAssistant`) vs. Claude. Recomandare: OpenAI acum.
4. **Numele rândului din Settings:** „Auto-reply" găzduiește și „Suggested replies", care nu răspunde automat niciodată. Alternativă onestă: **„Replies"**.

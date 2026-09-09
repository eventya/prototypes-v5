# WhatsApp Self-Service Activation (Twilio Senders API) — plan de implementare

**Obiectiv:** workspace-ul își activează singur WhatsApp, direct din panoul Setări → WhatsApp, printr-un
**wizard cu 4 pași** (Detalii → Verificare → Aprobare Meta → Activ). Fără tichet în helpdesk, fără
consolă Twilio, fără apel la client. Se folosește **Twilio Senders API - WhatsApp**
([docs](https://www.twilio.com/docs/whatsapp/register-senders-using-api), GA).

Helpdesk-ul rămâne doar **fallback** (buton „cere ajutor" din orice pas) — vezi `PLAN-helpdesk-fallback.md`.

Ecrane: `09-selfservice-connect`, `10-selfservice-verify`, `11-selfservice-status`. Mapare API: `08-api-mapping`.

---

## 1. Flux

```
Wizard (Setări → WhatsApp), stare derivată din whatsapp_sender_status:

[1 Detalii]  POST /v2/Channels/Senders            → status CREATING   ┐ Meta trimite OTP automat
[2 Verificare] POST /v2/Channels/Senders/{sid}     → status VERIFYING  ┘ (client îl introduce în panou)
[3 Aprobare]  GET /v2/Channels/Senders/{sid} / webhook  → OFFLINE (tranzitoriu) → review nume la Meta
[4 Activ]     status ONLINE                        → whatsapp_enabled = true, canal live
```

Statusul se împinge live în panou prin **webhook Twilio → Turbo Stream** (fără polling manual).

---

## 2. Model de date (migrare + AccountMeta)

Fără tabele noi — coloane pe `stejar_account_meta` + o atașare Active Storage pentru logo.

```ruby
# db/migrate/XXXXXX_add_whatsapp_sender_to_account_meta.rb
class AddWhatsappSenderToAccountMeta < ActiveRecord::Migration[7.1]
  def change
    change_table :stejar_account_meta, bulk: true do |t|
      t.string :whatsapp_display_name
      t.string :whatsapp_sender_sid
      t.string :whatsapp_sender_status                 # CREATING/VERIFYING/OFFLINE/ONLINE
      t.string :whatsapp_verification_method, default: "sms"
      t.datetime :whatsapp_sender_synced_at
    end
    add_index :stejar_account_meta, :whatsapp_sender_sid, unique: true
    # whatsapp_phone_number + whatsapp_enabled există deja
  end
end
```

```ruby
# app/models/stejar/account_meta.rb  (adăugiri)
has_one_attached :whatsapp_logo

# Pasul din wizard, derivat din statusul Twilio — o SINGURĂ sursă de adevăr.
def whatsapp_activation_step
  case whatsapp_sender_status
  when nil, "", "not_started" then :details   # 1
  when "CREATING"             then :verify    # 2 — OTP trimis, așteptăm codul
  when "VERIFYING", "OFFLINE" then :review     # 3 — verificat, review nume la Meta
  when "ONLINE"               then :active     # 4
  else :details
  end
end

# Numele partial-ului pentru pasul curent (ca să nu ținem logică în view).
def whatsapp_step_partial = "step_#{whatsapp_activation_step}"

def whatsapp_online? = whatsapp_sender_status == "ONLINE"
```

---

## 3. Client Senders API

```ruby
# app/services/stejar/helpdesk/whatsapp/senders_api.rb
require "net/http"
require "json"

module Stejar
  module Helpdesk
    module Whatsapp
      # Wrapper subțire peste Senders API - WhatsApp (v2/Channels/Senders).
      # Credențialele Twilio sunt globale (un proiect Twilio, mai mulți senderi).
      class SendersApi
        BASE = "https://messaging.twilio.com/v2/Channels/Senders".freeze

        def initialize
          creds = Rails.application.credentials.dig(:twilio) || {}
          @sid, @token = creds[:account_sid], creds[:auth_token]
        end

        # POST — creează sender-ul; Meta trimite OTP-ul imediat (sms sau voce).
        def create_sender(phone:, display_name:, verification_method:, logo_url: nil, callback_url: nil)
          post(BASE, {
            sender_id: "whatsapp:#{phone}",
            configuration: { verification_method: verification_method },
            profile: { name: display_name, logo_url: logo_url }.compact,
            webhook: ({ callback_method: "POST", callback_url: callback_url } if callback_url)
          }.compact)
        end

        # POST /{sid} — trimite codul introdus de client.
        def submit_code(sid:, code:)
          post("#{BASE}/#{sid}", configuration: { verification_code: code })
        end

        # POST /{sid} — reîncearcă un display name respins.
        def update_profile(sid:, display_name:, logo_url: nil)
          post("#{BASE}/#{sid}", profile: { name: display_name, logo_url: logo_url }.compact)
        end

        # GET /{sid} — poll status (fallback la webhook).
        def fetch(sid:) = request(Net::HTTP::Get, "#{BASE}/#{sid}")

        private

        def post(url, **body) = request(Net::HTTP::Post, url, body)

        def request(verb, url, body = nil)
          uri = URI(url)
          req = verb.new(uri)
          req.basic_auth(@sid, @token)
          req["Content-Type"] = "application/json"
          req.body = body.to_json if body
          res = Net::HTTP.start(uri.host, uri.port, use_ssl: true) { |h| h.request(req) }
          json = JSON.parse(res.body)
          raise Error, json["message"] if res.code.to_i >= 400
          json
        end

        class Error < StandardError; end
      end
    end
  end
end
```

---

## 4. Serviciul de orchestrare (leagă API-ul de model)

```ruby
# app/services/stejar/helpdesk/whatsapp/activation.rb
module Stejar
  module Helpdesk
    module Whatsapp
      class Activation
        def initialize(account)
          @account = account
          @meta    = account.account_meta || account.create_account_meta!
          @api     = SendersApi.new
        end

        # Pasul 1 — creează sender-ul; OTP-ul pleacă automat pe număr.
        def start!(phone:, display_name:, verification_method:, logo: nil)
          @meta.whatsapp_logo.attach(logo) if logo
          res = @api.create_sender(
            phone: phone, display_name: display_name,
            verification_method: verification_method,
            logo_url: logo_url, callback_url: webhook_url
          )
          @meta.update!(
            whatsapp_phone_number: phone, whatsapp_display_name: display_name,
            whatsapp_verification_method: verification_method,
            whatsapp_sender_sid: res["sid"], whatsapp_sender_status: res["status"]
          )
        end

        # Pasul 2 — trimite codul de 6 cifre.
        def verify!(code:)
          res = @api.submit_code(sid: @meta.whatsapp_sender_sid, code: code)
          @meta.update!(whatsapp_sender_status: res["status"])
        end

        # Chemat de webhook / poller.
        def sync_status!(status)
          @meta.update!(whatsapp_sender_status: status, whatsapp_sender_synced_at: Time.current)
          @meta.update!(whatsapp_enabled: true) if status == "ONLINE"
        end

        # Reîncearcă un nume respins de Meta.
        def resubmit_name!(display_name:)
          @api.update_profile(sid: @meta.whatsapp_sender_sid, display_name: display_name, logo_url: logo_url)
          @meta.update!(whatsapp_display_name: display_name)
        end

        private

        def logo_url
          return unless @meta.whatsapp_logo.attached?
          Rails.application.routes.url_helpers.rails_blob_url(@meta.whatsapp_logo, host: default_host)
        end

        def webhook_url
          "https://#{default_host}/webhooks/twilio/whatsapp-sender-status"
        end

        def default_host = Rails.application.config.action_mailer.default_url_options[:host]
      end
    end
  end
end
```

> Twilio trebuie să poată descărca `logo_url` public → host public + Active Storage cu URL semnat (nu `localhost`).

---

## 5. Controller wizard

```ruby
# app/controllers/stejar/helpdesk/settings/whatsapp_activation_controller.rb
module Stejar::Helpdesk::Settings
  class WhatsappActivationController < ApplicationController
    requires_permission "helpdesk.settings"
    include Stejar::Helpdesk::Headable
    before_action :set_meta

    def show; end # view-ul dispatch-uiește pe @meta.whatsapp_activation_step

    def create   # pasul 1
      activation.start!(
        phone:               normalized_phone,
        display_name:        params.require(:display_name),
        verification_method: params.fetch(:verification_method, "sms"),
        logo:                params[:logo]
      )
      redirect_to helpdesk_settings_whatsapp_activation_path
    rescue Stejar::Helpdesk::Whatsapp::SendersApi::Error => e
      redirect_to helpdesk_settings_whatsapp_activation_path, alert: e.message
    end

    def verify   # pasul 2
      activation.verify!(code: params.require(:code))
      redirect_to helpdesk_settings_whatsapp_activation_path
    rescue Stejar::Helpdesk::Whatsapp::SendersApi::Error => e
      redirect_to helpdesk_settings_whatsapp_activation_path, alert: "Cod invalid: #{e.message}"
    end

    def resubmit_name  # dacă Meta a respins numele
      activation.resubmit_name!(display_name: params.require(:display_name))
      redirect_to helpdesk_settings_whatsapp_activation_path
    end

    private

    def activation = Stejar::Helpdesk::Whatsapp::Activation.new(current_account)
    def set_meta   = @meta = current_account.account_meta || current_account.build_account_meta
    def normalized_phone = "+#{params.require(:phone).gsub(/\D/, '')}"
  end
end
```

---

## 6. Rute + webhook

```ruby
# config/routes/helpdesk.rb  (în namespace :settings)
resource :whatsapp_activation, only: %i[show], controller: "whatsapp_activation" do
  post :create
  post :verify
  post :resubmit_name
end
```

```ruby
# eventya/config/routes.rb (host app — engine e isolate_namespace, ca la webhook-ul de mesaje)
post "/webhooks/twilio/whatsapp-sender-status",
     to: "stejar/helpdesk/webhooks/twilio_sender_status#create"
```

---

## 7. Webhook status → Turbo Stream (update live în panou)

```ruby
# app/controllers/stejar/helpdesk/webhooks/twilio_sender_status_controller.rb
module Stejar::Helpdesk::Webhooks
  class TwilioSenderStatusController < ActionController::Base
    skip_forgery_protection
    before_action :validate_twilio_signature   # reutilizează pattern-ul din webhook-ul de mesaje

    def create
      sid    = params[:sid]    || params.dig(:sender, :sid)
      status = params[:status] || params.dig(:sender, :status)
      meta   = Stejar::AccountMeta.find_by(whatsapp_sender_sid: sid)
      return head(:ok) unless meta

      Stejar::Helpdesk::Whatsapp::Activation.new(meta.account).sync_status!(status)

      Turbo::StreamsChannel.broadcast_replace_to(
        [meta.account, :whatsapp_activation],
        target:  "whatsapp_activation",
        partial: "stejar/helpdesk/settings/whatsapp_activation/wizard",
        locals:  { meta: meta.reload }
      )
      head :ok
    end
  end
end
```

---

## 8. View wizard (dispatch pe status, zero logică în ERB)

```erb
<%# show.html.erb %>
<%= turbo_stream_from [current_account, :whatsapp_activation] %>
<div id="whatsapp_activation">
  <%= render "wizard", meta: @meta %>
</div>
```

```erb
<%# _wizard.html.erb — stepper + partial-ul pasului curent (nume calculat în model) %>
<%= render "stepper", step: meta.whatsapp_activation_step %>
<%= render meta.whatsapp_step_partial, meta: meta %>
```

Partial-uri: `_step_details` (formularul din ecranul 09), `_step_verify` (OTP, ecran 10),
`_step_review` (așteptare Meta, ecran 11), `_step_active` (profil live). Fiecare postează în
acțiunea corespunzătoare. `_stepper` = componenta cu cei 4 pași.

---

## 9. Fallback — helpdesk (doar când self-service se blochează)

Buton discret „cere ajutor" în orice pas → creează un tichet în helpdesk-ul Eventya (mecanismul din
`PLAN-helpdesk-fallback.md`), cu contextul: workspace, număr, `whatsapp_sender_status`, ultima eroare.
Cazuri: numărul e deja pe WhatsApp, OTP-ul nu ajunge (IVR/robot), Meta respinge numele repetat.

---

## 10. Config & prerechizite

- **Credențiale Twilio globale**: `Rails.application.credentials.dig(:twilio, :account_sid / :auth_token)`.
- **Tech Provider / ISV**: pentru ca numele instituției (Primăria Sibiu) să fie identitatea *ei*, Eventya
  trebuie înrolată ca Tech Provider (WABA per client). Fără asta, senderii merg sub WABA-ul Eventya.
- **Numere fixe**: `verification_method: "voice"`. **IVR/robot nu pot primi OTP** (limitare Meta).
- **Volum**: Twilio recomandă Senders API taman pentru bulk (multe primării).

---

## 11. Validare & edge cases

- **Număr**: normalizat E.164; refuz dacă deja e `whatsapp_sender_sid` activ pe alt account (index unic).
- **Nume afișat**: required; la respingere Meta → limită 250 msg/24h, buton „retrimite nume".
- **Cod OTP**: expiră; buton retrimite (recreează verificarea); rate-limit pe încercări.
- **Webhook**: validează `X-Twilio-Signature`; idempotent pe `sid`+`status`.
- **Poller fallback** (`SyncWhatsappSenderJob`) la câteva minute cât timp `status != ONLINE`, în caz că
  webhook-ul se pierde.
- **Logo**: tip imagine, ≤5MB, pătrat; URL public semnat pentru Twilio.

---

## 12. Teste

- **Service** `Activation`: start! → persistă sid+status; verify! → VERIFYING; sync_status!("ONLINE") → enabled.
- **SendersApi**: stub HTTP (WebMock) pentru create/submit/fetch; ridică `Error` pe 4xx.
- **Controller**: create/verify/resubmit_name; gate permisiune; erori re-randează pasul.
- **Webhook**: semnătură validă/invalidă; broadcast Turbo Stream; idempotență.
- **Model**: `whatsapp_activation_step` pe fiecare status.

---

## 13. Fișiere atinse

| Fișier | Rol |
|---|---|
| `db/migrate/..._add_whatsapp_sender_to_account_meta.rb` | coloane sender + status |
| `app/models/stejar/account_meta.rb` | `has_one_attached :whatsapp_logo`, `whatsapp_activation_step`, predicate |
| `app/services/stejar/helpdesk/whatsapp/senders_api.rb` | client Senders API |
| `app/services/stejar/helpdesk/whatsapp/activation.rb` | orchestrare create/verify/sync |
| `app/controllers/stejar/helpdesk/settings/whatsapp_activation_controller.rb` | wizard |
| `app/controllers/stejar/helpdesk/webhooks/twilio_sender_status_controller.rb` | webhook status |
| `app/views/stejar/helpdesk/settings/whatsapp_activation/*` | show + `_wizard`, `_stepper`, `_step_*` |
| `config/routes/helpdesk.rb` + `eventya/config/routes.rb` | rute wizard + webhook |
| `app/jobs/stejar/helpdesk/sync_whatsapp_sender_job.rb` | poller fallback |
| `config/locales/{7}/helpdesk.yml` | copy wizard (pași, erori, statusuri) |

**Fără tabele noi.** Numele endpoint-urilor sunt cele reale din Senders API; verifică schema exactă a
payload-ului de webhook în docs-ul Twilio la implementare.

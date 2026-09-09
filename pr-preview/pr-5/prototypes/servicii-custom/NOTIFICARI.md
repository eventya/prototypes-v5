# Cum ajunge o notificare din aplicația de servicii în v5

Trei bucăți de cod, în două aplicații.

---

## Tabela din care se pleacă

În baza aplicației de servicii:

```ruby
# notification_outbox
t.string   :idempotency_key, null: false, index: { unique: true }
t.string   :device_uid,      null: false      # identificatorul telefonului, primit de la v5
t.uuid     :account_id,      null: false      # aceeași pereche ca indexul din v5
t.string   :title
t.text     :body
t.string   :url
t.string   :status, default: "pending"        # pending | sent | expired
t.datetime :expires_at, null: false           # ora scrierii + 1h
t.integer  :attempts, default: 0
t.text     :last_error
t.timestamps
```

Rândurile se scriu de jobul de calcul, în aceeași tranzacție cu marcarea abonărilor.

---

## 1 · Cine face apelul — în aplicația de servicii

Un job obișnuit de Rails, care rulează în buclă și golește tabela.

```ruby
# aplicația de servicii
class Notifications::DeliveryJob < ApplicationJob
  def perform
    NotificationOutbox.where(status: "pending")
                      .where("expires_at > ?", Time.current)
                      .find_each do |row|
      deliver(row)
      sleep 0.1                      # 10 pe secundă
    end
  end

  private

  def deliver(row)
    response = Faraday.post("#{V5_URL}/api/v1/notifications") do |req|
      req.headers["Authorization"] = "Bearer #{V5_TOKEN}"
      req.headers["Content-Type"]  = "application/json"
      req.body = {
        cheie:  row.idempotency_key,
        cont:       row.account_id,
        device_uid: row.device_uid,
        titlu:  row.title,
        text:   row.body,
        link:   row.url
      }.to_json
    end

    case JSON.parse(response.body)["stare"]
    when "acceptat"   then row.update!(status: "sent")
    when "necunoscut" then Subscription.where(device_uid: row.device_uid).delete_all
    end
  end
end
```

Ăsta e tot. Un `POST` HTTP obișnuit, ca oricare altul. Nu e nimic special în el.

---

## 2 · Cine îl primește — în v5

Un controller nou, în API-ul care există deja.

```ruby
# stejar — app/controllers/stejar/api/v1/notifications_controller.rb
module Stejar
  module Api
    module V1
      class NotificationsController < BaseController
        include Stejar::Api::V1::RestAuthenticatable      # verifică tokenul

        rate_limit to: 600, within: 1.minute, by: -> { rate_limit_key }

        def create
          return render(json: { stare: "duplicat" }) if already_handled?

          device = find_device
          return render(json: { stare: "necunoscut" }) if device.nil?
          return render(json: { stare: "fara_token" }) if device.push_token.blank?

          remember_key
          DeliverServiceNotificationJob.perform_later(device.id, params.slice(:titlu, :text, :link))

          render json: { stare: "acceptat" }
        end

        private

        def find_device
          Stejar::MobileApp::Device.find_by(device_uid: params[:device_uid],
                                            account_id: params[:cont])
        end

        def already_handled?
          Rails.cache.exist?("notif:#{params[:cheie]}")
        end

        def remember_key
          Rails.cache.write("notif:#{params[:cheie]}", true, expires_in: 7.days)
        end
      end
    end
  end
end
```

Observă: **răspunde imediat**, după ce a găsit telefonul. Trimiterea propriu-zisă o pasează unui job.

De ce în ordinea asta — găsirea telefonului durează ~5 ms, trimiterea la Google poate dura secunde.
Aplicația de servicii are nevoie doar de prima parte, ca să știe pe cine să șteargă din abonări.

---

## 3 · Cine trimite efectiv — tot în v5

Jobul din pasul anterior. Și aici e partea bună: **nu construim nimic nou.**

```ruby
# stejar
class DeliverServiceNotificationJob < ApplicationJob
  def perform(device_id, payload)
    device  = Stejar::MobileApp::Device.find(device_id)
    account = device.account

    # push — clasa asta există deja, o folosesc anunțurile din v5
    Stejar::MobileApp::BulkDeliveryMethods::FirebaseTokens.deliver(
      account: account,
      devices: [device],
      title:   payload["titlu"],
      body:    payload["text"],
      url:     payload["link"]
    )

    # clopoțelul — prin Noticed, ca restul notificărilor din v5
    Stejar::Notifiers::ServiceNotifier.with(
      account: account, title: payload["titlu"], body: payload["text"], url: payload["link"]
    ).deliver(device.membership)
  end
end
```

`FirebaseTokens.deliver` e **codul vostru, care rulează azi** — îl folosește `SendAnnouncementPushJob`
pentru anunțurile din v5. Endpoint-ul nou e doar un capac peste el.

---

## Drumul complet

```
BAZA SERVICIILOR
  tabela notification_outbox, 340 de rânduri
        │
        │  Notifications::DeliveryJob le citește, unul câte unul
        ▼
  Faraday.post → https://soma.ro/api/v1/notifications
        │
        │  ────── graniță între aplicații ──────
        ▼
  Stejar::Api::V1::NotificationsController#create
        │  verifică tokenul
        │  caută Device.find_by(device_uid:, account_id:)
        │  răspunde { stare: "acceptat" }
        │
        └──▶ DeliverServiceNotificationJob (în fundal)
                 │
                 ├──▶ FirebaseTokens.deliver  →  Google/Apple  →  telefon
                 └──▶ Noticed                 →  clopoțelul din aplicație
```

---

## Cine ce deține

| | Aplicația de servicii | v5 |
|---|---|---|
| Decide **când** se trimite | ✅ | — |
| Scrie **textul** | ✅ | — |
| Face apelul HTTP | ✅ | — |
| Are adresa de push a telefonului | — | ✅ |
| Are tokenul de push | — | ✅ |
| Vorbește cu Google/Apple | — | ✅ |
| Scrie în clopoțel | — | ✅ |

Aplicația de servicii trimite **un mesaj scris, către un `device_uid`**. v5 îl caută și livrează.

Aplicația de servicii nu vede niciodată tokenul de push — doar v5 îl are.

---

## Ce se atinge, concret

**În aplicația de servicii — tot nou:**

- migrația pentru `notification_outbox`
- `Notifications::DeliveryJob`
- jobul de calcul care scrie în tabelă

**În v5 — două fișiere noi, plus o linie de rută:**

- `app/controllers/stejar/api/v1/notifications_controller.rb`
- `app/jobs/stejar/deliver_service_notification_job.rb`
- `app/notifiers/stejar/notifiers/service_notifier.rb`
- ruta în `config/routes/api.rb`
- *(nimic pe `mobile_app_devices` — `device_uid` există deja)*

`FirebaseTokens`, `Noticed`, autentificarea prin token și limitarea de rată **există deja** — nu se
modifică nimic în ele.

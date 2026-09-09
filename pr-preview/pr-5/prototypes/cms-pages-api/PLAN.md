# CMS Pages REST API — Plan de implementare

## Context

Clienții (primării, boards de turism, dezvoltatori care integrează site-uri terțe) au nevoie de **acces programatic** la paginile CMS din Stejar, ca la un **headless CMS**: să citească lista de pagini și conținutul structurat al unei pagini pentru a-l randa în propriile lor aplicații (site static, app mobil, kiosk, feed).

**Ce livrăm:**
- Un **REST API public, read-only, versionat** (`/api/v1`) cu **două endpoint-uri GET**:
  - `GET /api/v1/pages` — listă paginată de pagini publicate (metadate — „summary")
  - `GET /api/v1/pages/:slug` — detaliul unei pagini, cu **conținut structurat complet** (arbore `blocks → elements → contents` serializat ca JSON)
- **Autentificare cu API keys per workspace** — chei dedicate, denumite, opace, hashuite, revocabile, gestionate **self-service** de adminul workspace-ului din Settings.
- **Rate limiting** per cheie (mecanismul `rate_limit` nativ din Rails, deja folosit în codebase).
- **Documentație OpenAPI/Swagger** — spec `openapi.yaml` versionat + o pagină **Swagger UI hostată local**, fără gem nou.

**Ce NU facem** (vezi secțiunea *Out of scope*): fără write (POST/PUT/DELETE), fără scopes per-cheie, fără webhooks, fără GraphQL, fără căutare full-text, fără v2.

---

## Starea curentă în codebase

### Nu există un pattern de API key per-client

`mobile_app/api/v1` folosește **trei** mecanisme, dar **niciunul** nu e „cheie opacă, per-account, revocabilă, fără user în spate":

| Mecanism | Unde | Ce e |
|---|---|---|
| `ApiTokenAuthenticatable` | `workspaces`, `configurations`, `sandbox_configurations` | Un singur secret **global** din Rails credentials (`mobile_app.fastlane_token`), `Authorization: Bearer`. Infra, nu per-client. |
| Sesiune user / device | `Api::V1::BaseController` | `allow_unauthenticated_access` + cookie `resume_session` sau device UID. App-ul acționează în numele unui **user logat**. |

Concluzie: modelul de **API key per-client** e nou — nu avem ce refolosi 1:1.

### Rate limiting nativ deja există

Rails `rate_limit to:, within:` e folosit deja în ~6 controllere (`helpdesk_public`, `mobile_app/api/v1/devices`, `auth/*`). **Nu introducem `rack-attack`** — refolosim mecanismul existent.

### Fără gem-uri de serializare / swagger

Nu există `jbuilder`, `active_model_serializers`, `rswag`, `committee`. Serializarea o facem cu **obiecte Ruby simple** (POROs), documentația cu **OpenAPI static + Swagger UI vendorat** (respectă regula „no new gems").

### Modelul de conținut e deja arbore JSON

Important pentru serializare: `Stejar::Cms::Block` și `Stejar::Cms::Element` **nu sunt tabele** — sunt **POROs** care înfășoară un arbore JSON (schema) stocat pe pagină (`Block.from_schema`, `Element.new(data:)`). `Content` e tot un PORO cu valori tipizate (`value_string`, `value_integer`, `value_boolean`, `value_json`, `value_gps`, `value_page_id`, `attr_list_id`). Deci **conținutul e deja tree-shaped** — serializarea structurată înseamnă să plimbăm arborele și să emitem JSON curat, nu să facem JOIN-uri.

### `workspace/settings` e casa pentru API keys

Zona `workspace/` (owner-only: `settings`, `domains`, `locales`) e locul natural pentru gestionarea cheilor, lângă `domains` și `locales`.

---

## Arhitectură — privire de ansamblu

```
Client (curl / SDK / site terț)
  │  Authorization: Bearer evt_live_…
  ▼
GET /api/v1/pages(/:slug)
  │
  ├─ Api::V1::BaseController
  │    ├─ ApiKeyAuthenticatable  → găsește ApiKey după SHA256(token), setează Current.account, 401 dacă lipsă/revocată
  │    ├─ rate_limit by: cheie   → 429 dacă depășit
  │    └─ răspunde DOAR JSON
  │
  ├─ PagesController#index  → Page.published (scoped Current.account) + filtre + paginare → PageSummarySerializer
  └─ PagesController#show   → Page.published.find_by(slug per locale) → PageSerializer (blocks tree)
```

Multi-tenancy: cheia API **determină** account-ul → `Current.account` se setează din cheie (nu din URL). Toate query-urile rămân scoped prin `Current.account`, respectând regula multi-tenant.

---

## 1. Model `ApiKey` + migrare

Tabel nou `stejar_api_keys` (multi-tenant, cu `account_id` + index, ca orice tabel tenant-scoped):

```ruby
# db/migrate/XXXXXX_create_stejar_api_keys.rb
create_table :stejar_api_keys, id: :uuid do |t|
  t.references :account, null: false, type: :uuid, index: true,
               foreign_key: { to_table: :stejar_accounts }
  t.string   :name,          null: false            # „Site public", „App mobil"
  t.string   :token_digest,  null: false            # SHA256(token) hex
  t.string   :token_prefix,  null: false            # „evt_live_4f2a…c91" — pt. afișare
  t.datetime :last_used_at
  t.references :created_by_membership, type: :uuid,  # cine a creat-o
               foreign_key: { to_table: :stejar_memberships }
  t.datetime :revoked_at                             # revocare soft
  t.timestamps
end
add_index :stejar_api_keys, :token_digest, unique: true
add_index :stejar_api_keys, [:account_id, :created_at]
```

```ruby
# app/models/stejar/cms/api_key.rb  (sau app/models/stejar/api_key.rb)
module Stejar
  class ApiKey < ApplicationRecord
    self.table_name = 'stejar_api_keys'

    TOKEN_PREFIX = 'evt_live_'

    belongs_to :account
    belongs_to :created_by_membership, class_name: 'Stejar::Membership', optional: true

    validates :name, presence: true, length: { maximum: 60 }

    scope :active, -> { where(revoked_at: nil) }

    # Plaintext-ul e disponibil DOAR imediat după `generate!` (afișat o singură dată).
    attr_reader :plaintext_token

    def self.generate!(account:, name:, membership: nil)
      raw = "#{TOKEN_PREFIX}#{SecureRandom.hex(24)}"
      key = create!(
        account:, name:, created_by_membership: membership,
        token_digest: digest(raw),
        token_prefix: "#{raw[0, 12]}…#{raw[-4, 4]}"
      )
      key.instance_variable_set(:@plaintext_token, raw)
      key
    end

    def self.digest(raw)
      Digest::SHA256.hexdigest(raw)
    end

    # Autentificare: găsește cheia activă după token-ul din header.
    def self.authenticate(raw_token)
      return nil if raw_token.blank?
      active.find_by(token_digest: digest(raw_token))
    end

    def revoke!
      update!(revoked_at: Time.current)
    end

    def revoked?
      revoked_at.present?
    end

    # Throttled: actualizăm last_used_at cel mult o dată la 5 min ca să nu scriem la fiecare request.
    def touch_last_used!
      return if last_used_at && last_used_at > 5.minutes.ago
      update_column(:last_used_at, Time.current)
    end
  end
end
```

**Note de securitate:**
- În DB stocăm **doar** `SHA256(token)`. Plaintext-ul nu e persistat niciodată; e afișat o singură dată la creare.
- `token_prefix` (primele 12 + ultimele 4 caractere) e sigur de afișat în listă pentru identificare.
- **Prefix `evt_live_` (nu `sk_`)** — namespace propriu Eventya. Evită coliziunea cu formatul cheilor Stripe/OpenAI (`sk_live_<hex>`) și, implicit, alarmele false ale secret scanner-elor: GitHub Push Protection marchează `sk_live_` + hex drept „Stripe API Key" și blochează push-ul.
- Lookup-ul se face pe `token_digest` (indexat unic), comparație în timp constant nu e strict necesară pentru că SHA256 al unui token aleatoriu de 48 hex nu e ghicibil, dar căutarea e O(1) prin index.

---

## 2. Autentificare — `Api::V1::ApiKeyAuthenticatable`

```ruby
# app/controllers/concerns/stejar/api/v1/api_key_authenticatable.rb
module Stejar
  module Api
    module V1
      module ApiKeyAuthenticatable
        extend ActiveSupport::Concern

        included do
          before_action :authenticate_api_key!
        end

        private

        def authenticate_api_key!
          @current_api_key = Stejar::ApiKey.authenticate(bearer_token)
          return render_unauthorized if @current_api_key.nil?

          Stejar::Current.account = @current_api_key.account
          @current_api_key.touch_last_used!
        end

        def current_api_key
          @current_api_key
        end

        def bearer_token
          request.headers['Authorization']&.delete_prefix('Bearer ')&.strip
        end

        def render_unauthorized
          render json: { error: { code: 'unauthorized', message: 'Invalid or missing API key' } },
                 status: :unauthorized
        end
      end
    end
  end
end
```

---

## 3. Rutare + controllere

Fișier de rute nou `config/routes/api.rb` (inclus din `routes.rb` alături de celelalte fișiere modulare), montat **în afara** prefixului multi-tenant `/:account_id` (account-ul vine din cheie):

```ruby
# config/routes/api.rb
namespace :api do
  namespace :v1 do
    resources :pages, only: %i[index show], param: :slug
    get 'docs',        to: 'docs#show'
    get 'openapi.yaml', to: 'docs#openapi', as: :openapi
  end
end
```

```ruby
# app/controllers/stejar/api/v1/base_controller.rb
module Stejar
  module Api
    module V1
      class BaseController < ActionController::API   # API-only: fără cookies/CSRF/views
        include Stejar::Api::V1::ApiKeyAuthenticatable

        rate_limit to: 120, within: 1.minute,
                   by: -> { current_api_key&.id },
                   with: -> { render_rate_limited }

        rescue_from ActiveRecord::RecordNotFound, with: :render_not_found

        private

        def render_not_found
          render json: { error: { code: 'not_found', message: 'Page not found' } },
                 status: :not_found
        end

        def render_rate_limited
          response.set_header('Retry-After', '60')
          render json: { error: { code: 'rate_limited', message: 'Too many requests' } },
                 status: :too_many_requests
        end
      end
    end
  end
end
```

```ruby
# app/controllers/stejar/api/v1/pages_controller.rb
module Stejar
  module Api
    module V1
      class PagesController < BaseController
        def index
          pages = Stejar::Cms::Page.published
                    .then { |s| Stejar::Api::V1::PageFilter.new(s, params).apply }
                    .page(page_param).per(per_page_param)

          render json: {
            data: pages.map { |p| PageSummarySerializer.new(p, locale: locale_param).as_json },
            meta: pagination_meta(pages)
          }
        end

        def show
          page = Stejar::Cms::Page.published.find_by!(/* slug per locale */)
          render json: PageSerializer.new(page, locale: locale_param).as_json
        end

        # ... locale_param / page_param / per_page_param (cap 100) / pagination_meta
      end
    end
  end
end
```

> `Page.published` = scope-ul din `Statusable` (doar pagini publicate — niciodată draft). `find_by!` pe slug ridică `RecordNotFound` → `404` uniform (nu divulgăm existența draft-urilor). Rezolvarea slug-ului per locale folosește logica existentă din `Translatable` (slug per-locale).

---

## 4. Serializare (structured JSON, snake_case)

Serializere PORO sub `app/serializers/stejar/api/v1/`. **Listă = summary** (fără blocks, pentru performanță — nu serializăm arborele complet de 25× ori). **Detaliu = full tree.**

### `PageSummarySerializer`
```json
{
  "id": "…", "title": "Despre noi", "slug": "despre-noi", "locale": "ro",
  "status": "published",
  "published_at": "2026-06-01T09:00:00Z",
  "updated_at": "2026-07-02T14:30:00Z",
  "cover_url": "https://…/cover.jpg",
  "categories": ["festival"],
  "tags": ["vara"],
  "url": "/api/v1/pages/despre-noi"
}
```

### `PageSerializer` (detaliu)
```json
{
  "id": "…", "title": "Despre noi", "slug": "despre-noi", "locale": "ro",
  "status": "published",
  "published_at": "…", "updated_at": "…",
  "seo": { "title": "Despre noi | Primăria X", "description": "…" },
  "cover_url": "https://…/cover.jpg",
  "categories": [{ "slug": "festival", "name": "Festival" }],
  "tags": [{ "slug": "vara", "name": "Vară" }],
  "blocks": [
    {
      "type": "hero",
      "settings": { "background": "surface-50", "padding": "lg" },
      "elements": [
        { "type": "heading", "content": { "text": "Despre noi", "level": 1 } },
        { "type": "image", "content": { "url": "https://…/img.jpg", "alt": "…", "width": 1200, "height": 630 } }
      ],
      "blocks": []            // copii (nested blocks), recursiv
    }
  ]
}
```

**`BlockSerializer` / `ElementSerializer` / `ContentSerializer`:**
- `BlockSerializer` → `{ type: component_name, settings: html_attributes, elements: [...], blocks: [children...] }` (recursiv pe `block.children`).
- `ElementSerializer` → `{ type: component_name, content: {...} }` construit din `element.contents`, cheiate pe `field_key`.
- `ContentSerializer` → rezolvă **valoarea tipizată corectă** din `content_type` și dereferențiază:
  - `value_string` / `value_integer` / `value_boolean` / `value_json` → valoarea brută
  - media asset → URL public absolut
  - `value_page_id` → `{ "page_slug": "…", "url": "/api/v1/pages/…" }` (link intern)
  - `value_gps` → `{ "lat": …, "lng": … }`
  - `attr_list_id` / categories / select → listă de opțiuni rezolvate `{ slug, name }`

> Componentele necunoscute (`UnknownComponent`) se serializează defensiv ca `{ "type": "unknown", "content": {} }` — nu aruncă.

**Convenție JSON:** `snake_case` (default Rails/Ruby). Timestamps ISO8601/UTC. URL-uri media absolute.

---

## 5. Filtrare & paginare — `Api::V1::PageFilter`

Obiect PORO care aplică filtrele pe scope, doar pe pagini **published**:

```
GET /api/v1/pages
  ?locale=ro                        # default: locale-ul implicit al account-ului
  &collection=<slug>                # filtrează pe Collection
  &category=<slug>                  # filtrează pe Category (Categoryable)
  &tag=<slug>                       # filtrează pe Tag (Taggable)
  &updated_since=2026-07-01T00:00Z  # sync incremental (updated_at >= )
  &page=2                           # Kaminari
  &per_page=25                      # default 25 (paginates_per), cap la 100
```

- `PageFilter#apply` primește `scope` + `params`, întoarce un `ActiveRecord::Relation` (chainable, evită N+1 cu `includes` pe categories/tags/cover).
- `per_page` capped la 100 (protecție împotriva payload-urilor uriașe).
- `updated_since` parsat cu `Time.iso8601`; invalid → `422`.
- Filtre necunoscute = ignorate (nu 422 — forward-compatible).

`pagination_meta` → `{ page, per_page, total_pages, total_count }`.

---

## 6. Rate limiting (Rails nativ, per cheie)

Declarat pe `BaseController` (vezi §3): `rate_limit to: 120, within: 1.minute, by: -> { current_api_key&.id }`.

- Cheiat pe **id-ul cheii API**, nu pe IP (un client cu multe integrări nu-și fură singur din buget între chei; două workspace-uri diferite nu se afectează).
- `with:` → răspuns `429` cu JSON + header `Retry-After: 60`.
- Default: **120 req/min per cheie** (configurabil global).

**Notă infra:** `rate_limit` folosește `Rails.cache`. În producție trebuie un store persistent și partajat între procese (Redis / Solid Cache / Memcached). Cu `:memory_store` (default dev) limita e per-proces — ok pentru dev, **nu** pentru prod. De confirmat la deploy.

---

## 7. Erori (JSON consistent)

Toate erorile au aceeași formă:
```json
{ "error": { "code": "not_found", "message": "Page not found" } }
```

| Status | `code` | Când |
|---|---|---|
| `401` | `unauthorized` | Cheie lipsă / invalidă / revocată |
| `404` | `not_found` | Pagină inexistentă sau nepublicată (nu divulgăm draft-uri) |
| `422` | `invalid_params` | `updated_since` / `per_page` invalid |
| `429` | `rate_limited` | Depășire rate limit (+ `Retry-After`) |

---

## 8. UI self-service — `workspace/api_keys`

Rută nouă lângă `domains`/`locales`, owner-only:

```ruby
# config/routes/workspace.rb
namespace :workspace do
  resources :api_keys, only: %i[index create destroy]   # destroy = revoke
end
```

`Workspace::ApiKeysController` (thin, CRUD standard):
- `index` — listă cheile active + revocate (revocatele grayed out).
- `create` — `ApiKey.generate!(account: Current.account, name:, membership: Current.membership)`; răspunde `turbo_stream` care randează **cheia în clar o singură dată** (din `@key.plaintext_token`) cu buton „Copy" + avertisment.
- `destroy` — `@key.revoke!` (soft), cu confirmare (acțiune distructivă).

Ecrane (design system real):
1. **Listă** — rânduri cu nume, `token_prefix` (`font-mono`), „last used", buton **Revoke**.
2. **Create + reveal** — form (doar `name`) → panou cu cheia completă, „shown once", copy.
3. **Empty state** — icon + „Nicio cheie API încă" + descriere + CTA „Create your first API key".
4. **Revoke confirm** — dialog de confirmare.

Copy uman (per skill-ul UX): „API key", „Revoke", „Create key" — nu „token", „delete", „credential".

---

## 9. Documentație — OpenAPI static + Swagger UI (fără gem)

- **`config/openapi/pages_api.yaml`** — spec OpenAPI 3.1 versionat în repo, **sursă unică de adevăr**. Descrie cele 2 endpoint-uri, schema `Page`/`PageSummary`/`Block`/`Element`, auth `bearerAuth`, erorile, exemple.
- **`Api::V1::DocsController`**:
  - `#openapi` → servește `pages_api.yaml` (`text/yaml`), **fără** auth (docs publice).
  - `#show` → pagina **Swagger UI** cu asset-uri **vendorate local** (`vendor/swagger-ui/`, fără CDN — respectă pattern-ul din prototypes) care încarcă `/api/v1/openapi.yaml`. Oferă „try it out" interactiv.
- **Contract test** (request spec) care lovește API-ul real și verifică că răspunsul conține **exact** câmpurile documentate în `pages_api.yaml`. Dacă adaugi/scoți un câmp din serializer fără să actualizezi yaml-ul → pică la `bin/ptest`. Asta ne dă ~90% din siguranța `committee`, fără gem.

> Dacă API-ul crește la 10+ endpoint-uri, reevaluăm și cerem explicit aprobare pentru `committee` (design-first, validare completă de schemă) — la 2 endpoint-uri nu se justifică.

---

## 10. Testing

- **Model spec** `api_key_spec.rb` — `generate!` produce token cu prefix corect, stochează doar digest, `authenticate` găsește cheia activă și respinge revocatele, `touch_last_used!` throttled, `revoke!`.
- **Request specs** `api/v1/pages_spec.rb`:
  - `index` — doar published; filtre (locale, collection, category, tag, updated_since); paginare + `meta`; `per_page` cap la 100.
  - `show` — conținut structurat corect (blocks/elements/contents, page-ref, media URL, gps); slug per locale; `404` pe draft/inexistent.
  - auth — `401` fără cheie / cheie invalidă / revocată; `Current.account` setat corect din cheie.
  - rate limit — `429` după depășire (cu `Retry-After`).
- **Contract test** — răspunsurile conforme cu `pages_api.yaml` (§9).
- **Request spec** `workspace/api_keys_spec.rb` — create (reveal o singură dată), index, revoke; owner-only.

Rulare: `bin/ptest`. Multi-tenancy: account default creat în `rails_helper`.

---

## 11. Faze de implementare

**Faza 1 — Fundația (model + auth + un endpoint)**
1. Migrare `stejar_api_keys` + model `ApiKey` (+ specs).
2. `Api::V1::BaseController` + `ApiKeyAuthenticatable` + `Api::V1::PagesController#index` cu `PageSummarySerializer`.
3. Rutare `config/routes/api.rb`. Request specs pentru `index` + auth.

**Faza 2 — Detaliu structurat**
4. `PageSerializer` + `BlockSerializer` / `ElementSerializer` / `ContentSerializer` (arbore recursiv, dereferențiere tipizată). `#show` + specs.
5. `PageFilter` (locale/collection/category/tag/updated_since) + paginare + `meta`.

**Faza 3 — Rate limit + erori**
6. `rate_limit` per cheie + `render_rate_limited` + `render_not_found` + shape uniform de eroare. Specs.

**Faza 4 — UI self-service**
7. `Workspace::ApiKeysController` + rute + ecrane (listă / create+reveal / empty / revoke). Request specs.

**Faza 5 — Documentație**
8. `config/openapi/pages_api.yaml` + `DocsController` + Swagger UI vendorat + contract test.

---

## 12. Out of scope (YAGNI)

- **Fără write** — read-only. Fără POST/PUT/PATCH/DELETE pe pagini.
- **Fără scopes/permisiuni per-cheie** — o cheie citește tot workspace-ul.
- **Fără căutare full-text / sortare configurabilă / relații parent-children** (era opțiunea „Bogat", respinsă în favoarea „Standard").
- **Fără webhooks, fără GraphQL.**
- **Fără versionare v2 / deprecation policy** — un singur `v1`.
- **Fără expunerea altor resurse** (posts, collections, navigations) — doar `pages`. Le adăugăm când apare nevoia reală.

---

## Decizii confirmate

| Decizie | Alegere |
|---|---|
| Răspuns detaliu | **Conținut structurat (JSON)** — headless CMS |
| Model token | **API keys per workspace, denumite, self-service în Settings**, hashuite (SHA256), afișate o singură dată, revocabile |
| Scop listă | **Standard** — published + locale/collection/category/tag + `updated_since` + paginare |
| Rate limit | Rails nativ, **120 req/min per cheie** |
| Documentație | **OpenAPI static + Swagger UI vendorat (fără gem)** + contract test |
| Legare de workspace | Cheia **determină** account-ul (path curat `/api/v1/pages`) |

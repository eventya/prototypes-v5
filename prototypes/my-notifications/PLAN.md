# My Notifications — Implementation Plan

## Goal

Public users can control if they receive notifications, about what, and through which delivery channels (email + push).

## Design

See screen 01 in this set. Key UI:

- **Status banner** — master on/off toggle with clear state text
- **CE?** section — "everything" or "only pages I follow"
- **CUM?** section — Email and Push toggle cards

---

## How `notification_scope` works

There are two distinct types of notifications in the system:

| Type | Triggered by | Example |
|---|---|---|
| **Targeted** | A page you follow publishes something | New post, schedule change, event update |
| **Broadcast** | Platform sends to all workspace members | Community announcements |

`notification_scope` controls which types you receive:

| Scope | Targeted (page-follow) | Broadcast (announcements) |
|---|---|---|
| `all` | ✓ | ✓ |
| `followed` | ✓ | ✗ |

Targeted notifications **always** reach followers regardless of scope — you followed the page, you get its updates. Broadcast notifications (announcements etc.) are the noise the `followed` scope opts you out of. This means:

- `PageBroadcast#follower_memberships` — ignores `notification_scope`, filters only by `enabled` + channel
- Announcement delivery — filters by `notification_scope = "all"` before sending

---

## Database — migrations

Two separate migrations: one for schema (fast, DDL-only), one for the backfill (potentially slow, must run outside a transaction).

### Migration 1 — schema

```ruby
class CreateMembershipNotificationSettings < ActiveRecord::Migration[7.2]
  def change
    create_table :stejar_membership_notification_settings, id: :uuid do |t|
      t.references :membership, null: false, foreign_key: { to_table: :stejar_memberships },
                   type: :uuid, index: { unique: true }
      t.boolean :enabled,            null: false, default: true
      t.string  :notification_scope, null: false, default: "all"  # "all" | "followed"
      t.boolean :email,              null: false, default: true
      t.boolean :push,               null: false, default: true
      t.string  :unsubscribe_token,  null: false, default: ""
      t.timestamps
    end

    add_index :stejar_membership_notification_settings, :unsubscribe_token,
              unique: true, where: "unsubscribe_token != ''"
  end
end
```

### Migration 2 — backfill (separate file, no transaction)

```ruby
class BackfillMembershipNotificationSettings < ActiveRecord::Migration[7.2]
  disable_ddl_transaction!

  def up
    execute <<~SQL
      INSERT INTO stejar_membership_notification_settings
        (id, membership_id, enabled, notification_scope, email, push,
         unsubscribe_token, created_at, updated_at)
      SELECT
        gen_random_uuid(),
        id,
        true,
        'all',
        true,
        true,
        encode(gen_random_bytes(16), 'hex'),
        now(),
        now()
      FROM stejar_memberships
      ON CONFLICT (membership_id) DO NOTHING
    SQL
  end

  def down
    # intentionally a no-op — don't delete preferences on rollback
  end
end
```

`disable_ddl_transaction!` means this runs outside a transaction. Safe for large tables — no lock held for the duration of the INSERT. `ON CONFLICT DO NOTHING` makes it idempotent (safe to re-run).

**Why two migrations?** If schema + data run in one transaction, PostgreSQL holds an exclusive lock on `stejar_memberships` for the entire INSERT duration. On a large table that causes downtime. Separating them means the DDL migration is near-instant and the data migration locks nothing.

**Why not columns on `stejar_memberships`?** The memberships table is already wide. Notification settings grow independently — more channels, per-type granularity — and a separate table keeps those concerns isolated.

**Column naming note:** The scope column is `notification_scope`, not `scope`. `scope` is a class method on `ActiveRecord::Base` — using it as a column name causes subtle issues.

---

## Unsubscribe token

Every email sent via `PageBroadcast` or announcement delivery must include:

1. A `List-Unsubscribe` header pointing to a tokenized endpoint
2. A visible unsubscribe link in the email body

```
List-Unsubscribe: <https://example.com/notifications/unsubscribe?token=abc123>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

The token is pre-generated in the backfill (and generated on `before_create` for new memberships). The unsubscribe endpoint sets `email: false` without requiring login — just a valid token lookup.

```ruby
# Membership model
before_create :generate_unsubscribe_token

private

def generate_unsubscribe_token
  notification_setting&.unsubscribe_token ||
    SecureRandom.hex(16)
end
```

Actually cleaner on the setting model itself:

```ruby
# MembershipNotificationSetting
before_create :set_unsubscribe_token

private

def set_unsubscribe_token
  self.unsubscribe_token = SecureRandom.hex(16)
end
```

Add a public route (no auth required):

```ruby
# routes.rb (top-level, outside community namespace)
get "/notifications/unsubscribe", to: "notifications/unsubscribes#show"
```

Controller just finds by token and flips `email: false`. No login needed, no CSRF — it's a GET by design (email clients pre-fetch links, POST-based unsubscribe requires `List-Unsubscribe-Post` header support which not all clients have).

---

## Model — `Stejar::MembershipNotificationSetting`

```ruby
class Stejar::MembershipNotificationSetting < Stejar::ApplicationRecord
  self.table_name = "stejar_membership_notification_settings"

  belongs_to :membership, class_name: "Stejar::Membership"

  NOTIFICATION_SCOPES = %w[all followed].freeze
  validates :notification_scope, inclusion: { in: NOTIFICATION_SCOPES }

  before_create :set_unsubscribe_token

  private

  def set_unsubscribe_token
    self.unsubscribe_token = SecureRandom.hex(16)
  end
end
```

Add to `Stejar::Membership`:

```ruby
has_one :notification_setting,
        class_name: "Stejar::MembershipNotificationSetting",
        dependent: :destroy
```

After backfill, every membership has a row. No lazy-build helper needed.

---

## Routes

In `stejar/config/routes/community.rb`:

```ruby
resource :notification_preferences, only: [:show, :update]
```

Route: `GET/PATCH /:account_id/community/notification_preferences`

---

## Controller

```ruby
class Stejar::Community::NotificationPreferencesController < Stejar::Community::ApplicationController
  before_action :set_setting

  def show
    @followed_pages = current_user.followed_pages.includes(:translations).limit(20)
  end

  def update
    if @setting.update(notif_params)
      redirect_to community_notification_preferences_path,
                  notice: t("community.notification_preferences.saved")
    else
      @followed_pages = current_user.followed_pages.includes(:translations).limit(20)
      render :show, status: :unprocessable_entity
    end
  end

  private

  def set_setting
    # Every membership has a row post-backfill.
    # create_notification_setting! handles the edge case of a membership
    # created after the migration ran (new signups during deploy window).
    @setting = current_membership.notification_setting ||
               current_membership.create_notification_setting!
  rescue ActiveRecord::RecordNotUnique
    # Two concurrent requests raced to INSERT — unique constraint won.
    # Retry the find.
    @setting = current_membership.notification_setting
  end

  def notif_params
    params.require(:membership_notification_setting)
          .permit(:enabled, :notification_scope, :email, :push)
  end
end
```

`current_membership` must be memoized in `Stejar::Community::ApplicationController` — it's called in `set_setting` and potentially elsewhere in the request cycle.

---

## View — `show.html.erb`

Plain Rails form. `f.check_box` already emits `<input type="hidden" value="0">` automatically — do **not** add an extra `hidden_field` alongside it or the checkbox will always read as unchecked.

```erb
<%= form_with model: @setting,
              url: community_notification_preferences_path,
              method: :patch do |f| %>

  <%= f.check_box :enabled %>

  <%= f.radio_button :notification_scope, "all"      %>
  <%= f.radio_button :notification_scope, "followed" %>

  <%= f.check_box :email %>
  <%= f.check_box :push  %>

  <%= f.submit t("community.notification_preferences.save") %>
<% end %>
```

Add a `notification-preferences` Stimulus controller for:
- Show/hide the followed-pages list when scope radio changes to `followed`
- Toggle visual "on/off" CSS class on channel cards when checkboxes change
- "Setări salvate" confirmation pill on Turbo redirect (flash)

---

## Integration — `Stejar::Community::PageBroadcast`

**`notification_scope` is not filtered here.** Page-follow notifications always reach followers regardless of scope — the user followed the page, they get its updates. Scope only controls broadcast (announcement) delivery.

Replace `pluck(:id)` + `WHERE IN (...)` with a single subquery join. At scale, loading follower IDs into Ruby memory then back to SQL is slow.

```ruby
def self.follower_memberships(page, channel: nil)
  # Single query via JOIN — no pluck, no Ruby array.
  # INNER JOIN is safe post-backfill: every membership has a settings row.
  scope = page.account.memberships
               .active
               .joins(
                 "INNER JOIN stejar_page_follows " \
                 "ON stejar_page_follows.user_id = stejar_memberships.user_id " \
                 "AND stejar_page_follows.page_id = #{connection.quote(page.id)}"
               )
               .joins(:notification_setting)
               .where(notification_setting: { enabled: true })
               # notification_scope intentionally NOT filtered here —
               # everyone who follows a page receives its targeted notifications.

  case channel
  when :email then scope.where(notification_setting: { email: true })
  when :push  then scope.where(notification_setting: { push: true })
  else scope
  end
end
```

Update callers: pass `channel: :email` or `channel: :push`.

### Announcement delivery

This is where `notification_scope` matters. Only members who want everything receive platform-wide announcements:

```ruby
# In announcement notification delivery
memberships.active
           .joins(:notification_setting)
           .where(notification_setting: {
             enabled: true,
             notification_scope: "all",
             email: true   # or push: true for the push path
           })
```

### Rollout

`PageBroadcast` integration is the **riskiest step** — it changes who receives email and push in production. Deploy behind an account-level feature flag. Enable for one internal test account first, verify delivery counts are correct, then roll out to all accounts. Do not enable broadly in the same deploy as the migration.

---

## i18n keys (EN + RO)

```yaml
community:
  notification_preferences:
    saved: "Settings saved"
    save: "Save changes"
    enabled: "Notifications are on"
    disabled: "Notifications are off"
    enabled_sub: "You'll receive notifications on the channels below."
    disabled_sub: "You won't receive any notifications until you turn them back on."
    toggle_on: "Turn on"
    toggle_off: "Turn off"
    scope_all_label: "Notify me about everything"
    scope_all_desc: "Page updates and platform announcements from this workspace."
    scope_followed_label: "Only pages I follow"
    scope_followed_desc: "Updates from pages you follow only. Platform announcements are skipped."
    channel_email_name: "Email"
    channel_email_desc: "A clear summary in your inbox, with a direct link to the new content."
    channel_push_name: "Push"
    channel_push_desc: "Instant notification on your phone, even when the app is closed."
    channel_active: "Active"
    channel_inactive: "Inactive"
```

---

## Navigation entry point

Add a "Notificări" link in the public user profile settings menu within a workspace context.

---

## Implementation order

1. Migration 1: create `stejar_membership_notification_settings` table
2. Migration 2: backfill INSERT (`disable_ddl_transaction!`, separate file)
3. `MembershipNotificationSetting` model (with `before_create :set_unsubscribe_token`)
4. `Membership` → `has_one :notification_setting`
5. Verify `current_membership` is memoized in community base controller
6. Route + controller + basic form view — **validate in staging before continuing**
7. Stimulus controller for interactive UX
8. Unsubscribe endpoint (`GET /notifications/unsubscribe?token=...`, no auth)
9. Wire unsubscribe token into outgoing email headers (`List-Unsubscribe`)
10. Announcement delivery: filter by `notification_scope = "all"` per channel
11. `PageBroadcast` integration: subquery JOIN + channel filtering — **behind feature flag, roll out per-account**
12. i18n keys (EN + RO, then other locales)
13. Nav link from user settings menu

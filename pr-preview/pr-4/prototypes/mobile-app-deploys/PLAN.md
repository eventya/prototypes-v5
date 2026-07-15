# Mobile App Deploys

**Goal.** Replace the manual release ritual — RustDesk into the Mac mini → terminal → `bundle exec fastlane release` → pick the workspace → watch stdout — with a **Mobile Deploys** section in `/stejar-admin`: pick a workspace, pick iOS or Android, click **Deploy**, watch the log, get the TestFlight build number / Play version code. Plus a **Download APK** button.

> The 9 screens in this folder are the agreed UI. The architecture is being redesigned from scratch — this file keeps only the UI and the facts worth carrying into that redesign.

## The screens

| # | File | Shows |
|---|------|-------|
| 1 | `01-list.html` | Deploy history + build-machine status + New deploy |
| 2 | `02-new.html` | Workspace → platform → options; a platform is blocked with the reason if its readiness checklist isn't complete |
| 3 | `03-running.html` | Status + log so far; a **Refresh** button updates the log/status; Cancel |
| 4 | `04-uploaded.html` | iOS success — version + build number, an "Apple may still reject it" note; log behind View log |
| 5 | `05-failed.html` | The real error, Retry; log behind View log |
| 6 | `06-apk-ready.html` | The signed APK, downloadable |
| 7 | `07-first-release.html` | Google won't take the first Android bundle via API — the AAB is built + handed over with steps |
| 8 | `08-stalled.html` | The build machine stopped responding |
| 9 | `09-no-runner.html` | Deploying blocked, no runner online |

## Facts to carry into the new architecture (verified against the current code)

- **The Mac mini is the crown jewel.** It holds `FASTLANE_API_TOKEN_*`, which downloads **every client's** App Store Connect key + Play keystore. Never expose it to inbound connections; keep the trigger flow outbound-only if possible.
- **fastlane is interactive today.** `pick_workspace` (`eventya_ios/fastlane/helpers/ui_helper.rb:46`) blocks on stdin for >1 workspace — any automation needs a non-interactive `slug:` path first.
- **Live secret leak to fix regardless:** `eventya_android/fastlane/Fastfile:126-127` echo the keystore password to stdout (`build.rb:30,33`). Fix = `print_command: false` on both `gradle(...)`.
- **iOS version numbers can bleed between workspaces** unless `.env`'s `VERSION_NUMBER`/`BUILD_NUMBER` are cleared on slug change (`Config.sync_slug`, `config.rb:77-80`) — a wrong number on a live App Store listing is permanent.
- **Artifacts must be private.** All DO Spaces services are `public:true` and CDN-rewritten to permanent URLs; a Download-APK needs a private storage path with a short-lived signed URL, not a public blob.
- **The APK / AAB is Android-only** (an App-Store-signed IPA won't install anywhere). The log should be the full fastlane output with secret values masked.
- **"Uploaded" ≠ "Succeeded":** fastlane returns when Apple *accepts* the bytes; Apple can reject minutes later by email. Don't claim success.
- **First-release (Android)** isn't a failure — Google requires the first bundle uploaded by hand; build the AAB and hand it over.

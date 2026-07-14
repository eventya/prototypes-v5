# Mobile App Deploys — deploy iOS & Android from stejar-admin

## The problem

Shipping a client's mobile app today means sitting at a Mac. You RustDesk into the office Mac mini, open a terminal, `cd` into `eventya_ios` or `eventya_android`, run `bundle exec fastlane release`, pick the workspace from an interactive menu, and watch stdout scroll for 6–15 minutes until fastlane prints a version number. Building an APK for a client to install is the same ritual.

Only one person can do it, only from a machine that's set up for it, and there's no record of what was shipped when.

## What we're building

A **Mobile Deploys** section in `/stejar-admin`. Pick a workspace, pick iOS or Android, click Deploy. Watch a live progress screen. Get the real TestFlight build number or Play version code when it lands. Download an APK straight from the browser.

The build still runs on the Mac mini — Xcode only runs on macOS, that can't change. But it's *driven* from the browser, and RustDesk stops being part of the release process.

## How the browser reaches the Mac mini

**The mini asks eventya.net for work; eventya.net never connects to the mini.**

A small program on the mini polls `eventya.net` every 10 seconds: *"any builds for me?"* When there is one, it takes the job, runs exactly the same fastlane command a human would, and streams progress back as it happens.

This means **no open ports on the Mac mini**, no port-forwarding, no VPN, no SSH key sitting inside the Rails Docker image. That matters more than it might sound: the Mac mini holds **every client's App Store Connect private key and Play keystore**. It is the most sensitive machine we own, and the design deliberately gives it no inbound attack surface at all.

Setup on the mini is a one-time `install.sh` — roughly 15 minutes, no network configuration.

---

## The screens

| # | Screen | What it's for |
|---|--------|---------------|
| 1 | Deploy list | History, status of the build machine, filters. The landing page. |
| 2 | New deploy | Workspace → platform → options. A platform is **blocked with the reason** if its settings checklist isn't complete. |
| 3 | Build running | The live screen: what step it's on, how long it's taken, the log as it happens, Cancel. |
| 4 | Uploaded | iOS success — the actual version and build number, and an honest note that Apple may still reject it. |
| 5 | Failed | Which step broke, the real error, one-click retry. |
| 6 | APK ready | The signed APK, downloadable. This replaces building it by hand. |
| 7 | First release | Google won't accept the first bundle over the API — the AAB is built and handed to you with instructions. |
| 8 | Stalled | *"Nothing for 8 minutes — a dialog is probably blocking the Mac mini."* The 2am screen. |
| 9 | Runner offline | Deploying is blocked, with the likely reason and the fix. |

---

## Decisions worth arguing about

**No "estimated time remaining."** iOS takes ~15 minutes, Android ~6, and a cold cache swings both wildly. A countdown that's wrong teaches you to distrust the whole screen. Instead: elapsed time, plus a **stall detector** that tells you when something is *actually* wrong — which is the thing you actually want to know.

**The success state says "Uploaded", not "Succeeded".** Apple accepts the binary and *then* processes it, and can reject it by email 20 minutes later. If we said "Succeeded" we'd be lying about something we cannot know. So: "Uploaded", plus a link to App Store Connect and a plain warning to confirm there.

**Cancel is disabled during the upload step.** Killing a build mid-upload would show "cancelled" here while a real build quietly lands in the client's store listing. Refusing to cancel is more honest than pretending.

**One build at a time.** Both repos have a single working copy that fastlane rewrites per workspace. Two builds at once would mix workspace A's config with workspace B's icons — and ship it. So builds queue, and a lock stops even a human at the terminal from colliding with a build in flight.

**Artifacts are Android only.** An App Store-signed IPA won't install on any device, so there's no reason to offer it. APK (to sideload) and AAB (for the manual first upload) are the useful ones.

---

## What this fixes on the way

Three things surfaced while designing this, all of which have to be fixed for it to be safe:

- **The build log currently prints the client's keystore password in plaintext** — fastlane echoes the Gradle command line, and the password is one of its arguments. Today that only goes to a terminal nobody keeps. Streaming it to a browser and a database would turn it into a real leak. Fixed at the source, with redaction as a second layer.
- **Deploying several workspaces back to back could ship the wrong version number to a client's App Store listing** — iOS caches the last version in a file that isn't reset between workspaces. Irreversible if it happened.
- **A dead Google Play service-account key is committed to git.** It's unused — the real one has lived in the backend since the Sandbox App settings page was built — so it just gets deleted.

---

## Rollout

1. **This prototype** — agree the UI.
2. **fastlane** — make it non-interactive (it currently *stops and asks* which workspace), stop it printing secrets, and have it report progress in a machine-readable way.
3. **Backend** — the deploy record, the API the Mac mini talks to, the live-updating screens.
4. **The runner** — one Ruby file on the mini, started automatically at login.

Sandbox → Android → staging is the first real build, because it's the cheapest thing to get wrong.

---
name: create-prototype
description: Workflow for the prototypes-v5 repo — static design prototypes (implementation plan + HTML screens) styled with the REAL Stejar design system, hosted on GitHub Pages, reviewed via PR. Use when creating, editing, or reviewing a prototype/mockup, adding a new prototype set, building the CSS, or when the user mentions prototypes, prototypes-v5, design mockups, or a PLAN.md + screens.
---

# Creating prototypes in `prototypes-v5`

## What this repo is (and why)

`prototypes-v5` is a **standalone static site** for design prototypes: an
implementation **plan** (`PLAN.md`) plus **HTML design screens**, styled with the
**real Stejar design system**. It is deliberately decoupled from the
`stejar`/`eventya` release train so a design tweak does **not** require a Stejar PR,
a `Gemfile.lock` bump, or a Rails deploy.

The friction it solves: previously prototypes lived inside the Stejar engine
(`Stejar::Admin::PrototypesController`), so every small change went through
PR → approve → bump → deploy before anyone else could see it. Here, a change is:
edit HTML → open a PR → get a live preview link → team reviews → merge.

## Golden rules

1. **PRs go HERE, in `prototypes-v5`. Never in `stejar` for a prototype tweak.**
   - Touch `stejar` only when the *design system itself* changes (then rebuild CSS).
   - Touch `stejar`/`eventya` only when you *implement the approved plan* for real.
2. **Design-system concordance is automatic via the build, not by copying.**
   `build/prototypes.css` `@import`s the real `stejar/.../application.css` and adds
   the prototype HTML as a Tailwind `@source`. So tokens/components match production
   AND any utility class you use compiles. Never hand-copy tokens or use CDN Tailwind.
3. **Use real design-system classes:** `.btn` / `.btn--primary` / `.btn--sm` / `.btn--ghost`,
   `.card` / `.card--interactive`, `.input`, `.badge` (+ `--positive/--negative/--warning/--number`),
   `.table`; tokens `surface-0/50/100/200/300/400`, `ink-300..900`, `primary*`.
   See the `design-system` skill for the full catalog.
4. **Dark mode:** set via `data-theme="dark"` on `<html>`. Neutral tokens
   (`surface-*`, `ink-*`) auto-flip — no `dark:` prefix needed for them. Semantic
   colors (emerald/sky/amber/red/violet) DO need `dark:` variants. Every screen
   includes the FOUC script + a toggle button (copy from `_template.html`).
5. **Icons: use inline SVG** in prototypes. The Lucide `icon-*` font is NOT bundled
   into the standalone CSS (its `url()`s don't resolve), so `<i class="icon-x">` will
   be blank. Inline `<svg>` (stroke-based, `viewBox="0 0 24 24"`) always renders.
6. **Paths are relative.** Screens live two levels deep, so CSS is
   `../../assets/application.css`. The hub at the root uses `assets/application.css`.
   This works both locally (served at `/`) and on Pages (served at `/prototypes-v5/`).
7. **Commit the built `assets/application.css`.** CI does not build it — the deployed
   site and PR previews use exactly the file you built locally (WYSIWYG).

## Repo layout

```
prototypes-v5/
├── build/prototypes.css        # Tailwind entry: imports Stejar CSS + @source on screens
├── assets/application.css      # BUILT + committed; assets/VERSION stamps the stejar SHA
├── _template.html              # starter screen — copy this
├── index.html                  # hub: lists all sets
├── prototypes/<feature>/
│   ├── PLAN.md                 # the implementation plan (prose/markdown)
│   ├── index.html              # set landing: renders PLAN.md + lists screens
│   └── NN-<name>.html          # zero-padded, ordered screens
└── .github/workflows/          # pages.yml (publish main) + pr-preview.yml (per-PR preview)
```

## Create a new prototype set

1. `mkdir prototypes/<feature>` (kebab-case slug).
2. Write `prototypes/<feature>/PLAN.md` — the implementation plan.
3. Copy `prototypes/sla-system/index.html` → the new set's `index.html` (it renders
   `PLAN.md` via `marked` and lists screens); update title + the screen links.
4. Copy `_template.html` → `prototypes/<feature>/01-<name>.html`; build the screen
   with real design-system classes + inline SVG icons. Fix the relative CSS path to
   `../../assets/application.css` and set the banner label + back link to `index.html`.
   Repeat per screen (`02-…`, `03-…`).
5. Add a card for the set to the root `index.html` hub.
6. Build & preview locally (below), then open a PR.

When porting an existing ERB view to a static screen, strip the ERB: replace
`render`/`link_to` with static markup + relative `href`s, replace instance vars with
literal sample data, and swap any `icon-*` font usage for inline SVG. (The original
in-app SLA prototype zone in Stejar was removed once these screens were ported here —
prototypes now live ONLY in this repo.)

## Work locally

Requires the `stejar` repo checked out as a sibling (`../stejar`).

```bash
npm install
npm run dev          # watch:css (rebuilds on screen OR Stejar source change) + serve :4000
# open http://localhost:4000/prototypes/<feature>/
```

Build once / for committing:
```bash
npm run build:css    # -> assets/application.css (minified)
npm run stamp        # -> assets/VERSION (stejar <sha> + timestamp)
```

## Keep CSS in concordance with Stejar

The build reads live Stejar source, so rebuilding picks up design-system changes:
```bash
git -C ../stejar pull && npm run build:css && npm run stamp
git commit -am "Sync design system $(git -C ../stejar rev-parse --short HEAD)"
```

## Review & "approval"

- Open a PR in `prototypes-v5`. `pr-preview.yml` deploys a live preview to
  `https://<owner>.github.io/prototypes-v5/pr-preview/pr-<N>/` and comments the link.
- Technical reviewers comment on the diff / preview. There is **no strict approval
  count** — the team merges when the plan is ready to implement. Merge = "approved &
  published" to the canonical site. Optionally tag/label the PR `approved`.

## Out of scope / known limits

- Static only — no real backend, Turbo/Stimulus behavior, or real data.
- The site is public (GitHub Pages from a public repo). Use mock data only.
- Non-technical feedback/approval is not wired in phase 1 (reviewers are technical).

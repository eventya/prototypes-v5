# prototypes-v5

Static design prototypes for Eventya — an **implementation plan** (`PLAN.md`) plus
**HTML design screens**, styled with the **real Stejar design system**. Decoupled
from the `stejar`/`eventya` release train: change a screen → open a PR here → get a
live preview link → the team reviews and merges when the plan is ready to build.

## Quick start (local)

Requires the `stejar` repo checked out as a sibling directory:

```
projects/eventya/
├── stejar/          # design-system source (read at build time)
└── prototypes-v5/   # you are here
```

```bash
npm install
npm run dev          # builds CSS (watch) + serves on http://localhost:4000
```

Open e.g. http://localhost:4000/prototypes/sla-system/ — the set landing page
renders `PLAN.md` and links each screen. Edit any `.html`, save, refresh.

## How the design system stays in sync

`build/prototypes.css` imports the **real** `stejar/.../application.css` and adds
our screens as Tailwind content sources, so every class you use compiles and tokens
match production. `npm run build:css` regenerates `assets/application.css`
(committed). To pull newer Stejar design changes:

```bash
git -C ../stejar pull && npm run build:css && npm run stamp
git commit -am "Sync design system"
```

## Where do PRs go?

**Here, in `prototypes-v5`.** Never in `stejar` for a prototype tweak.
Touch `stejar` only when the design system itself changes (then rebuild the CSS),
and `stejar`/`eventya` only when you implement the approved plan for real.

## Creating a new prototype

See `.claude/skills/create-prototype/SKILL.md` (loaded automatically by Claude Code
in this repo) or copy `_template.html` into a new `prototypes/<feature>/` folder.

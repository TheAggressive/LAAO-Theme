# CLAUDE.md — LAAO Theme

Guidance for AI assistants working in the LAArtsOnline.com WordPress theme.
Adapted from the sibling Aggressive Apparel theme; where the two differ this
file is authoritative for LAAO — no WooCommerce, no navigation block system,
and a smaller block set.

## Overview

**LAAO** is a WordPress Full Site Editing block theme for an arts and culture
publication. Service-container architecture, custom Gutenberg blocks with
Interactivity API support, and a CI pipeline that runs the same commands
locally as it does on GitHub.

Version, WP/PHP floors and the pinned Node/pnpm toolchain live in `style.css`
and `package.json` — semantic-release owns the version, never hardcode it, and
`pnpm ci:doctor` enforces the toolchain. **No Tailwind** (see "Styling").

## Quick commands

```bash
pnpm install
pnpm build              # all three webpack configs
pnpm start              # watch mode
pnpm env:start          # wp-env on :9950 (phpMyAdmin :9952)
pnpm ci:verify          # the whole pipeline, exactly as CI runs it
pnpm cli <wp args>      # WP-CLI inside wp-env
```

Individual suites: `test:php`, `test:js`, `test:e2e`, `analyse:php`,
`lint:php:fix`. `package.json` is the source of truth for the rest.

`pnpm ci:verify` is the contract: every GitHub job maps 1:1 onto a `pnpm ci:*`
script, so "green locally" and "green in CI" mean the same thing. Run it before
proposing a change is finished.

## Architecture

### Directory structure

`ls` gives you the layout. The parts it does not tell you:

- `inc/` autoloads `LAAO\*` → `inc/class-*.php`; `inc/helpers.php` holds plain
  functions for block render callbacks.
- `src/blocks/` is static + dynamic blocks, `src/blocks-interactivity/` is the
  Interactivity API set, `src/styles/base/_tokens.css` is the semantic layer.
- `tests/php/Unit/` mocks WordPress (Brain\Monkey); `tests/e2e/` is Playwright.

### PHP

`functions.php` loads `inc/helpers.php`, then the autoloader, then
`LAAO\Bootstrap::get_instance()`. Bootstrap registers every service into
`Service_Container` and calls `init()` in a fixed order. Add a service in both
places — registration alone does nothing.

The autoloader maps `LAAO\Core\Theme_Updates` → `inc/Core/class-theme-updates.php`
(WordPress file naming). Composer uses a **classmap**, not PSR-4 — PSR-4 cannot
express that convention and silently resolved nothing when it was configured.

The theme ships without `vendor/`, so `LAAO\Autoloader` is what runs in
production. Tests exercise it rather than Composer's autoloader so the two
cannot drift.

### Blocks

Three build configs, three block types: static (`src/blocks/*`, `save.js` writes
markup), dynamic (`src/blocks/*`, `render.php`), and interactive
(`src/blocks-interactivity/*`, `view.js` + Interactivity API).

**Blocks are registered from `dist/`, not `src/`.** Editing a `render.php` in
`src/` changes nothing until you rebuild. This costs time repeatedly if you
forget it.

## Styling

**There is no Tailwind.** It was removed by converting 307 `@apply`
declarations into plain CSS. Do not reintroduce `@apply`, `tailwind.config.js`,
or utility classes in markup.

- `src/styles/_reset.css` is Tailwind Preflight, extracted verbatim and now
  ordinary source. It is stylelint-ignored as vendored output.
- `src/styles/base/_tokens.css` holds semantic tokens (`--laao-color-surface`,
  `--laao-radius-panel`, `--laao-z-modal`, …). Components ask for a role, not a
  literal. Colours resolve through the palette so `theme.json` stays the single
  source of truth.
- Nesting is handled by `postcss-nesting` **and** `postcss-preset-env`. Both are
  intentional: disabling preset-env's `nesting-rules` dropped `:hover` rules and
  flattened media queries into their parents.

### Colour

`theme.json` `settings.custom.color` holds oklch values; `settings.color.palette`
references them with `var(--wp--custom--color--*)`.

That indirection is load-bearing. WordPress 7.0 bundles colord 2.9.3, which
**cannot parse oklch** — a palette declared in bare `oklch()` makes every colour
normalise to `#000000`, and the editor labels every swatch with the first
colour's name. `isSimpleCSSColor()` skips colord for any value containing
`var()`, which is why the tokens work. `src/__tests__/palette-editor-labels.test.js`
guards it.

Templates must reference tokens, never cached literals —
`bin/ci/check-template-colors.sh` enforces this. WordPress caches a resolved
colour beside the slug when a block is saved; those snapshots drift silently and
once left article pages rendering a different brand red from the front page.

## Testing

PHP unit runs on PHPUnit 13 + Brain\Monkey — **WordPress is not loaded**,
functions are stubbed. JS unit is Jest via wp-scripts. E2E is Playwright
(smoke, palette, accessibility).

PHPUnit 13 removed annotation data providers — use `#[DataProvider]`.

There is no WordPress integration suite. The E2E layer covers real WordPress
instead; adding one would mean downgrading to PHPUnit 9 for `WP_UnitTestCase`.

E2E defaults to wp-env but honours `WP_BASE_URL`:

```bash
WP_BASE_URL=http://laartsonline.local npx playwright test
```

Test against **both**. wp-env is clean and reproducible; the LocalWP site has
real content, plugins, and database-stored templates that behave differently.

### Writing tests that mean something

Prove a test fails when the behaviour breaks. Mutate the implementation, watch
it go red, revert. Several tests in this repo passed for the wrong reason until
that was done — a contrast assertion measured styles before they settled, and an
undefined-colour check compared against a string the probe never emitted.

## Gates

`pnpm ci:frontend` runs, beyond the obvious linters:

file length (warn 800, fail 1000, no allowlist), GitHub Actions pinned to major
tags, no hard-coded palette literals in templates, and the dependabot auto-merge
guard. Every one exists because the thing it checks actually drifted.

## Release

semantic-release on `master`. `bin/release/package.sh` builds the zip and a
SHA-256 sidecar; `verify-package.sh` asserts the archive is installable before
publishing.

The updater (`Core\Theme_Updates` + collaborators) verifies that checksum before
WordPress unpacks anything and refuses an update whose checksum cannot be
resolved. Every URL passes an allow-list (HTTPS, GitHub hosts, port 443, no
credentials, no `..`) — including URLs read back out of a transient.

Commit types drive the version: `feat` minor, `fix`/`perf` patch,
`chore`/`ci`/`docs`/`refactor`/`test`/`style` no release.

## Gotchas that cost real time

- **Blocks load from `dist/`.** Rebuild after touching `src/**/render.php`.
- **Site Editor overrides shadow theme files.** `parts/footer.html` and
  `templates/front-page.html` are stored in the database on production; edits to
  those files never reach the live site. See `docs/site-editor-overrides.md`.
- **`pnpm install` ignores `pnpm-workspace.yaml` edits.** It reports "Already up
  to date" and exits on a cached workspace state — even with `--force` and no
  lockfile. Delete `node_modules/.pnpm-workspace-state-v1.json`.
- **`wp_kses_post()` strips image attributes.** On WP 7.0.2 it removes `srcset`,
  `sizes`, `fetchpriority` and `decoding`. Never run it over
  `wp_get_attachment_image()` output — that markup is already escaped.
- **Overrides live in `pnpm-workspace.yaml`,** not `package.json`. With a
  workspace file present pnpm 10+ silently ignores `pnpm.overrides`.
- **The front-page modal opens on load** by configuration (`openOnLoad: true`),
  which is why the first Tab lands inside it. Not a bug — see
  `docs/known-issues.md`.
- **A theme's own `.mo` files are named `<locale>.mo`,** not
  `<domain>-<locale>.mo`. `_load_textdomain_just_in_time()` uses the prefixed
  form only for paths outside the theme. Worse, since WP 6.7
  `load_theme_textdomain()` merely registers the path and returns `true`
  unconditionally, so a wrong filename looks like success and the site quietly
  renders English. `bin/i18n/compile.sh` renames what `wp i18n make-mo`
  produces. Verify translations by asserting on `__()` output, never on that
  return value.
- **Force-pushing `master` is blocked** by an active ruleset with no bypass.
  That is deliberate; see `.github/rulesets/README.md` for the incident that
  caused it.

## Working style

- Verify claims against the codebase before asserting them. Several confident
  diagnoses in this repo's history were wrong until measured.
- When a gate surfaces a defect, fix the defect or document it honestly —
  do not weaken the gate.
- Comments explain **why**, not what. The repo is consistent about this.
- Prefer small, reviewable commits with conventional types; the CHANGELOG is
  generated from them.
- Be concise. Answer at the altitude asked; skip preamble and recap.
- Route mechanical work — bulk rename, reformat, summarise, scrape, collate —
  to a Haiku sub-agent. It is the same result at a fraction of the rate.
- Never propose `/compact` as a cost saving. It re-sends the whole window to
  build the summary, then keeps paying for the summary. `/clear` between
  unrelated jobs is the thing that actually reduces the bill.

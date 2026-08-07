---
name: verify
description: Build, launch, and drive this theme's blocks in the running wp-env WordPress site to verify changes end-to-end.
---

# Verifying theme changes at runtime

## Environment

- wp-env serves the site at the port in `.wp-env.json` (currently
  `http://localhost:9950`; phpMyAdmin on 9952). Never hardcode it — read it,
  or use `bin/ci/wp-env-url.mjs`, which is what the Playwright config and the
  palette baseline generator both do.
- Check it is up: `curl -s -o /dev/null -w "%{http_code}" "$(node -e "import('./bin/ci/wp-env-url.mjs').then(m=>console.log(m.wpEnvUrl()))")"`.
  Start with `pnpm env:start`.
- Admin: `admin` / `password` at `/wp-login.php`.
- WP-CLI: `pnpm cli <wp args>`. The theme is mounted at
  `/var/www/html/wp-content/themes/laao` — the path is pinned by a `mappings`
  entry, because `themes: ["."]` mounts under the checkout directory's name and
  CI checks out as `LAAO-Theme`.

## Two environments, both worth using

| | wp-env (`:9950`) | LocalWP (`laartsonline.local`) |
| --- | --- | --- |
| Content | empty | real articles, ads, plugins |
| Templates | from theme files | **some stored in the database** |
| Use for | reproducible gates, CI parity | how it actually behaves |

Playwright honours `WP_BASE_URL`:

```bash
WP_BASE_URL=http://laartsonline.local npx playwright test
```

A change that works on one and not the other is usually explained by the table
above — check `docs/site-editor-overrides.md` before assuming the code is wrong.

## Browser

Playwright runs natively here; `npx playwright test` works with no special
setup. If a script needs its own browser instance, note that `@axe-core/playwright`
requires a context rather than a bare page:

```js
const browser = await chromium.launch();
const context = await browser.newContext();   // required by AxeBuilder
const page = await context.newPage();
```

Run one-off scripts **from the project root** so Node resolves `@playwright/test`
from `node_modules`; a script in a scratchpad directory will not find it.

## Driving gotchas

- **Rebuild after touching `render.php`.** Blocks register from `dist/`, not
  `src/`. `pnpm build:blocks` / `pnpm build:interactivity` copy them across.
  This is the single most common reason a change "does nothing".
- **Flush after template or theme.json edits:** `pnpm cli cache flush`.
- **Wait for `networkidle` before measuring styles.** axe computes contrast from
  resolved styles; measuring earlier reports colours no user ever sees. It also
  stabilises tab-order probes against late-loading embeds.
- The block editor never reaches `networkidle` (heartbeat) — wait for
  `iframe[name="editor-canvas"]` instead.
- Clicking a container block in the canvas selects its inner block. Select
  wrappers through the data API:
  `wp.data.dispatch('core/block-editor').selectBlock(clientId)`.
- A fatal in a block render surfaces as WordPress's generic error page, not a
  stack trace — `WP_DEBUG_DISPLAY` is off. Read the real error with:
  `pnpm cli sh -c "grep 'PHP Fatal' /var/www/html/wp-content/debug.log | tail -1"`

## Proving a change works

Prefer a measurement over an inspection.

- **CSS refactors:** capture `dist/**/*.css` before, compare declaration sets
  per selector after. Ordering and `:is()` wrapping differ harmlessly; a missing
  declaration does not. This caught three silently dropped styles during the
  Tailwind removal.
- **Colour changes:** `pnpm palette:baseline` records browser-rasterised rgb per
  palette slug. Regenerate only when a change is intended — the diff is the
  evidence.
- **Accessibility:** `npx playwright test accessibility`. Confirm a new
  assertion actually bites by injecting a violation and watching it fail.
- **Anything security-shaped:** mutate the implementation so the protection is
  disabled and confirm the test goes red. A test that passes both ways is
  describing code, not verifying it.

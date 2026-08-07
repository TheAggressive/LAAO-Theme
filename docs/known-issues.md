# Known issues

Defects that are understood, reproducible, and deliberately not fixed yet.
Recorded here so they are not rediscovered from scratch, and so a test that
declines to assert something says why.

## The front-page modal opens automatically on load

**Not a defect — configured behaviour.** `templates/front-page.html` sets
`"openOnLoad":true` on its modal, so the newsletter popup opens by itself.

Recorded because it looks like a bug from the outside, and was twice
misdiagnosed as one during the Tailwind removal: the first Tab lands inside the
modal rather than on the skip link, which reads as a stray focus trap until you
find the attribute.

**It is still worth revisiting.** An auto-opening modal takes keyboard focus and
interrupts screen-reader users before they reach any content, and WCAG 2.2's
guidance on change-of-context applies. Options, in ascending order of effort:
delay it until after a scroll or exit-intent trigger (the ported block supports
both via `scrollDepthTrigger` and `exitIntentTrigger`), set `openOnLoadOnce` so
it appears once per visitor rather than every page view, or drop the automatic
open entirely.

That is a product decision about how the newsletter is promoted, not a bug fix,
which is why it is here rather than in a pull request.

**Why the accessibility suite does not assert first-Tab focus:**
`tests/e2e/accessibility.spec.ts` checks a skip link exists and is focusable but
stops short of asserting it receives the first Tab, which would fail purely
because of this setting.

## Two templates are shadowed by database copies

See `docs/site-editor-overrides.md`. `parts/footer.html` and
`templates/front-page.html` are stored in the database, so fixes committed to
those files do not reach the production site.

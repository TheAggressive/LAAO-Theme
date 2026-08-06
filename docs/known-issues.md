# Known issues

Defects that are understood, reproducible, and deliberately not fixed yet.
Recorded here so they are not rediscovered from scratch, and so a test that
declines to assert something says why.

## Closed modals stay in the keyboard tab order

**Impact:** a keyboard user pressing Tab on the home page reaches the newsletter
form inside a _closed_ modal before reaching any page content. The skip link,
which is correctly first in the DOM and focusable, is effectively unreachable.

**Observed tab order on a clean install:**

```
Tab 1 -> input.required            (newsletter email, inside the closed modal)
Tab 2 -> input.button              (newsletter submit)
Tab 3 -> button.wp-block-laao-modal-close
```

**Cause:** `laao/modal` renders its content inline and marks it
`aria-hidden="true"`, but nothing removes it from the tab order. `aria-hidden`
hides an element from assistive technology; it does not make it unfocusable, and
focusing an `aria-hidden` element is its own conformance failure.

**Not a styling problem.** Confirmed during the Tailwind removal: modal CSS was
byte-identical before and after, so this predates that work.

**Likely fix:** apply `inert` to the modal content while closed, which removes it
from both the tab order and the accessibility tree in one attribute, and drop the
now-redundant `aria-hidden`. Needs testing against the block's focus-trap logic,
which currently manages focus itself.

**Why the accessibility suite does not assert it:** `tests/e2e/accessibility.spec.ts`
asserts a skip link exists and is focusable, but deliberately stops short of
asserting it receives the first Tab. Asserting that would fail for this reason,
turning a styling gate red for an unrelated behavioural defect.

## Two templates are shadowed by database copies

See `docs/site-editor-overrides.md`. `parts/footer.html` and
`templates/front-page.html` are stored in the database, so fixes committed to
those files do not reach the production site.

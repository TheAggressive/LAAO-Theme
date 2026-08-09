# Performance

Two halves, because performance splits cleanly into what a machine can check
deterministically and what it cannot.

|                                      | What                                             | When                               |
| ------------------------------------ | ------------------------------------------------ | ---------------------------------- |
| `node bin/ci/check-asset-budget.mjs` | gzipped weight of the assets the theme ships     | every pull request, via `ci:build` |
| `pnpm perf`                          | LCP, CLS, TBT, resource counts in a real browser | on demand                          |

## The asset budget

Runs in the **build** lane, not the frontend one, because it measures build
output and the frontend job never builds.

Budgets live in `bin/ci/asset-budget.json`, so raising one is a reviewable diff
with a number in it rather than a threshold buried in a script. They are set
roughly 15% above what the theme ships today.

Measured in **gzipped** bytes: that is what crosses the wire, and raw size would
let a change that compresses badly pass while the page got slower.

Only front-end assets are budgeted. Editor bundles are large, irrelevant to a
reader, and would drown the signal.

```
dist/styles/app.css                  8600 B /  10240 B   84%
dist/scripts/gsap.js                44229 B /  47104 B   94%
dist/scripts/smoothscroll.js         5313 B /   6656 B   80%
block front-end assets (18 files)   16443 B /  19456 B   85%
```

**GSAP is the number to watch.** At 44KB gzipped it is over half of everything
the theme ships, it loads on every page, and it sits at 94% of its budget. The
next thing that pushes it over should prompt the question of whether it can be
loaded only on the pages that animate, rather than a bigger budget.

## `pnpm perf`

```bash
pnpm perf                                    # 3 runs, median, thresholds enforced
pnpm perf:report                             # 1 run, nothing enforced, full report
WP_BASE_URL=http://laartsonline.local pnpm perf:report
```

Not a CI gate, deliberately. Lighthouse numbers move with the machine that
measured them, so failing a pull request on them means failing pull requests for
reasons the author cannot reproduce. Thresholds are Google's "needs improvement"
boundaries — a floor that catches regressions, not a target.

Chrome comes from the browser Playwright already installed for the E2E suite, so
anyone who can run `pnpm test:e2e` can run this.

## Measure the real site, not wp-env

This matters more here than anywhere else in the toolchain:

|                   | wp-env            | laartsonline.local        |
| ----------------- | ----------------- | ------------------------- |
| performance score | 100               | 89                        |
| LCP               | 0.7 s             | 2.0 s                     |
| total transfer    | 420 KB            | 2097 KB                   |
| images            | 54 KB (1 request) | **1712 KB (18 requests)** |
| scripts           | 96 KB             | 101 KB                    |

wp-env has no content, no ads and no plugins, and reports a perfect score that
means nothing. The real page is 2.9MB, and **images are 87% of it**.

The theme's own scripts and styles are ~120KB and barely move between the two.
Nothing in `asset-budget.json` would have caught the thing that actually costs
this site two seconds, which is why both halves exist.

### What was fixed

The hero block rendered each slide as a CSS `background-image` pointing at the
full-size original. A background cannot carry `srcset`, so every visitor
downloaded the largest file — a phone rendering the hero 400px wide still
pulled the 1920px image — and it could be neither lazy-loaded nor prioritised.

The slides are now real `<img>` elements with `object-fit: cover`, which
reproduces the previous framing while letting the browser choose a source:

| hero images     | before  | after  |
| --------------- | ------- | ------ |
| mobile, 390px   | 1307 KB | 149 KB |
| desktop, 1440px | 1307 KB | 536 KB |

On the live front page that moved the score from 83 to 89 and LCP from 2.7 s to
2.0 s — inside Google's "good" threshold rather than outside it.

### What is left, and is not the theme's to fix

The images are ad creatives and editorial photography, uploaded at full size.
That is the largest single performance win available on this site, and it is a
content and plugin question rather than a theme one — see
`docs/known-issues.md`.

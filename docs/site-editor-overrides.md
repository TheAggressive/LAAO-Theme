# Site Editor overrides

Some templates and template parts on the production site are stored in the
database, not loaded from this repository. Editing the theme file has **no
effect** on those.

This is a deliberate, accepted split — not a bug to fix — but it has to be
understood before doing template work, because a change can pass every check
here and still never reach a visitor.

## How it happens

Editing a template in Appearance → Editor saves a `wp_template` or
`wp_template_part` post. WordPress then loads that copy and ignores the theme
file entirely, for that template only. Other templates keep loading from disk.

## Confirmed overridden

| File                        | Status             | Evidence                                                                                                       |
| --------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `parts/footer.html`         | overridden         | theme file emits `has-laao-gray-on-dark-color`; the site renders `has-laao-gray-color`                         |
| `templates/front-page.html` | overridden         | theme file references `var(--wp--custom--color--red)`; the site renders the old `hsl(0, 72.2%, 50.6%)` literal |
| `templates/single.html`     | **not** overridden | the same edit applied immediately                                                                              |

Ruled out as causes: caching (a cache-busting query string changes nothing) and
build staleness (blocks load from `dist/`, which was rebuilt).

## This is now visible on the front end

Since the modal was ported, the stale database copies render **two close
buttons**: the old one saved into the block's markup, plus the one the new
render.php emits. The same copies also carry `openOnLoad: true`, so the
newsletter modal still opens immediately even though the theme file switched to
scroll-depth and exit-intent triggers.

Confirmed by comparing the same page in both environments:

|                       | old close button | new close button | openOnLoad |
| --------------------- | ---------------- | ---------------- | ---------- |
| wp-env (theme files)  | 0                | 1 per modal      | `false`    |
| production (database) | 1 per modal      | 1 per modal      | `true`     |

Nothing in this repository can fix that. The markup and the attributes both live
in the database copy, so the theme file is not consulted.

## Consequences

Two fixes in this repository do not apply to the live site:

- the footer copyright contrast fix (`laao-gray` 4.34:1 on black, below the
  4.5:1 AA minimum)
- the front-page colour-drift fix

Both remain correct for a fresh install and are enforced by
`bin/ci/check-template-colors.sh`, so the repository stays internally
consistent.

## Checking before you start

A template showing "Customized" in the Site Editor is database-backed. To
compare a part against its theme file without touching production, render the
same page on wp-env — which always loads from disk — and diff the output:

```bash
curl -s http://localhost:9950 | grep -oE 'has-laao-[a-z-]+-color' | sort -u > /tmp/theme.txt
curl -s "https://example.com/?cb=$RANDOM" | grep -oE 'has-laao-[a-z-]+-color' | sort -u > /tmp/live.txt
diff /tmp/theme.txt /tmp/live.txt
```

That is how the table above was established: the footer's database copy proved
identical to the theme file apart from the one un-applied fix.

## Undoing an override

Site Editor → the template or part → **Clear customizations**. The theme file
takes over again, and anything that existed only in the database is discarded —
so diff first.

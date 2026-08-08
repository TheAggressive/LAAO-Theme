# Translations

The theme's translatable strings and the tooling that keeps them honest.

## What is in here

| File                   | Committed | What it is                                     |
| ---------------------- | --------- | ---------------------------------------------- |
| `laao.pot`             | yes       | Extracted source strings — the template        |
| `laao-<locale>.po`     | yes       | A locale's translations, edited by a person    |
| `<locale>.mo`          | **no**    | Compiled binary catalog, read by PHP gettext   |
| `laao-<locale>-*.json` | **no**    | Jed catalogs, read by editor and block scripts |

The two generated formats are gitignored. They are build output, and committing
them means reviewing a binary diff and eventually shipping one that no longer
matches its source. `bin/release/verify-package.sh` asserts every `.po` has a
matching `.mo` in the archive, so a release cannot skip the compile step.

### The `.mo` file drops the domain prefix, and that is not a typo

`wp i18n make-mo` names its output after the `.po`, producing `laao-es_ES.mo`.
That is the convention for `wp-content/languages/themes/`, and it is the wrong
one for a catalog shipped inside the theme. `compile.sh` renames it.

`_load_textdomain_just_in_time()` branches on where the registered path points:

```php
if ( str_starts_with( $path, $template_directory ) || str_starts_with( $path, $stylesheet_directory ) ) {
    $mofile = "{$path}{$locale}.mo";            // es_ES.mo
} else {
    $mofile = "{$path}{$domain}-{$locale}.mo";  // laao-es_ES.mo
}
```

A theme shipping its own catalogs is always the first branch, so a
domain-prefixed file is never opened. Nothing reports this: since WordPress
6.7 `load_theme_textdomain()` only registers the path and returns `true`
unconditionally, so the call looks like it succeeded and the site renders
English. It was caught here by translating one string and asserting on the
output rather than trusting the return value.

The JSON catalogs **do** keep the prefix — `_load_script_textdomain_from_src()`
builds `{$domain}-{$locale}-{$md5}.json` with no equivalent path special case.

## Commands

```bash
pnpm i18n:pot                  # re-extract strings into laao.pot
pnpm i18n:locale -- es_ES      # scaffold a new locale from the POT
pnpm i18n:sync                 # merge POT changes into every .po
pnpm i18n:compile              # .po → .mo + Jed JSON
pnpm i18n:status               # per-locale coverage
pnpm i18n:check                # the gate: drift, comments, catalog validity
pnpm i18n                      # pot → sync → compile → status
```

## The usual loop

After changing any user-facing string:

```bash
pnpm i18n:pot
git add languages/laao.pot
```

`pnpm ci:i18n` fails if you forget. It regenerates the POT and diffs it against
the committed one, so a new string that never reached the template is caught in
CI rather than discovered by a translator.

## Adding a locale

```bash
pnpm i18n:locale -- es_ES      # creates languages/laao-es_ES.po
# translate it
pnpm i18n:sync && pnpm i18n:compile
```

There are no locales yet. The pipeline is in place so adding one is a
translation task rather than an infrastructure task.

## Both halves have to be wired up

A string only reaches a reader if two things are true, and each has its own
failure mode:

- **PHP** needs `load_theme_textdomain()`, which runs in
  `LAAO\Core\Theme_Support::register()`. Just-in-time loading resolves a theme
  domain against `WP_LANG_DIR`, not against the theme, so without that call the
  catalogs shipped in the release archive are never consulted.
- **Scripts** need `wp_set_script_translations()`. Blocks registered from
  `block.json` get it automatically from their `textdomain` field — all 13 of
  ours declare it. The eight editor sidebar panels in
  `LAAO\Assets\Scripts::register_block_plugins()` are registered by hand and get
  it explicitly there.

Both were missing until the pipeline was added: 253 strings were marked
translatable and not one of them could be translated.

## Normalized headers

The drift check compares content, not timestamps. `laao_i18n_normalize_pot()`
in `bin/i18n/lib.sh` flattens `POT-Creation-Date`, `PO-Revision-Date`,
`X-Generator`, `Report-Msgid-Bugs-To` and `Project-Id-Version` before diffing.

`Project-Id-Version` is there for a specific reason: it carries the theme
version, which semantic-release bumps on every release without regenerating the
POT. Left alone, the header lags one version behind and reports drift on the
next unrelated push.

## Why catalog validation runs on the host

`pnpm ci:i18n` runs POT extraction inside the wp-env container and catalog
validation outside it. Extraction needs WP-CLI's `i18n` command, which lives in
the container; validation needs `msgfmt`, which the Alpine image does not ship.

Running both inside is how the sibling theme's gate silently validated nothing:
`wp i18n make-mo` accepts an unterminated `msgid` and a placeholder mismatch
alike, prints `Success`, and exits 0. A missing `msgfmt` is therefore a hard
failure here, never a quiet skip — a catalog whose format specifiers disagree
with its `msgid` is a fatal error at render time.

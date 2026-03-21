# LAAO Block Theme

Official WordPress block theme for [LAArtsOnline.com](https://laartsonline.com), built by [The Aggressive, LLC](https://theaggressive.com).

## Requirements

| Dependency | Version |
|---|---|
| WordPress | 6.8+ |
| PHP | 8.0+ |
| Node.js | 20+ (LTS recommended) |
| pnpm | 9+ |
| Composer | 2+ |

## Getting Started

```bash
# Install JS dependencies
pnpm install

# Install PHP dependencies
composer install

# Build everything for production
pnpm build

# Start dev watcher (all targets)
pnpm start
```

## Project Structure

```
inc/                          PHP classes (PSR-4 autoloaded under LAAO\)
  Assets/
    class-scripts.php         Script enqueuing, defer logic
    class-styles.php          Style enqueuing
  Core/
    class-block-types.php     Custom block type registration
    class-post-meta.php       Post meta registration
    class-post-types.php      Custom post type registration
    class-theme-support.php   Theme feature declarations
    class-theme-updates.php   Auto-update via GitHub releases
  Editorial/
    class-highlight-columns.php  Admin columns for highlight date ranges
  class-autoloader.php        PSR-4 style autoloader for inc/
  class-bootstrap.php         Theme bootstrap / hook registration
  class-service-container.php Lightweight dependency container

src/
  assets/                     Fonts, images, global scripts
  blocks/                     Static and dynamic Gutenberg blocks
  blocks-interactivity/       WordPress Interactivity API blocks
  block-variations/           Core block variations
  components/                 Shared JS components
  patterns/                   Block patterns
  scripts/                    Global JS entry points
  styles/                     PostCSS + Tailwind stylesheets
  utils/                      Shared JS utilities

parts/                        FSE template parts (header, footer)
templates/                    FSE page templates
patterns/                     PHP/HTML block patterns
dist/                         Compiled output (not committed)
tests/php/Unit/               PHPUnit unit tests
```

## Blocks

### Standard Blocks (`src/blocks/`)

| Block | Description |
|---|---|
| `article-credits` | Byline / credits for articles |
| `block-binding-image` | Image with block binding support |
| `copyright-date-block` | Dynamic copyright year |
| `highlight-posts` | Posts within editorial highlight date ranges |
| `laao-post-featured-image` | Enhanced featured image |
| `logo` | Site logo |
| `query-loop-ad-inserter` | Injects ads at a configured interval in query loops |
| `whats-hot` | Trending / featured posts |

### Interactivity API Blocks (`src/blocks-interactivity/`)

| Block | Description |
|---|---|
| `animate-on-scroll` | GSAP-powered scroll animations with configurable direction, duration, and stagger |
| `event-gallery` | Interactive event image gallery |
| `hero` | Hero section with interactive states |
| `mobile-nav` | Mobile navigation with open/close state |
| `modal` | Accessible modal dialog |

## Scripts

```bash
# Development
pnpm start                    # Watch all targets concurrently
pnpm start:blocks             # Watch standard blocks only
pnpm start:interactivity      # Watch interactivity blocks only
pnpm start:assets             # Watch fonts, global scripts, styles

# Production build
pnpm build                    # Build all targets concurrently
pnpm build:blocks
pnpm build:interactivity
pnpm build:assets

# Testing
pnpm test                     # Run PHP + JS tests concurrently
pnpm test:php                 # PHPUnit
pnpm test:js                  # Jest
pnpm test:js:watch            # Jest in watch mode

# Linting & formatting
pnpm lint:js                  # ESLint
pnpm lint:css                 # Stylelint
pnpm format                   # Prettier

# Scaffolding
pnpm create-block             # New static block
pnpm create-block-dynamic     # New PHP render block
pnpm create-block-interactive # New Interactivity API block
```

## Code Quality

Pre-commit hooks (via Husky) run automatically on every commit:

1. `pnpm lint:js` — ESLint
2. `pnpm lint:css` — Stylelint
3. `pnpm test:php` — PHPUnit
4. `pnpm test:js` — Jest

Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) spec (`feat:`, `fix:`, `chore:`, etc.), enforced by `commitlint`. Releases and the [CHANGELOG](./CHANGELOG.md) are generated automatically by `semantic-release` on merge to `master`.

## Tech Stack

| Layer | Technology |
|---|---|
| CMS | WordPress 6.8 (Full Site Editing) |
| Interactivity | WordPress Interactivity API |
| Animations | GSAP |
| Smooth scroll | Lenis |
| CSS | PostCSS + Tailwind CSS |
| PostCSS plugins | nesting, mixins, custom-properties, simple-vars, preset-env |
| JS bundler | @wordpress/scripts (webpack) |
| PHP tests | PHPUnit 13 + Brain Monkey |
| JS tests | Jest (via wp-scripts) |
| Git hooks | Husky + commitlint |
| Releases | semantic-release |

## License

GPL-2.0-or-later

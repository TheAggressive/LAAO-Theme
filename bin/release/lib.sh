#!/usr/bin/env bash
# Shared helpers for the release scripts. Sourced, not executed.

THEME_SLUG="laao"

# Repository root, regardless of where the caller invoked us from.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Everything the shipped theme does NOT need. This is the single source of
# truth for package contents — the release workflow and verify-package.sh both
# read it, so the zip cannot drift from what we claim to ship.
#
# Rule of thumb: if it is only used to BUILD or TEST the theme, exclude it.
# WordPress runs dist/, not src/.
readonly PACKAGE_EXCLUDES=(
	'.editorconfig'
	'.eslintrc'
	'.git'
	'.github'
	'.husky'
	'.node-version'
	'.phpunit.result.cache'
	'.prettierrc.js'
	'.releaserc.json'
	'.stylelintignore'
	'.stylelintrc.json'
	'.vscode'
	'.wp-env.json'
	'.claude'
	'.cursorrules'
	'.prettierignore'
	'bin'
	# Release artifacts from a previous run. Without these, rsync copies the
	# last zip into the staging directory and the new archive ends up
	# containing the old one.
	'*.zip'
	'*.zip.sha256'
	'commitlint.config.js'
	'composer.json'
	'composer.lock'
	'coverage'
	'eslint.config.mjs'
	'jest.config.js'
	'node_modules'
	'package.json'
	'phpcs.xml.dist'
	'phpstan.neon'
	'phpunit.xml'
	'playwright.config.ts'
	'pnpm-lock.yaml'
	'pnpm-workspace.yaml'
	'postcss.config.js'
	'src'
	'tailwind.config.js'
	'tests'
	'tsconfig.json'
	'vendor'
	'webpack.assets.config.mjs'
	'webpack.config.mjs'
)

# Files that MUST exist in the built package. If one of these is missing the
# theme is broken in a way that is invisible until a user activates it.
readonly PACKAGE_REQUIRED=(
	'style.css'
	'functions.php'
	'theme.json'
	'index.php'
	'inc/class-autoloader.php'
	'inc/class-bootstrap.php'
	'dist/styles/app.css'
	'dist/scripts/app.js'
)

# Emits the rsync --exclude flags for PACKAGE_EXCLUDES.
rsync_exclude_args() {
	local item
	for item in "${PACKAGE_EXCLUDES[@]}"; do
		printf -- '--exclude=%s\n' "$item"
	done
}

log() {
	printf '  %s\n' "$*"
}

die() {
	printf 'ERROR: %s\n' "$*" >&2
	exit 1
}

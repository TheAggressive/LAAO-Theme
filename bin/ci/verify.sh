#!/usr/bin/env bash
# Full local rehearsal of the CI contract.
#
# GitHub runs these lanes in parallel; this runs them serially in dependency
# order so a failure locally is the same failure CI would report. Run it before
# cutting a release, or whenever a change touches the build or tooling.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

echo "==> Toolchain"
pnpm ci:doctor

echo "==> Dependencies"
pnpm install --frozen-lockfile

echo "==> Frontend (lint, format, types, file length, unit tests)"
pnpm ci:frontend

echo "==> PHP (phpcs, phpstan, phpunit)"
pnpm ci:php

echo "==> Build"
pnpm ci:build

echo "==> End-to-end"
WP_URL="${WP_BASE_URL:-$(node -e "import('./bin/ci/wp-env-url.mjs').then(m=>console.log(m.wpEnvUrl()))")}"
if ! curl -sfo /dev/null "${WP_URL}"; then
	echo "  wp-env is not responding — starting it."
	pnpm env:start
fi
pnpm ci:e2e

echo "==> Package"
pnpm ci:package

echo ""
echo "Full local CI verification passed."

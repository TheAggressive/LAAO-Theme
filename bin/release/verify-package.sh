#!/usr/bin/env bash
# Verifies the built zip is installable before it is attached to a release.
#
# Checks performed against the actual archive (not the staging directory), so
# what is asserted is exactly what a user will download:
#   1. the checksum sidecar matches the zip
#   2. there is exactly one top-level directory, named for the theme slug
#   3. style.css declares the expected version
#   4. no excluded path leaked in
#
# Usage: bin/release/verify-package.sh [version]
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
cd "$REPO_ROOT"

VERSION="${1:-$(node -p "require('./package.json').version")}"
ZIP_NAME="${THEME_SLUG}-${VERSION}.zip"

echo "Verifying ${ZIP_NAME}..."

[[ -f "$ZIP_NAME" ]] || die "${ZIP_NAME} not found — run bin/release/package.sh"
[[ -f "${ZIP_NAME}.sha256" ]] || die "${ZIP_NAME}.sha256 not found"

sha256sum -c "${ZIP_NAME}.sha256" >/dev/null || die "checksum mismatch for ${ZIP_NAME}"
log "checksum verified"

ROOT_ENTRIES="$(unzip -Z1 "$ZIP_NAME" | cut -d/ -f1 | sort -u)"
[[ "$ROOT_ENTRIES" == "$THEME_SLUG" ]] \
	|| die "expected a single top-level '${THEME_SLUG}/' directory, found: ${ROOT_ENTRIES}"
log "single top-level directory: ${THEME_SLUG}/"

EXTRACTED="$(mktemp -d)"
trap 'rm -rf "$EXTRACTED"' EXIT
unzip -q "$ZIP_NAME" -d "$EXTRACTED"

PACKAGED_VERSION="$(grep -oP '^Version:\s*\K\S+' "${EXTRACTED}/${THEME_SLUG}/style.css")"
[[ "$PACKAGED_VERSION" == "$VERSION" ]] \
	|| die "style.css in package says ${PACKAGED_VERSION}, expected ${VERSION}"
log "style.css version matches: ${VERSION}"

for excluded in "${PACKAGE_EXCLUDES[@]}"; do
	[[ ! -e "${EXTRACTED}/${THEME_SLUG}/${excluded}" ]] \
		|| die "excluded path leaked into package: ${excluded}"
done
log "no excluded paths present"

FILE_COUNT="$(find "${EXTRACTED}/${THEME_SLUG}" -type f | wc -l)"
log "${FILE_COUNT} files packaged"

echo "Package verified."

#!/usr/bin/env bash
# Builds the distributable theme zip plus a SHA-256 checksum sidecar.
#
# The zip contains a single top-level directory named after the theme slug,
# which is what WordPress expects when installing from a file.
#
# Usage: bin/release/package.sh [version]
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
cd "$REPO_ROOT"

VERSION="${1:-$(node -p "require('./package.json').version")}"
STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT

ZIP_NAME="${THEME_SLUG}-${VERSION}.zip"

echo "Packaging ${THEME_SLUG} v${VERSION}..."

[[ -d dist ]] || die "dist/ is missing — run 'pnpm build' before packaging."

# Clear previous artifacts before staging, not after: rsync would otherwise
# copy them in and nest the old archive inside the new one.
rm -f "${REPO_ROOT}/${THEME_SLUG}"-*.zip "${REPO_ROOT}/${THEME_SLUG}"-*.zip.sha256

mkdir -p "${STAGING}/${THEME_SLUG}"

# shellcheck disable=SC2046 # word splitting is intended: one flag per exclude.
rsync -a $(rsync_exclude_args) ./ "${STAGING}/${THEME_SLUG}/"

for required in "${PACKAGE_REQUIRED[@]}"; do
	[[ -e "${STAGING}/${THEME_SLUG}/${required}" ]] \
		|| die "packaged theme is missing required file: ${required}"
done
log "all ${#PACKAGE_REQUIRED[@]} required files present"

# Guard against shipping build tooling. A stray src/ or node_modules/ in the
# zip has historically been how a 4 MB theme becomes a 400 MB one.
for forbidden in node_modules src tests vendor bin; do
	[[ ! -e "${STAGING}/${THEME_SLUG}/${forbidden}" ]] \
		|| die "packaged theme contains ${forbidden}/ — check PACKAGE_EXCLUDES"
done
log "no build tooling in package"

# A nested archive means an exclude is missing and the package is carrying a
# copy of itself. Cheap to check, and it has happened.
if find "${STAGING}/${THEME_SLUG}" -name '*.zip' -print -quit | grep -q .; then
	die "packaged theme contains a .zip — check PACKAGE_EXCLUDES"
fi

( cd "$STAGING" && zip -rq "$ZIP_NAME" "$THEME_SLUG" )
mv "${STAGING}/${ZIP_NAME}" "${REPO_ROOT}/${ZIP_NAME}"

# Checksum so an installer can verify the download was not corrupted or
# swapped. Written in the format `sha256sum -c` expects.
( cd "$REPO_ROOT" && sha256sum "$ZIP_NAME" > "${ZIP_NAME}.sha256" )

SIZE="$(du -h "${REPO_ROOT}/${ZIP_NAME}" | cut -f1)"
log "wrote ${ZIP_NAME} (${SIZE})"
log "wrote ${ZIP_NAME}.sha256"

echo "Package built."

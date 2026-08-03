#!/usr/bin/env bash
# semantic-release prepare step.
#
# Stamps the new version into style.css and package.json, then builds the
# distributable zip. Invoked by @semantic-release/exec with the next version.
#
# Usage: bin/release/prepare.sh <version>
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
cd "$REPO_ROOT"

VERSION="${1:?version argument is required}"

[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+ ]] \
	|| die "'$VERSION' is not a semver version"

echo "Preparing release ${VERSION}..."

# style.css is the version WordPress reads; package.json is what the tooling
# reads. They must agree or the updater will offer an update that is already
# installed.
perl -pi -e "s/^Version:\s*\S+/Version: ${VERSION}/" style.css
npm version "$VERSION" --no-git-tag-version --allow-same-version >/dev/null

STYLE_VERSION="$(grep -oP '^Version:\s*\K\S+' style.css)"
PKG_VERSION="$(node -p "require('./package.json').version")"

[[ "$STYLE_VERSION" == "$VERSION" ]] || die "style.css stamped as ${STYLE_VERSION}"
[[ "$PKG_VERSION" == "$VERSION" ]] || die "package.json stamped as ${PKG_VERSION}"
log "version stamped in style.css and package.json"

bash "${REPO_ROOT}/bin/release/package.sh" "$VERSION"
bash "${REPO_ROOT}/bin/release/verify-package.sh" "$VERSION"

echo "Release ${VERSION} prepared."

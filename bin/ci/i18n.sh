#!/usr/bin/env bash
# i18n lane: POT drift, translator comments, catalog validity.
#
# The gate is split across the container boundary deliberately.
#
# POT extraction needs `wp i18n make-pot`, which lives in the wp-env cli
# container. Catalog validation needs msgfmt, which that container (Alpine)
# does not ship. Running both inside it is how the equivalent gate in the
# sibling theme silently validated nothing for months: `wp i18n make-mo`
# accepts a broken catalog and exits 0. So extraction runs in the container and
# catalogs run on the host, where a missing msgfmt is a hard failure rather
# than a silent downgrade.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "${REPO_ROOT}"

WP_URL="$(node -e "import('./bin/ci/wp-env-url.mjs').then(m=>console.log(m.wpEnvUrl()))")"
if ! curl -sfo /dev/null "${WP_URL}"; then
	echo "  wp-env is not responding — starting it."
	pnpm env:start
fi

# Catalog validation needs gettext on the host. Guarded three ways so it stays
# a no-op for developers: only when msgfmt is genuinely absent, only under
# apt-get, and only with non-interactive sudo. Never fatal on its own — under
# `set -e` a flaky mirror would kill the lane with a raw apt error, where
# falling through lets validate-po.sh report the actionable message instead.
if ! command -v msgfmt > /dev/null 2>&1; then
	if command -v apt-get > /dev/null 2>&1 && sudo -n true > /dev/null 2>&1; then
		echo "msgfmt not found — installing gettext for catalog validation."
		if ! { sudo -n apt-get update -qq && sudo -n apt-get install -y -qq gettext; }; then
			echo "Warning: installing gettext failed." >&2
		fi
	else
		echo "Warning: msgfmt is missing and cannot be installed automatically." >&2
	fi
fi

CI=true pnpm exec wp-env run cli \
	--env-cwd="wp-content/themes/laao" \
	-- bash -c 'I18N_CI=1 LAAO_I18N_PO_VALIDATOR=skip bash bin/i18n/check.sh'

bash "${REPO_ROOT}/bin/i18n/validate-po.sh"

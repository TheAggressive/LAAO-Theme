#!/usr/bin/env bash
# Validate every locale catalog with msgfmt -c.
#
# This is a separate script because it is the one part of the gate that cannot
# run inside the wp-env container: POT drift needs the pinned WP-CLI, which
# lives there, and msgfmt is not in the Alpine cli image. So the CI lane runs
# drift in the container and this on the host.
#
# A missing msgfmt is a hard failure rather than a skip. A catalog whose format
# specifiers disagree with its msgid is a fatal error at render time, and that
# is precisely the class of defect a silent skip would let through.
set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

if ! command -v msgfmt >/dev/null 2>&1; then
	laao_i18n_die "msgfmt (gettext) is required to validate locale catalogs. Install gettext, or set LAAO_I18N_PO_VALIDATOR=skip to run the rest of the gate without catalog validation."
fi

po_files="$(laao_i18n_list_po_files || true)"

if [[ -z "${po_files}" ]]; then
	laao_i18n_info "No locale .po files — nothing to validate."
	exit 0
fi

failures=0

while IFS= read -r po; do
	[[ -n "${po}" ]] || continue
	laao_i18n_info "Validating $(basename "${po}")"

	# -c is what makes this worth running: without it msgfmt happily compiles a
	# catalog whose format specifiers no longer match the msgid.
	if ! msgfmt -c -o /dev/null "${po}"; then
		failures=$(( failures + 1 ))
	fi
done <<< "${po_files}"

if (( failures > 0 )); then
	laao_i18n_die "${failures} locale catalog(s) failed validation."
fi

laao_i18n_info "Locale catalogs valid."

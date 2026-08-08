#!/usr/bin/env bash
# Merge the current POT into every locale PO, preserving existing translations.
set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

[[ -f "${LAAO_POT_FILE}" ]] || laao_i18n_die "Missing POT. Run: pnpm i18n:pot"

po_files="$(laao_i18n_list_po_files || true)"
if [[ -z "${po_files}" ]]; then
	laao_i18n_info "No locale .po files yet. Scaffold one with: pnpm i18n:locale -- <locale>"
	exit 0
fi

while IFS= read -r po; do
	[[ -n "${po}" ]] || continue
	locale="$(laao_i18n_locale_from_po "${po}")"
	laao_i18n_info "Syncing ${locale} ← pot"

	# --previous keeps the old msgid as a comment on fuzzy matches, which is
	# what lets a translator see what actually changed.
	if command -v msgmerge >/dev/null 2>&1; then
		msgmerge --update --backup=none --previous "${po}" "${LAAO_POT_FILE}"
	else
		laao_i18n_wp i18n update-po "${LAAO_POT_FILE}" "${po}"
	fi
done <<< "${po_files}"

laao_i18n_info "Done."

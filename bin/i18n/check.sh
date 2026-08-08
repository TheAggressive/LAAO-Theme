#!/usr/bin/env bash
# CI gate: POT drift, catalog validity, translator comments.
set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

laao_i18n_ensure_languages_dir
[[ -f "${LAAO_POT_FILE}" ]] || laao_i18n_die "Committed POT missing at ${LAAO_POT_FILE}"

tmp_dir="$(mktemp -d)"
trap 'rm -rf "${tmp_dir}"' EXIT

tmp_pot="${tmp_dir}/laao.pot"
laao_i18n_info "Regenerating POT for drift check…"

laao_i18n_wp i18n make-pot \
	. \
	"${tmp_pot}" \
	--domain="${LAAO_TEXT_DOMAIN}" \
	--exclude="${LAAO_I18N_EXCLUDE}"

norm_committed="${tmp_dir}/committed.pot"
norm_generated="${tmp_dir}/generated.pot"
laao_i18n_normalize_pot "${LAAO_POT_FILE}" "${norm_committed}"
laao_i18n_normalize_pot "${tmp_pot}" "${norm_generated}"

if ! diff -u "${norm_committed}" "${norm_generated}" > "${tmp_dir}/pot.diff"; then
	laao_i18n_info "POT drift detected. First 80 lines of diff:"
	head -n 80 "${tmp_dir}/pot.diff" || true
	laao_i18n_die "languages/${LAAO_TEXT_DOMAIN}.pot is out of date. Run: pnpm i18n:pot && commit the result."
fi

laao_i18n_info "POT is up to date."

# Catalog validation. Only two modes, and skipping is always explicit: a
# missing tool must never quietly select it. `wp i18n make-mo` is not a
# substitute — it accepts an unterminated msgid and a placeholder mismatch
# alike, prints success, and exits 0.
case "${LAAO_I18N_PO_VALIDATOR:-auto}" in
	auto)
		bash "${LAAO_I18N_DIR}/validate-po.sh"
		;;
	skip)
		laao_i18n_info "PO validation SKIPPED (LAAO_I18N_PO_VALIDATOR=skip) — catalogs are NOT checked here."
		;;
	*)
		laao_i18n_die "LAAO_I18N_PO_VALIDATOR must be 'auto' or 'skip' (got '${LAAO_I18N_PO_VALIDATOR}')."
		;;
esac

bash "${LAAO_I18N_DIR}/lint-translators.sh"

laao_i18n_info "i18n check passed."

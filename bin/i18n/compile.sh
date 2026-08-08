#!/usr/bin/env bash
# Compile every locale .po into .mo (PHP) and Jed JSON (scripts).
#
# Both outputs are needed: .mo serves gettext in PHP, and the JSON files serve
# wp_set_script_translations. Ship only the .mo and the editor sidebar panels
# stay English on a translated site.
set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

laao_i18n_ensure_languages_dir

po_files="$(laao_i18n_list_po_files || true)"
if [[ -z "${po_files}" ]]; then
	laao_i18n_info "No locale .po files to compile."
	exit 0
fi

while IFS= read -r po; do
	[[ -n "${po}" ]] || continue
	locale="$(laao_i18n_locale_from_po "${po}")"
	laao_i18n_info "Compiling ${locale}"

	laao_i18n_wp i18n make-mo "${po}" "${LAAO_LANGUAGES_DIR}"

	# make-mo names its output after the .po, giving laao-es_ES.mo. That is the
	# WP_LANG_DIR/themes/ convention, and it is the wrong one here.
	#
	# _load_textdomain_just_in_time() branches on the registered path: when it
	# sits inside the template or stylesheet directory it looks for
	# "{$locale}.mo", and only otherwise for "{$domain}-{$locale}.mo". A theme
	# shipping its own catalogs is always the first case, so the prefixed file
	# is never opened — load_theme_textdomain() still returns true, the site
	# still renders English, and nothing reports a problem.
	#
	# Renaming rather than duplicating: the prefixed name has no reader in this
	# layout, and two copies of every catalog is payload nobody loads.
	mv "${LAAO_LANGUAGES_DIR}/${LAAO_TEXT_DOMAIN}-${locale}.mo" "${LAAO_LANGUAGES_DIR}/${locale}.mo"

	# The JSON catalogs keep the domain prefix: load_script_textdomain() builds
	# "{$domain}-{$locale}-{$md5}.json" with no equivalent path special case.
	laao_i18n_wp i18n make-json "${po}" "${LAAO_LANGUAGES_DIR}" --pretty-print --no-purge
done <<< "${po_files}"

laao_i18n_info "Done."

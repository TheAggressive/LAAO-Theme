#!/usr/bin/env bash
# Shared helpers for theme i18n tooling.
# shellcheck shell=bash

set -euo pipefail

LAAO_I18N_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAAO_THEME_ROOT="$(cd "${LAAO_I18N_DIR}/../.." && pwd)"
LAAO_TEXT_DOMAIN="${LAAO_TEXT_DOMAIN:-laao}"
LAAO_LANGUAGES_DIR="${LAAO_THEME_ROOT}/languages"
# Read by the scripts that source this file; ShellCheck sees one file.
# shellcheck disable=SC2034
LAAO_POT_FILE="${LAAO_LANGUAGES_DIR}/${LAAO_TEXT_DOMAIN}.pot"

# dist/ is excluded deliberately. It holds the compiled copies of everything in
# src/, so leaving it in doubles every block string and attributes it to a file
# nobody edits.
LAAO_I18N_EXCLUDE="${LAAO_I18N_EXCLUDE:-node_modules,vendor,dist,coverage,tests,.git,bin,.wp-env,.cache,languages}"

# Container-relative theme path when using wp-env.
LAAO_WP_ENV_THEME_CWD="${LAAO_WP_ENV_THEME_CWD:-wp-content/themes/laao}"

laao_i18n_info() {
	printf 'i18n: %s\n' "$*"
}

laao_i18n_die() {
	printf 'i18n: ERROR: %s\n' "$*" >&2
	exit 1
}

laao_i18n_ensure_languages_dir() {
	mkdir -p "${LAAO_LANGUAGES_DIR}"
}

# Run `wp …` either via host WP-CLI or the wp-env cli container.
laao_i18n_wp() {
	if [[ "${LAAO_I18N_FORCE_WP_ENV:-0}" == "1" ]]; then
		command -v wp-env >/dev/null 2>&1 || laao_i18n_die "wp-env is required (LAAO_I18N_FORCE_WP_ENV=1)."
		CI=true wp-env run cli --env-cwd="${LAAO_WP_ENV_THEME_CWD}" wp "$@"
		return
	fi

	if command -v wp >/dev/null 2>&1 && wp help i18n >/dev/null 2>&1; then
		( cd "${LAAO_THEME_ROOT}" && wp --allow-root "$@" )
		return
	fi

	if command -v wp-env >/dev/null 2>&1; then
		CI=true wp-env run cli --env-cwd="${LAAO_WP_ENV_THEME_CWD}" wp "$@"
		return
	fi

	laao_i18n_die "Need WP-CLI (\`wp\`) with the i18n package, or wp-env."
}

# Strip volatile POT headers so the drift check compares content, not timestamps.
#
# Project-Id-Version carries the theme version, which semantic-release bumps on
# every release without regenerating the committed POT — so the header lags by
# one version and would otherwise report drift on the next push. It is a version
# stamp, not translatable content.
#
# Report-Msgid-Bugs-To follows the on-disk folder name, which differs between a
# local checkout and a CI clone.
laao_i18n_normalize_pot() {
	local src="$1"
	local dest="$2"

	sed -E \
		-e 's/^"Project-Id-Version: .+\\n"$/"Project-Id-Version: LAAO\\n"/' \
		-e 's/^"POT-Creation-Date: .+\\n"$/"POT-Creation-Date: YEAR-MO-DA HO:MI+ZONE\\n"/' \
		-e 's/^"PO-Revision-Date: .+\\n"$/"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\\n"/' \
		-e 's/^"X-Generator: .+\\n"$/"X-Generator: WP-CLI\\n"/' \
		-e 's|^"Report-Msgid-Bugs-To: .+\\n"$|"Report-Msgid-Bugs-To: https://laartsonline.com\\n"|' \
		"${src}" > "${dest}"
}

laao_i18n_list_po_files() {
	find "${LAAO_LANGUAGES_DIR}" -maxdepth 1 -type f -name "${LAAO_TEXT_DOMAIN}-*.po" | sort
}

laao_i18n_locale_from_po() {
	local po_file="$1"
	local base
	base="$(basename "${po_file}" .po)"
	printf '%s\n' "${base#"${LAAO_TEXT_DOMAIN}-"}"
}

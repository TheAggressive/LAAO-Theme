#!/usr/bin/env bash
# Fail when a gettext string with placeholders lacks a translators comment.
#
# A translator who sees "%1$s of %2$s" with no context has to guess which is
# which, and languages that reorder the two get it wrong silently.
set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "${LAAO_THEME_ROOT}"

# A pragmatic guardrail, not a PHP parser: it flags a gettext call whose first
# argument contains a % placeholder with no /* translators: */ in the preceding
# five lines. Only PHP is scanned — the comment convention is a gettext-for-PHP
# one, and WP-CLI does not extract it from JS.
mapfile -t files < <(
	find inc patterns src templates parts \
		-name '*.php' -type f 2>/dev/null | sort
)

failures=0

for file in "${files[@]}"; do
	[[ -f "${file}" ]] || continue

	mapfile -t hits < <(
		grep -nE "(__|_e|esc_html__|esc_attr__|esc_html_e|esc_attr_e|_n|_nx|_x)\s*\(\s*['\"][^'\"]*%[0-9$]*[sd]" "${file}" \
			| cut -d: -f1 || true
	)

	for line_no in "${hits[@]:-}"; do
		[[ -n "${line_no}" ]] || continue
		start=$(( line_no > 5 ? line_no - 5 : 1 ))
		window="$(sed -n "${start},${line_no}p" "${file}")"
		if ! grep -q 'translators:' <<< "${window}"; then
			printf 'i18n: missing translators comment: %s:%s\n' "${file}" "${line_no}"
			sed -n "${line_no}p" "${file}" | sed 's/^/  /'
			failures=$(( failures + 1 ))
		fi
	done
done

if (( failures > 0 )); then
	laao_i18n_die "${failures} gettext string(s) with placeholders lack /* translators: */ comments."
fi

laao_i18n_info "Translator-comment lint OK."

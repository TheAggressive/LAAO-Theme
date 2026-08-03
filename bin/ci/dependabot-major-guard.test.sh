#!/usr/bin/env bash
# Tests for the unattended-merge guard.
#
# Every title below is a real Dependabot form. The "must hold" cases are the
# ones that matter: each is an update that would change a major version, and
# each must be left for a human. The wp-scripts 30->34 and eslint 9->10 cases
# are taken verbatim from pull requests that needed manual review.
set -uo pipefail

GUARD="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/dependabot-major-guard.sh"

pass=0
fail=0

# check <merge|hold> <title>
check() {
	local want="$1" title="$2" got

	if bash "${GUARD}" "${title}" >/dev/null 2>&1; then
		got=merge
	else
		got=hold
	fi

	if [[ "${got}" == "${want}" ]]; then
		pass=$((pass + 1))
	else
		fail=$((fail + 1))
		printf '  FAIL  want=%-5s got=%-5s  %s\n' "${want}" "${got}" "${title}"
	fi
}

# Majors and anything unrecognised must never merge unattended.
check hold "chore(deps): bump @wordpress/scripts from 30.9.0 to 34.0.0 in the wordpress group"
check hold "chore(deps-dev): bump eslint from 9.39.5 to 10.8.0 in the eslint group"
check hold "ci: bump actions/checkout from 4 to 7"
check hold "ci: bump actions/cache from 4 to 6"
check hold "ci: bump github/codeql-action from 3 to 4"
check hold "chore(deps): bump phpstan/phpstan from 2.2.7 to 3.0.0"
check hold "chore(deps): bump lodash from 4.17.21 to 5.0.0"
check hold "Update README"
check hold "feat: something a human wrote"
check hold ""

# Same-major bumps and constrained groups are safe.
check merge "chore(deps-dev): bump prettier from 3.5.3 to 3.9.6"
check merge "chore(deps): bump @wordpress/scripts from 34.0.0 to 34.2.1 in the wordpress group"
check merge "ci: bump actions/checkout from 4.1.0 to 4.2.2"
check merge "ci: bump actions/checkout from 4 to 4"
check merge "chore(deps-dev): bump the dev-minor-patch group with 34 updates"
check merge "chore(deps): bump the wordpress group with 3 updates"
check merge "ci: bump the actions group with 2 updates"
check merge "chore(deps): bump phpstan/phpstan from 2.2.7 to 2.3.0"

if [[ "${fail}" -ne 0 ]]; then
	echo "Dependabot guard: ${pass} passed, ${fail} FAILED"
	exit 1
fi

echo "Dependabot guard: ${pass} passed."

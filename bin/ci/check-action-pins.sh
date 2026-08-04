#!/usr/bin/env bash
# Every GitHub Action must be referenced by a floating major tag (@v4), not an
# exact release (@v4.37.4).
#
# Not cosmetic. Dependabot follows whatever format it finds: an exact pin means
# a pull request for every patch release, while a major tag means one only when
# the major changes. Mixed formats also make it hard to see at a glance which
# actions are actually being tracked for breaking changes.
#
# The trade-off is deliberate. Exact tags — or better, commit SHAs — are
# stricter supply-chain-wise, because a major tag is mutable and the publisher
# can move it. That protection is worth having, but it is an all-or-nothing
# decision for the whole workflow set, not something to arrive at by accident
# because one Dependabot pull request happened to pin differently. If this
# project later moves to SHA pinning, change the rule here and do it uniformly.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

EXIT=0

echo "Checking GitHub Action version pins..."

while IFS= read -r line; do
	file="${line%%:*}"
	ref="${line#*uses: }"
	version="${ref##*@}"

	# Accept a bare major tag (v4). Reject anything more specific (v4.1, v4.1.2)
	# and anything that is not a version tag at all.
	if [[ ! "${version}" =~ ^v[0-9]+$ ]]; then
		echo "  FAIL: ${file} pins ${ref}"
		echo "        use ${ref%@*}@${version%%.*} — see this script's header"
		EXIT=1
	fi
done < <(grep -rHoE "uses: [a-zA-Z0-9._/-]+@[a-zA-Z0-9._-]+" .github/workflows/ || true)

if [[ "${EXIT}" -ne 0 ]]; then
	echo ""
	echo "Standardise the pins, or change the policy here deliberately."
else
	echo "Action pin check passed (all references use a major tag)."
fi

exit "${EXIT}"

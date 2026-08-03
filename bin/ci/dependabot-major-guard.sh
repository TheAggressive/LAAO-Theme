#!/usr/bin/env bash
# Decides whether a Dependabot pull request title is safe to merge unattended.
#
#   exit 0 — same-major update, or a group constrained to minor/patch: mergeable
#   exit 1 — crosses a major version, or is not a recognised Dependabot title
#
# Lives here rather than inline in dependabot-auto-merge.yml so that the logic
# gating unattended merges is testable — see dependabot-major-guard.test.sh,
# which runs in the frontend CI lane. Logic that can merge code without a human
# should not be the one part of the pipeline nothing verifies.
#
# Usage: bin/ci/dependabot-major-guard.sh "<pull request title>"
set -uo pipefail

TITLE="${1:-}"

if [[ -z "${TITLE}" ]]; then
	echo "usage: $0 <pull-request-title>" >&2
	exit 2
fi

# Semver bumps: "bump X from 1.2.3 to 2.0.0".
if [[ "${TITLE}" =~ from\ ([0-9]+)\.[0-9]+\.[0-9]+.*\ to\ ([0-9]+)\.[0-9]+\.[0-9]+ ]]; then
	if [[ "${BASH_REMATCH[1]}" != "${BASH_REMATCH[2]}" ]]; then
		echo "crosses a major version (${BASH_REMATCH[1]} -> ${BASH_REMATCH[2]})"
		exit 1
	fi
	echo "same major (${BASH_REMATCH[1]})"
	exit 0
fi

# GitHub Actions bumps use bare major tags: "bump actions/checkout from 4 to 7".
if [[ "${TITLE}" =~ from\ ([0-9]+)\ to\ ([0-9]+) ]]; then
	if [[ "${BASH_REMATCH[1]}" != "${BASH_REMATCH[2]}" ]]; then
		echo "crosses a major version (${BASH_REMATCH[1]} -> ${BASH_REMATCH[2]})"
		exit 1
	fi
	echo "same major (${BASH_REMATCH[1]})"
	exit 0
fi

# Grouped bumps carry no versions in the title. Every group in dependabot.yml
# is constrained to minor/patch, so a major can never be inside one.
if [[ "${TITLE}" =~ bump\ the\ .*\ group ]]; then
	echo "constrained group (minor/patch only)"
	exit 0
fi

echo "not a recognised Dependabot title"
exit 1

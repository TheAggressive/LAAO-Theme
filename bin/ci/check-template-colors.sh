#!/usr/bin/env bash
# Block templates must reference palette tokens, not literal colour values.
#
# WordPress caches the resolved colour alongside the slug when a block is saved
# ("iconColor":"laao-red","iconColorValue":"hsl(...)"). That cache is a snapshot:
# change the palette and the literal stays behind, so the block keeps rendering
# the old colour while claiming the current slug.
#
# That is not hypothetical. Three templates drifted to hsl(0, 73.7%, 41.8%)
# — rgb(185, 28, 28) — while the palette's laao-red was rgb(220, 38, 38), so
# article pages rendered a visibly different brand red from the front page for
# an unknown length of time, with nothing to catch it.
#
# Referencing var(--wp--custom--color--*) instead keeps the value live: the
# colour resolves at render time from the single definition in theme.json.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

EXIT=0

echo "Checking block templates for hard-coded palette colours..."

# Cached *ColorValue attributes holding a literal rather than a var() reference.
while IFS= read -r hit; do
	[[ -z "$hit" ]] && continue
	echo "  FAIL: $hit"
	EXIT=1
done < <(
	grep -rnoE '"[a-zA-Z]*[Cc]olorValue":"(#|rgb|hsl|oklch)[^"]*"' \
		templates/ parts/ patterns/ 2>/dev/null || true
)

if [[ "$EXIT" -ne 0 ]]; then
	echo ""
	echo "Replace the literal with the token it should follow, for example:"
	echo '  "iconColorValue":"var(--wp--custom--color--red)"'
	echo ""
	echo "Note: a template edited in the Site Editor is stored in the database and"
	echo "shadows the theme file, so fixing the file may not change the live site"
	echo "until that template is reset or re-saved."
else
	echo "Template colour check passed (no hard-coded palette values)."
fi

exit "$EXIT"

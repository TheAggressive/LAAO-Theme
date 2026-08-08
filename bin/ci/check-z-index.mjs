#!/usr/bin/env node
/**
 * Assert the modal stacks above every other layer in the theme.
 *
 * The modal was ported with `--laao-z-modal: 400` while `.site-nav` sits at
 * 999, so an open dialog rendered underneath the mobile navigation. Its own
 * CSS asks for `var(--laao-z-modal, 1000)` — the fallback was right and the
 * token was what broke it, which is precisely the kind of mistake a number in
 * one file and a number in another will keep producing.
 *
 * So this compares them instead of trusting either. Any z-index in the theme's
 * CSS that reaches the modal's value fails the build.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const TOKENS = join(ROOT, 'src/styles/base/_tokens.css');
const ROOTS = ['src/styles', 'src/blocks', 'src/blocks-interactivity'];

/** Files that legitimately carry a high z-index of their own. */
const IGNORED = [
	// Vendored Tailwind Preflight — not ours to reorder.
	'src/styles/_reset.css',
];

function cssFiles(dir) {
	const out = [];

	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);

		if (statSync(full).isDirectory()) {
			out.push(...cssFiles(full));
		} else if (entry.endsWith('.css')) {
			out.push(full);
		}
	}

	return out;
}

const tokenMatch = readFileSync(TOKENS, 'utf8').match(
	/--laao-z-modal:\s*(\d+)\s*;/
);

if (!tokenMatch) {
	console.error(
		'z-index check: --laao-z-modal is not defined in _tokens.css.'
	);
	process.exit(1);
}

const modalZ = Number(tokenMatch[1]);
const offenders = [];

for (const dir of ROOTS) {
	for (const file of cssFiles(join(ROOT, dir))) {
		const rel = relative(ROOT, file);

		if (IGNORED.includes(rel)) {
			continue;
		}

		readFileSync(file, 'utf8')
			.split('\n')
			.forEach((line, index) => {
				// Only bare numeric values. `var(--laao-z-modal, …)` is the
				// modal asking for the token and must not flag itself.
				const found = line.match(
					/z-index:\s*(\d+)\s*(?:!important)?\s*;/
				);

				if (found && Number(found[1]) >= modalZ) {
					offenders.push(`${rel}:${index + 1}  z-index: ${found[1]}`);
				}
			});
	}
}

if (offenders.length > 0) {
	console.error(
		`z-index check FAILED: --laao-z-modal is ${modalZ}, but these reach or exceed it,\n` +
			'so an open modal can render underneath them:\n'
	);
	offenders.forEach((o) => console.error(`  ${o}`));
	console.error(
		'\nRaise --laao-z-modal in src/styles/base/_tokens.css, or lower the layer above.'
	);
	process.exit(1);
}

console.log(
	`z-index check passed (--laao-z-modal: ${modalZ} tops every layer).`
);

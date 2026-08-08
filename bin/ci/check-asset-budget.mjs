#!/usr/bin/env node
/**
 * Enforce transfer budgets on the assets a visitor downloads.
 *
 * Measures gzipped bytes, because that is what crosses the wire. Raw size
 * would let a change that compresses badly pass while the page got slower.
 *
 * This is the half of performance that can be checked deterministically, on
 * every pull request, with no browser and no running site. `pnpm perf` covers
 * the half this cannot see — LCP, CLS and total blocking time.
 *
 * Budgets live in bin/ci/asset-budget.json so that raising one is a reviewable
 * diff with a number in it, rather than a threshold buried in a script.
 */

import { gzipSync } from 'node:zlib';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const CONFIG = join(ROOT, 'bin/ci/asset-budget.json');

/**
 * Gzipped size of a file, at the level a web server would use.
 *
 * @param {string} file Absolute path.
 * @return {number} Bytes.
 */
function gzipSize(file) {
	return gzipSync(readFileSync(file), { level: 9 }).length;
}

/**
 * Resolves a glob of the shape `dir/*<literal>/name`.
 *
 * Deliberately tiny: the patterns in asset-budget.json are all
 * `dist/<area>/*<basename>`, so a dependency to parse arbitrary globs would be
 * more surface than the job needs.
 *
 * @param {string} pattern Glob relative to the theme root.
 * @return {string[]} Absolute paths that exist.
 */
function resolveGlob(pattern) {
	const star = pattern.indexOf('*');

	if (star === -1) {
		const direct = join(ROOT, pattern);
		return existsSync(direct) ? [direct] : [];
	}

	// Everything before the wildcard is the directory whose entries are the
	// candidates — not its dirname, which would climb one level too far.
	const parent = join(ROOT, pattern.slice(0, star).replace(/\/$/, ''));
	const wanted = basename(pattern);

	if (!existsSync(parent)) {
		return [];
	}

	return readdirSync(parent)
		.map((entry) => join(parent, entry, wanted))
		.filter((candidate) => existsSync(candidate));
}

/** @type {{budgets: object[], groups: object[], totalMaxGzip: number}} */
const config = JSON.parse(readFileSync(CONFIG, 'utf8'));

const rows = [];
const failures = [];
let total = 0;

for (const budget of config.budgets) {
	const file = join(ROOT, budget.file);

	if (!existsSync(file)) {
		failures.push(
			`${budget.file} is missing — run 'pnpm build' before checking budgets.`
		);
		continue;
	}

	const size = gzipSize(file);
	total += size;
	rows.push({ name: budget.file, size, max: budget.maxGzip });

	if (size > budget.maxGzip) {
		failures.push(
			`${budget.file} is ${size} B gzipped, over its ${budget.maxGzip} B budget by ${size - budget.maxGzip} B.` +
				(budget.note ? `\n    ${budget.note}` : '')
		);
	}
}

for (const group of config.groups ?? []) {
	const files = group.globs.flatMap(resolveGlob);
	const size = files.reduce((sum, file) => sum + gzipSize(file), 0);

	total += size;
	rows.push({
		name: `${group.name} (${files.length} files)`,
		size,
		max: group.maxGzip,
	});

	if (size > group.maxGzip) {
		const heaviest = files
			.map((file) => ({
				file: relative(ROOT, file),
				size: gzipSize(file),
			}))
			.sort((a, b) => b.size - a.size)
			.slice(0, 3)
			.map((entry) => `      ${entry.file} — ${entry.size} B`)
			.join('\n');

		failures.push(
			`${group.name} is ${size} B gzipped, over its ${group.maxGzip} B budget by ${size - group.maxGzip} B.\n` +
				`    Largest contributors:\n${heaviest}`
		);
	}
}

const width = Math.max(...rows.map((row) => row.name.length));

for (const row of rows) {
	const headroom = row.max - row.size;
	const percent = Math.round((row.size / row.max) * 100);

	console.log(
		`  ${row.name.padEnd(width)}  ${String(row.size).padStart(6)} B / ${String(row.max).padStart(6)} B  ${String(percent).padStart(3)}%  ${headroom >= 0 ? `${headroom} B spare` : `${-headroom} B OVER`}`
	);
}

if (total > config.totalMaxGzip) {
	failures.push(
		`Front-end total is ${total} B gzipped, over the ${config.totalMaxGzip} B budget by ${total - config.totalMaxGzip} B.`
	);
}

if (failures.length > 0) {
	console.error('\nAsset budget FAILED:\n');
	failures.forEach((failure) => console.error(`  - ${failure}`));
	console.error(
		'\nEither make the asset smaller, or raise the number in bin/ci/asset-budget.json\n' +
			'and say why in the commit message. Do not raise it silently.'
	);
	process.exit(1);
}

console.log(
	`Asset budget passed (${total} B gzipped of ${config.totalMaxGzip} B across the front end).`
);

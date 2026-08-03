/**
 * Environment doctor.
 *
 * Fails fast when the local Node or pnpm falls outside the range declared in
 * package.json "engines". A mismatched toolchain produces lockfile churn and
 * "works on my machine" build differences that are expensive to trace back to
 * their real cause, so it is worth one explicit check up front.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	'../..'
);

const packageJson = JSON.parse(
	readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')
);

/**
 * Tests a version against a space-separated range of `>=x`, `<x`, `>x`, `<=x`.
 *
 * Deliberately dependency-free: the doctor must be able to run before
 * `pnpm install` has succeeded.
 *
 * @param {string} version Semver version, e.g. "24.18.0".
 * @param {string} range   Range, e.g. ">=24 <27".
 * @return {boolean} Whether the version satisfies every clause.
 */
function satisfies(version, range) {
	const toParts = (v) =>
		v
			.replace(/^[^\d]*/, '')
			.split('.')
			.map((n) => parseInt(n, 10) || 0);

	const compare = (a, b) => {
		const [x, y] = [toParts(a), toParts(b)];
		for (let i = 0; i < 3; i++) {
			if ((x[i] ?? 0) !== (y[i] ?? 0)) {
				return (x[i] ?? 0) - (y[i] ?? 0);
			}
		}
		return 0;
	};

	return range
		.trim()
		.split(/\s+/)
		.every((clause) => {
			const match = clause.match(/^(>=|<=|>|<)?(.+)$/);
			if (!match) {
				return true;
			}
			const [, operator = '>=', target] = match;
			const result = compare(version, target);

			switch (operator) {
				case '>=':
					return result >= 0;
				case '>':
					return result > 0;
				case '<=':
					return result <= 0;
				case '<':
					return result < 0;
				default:
					return true;
			}
		});
}

/**
 * Resolves the running pnpm version.
 *
 * @return {string|null} Version string, or null when pnpm is unavailable.
 */
function detectPnpmVersion() {
	const fromUserAgent = process.env.npm_config_user_agent?.match(
		/(?:^|\s)pnpm\/([^\s]+)/u
	);

	if (fromUserAgent) {
		return fromUserAgent[1];
	}

	try {
		return execFileSync('pnpm', ['--version'], {
			encoding: 'utf8',
		}).trim();
	} catch {
		return null;
	}
}

const checks = [
	{
		name: 'node',
		expected: packageJson.engines?.node,
		actual: process.versions.node,
	},
	{
		name: 'pnpm',
		expected: packageJson.engines?.pnpm,
		actual: detectPnpmVersion(),
	},
];

const problems = [];

for (const { name, expected, actual } of checks) {
	if (!expected) {
		continue;
	}

	if (!actual) {
		problems.push(`${name}: not found (expected ${expected})`);
		continue;
	}

	if (!satisfies(actual, expected)) {
		problems.push(`${name}: found ${actual}, expected ${expected}`);
	}
}

if (problems.length > 0) {
	console.error('Toolchain check failed:\n');
	for (const problem of problems) {
		console.error(`  - ${problem}`);
	}
	console.error(
		'\nInstall the pinned versions (see .node-version) and try again.'
	);
	process.exit(1);
}

console.log(
	`Toolchain OK — node ${process.versions.node}, pnpm ${
		checks[1].actual ?? 'n/a'
	}`
);

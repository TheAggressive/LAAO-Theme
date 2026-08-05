/**
 * Resolves the local WordPress URL from .wp-env.json.
 *
 * The port is declared in exactly one place. Duplicating it into
 * playwright.config.ts and the baseline generator meant changing it in
 * .wp-env.json silently pointed both at a dead port — which is precisely how
 * this helper came to exist.
 *
 * WP_BASE_URL still wins, so the same specs can run against another install
 * (the LocalWP site, a staging URL) without touching configuration.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

// Resolved from the working directory rather than import.meta.url: Playwright
// transpiles playwright.config.ts (and anything it imports) to CommonJS, where
// import.meta is a syntax error. Every caller — pnpm scripts and Playwright
// alike — runs from the repository root.
const repositoryRoot = process.cwd();

/**
 * Base URL of the environment under test.
 *
 * @return {string} Origin, without a trailing slash.
 */
export function wpEnvUrl() {
	if (process.env.WP_BASE_URL) {
		return process.env.WP_BASE_URL.replace(/\/$/, '');
	}

	try {
		const config = JSON.parse(
			readFileSync(path.join(repositoryRoot, '.wp-env.json'), 'utf8')
		);
		return `http://localhost:${config.port ?? 8888}`;
	} catch {
		// wp-env's own default, so a missing or unreadable config still points
		// somewhere sensible rather than throwing during config load.
		return 'http://localhost:8888';
	}
}

#!/usr/bin/env node
/**
 * Run Lighthouse against the theme.
 *
 * Deliberately thin. Everything about what is measured and what is enforced
 * lives in lighthouserc.cjs, where it is readable without tracing a script;
 * this only makes sure there is something to measure and picks a Chrome.
 *
 * Usage:
 *   pnpm perf            three runs, median, thresholds enforced
 *   pnpm perf:report     one run, nothing enforced, full report
 *
 * Honours WP_BASE_URL, so the LocalWP site with real content and plugins can
 * be measured as easily as wp-env:
 *   WP_BASE_URL=http://laartsonline.local pnpm perf
 */

import { execFileSync, execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const mode = process.argv[2] === 'report' ? 'report' : 'budget';
const isReportMode = 'report' === mode;

/**
 * Locates a Chrome or Chromium that Lighthouse can drive.
 *
 * Prefers the browser Playwright already installed for the E2E suite, so a
 * developer who can run `pnpm test:e2e` can run this too without installing
 * anything else.
 *
 * @return {Promise<string|undefined>} Executable path, or undefined to let Lighthouse look.
 */
async function findChrome() {
	if (process.env.CHROME_PATH) {
		return process.env.CHROME_PATH;
	}

	try {
		const { chromium } = await import('@playwright/test');
		const path = chromium.executablePath();
		return existsSync(path) ? path : undefined;
	} catch {
		return undefined;
	}
}

const baseUrl =
	process.env.WP_BASE_URL ||
	execSync(
		`node -e "import('./bin/ci/wp-env-url.mjs').then(m=>console.log(m.wpEnvUrl()))"`,
		{ cwd: ROOT, encoding: 'utf8' }
	).trim();

if (!existsSync(join(ROOT, 'dist'))) {
	console.error(
		"dist/ is missing. Lighthouse would measure a theme with no assets — run 'pnpm build' first."
	);
	process.exit(1);
}

console.log(`Measuring ${baseUrl} (${mode} mode)…`);

const chromePath = await findChrome();

if (!chromePath) {
	console.warn(
		'No Chrome found via Playwright; letting Lighthouse locate one itself.'
	);
}

/*
 * `autorun` is collect + assert + upload, and its assert step exits non-zero
 * with "No assertions to use" when there are none — which is exactly what
 * report mode is. So report mode runs the two steps it actually wants.
 */
const commands = isReportMode
	? [
			['collect', '--config=lighthouserc.cjs'],
			['upload', '--config=lighthouserc.cjs'],
		]
	: [['autorun', '--config=lighthouserc.cjs']];

const env = {
	...process.env,
	LHCI_MODE: mode,
	LHCI_BASE_URL: baseUrl,
	...(chromePath ? { CHROME_PATH: chromePath } : {}),
};

try {
	for (const args of commands) {
		execFileSync('npx', ['--yes', '@lhci/cli@0.15.x', ...args], {
			cwd: ROOT,
			stdio: 'inherit',
			env,
		});
	}

	if (isReportMode) {
		console.log(
			`\nReports written to .lighthouseci/reports/${mode}/ — open the .html file to see where the time goes.`
		);
	}
} catch {
	// lhci has already printed which assertion failed and by how much; adding
	// a stack trace on top of that only buries it.
	process.exit(1);
}

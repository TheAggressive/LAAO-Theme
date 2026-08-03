import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration.
 *
 * Targets the wp-env development instance (see .wp-env.json). Point
 * WP_BASE_URL at another install to run the same specs elsewhere — the LocalWP
 * site, for example — but note that specs which mutate content assume a
 * resettable environment.
 */
export default defineConfig({
	testDir: './tests/e2e',
	outputDir: './tests/e2e/.results',

	// A failing assertion is a bug, not flake. Retry only on CI, where genuine
	// infrastructure noise exists, and never locally where it would hide races.
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 1 : undefined,
	forbidOnly: !!process.env.CI,

	timeout: 30_000,
	expect: { timeout: 5_000 },

	reporter: process.env.CI
		? [['github'], ['html', { open: 'never' }]]
		: [['list']],

	use: {
		baseURL: process.env.WP_BASE_URL ?? 'http://localhost:9930',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
	},

	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
});

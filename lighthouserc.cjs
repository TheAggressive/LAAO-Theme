/**
 * Lighthouse CI configuration.
 *
 * Measures what bin/ci/check-asset-budget.mjs cannot: how the page actually
 * behaves once it loads. Byte budgets catch a bundle growing; they say nothing
 * about a layout that shifts, a font that blocks, or a hero image that arrives
 * late.
 *
 * This is a command you run — `pnpm perf` — not a CI gate. Lighthouse numbers
 * move with the machine that measured them, so failing a pull request on them
 * would mean failing pull requests for reasons the author cannot reproduce.
 * The deterministic half runs in CI instead.
 *
 * Two modes:
 *   budget  three runs, median, thresholds enforced. Use before a release.
 *   report  one run, nothing enforced. Use to see where the time goes.
 */

const path = require('node:path');

const mode = process.env.LHCI_MODE || 'budget';

const baseUrl = (process.env.LHCI_BASE_URL || 'http://localhost:9950').replace(
	/\/$/,
	''
);

const isBudget = mode === 'budget';
const isReport = mode === 'report';

/*
 * The front page carries the hero, the modal and the ad slots, and an article
 * is the page a reader actually spends time on. Between them they cover every
 * heavy thing the theme ships.
 */
const urls = isReport
	? [`${baseUrl}/`]
	: [`${baseUrl}/`, `${baseUrl}/?p=1`].filter(Boolean);

/*
 * Thresholds are the ones the sibling Aggressive Apparel theme uses, which are
 * in turn Google's "needs improvement" boundaries rather than the stricter
 * "good" ones. They are a floor that catches regressions, not a target — a
 * page sitting just inside them is not fast.
 *
 * Byte thresholds are intentionally looser than bin/ci/asset-budget.json:
 * these include WordPress core, plugins and ad creatives, none of which the
 * theme controls.
 */
const assertions = isReport
	? {}
	: {
			'categories:performance': ['warn', { minScore: 0.8 }],
			'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
			'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
			'total-blocking-time': ['error', { maxNumericValue: 300 }],
			'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
			'resource-summary:script:size': [
				'warn',
				{ maxNumericValue: 500 * 1024 },
			],
			'resource-summary:stylesheet:size': [
				'warn',
				{ maxNumericValue: 300 * 1024 },
			],
			'resource-summary:total:size': [
				'warn',
				{ maxNumericValue: 3 * 1024 * 1024 },
			],
			'resource-summary:total:count': ['warn', { maxNumericValue: 120 }],
		};

module.exports = {
	ci: {
		collect: {
			chromePath: process.env.CHROME_PATH,
			// Three runs in budget mode because a single Lighthouse run is noisy
			// enough to fail on nothing; the median is what gets asserted.
			numberOfRuns: isBudget ? 3 : 1,
			url: urls,
			settings: {
				/*
				 * --user-data-dir is not optional under WSL. Without it Chrome
				 * resolves a Windows temp path and Lighthouse creates literal
				 * directories named "C:\Users\...\lighthouse.NNNN" in the repo
				 * root — nine of them appeared on the first run, and Prettier
				 * then failed the build trying to format their contents.
				 */
				chromeFlags: [
					'--headless=new',
					'--disable-gpu',
					`--user-data-dir=${path.join(__dirname, '.cache/lighthouse-profile')}`,
				].join(' '),
				maxWaitForLoad: 45000,
				onlyCategories: ['performance'],
				preset: 'desktop',
			},
		},
		assert: {
			assertions,
			includePassedAssertions: isBudget,
		},
		upload: {
			target: 'filesystem',
			outputDir: `./.lighthouseci/reports/${mode}`,
			reportFilenamePattern:
				'%%HOSTNAME%%-%%PATHNAME%%-%%DATETIME%%.report.%%EXTENSION%%',
		},
	},
};

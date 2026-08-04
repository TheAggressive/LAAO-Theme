/**
 * Regenerates tests/e2e/fixtures/palette-baseline.json.
 *
 * Reads the palette slugs from theme.json, then asks a real browser what each
 * one resolves to. The values are recorded as the browser computes them rather
 * than converted here on purpose: the baseline should describe what a visitor
 * actually sees, and a conversion written in this script could be wrong in
 * exactly the same way a conversion written in theme.json is wrong.
 *
 * Run this ONLY to establish a new intended baseline — never to make a failing
 * test pass. If the palette test fails, either the colour changed by accident
 * (fix theme.json) or on purpose (regenerate, and the diff is the evidence).
 *
 * Usage: pnpm palette:baseline
 */

import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolvePaletteInPage } from './palette-probe.mjs';

const repositoryRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	'../..'
);

const baseUrl = process.env.WP_BASE_URL ?? 'http://localhost:9930';

const themeJson = JSON.parse(
	readFileSync(path.join(repositoryRoot, 'theme.json'), 'utf8')
);

const slugs = (themeJson.settings?.color?.palette ?? []).map(
	(entry) => entry.slug
);

if (slugs.length === 0) {
	console.error('No palette entries found in theme.json.');
	process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();

const response = await page.goto(baseUrl);

if (!response?.ok()) {
	console.error(
		`Could not load ${baseUrl} (status ${response?.status()}). Is wp-env running?`
	);
	await browser.close();
	process.exit(1);
}

const colors = await page.evaluate(resolvePaletteInPage, slugs);

await browser.close();

const declared = Object.fromEntries(
	(themeJson.settings?.color?.palette ?? []).map((entry) => [
		entry.slug,
		entry.color,
	])
);

const outputDirectory = path.join(repositoryRoot, 'tests/e2e/fixtures');
mkdirSync(outputDirectory, { recursive: true });

writeFileSync(
	path.join(outputDirectory, 'palette-baseline.json'),
	`${JSON.stringify(
		{
			generatedFrom: baseUrl,
			note: 'Browser-resolved rgb() for every theme.json palette entry. Regenerate with `pnpm palette:baseline` only when a colour change is intended.',
			declared,
			colors,
		},
		null,
		'\t'
	)}\n`
);

console.log(`Palette baseline written for ${slugs.length} colours:`);
for (const [slug, value] of Object.entries(colors)) {
	console.log(`  ${slug.padEnd(20)} ${declared[slug]}  ->  ${value}`);
}

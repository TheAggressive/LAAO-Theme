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
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolvePaletteInPage } from './palette-probe.mjs';
import {
	isIntentionallyTransparent,
	readDeclaredPalette,
	readThemeJson,
} from './theme-palette.mjs';
import { wpEnvUrl } from './wp-env-url.mjs';

const repositoryRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	'../..'
);

const baseUrl = wpEnvUrl();

const themeJson = readThemeJson();

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

const declared = readDeclaredPalette(themeJson);

const colors = await page.evaluate(resolvePaletteInPage, slugs);

await browser.close();

// A baseline is only meaningful if the palette actually rendered. Running this
// before `wp theme activate` — the exact window CI sits in — would otherwise
// record every colour as transparent and freeze that as the expected result.
const unresolved = Object.entries(colors).filter(
	([slug, value]) =>
		value.startsWith('UNPARSABLE') ||
		(/^rgba\(0, 0, 0, 0(\.0+)?\)$/.test(value) &&
			!isIntentionallyTransparent(declared[slug], themeJson))
);

if (unresolved.length > 0) {
	console.error(
		'Refusing to write a baseline: these palette colours did not resolve.'
	);
	console.error('Is the theme activated on the target site?\n');
	for (const [slug, value] of unresolved) {
		console.error(`  ${slug} -> ${value}`);
	}
	process.exit(1);
}

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
